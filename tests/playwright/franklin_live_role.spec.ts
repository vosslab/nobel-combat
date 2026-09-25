// Selector contract: dialog controls: src/index.html:94-110; cards/radios: src/ui/chooser.ts:267-346.
// Debug snapshots: src/playtest_probe.ts:59-80.
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../../src/progress/storage";
import { decodeProgress } from "../../src/progress/unlocks";

test.describe.configure({ mode: "serial" });

const FRANKLIN_UNLOCK_PROGRESS = JSON.stringify({
  version: 2,
  wonAs: ["warburg", "curie"],
  wins: 2,
});
const FRANKLIN_UNLOCKED_FIGHTER_COUNT = decodeProgress(FRANKLIN_UNLOCK_PROGRESS).unlockedSet.size;

type GamepadFixture = { mapping: string; axes: number[]; buttons: { pressed: boolean }[] };
type Fighter = {
  id: string;
  x: number;
  z: number;
  hp: number;
  wins: number;
  state: string;
  attackHeld: boolean;
};
type State = { fighters: Fighter[]; phase: string; round: number; winner: number | null };
type Trace = { ko: boolean; roundOver: boolean; roundTwo: boolean; pair: boolean };

const pad = (buttons: number[] = [], axes = [0, 0, 0, 0]): GamepadFixture => {
  const value = {
    mapping: "standard",
    axes,
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  for (const button of buttons) value.buttons[button] = { pressed: true };
  return value;
};

function liveUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
}

async function frames(page: Page, count = 6): Promise<void> {
  await page.evaluate(
    (remaining) =>
      new Promise<void>((resolve) => {
        const next = (): void => {
          if (--remaining === 0) resolve();
          else requestAnimationFrame(next);
        };
        requestAnimationFrame(next);
      }),
    count,
  );
}

async function state(page: Page): Promise<State> {
  return page.evaluate(() => {
    const current = (
      window as typeof window & { __fightSnapshot?: () => State }
    ).__fightSnapshot?.();
    if (!current) throw new Error("Production match snapshot was unavailable.");
    return current;
  });
}

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const current = (
      window as typeof window & { __fightSnapshot?: () => { rigs?: unknown[] } }
    ).__fightSnapshot?.();
    return current?.rigs?.length === 2;
  });
}

async function seedAndOpen(
  page: Page,
  baseURL: string,
  seed: number,
  gamepad = false,
): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript((initialSeed) => {
    let value = initialSeed >>> 0;
    Object.defineProperty(Math, "random", {
      configurable: true,
      value: (): number => (value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0) / 2 ** 32,
    });
  }, seed);
  if (gamepad) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => {
          const serialized = document.documentElement.dataset.franklinGamepad;
          return serialized ? [JSON.parse(serialized) as unknown] : [];
        },
      });
    });
  }
  await page.addInitScript(({ key, progress }) => localStorage.setItem(key, progress), {
    key: PROGRESS_STORAGE_KEY,
    progress: FRANKLIN_UNLOCK_PROGRESS,
  });
  await page.goto(liveUrl(baseURL));
  await ready(page);
  return errors;
}

async function setPad(page: Page, value: GamepadFixture | null): Promise<void> {
  await page.evaluate((fixture) => {
    if (fixture) document.documentElement.dataset.franklinGamepad = JSON.stringify(fixture);
    else delete document.documentElement.dataset.franklinGamepad;
  }, value);
}

function observe(trace: Trace, current: State): void {
  trace.ko ||= current.fighters.some((fighter) => fighter.hp === 0);
  trace.roundOver ||= current.phase === "roundOver";
  trace.roundTwo ||= current.round >= 2;
  trace.pair &&= current.fighters[0]?.id === "franklin" && current.fighters[1]?.id === "warburg";
}

async function expectCleanFranklinRound(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const current = await state(page);
      return {
        phase: current.phase,
        round: current.round,
        winner: current.winner,
        roles: current.fighters.map((fighter) => fighter.id),
        hp: current.fighters.map((fighter) => fighter.hp),
        wins: current.fighters.map((fighter) => fighter.wins),
      };
    })
    .toEqual({
      phase: "fight",
      round: 1,
      winner: null,
      roles: ["franklin", "warburg"],
      hp: [100, 100],
      wins: [0, 0],
    });
}

async function restartWithKeyboard(page: Page): Promise<void> {
  await page.keyboard.down("KeyR");
  await frames(page);
  await page.keyboard.up("KeyR");
  await frames(page);
}

async function completePlayerWin(page: Page): Promise<Trace> {
  const trace: Trace = { ko: false, roundOver: false, roundTwo: false, pair: true };
  const heldKeys = new Set<string>();
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const current = await state(page);
    observe(trace, current);
    if (current.phase === "matchOver") break;
    const [player, opponent] = current.fighters;
    if (!player || !opponent) throw new Error("Match did not expose two fighters.");
    const distance = Math.hypot(player.x - opponent.x, player.z - opponent.z);
    const canAct = ["idle", "move", "block"].includes(player.state);
    const block = ["light", "heavy"].includes(opponent.state) && canAct;
    const light = !block && distance <= 1.8 && canAct;
    const desired = {
      KeyA: distance > 1.8 && opponent.x < player.x,
      KeyD: distance > 1.8 && opponent.x > player.x,
      KeyW: distance > 1.8 && opponent.z > player.z,
      KeyS: distance > 1.8 && opponent.z < player.z,
      KeyJ: light,
      KeyK: false,
      KeyL: block,
    };
    for (const [key, pressed] of Object.entries(desired)) {
      if (pressed && !heldKeys.has(key)) {
        await page.keyboard.down(key);
        heldKeys.add(key);
      } else if (!pressed && heldKeys.has(key)) {
        await page.keyboard.up(key);
        heldKeys.delete(key);
      }
    }
    await page.waitForTimeout(70);
  }
  for (const key of heldKeys) await page.keyboard.up(key);
  const result = await state(page);
  observe(trace, result);
  expect(result).toMatchObject({ phase: "matchOver", winner: 0 });
  return trace;
}

async function completeAiWin(page: Page): Promise<Trace> {
  const trace: Trace = { ko: false, roundOver: false, roundTwo: false, pair: true };
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const current = await state(page);
    observe(trace, current);
    if (current.phase === "matchOver") break;
    await page.waitForTimeout(70);
  }
  const result = await state(page);
  observe(trace, result);
  expect(result).toMatchObject({ phase: "matchOver", winner: 1 });
  return trace;
}

test("keyboard starts durable Franklin and preserves the live role pair across player victory and both restarts", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(115_000);
  const errors = await seedAndOpen(page, baseURL!, 0x0f6d0001);
  await expect(page.getByRole("radio")).toHaveCount(FRANKLIN_UNLOCKED_FIGHTER_COUNT);
  const franklinChoice = page.getByRole("radio", { name: /Rosalind Franklin/ });
  for (
    let step = 0;
    step < FRANKLIN_UNLOCKED_FIGHTER_COUNT && !(await franklinChoice.isChecked());
    step++
  ) {
    await page.keyboard.press("ArrowLeft");
    await frames(page);
  }
  await expect(franklinChoice).toBeChecked();
  await page.keyboard.down("Enter");
  await frames(page);
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  expect(await state(page)).toMatchObject({
    phase: "fight",
    fighters: [{ id: "franklin", state: "idle", attackHeld: false }, { id: "warburg" }],
  });
  await page.keyboard.up("Enter");
  await restartWithKeyboard(page);
  await expectCleanFranklinRound(page);
  expect(await completePlayerWin(page)).toMatchObject({
    ko: true,
    roundOver: true,
    roundTwo: true,
    pair: true,
  });
  await restartWithKeyboard(page);
  await expectCleanFranklinRound(page);
  expect(errors).toEqual([]);
});

test("synthetic standard gamepad releases chooser confirmation, restarts Franklin, and permits a live Warburg AI victory", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(115_000);
  const errors = await seedAndOpen(page, baseURL!, 0x0f6d0002, true);
  const franklinChoice = page.getByRole("radio", { name: /Rosalind Franklin/ });
  for (
    let step = 0;
    step < FRANKLIN_UNLOCKED_FIGHTER_COUNT && !(await franklinChoice.isChecked());
    step++
  ) {
    await setPad(page, pad([], [-1, 0, 0, 0]));
    await frames(page);
    await setPad(page, null);
    await frames(page);
  }
  await expect(franklinChoice).toBeChecked();
  await setPad(page, pad([9]));
  await frames(page);
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  expect(await state(page)).toMatchObject({
    phase: "fight",
    fighters: [{ id: "franklin", state: "idle", attackHeld: false }, { id: "warburg" }],
  });
  await setPad(page, null);
  await frames(page);
  await setPad(page, pad([0]));
  await expect.poll(async () => (await state(page)).fighters[0]?.state).toBe("light");
  await setPad(page, pad([9]));
  await frames(page);
  await setPad(page, null);
  await expectCleanFranklinRound(page);
  expect(await completeAiWin(page)).toMatchObject({
    ko: true,
    roundOver: true,
    roundTwo: true,
    pair: true,
  });
  await setPad(page, pad([9]));
  await frames(page);
  await setPad(page, null);
  await expectCleanFranklinRound(page);
  expect(errors).toEqual([]);
});

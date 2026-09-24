import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FRANKLIN_UNLOCK_STORAGE_KEY } from "../../src/franklin_storage";

test.describe.configure({ mode: "serial" });

type GamepadFixture = { mapping: string; axes: number[]; buttons: { pressed: boolean }[] };
type Fighter = {
  role: string;
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
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, wonRoles: ["warburg", "curie"] }));
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
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
  trace.pair &&=
    current.fighters[0]?.role === "franklin" && current.fighters[1]?.role === "warburg";
}

async function expectCleanFranklinRound(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const current = await state(page);
      return {
        phase: current.phase,
        round: current.round,
        winner: current.winner,
        roles: current.fighters.map((fighter) => fighter.role),
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
  const deadline = Date.now() + 90_000;
  let retry = 0;
  while (Date.now() < deadline) {
    const current = await state(page);
    observe(trace, current);
    if (current.phase === "matchOver") break;
    const [player, opponent] = current.fighters;
    if (!player || !opponent) throw new Error("Match did not expose two fighters.");
    const distance = Math.hypot(player.x - opponent.x, player.z - opponent.z);
    const block =
      ["light", "heavy"].includes(opponent.state) &&
      ["idle", "move", "block"].includes(player.state);
    const heavy =
      distance < 2.15 && ["idle", "move", "block"].includes(player.state) && retry-- <= 0;
    if (heavy) retry = 7;
    await page.keyboard.down(distance > 1.7 && opponent.x > player.x ? "KeyD" : "KeyA");
    await page.keyboard.down(distance > 1.7 && opponent.z > player.z ? "KeyS" : "KeyW");
    if (block) await page.keyboard.down("KeyL");
    else await page.keyboard.up("KeyL");
    if (heavy) await page.keyboard.down("KeyK");
    else await page.keyboard.up("KeyK");
    await page.waitForTimeout(70);
    for (const key of ["KeyA", "KeyD", "KeyW", "KeyS", "KeyK", "KeyL"]) await page.keyboard.up(key);
  }
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
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.keyboard.down("ArrowLeft");
  await frames(page);
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("Enter");
  await frames(page);
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  expect(await state(page)).toMatchObject({
    phase: "fight",
    fighters: [{ role: "franklin", state: "idle", attackHeld: false }, { role: "warburg" }],
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
  await setPad(page, pad([], [-1, 0, 0, 0]));
  await frames(page);
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await setPad(page, pad([9]));
  await frames(page);
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  expect(await state(page)).toMatchObject({
    phase: "fight",
    fighters: [{ role: "franklin", state: "idle", attackHeld: false }, { role: "warburg" }],
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

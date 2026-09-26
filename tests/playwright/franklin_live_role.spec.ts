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
  debug = false,
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
  const target = new URL(liveUrl(baseURL));
  if (debug) target.searchParams.set("debug", "1");
  await page.goto(target.toString());
  await ready(page);
  return errors;
}

async function setPad(page: Page, value: GamepadFixture | null): Promise<void> {
  await page.evaluate((fixture) => {
    if (fixture) document.documentElement.dataset.franklinGamepad = JSON.stringify(fixture);
    else delete document.documentElement.dataset.franklinGamepad;
  }, value);
}

async function expectCleanFranklinRound(page: Page, roles: readonly string[]): Promise<void> {
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
      roles,
      hp: [100, 100],
      wins: [0, 0],
    });
}

async function expectSelectedFranklinPair(page: Page): Promise<string[]> {
  const selectableIds = await page.evaluate<string[]>(() =>
    [...document.querySelectorAll<HTMLInputElement>('input[name="fighter"]')].map(
      (input) => input.value,
    ),
  );
  await page.waitForFunction((eligibleIds: string[]) => {
    const roles = (window as typeof window & { __fightSnapshot?: () => State })
      .__fightSnapshot?.()
      .fighters.map((fighter) => fighter.id);
    return (
      roles?.length === 2 &&
      roles[0] === "franklin" &&
      roles[1] !== "franklin" &&
      eligibleIds.includes(roles[1] ?? "")
    );
  }, selectableIds);
  return (await state(page)).fighters.map((fighter) => fighter.id);
}

async function restartWithUi(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Restart match" }).click();
}

async function openDebugChooser(page: Page): Promise<void> {
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: { forceMatch: (patch: { phase: "matchOver"; winner: 0 }) => unknown };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Debug harness was unavailable.");
    debug.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await page.getByRole("button", { name: "Change fighter" }).click();
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeVisible();
}

async function completeControlledFranklinWin(page: Page): Promise<void> {
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: {
          advance: (ticks: number, actions: unknown) => unknown;
          forceFighter: (index: 0 | 1, patch: Record<string, unknown>) => unknown;
          selectPlayer: (playerId: "franklin", opponentId: "warburg") => unknown;
        };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Debug harness was unavailable.");
    const neutral = { x: 0, z: 0, light: false, heavy: false, block: false, special: false };
    const light = { x: 0, z: 0, light: true, heavy: false, block: false, special: false };
    debug.selectPlayer("franklin", "warburg");
    debug.forceFighter(0, { x: -0.8, z: 0, hp: 100, state: "idle", ticks: 0, attackHeld: false });
    debug.forceFighter(1, { x: 0.8, z: 0, hp: 10, state: "idle", ticks: 0, attackHeld: false });
    debug.advance(8, [light, neutral]);
    debug.advance(120, [neutral, neutral]);
    debug.forceFighter(0, { x: -0.8, z: 0, state: "idle", ticks: 0, attackHeld: false });
    debug.forceFighter(1, { x: 0.8, z: 0, hp: 10, state: "idle", ticks: 0, attackHeld: false });
    debug.advance(8, [light, neutral]);
  });
  await expect
    .poll(async () => state(page))
    .toMatchObject({
      phase: "matchOver",
      winner: 0,
      fighters: [
        { id: "franklin", wins: 2 },
        { id: "warburg", wins: 0 },
      ],
    });
}

test("keyboard starts Franklin, controlled rounds complete, and UI restart preserves the role pair", async ({
  page,
  baseURL,
}) => {
  const errors = await seedAndOpen(page, baseURL!, 0x0f6d0001, false, true);
  await openDebugChooser(page);
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
  await expectSelectedFranklinPair(page);
  await page.keyboard.up("Enter");
  await completeControlledFranklinWin(page);
  await restartWithUi(page);
  await expectCleanFranklinRound(page, ["franklin", "warburg"]);
  expect(errors).toEqual([]);
});

test("synthetic standard gamepad releases chooser confirmation and restarts Franklin", async ({
  page,
  baseURL,
}) => {
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
  const selectedRoles = await expectSelectedFranklinPair(page);
  await setPad(page, null);
  await frames(page);
  await setPad(page, pad([0]));
  await expect.poll(async () => (await state(page)).fighters[0]?.state).toBe("light");
  await setPad(page, pad([9]));
  await frames(page);
  await setPad(page, null);
  await expectCleanFranklinRound(page, selectedRoles);
  expect(errors).toEqual([]);
});

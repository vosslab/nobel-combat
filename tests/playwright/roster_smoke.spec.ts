// Browser contract: chooser radios are rendered by `src/ui/chooser.ts`; the local playtest
// snapshots and combat driver live in `src/playtest_probe.ts` and `src/debug_harness.ts`.
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { PROGRESS_STORAGE_KEY } from "../../src/progress/storage";
import { ROSTER } from "../../src/roster/roster";
import { decodeProgress } from "../../src/progress/unlocks";

type FighterId = keyof typeof ROSTER;
type SpecialAction = {
  x: number;
  z: number;
  light: boolean;
  heavy: boolean;
  block: boolean;
  special: boolean;
};
type DebugFight = {
  selectPlayer(playerId: string, opponentId: string): unknown;
  forceFighter(index: 0 | 1, patch: { meter: number }): unknown;
  tick(actions: readonly [SpecialAction, SpecialAction]): unknown;
};
type ScreenPoint = { x: number; y: number; z: number };
type Snapshot = {
  fighters: { id: string; meter: number; specialTicks: number }[];
  rigs: { fighterId: string; disposed: boolean }[] | null;
  models:
    | {
        fighterId: FighterId;
        enabled: boolean;
        screenBounds: ScreenPoint[] | null;
      }[]
    | null;
};
type CanvasViewport = { width: number; height: number };

const ROSTER_IDS = Object.keys(ROSTER) as FighterId[];
const ALL_UNLOCKED_PROGRESS = JSON.stringify({
  version: 2,
  wonAs: ROSTER_IDS,
  wins: Number.MAX_SAFE_INTEGER,
});
const NEUTRAL: SpecialAction = {
  x: 0,
  z: 0,
  light: false,
  heavy: false,
  block: false,
  special: false,
};

function smokeOpponent(playerId: FighterId): FighterId {
  const opponentId = ROSTER_IDS.find((id) => id !== playerId);
  if (!opponentId) throw new Error("Roster smoke requires at least two fighters.");
  return opponentId;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => Snapshot }
    ).__fightSnapshot?.();
    if (!value) throw new Error("Roster smoke snapshot was unavailable.");
    return value;
  });
}

async function canvasViewport(page: Page): Promise<CanvasViewport> {
  return page.locator("#game").evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Game canvas was unavailable.");
    return { width: canvas.width, height: canvas.height };
  });
}

function expectPointInCanvas(
  fighterId: FighterId,
  pointName: string,
  point: ScreenPoint,
  viewport: CanvasViewport,
): void {
  const description = `${fighterId} ${pointName} (${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(3)})`;
  expect(
    Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z),
    `${description} must project to finite canvas coordinates`,
  ).toBe(true);
  expect(
    point.x,
    `${description} is outside the ${viewport.width}x${viewport.height} canvas`,
  ).toBeGreaterThanOrEqual(0);
  expect(
    point.x,
    `${description} is outside the ${viewport.width}x${viewport.height} canvas`,
  ).toBeLessThanOrEqual(viewport.width);
  expect(
    point.y,
    `${description} is outside the ${viewport.width}x${viewport.height} canvas`,
  ).toBeGreaterThanOrEqual(0);
  expect(
    point.y,
    `${description} is outside the ${viewport.width}x${viewport.height} canvas`,
  ).toBeLessThanOrEqual(viewport.height);
  expect(point.z, `${description} is behind the camera`).toBeGreaterThanOrEqual(0);
  expect(point.z, `${description} is beyond the camera depth range`).toBeLessThanOrEqual(1);
}

test("every registered fighter loads, releases a tier-three special, and renders a visible pair", async ({
  page,
  baseURL,
}) => {
  expect(decodeProgress(ALL_UNLOCKED_PROGRESS).unlockedSet).toEqual(new Set(ROSTER_IDS));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(({ key, progress }) => localStorage.setItem(key, progress), {
    key: PROGRESS_STORAGE_KEY,
    progress: ALL_UNLOCKED_PROGRESS,
  });
  const url = new URL(baseURL!);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await page.waitForFunction(() => {
    const globals = window as typeof window & {
      __fightDebug?: DebugFight;
      __fightSnapshot?: () => Snapshot;
    };
    return Boolean(globals.__fightDebug && globals.__fightSnapshot?.().rigs?.length === 2);
  });
  const viewport = await canvasViewport(page);

  for (const playerId of ROSTER_IDS) {
    const opponentId = smokeOpponent(playerId);
    await page.evaluate(
      ({ player, opponent, neutral }) => {
        const fight = (window as typeof window & { __fightDebug?: DebugFight }).__fightDebug;
        if (!fight) throw new Error("Roster smoke debug harness was unavailable.");
        fight.selectPlayer(player, opponent);
        fight.forceFighter(0, { meter: 300 });
        fight.tick([{ ...neutral, special: true }, neutral]);
      },
      { player: playerId, opponent: opponentId, neutral: NEUTRAL },
    );
    await page.waitForFunction(
      ({ player, opponent }) => {
        const value = (
          window as typeof window & { __fightSnapshot?: () => Snapshot }
        ).__fightSnapshot?.();
        return (
          value?.fighters[0]?.id === player &&
          value.fighters[1]?.id === opponent &&
          value.rigs?.length === 2 &&
          value.rigs.every((rig) => !rig.disposed)
        );
      },
      { player: playerId, opponent: opponentId },
    );
    const current = await snapshot(page);
    expect(
      current.fighters[0]?.specialTicks,
      `${playerId} did not release a tier-three special`,
    ).toBeGreaterThan(0);
    expect(current.fighters[0]?.meter, `${playerId} did not spend the tier-three meter`).toBe(0);
    expect(current.rigs?.map((rig) => rig.fighterId)).toEqual([playerId, opponentId]);
    expect(current.models?.every((model) => model.enabled)).toBe(true);
    expect(current.models?.map((model) => model.fighterId)).toEqual([playerId, opponentId]);
    for (const model of current.models ?? []) {
      if (!model.screenBounds)
        throw new Error(`${model.fighterId}: enabled mesh bounds were unavailable.`);
      expect(
        model.screenBounds,
        `${model.fighterId}: expected all eight model bounds corners`,
      ).toHaveLength(8);
      for (const [index, point] of model.screenBounds.entries()) {
        expectPointInCanvas(model.fighterId, `model bounds corner ${index + 1}`, point, viewport);
      }
    }
  }
  expect(errors).toEqual([]);
});

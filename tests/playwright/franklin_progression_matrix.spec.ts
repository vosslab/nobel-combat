import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../../src/progress/storage";
import { decodeProgress } from "../../src/progress/unlocks";

// Selector contract: the static chooser, unlock announcement, and restart controls come from
// src/index.html. Dynamic fighter radios and chooser behavior come from src/ui/chooser.ts.
// Update this test when those UI contracts change.
test.describe.configure({ mode: "serial" });

type Fighter = { id: string; x: number; z: number; hp: number; wins: number; state: string };
type Snapshot = { fighters: Fighter[]; phase: string; round: number; winner: number | null };

function unlockedFighterCount(record: string | null): number {
  return decodeProgress(record).unlockedSet.size;
}

async function expectUnlockedFighterCount(page: Page, record: string | null): Promise<void> {
  await expect(page.locator('input[name="fighter"]')).toHaveCount(unlockedFighterCount(record));
}

const liveUrl = (baseURL: string): string => {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
};

async function installDeterministicRandom(page: Page, seed: number): Promise<void> {
  await page.addInitScript((initialSeed) => {
    let state = initialSeed >>> 0;
    Object.defineProperty(Math, "random", {
      configurable: true,
      value: (): number => {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
        return state / 2 ** 32;
      },
    });
  }, seed);
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => Snapshot }
    ).__fightSnapshot?.();
    if (!value) throw new Error("Production match snapshot was unavailable.");
    return value;
  });
}

async function waitForReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => { rigs?: unknown[] } }
    ).__fightSnapshot?.();
    return value?.rigs?.length === 2;
  });
}

async function selectAndBegin(page: Page, id: "warburg" | "curie" = "warburg"): Promise<void> {
  const name = id === "warburg" ? /Otto Heinrich Warburg/ : /Marie Curie/;
  await page.getByRole("radio", { name }).check();
  await page.getByRole("button", { name: "Begin match" }).click();
}

async function completeLiveAiWin(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const current = await snapshot(page);
        return { phase: current.phase, winner: current.winner };
      },
      { timeout: 90_000 },
    )
    .toEqual({ phase: "matchOver", winner: 1 });
}

async function completeDebugWarburgWin(page: Page): Promise<void> {
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: {
          advance: (ticks: number, actions: unknown) => unknown;
          forceFighter: (index: 0 | 1, patch: Record<string, unknown>) => unknown;
        };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Deterministic match harness was unavailable.");
    const neutral = { x: 0, z: 0, light: false, heavy: false, block: false, special: false };
    const light = { x: 0, z: 0, light: true, heavy: false, block: false, special: false };
    debug.forceFighter(0, { x: -0.8, z: 0, hp: 100, state: "idle", ticks: 0, attackHeld: false });
    debug.forceFighter(1, { x: 0.8, z: 0, hp: 10, state: "idle", ticks: 0, attackHeld: false });
    debug.advance(8, [light, neutral]);
    debug.advance(120, [neutral, neutral]);
    debug.forceFighter(0, { x: -0.8, z: 0, state: "idle", ticks: 0, attackHeld: false });
    debug.forceFighter(1, { x: 0.8, z: 0, hp: 10, state: "idle", ticks: 0, attackHeld: false });
    debug.advance(8, [light, neutral]);
  });
}

async function storageRecord(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY);
}

function observeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

for (const initial of [null, '{"version":2,"wonAs":["curie"],"wins":1}'] as const) {
  test(`a live AI victory keeps ${initial === null ? "locked" : "partial"} Nobel progress unchanged`, async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(115_000);
    const errors = observeErrors(page);
    await installDeterministicRandom(page, initial === null ? 0x0f7b1001 : 0x0f7b1002);
    await page.addInitScript(
      ({ key, record }) => {
        if (record !== null) localStorage.setItem(key, record);
      },
      { key: PROGRESS_STORAGE_KEY, record: initial },
    );
    await page.goto(liveUrl(baseURL!));
    await waitForReady(page);
    await selectAndBegin(page);
    await completeLiveAiWin(page);

    expect(await storageRecord(page)).toBe(initial);
    await expectUnlockedFighterCount(page, initial);
    await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test("a repeated fighter win records the increased total after combat match victory", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(115_000);
  const errors = observeErrors(page);
  await installDeterministicRandom(page, 0x0f7b2001);
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{"version":2,"wonAs":["warburg"],"wins":1}');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- retains the storage receiver below.
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (writtenKey, value): void {
      if (writtenKey === key) {
        const count = Number(document.documentElement.dataset.progressionWrites ?? "0");
        document.documentElement.dataset.progressionWrites = String(count + 1);
      }
      originalSetItem.call(this, writtenKey, value);
    };
  }, PROGRESS_STORAGE_KEY);
  const url = new URL(baseURL!);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await waitForReady(page);
  await completeDebugWarburgWin(page);
  expect(await snapshot(page)).toMatchObject({ phase: "matchOver", winner: 0, round: 2 });

  expect(await storageRecord(page)).toBe('{"version":2,"wonAs":["warburg"],"wins":2}');
  expect(await page.evaluate(() => document.documentElement.dataset.progressionWrites ?? "0")).toBe(
    "1",
  );
  await expectUnlockedFighterCount(page, '{"version":2,"wonAs":["warburg"],"wins":2}');
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  expect(errors).toEqual([]);
});

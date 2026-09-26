// Selector contract: dialog controls: src/index.html:94-110; cards/radios: src/ui/chooser.ts:267-346.
// Progress hooks: src/main.ts:366-369; debug snapshots: src/playtest_probe.ts:59-80.
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../../src/progress/storage";
import { decodeProgress } from "../../src/progress/unlocks";
test.describe.configure({ mode: "serial" });
type SyntheticGamepad = {
  mapping: string;
  axes: number[];
  buttons: { pressed: boolean }[];
};
type FightSnapshot = {
  fighters: {
    id: string;
    x: number;
    z: number;
    hp: number;
    wins: number;
    state: string;
    attackHeld: boolean;
  }[];
  phase: string;
  round: number;
  input: { action: { light: boolean } };
};
type KeyboardAction = {
  x: number;
  z: number;
  light: boolean;
  heavy: boolean;
  block: boolean;
  special: boolean;
};
const FRANKLIN_UNLOCKED_RECORD = '{"version":2,"wonAs":["warburg","curie"],"wins":2}';
function unlockedFighterCount(record: string | null): number {
  return decodeProgress(record).unlockedSet.size;
}
async function expectUnlockedFighterCount(page: Page, record: string | null): Promise<void> {
  await expect(page.getByRole("radio")).toHaveCount(unlockedFighterCount(record));
}
async function openFighterChooser(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Change fighter" }).click();
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeVisible();
}
const pad = (axes: number[] = [0, 0, 0, 0], pressedButtons: number[] = []): SyntheticGamepad => {
  const gamepad: SyntheticGamepad = {
    mapping: "standard",
    axes,
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  for (const button of pressedButtons) gamepad.buttons[button] = { pressed: true };
  return gamepad;
};
function liveUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
}
async function installDeterministicRandom(page: Page, seed = 0x5eedc0de): Promise<void> {
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
async function installGamepadMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => {
        const serialized = document.documentElement.dataset.selectionGamepad;
        const gamepad: unknown = serialized ? JSON.parse(serialized) : undefined;
        return gamepad === undefined ? [] : [gamepad];
      },
    });
  });
}
async function setGamepad(page: Page, gamepad: SyntheticGamepad | null): Promise<void> {
  await page.evaluate((value) => {
    if (value === null) delete document.documentElement.dataset.selectionGamepad;
    else document.documentElement.dataset.selectionGamepad = JSON.stringify(value);
  }, gamepad);
}
async function snapshot(page: Page): Promise<FightSnapshot> {
  return page.evaluate(() => {
    const snapshot = (
      window as typeof window & { __fightSnapshot?: () => FightSnapshot }
    ).__fightSnapshot?.();
    if (!snapshot) throw new Error("Live selection snapshot was unavailable.");
    return snapshot;
  });
}
async function expectSelectedPair(page: Page, playerId: string): Promise<string[]> {
  const selectableIds = await page.evaluate<string[]>(() =>
    [...document.querySelectorAll<HTMLInputElement>('input[name="fighter"]')].map(
      (input) => input.value,
    ),
  );
  await page.waitForFunction(
    ({ selectedPlayer, eligibleIds }) => {
      const fighters = (
        window as typeof window & { __fightSnapshot?: () => FightSnapshot }
      ).__fightSnapshot?.().fighters;
      return (
        fighters?.length === 2 &&
        fighters[0]?.id === selectedPlayer &&
        fighters[1]?.id !== selectedPlayer &&
        eligibleIds.includes(fighters[1]?.id ?? "")
      );
    },
    { selectedPlayer: playerId, eligibleIds: selectableIds },
  );
  return (await snapshot(page)).fighters.map((fighter) => fighter.id);
}
async function waitForReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as typeof window & {
        __fightSnapshot?: () => { rigs?: unknown[] };
      }
    ).__fightSnapshot?.();
    return snapshot?.rigs?.length === 2;
  });
}
async function renderFrames(page: Page, count = 6): Promise<void> {
  await page.evaluate(
    (frames) =>
      new Promise<void>((resolve) => {
        let remaining = frames;
        const next = (): void => {
          remaining--;
          if (remaining === 0) resolve();
          else requestAnimationFrame(next);
        };
        requestAnimationFrame(next);
      }),
    count,
  );
}
async function setKeyboardAction(
  page: Page,
  action: KeyboardAction,
  heldKeys: Set<string>,
): Promise<void> {
  const keys: Record<string, boolean> = {
    KeyA: action.x < -0.2,
    KeyD: action.x > 0.2,
    KeyW: action.z < -0.2,
    KeyS: action.z > 0.2,
    KeyJ: action.light,
    KeyK: action.heavy,
    KeyL: action.block,
    KeyI: action.special,
  };
  for (const [key, pressed] of Object.entries(keys)) {
    if (pressed && !heldKeys.has(key)) {
      await page.keyboard.down(key);
      heldKeys.add(key);
    } else if (!pressed && heldKeys.has(key)) {
      await page.keyboard.up(key);
      heldKeys.delete(key);
    }
  }
}
async function completeLivePlayerWin(page: Page): Promise<void> {
  const heldKeys = new Set<string>();
  await page.getByRole("button", { name: "Begin match" }).click();
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const state = await snapshot(page);
    if (state.phase === "matchOver") break;
    const [player, opponent] = state.fighters;
    if (!player || !opponent) throw new Error("Live match did not expose both fighters.");
    const distance = Math.hypot(player.x - opponent.x, player.z - opponent.z);
    const heavyReach = player.id === "warburg" ? 2.4 : 2.15;
    const action: KeyboardAction = {
      x: 0,
      z: 0,
      light: false,
      heavy: false,
      block: false,
      special: false,
    };
    if (state.phase === "fight") {
      const canAct = ["idle", "move", "block"].includes(player.state);
      const shouldBlock = (opponent.state === "light" || opponent.state === "heavy") && canAct;
      if (shouldBlock) {
        action.block = true;
      } else if (distance <= heavyReach && canAct) {
        action.heavy = true;
      } else if (distance > heavyReach) {
        action.x = Math.sign(opponent.x - player.x);
        action.z = Math.sign(player.z - opponent.z);
      }
    }
    await setKeyboardAction(page, action, heldKeys);
    await page.waitForTimeout(70);
  }
  await setKeyboardAction(
    page,
    { x: 0, z: 0, light: false, heavy: false, block: false, special: false },
    heldKeys,
  );
  const result = await snapshot(page);
  expect(result).toMatchObject({ phase: "matchOver", winner: 0 });
}
async function selectAndCompleteLivePlayerWin(page: Page, id: "warburg" | "curie"): Promise<void> {
  const name = id === "warburg" ? /Otto Heinrich Warburg/ : /Marie Curie/;
  await page.getByRole("radio", { name }).check();
  await completeLivePlayerWin(page);
}
async function storedProgressRecord(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY);
}
async function injectProgress(page: Page): Promise<void> {
  await page.evaluate(() => {
    const probe = window as typeof window & {
      __fightSetProgress?: (value: unknown) => void;
    };
    if (!probe.__fightSetProgress) throw new Error("Progress probe was unavailable.");
    probe.__fightSetProgress({ version: 2, wonAs: ["warburg", "curie"], wins: 2 });
  });
}
async function commitProgress(page: Page, value: unknown): Promise<void> {
  await page.evaluate((committedValue) => {
    const probe = window as typeof window & {
      __fightCommitProgress?: (value: unknown) => void;
    };
    if (!probe.__fightCommitProgress) {
      throw new Error("Progress commit probe was unavailable.");
    }
    probe.__fightCommitProgress(committedValue);
  }, value);
}
test("denied startup storage fails closed while the starter roster remains playable", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    Storage.prototype.getItem = (): never => {
      throw new Error("startup storage denied");
    };
  });
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);
  await expectUnlockedFighterCount(page, null);
  await expect(page.getByText("Rosalind Franklin", { exact: true })).toHaveCount(0);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  await expectSelectedPair(page, "warburg");
  expect(errors).toEqual([]);
});
test("a post-startup storage write stays presentation-silent until F6B consumes it", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);
  await expectUnlockedFighterCount(page, null);
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ version: 2, wonAs: ["warburg", "curie"], wins: 2 }));
  }, PROGRESS_STORAGE_KEY);
  await renderFrames(page);
  await expectUnlockedFighterCount(page, null);
  await expect(page.getByText("Rosalind Franklin", { exact: true })).toHaveCount(0);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  expect(errors).toEqual([]);
});
test("debug forced match-over remains a fixture and cannot progress Franklin", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript((storageKey) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- retains the storage receiver below.
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value): void {
      if (key === storageKey) {
        const count = Number(document.documentElement.dataset.franklinWrites ?? "0");
        document.documentElement.dataset.franklinWrites = String(count + 1);
      }
      originalSetItem.call(this, key, value);
    };
  }, PROGRESS_STORAGE_KEY);
  const url = new URL(baseURL!);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await waitForReady(page);
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: { forceMatch: (patch: unknown) => unknown };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Debug harness was unavailable.");
    debug.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await renderFrames(page);

  await openFighterChooser(page);
  await expectUnlockedFighterCount(page, null);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  expect(await page.evaluate(() => document.documentElement.dataset.franklinWrites ?? "0")).toBe(
    "0",
  );
  expect(errors).toEqual([]);
});

test("a live Warburg victory durably unlocks Franklin after a stored Curie victory", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(100_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await installDeterministicRandom(page);
  await page.addInitScript((storageKey) => {
    localStorage.setItem(storageKey, JSON.stringify({ version: 2, wonAs: ["curie"], wins: 1 }));
  }, PROGRESS_STORAGE_KEY);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);
  await expectUnlockedFighterCount(page, '{"version":2,"wonAs":["curie"],"wins":1}');
  await completeLivePlayerWin(page);

  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY))
    .toBe('{"version":2,"wonAs":["warburg","curie"],"wins":2}');
  await openFighterChooser(page);
  await expectUnlockedFighterCount(page, FRANKLIN_UNLOCKED_RECORD);
  await expect(page.locator("#franklin-unlock-announcement")).toContainText("Rosalind Franklin");
  expect(errors).toEqual([]);
});

for (const roles of [
  ["warburg", "curie"],
  ["curie", "warburg"],
] as const) {
  test(`live ${roles[0]} then ${roles[1]} wins unlock Franklin only after the durable second win`, async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(230_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await installDeterministicRandom(page);
    await page.goto(liveUrl(baseURL!));
    await waitForReady(page);

    await selectAndCompleteLivePlayerWin(page, roles[0]);
    await expect
      .poll(() => storedProgressRecord(page))
      .toBe(`{"version":2,"wonAs":["${roles[0]}"],"wins":1}`);
    await openFighterChooser(page);
    await expectUnlockedFighterCount(page, `{"version":2,"wonAs":["${roles[0]}"],"wins":1}`);
    await expect(page.locator("#franklin-unlock-announcement")).not.toContainText(
      "Rosalind Franklin",
    );

    await selectAndCompleteLivePlayerWin(page, roles[1]);

    await expect
      .poll(() => storedProgressRecord(page))
      .toBe('{"version":2,"wonAs":["warburg","curie"],"wins":2}');
    await openFighterChooser(page);
    await expectUnlockedFighterCount(page, FRANKLIN_UNLOCKED_RECORD);
    await expect(page.locator("#franklin-unlock-announcement")).toContainText("Rosalind Franklin");

    await page.reload();
    await waitForReady(page);
    await expectUnlockedFighterCount(page, FRANKLIN_UNLOCKED_RECORD);
    await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeVisible();
    await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test("a denied durable write preserves a valid partial record and keeps Franklin locked", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(115_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await installDeterministicRandom(page);
  await page.addInitScript((storageKey) => {
    localStorage.setItem(storageKey, '{"version":2,"wonAs":["curie"],"wins":1}');
    Storage.prototype.setItem = function (key): never {
      if (key === storageKey) throw new Error("Franklin storage write denied");
      throw new Error("unexpected storage write");
    };
  }, PROGRESS_STORAGE_KEY);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  await expectUnlockedFighterCount(page, '{"version":2,"wonAs":["curie"],"wins":1}');
  await completeLivePlayerWin(page);

  await expect
    .poll(() => storedProgressRecord(page))
    .toBe('{"version":2,"wonAs":["curie"],"wins":1}');
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  await openFighterChooser(page);
  await expectUnlockedFighterCount(page, '{"version":2,"wonAs":["curie"],"wins":1}');
  expect(errors).toEqual([]);
});

test("chooser pauses the live simulation, keeps focus contained, and confirms its selected fighter", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  await expect(dialog).toBeVisible();
  const selectedId = await page.locator('input[name="fighter"]:checked').inputValue();
  const selectableIds = await page
    .locator('input[name="fighter"]')
    .evaluateAll((radios) => radios.map((radio) => (radio as HTMLInputElement).value));
  const selectedIndex = selectableIds.indexOf(selectedId);
  const nextId = selectableIds[(selectedIndex + 1) % selectableIds.length]!;
  await expect(page.getByRole("button", { name: "Begin match" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe(`select-${selectedId}`);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent))
    .toContain("Read about");
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("start-match");
  await page.keyboard.press("Tab");
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe(`select-${selectedId}`);
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("start-match");
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent))
    .toContain("Read about");
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe(`select-${selectedId}`);
  await page.locator("#restart").focus();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).not.toBe("restart");

  const before = await snapshot(page);
  await page.waitForTimeout(300);
  const paused = await snapshot(page);
  expect(paused.fighters).toEqual(before.fighters);

  await page.keyboard.down("ArrowRight");
  await renderFrames(page);
  await expect(page.locator('input[name="fighter"]:checked')).toHaveValue(nextId);
  await renderFrames(page);
  await expect(page.locator('input[name="fighter"]:checked')).toHaveValue(nextId);
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "ArrowRight",
        key: "ArrowRight",
        repeat: true,
      }),
    );
  });
  await renderFrames(page);
  await expect(dialog).toBeVisible();
  await expect(page.locator('input[name="fighter"]:checked')).toHaveValue(nextId);
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(`select-${nextId}`);
  await expect(page.locator("#player-move-help")).toContainText("WASD move");
  await expect(page.locator("#player-move-help")).toContainText("P/Space pause");
  await expect(page.locator("#player-move-help")).toContainText("R restart");
  await expect(page.locator("#gamepad-move-help")).toContainText("left stick/D-pad move");
  await expect(page.locator("#gamepad-move-help")).toContainText("right stick view");
  await expect(page.locator("#gamepad-move-help")).toContainText("Start restart");

  await page.keyboard.down("Enter");
  await renderFrames(page);
  await expect(dialog).toBeHidden();
  const selectedPair = await expectSelectedPair(page, nextId);
  await renderFrames(page);
  expect((await snapshot(page)).fighters.map((fighter) => fighter.id)).toEqual(selectedPair);
  await page.keyboard.up("Enter");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("game");
  expect(errors).toEqual([]);
});

test("validated local unlock adds the selectable Franklin choice after denied startup storage", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    Storage.prototype.getItem = (): never => {
      throw new Error("startup storage denied");
    };
    Storage.prototype.setItem = (): never => {
      throw new Error("storage writes denied");
    };
  });
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  await expectUnlockedFighterCount(page, null);
  await expect(page.getByText("Rosalind Franklin", { exact: true })).toHaveCount(0);
  await expect(page.locator('[value="franklin"]')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .some((entry) => entry.name.toLowerCase().includes("franklin")),
    ),
  ).toBe(false);

  await page.evaluate(() => {
    const probe = window as typeof window & {
      __fightSetProgress?: (value: unknown) => void;
    };
    probe.__fightSetProgress?.({ version: 2, wonAs: ["franklin"], wins: 1 });
  });
  await expectUnlockedFighterCount(page, null);
  await injectProgress(page);
  await expectUnlockedFighterCount(page, FRANKLIN_UNLOCKED_RECORD);
  expect(
    await page
      .getByRole("radio")
      .evaluateAll((radios) => radios.map((radio) => (radio as HTMLInputElement).value)),
  ).toEqual([...decodeProgress(FRANKLIN_UNLOCKED_RECORD).unlockedSet]);
  const franklin = page.getByRole("radio", { name: /Rosalind Franklin/ });
  await franklin.check();
  await expect(franklin).toBeChecked();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expectSelectedPair(page, "franklin");
  expect(errors).toEqual([]);
});

test("synthetic standard gamepad selects and confirms the same complementary pair", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await installGamepadMock(page);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  await setGamepad(page, pad([1, 0, 0, 0]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [14]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [15]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [0]));
  await renderFrames(page);
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  await expectSelectedPair(page, "curie");
  expect((await snapshot(page)).fighters[0]).toMatchObject({ state: "idle", attackHeld: false });
  await setGamepad(page, null);
  await setGamepad(page, pad(undefined, [0]));
  await expect.poll(async () => (await snapshot(page)).input.action.light).toBe(true);
  await setGamepad(page, null);
  expect(errors).toEqual([]);
});

test("held Start confirms once without applying an immediate restart", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await installGamepadMock(page);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  await setGamepad(page, pad(undefined, [9]));
  await renderFrames(page);
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  const selectedPair = await expectSelectedPair(page, "warburg");
  const started = await snapshot(page);
  expect(started).toMatchObject({ phase: "fight", round: 1 });
  expect(started.fighters[0]).toMatchObject({
    id: "warburg",
    hp: 100,
    wins: 0,
    state: "idle",
    attackHeld: false,
  });
  expect(started.fighters[1]).toMatchObject({ hp: 100, wins: 0 });
  expect(started.fighters.map((fighter) => fighter.id)).toEqual(selectedPair);
  await renderFrames(page);
  const afterHeldStart = await snapshot(page);
  expect(afterHeldStart).toMatchObject({ phase: "fight", round: 1 });
  expect(afterHeldStart.fighters[0]).toMatchObject({ id: "warburg", wins: 0 });
  expect(afterHeldStart.fighters[1]).toMatchObject({ wins: 0 });
  expect(afterHeldStart.fighters.map((fighter) => fighter.id)).toEqual(
    started.fighters.map((fighter) => fighter.id),
  );
  expect(afterHeldStart.fighters[1]?.x).toBeLessThan(1.8);
  await setGamepad(page, null);
  expect(errors).toEqual([]);
});

test("a post-commit Franklin unlock announces once while an injected unlock stays silent", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  const announcement = page.locator("#franklin-unlock-announcement");
  await expect(announcement).toBeEmpty();
  await injectProgress(page);
  await expect(announcement).toBeEmpty();
  await page.evaluate(() => {
    const target = document.querySelector("#franklin-unlock-announcement");
    if (!target) throw new Error("Unlock announcement host was unavailable.");
    let mutations = 0;
    new MutationObserver(() => {
      mutations++;
      target.setAttribute("data-mutations", String(mutations));
    }).observe(target, { childList: true, characterData: true, subtree: true });
  });

  await commitProgress(page, { version: 2, wonAs: ["warburg"], wins: 1 });
  await expect(announcement).not.toContainText("Rosalind Franklin");
  await commitProgress(page, { version: 2, wonAs: ["warburg", "curie"], wins: 2 });
  await expect(announcement).toContainText("Rosalind Franklin");
  await expectUnlockedFighterCount(page, FRANKLIN_UNLOCKED_RECORD);
  await commitProgress(page, { version: 2, wonAs: ["warburg", "curie"], wins: 2 });
  await expect(announcement).toHaveAttribute("data-mutations", "1");
  expect(errors).toEqual([]);
});

test("Change fighter is match-over-only and returns through the paused chooser", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const url = new URL(baseURL!);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await waitForReady(page);

  const changeFighter = page.getByRole("button", { name: "Change fighter" });
  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  await expect(changeFighter).toBeHidden();
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: { forceMatch: (patch: unknown) => unknown };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Debug harness was unavailable.");
    debug.forceMatch({ phase: "roundOver", winner: 0 });
  });
  await renderFrames(page);
  await expect(changeFighter).toBeHidden();
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: { forceMatch: (patch: unknown) => unknown };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Debug harness was unavailable.");
    debug.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await renderFrames(page);
  await expect(changeFighter).toBeVisible();
  await changeFighter.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  const pausedBefore = await snapshot(page);
  await renderFrames(page);
  const pausedAfter = await snapshot(page);
  expect(pausedAfter.phase).toBe(pausedBefore.phase);
  expect(pausedAfter.round).toBe(pausedBefore.round);
  expect(pausedAfter.fighters).toEqual(pausedBefore.fighters);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.getByRole("radio", { name: /Marie Curie/ }).check();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expect(dialog).toBeHidden();
  await expectSelectedPair(page, "curie");
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: { forceMatch: (patch: unknown) => unknown };
      }
    ).__fightDebug;
    debug?.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await renderFrames(page);
  await changeFighter.click();
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expectSelectedPair(page, "curie");
  await injectProgress(page);
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: { forceMatch: (patch: unknown) => unknown };
      }
    ).__fightDebug;
    debug?.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await renderFrames(page);
  await changeFighter.click();
  await page.getByRole("radio", { name: /Rosalind Franklin/ }).check();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expectSelectedPair(page, "franklin");
  await page.evaluate(() => {
    const probe = window as typeof window & {
      __fightSetProgress?: (value: unknown) => void;
      __fightDebug?: { forceMatch: (patch: unknown) => unknown };
    };
    probe.__fightSetProgress?.({ version: 2, wonAs: [], wins: 0 });
    probe.__fightDebug?.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await renderFrames(page);
  await changeFighter.click();
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  expect(errors).toEqual([]);
});

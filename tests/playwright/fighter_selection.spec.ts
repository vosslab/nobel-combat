import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FRANKLIN_UNLOCK_STORAGE_KEY } from "../../src/franklin_storage";

test.describe.configure({ mode: "serial" });

type SyntheticGamepad = {
  mapping: string;
  axes: number[];
  buttons: { pressed: boolean }[];
};

type FightSnapshot = {
  fighters: {
    role: string;
    x: number;
    z: number;
    hp: number;
    wins: number;
    state: string;
    attackHeld: boolean;
  }[];
  phase: string;
  round: number;
};

type KeyboardAction = {
  x: number;
  z: number;
  light: boolean;
  heavy: boolean;
  block: boolean;
};

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

async function setKeyboardAction(page: Page, action: KeyboardAction): Promise<void> {
  const keys: Record<string, boolean> = {
    KeyA: action.x < -0.2,
    KeyD: action.x > 0.2,
    KeyW: action.z < -0.2,
    KeyS: action.z > 0.2,
    KeyJ: action.light,
    KeyK: action.heavy,
    KeyL: action.block,
  };
  for (const [key, pressed] of Object.entries(keys)) {
    if (pressed) await page.keyboard.down(key);
    else await page.keyboard.up(key);
  }
}

async function completeLivePlayerWin(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Begin match" }).click();
  let attackRetryLoops = 0;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (attackRetryLoops > 0) attackRetryLoops--;
    const state = await snapshot(page);
    if (state.phase === "matchOver") break;
    const [player, opponent] = state.fighters;
    if (!player || !opponent) throw new Error("Live match did not expose both fighters.");
    const distance = Math.hypot(player.x - opponent.x, player.z - opponent.z);
    const action: KeyboardAction = { x: 0, z: 0, light: false, heavy: false, block: false };
    if (state.phase === "fight") {
      if (distance > 1.7) {
        action.x = Math.sign(opponent.x - player.x);
        action.z = Math.sign(opponent.z - player.z);
      }
      if (
        (opponent.state === "light" || opponent.state === "heavy") &&
        ["idle", "move", "block"].includes(player.state)
      ) {
        action.block = true;
      } else if (
        distance < 2.15 &&
        ["idle", "move", "block"].includes(player.state) &&
        attackRetryLoops === 0
      ) {
        action.heavy = true;
        attackRetryLoops = 7;
      }
    }
    await setKeyboardAction(page, action);
    await page.waitForTimeout(70);
  }
  await setKeyboardAction(page, { x: 0, z: 0, light: false, heavy: false, block: false });
  const result = await snapshot(page);
  expect(result).toMatchObject({ phase: "matchOver", winner: 0 });
}

async function selectAndCompleteLivePlayerWin(
  page: Page,
  role: "warburg" | "curie",
): Promise<void> {
  const name = role === "warburg" ? /Otto Heinrich Warburg/ : /Marie Curie/;
  await page.getByRole("radio", { name }).check();
  await completeLivePlayerWin(page);
}

async function storedFranklinRecord(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), FRANKLIN_UNLOCK_STORAGE_KEY);
}

async function injectFranklinUnlock(page: Page): Promise<void> {
  await page.evaluate(() => {
    const probe = window as typeof window & {
      __fightSetFranklinUnlock?: (value: unknown) => void;
    };
    if (!probe.__fightSetFranklinUnlock) throw new Error("Franklin unlock probe was unavailable.");
    probe.__fightSetFranklinUnlock({ version: 1, wonRoles: ["warburg", "curie"] });
  });
}

async function commitFranklinUnlock(page: Page, value: unknown): Promise<void> {
  await page.evaluate((committedValue) => {
    const probe = window as typeof window & {
      __fightCommitFranklinUnlock?: (value: unknown) => void;
    };
    if (!probe.__fightCommitFranklinUnlock) {
      throw new Error("Franklin unlock commit probe was unavailable.");
    }
    probe.__fightCommitFranklinUnlock(committedValue);
  }, value);
}

test("Franklin chooser injection is unavailable outside local playtest mode", async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL!);
  expect(
    await page.evaluate(
      () =>
        (
          window as typeof window & {
            __fightSetFranklinUnlock?: unknown;
            __fightCommitFranklinUnlock?: unknown;
          }
        ).__fightSetFranklinUnlock === undefined &&
        (
          window as typeof window & {
            __fightCommitFranklinUnlock?: unknown;
          }
        ).__fightCommitFranklinUnlock === undefined,
    ),
  ).toBe(true);
  await expect(page.locator('[value="franklin"], [data-fighter="franklin"]')).toHaveCount(0);
});

test("denied startup storage fails closed while the two-role match remains playable", async ({
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

  await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
  await expect(page.getByText("Rosalind Franklin", { exact: true })).toHaveCount(0);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["warburg", "curie"]);
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

  await expect(page.getByRole("radio")).toHaveCount(2);
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, wonRoles: ["warburg", "curie"] }));
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
  await renderFrames(page);

  await expect(page.getByRole("radio")).toHaveCount(2);
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
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
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

  await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
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
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, wonRoles: ["curie"] }));
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);
  await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
  await completeLivePlayerWin(page);

  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), FRANKLIN_UNLOCK_STORAGE_KEY))
    .toBe('{"version":1,"wonRoles":["warburg","curie"]}');
  await expect(page.locator('input[name="fighter"]')).toHaveCount(3);
  await expect(page.locator("#franklin-unlock-announcement")).toHaveText(
    "Rosalind Franklin is now available.",
  );
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
      .poll(() => storedFranklinRecord(page))
      .toBe(`{"version":1,"wonRoles":["${roles[0]}"]}`);
    await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
    await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();

    await page.getByRole("button", { name: "Change fighter" }).click();
    await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeVisible();
    await selectAndCompleteLivePlayerWin(page, roles[1]);

    await expect
      .poll(() => storedFranklinRecord(page))
      .toBe('{"version":1,"wonRoles":["warburg","curie"]}');
    await expect(page.locator('input[name="fighter"]')).toHaveCount(3);
    await expect(page.locator("#franklin-unlock-announcement")).toHaveText(
      "Rosalind Franklin is now available.",
    );

    await page.reload();
    await waitForReady(page);
    await expect(page.getByRole("radio")).toHaveCount(3);
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
    localStorage.setItem(storageKey, '{"version":1,"wonRoles":["curie"]}');
    Storage.prototype.setItem = function (key): never {
      if (key === storageKey) throw new Error("Franklin storage write denied");
      throw new Error("unexpected storage write");
    };
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
  await completeLivePlayerWin(page);

  await expect.poll(() => storedFranklinRecord(page)).toBe('{"version":1,"wonRoles":["curie"]}');
  await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  await page.getByRole("button", { name: "Change fighter" }).click();
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("chooser pauses the live simulation, defaults accessibly, and confirms Curie", async ({
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
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await expect(page.getByRole("button", { name: "Begin match" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-warburg");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("start-match");
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-warburg");
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("start-match");
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-warburg");
  await page.locator("#restart").focus();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).not.toBe("restart");

  const before = await snapshot(page);
  await page.waitForTimeout(300);
  const paused = await snapshot(page);
  expect(paused.fighters).toEqual(before.fighters);

  await page.keyboard.down("ArrowRight");
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
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
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-curie");
  await expect(page.locator("#player-move-help")).toContainText("Separation Step");
  await expect(page.locator("#player-move-help")).not.toContainText("Oxygen Transfer");

  await page.keyboard.down("Enter");
  await renderFrames(page);
  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["curie", "warburg"]);
  await renderFrames(page);
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["curie", "warburg"]);
  await page.keyboard.up("Enter");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("game");
  expect(errors).toEqual([]);
});

test("validated local unlock adds and navigates the Franklin choice after denied startup storage", async ({
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
  await installGamepadMock(page);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  await expect(page.getByRole("radio")).toHaveCount(2);
  await expect(page.getByText("Rosalind Franklin", { exact: true })).toHaveCount(0);
  await expect(page.locator('[value="franklin"], [data-fighter="franklin"]')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .some((entry) => entry.name.toLowerCase().includes("franklin")),
    ),
  ).toBe(false);

  await page.evaluate(() => {
    const probe = window as typeof window & {
      __fightSetFranklinUnlock?: (value: unknown) => void;
    };
    probe.__fightSetFranklinUnlock?.({ version: 1, wonRoles: ["franklin"] });
  });
  await expect(page.getByRole("radio")).toHaveCount(2);
  await injectFranklinUnlock(page);
  await expect(page.getByRole("radio")).toHaveCount(3);
  expect(
    await page
      .getByRole("radio")
      .evaluateAll((radios) => radios.map((radio) => (radio as HTMLInputElement).value)),
  ).toEqual(["warburg", "curie", "franklin"]);
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-franklin");
  await expect(page.locator("#player-move-help")).toHaveText(
    "WASD move · J light · K heavy knockdown · L block · R restart",
  );
  await expect(page.locator("#gamepad-move-help")).toHaveText(
    "Gamepad: left stick/D-pad move · right stick view · south light · east heavy knockdown · right shoulder block · Start restart",
  );
  await expect(page.locator("#player-move-help")).not.toContainText("Separation Step");
  await expect(page.locator("#gamepad-move-help")).not.toContainText("Separation Step");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();

  await setGamepad(page, pad([-1, 0, 0, 0]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad([-1, 0, 0, 0]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad([-1, 0, 0, 0]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad([1, 0, 0, 0]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [14]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [14]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [15]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [15]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [14]));
  await renderFrames(page);
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await setGamepad(page, null);
  await renderFrames(page);

  const before = await snapshot(page);
  await renderFrames(page);
  const paused = await snapshot(page);
  expect(paused.phase).toBe(before.phase);
  expect(paused.fighters).toEqual(before.fighters);
  await setGamepad(page, pad(undefined, [0]));
  await renderFrames(page);
  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["franklin", "warburg"]);
  expect((await snapshot(page)).fighters[0]).toMatchObject({ state: "idle", attackHeld: false });
  await renderFrames(page);
  expect((await snapshot(page)).fighters[0]).toMatchObject({ state: "idle", attackHeld: false });
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [0]));
  await expect.poll(async () => (await snapshot(page)).fighters[0]?.state).toBe("light");
  await setGamepad(page, null);
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
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["curie", "warburg"]);
  expect((await snapshot(page)).fighters[0]).toMatchObject({ state: "idle", attackHeld: false });
  await renderFrames(page);
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["curie", "warburg"]);
  expect((await snapshot(page)).fighters[0]).toMatchObject({ state: "idle", attackHeld: false });
  await setGamepad(page, null);
  await renderFrames(page);
  await setGamepad(page, pad(undefined, [0]));
  await expect.poll(async () => (await snapshot(page)).fighters[0]?.state).toBe("light");
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
  expect(await snapshot(page)).toMatchObject({
    phase: "fight",
    round: 1,
    fighters: [
      { role: "warburg", hp: 100, wins: 0, state: "idle", attackHeld: false },
      { role: "curie", hp: 100, wins: 0 },
    ],
  });
  await renderFrames(page);
  expect(await snapshot(page)).toMatchObject({
    phase: "fight",
    round: 1,
    fighters: [
      { role: "warburg", hp: 100, wins: 0, state: "idle", attackHeld: false },
      { role: "curie", hp: 100, wins: 0 },
    ],
  });
  await expect.poll(async () => (await snapshot(page)).fighters[1]?.x).toBeLessThan(2.9);
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
  await injectFranklinUnlock(page);
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

  await commitFranklinUnlock(page, { version: 1, wonRoles: ["warburg"] });
  await expect(announcement).toBeEmpty();
  await commitFranklinUnlock(page, { version: 1, wonRoles: ["warburg", "curie"] });
  await expect(announcement).toHaveText("Rosalind Franklin is now available.");
  await expect(page.getByRole("radio")).toHaveCount(3);
  await commitFranklinUnlock(page, { version: 1, wonRoles: ["warburg", "curie"] });
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
  expect(await snapshot(page)).toEqual(pausedBefore);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.getByRole("radio", { name: /Marie Curie/ }).check();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["curie", "warburg"]);

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

  await injectFranklinUnlock(page);
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
  await expect
    .poll(async () => (await snapshot(page)).fighters.map((fighter) => fighter.role))
    .toEqual(["franklin", "warburg"]);

  await page.evaluate(() => {
    const probe = window as typeof window & {
      __fightSetFranklinUnlock?: (value: unknown) => void;
      __fightDebug?: { forceMatch: (patch: unknown) => unknown };
    };
    probe.__fightSetFranklinUnlock?.({ version: 1, wonRoles: [] });
    probe.__fightDebug?.forceMatch({ phase: "matchOver", winner: 0 });
  });
  await renderFrames(page);
  await changeFighter.click();
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  expect(errors).toEqual([]);
});

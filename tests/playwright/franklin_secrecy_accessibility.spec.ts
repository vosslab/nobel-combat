import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../../src/progress/storage";
import { decodeProgress } from "../../src/progress/unlocks";

// Selector contract: the static chooser and polite announcement host come from src/index.html.
// Dynamic fighter radios, chooser help, confirmation, focus, and navigation come from
// src/ui/chooser.ts. Update this test when those user-facing contracts change.
test.describe.configure({ mode: "serial" });

type GamepadFixture = { mapping: string; axes: number[]; buttons: { pressed: boolean }[] };
type Fighter = { id: string; x: number; z: number; hp: number; state: string };
type MatchState = { fighters: Fighter[]; phase: string; winner: number | null };

const COMPLETE_UNLOCK_RECORD = JSON.stringify({ version: 2, wonAs: ["warburg", "curie"], wins: 2 });

function unlockedFighterCount(record: string | null): number {
  return decodeProgress(record).unlockedSet.size;
}

const pad = (buttons: number[] = [], axes = [0, 0, 0, 0]): GamepadFixture => {
  const fixture: GamepadFixture = {
    mapping: "standard",
    axes,
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  for (const button of buttons) fixture.buttons[button] = { pressed: true };
  return fixture;
};

function liveUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
}

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function installUnlock(page: Page, record = COMPLETE_UNLOCK_RECORD): Promise<void> {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: PROGRESS_STORAGE_KEY,
    value: record,
  });
}

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

async function installGamepadMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => {
        const serialized = document.documentElement.dataset.f7aGamepad;
        return serialized ? [JSON.parse(serialized) as unknown] : [];
      },
    });
  });
}

async function setGamepad(page: Page, value: GamepadFixture | null): Promise<void> {
  await page.evaluate((fixture) => {
    if (fixture) document.documentElement.dataset.f7aGamepad = JSON.stringify(fixture);
    else delete document.documentElement.dataset.f7aGamepad;
  }, value);
}

async function renderFrames(page: Page, count = 6): Promise<void> {
  await page.evaluate(
    (frames) =>
      new Promise<void>((resolve) => {
        let remaining = frames;
        const next = (): void => {
          if (--remaining === 0) resolve();
          else requestAnimationFrame(next);
        };
        requestAnimationFrame(next);
      }),
    count,
  );
}

async function waitForReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as typeof window & { __fightSnapshot?: () => { rigs?: unknown[] } }
    ).__fightSnapshot?.();
    return snapshot?.rigs?.length === 2;
  });
}

async function matchState(page: Page): Promise<MatchState> {
  return page.evaluate(() => {
    const snapshot = (
      window as typeof window & { __fightSnapshot?: () => MatchState }
    ).__fightSnapshot?.();
    if (!snapshot) throw new Error("Match state probe was unavailable.");
    return snapshot;
  });
}

async function releaseNavigation(page: Page): Promise<void> {
  await setGamepad(page, null);
  await renderFrames(page);
}

async function completeLiveWarburgWin(page: Page): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const state = await matchState(page);
    if (state.phase === "matchOver") break;
    const [player, opponent] = state.fighters;
    if (!player || !opponent) throw new Error("Live match did not expose two fighters.");
    const distance = Math.hypot(player.x - opponent.x, player.z - opponent.z);
    const shouldBlock =
      (opponent.state === "light" || opponent.state === "heavy") &&
      ["idle", "move", "block"].includes(player.state);
    const shouldAttack = distance < 2.15 && ["idle", "move", "block"].includes(player.state);
    if (distance > 1.7) {
      await page.keyboard.down(opponent.x > player.x ? "KeyD" : "KeyA");
      await page.keyboard.down(opponent.z > player.z ? "KeyS" : "KeyW");
    }
    if (shouldBlock) await page.keyboard.down("KeyL");
    if (shouldAttack) await page.keyboard.down("KeyK");
    await renderFrames(page, 4);
    for (const key of ["KeyA", "KeyD", "KeyW", "KeyS", "KeyK", "KeyL"]) {
      await page.keyboard.up(key);
    }
  }
  expect(await matchState(page)).toMatchObject({ phase: "matchOver", winner: 0 });
}

test("a normal locked page has no Franklin chooser, presentation, request, or public test-hook leak", async ({
  page,
  baseURL,
}) => {
  const errors = collectBrowserErrors(page);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(baseURL!);
  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(unlockedFighterCount(null));
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await expect(page.getByText("Rosalind Franklin", { exact: true })).toHaveCount(0);
  await expect(page.locator('[value="franklin"]')).toHaveCount(0);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  expect(
    await page.evaluate(() => {
      const chooser = document.querySelector("#fighter-select");
      const globals = window as typeof window & {
        __fightSetProgress?: unknown;
        __fightCommitProgress?: unknown;
      };
      return (
        !document.body.innerText.includes("Rosalind Franklin") &&
        !chooser?.textContent?.includes("Rosalind Franklin") &&
        !chooser?.querySelector('[value="franklin"]') &&
        globals.__fightSetProgress === undefined &&
        globals.__fightCommitProgress === undefined
      );
    }),
  ).toBe(true);
  expect(requests.some((url) => url.toLowerCase().includes("franklin"))).toBe(false);
  expect(errors).toEqual([]);
});

test("Otto Heinrich Warburg keeps his full name in player and AI fight labels", async ({
  page,
  baseURL,
}) => {
  const errors = collectBrowserErrors(page);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  await expect(page.locator("#red-name")).toHaveText("OTTO HEINRICH WARBURG");
  await expect(page.locator("#red-status")).toHaveAttribute(
    "aria-label",
    "Otto Heinrich Warburg status",
  );
  await expect(
    page.getByRole("progressbar", { name: "Otto Heinrich Warburg health" }),
  ).toHaveAttribute("aria-valuenow", "100");
  const warburgMeter = page.locator(
    '[role="meter"][aria-label="Otto Heinrich Warburg special meter"]',
  );
  await expect(warburgMeter).toHaveAttribute("role", "meter");
  await expect(warburgMeter).toHaveAttribute("aria-label", "Otto Heinrich Warburg special meter");
  await expect(warburgMeter).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator("#red-special")).toHaveText("Next: Lactate Drive");

  await page.getByRole("radio", { name: /Marie Curie/ }).check();
  await page.getByRole("button", { name: "Begin match" }).click();
  await expect(page.locator("#blue-name")).toHaveText("OTTO HEINRICH WARBURG AI");
  await expect(page.locator("#blue-status")).toHaveAttribute(
    "aria-label",
    "Otto Heinrich Warburg AI status",
  );
  await expect(
    page.getByRole("progressbar", { name: "Otto Heinrich Warburg AI health" }),
  ).toHaveAttribute("aria-valuenow", "100");
  const warburgAiMeter = page.locator(
    '[role="meter"][aria-label="Otto Heinrich Warburg AI special meter"]',
  );
  await expect(warburgAiMeter).toHaveAttribute("role", "meter");
  await expect(warburgAiMeter).toHaveAttribute(
    "aria-label",
    "Otto Heinrich Warburg AI special meter",
  );
  await expect(warburgAiMeter).toHaveAttribute("aria-valuenow", "0");
  expect(errors).toEqual([]);
});

test("a durable unlock provides semantic chooser order, focus, wrapping, and a silent reload", async ({
  page,
  baseURL,
}) => {
  const errors = collectBrowserErrors(page);
  await installUnlock(page);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);

  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  const choices = page.locator("#fighter-choices");
  await expect(dialog).toHaveAttribute("aria-labelledby", "fighter-select-title");
  await expect(dialog).toHaveAttribute("aria-describedby", "fighter-select-help");
  await expect(choices.getByText("Player fighter", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(unlockedFighterCount(COMPLETE_UNLOCK_RECORD));
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toHaveAccessibleName(
    /Otto Heinrich Warburg/,
  );
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toHaveAccessibleName(
    /Marie Curie/,
  );
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toHaveAccessibleName(
    /Rosalind Franklin/,
  );
  await expect(page.locator("#fighter-select-help")).toContainText("Select");
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-warburg");

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-curie");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Barbara McClintock/ })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: /Barbara McClintock/ })).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("start-match");
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("select-franklin");

  await page.reload();
  await waitForReady(page);
  await expect(page.getByRole("radio")).toHaveCount(unlockedFighterCount(COMPLETE_UNLOCK_RECORD));
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  expect(errors).toEqual([]);
});

for (const confirmation of [
  { button: 0, label: "South" },
  { button: 9, label: "Start" },
] as const) {
  test(`synthetic ${confirmation.label} confirmation releases before combat input and preserves unlocked navigation parity`, async ({
    page,
    baseURL,
  }) => {
    const errors = collectBrowserErrors(page);
    await installUnlock(page);
    await installGamepadMock(page);
    await page.goto(liveUrl(baseURL!));
    await waitForReady(page);

    await setGamepad(page, pad([], [1, 0, 0, 0]));
    await renderFrames(page);
    await expect(page.getByRole("radio", { name: /Marie Curie/ })).toBeChecked();
    await releaseNavigation(page);
    await setGamepad(page, pad([], [1, 0, 0, 0]));
    await renderFrames(page);
    await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
    await releaseNavigation(page);
    await setGamepad(page, pad([], [1, 0, 0, 0]));
    await renderFrames(page);
    await expect(page.getByRole("radio", { name: /Barbara McClintock/ })).toBeChecked();
    await releaseNavigation(page);
    await setGamepad(page, pad([], [1, 0, 0, 0]));
    await renderFrames(page);
    await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
    await releaseNavigation(page);
    await setGamepad(page, pad([14]));
    await renderFrames(page);
    await expect(page.getByRole("radio", { name: /Barbara McClintock/ })).toBeChecked();
    await releaseNavigation(page);
    await setGamepad(page, pad([14]));
    await renderFrames(page);
    await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
    await releaseNavigation(page);

    await setGamepad(page, pad([confirmation.button]));
    await renderFrames(page);
    await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
    expect(await matchState(page)).toMatchObject({
      phase: "fight",
      fighters: [
        { id: "franklin", hp: 100, state: "idle" },
        { id: "warburg", hp: 100 },
      ],
    });
    await renderFrames(page);
    expect((await matchState(page)).fighters[0]).toMatchObject({ hp: 100, state: "idle" });
    await setGamepad(page, null);
    await renderFrames(page);
    await setGamepad(page, pad([0]));
    await expect.poll(async () => (await matchState(page)).fighters[0]?.state).toBe("light");
    await setGamepad(page, null);
    expect(errors).toEqual([]);
  });
}

test("a real second Nobel win produces one polite announcement after its durable write", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(115_000);
  const errors = collectBrowserErrors(page);
  await installDeterministicRandom(page, 0x0f7a0001);
  await installUnlock(page, JSON.stringify({ version: 2, wonAs: ["curie"], wins: 1 }));
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);
  const announcement = page.locator("#franklin-unlock-announcement");
  await expect(announcement).toHaveAttribute("role", "status");
  await expect(announcement).toHaveAttribute("aria-live", "polite");
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  await expect(announcement).toBeEmpty();
  await page.evaluate(() => {
    const target = document.querySelector("#franklin-unlock-announcement");
    if (!target) throw new Error("Unlock announcement host was unavailable.");
    let mutations = 0;
    new MutationObserver(() => mutations++).observe(target, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    Object.defineProperty(window, "__f7aAnnouncementMutations", { value: () => mutations });
  });

  await page.getByRole("button", { name: "Begin match" }).click();
  await completeLiveWarburgWin(page);

  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY))
    .toBe(COMPLETE_UNLOCK_RECORD);
  await expect(announcement).toHaveText("Rosalind Franklin is now available.");
  await expect(page.locator("#fighter-choices input[name='fighter']")).toHaveCount(
    unlockedFighterCount(COMPLETE_UNLOCK_RECORD),
  );
  await renderFrames(page, 12);
  expect(
    await page.evaluate(() =>
      (
        window as typeof window & { __f7aAnnouncementMutations?: () => number }
      ).__f7aAnnouncementMutations?.(),
    ),
  ).toBe(1);
  expect(errors).toEqual([]);
});

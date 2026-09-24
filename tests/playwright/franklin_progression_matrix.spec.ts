import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FRANKLIN_UNLOCK_STORAGE_KEY } from "../../src/franklin_storage";

// Selector contract: the unlock announcement, chooser radios, Begin match, and restart controls
// come from src/index.html:52-98. Dynamic Franklin radio rendering and chooser role behavior come
// from src/main.ts:190-225 and src/main.ts:296-360. Update this test when those UI contracts change.
test.describe.configure({ mode: "serial" });

type Fighter = { role: string; x: number; z: number; hp: number; wins: number; state: string };
type Snapshot = { fighters: Fighter[]; phase: string; round: number; winner: number | null };

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

async function frames(page: Page, count = 4): Promise<void> {
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

async function waitForReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => { rigs?: unknown[] } }
    ).__fightSnapshot?.();
    return value?.rigs?.length === 2;
  });
}

async function selectAndBegin(page: Page, role: "warburg" | "curie" = "warburg"): Promise<void> {
  const name = role === "warburg" ? /Otto Heinrich Warburg/ : /Marie Curie/;
  await page.getByRole("radio", { name }).check();
  await page.getByRole("button", { name: "Begin match" }).click();
}

async function setPlayerAction(
  page: Page,
  action: { x: number; z: number; heavy: boolean; block: boolean },
): Promise<void> {
  const keys: Record<string, boolean> = {
    KeyA: action.x < -0.2,
    KeyD: action.x > 0.2,
    KeyW: action.z < -0.2,
    KeyS: action.z > 0.2,
    KeyK: action.heavy,
    KeyL: action.block,
  };
  for (const [key, held] of Object.entries(keys)) {
    if (held) await page.keyboard.down(key);
    else await page.keyboard.up(key);
  }
}

async function clearPlayerAction(page: Page): Promise<void> {
  await setPlayerAction(page, { x: 0, z: 0, heavy: false, block: false });
}

async function completeLivePlayerWin(page: Page): Promise<void> {
  const deadline = Date.now() + 90_000;
  let retry = 0;
  while (Date.now() < deadline) {
    const current = await snapshot(page);
    if (current.phase === "matchOver") break;
    const [player, opponent] = current.fighters;
    if (!player || !opponent) throw new Error("Live match did not expose two fighters.");
    const distance = Math.hypot(player.x - opponent.x, player.z - opponent.z);
    const block =
      ["light", "heavy"].includes(opponent.state) &&
      ["idle", "move", "block"].includes(player.state);
    const heavy =
      distance < 2.15 && ["idle", "move", "block"].includes(player.state) && retry-- <= 0;
    if (heavy) retry = 7;
    await setPlayerAction(page, {
      x: distance > 1.7 ? Math.sign(opponent.x - player.x) : 0,
      z: distance > 1.7 ? Math.sign(opponent.z - player.z) : 0,
      heavy,
      block,
    });
    await frames(page);
  }
  await clearPlayerAction(page);
  expect(await snapshot(page)).toMatchObject({ phase: "matchOver", winner: 0 });
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

async function storageRecord(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), FRANKLIN_UNLOCK_STORAGE_KEY);
}

function observeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

for (const initial of [null, '{"version":1,"wonRoles":["curie"]}'] as const) {
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
      { key: FRANKLIN_UNLOCK_STORAGE_KEY, record: initial },
    );
    await page.goto(liveUrl(baseURL!));
    await waitForReady(page);
    await selectAndBegin(page);
    await completeLiveAiWin(page);

    expect(await storageRecord(page)).toBe(initial);
    await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
    await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test("a repeated live Nobel victory does not rewrite stored progress or announce Franklin", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(115_000);
  const errors = observeErrors(page);
  await installDeterministicRandom(page, 0x0f7b2001);
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{"version":1,"wonRoles":["warburg"]}');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- retains the storage receiver below.
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (writtenKey, value): void {
      if (writtenKey === key) {
        const count = Number(document.documentElement.dataset.progressionWrites ?? "0");
        document.documentElement.dataset.progressionWrites = String(count + 1);
      }
      originalSetItem.call(this, writtenKey, value);
    };
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
  await page.goto(liveUrl(baseURL!));
  await waitForReady(page);
  await selectAndBegin(page);
  await completeLivePlayerWin(page);

  expect(await storageRecord(page)).toBe('{"version":1,"wonRoles":["warburg"]}');
  expect(await page.evaluate(() => document.documentElement.dataset.progressionWrites ?? "0")).toBe(
    "0",
  );
  await expect(page.locator('input[name="fighter"]')).toHaveCount(2);
  await expect(page.locator("#franklin-unlock-announcement")).toBeEmpty();
  expect(errors).toEqual([]);
});

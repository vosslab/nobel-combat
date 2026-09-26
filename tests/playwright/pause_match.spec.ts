import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Selector contract: #pause-match in index.html is the visible pause control;
// src/playtest_probe.ts exposes __fightSnapshot and src/main.ts exposes
// __fightAnimationGroups only for local playtest routes.

type FightSnapshot = {
  fighters: { x: number; z: number; hp: number; state: string }[];
  view: { yaw: number; pitch: number; zoom: number };
  target: { y: number };
};

function liveUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
}

async function snapshot(page: Page): Promise<FightSnapshot> {
  return page.evaluate(() => {
    const current = (
      window as typeof window & { __fightSnapshot?: () => FightSnapshot }
    ).__fightSnapshot?.();
    if (!current) throw new Error("Live match snapshot was unavailable.");
    return current;
  });
}

async function waitForModels(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as typeof window & { __fightSnapshot?: () => { rigs?: unknown[] } }
    ).__fightSnapshot?.();
    return snapshot?.rigs?.length === 2;
  });
}

async function waitForRenderFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function animationGroupsPlaying(page: Page): Promise<boolean[]> {
  return page.evaluate(() => {
    const groups = (
      window as typeof window & {
        __fightAnimationGroups?: () => { isPlaying: boolean }[];
      }
    ).__fightAnimationGroups?.();
    if (!groups) throw new Error("Live fight animation groups were unavailable.");
    return groups.map((group) => group.isPlaying);
  });
}

test("Pause freezes combat while view controls remain active", async ({ page, baseURL }) => {
  await page.goto(liveUrl(baseURL!));
  const pause = page.locator("#pause-match");
  await expect(pause).toBeHidden();

  await page.getByRole("button", { name: "Begin match" }).click();
  await waitForModels(page);
  await expect(pause).toBeVisible();

  await page.keyboard.down("d");
  await expect.poll(async () => (await snapshot(page)).fighters[0]?.state).toBe("move");
  await page.keyboard.press("p");
  await expect(pause).toHaveAccessibleName("Resume match");
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  const frozen = await snapshot(page);
  await page.keyboard.down("e");
  await expect
    .poll(async () => (await snapshot(page)).view.yaw)
    .toBeGreaterThan(frozen.view.yaw + 0.01);
  await page.keyboard.up("e");
  await page.keyboard.down("BracketRight");
  await expect.poll(async () => (await snapshot(page)).view.zoom).toBeLessThan(0.85);
  await page.keyboard.up("BracketRight");
  const beforePan = (await snapshot(page)).target.y;
  await page.keyboard.down("Shift");
  await page.keyboard.down("PageUp");
  await expect.poll(async () => (await snapshot(page)).target.y).toBeGreaterThan(beforePan + 0.05);
  await page.keyboard.up("PageUp");
  await page.keyboard.up("Shift");
  await waitForRenderFrames(page);
  expect((await snapshot(page)).fighters).toEqual(frozen.fighters);

  await page.keyboard.press("Space");
  await expect(pause).toHaveAccessibleName("Pause match");
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  expect((await snapshot(page)).view.zoom).toBeGreaterThanOrEqual(0.85);
  await expect.poll(async () => (await snapshot(page)).target.y).toBeLessThan(0.8);
  await expect
    .poll(async () => (await snapshot(page)).fighters[0]?.x)
    .toBeGreaterThan(frozen.fighters[0]!.x);
  await page.keyboard.up("d");

  await pause.click();
  await expect(pause).toHaveAccessibleName("Resume match");
  const buttonPaused = await snapshot(page);
  await waitForRenderFrames(page);
  expect((await snapshot(page)).fighters).toEqual(buttonPaused.fighters);
  await pause.click();
  await expect(pause).toHaveAccessibleName("Pause match");
});

test("Pause applies to animation groups accepted after model loading", async ({
  page,
  baseURL,
}) => {
  let delayedLoadStarted = false;
  let releaseLoads: (() => void) | undefined;
  const allowLoads = new Promise<void>((resolve) => {
    releaseLoads = resolve;
  });
  await page.route("**/*.glb", async (route) => {
    delayedLoadStarted = true;
    await allowLoads;
    await route.continue();
  });

  await page.goto(liveUrl(baseURL!));
  await page.getByRole("button", { name: "Begin match" }).click();
  await expect.poll(() => delayedLoadStarted).toBe(true);
  await page.keyboard.press("p");
  await expect(page.locator("#pause-match")).toHaveAttribute("aria-pressed", "true");
  releaseLoads?.();
  await waitForModels(page);

  await expect
    .poll(async () => {
      const groups = await animationGroupsPlaying(page);
      return groups.length > 0 && groups.every((playing) => !playing);
    })
    .toBe(true);
});

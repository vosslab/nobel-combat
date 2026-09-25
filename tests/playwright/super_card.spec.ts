// Selector contract: card and live region: src/index.html:75-86.
// Lifecycle: src/ui/super_card.ts:20-39; debug snapshot: src/playtest_probe.ts:59-80.
import { expect, test } from "@playwright/test";

type DebugFight = {
  forceFighter: (index: 0 | 1, patch: { meter: number }) => unknown;
  tick: (actions: readonly [SpecialAction, SpecialAction]) => unknown;
};
type SpecialAction = {
  x: number;
  z: number;
  light: boolean;
  heavy: boolean;
  block: boolean;
  special: boolean;
};

const neutral: SpecialAction = {
  x: 0,
  z: 0,
  light: false,
  heavy: false,
  block: false,
  special: false,
};

test("tier-three specials show a nonblocking title card and announce only their name", async ({
  page,
  baseURL,
}) => {
  const url = new URL(baseURL!);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await page.waitForFunction(() => {
    const globals = window as typeof window & {
      __fightDebug?: DebugFight;
      __fightSnapshot?: () => { rigs?: unknown[] };
    };
    return Boolean(globals.__fightDebug && globals.__fightSnapshot?.().rigs?.length === 2);
  });

  await page.evaluate(
    ({ neutralAction }) => {
      const fight = (window as typeof window & { __fightDebug: DebugFight }).__fightDebug;
      fight.forceFighter(0, { meter: 300 });
      fight.tick([{ ...neutralAction, special: true }, neutralAction]);
    },
    { neutralAction: neutral },
  );

  const card = page.locator("#super-card");
  await expect(card).toBeVisible();
  await expect(page.locator("#super-card-fighter")).toHaveText("Otto Heinrich Warburg");
  await expect(page.locator("#super-card-special")).toHaveText("Oxygen Transfer Surge");
  await expect(page.locator("#super-card-caption")).toHaveText("One enzyme, one very long reach.");
  await expect(page.locator("#super-card-announcement")).toHaveText("Oxygen Transfer Surge");
  await expect(page.locator("#super-card-announcement")).toHaveAttribute("aria-live", "polite");
  await expect(card).toHaveAttribute("aria-hidden", "true");

  const simulationContinues = await page.evaluate(
    ({ neutralAction }) => {
      const fight = (window as typeof window & { __fightDebug: DebugFight }).__fightDebug;
      const before = (
        window as typeof window & { __fightSnapshot?: () => { fighters: { ticks: number }[] } }
      ).__fightSnapshot?.().fighters[0]?.ticks;
      fight.tick([neutralAction, neutralAction]);
      const probe = window as typeof window & {
        __fightSnapshot?: () => { fighters: { ticks: number }[] };
      };
      const after = probe.__fightSnapshot?.().fighters[0]?.ticks;
      return typeof before === "number" && typeof after === "number" && after < before;
    },
    { neutralAction: neutral },
  );
  expect(simulationContinues).toBe(true);
  await expect(card).toBeHidden();
});

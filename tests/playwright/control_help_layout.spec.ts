import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Selector contract: controls and match actions are in `src/index.html:112-120`;
// help layout and responsive rules are in `src/style.css:155-167,344-389`.
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

type Layout = {
  viewport: { width: number; height: number; documentWidth: number };
  help: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    clientWidth: number;
    scrollWidth: number;
  };
  text: { right: number; bottom: number };
  overlaps: string[];
};

async function layout(page: Page): Promise<Layout> {
  return page.evaluate(() => {
    const help = document.querySelector<HTMLElement>('[aria-label="Controls"]');
    if (!help) throw new Error("The controls help panel was unavailable.");
    const helpRect = help.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(help);
    const textRects = [...range.getClientRects()];
    const buttons = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .filter((button) => !button.hidden)
      .map((button) => ({ id: button.id, rect: button.getBoundingClientRect() }));
    const intersects = (left: DOMRect, right: DOMRect): boolean =>
      left.left < right.right &&
      left.right > right.left &&
      left.top < right.bottom &&
      left.bottom > right.top;
    const overlaps = buttons
      .filter(({ rect }) => intersects(helpRect, rect))
      .map(({ id }) => `Controls overlap #${id}`);
    for (let index = 0; index < buttons.length; index++) {
      const current = buttons[index];
      if (!current) continue;
      for (const other of buttons.slice(index + 1)) {
        if (intersects(current.rect, other.rect))
          overlaps.push(`#${current.id} overlaps #${other.id}`);
      }
    }
    return {
      viewport: {
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
      },
      help: {
        left: helpRect.left,
        right: helpRect.right,
        top: helpRect.top,
        bottom: helpRect.bottom,
        clientWidth: help.clientWidth,
        scrollWidth: help.scrollWidth,
      },
      text: {
        right: Math.max(...textRects.map((rect) => rect.right)),
        bottom: Math.max(...textRects.map((rect) => rect.bottom)),
      },
      overlaps,
    };
  });
}

async function assertLayout(
  page: Page,
  viewport: (typeof VIEWPORTS)[number],
  phase: string,
): Promise<void> {
  const current = await layout(page);
  const label = `${viewport.width}x${viewport.height} ${phase}`;
  expect(current.viewport.documentWidth, `${label}: page widened beyond the viewport`).toBe(
    current.viewport.width,
  );
  expect(
    current.help.scrollWidth,
    `${label}: control text overflows its panel`,
  ).toBeLessThanOrEqual(current.help.clientWidth);
  expect(
    current.text.right,
    `${label}: control text crosses the panel's right edge`,
  ).toBeLessThanOrEqual(current.help.right + 1);
  expect(
    current.text.bottom,
    `${label}: control text is clipped below the viewport`,
  ).toBeLessThanOrEqual(current.viewport.height);
  expect(current.overlaps, `${label}: controls and action buttons collide`).toEqual([]);
}

test("control help wraps clear of match actions across phone, tablet, and desktop", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    const url = new URL(baseURL!);
    url.searchParams.set("debug", "1");
    await page.goto(url.toString());
    await page.getByRole("complementary", { name: "Controls" }).waitFor();
    await page.waitForFunction(() => {
      const snapshot = (
        window as typeof window & { __fightSnapshot?: () => { rigs?: unknown[] } }
      ).__fightSnapshot?.();
      return snapshot?.rigs?.length === 2;
    });
    await expect(page.getByRole("button", { name: "Restart match" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change fighter" })).toBeHidden();
    await assertLayout(page, viewport, "fight");

    await page.evaluate(() => {
      const debug = (
        window as typeof window & {
          __fightDebug?: { forceMatch: (patch: { phase: string; winner: number }) => unknown };
        }
      ).__fightDebug;
      if (!debug) throw new Error("The local debug match fixture was unavailable.");
      debug.forceMatch({ phase: "matchOver", winner: 0 });
    });
    await expect(page.getByRole("button", { name: "Change fighter" })).toBeVisible();
    await assertLayout(page, viewport, "match over");
  }

  expect(browserErrors).toEqual([]);
});

// Selector contract: dialog, headings, help: src/index.html:94-110.
// Cards/radios: src/ui/chooser.ts:267-346; responsive grid: src/style.css:218,381.
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Gamepad = { mapping: string; axes: number[]; buttons: { pressed: boolean }[] };

function liveUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
}

function pad(buttons: number[]): Gamepad {
  return {
    mapping: "standard",
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 16 }, (_, index) => ({ pressed: buttons.includes(index) })),
  };
}

async function installGamepad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => {
        const data = document.documentElement.dataset.chooserGamepad;
        return data ? [JSON.parse(data) as unknown] : [];
      },
    });
  });
}

async function setGamepad(page: Page, gamepad: Gamepad | null): Promise<void> {
  await page.evaluate((value) => {
    if (value) document.documentElement.dataset.chooserGamepad = JSON.stringify(value);
    else delete document.documentElement.dataset.chooserGamepad;
  }, gamepad);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

test("chooser grid keeps its columns, Franklin secrecy, detail, and vertical navigation", async ({
  page,
  baseURL,
}) => {
  await installGamepad(page);
  await page.goto(liveUrl(baseURL!));
  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  await expect(dialog).toBeVisible();
  await expect(page.locator('[value="franklin"]')).toHaveCount(0);
  await expect(page.locator(".fighter-choice-locked")).toHaveCount(0);
  await expect(page.locator("#fighter-detail")).toContainText(
    "Nobel Prize in Physiology or Medicine 1931",
  );
  await expect(page.locator("#fighter-detail")).toContainText("Lactate Drive");
  await expect(
    page.getByRole("link", { name: "Read about Otto Heinrich Warburg" }),
  ).toHaveAttribute("target", "_blank");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Barbara McClintock/ })).toBeChecked();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
  await setGamepad(page, pad([13]));
  await expect(page.getByRole("radio", { name: /Barbara McClintock/ })).toBeChecked();
  await setGamepad(page, null);
  await setGamepad(page, pad([12]));
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
});

test("keyboard and gamepad open the focused Nobel link without confirming a match", async ({
  page,
  baseURL,
}) => {
  await installGamepad(page);
  await page.goto(liveUrl(baseURL!));
  const dialog = page.getByRole("dialog", { name: "Choose your fighter" });
  const link = page.getByRole("link", { name: "Read about Otto Heinrich Warburg" });
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  const keyboardPopup = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  await keyboardPopup;
  await expect(dialog).toBeVisible();

  await page.getByRole("radio", { name: /Otto Heinrich Warburg/ }).focus();
  await setGamepad(page, pad([3]));
  await expect(link).toBeFocused();
  await setGamepad(page, null);
  const gamepadPopup = page.waitForEvent("popup");
  await setGamepad(page, pad([0]));
  await gamepadPopup;
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("radio", { name: /Otto Heinrich Warburg/ })).toBeChecked();
});

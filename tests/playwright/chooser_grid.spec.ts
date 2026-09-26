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
  const doudnaLocked = page
    .locator(".fighter-choice-locked")
    .filter({ hasText: "Jennifer Doudna" });
  await expect(doudnaLocked).toHaveCount(1);
  await expect(page.getByRole("radio", { name: /Jennifer Doudna/ })).toHaveCount(0);
  await expect(page.locator("#fighter-detail")).toContainText(
    "Nobel Prize in Physiology or Medicine 1931",
  );
  await expect(page.locator("#fighter-detail")).toContainText("Lactate Drive");
  await expect(
    page.getByRole("link", { name: "Read about Otto Heinrich Warburg" }),
  ).toHaveAttribute("target", "_blank");
  const initialId = await page.locator('input[name="fighter"]:checked').inputValue();
  const initialBox = await page.locator(`label:has(input[value="${initialId}"])`).boundingBox();
  expect(initialBox).not.toBeNull();
  await page.keyboard.press("ArrowDown");
  const keyboardDownId = await page.locator('input[name="fighter"]:checked').inputValue();
  expect(keyboardDownId).not.toBe(initialId);
  const keyboardDownBox = await page
    .locator(`label:has(input[value="${keyboardDownId}"])`)
    .boundingBox();
  expect(keyboardDownBox).not.toBeNull();
  expect(keyboardDownBox!.y).toBeGreaterThan(initialBox!.y);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(`input[name="fighter"][value="${initialId}"]`)).toBeChecked();
  await setGamepad(page, pad([13]));
  const gamepadDownId = await page.locator('input[name="fighter"]:checked').inputValue();
  expect(gamepadDownId).not.toBe(initialId);
  const gamepadDownBox = await page
    .locator(`label:has(input[value="${gamepadDownId}"])`)
    .boundingBox();
  expect(gamepadDownBox).not.toBeNull();
  expect(gamepadDownBox!.y).toBeGreaterThan(initialBox!.y);
  await setGamepad(page, null);
  await setGamepad(page, pad([12]));
  await expect(page.locator(`input[name="fighter"][value="${initialId}"]`)).toBeChecked();
});

test("chooser cards load a face-first portrait for every rendered fighter", async ({
  page,
  baseURL,
}) => {
  await page.goto(liveUrl(baseURL!));
  const portraits = page.locator(".fighter-choice .fighter-portrait");
  await expect(portraits.first()).toBeVisible();
  await portraits.evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        if (!(image instanceof HTMLImageElement)) throw new Error("Expected a portrait image.");
        return image.decode();
      }),
    ),
  );
  const dimensions = await portraits.evaluateAll((images) =>
    images.map((image) => {
      if (!(image instanceof HTMLImageElement)) throw new Error("Expected a portrait image.");
      return { complete: image.complete, width: image.naturalWidth, height: image.naturalHeight };
    }),
  );
  expect(dimensions).not.toHaveLength(0);
  for (const image of dimensions) {
    expect(image.complete).toBe(true);
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);
  }
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

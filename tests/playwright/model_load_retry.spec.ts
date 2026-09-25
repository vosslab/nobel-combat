import { expect, test } from "@playwright/test";

type ModelSnapshot = {
  fighterId: string;
  enabled: boolean;
};

test("a failed fighter load can be retried for the selected pair", async ({ page, baseURL }) => {
  let allowOriginalModel = false;
  let abortedInitialLoad = false;
  await page.route(/mesh2motion_female_31\.glb$/, async (route) => {
    if (!allowOriginalModel) {
      abortedInitialLoad = true;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  const url = new URL(baseURL!);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await expect.poll(() => abortedInitialLoad).toBe(true);

  const retry = page.getByRole("button", { name: "Retry fighter load" });
  await expect(retry).toBeVisible();
  await expect(page.locator("#status")).toHaveText("Could not load fighters. Retry to continue.");
  allowOriginalModel = true;
  await retry.click();
  await expect(retry).toBeHidden();

  await page.waitForFunction(() => {
    const snapshot = (
      window as typeof window & {
        __fightSnapshot?: () => { models: ModelSnapshot[] | null };
      }
    ).__fightSnapshot?.();
    return snapshot?.models?.length === 2 && snapshot.models.every((model) => model.enabled);
  });
  expect(abortedInitialLoad).toBe(true);
});

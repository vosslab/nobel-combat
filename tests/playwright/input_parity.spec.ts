import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Selector contract: src/playtest_probe.ts exposes __fightSnapshot only on localhost
// with ?debug=1; src/input.ts maps these keyboard and standard-gamepad controls.
type InputFrame = {
  action: {
    x: number;
    z: number;
    light: boolean;
    heavy: boolean;
    block: boolean;
    special: boolean;
  };
  restart: boolean;
};

type SyntheticGamepad = {
  mapping: string;
  axes: number[];
  buttons: { pressed: boolean }[];
};

type InputCase = {
  label: string;
  keys: string[];
  pad: SyntheticGamepad;
};

const noPad = (): SyntheticGamepad => ({
  mapping: "standard",
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
});

const pad = (axes: number[] = [0, 0, 0, 0], pressedButtons: number[] = []): SyntheticGamepad => {
  const gamepad = noPad();
  gamepad.axes = axes;
  for (const button of pressedButtons) gamepad.buttons[button] = { pressed: true };
  return gamepad;
};

const actionCases: InputCase[] = [
  { label: "forward", keys: ["KeyW"], pad: pad([0, -1, 0, 0]) },
  { label: "backward", keys: ["KeyS"], pad: pad([0, 1, 0, 0]) },
  { label: "left", keys: ["KeyA"], pad: pad([-1, 0, 0, 0]) },
  { label: "right", keys: ["KeyD"], pad: pad([1, 0, 0, 0]) },
  { label: "forward-right diagonal", keys: ["KeyW", "KeyD"], pad: pad([1, -1, 0, 0]) },
  { label: "backward-left diagonal", keys: ["KeyS", "KeyA"], pad: pad([-1, 1, 0, 0]) },
  { label: "light", keys: ["KeyJ"], pad: pad(undefined, [0]) },
  { label: "heavy", keys: ["KeyK"], pad: pad(undefined, [1]) },
  { label: "special", keys: ["KeyI"], pad: pad(undefined, [3]) },
  { label: "block", keys: ["KeyL"], pad: pad(undefined, [5]) },
  { label: "restart", keys: ["KeyR"], pad: pad(undefined, [9]) },
  {
    label: "light-heavy-block",
    keys: ["KeyJ", "KeyK", "KeyL"],
    pad: pad(undefined, [0, 1, 5]),
  },
  {
    label: "opposing horizontal inputs",
    keys: ["KeyA", "KeyD"],
    pad: pad(undefined, [14, 15]),
  },
  {
    label: "opposing vertical inputs",
    keys: ["KeyW", "KeyS"],
    pad: pad(undefined, [12, 13]),
  },
];

function debugUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("debug", "1");
  return url.toString();
}

async function installGamepadMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => {
        const serialized = document.documentElement.dataset.inputParityPad;
        const gamepad: unknown = serialized ? JSON.parse(serialized) : undefined;
        return gamepad === undefined ? [] : [gamepad];
      },
    });
  });
}

async function setGamepad(page: Page, gamepad: SyntheticGamepad | null): Promise<void> {
  await page.evaluate((value) => {
    if (value === null) delete document.documentElement.dataset.inputParityPad;
    else document.documentElement.dataset.inputParityPad = JSON.stringify(value);
  }, gamepad);
}

async function snapshotInput(page: Page): Promise<InputFrame> {
  return page.evaluate(() => {
    const snapshot = (
      window as typeof window & {
        __fightSnapshot?: () => { input?: InputFrame };
      }
    ).__fightSnapshot?.();
    if (!snapshot?.input) throw new Error("The debug input frame was unavailable.");
    return snapshot.input;
  });
}

async function releaseKeys(page: Page, keys: readonly string[]): Promise<void> {
  for (const key of keys) await page.keyboard.up(key);
}

async function keyboardFrame(page: Page, keys: readonly string[]): Promise<InputFrame> {
  await setGamepad(page, null);
  for (const key of keys) await page.keyboard.down(key);
  const frame = await snapshotInput(page);
  await releaseKeys(page, keys);
  return frame;
}

async function gamepadFrame(page: Page, gamepad: SyntheticGamepad): Promise<InputFrame> {
  await setGamepad(page, gamepad);
  const frame = await snapshotInput(page);
  await setGamepad(page, null);
  return frame;
}

async function expectSameFrame(
  page: Page,
  input: InputCase,
): Promise<{ keyboard: InputFrame; gamepad: InputFrame }> {
  const keyboard = await keyboardFrame(page, input.keys);
  const gamepad = await gamepadFrame(page, input.pad);
  expect(gamepad, input.label).toEqual(keyboard);
  return { keyboard, gamepad };
}

async function cameraYaw(page: Page): Promise<number> {
  return page.evaluate(() => {
    const snapshot = (
      window as typeof window & {
        __fightSnapshot?: () => { view: { yaw: number } };
      }
    ).__fightSnapshot?.();
    if (!snapshot) throw new Error("The debug camera view was unavailable.");
    return snapshot.view.yaw;
  });
}

async function orbitCamera(page: Page, key: "KeyE" | "KeyQ"): Promise<void> {
  const initialYaw = await cameraYaw(page);
  await page.keyboard.down(key);
  await expect
    .poll(async () => Math.abs((await cameraYaw(page)) - initialYaw))
    .toBeGreaterThan(0.01);
  await page.keyboard.up(key);
}

test("keyboard and standard gamepad input frames remain identical after camera orbit", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await installGamepadMock(page);
  await page.goto(debugUrl(baseURL!));
  await page.waitForFunction(() => {
    const snapshot = (
      window as typeof window & {
        __fightSnapshot?: () => { rigs?: unknown[] };
      }
    ).__fightSnapshot?.();
    return snapshot?.rigs?.length === 2;
  });

  for (const input of actionCases) await expectSameFrame(page, input);

  await orbitCamera(page, "KeyE");

  for (const input of actionCases) await expectSameFrame(page, input);

  await orbitCamera(page, "KeyQ");

  for (const input of actionCases) await expectSameFrame(page, input);

  const rapidSwitches: InputCase[] = [
    { label: "rapid left", keys: ["KeyA"], pad: pad([-1, 0, 0, 0]) },
    { label: "rapid right", keys: ["KeyD"], pad: pad([1, 0, 0, 0]) },
    { label: "rapid forward", keys: ["KeyW"], pad: pad([0, -1, 0, 0]) },
    { label: "rapid backward", keys: ["KeyS"], pad: pad([0, 1, 0, 0]) },
  ];
  for (const input of rapidSwitches) await expectSameFrame(page, input);

  const nonstandard = pad([1, -1, 0, 0], [0, 1, 3, 5, 9]);
  nonstandard.mapping = "";
  expect(await gamepadFrame(page, nonstandard)).toEqual({
    action: { x: 0, z: 0, light: false, heavy: false, block: false, special: false },
    restart: false,
  });
  expect(errors).toEqual([]);
});

test("normal gameplay does not expose debug globals", async ({ page, baseURL }) => {
  await page.goto(baseURL!);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const globals = window as typeof window & {
          __fightDebug?: unknown;
          __fightSnapshot?: unknown;
        };
        return globals.__fightDebug === undefined && globals.__fightSnapshot === undefined;
      }),
    )
    .toBe(true);
});

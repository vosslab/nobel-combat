import type { Action } from "./match";

export type StandardGamepadInput = {
  mapping: string;
  axes: readonly number[];
  buttons: readonly { pressed: boolean }[];
};

export type InputFrame = {
  action: Action;
  restart: boolean;
};

/**
 * Level-triggered navigation for the two-fighter selection screen. The screen
 * owns edge detection so held controls can be given an appropriate repeat rate.
 */
export type SelectionInput = {
  previous: boolean;
  next: boolean;
  confirm: boolean;
};

const DEAD_ZONE = 0.2;

const pressed = (keys: ReadonlySet<string>, ...codes: readonly string[]): boolean =>
  codes.some((code) => keys.has(code));

const buttonPressed = (gamepad: StandardGamepadInput | null | undefined, index: number): boolean =>
  gamepad?.mapping === "standard" && gamepad.buttons[index]?.pressed === true;

const axis = (gamepad: StandardGamepadInput | null | undefined, index: number): number => {
  if (gamepad?.mapping !== "standard") return 0;
  const value = gamepad.axes[index];
  if (value === undefined || !Number.isFinite(value) || Math.abs(value) <= DEAD_ZONE) return 0;
  return Math.max(-1, Math.min(1, value));
};

const unit = (x: number, z: number): Pick<Action, "x" | "z"> => {
  const length = Math.hypot(x, z);
  if (!Number.isFinite(length) || length === 0) return { x: 0, z: 0 };
  const scale = length > 1 ? 1 / length : 1;
  return { x: x * scale, z: z * scale };
};

/**
 * Converts accepted keyboard controls and a standard-layout gamepad into
 * selection navigation. It deliberately has no persistent state.
 */
export function mapSelectionInput(
  keys: ReadonlySet<string>,
  gamepad: StandardGamepadInput | null | undefined,
): SelectionInput {
  const horizontal = axis(gamepad, 0);
  return {
    previous: pressed(keys, "ArrowLeft", "KeyA") || buttonPressed(gamepad, 14) || horizontal < 0,
    next: pressed(keys, "ArrowRight", "KeyD") || buttonPressed(gamepad, 15) || horizontal > 0,
    confirm:
      pressed(keys, "Enter", "Space") || buttonPressed(gamepad, 0) || buttonPressed(gamepad, 9),
  };
}

/**
 * Converts the accepted keyboard controls and a standard-layout gamepad into one
 * camera-relative game action. Restart is level-triggered; callers own edge detection.
 */
export function mapPlayerInput(
  keys: ReadonlySet<string>,
  gamepad: StandardGamepadInput | null | undefined,
  cameraYaw: number,
): InputFrame {
  const x =
    Number(pressed(keys, "KeyD", "ArrowRight")) -
    Number(pressed(keys, "KeyA", "ArrowLeft")) +
    axis(gamepad, 0) +
    Number(buttonPressed(gamepad, 15)) -
    Number(buttonPressed(gamepad, 14));
  const z =
    Number(pressed(keys, "KeyS", "ArrowDown")) -
    Number(pressed(keys, "KeyW", "ArrowUp")) +
    axis(gamepad, 1) +
    Number(buttonPressed(gamepad, 13)) -
    Number(buttonPressed(gamepad, 12));
  const yaw = Number.isFinite(cameraYaw) ? cameraYaw : 0;
  const planar = unit(x, z);
  const movement = unit(
    Math.cos(yaw) * planar.x + Math.sin(yaw) * planar.z,
    Math.sin(yaw) * planar.x - Math.cos(yaw) * planar.z,
  );
  return {
    action: {
      ...movement,
      light: pressed(keys, "KeyJ") || buttonPressed(gamepad, 0),
      heavy: pressed(keys, "KeyK") || buttonPressed(gamepad, 1),
      block: pressed(keys, "KeyL") || buttonPressed(gamepad, 5),
    },
    restart: pressed(keys, "KeyR") || buttonPressed(gamepad, 9),
  };
}

import assert from "node:assert/strict";
import { test } from "node:test";

import { mapPlayerInput, mapSelectionInput } from "../src/input.ts";

const keys = (...codes) => new Set(codes);
const pad = ({ axes = [], buttons = [], mapping = "standard" } = {}) => ({
  mapping,
  axes,
  buttons: buttons.map((pressed) => ({ pressed })),
});
const at = (...indices) =>
  Array.from({ length: Math.max(...indices) + 1 }, (_, index) => indices.includes(index));
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-10, message);

test("keyboard and standard gamepad controls have action parity", () => {
  const keyboard = mapPlayerInput(keys("KeyD", "KeyJ", "KeyK", "KeyL", "KeyR"), null, 0);
  const gamepad = mapPlayerInput(new Set(), pad({ axes: [1, 0], buttons: at(0, 1, 5, 9) }), 0);
  assert.deepEqual(gamepad, keyboard);
  assert.deepEqual(
    mapPlayerInput(keys("KeyW"), null, 0).action,
    mapPlayerInput(new Set(), pad({ axes: [0, -1] }), 0).action,
  );
  assert.deepEqual(
    mapPlayerInput(keys("KeyA"), null, 0).action,
    mapPlayerInput(new Set(), pad({ buttons: at(14) }), 0).action,
  );
  assert.deepEqual(
    mapPlayerInput(keys("KeyS"), null, 0).action,
    mapPlayerInput(new Set(), pad({ buttons: at(13) }), 0).action,
  );
  assert.deepEqual(
    mapPlayerInput(keys("KeyJ", "KeyK"), null, 0).action,
    mapPlayerInput(new Set(), pad({ buttons: at(0, 1) }), 0).action,
    "J+K and south+east must map to the same Lactate Drive chord",
  );
  assert.deepEqual(
    mapPlayerInput(keys("KeyJ", "KeyL"), null, 0).action,
    mapPlayerInput(new Set(), pad({ buttons: at(0, 5) }), 0).action,
    "J+L and south+right-shoulder must map to the same Aerobic Glycolysis chord",
  );
});

test("selection keyboard and standard gamepad navigation have parity", () => {
  assert.deepEqual(
    mapSelectionInput(keys("ArrowLeft", "Enter"), null),
    mapSelectionInput(new Set(), pad({ buttons: at(14, 9) })),
  );
  assert.deepEqual(
    mapSelectionInput(keys("KeyD", "Space"), null),
    mapSelectionInput(new Set(), pad({ axes: [1], buttons: at(0) })),
  );
  assert.deepEqual(
    mapSelectionInput(keys("KeyA"), null),
    mapSelectionInput(new Set(), pad({ axes: [-1] })),
  );
});

test("selection input ignores neutral, nonstandard, and invalid gamepad values", () => {
  assert.deepEqual(mapSelectionInput(new Set(), null), {
    previous: false,
    next: false,
    confirm: false,
  });
  assert.deepEqual(mapSelectionInput(new Set(), pad({ axes: [0.2] })), {
    previous: false,
    next: false,
    confirm: false,
  });
  assert.deepEqual(
    mapSelectionInput(new Set(), pad({ mapping: "", axes: [-1], buttons: at(0, 9, 14, 15) })),
    { previous: false, next: false, confirm: false },
  );
  assert.deepEqual(mapSelectionInput(new Set(), pad({ axes: [Infinity], buttons: [] })), {
    previous: false,
    next: false,
    confirm: false,
  });
  assert.deepEqual(mapSelectionInput(keys("KeyA", "Enter"), pad({ axes: [Number.NaN] })), {
    previous: true,
    next: false,
    confirm: true,
  });
});

test("movement is camera-relative, diagonal-normalized, and finite", () => {
  const diagonal = mapPlayerInput(keys("KeyW", "KeyD"), null, 0).action;
  near(Math.hypot(diagonal.x, diagonal.z), 1, "diagonal must not move faster");
  const rotated = mapPlayerInput(keys("KeyW"), null, Math.PI / 2).action;
  near(rotated.x, -1, "yaw rotates forward into world x");
  near(rotated.z, 0, "yaw rotates forward into world x");
  const invalid = mapPlayerInput(
    new Set(),
    pad({ axes: [Infinity, Number.NaN] }),
    Number.NaN,
  ).action;
  assert.deepEqual(invalid, { x: 0, z: 0, light: false, heavy: false, block: false });
});

test("opposing, rapid, and unsupported input is safe", () => {
  const opposing = mapPlayerInput(keys("KeyW", "KeyS", "KeyA", "KeyD"), null, 0).action;
  assert.equal(opposing.x, 0);
  assert.equal(opposing.z, 0);
  const mixedOpposing = mapPlayerInput(keys("KeyD"), pad({ axes: [-1, 0] }), 0).action;
  assert.equal(mixedOpposing.x, 0);
  assert.equal(mixedOpposing.z, 0);
  const unsupported = mapPlayerInput(
    keys("Escape", "KeyZ"),
    pad({ mapping: "", axes: [1, 1], buttons: at(0) }),
    0,
  );
  assert.deepEqual(unsupported, {
    action: { x: 0, z: 0, light: false, heavy: false, block: false },
    restart: false,
  });
  const rapid = ["KeyW", "KeyD", "KeyS", "KeyA", "KeyW"];
  for (const code of rapid) {
    const action = mapPlayerInput(keys(code), null, 0).action;
    assert.ok(Number.isFinite(action.x));
    assert.ok(Number.isFinite(action.z));
    assert.ok(Math.hypot(action.x, action.z) <= 1);
  }
});

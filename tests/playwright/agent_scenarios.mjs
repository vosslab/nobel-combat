import { chromium } from "playwright";

const NEUTRAL = Object.freeze({ x: 0, z: 0, light: false, heavy: false, block: false });
const RED = 0;
const BLUE = 1;

function readOption(name, fallback) {
  const position = process.argv.indexOf(name);
  if (position < 0) return fallback;
  const value = process.argv[position + 1];
  if (!value) throw new Error(`Missing value for ${name}`);
  return value;
}

function debugUrl() {
  const raw = readOption("--url", "http://127.0.0.1:4173/");
  const url = new URL(raw);
  url.searchParams.set("debug", "1");
  return url.toString();
}

function seededRandom(seed) {
  let value = Number(seed) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

function action(x = 0, z = 0, light = false, heavy = false, block = false) {
  return { x, z, light, heavy, block };
}

function distance(snapshot) {
  const [red, blue] = snapshot.fighters;
  return Math.hypot(red.x - blue.x, red.z - blue.z);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForFrame(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

async function snapshot(page) {
  await waitForFrame(page);
  const state = await page.evaluate(() => {
    const fight = window.__fightDebug;
    const current = window.__fightSnapshot?.() ?? fight?.snapshot?.();
    const get = (id) => document.querySelector(id);
    return {
      ...current,
      hud: {
        redHealth: get("#red-health")?.style.width ?? "",
        blueHealth: get("#blue-health")?.style.width ?? "",
        redWins: get("#red-wins")?.textContent ?? "",
        blueWins: get("#blue-wins")?.textContent ?? "",
        status: get("#status")?.textContent ?? "",
      },
    };
  });
  assert(state?.fighters?.length === 2, "Debug snapshot did not contain two fighters");
  return state;
}

async function advance(page, ticks, red = NEUTRAL, blue = NEUTRAL) {
  await page.evaluate(({ ticks, red, blue }) => window.__fightDebug.advance(ticks, [red, blue]), {
    ticks,
    red,
    blue,
  });
  return snapshot(page);
}

async function restart(page) {
  await page.evaluate(() => window.__fightDebug.restart());
  return snapshot(page);
}

async function forceFighter(page, index, patch) {
  await page.evaluate(({ index, patch }) => window.__fightDebug.forceFighter(index, patch), {
    index,
    patch,
  });
}

function assertValid(snapshot, label) {
  const states = new Set(["idle", "move", "light", "heavy", "block", "hit", "down", "getup"]);
  assert(["fight", "roundOver", "matchOver"].includes(snapshot.phase), `${label}: invalid phase`);
  assert(Number.isInteger(snapshot.round) && snapshot.round >= 1, `${label}: invalid round`);
  for (const fighter of snapshot.fighters) {
    assert(states.has(fighter.state), `${label}: invalid fighter state ${fighter.state}`);
    assert(
      Number.isFinite(fighter.x) && Number.isFinite(fighter.z),
      `${label}: nonfinite position`,
    );
    assert(Math.abs(fighter.x) <= 9.001 && Math.abs(fighter.z) <= 6.001, `${label}: outside arena`);
    assert(
      Number.isFinite(fighter.hp) && fighter.hp >= 0 && fighter.hp <= 100,
      `${label}: invalid health`,
    );
    assert(Number.isFinite(fighter.facing), `${label}: nonfinite facing`);
  }
  const camera = snapshot.camera;
  assert(
    camera && [camera.x, camera.y, camera.z].every(Number.isFinite),
    `${label}: nonfinite camera`,
  );
  const target = snapshot.target;
  assert(
    target && [target.x, target.y, target.z].every(Number.isFinite),
    `${label}: nonfinite camera target`,
  );
  const view = snapshot.view;
  assert(view && Number.isFinite(view.yaw), `${label}: nonfinite camera yaw`);
  assert(view.pitch >= 0.3 && view.pitch <= 0.85, `${label}: camera pitch escaped bounds`);
  assert(view.zoom >= 0.85 && view.zoom <= 1.5, `${label}: camera zoom escaped bounds`);
  assert(snapshot.rigs?.length === 2, `${label}: two rigged fighters were not ready`);
  for (const [index, rig] of snapshot.rigs.entries()) {
    assert(!rig.disposed, `${label}: rig ${index} was disposed`);
    assert(
      rig.activeClip === snapshot.fighters[index].state,
      `${label}: rig ${index} clip drifted from fighter state`,
    );
  }
  for (const point of snapshot.screen ?? []) {
    assert(
      [point.x, point.y, point.z].every(Number.isFinite),
      `${label}: nonfinite projected fighter`,
    );
    assert(
      point.x >= 8 && point.x <= 1272 && point.y >= 8 && point.y <= 792,
      `${label}: fighter violated screen margin`,
    );
    assert(point.z >= -0.01 && point.z <= 1.01, `${label}: fighter behind camera`);
  }
  for (const bounds of snapshot.screenBounds ?? []) {
    for (const point of [bounds.feet, bounds.head]) {
      assert(
        [point.x, point.y, point.z].every(Number.isFinite),
        `${label}: nonfinite fighter bounds`,
      );
      assert(
        point.x >= 8 && point.x <= 1272 && point.y >= 8 && point.y <= 792,
        `${label}: fighter bounds violated screen margin at (${point.x.toFixed(1)}, ${point.y.toFixed(1)}); view=${JSON.stringify(snapshot.view)} fighters=${JSON.stringify(snapshot.fighters.map(({ x, z }) => ({ x, z })))}`,
      );
      assert(point.z >= -0.01 && point.z <= 1.01, `${label}: fighter bounds behind camera`);
    }
  }
  const [red, blue] = snapshot.fighters;
  assert(snapshot.hud.redHealth === `${red.hp}%`, `${label}: red health HUD drift`);
  assert(snapshot.hud.blueHealth === `${blue.hp}%`, `${label}: blue health HUD drift`);
  assert(snapshot.hud.redWins.includes(String(red.wins)), `${label}: red wins HUD drift`);
  assert(snapshot.hud.blueWins.includes(String(blue.wins)), `${label}: blue wins HUD drift`);
}

async function runMovement(page, report) {
  await restart(page);
  await advance(page, 32, action(0, 1));
  let state = await advance(page, 75, action(1, 0));
  assert(state.fighters[RED].x > state.fighters[BLUE].x, "crossing sides failed");
  report.crossings++;
  await restart(page);
  await advance(page, 32, action(0, -1));
  state = await advance(page, 75, action(1, 0));
  assert(state.fighters[RED].x > 0, "opposite-direction crossing failed");
  report.crossings++;
  state = await advance(page, 90, action(0, 1), action(0, -1));
  assert(Math.abs(state.fighters[RED].z) > 2, "clockwise circle did not move red");
  await restart(page);
  state = await advance(page, 90, action(0, -1), action(0, 1));
  assert(Math.abs(state.fighters[RED].z) > 2, "counterclockwise circle did not move red");
  await restart(page);
  state = await advance(page, 180, action(-1, -1), action(1, 1));
  assert(
    Math.abs(state.fighters[RED].x) > 8.7 || Math.abs(state.fighters[RED].z) > 5.7,
    "arena edge was not reached",
  );
  assert(distance(state) > 10, "maximum practical separation was not reached");
  report.maxDistance = Math.max(report.maxDistance, distance(state));
  state = await advance(page, 220, action(1, 1), action(-1, -1));
  assert(distance(state) >= 1.09, "collision separation failed after approach");
  assertValid(state, "movement");
}

async function runCombat(page, report) {
  await restart(page);
  await forceFighter(page, RED, { x: -0.8, z: 0 });
  await forceFighter(page, BLUE, { x: 0.8, z: 0 });
  await advance(page, 1, action(0, 0, true));
  let state = await advance(page, 14);
  assert(
    state.fighters[BLUE].hp === 90 && state.fighters[BLUE].state === "hit",
    "light attack did not hit once",
  );
  report.states.add("light");
  report.states.add("hit");
  state = await advance(page, 30);
  assert(state.fighters[BLUE].state === "idle", "hit stun did not recover");
  await forceFighter(page, RED, { x: -0.8, z: 0, state: "idle", ticks: 0, attackHeld: false });
  await forceFighter(page, BLUE, { x: 0.8, z: 0, hp: 100, state: "idle", ticks: 0 });
  state = await advance(page, 1, action(0, 0, false, false, true));
  assert(state.fighters[RED].state === "block", "held block did not enter block state");
  await advance(page, 1, action(), action(0, 0, true));
  state = await advance(page, 14, action(0, 0, false, false, true), action());
  assert(
    state.fighters[RED].hp === 98 && state.fighters[RED].state === "block",
    "attack into block was incorrect",
  );
  report.states.add("block");
  await forceFighter(page, RED, { x: -0.8, z: 0, state: "idle", ticks: 0, attackHeld: false });
  await forceFighter(page, BLUE, { x: 0.8, z: 0, hp: 100, state: "idle", ticks: 0 });
  await advance(page, 1, action(0, 0, false, true));
  state = await advance(page, 14);
  assert(
    state.fighters[BLUE].hp === 76 && state.fighters[BLUE].state === "down",
    "heavy attack did not knock down",
  );
  report.states.add("heavy");
  report.states.add("down");
  state = await advance(page, 71);
  assert(state.fighters[BLUE].state === "getup", "knockdown did not transition to getup");
  state = await advance(page, 19);
  assert(state.fighters[BLUE].state === "idle", "getup did not recover");
  report.states.add("getup");
  assertValid(state, "combat");
}

function cameraDistance(before, after) {
  return Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z);
}

async function runCameraControls(page, report) {
  await restart(page);
  let before = await snapshot(page);
  await page.keyboard.down("KeyE");
  await page.waitForTimeout(350);
  await page.keyboard.up("KeyE");
  let state = await snapshot(page);
  assert(cameraDistance(before.camera, state.camera) > 0.1, "Q/E orbit did not move camera");
  assertValid(state, "keyboard orbit");
  before = state;
  const box = await page.locator("#game").boundingBox();
  assert(box, "game canvas has no bounds");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 180, box.y + box.height / 2 - 60);
  await page.mouse.up();
  state = await snapshot(page);
  assert(cameraDistance(before.camera, state.camera) > 0.1, "mouse orbit did not move camera");
  assertValid(state, "mouse orbit");
  before = state;
  await page.locator("#game").hover();
  await page.mouse.wheel(0, 220);
  await page.waitForTimeout(120);
  state = await snapshot(page);
  assert(cameraDistance(before.camera, state.camera) > 0.05, "wheel zoom did not move camera");
  assertValid(state, "wheel zoom");
  await page.evaluate(() => {
    window.__fightTestPad = { axes: [0, 0, 1, 0], buttons: [] };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__fightTestPad] });
  });
  before = state;
  await page.waitForTimeout(350);
  await page.evaluate(() => (window.__fightTestPad.axes[2] = 0));
  state = await snapshot(page);
  assert(
    cameraDistance(before.camera, state.camera) > 0.1,
    "right-stick orbit did not move camera",
  );
  assertValid(state, "gamepad orbit");
  report.maxCameraJump = Math.max(
    report.maxCameraJump,
    cameraDistance(before.camera, state.camera),
  );
}

async function koRoundMatchAndRestart(page, report) {
  await restart(page);
  for (let win = 0; win < 2; win++) {
    await forceFighter(page, RED, { x: -0.8, z: 0, state: "idle", ticks: 0, attackHeld: false });
    await forceFighter(page, BLUE, { x: 0.8, z: 0, hp: 24, state: "idle", ticks: 0 });
    await advance(page, 1, action(0, 0, false, true));
    const state = await advance(page, 14);
    if (win === 0) {
      assert(
        state.phase === "roundOver" && state.winner === RED,
        "KO did not start round transition",
      );
      report.states.add("roundOver");
      const next = await advance(page, 120);
      assert(
        next.phase === "fight" && next.round === 2 && next.fighters[RED].wins === 1,
        "round transition failed",
      );
    } else {
      assert(state.phase === "matchOver" && state.winner === RED, "second KO did not finish match");
      report.states.add("matchOver");
      assert(state.hud.status.includes("WINS THE MATCH"), "victory HUD drift");
    }
  }
  let state = await restart(page);
  assert(
    state.phase === "fight" &&
      state.round === 1 &&
      state.fighters.every((fighter) => fighter.hp === 100 && fighter.wins === 0),
    "restart after victory failed",
  );
  await forceFighter(page, RED, { hp: 50 });
  state = await restart(page);
  assert(state.fighters[RED].hp === 100, "restart during match failed");
  assertValid(state, "KO and restart");
}

async function runInputStress(page, report, seed) {
  await restart(page);
  for (const x of [1, -1, 1, -1, 0, 1, 0, -1]) {
    await advance(page, 1, action(x, -x), action(-x, x));
  }
  let state = await advance(page, 1, action(0, 0), action(0, 0));
  assertValid(state, "rapid and opposing inputs");
  const random = seededRandom(seed);
  let previousCamera;
  let maxJump = 0;
  for (let batch = 0; batch < 1200; batch++) {
    const red = action(
      random() * 2 - 1,
      random() * 2 - 1,
      random() > 0.94,
      random() > 0.97,
      random() > 0.91,
    );
    const blue = action(
      random() * 2 - 1,
      random() * 2 - 1,
      random() > 0.94,
      random() > 0.97,
      random() > 0.91,
    );
    state = await advance(page, 12, red, blue);
    assertValid(state, `random batch ${batch}`);
    if (previousCamera) {
      const jump = Math.hypot(
        state.camera.x - previousCamera.x,
        state.camera.y - previousCamera.y,
        state.camera.z - previousCamera.z,
      );
      maxJump = Math.max(maxJump, jump);
    }
    previousCamera = state.camera;
    if (state.phase === "matchOver") await restart(page);
  }
  state = await advance(page, 360);
  assertValid(state, "long idle");
  assert(
    state.fighters.every(
      (fighter) => !["light", "heavy", "hit", "down", "getup"].includes(fighter.state),
    ),
    "long idle left a combat state stuck",
  );
  // Each debug sample advances twelve simulation ticks at once. The camera
  // snaps to that synthetic state, so this bounds per-batch displacement;
  // live-frame visibility and tracking are checked by playtest_traversal.
  assert(maxJump <= 2.5, `random camera jump exceeded continuity budget: ${maxJump}`);
  report.maxCameraJump = maxJump;
  report.randomTicks = 1200 * 12 + 360;
}

async function main() {
  const seed = Number(readOption("--seed", "20260923"));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const report = {
    seed,
    crossings: 0,
    maxDistance: 0,
    maxCameraJump: 0,
    randomTicks: 0,
    states: new Set(),
  };
  try {
    await page.goto(debugUrl());
    await page.waitForFunction(() =>
      Boolean(
        window.__fightDebug?.advance &&
        window.__fightDebug?.snapshot &&
        window.__fightSnapshot?.().rigs?.length === 2,
      ),
    );
    await runMovement(page, report);
    await runCameraControls(page, report);
    await runCombat(page, report);
    await koRoundMatchAndRestart(page, report);
    await runInputStress(page, report, seed);
    assert(errors.length === 0, `browser console errors: ${errors.join(" | ")}`);
    const output = { ...report, states: [...report.states].sort(), errors };
    console.log(JSON.stringify(output));
  } finally {
    await browser.close();
  }
}

await main();

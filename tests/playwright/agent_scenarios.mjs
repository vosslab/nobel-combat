import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const NEUTRAL = Object.freeze({ x: 0, z: 0, light: false, heavy: false, block: false });
const RED = 0;
const BLUE = 1;
const RIG_POSITION_TOLERANCE = 0.0001;
const RIG_YAW_TOLERANCE = 0.0001;
const EVIDENCE_DIR = resolve(
  fileURLToPath(new URL("../../", import.meta.url)),
  "test-results/warburg-powers",
);

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
  // Debug advances simulation synchronously, while the render loop copies
  // authoritative fighter transforms to rig roots on animation frames. Two
  // frames guarantee this snapshot observes a post-draw transform.
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
        redName: get("#red-name")?.textContent ?? "",
        blueName: get("#blue-name")?.textContent ?? "",
        redStatusLabel: get("#red-status")?.getAttribute("aria-label") ?? "",
        blueStatusLabel: get("#blue-status")?.getAttribute("aria-label") ?? "",
        redHealthLabel: get("#red-health")?.parentElement?.getAttribute("aria-label") ?? "",
        blueHealthLabel: get("#blue-health")?.parentElement?.getAttribute("aria-label") ?? "",
        status: get("#status")?.textContent ?? "",
        moveName: get("#move-name")?.textContent ?? "",
        curieIndicatorHidden: get("#curie-indicator")?.hidden ?? true,
        curieName: get("#curie-indicator")?.textContent?.trim() ?? "",
        curieMeterWidth: get("#curie-meter-fill")?.style.width ?? "",
      },
    };
  });
  assert(state?.fighters?.length === 2, "Debug snapshot did not contain two fighters");
  return state;
}

function assertRenderedRigSync(snapshot, label) {
  for (const [index, fighter] of snapshot.fighters.entries()) {
    const rig = snapshot.rigs?.[index];
    assert(rig, `${label}: rig ${index} is missing`);
    assert(
      [rig.x, rig.y, rig.z, rig.yaw].every(Number.isFinite),
      `${label}: rig ${index} has a nonfinite root transform`,
    );
    assert(
      Math.abs(rig.x - fighter.x) <= RIG_POSITION_TOLERANCE &&
        Math.abs(rig.y) <= RIG_POSITION_TOLERANCE &&
        Math.abs(rig.z - fighter.z) <= RIG_POSITION_TOLERANCE,
      `${label}: rig ${index} root position drifted from fighter state`,
    );
    assert(
      Math.abs(rig.yaw - fighter.facing) <= RIG_YAW_TOLERANCE,
      `${label}: rig ${index} root yaw drifted from fighter facing`,
    );
  }
}

function assertCueAt(cue, fighter, label) {
  assert(cue?.enabled, `${label}: cue was not visible`);
  assert(
    Math.abs(cue.x - fighter.x) <= RIG_POSITION_TOLERANCE &&
      Math.abs(cue.z - fighter.z) <= RIG_POSITION_TOLERANCE,
    `${label}: cue did not follow the role-resolved fighter`,
  );
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
    assert(
      fighter.role === "warburg" ||
        fighter.role === "curie" ||
        fighter.role === "franklin" ||
        fighter.role === "opponent",
      `${label}: unknown fighter role`,
    );
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
    assert(
      Number.isInteger(fighter.lactateDriveCooldown) &&
        fighter.lactateDriveCooldown >= 0 &&
        fighter.lactateDriveCooldown <= 44,
      `${label}: invalid Lactate Drive cooldown`,
    );
    assert(
      Number.isInteger(fighter.aerobicOutputTicks) &&
        fighter.aerobicOutputTicks >= 0 &&
        fighter.aerobicOutputTicks <= 72,
      `${label}: invalid Aerobic Glycolysis output timer`,
    );
    assert(
      Number.isInteger(fighter.aerobicGlycolysisCooldown) &&
        fighter.aerobicGlycolysisCooldown >= 0 &&
        fighter.aerobicGlycolysisCooldown <= 150,
      `${label}: invalid Aerobic Glycolysis cooldown`,
    );
    assert(
      Number.isInteger(fighter.separationStepCooldown) &&
        fighter.separationStepCooldown >= 0 &&
        fighter.separationStepCooldown <= 72,
      `${label}: invalid Separation Step cooldown`,
    );
    assert(!fighter.lactateDrive || fighter.state === "light", `${label}: orphaned drive state`);
    assert(
      !fighter.separationStep || fighter.state === "light",
      `${label}: orphaned Separation Step`,
    );
    assert(
      !fighter.aerobicLightReady || fighter.aerobicOutputTicks > 0,
      `${label}: expired powered-light charge`,
    );
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
  const expectedRigName = (role) => {
    if (role === "warburg") return "Otto Heinrich Warburg";
    if (role === "franklin") return "Rosalind Franklin";
    return "Marie Curie";
  };
  for (const [index, fighter] of snapshot.fighters.entries()) {
    assert(
      snapshot.rigs?.[index]?.fighterName === expectedRigName(fighter.role),
      `${label}: rig ${index} did not follow ${fighter.role} presentation`,
    );
  }
  for (const [index, rig] of snapshot.rigs.entries()) {
    assert(!rig.disposed, `${label}: rig ${index} was disposed`);
    assert(
      rig.activeClip === snapshot.fighters[index].state,
      `${label}: rig ${index} clip drifted from fighter state`,
    );
  }
  assertRenderedRigSync(snapshot, label);
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
  const redName = expectedRigName(red.role);
  const blueName = expectedRigName(blue.role);
  assert(snapshot.hud.redName === redName.toUpperCase(), `${label}: red fighter name drift`);
  assert(
    snapshot.hud.blueName === `${blueName} AI`.toUpperCase(),
    `${label}: blue fighter name drift`,
  );
  assert(snapshot.hud.redStatusLabel === `${redName} status`, `${label}: red status ARIA drift`);
  assert(
    snapshot.hud.blueStatusLabel === `${blueName} AI status`,
    `${label}: blue status ARIA drift`,
  );
  assert(snapshot.hud.redHealthLabel === `${redName} health`, `${label}: red health ARIA drift`);
  assert(
    snapshot.hud.blueHealthLabel === `${blueName} AI health`,
    `${label}: blue health ARIA drift`,
  );
}

async function runMovement(page, report) {
  await restart(page);
  await advance(page, 32, action(0, 1));
  let state = await advance(page, 75, action(1, 0));
  assert(state.fighters[RED].x > state.fighters[BLUE].x, "crossing sides failed");
  assertRenderedRigSync(state, "crossing sides");
  report.crossings++;
  await restart(page);
  await advance(page, 32, action(0, -1));
  state = await advance(page, 75, action(1, 0));
  assert(state.fighters[RED].x > 0, "opposite-direction crossing failed");
  assertRenderedRigSync(state, "opposite-direction crossing");
  report.crossings++;
  state = await advance(page, 90, action(0, 1), action(0, -1));
  assert(Math.abs(state.fighters[RED].z) > 2, "clockwise circle did not move red");
  assertRenderedRigSync(state, "clockwise circle");
  await restart(page);
  state = await advance(page, 90, action(0, -1), action(0, 1));
  assert(Math.abs(state.fighters[RED].z) > 2, "counterclockwise circle did not move red");
  assertRenderedRigSync(state, "counterclockwise circle");
  await restart(page);
  state = await advance(page, 180, action(-1, -1), action(1, 1));
  assert(
    Math.abs(state.fighters[RED].x) > 8.7 || Math.abs(state.fighters[RED].z) > 5.7,
    "arena edge was not reached",
  );
  assert(distance(state) > 10, "maximum practical separation was not reached");
  assertRenderedRigSync(state, "maximum separation");
  report.maxDistance = Math.max(report.maxDistance, distance(state));
  state = await advance(page, 220, action(1, 1), action(-1, -1));
  assert(distance(state) >= 1.09, "collision separation failed after approach");
  assertRenderedRigSync(state, "approach after maximum separation");
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
    state.fighters[BLUE].hp === 72 && state.fighters[BLUE].state === "down",
    "heavy attack did not knock down",
  );
  assert(state.hud.moveName.includes("OXYGEN TRANSFER"), "heavy move label did not synchronize");
  await page.screenshot({ path: resolve(EVIDENCE_DIR, "oxygen-transfer-contact.png") });
  report.states.add("heavy");
  report.states.add("down");
  state = await advance(page, 71);
  assert(state.fighters[BLUE].state === "getup", "knockdown did not transition to getup");
  state = await advance(page, 19);
  assert(state.fighters[BLUE].state === "idle", "getup did not recover");
  report.states.add("getup");
  assertValid(state, "combat");
}

async function runWarburgPowers(page, report) {
  await restart(page);
  await forceFighter(page, RED, { x: 0, z: 0 });
  await forceFighter(page, BLUE, { x: 2.6, z: 0 });
  let state = await advance(page, 1, action(0, 0, true, true));
  assert(
    state.fighters[RED].lactateDrive && state.fighters[RED].lactateDriveCooldown === 44,
    "Lactate Drive chord did not start with its cooldown",
  );
  assert(state.hud.moveName.includes("LACTATE DRIVE"), "Lactate Drive label did not synchronize");
  await page.screenshot({ path: resolve(EVIDENCE_DIR, "lactate-drive-start.png") });
  state = await advance(page, 9);
  assert(Math.abs(state.fighters[RED].x - 0.648) < 1e-8, "Lactate Drive startup distance drift");
  assert(state.fighters[BLUE].hp === 100, "Lactate Drive hit before its ten-tick startup");
  state = await advance(page, 1);
  assert(
    state.fighters[BLUE].hp === 82 && state.fighters[BLUE].ticks === 14,
    "Lactate Drive did not apply its one hit and 14-tick stun",
  );
  report.moves = ["Lactate Drive"];

  await restart(page);
  await forceFighter(page, RED, { x: 0, z: 0 });
  await forceFighter(page, BLUE, { x: 2.6, z: 0 });
  await advance(page, 1, action(0, 0, true, true), action(0, 0, false, false, true));
  state = await advance(page, 10, NEUTRAL, action(0, 0, false, false, true));
  assert(
    state.fighters[BLUE].hp === 96 && state.fighters[BLUE].state === "block",
    "held block did not reduce Lactate Drive to four damage",
  );

  await restart(page);
  await forceFighter(page, RED, { x: 0, z: 0 });
  await forceFighter(page, BLUE, { x: 1.5, z: 0 });
  state = await advance(page, 1, action(0, 0, true, false, true));
  assert(
    state.fighters[RED].aerobicOutputTicks === 72 &&
      state.fighters[RED].aerobicGlycolysisCooldown === 150 &&
      state.fighters[RED].aerobicLightReady,
    "Aerobic Glycolysis chord did not start its output window",
  );
  assert(
    state.hud.moveName.includes("AEROBIC GLYCOLYSIS"),
    "Aerobic Glycolysis label did not synchronize",
  );
  await page.screenshot({ path: resolve(EVIDENCE_DIR, "aerobic-glycolysis-window.png") });
  state = await advance(page, 71);
  assert(state.fighters[RED].aerobicOutputTicks === 1, "output timer lost a tick");
  state = await advance(page, 1);
  assert(
    state.fighters[RED].aerobicOutputTicks === 0 && !state.fighters[RED].aerobicLightReady,
    "output window or powered-light charge failed to expire",
  );
  report.moves.push("Aerobic Glycolysis");

  await restart(page);
  await forceFighter(page, RED, { x: 0, z: 0 });
  await forceFighter(page, BLUE, { x: 8, z: 0 });
  await advance(page, 1, action(0, 0, true, false, true));
  await advance(page, 1);
  state = await advance(page, 1, action(1, 0));
  assert(Math.abs(state.fighters[RED].x - 0.115) < 1e-8, "output movement speed did not increase");

  await restart(page);
  await forceFighter(page, RED, { x: 0, z: 0 });
  await forceFighter(page, BLUE, { x: 1.5, z: 0 });
  await advance(page, 1, action(0, 0, true, false, true));
  await advance(page, 1);
  state = await advance(page, 1, action(0, 0, true));
  assert(state.fighters[RED].state === "light", "powered light failed to start");
  state = await advance(page, 7);
  assert(
    state.fighters[BLUE].hp === 86 &&
      state.fighters[BLUE].ticks === 14 &&
      !state.fighters[RED].aerobicLightReady,
    "Aerobic Glycolysis did not power and consume the next successful light",
  );
  await page.screenshot({ path: resolve(EVIDENCE_DIR, "aerobic-powered-light.png") });
  assertValid(state, "Warburg research powers");
}

async function runCurieMatchRule(page, report) {
  await restart(page);
  await forceFighter(page, RED, { role: "curie", x: 0, z: 0, attackHeld: false });
  await forceFighter(page, BLUE, {
    role: "warburg",
    x: 1.95,
    z: 0,
    hp: 100,
    state: "idle",
    ticks: 0,
  });
  let state = await advance(page, 1, action(0, 0, true, false, true));
  assert(
    state.fighters[RED].separationStep &&
      state.fighters[RED].ticks === 24 &&
      state.fighters[RED].separationStepCooldown === 72,
    "Curie Separation Step did not start with its fixed timing",
  );
  assert(
    !state.hud.curieIndicatorHidden,
    "Curie research cue did not appear at Separation Step start",
  );
  assert(
    state.hud.curieName.includes("SEPARATION STEP") &&
      state.hud.curieName.includes("FRACTION / ACTIVITY"),
    "Curie research cue did not name the move and measurement readout",
  );
  assert(
    Number.parseFloat(state.hud.curieMeterWidth) === 0,
    "Curie cue did not begin at zero progress",
  );
  state = await advance(page, 5);
  assert(state.fighters[BLUE].hp === 100, "Curie Separation Step hit before post-input tick six");
  assert(
    Number.parseFloat(state.hud.curieMeterWidth) > 20 &&
      Number.parseFloat(state.hud.curieMeterWidth) < 22,
    "Curie research cue did not advance from authoritative attack ticks",
  );
  await page.screenshot({ path: resolve(EVIDENCE_DIR, "curie-separation-step.png") });
  state = await advance(page, 1);
  assert(
    state.fighters[BLUE].hp === 84 && state.fighters[BLUE].ticks === 16,
    "Curie Separation Step did not apply its bounded contact",
  );
  state = await advance(page, 18);
  assert(!state.fighters[RED].separationStep, "Curie Separation Step did not recover");
  assert(state.hud.curieIndicatorHidden, "Curie research cue remained after recovery");

  await restart(page);
  await forceFighter(page, RED, { role: "curie", x: 0, z: 0, attackHeld: false });
  await forceFighter(page, BLUE, { role: "warburg" });
  state = await advance(page, 1, action(0, 0, true, false, true));
  assert(!state.hud.curieIndicatorHidden, "Curie research cue was absent before interruption");
  await forceFighter(page, RED, { state: "hit", ticks: 16, separationStep: false });
  state = await snapshot(page);
  assert(state.hud.curieIndicatorHidden, "Curie research cue remained after interruption");
  assertValid(state, "Curie direct Match role");
  report.moves.push("Separation Step");
}

async function runRoleAwarePresentation(page, report) {
  const pairs = [
    ["warburg", "curie"],
    ["curie", "warburg"],
  ];
  for (const [redRole, blueRole] of pairs) {
    await restart(page);
    await forceFighter(page, RED, { role: redRole, x: -0.8, z: 0, hp: 63, wins: 1 });
    await forceFighter(page, BLUE, { role: blueRole, x: 0.8, z: 0, hp: 47, wins: 0 });
    let state = await snapshot(page);
    assertValid(state, `${redRole} versus ${blueRole} presentation`);
    assertRenderedRigSync(state, `${redRole} versus ${blueRole} presentation`);
    assert(
      state.rigs[0].rootId !== state.rigs[1].rootId,
      `${redRole} versus ${blueRole}: fighters shared a rendered root`,
    );
    assert(
      state.hud.redHealth === "63%",
      `${redRole} versus ${blueRole}: red health name mismatch`,
    );
    assert(
      state.hud.blueHealth === "47%",
      `${redRole} versus ${blueRole}: blue health name mismatch`,
    );
    const warburgIndex = redRole === "warburg" ? RED : BLUE;
    const curieIndex = redRole === "curie" ? RED : BLUE;
    const targetIndex = warburgIndex === RED ? BLUE : RED;
    await forceFighter(page, warburgIndex, { state: "idle", ticks: 0, attackHeld: false });
    await forceFighter(page, targetIndex, { state: "idle", ticks: 0, attackHeld: false });
    const heavyActions = [NEUTRAL, NEUTRAL];
    heavyActions[warburgIndex] = action(0, 0, false, true);
    await advance(page, 1, heavyActions[RED], heavyActions[BLUE]);
    state = await advance(page, 14);
    assert(
      state.hud.moveName.includes("OXYGEN TRANSFER"),
      `${redRole} versus ${blueRole}: Warburg move cue did not follow his role`,
    );
    assertCueAt(
      state.cues?.oxygen,
      state.fighters[targetIndex],
      `${redRole} versus ${blueRole}: Oxygen Transfer`,
    );
    await forceFighter(page, warburgIndex, { state: "idle", ticks: 0, attackHeld: false });
    const outputActions = [NEUTRAL, NEUTRAL];
    outputActions[warburgIndex] = action(0, 0, true, false, true);
    state = await advance(page, 1, outputActions[RED], outputActions[BLUE]);
    assertCueAt(
      state.cues?.output,
      state.fighters[warburgIndex],
      `${redRole} versus ${blueRole}: Aerobic Glycolysis`,
    );
    await forceFighter(page, curieIndex, {
      state: "light",
      ticks: 19,
      attackHeld: true,
      separationStep: true,
      separationStepCooldown: 67,
    });
    state = await snapshot(page);
    assert(
      !state.hud.curieIndicatorHidden,
      `${redRole} versus ${blueRole}: Curie research cue did not follow her role`,
    );
    await page.evaluate(() => window.__fightDebug.forceMatch({ phase: "matchOver", winner: 0 }));
    state = await snapshot(page);
    const winnerName = redRole === "warburg" ? "OTTO HEINRICH WARBURG" : "MARIE CURIE";
    assert(
      state.hud.status === `${winnerName} WINS THE MATCH`,
      `${redRole} versus ${blueRole}: winner presentation did not follow role`,
    );
    await page.evaluate(() => window.__fightDebug.forceMatch({ phase: "matchOver", winner: 1 }));
    state = await snapshot(page);
    const aiWinnerName = blueRole === "warburg" ? "OTTO HEINRICH WARBURG" : "MARIE CURIE";
    assert(
      state.hud.status === `${aiWinnerName} WINS THE MATCH`,
      `${redRole} versus ${blueRole}: AI winner presentation did not follow role`,
    );
    report.states.add(`${redRole}-player-presentation`);
  }
}

function assertIndependentRenderResources(state, label) {
  const [redRig, blueRig] = state.rigs ?? [];
  assert(redRig && blueRig, `${label}: expected two presentation rigs`);
  assert(redRig.rootId !== blueRig.rootId, `${label}: fighters shared a rendered root`);
  assert(redRig.skeletonIds.length > 0, `${label}: red rig has no skeleton`);
  assert(blueRig.skeletonIds.length > 0, `${label}: blue rig has no skeleton`);
  assert(redRig.materialIds.length > 0, `${label}: red rig has no material`);
  assert(blueRig.materialIds.length > 0, `${label}: blue rig has no material`);
  assert(
    redRig.materialAlphas.every(Number.isFinite) && blueRig.materialAlphas.every(Number.isFinite),
    `${label}: fighter material alpha was nonfinite`,
  );
  assert(
    !redRig.skeletonIds.some((id) => blueRig.skeletonIds.includes(id)),
    `${label}: fighters shared a skeleton`,
  );
  assert(
    !redRig.materialIds.some((id) => blueRig.materialIds.includes(id)),
    `${label}: fighters shared a material`,
  );
}

async function runFranklinPresentation(page, report) {
  const stateTicks = {
    idle: 0,
    move: 0,
    light: 1,
    heavy: 1,
    block: 0,
    hit: 1,
    down: 1,
    getup: 1,
  };
  for (const [combatState, ticks] of Object.entries(stateTicks)) {
    await restart(page);
    await forceFighter(page, RED, {
      role: "franklin",
      x: -1.35,
      z: 0,
      state: combatState,
      ticks,
      attackHeld: false,
      hitDone: false,
    });
    await forceFighter(page, BLUE, {
      role: "warburg",
      x: 1.35,
      z: 0,
      state: combatState,
      ticks,
      attackHeld: false,
      hitDone: false,
    });
    const state = await snapshot(page);
    assertValid(state, `Franklin ${combatState} presentation`);
    assertRenderedRigSync(state, `Franklin ${combatState} presentation`);
    assertIndependentRenderResources(state, `Franklin ${combatState} presentation`);
    assert(
      state.rigs[RED].fighterName === "Rosalind Franklin" &&
        state.rigs[BLUE].fighterName === "Otto Heinrich Warburg",
      `Franklin ${combatState}: rig identity did not follow assigned roles`,
    );
    assert(
      state.hud.redName === "ROSALIND FRANKLIN" &&
        state.hud.blueName === "OTTO HEINRICH WARBURG AI",
      `Franklin ${combatState}: HUD identity did not follow assigned roles`,
    );
    assert(
      state.rigs.every((rig) => rig.activeClip === combatState),
      `Franklin ${combatState}: presentation clip did not follow combat state`,
    );
    report.states.add(`franklin-${combatState}`);
  }
  await page.evaluate(() => window.__fightDebug.forceMatch({ phase: "matchOver", winner: 0 }));
  const state = await snapshot(page);
  assert(
    state.hud.status === "ROSALIND FRANKLIN WINS THE MATCH",
    "Franklin winner presentation did not follow role",
  );
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
  let maxJumpContext = "none";
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
      if (jump > maxJump) {
        maxJump = jump;
        maxJumpContext = `batch=${batch} phase=${state.phase} from=${JSON.stringify(previousCamera)} to=${JSON.stringify(state.camera)}`;
      }
    }
    previousCamera = state.camera;
    if (state.phase === "matchOver") {
      state = await restart(page);
      assertValid(state, `random restart batch ${batch}`);
      previousCamera = state.camera;
    }
  }
  state = await advance(page, 360);
  assertValid(state, "long idle");
  assert(
    state.fighters.every(
      (fighter) => !["light", "heavy", "hit", "down", "getup"].includes(fighter.state),
    ),
    "long idle left a combat state stuck",
  );
  // Each debug sample advances twelve simulation ticks at once and snaps the
  // camera to that synthetic state. A fighter can travel 12 * 0.095 units,
  // both fighters can expand their separation by twice that amount, and one
  // strike can add a 0.65-unit knockback. The framing radius changes with
  // separation as well as midpoint movement, so 4.5 bounds that legal batch
  // displacement with a small margin. Live frame continuity retains its
  // tighter bound in the production-browser F7C scenario.
  assert(
    maxJump <= 4.5,
    `random debug-batch camera jump exceeded 4.5-unit physical budget: ${maxJump}; ${maxJumpContext}`,
  );
  report.maxCameraJump = maxJump;
  report.randomTicks = 1200 * 12 + 360;
}

async function main() {
  const seed = Number(readOption("--seed", "20260923"));
  const scenario = readOption("--scenario", "all");
  assert(
    scenario === "all" ||
      scenario === "role-aware-presentation" ||
      scenario === "franklin-presentation",
    `Unknown scenario: ${scenario}`,
  );
  rmSync(EVIDENCE_DIR, { force: true, recursive: true });
  mkdirSync(EVIDENCE_DIR, { recursive: true });
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
    moves: [],
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
    if (scenario === "role-aware-presentation") {
      await runRoleAwarePresentation(page, report);
    } else if (scenario === "franklin-presentation") {
      await runFranklinPresentation(page, report);
    } else {
      await runMovement(page, report);
      await runCameraControls(page, report);
      await runCombat(page, report);
      await runWarburgPowers(page, report);
      await runCurieMatchRule(page, report);
      await runRoleAwarePresentation(page, report);
      await runFranklinPresentation(page, report);
      await koRoundMatchAndRestart(page, report);
      await runInputStress(page, report, seed);
    }
    assert(errors.length === 0, `browser console errors: ${errors.join(" | ")}`);
    const output = { ...report, states: [...report.states].sort(), errors };
    console.log(JSON.stringify(output));
  } finally {
    await browser.close();
  }
}

await main();

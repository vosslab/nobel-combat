import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

const STATES = Object.freeze([
  ["idle", 0],
  ["move", 0],
  ["light", 1],
  ["heavy", 1],
  ["block", 0],
  ["hit", 1],
  ["down", 1],
  ["getup", 1],
]);

function readOption(name, fallback) {
  const position = process.argv.indexOf(name);
  if (position < 0) return fallback;
  const value = process.argv[position + 1];
  if (!value) throw new Error(`Missing value for ${name}`);
  return value;
}

function debugUrl() {
  const url = new URL(readOption("--url", "http://127.0.0.1:4173/"));
  url.searchParams.set("debug", "1");
  return url.toString();
}

function outputDirectory() {
  return resolve(readOption("--output-dir", "test-results/rig-states"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function settle(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

async function forceState(page, state, ticks, opponentRole) {
  await page.evaluate(
    ({ state, ticks, opponentRole }) => {
      const fight = window.__fightDebug;
      fight.restart();
      fight.forceFighter(0, {
        role: opponentRole === "franklin" ? "franklin" : "warburg",
        x: -1.35,
        z: 0,
        state,
        ticks,
        attackHeld: false,
        hitDone: false,
      });
      fight.forceFighter(1, {
        role: opponentRole === "franklin" ? "warburg" : "curie",
        x: 1.35,
        z: 0,
        state,
        ticks,
        attackHeld: false,
        hitDone: false,
      });
    },
    { state, ticks, opponentRole },
  );
  await settle(page);
  // Animation groups run independently of the paused debug simulation. This
  // fixed delay records a readable, repeatable point after their transition.
  await page.waitForTimeout(300);
  await settle(page);
}

async function captureCurieSeparationStep(page, directory) {
  await page.evaluate(() => {
    const fight = window.__fightDebug;
    fight.restart();
    fight.forceFighter(0, {
      role: "curie",
      x: -1.35,
      z: 0,
      state: "light",
      ticks: 19,
      attackHeld: true,
      hitDone: false,
      separationStep: true,
      separationStepCooldown: 67,
    });
  });
  await settle(page);
  await page.waitForTimeout(300);
  await settle(page);
  const cue = await page.evaluate(() => ({
    hidden: document.querySelector("#curie-indicator")?.hidden,
    label: document.querySelector("#curie-indicator")?.textContent?.trim(),
    width: document.querySelector("#curie-meter-fill")?.style.width,
  }));
  assert(!cue.hidden, "Separation Step capture did not show Curie research cue");
  assert(cue.label?.includes("SEPARATION STEP"), "Separation Step capture omitted its move name");
  assert(cue.label?.includes("FRACTION / ACTIVITY"), "Separation Step capture had wrong cue label");
  assert(Number.parseFloat(cue.width ?? "") > 20, "Separation Step capture had no cue progress");
  await page.screenshot({ path: resolve(directory, "curie-separation-step.png") });
}

async function captureWarburgManometer(page, directory, opponentRole) {
  await page.evaluate((opponentRole) => {
    const fight = window.__fightDebug;
    fight.restart();
    fight.forceFighter(0, {
      role: "warburg",
      x: -1.2,
      z: 0,
      state: "heavy",
      ticks: 32,
      attackHeld: true,
      hitDone: false,
    });
    fight.forceFighter(1, {
      role: opponentRole,
      x: 1.2,
      z: 0,
      state: "idle",
      ticks: 0,
      attackHeld: false,
      hitDone: false,
    });
  }, opponentRole);
  await settle(page);
  const startup = await page.evaluate(() => window.__fightSnapshot?.());
  const startupVisual = startup?.rigs?.find(
    (rig) => rig.fighterName === "Otto Heinrich Warburg",
  )?.researchVisual;
  assert(startupVisual, "Warburg model is missing its gauge and manometer presentation");
  assert(startupVisual.flowActive, "manometer pulse did not activate with Oxygen Transfer");
  assert(startupVisual.flowProgress === 0, "manometer pulse did not begin at zero progress");

  await page.evaluate(() => {
    const neutral = { x: 0, z: 0, light: false, heavy: false, block: false };
    window.__fightDebug.advance(24, [neutral, neutral]);
  });
  await settle(page);
  await page.waitForTimeout(200);
  const active = await page.evaluate(() => window.__fightSnapshot?.());
  const activeVisual = active?.rigs?.find(
    (rig) => rig.fighterName === "Otto Heinrich Warburg",
  )?.researchVisual;
  assert(activeVisual?.flowActive, "Oxygen Transfer did not animate the manometer pulse");
  assert(
    activeVisual.flowProgress > 0.6 && activeVisual.flowProgress < 0.8,
    `manometer pulse progress was ${activeVisual.flowProgress}, expected 0.75 after 24 ticks`,
  );
  assert(
    activeVisual.gaugeAngle > startupVisual.gaugeAngle,
    "pressure gauge needle did not respond to Oxygen Transfer startup",
  );
  await page.screenshot({ path: resolve(directory, "warburg-oxygen-transfer-manometer.png") });

  await page.evaluate(() =>
    window.__fightDebug.forceFighter(0, {
      state: "idle",
      ticks: 0,
      attackHeld: false,
      hitDone: false,
    }),
  );
  await settle(page);
  const recovered = await page.evaluate(() => window.__fightSnapshot?.());
  const recoveredVisual = recovered?.rigs?.find(
    (rig) => rig.fighterName === "Otto Heinrich Warburg",
  )?.researchVisual;
  assert(
    recoveredVisual && !recoveredVisual.flowActive,
    "manometer pulse remained active after the move",
  );
  assert(recoveredVisual.flowProgress === 0, "manometer flow did not reset after the move");
}

async function main() {
  const directory = outputDirectory();
  const opponentRole = readOption("--opponent", "curie");
  assert(opponentRole === "curie" || opponentRole === "franklin", "Unknown opponent role");
  rmSync(directory, { force: true, recursive: true });
  mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await page.goto(debugUrl());
    await page.waitForFunction(() => {
      const snapshot = window.__fightSnapshot?.();
      return Boolean(window.__fightDebug?.forceFighter && snapshot?.rigs?.length === 2);
    });
    for (const [state, ticks] of STATES) {
      await forceState(page, state, ticks, opponentRole);
      const snapshot = await page.evaluate(() => window.__fightSnapshot?.());
      assert(snapshot?.fighters?.length === 2, `${state}: missing fighter snapshot`);
      assert(
        snapshot.models?.filter((model) => model.enabled).length === 2,
        `${state}: inactive character models must remain hidden`,
      );
      assert(
        snapshot.rigs?.every((rig) =>
          snapshot.models.some((model) => model.rootId === rig.rootId && model.enabled),
        ),
        `${state}: both combatants must use visible presentation rigs`,
      );
      assert(
        snapshot.fighters.every((fighter) => fighter.state === state),
        `${state}: combat state did not apply to both fighters`,
      );
      assert(
        snapshot.rigs?.every((rig) => rig.activeClip === state && !rig.disposed),
        `${state}: visual animation did not synchronize with both fighters`,
      );
      const warburgVisual = snapshot.rigs?.find(
        (rig) => rig.fighterName === "Otto Heinrich Warburg",
      )?.researchVisual;
      assert(warburgVisual, `${state}: Warburg's gauge and manometer were missing`);
      assert(
        warburgVisual.flowActive === (state === "heavy"),
        `${state}: manometer pulse did not follow the Oxygen Transfer combat state`,
      );
      assert(
        snapshot.rigs?.[0]?.fighterName ===
          (opponentRole === "franklin" ? "Rosalind Franklin" : "Otto Heinrich Warburg") &&
          snapshot.rigs?.[1]?.fighterName ===
            (opponentRole === "franklin" ? "Otto Heinrich Warburg" : "Marie Curie"),
        `${state}: expected role-resolved visual rigs did not load`,
      );
      await page.screenshot({ path: resolve(directory, `${state}.png`) });
    }
    if (opponentRole === "curie") await captureCurieSeparationStep(page, directory);
    await captureWarburgManometer(page, directory, opponentRole);
    assert(errors.length === 0, `browser console errors: ${errors.join(" | ")}`);
    console.log(
      JSON.stringify({ directory, opponentRole, states: STATES.map(([state]) => state), errors }),
    );
  } finally {
    await browser.close();
  }
}

await main();

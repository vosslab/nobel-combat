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

async function forceState(page, state, ticks) {
  await page.evaluate(
    ({ state, ticks }) => {
      const fight = window.__fightDebug;
      fight.restart();
      fight.forceFighter(0, { x: -1.35, z: 0, state, ticks, attackHeld: false, hitDone: false });
      fight.forceFighter(1, { x: 1.35, z: 0, state, ticks, attackHeld: false, hitDone: false });
    },
    { state, ticks },
  );
  await settle(page);
  // Animation groups run independently of the paused debug simulation. This
  // fixed delay records a readable, repeatable point after their transition.
  await page.waitForTimeout(300);
  await settle(page);
}

async function main() {
  const directory = outputDirectory();
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
      await forceState(page, state, ticks);
      const snapshot = await page.evaluate(() => window.__fightSnapshot?.());
      assert(snapshot?.fighters?.length === 2, `${state}: missing fighter snapshot`);
      assert(
        snapshot.fighters.every((fighter) => fighter.state === state),
        `${state}: combat state did not apply to both fighters`,
      );
      assert(
        snapshot.rigs?.every((rig) => rig.activeClip === state && !rig.disposed),
        `${state}: visual animation did not synchronize with both fighters`,
      );
      await page.screenshot({ path: resolve(directory, `${state}.png`) });
    }
    assert(errors.length === 0, `browser console errors: ${errors.join(" | ")}`);
    console.log(JSON.stringify({ directory, states: STATES.map(([state]) => state), errors }));
  } finally {
    await browser.close();
  }
}

await main();

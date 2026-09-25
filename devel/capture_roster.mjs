/* global requestAnimationFrame, window */

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

const NEUTRAL = { x: 0, z: 0, light: false, heavy: false, block: false, special: false };

function option(name, fallback) {
  const position = process.argv.indexOf(name);
  if (position < 0) return fallback;
  const value = process.argv[position + 1];
  if (!value) throw new Error(`Missing value for ${name}`);
  return value;
}

function fighterId() {
  const value = process.argv[2];
  if (!value || value.startsWith("-")) {
    throw new Error("Usage: node devel/capture_roster.mjs <fighter-id> [--url URL]");
  }
  return value;
}

function debugUrl() {
  const url = new URL(option("--url", "http://127.0.0.1:4173/"));
  url.searchParams.set("debug", "1");
  return url.toString();
}

function outputDirectory(id) {
  return resolve(option("--output-dir", `test-results/roster/${id}`));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function settle(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function main() {
  const playerId = fighterId();
  const opponentId = playerId === "warburg" ? "curie" : "warburg";
  const directory = outputDirectory(playerId);
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
    await page.waitForFunction(() =>
      Boolean(window.__fightDebug && window.__fightSnapshot?.().rigs?.length === 2),
    );
    await page.evaluate(
      ({ player, opponent }) => {
        window.__fightDebug.selectPlayer(player, opponent);
      },
      { player: playerId, opponent: opponentId },
    );
    await page.waitForFunction(
      ({ player, opponent }) => {
        const snapshot = window.__fightSnapshot?.();
        return (
          snapshot?.rigs?.length === 2 &&
          snapshot.fighters[0]?.id === player &&
          snapshot.fighters[1]?.id === opponent
        );
      },
      { player: playerId, opponent: opponentId },
    );
    await settle(page);
    await page.screenshot({ path: resolve(directory, "idle-lineup.png") });
    await page.evaluate((neutral) => {
      window.__fightDebug.forceFighter(0, { meter: 300 });
      window.__fightDebug.tick([{ ...neutral, special: true }, neutral]);
    }, NEUTRAL);
    await page.waitForFunction(() => window.__fightSnapshot?.().fighters[0]?.specialTicks > 0);
    await settle(page);
    await page.screenshot({ path: resolve(directory, "tier-three-special.png") });
    assert(errors.length === 0, `browser errors: ${errors.join(" | ")}`);
    console.log(JSON.stringify({ playerId, opponentId, directory, errors }));
  } finally {
    await browser.close();
  }
}

await main();

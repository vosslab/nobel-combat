import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
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

function suppliedOption(name) {
  const position = process.argv.indexOf(name);
  if (position < 0) return undefined;
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function candidateOverride(playerId, opponentId) {
  const candidatePath = suppliedOption("--candidate-glb");
  const expectedSha256 = suppliedOption("--candidate-sha256");
  const bodyOwner = suppliedOption("--body-owner");
  if (!candidatePath && !expectedSha256 && !bodyOwner) return undefined;
  assert(
    Boolean(candidatePath && expectedSha256 && bodyOwner),
    "Candidate capture requires --candidate-glb, --candidate-sha256, and --body-owner",
  );
  assert(
    bodyOwner === playerId || bodyOwner === opponentId,
    "Body owner must be the player or opponent",
  );
  // The default capture helper remains directly runnable with Node for its
  // permanent Playwright scenario. Candidate captures need the TypeScript
  // roster authority and are invoked with `node --import tsx`.
  const { ROSTER } = await import("../../src/roster/roster.ts");
  const fighter = ROSTER[bodyOwner];
  assert(fighter, `Unknown body owner: ${bodyOwner}`);
  const comparisonFighter = ROSTER[bodyOwner === playerId ? opponentId : playerId];
  assert(comparisonFighter, "Unknown comparison fighter");
  assert(
    comparisonFighter.body !== fighter.body,
    "Candidate capture requires the selected comparison fighter to use a distinct body URL",
  );
  assert(
    /^[a-f0-9]{64}$/.test(expectedSha256),
    "Candidate SHA-256 must be 64 lowercase hex digits",
  );
  const bytes = readFileSync(resolve(candidatePath));
  const actualSha256 = sha256(bytes);
  assert(
    actualSha256 === expectedSha256,
    `Candidate SHA-256 mismatch: expected ${expectedSha256}, got ${actualSha256}`,
  );
  return {
    path: resolve(candidatePath),
    sha256: actualSha256,
    url: new URL(fighter.body, debugUrl()).toString(),
    bodyOwner,
    bytes,
  };
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
      fight.forceFighter(0, {
        x: -1.35,
        z: 0,
        state,
        ticks,
        attackHeld: false,
        hitDone: false,
      });
      fight.forceFighter(1, {
        x: 1.35,
        z: 0,
        state,
        ticks,
        attackHeld: false,
        hitDone: false,
      });
    },
    { state, ticks },
  );
  await settle(page);
  // Animation groups run independently of the paused debug simulation. This
  // fixed delay records a readable, repeatable point after their transition.
  await page.waitForTimeout(300);
  await settle(page);
}

async function captureWarburgManometer(page, directory, playerId, opponentId) {
  const warburgIndex = playerId === "warburg" ? 0 : 1;
  const otherIndex = warburgIndex === 0 ? 1 : 0;
  await page.evaluate(
    ({ playerId, opponentId, warburgIndex, otherIndex }) => {
      const fight = window.__fightDebug;
      fight.selectPlayer(playerId, opponentId);
      fight.forceFighter(warburgIndex, {
        x: warburgIndex === 0 ? -1.2 : 1.2,
        z: 0,
        state: "heavy",
        ticks: 32,
        attackHeld: true,
        hitDone: false,
      });
      fight.forceFighter(otherIndex, {
        x: otherIndex === 0 ? -1.2 : 1.2,
        z: 0,
        state: "idle",
        ticks: 0,
        attackHeld: false,
        hitDone: false,
      });
    },
    { playerId, opponentId, warburgIndex, otherIndex },
  );
  await settle(page);
  const startup = await page.evaluate(() => window.__fightSnapshot?.());
  const startupVisual = startup?.rigs?.find((rig) => rig.fighterId === "warburg")?.propVisual;
  assert(startupVisual, "Warburg model is missing its gauge and manometer presentation");
  assert(!startupVisual.flowActive, "ordinary heavy incorrectly activated the manometer pulse");

  await page.evaluate(
    (fighterIndex) =>
      window.__fightDebug.forceFighter(fighterIndex, {
        state: "heavy",
        ticks: 32,
        specialTicks: 32,
        attackHeld: true,
        hitDone: true,
      }),
    warburgIndex,
  );
  await settle(page);
  const specialStartup = await page.evaluate(() => window.__fightSnapshot?.());
  const specialStartupVisual = specialStartup?.rigs?.find(
    (rig) => rig.fighterId === "warburg",
  )?.propVisual;
  assert(specialStartupVisual?.flowActive, "special ticks did not activate the manometer pulse");
  assert(specialStartupVisual.flowProgress === 0, "manometer pulse did not begin at zero progress");

  await page.evaluate(() => {
    const neutral = { x: 0, z: 0, light: false, heavy: false, block: false, special: false };
    window.__fightDebug.advance(24, [neutral, neutral]);
  });
  await settle(page);
  await page.waitForTimeout(200);
  const active = await page.evaluate(() => window.__fightSnapshot?.());
  const activeVisual = active?.rigs?.find((rig) => rig.fighterId === "warburg")?.propVisual;
  assert(activeVisual?.flowActive, "Oxygen Transfer did not animate the manometer pulse");
  assert(
    activeVisual.flowProgress > 0.6 && activeVisual.flowProgress < 0.8,
    `manometer pulse progress was ${activeVisual.flowProgress}, expected 0.75 after 24 ticks`,
  );
  assert(
    activeVisual.gaugeAngle > specialStartupVisual.gaugeAngle,
    "pressure gauge needle did not respond to Oxygen Transfer startup",
  );
  await page.screenshot({ path: resolve(directory, "warburg-oxygen-transfer-manometer.png") });

  await page.evaluate(
    (fighterIndex) =>
      window.__fightDebug.forceFighter(fighterIndex, {
        state: "idle",
        ticks: 0,
        specialTicks: 0,
        attackHeld: false,
        hitDone: false,
      }),
    warburgIndex,
  );
  await settle(page);
  const recovered = await page.evaluate(() => window.__fightSnapshot?.());
  const recoveredVisual = recovered?.rigs?.find((rig) => rig.fighterId === "warburg")?.propVisual;
  assert(
    recoveredVisual && !recoveredVisual.flowActive,
    "manometer pulse remained active after the move",
  );
  assert(recoveredVisual.flowProgress === 0, "manometer flow did not reset after the move");
}

async function main() {
  const directory = outputDirectory();
  const playerId = readOption("--player", "warburg");
  const opponentId = readOption("--opponent", "curie");
  assert(playerId !== opponentId, "Player and opponent must be different fighters");
  const override = await candidateOverride(playerId, opponentId);
  rmSync(directory, { force: true, recursive: true });
  mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const servedSha256 = [];
  if (override) {
    await page.route(
      (url) => url.toString() === override.url,
      async (route) => {
        const served = sha256(override.bytes);
        servedSha256.push(served);
        await route.fulfill({ body: override.bytes, contentType: "model/gltf-binary" });
      },
    );
  }
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
    await page.evaluate(
      ({ playerId, opponentId }) => {
        const fight = window.__fightDebug;
        if (!fight?.selectPlayer) throw new Error("Debug harness did not expose selectPlayer");
        fight.selectPlayer(playerId, opponentId);
      },
      { playerId, opponentId },
    );
    for (const [state, ticks] of STATES) {
      await forceState(page, state, ticks);
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
        snapshot.rigs?.every((rig) =>
          snapshot.fighters.some((fighter) => fighter.id === rig.fighterId),
        ),
        `${state}: every presentation rig must identify its roster fighter`,
      );
      assert(
        snapshot.rigs?.every(
          (rig) => Boolean(rig.propVisual) === (rig.appearanceProp === "manometer"),
        ),
        `${state}: prop presentation must follow the fighter definition's appearance prop`,
      );
      assert(
        snapshot.fighters.every((fighter) => fighter.state === state),
        `${state}: combat state did not apply to both fighters`,
      );
      assert(
        snapshot.rigs?.every((rig) => rig.activeClip === state && !rig.disposed),
        `${state}: visual animation did not synchronize with both fighters`,
      );
      if (playerId === "warburg" || opponentId === "warburg") {
        const warburgVisual = snapshot.rigs?.find((rig) => rig.fighterId === "warburg")?.propVisual;
        assert(warburgVisual, `${state}: Warburg's gauge and manometer were missing`);
        assert(
          !warburgVisual.flowActive,
          `${state}: ordinary combat pose incorrectly activated the manometer pulse`,
        );
      }
      assert(
        snapshot.rigs?.[0]?.fighterId === playerId && snapshot.rigs?.[1]?.fighterId === opponentId,
        `${state}: visual rigs did not retain requested player/opponent order`,
      );
      await page.screenshot({ path: resolve(directory, `${state}.png`) });
    }
    if (playerId === "warburg" || opponentId === "warburg") {
      await captureWarburgManometer(page, directory, playerId, opponentId);
    }
    if (override) {
      assert(servedSha256.length > 0, `Candidate body URL was never requested: ${override.url}`);
      assert(
        servedSha256.every((served) => served === override.sha256),
        "Candidate body bytes served by the capture route differed from the verified candidate",
      );
    }
    assert(errors.length === 0, `browser console errors: ${errors.join(" | ")}`);
    if (override) {
      writeFileSync(
        resolve(directory, "capture_receipt.json"),
        `${JSON.stringify({
          playerId,
          opponentId,
          bodyOwner: override.bodyOwner,
          states: STATES.map(([state]) => state),
          candidatePath: override.path,
          overriddenUrl: override.url,
          candidateSha256: override.sha256,
          servedSha256,
        })}\n`,
      );
    }
    console.log(
      JSON.stringify({
        directory,
        playerId,
        opponentId,
        states: STATES.map(([state]) => state),
        override: override
          ? {
              url: override.url,
              candidateSha256: override.sha256,
              servedRequests: servedSha256.length,
            }
          : undefined,
        errors,
      }),
    );
  } finally {
    await browser.close();
  }
}

await main();

import assert from "node:assert/strict";
import { test } from "node:test";

import { createAi, createRandomSource } from "../src/ai.ts";
import { Match, NEUTRAL } from "../src/match.ts";
import { fighterById } from "../src/roster/roster.ts";

function sequence(values) {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

function actionIsBounded(action) {
  return (
    Number.isFinite(action.x) &&
    Number.isFinite(action.z) &&
    Math.abs(action.x) <= 1 &&
    Math.abs(action.z) <= 1 &&
    typeof action.light === "boolean" &&
    typeof action.heavy === "boolean" &&
    typeof action.block === "boolean" &&
    typeof action.special === "boolean"
  );
}

test("seeded AI random sources repeat independently of render-side randomness", () => {
  const first = createRandomSource(0x1977);
  const second = createRandomSource(0x1977);
  const firstValues = Array.from({ length: 12 }, first);
  const secondValues = Array.from({ length: 12 }, second);

  assert.deepEqual(firstValues, secondValues);
  assert.ok(firstValues.every((value) => value >= 0 && value < 1));
});

test("AI approaches from maximum separation with bounded actions", () => {
  const match = new Match();
  const ai = createAi(sequence([0.9]));
  match.fighters[0].x = 9;
  match.fighters[0].z = 6;
  match.fighters[1].x = -9;
  match.fighters[1].z = -6;

  for (let tick = 0; tick < 120; tick++) {
    const action = ai(match);
    assert.ok(actionIsBounded(action));
    assert.ok(Math.hypot(action.x, action.z) > 0, "distant AI must approach");
    match.tick([NEUTRAL, action]);
  }
  assert.ok(match.fighters[1].x > -9);
  assert.ok(match.fighters[1].z > -6);
});

test("AI attack cadence uses one light or heavy action and then recovers", () => {
  const match = new Match();
  match.selectPlayer("curie", "warburg");
  match.fighters[0].x = -0.7;
  match.fighters[1].x = 0.7;
  const ai = createAi(sequence([0.9, 0.1]));

  const light = ai(match);
  assert.equal(light.light, true);
  assert.equal(light.heavy, false);
  match.tick([NEUTRAL, light]);
  for (let tick = 0; tick < 41; tick++) {
    const action = ai(match);
    assert.equal(action.light || action.heavy, false, "cooldown must suppress repeated swings");
    match.tick([NEUTRAL, action]);
  }
  const heavy = ai(match);
  assert.equal(heavy.light, false);
  assert.equal(heavy.heavy, true);
});

test("AI blocks for a bounded reaction delay after taking damage", () => {
  const match = new Match();
  const ai = createAi(sequence([0.1, 0.9]));
  ai(match);
  match.fighters[1].hp = 90;

  let blocks = 0;
  for (let tick = 0; tick < 28; tick++) {
    const action = ai(match);
    blocks += Number(action.block);
  }
  assert.equal(blocks, 27);
  assert.equal(ai(match).block, false);
});

test("AI releases a special when meter and range allow", () => {
  const match = new Match();
  match.selectPlayer("curie", "warburg");
  const [red, blue] = match.fighters;
  const profile = fighterById(blue.id).ai;
  blue.meter = 100;
  red.x = blue.x - profile.specialRange[0] + 0.05;
  const ai = createAi(() => 0.9);

  const action = ai(match);
  assert.equal(action.special, true);
  assert.equal(action.light || action.heavy || action.block, false);
  match.tick([NEUTRAL, action]);
  assert.ok(blue.specialTicks > 0);
  assert.equal(blue.meter, 0);
});

test("AI wins long seeded matches without unbounded or unexplained distant idle actions", () => {
  const match = new Match();
  const ai = createAi(sequence([0.9, 0.1, 0.9, 0.9, 0.1]));
  let distantIdleTicks = 0;
  let actionCount = 0;

  for (let tick = 0; tick < 4000 && match.phase !== "matchOver"; tick++) {
    const [red, blue] = match.fighters;
    const beforeDistance = Math.hypot(red.x - blue.x, red.z - blue.z);
    const action = ai(match);
    assert.ok(actionIsBounded(action));
    actionCount += Number(action.light || action.heavy);
    if (
      match.phase === "fight" &&
      beforeDistance > 1.55 &&
      blue.state !== "hit" &&
      blue.state !== "down" &&
      blue.state !== "getup" &&
      !action.special
    ) {
      distantIdleTicks += Number(action.x === 0 && action.z === 0);
    }
    match.tick([NEUTRAL, action]);
  }

  assert.ok(actionCount >= 8, "AI should attack repeatedly during a full match");
  assert.equal(distantIdleTicks, 0);
  assert.equal(match.phase, "matchOver");
  assert.equal(match.winner, 1);
  assert.equal(match.fighters[1].wins, 2);
});

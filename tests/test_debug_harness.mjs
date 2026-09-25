import assert from "node:assert/strict";
import { test } from "node:test";

import { DebugHarness } from "../src/debug_harness.ts";
import { Match, NEUTRAL } from "../src/match.ts";

const states = [
  ["idle", 0],
  ["move", 0],
  ["light", 24],
  ["heavy", 36],
  ["block", 8],
  ["hit", 18],
  ["down", 70],
  ["getup", 18],
];

test("debug harness manually advances combat and snapshots are immutable", () => {
  const harness = new DebugHarness();
  const initial = harness.snapshot();

  assert.ok(Object.isFrozen(initial));
  assert.ok(Object.isFrozen(initial.fighters));
  assert.ok(Object.isFrozen(initial.fighters[0]));
  assert.throws(() => {
    initial.fighters[0].hp = 0;
  }, TypeError);
  assert.equal(harness.snapshot().fighters[0].hp, 100);

  const effectsMatch = new Match();
  effectsMatch.effects = [
    {
      kind: "scheduled",
      owner: 0,
      ticks: 0,
      block: {
        kind: "shield",
        points: 1,
        durationTicks: 1,
        onHit: [{ kind: "strike", damage: 1, reach: 1, stunTicks: 1, knockback: 0 }],
      },
    },
  ];
  const effectSnapshot = new DebugHarness(effectsMatch).snapshot();
  assert.throws(() => {
    effectSnapshot.effects[0].block.onHit[0].damage = 99;
  }, TypeError);
  assert.equal(effectsMatch.effects[0].block.onHit[0].damage, 1);

  harness.forceFighter(0, { x: -0.8 });
  harness.forceFighter(1, { x: 0.8 });
  harness.tick([{ ...NEUTRAL, light: true }, NEUTRAL]);
  const hit = harness.advance(15);
  assert.equal(hit.fighters[1].hp, 90);
});

test("debug harness directly drives every fighter state and match transition", () => {
  const harness = new DebugHarness();

  for (const [state, ticks] of states) {
    const snapshot = harness.forceFighter(0, { state, ticks });
    assert.equal(snapshot.fighters[0].state, state);
  }

  const roundOver = harness.forceMatch({
    phase: "roundOver",
    round: 1,
    winner: 1,
    phaseTicks: 119,
  });
  assert.equal(roundOver.phase, "roundOver");
  assert.equal(harness.advance(1).phase, "fight");
  assert.equal(harness.snapshot().round, 2);

  const matchOver = harness.forceMatch({ phase: "matchOver", winner: 0 });
  assert.equal(matchOver.phase, "matchOver");
  assert.equal(harness.tick().phase, "matchOver");
  assert.equal(harness.restart().phase, "fight");
});

test("debug harness rejects malformed test drivers", () => {
  const harness = new DebugHarness();

  assert.throws(() => harness.advance(-1), /non-negative safe integer/);
  assert.throws(() => harness.forceFighter(2, { hp: 1 }), /index/);
  assert.throws(() => harness.forceFighter(0, { state: "jump" }), /Unknown fighter state/);
  assert.throws(() => harness.forceFighter(0, { id: "unknown" }), /Unknown fighter field/);
  assert.throws(() => harness.forceFighter(0, { hp: -1 }), /Fighter hp/);
  assert.throws(() => harness.forceFighter(0, { x: 9.1 }), /Fighter x/);
  assert.throws(() => harness.forceFighter(0, { ticks: -1 }), /Fighter ticks/);
  assert.throws(() => harness.forceFighter(0, { extra: true }), /Unknown fighter field/);
  assert.throws(() => harness.forceMatch({ winner: 4 }), /winner/);
  assert.throws(() => harness.forceMatch({ round: 0 }), /Match round/);
  assert.throws(() => harness.forceMatch({ phaseTicks: 120 }), /Match phaseTicks/);
  assert.throws(() => harness.forceMatch({ extra: true }), /Unknown match field/);
  assert.throws(() => harness.tick([{ ...NEUTRAL, x: 1.1 }, NEUTRAL]), /Action x/);
  assert.throws(() => harness.tick([{ ...NEUTRAL, light: "yes" }, NEUTRAL]), /Action light/);
  assert.throws(() => harness.tick([{ ...NEUTRAL, special: "yes" }, NEUTRAL]), /Action special/);
  assert.throws(
    () => harness.tick([{ x: 0, z: 0, light: false, heavy: false, block: false }, NEUTRAL]),
    /Action special/,
  );
  assert.throws(() => harness.forceFighter(0, { meter: 300.1 }), /Fighter meter/);
});

test("debug harness accepts Franklin for direct state fixtures", () => {
  const harness = new DebugHarness();
  harness.selectPlayer("franklin", "curie");
  const snapshot = harness.forceFighter(0, { state: "block", ticks: 0 });
  assert.equal(snapshot.fighters[0].id, "franklin");
  assert.equal(snapshot.fighters[0].state, "block");
});

test("debug harness delegates pair validation to Match", () => {
  const harness = new DebugHarness();

  assert.throws(() => harness.selectPlayer("unknown", "curie"), /Unknown fighter id/);
  assert.throws(() => harness.selectPlayer("warburg", "warburg"), /own opponent/);
  assert.throws(() => harness.forceFighter(0, { id: "curie" }), /Unknown fighter field/);
});

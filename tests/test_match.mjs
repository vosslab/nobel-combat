import assert from "node:assert/strict";
import { test } from "node:test";
import { Match, NEUTRAL } from "../src/match.ts";
const light = { ...NEUTRAL, light: true };
const heavy = { ...NEUTRAL, heavy: true };
const lactateDrive = { ...NEUTRAL, light: true, heavy: true };
const aerobicGlycolysis = { ...NEUTRAL, light: true, block: true };
function run(match, count, red = NEUTRAL, blue = NEUTRAL) {
  for (let i = 0; i < count; i++) match.tick([red, blue]);
}
test("light hits once and block reduces damage", () => {
  const m = new Match();
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.tick([light, NEUTRAL]);
  run(m, 22);
  assert.equal(m.fighters[1].hp, 90);
  m.restart();
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.tick([NEUTRAL, { ...NEUTRAL, block: true }]);
  m.tick([light, { ...NEUTRAL, block: true }]);
  run(m, 22, NEUTRAL, { ...NEUTRAL, block: true });
  assert.equal(m.fighters[1].hp, 98);
});
test("heavy knockdown, KO, next round, and restart", () => {
  const m = new Match();
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.tick([heavy, NEUTRAL]);
  run(m, 9);
  assert.equal(m.fighters[1].state, "down");
  run(m, 72);
  assert.equal(m.fighters[1].state, "getup");
  run(m, 18);
  assert.equal(m.fighters[1].state, "idle");
  m.restart();
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.fighters[1].hp = 20;
  m.tick([heavy, NEUTRAL]);
  run(m, 9);
  assert.equal(m.phase, "roundOver");
  assert.equal(m.fighters[0].wins, 1);
  run(m, 120);
  assert.equal(m.round, 2);
  assert.equal(m.fighters[1].hp, 100);
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.fighters[1].hp = 20;
  m.tick([heavy, NEUTRAL]);
  run(m, 9);
  assert.equal(m.phase, "matchOver");
  m.restart();
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 1);
  assert.equal(m.fighters[0].wins, 0);
});

test("Warburg Oxygen Transfer is faster, stronger, and reaches farther than the AI heavy", () => {
  const m = new Match();
  m.fighters[0].x = 0;
  m.fighters[1].x = 2.3;
  m.tick([heavy, NEUTRAL]);
  assert.equal(m.fighters[0].role, "warburg");
  assert.equal(m.fighters[0].ticks, 32);
  run(m, 9);
  assert.equal(m.fighters[1].hp, 72, "Warburg attack connects at 2.3 units for 28 damage");
  assert.equal(m.fighters[1].state, "down");
  assert.equal(m.fighters[1].ticks, 72);

  const blocked = new Match();
  blocked.fighters[0].x = -0.8;
  blocked.fighters[1].x = 0.8;
  blocked.tick([heavy, { ...NEUTRAL, block: true }]);
  run(blocked, 9, heavy, { ...NEUTRAL, block: true });
  assert.equal(blocked.fighters[1].hp, 94, "held block reduces Oxygen Transfer to 6 damage");

  const outside = new Match();
  outside.fighters[0].x = 0;
  outside.fighters[1].x = 2.46;
  outside.tick([heavy, NEUTRAL]);
  run(outside, 24);
  assert.equal(outside.fighters[1].hp, 100, "attack cannot connect beyond its 2.45-unit reach");
});

test("Blue AI keeps the standard heavy attack contract", () => {
  const m = new Match();
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.tick([NEUTRAL, heavy]);
  assert.equal(m.fighters[1].role, "opponent");
  assert.equal(m.fighters[1].ticks, 36);
  run(m, 14, NEUTRAL, heavy);
  assert.equal(m.fighters[0].hp, 76);
  assert.equal(m.fighters[0].ticks, 70);
});

test("Lactate Drive rushes, hits once, respects block, and has a fixed cooldown", () => {
  const m = new Match();
  m.fighters[0].x = 0;
  m.fighters[1].x = 2.6;
  m.tick([lactateDrive, NEUTRAL]);
  assert.equal(m.fighters[0].state, "light");
  assert.equal(m.fighters[0].ticks, 16);
  assert.equal(m.fighters[0].lactateDrive, true);
  assert.equal(m.fighters[0].lactateDriveCooldown, 44);
  run(m, 9);
  assert.ok(Math.abs(m.fighters[0].x - 0.648) < 1e-10);
  assert.equal(m.fighters[1].hp, 100);
  m.tick([NEUTRAL, NEUTRAL]);
  assert.ok(Math.abs(m.fighters[0].x - 0.72) < 1e-10);
  assert.equal(m.fighters[1].hp, 82);
  assert.equal(m.fighters[1].state, "hit");
  assert.equal(m.fighters[1].ticks, 14);
  run(m, 15);
  assert.equal(m.fighters[1].hp, 82, "one special swing cannot hit twice");
  assert.equal(m.fighters[0].lactateDrive, false);

  m.tick([lactateDrive, NEUTRAL]);
  assert.equal(m.fighters[0].state, "idle", "a second drive cannot bypass its cooldown");
  assert.equal(m.fighters[0].lactateDriveCooldown, 18);
  run(m, 17);
  assert.equal(m.fighters[0].lactateDriveCooldown, 1);
  m.tick([NEUTRAL, NEUTRAL]);
  assert.equal(m.fighters[0].lactateDriveCooldown, 0);
  m.tick([lactateDrive, NEUTRAL]);
  assert.equal(m.fighters[0].lactateDrive, true, "drive is available again after exactly 44 ticks");

  const blocked = new Match();
  blocked.fighters[0].x = 0;
  blocked.fighters[1].x = 2.6;
  blocked.tick([lactateDrive, { ...NEUTRAL, block: true }]);
  run(blocked, 10, NEUTRAL, { ...NEUTRAL, block: true });
  assert.equal(blocked.fighters[1].hp, 96, "held block reduces the drive to 4 damage");
  assert.equal(blocked.fighters[1].state, "block");
});

test("Aerobic Glycolysis opens a bounded output window and powers the next connected light", () => {
  const m = new Match();
  m.fighters[0].x = 0;
  m.fighters[1].x = 1.5;
  m.tick([aerobicGlycolysis, NEUTRAL]);
  assert.equal(m.fighters[0].aerobicOutputTicks, 72);
  assert.equal(m.fighters[0].aerobicGlycolysisCooldown, 150);
  assert.equal(m.fighters[0].aerobicLightReady, true);
  m.tick([NEUTRAL, NEUTRAL]);
  m.tick([{ ...NEUTRAL, x: 1 }, NEUTRAL]);
  assert.ok(Math.abs(m.fighters[0].x - 0.115) < 1e-10);

  const powered = new Match();
  powered.fighters[0].x = 0;
  powered.fighters[1].x = 1.5;
  powered.tick([aerobicGlycolysis, NEUTRAL]);
  powered.tick([NEUTRAL, NEUTRAL]);
  powered.tick([light, NEUTRAL]);
  run(powered, 7);
  assert.equal(powered.fighters[1].hp, 86);
  assert.equal(powered.fighters[1].state, "hit");
  assert.equal(powered.fighters[1].ticks, 14);
  assert.equal(powered.fighters[0].aerobicLightReady, false);

  const blocked = new Match();
  blocked.fighters[0].x = 0;
  blocked.fighters[1].x = 1.5;
  blocked.tick([aerobicGlycolysis, { ...NEUTRAL, block: true }]);
  blocked.tick([NEUTRAL, { ...NEUTRAL, block: true }]);
  blocked.tick([light, { ...NEUTRAL, block: true }]);
  run(blocked, 7, NEUTRAL, { ...NEUTRAL, block: true });
  assert.equal(blocked.fighters[1].hp, 96, "a powered light deals four damage through held block");
  assert.equal(blocked.fighters[0].aerobicLightReady, false, "blocked contact consumes the boost");

  const expired = new Match();
  expired.tick([aerobicGlycolysis, NEUTRAL]);
  run(expired, 71);
  assert.equal(expired.fighters[0].aerobicOutputTicks, 1);
  assert.equal(expired.fighters[0].aerobicLightReady, true);
  expired.tick([NEUTRAL, NEUTRAL]);
  assert.equal(expired.fighters[0].aerobicOutputTicks, 0);
  assert.equal(expired.fighters[0].aerobicLightReady, false);
  assert.equal(expired.fighters[0].aerobicGlycolysisCooldown, 78);

  const reset = new Match();
  reset.fighters[0].lactateDriveCooldown = 12;
  reset.fighters[0].aerobicOutputTicks = 22;
  reset.fighters[0].aerobicGlycolysisCooldown = 44;
  reset.fighters[0].aerobicLightReady = true;
  reset.restart();
  assert.equal(reset.fighters[0].lactateDriveCooldown, 0);
  assert.equal(reset.fighters[0].aerobicOutputTicks, 0);
  assert.equal(reset.fighters[0].aerobicGlycolysisCooldown, 0);
  assert.equal(reset.fighters[0].aerobicLightReady, false);
});

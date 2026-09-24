import assert from "node:assert/strict";
import { test } from "node:test";
import { Match, NEUTRAL } from "../src/match.ts";
const light = { ...NEUTRAL, light: true };
const heavy = { ...NEUTRAL, heavy: true };
const lactateDrive = { ...NEUTRAL, light: true, heavy: true };
const aerobicGlycolysis = { ...NEUTRAL, light: true, block: true };
const separationStep = { ...NEUTRAL, light: true, block: true };
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
  run(m, 8);
  assert.equal(
    m.fighters[1].hp,
    100,
    "Oxygen Transfer does not hit before its ninth post-start tick",
  );
  assert.equal(m.fighters[0].ticks, 24);
  m.tick([NEUTRAL, NEUTRAL]);
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
  run(m, 13, NEUTRAL, heavy);
  assert.equal(m.fighters[0].hp, 100, "standard heavy keeps its slower startup");
  m.tick([NEUTRAL, heavy]);
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

test("Curie Separation Step has a fixed active window, one hit, and fixed recovery", () => {
  const m = new Match();
  m.fighters[0].role = "curie";
  m.fighters[0].x = 0;
  m.fighters[1].x = 1.95;
  const startX = m.fighters[0].x;
  const startZ = m.fighters[0].z;
  m.tick([separationStep, NEUTRAL]);
  assert.equal(m.fighters[0].state, "light");
  assert.equal(m.fighters[0].ticks, 24);
  assert.equal(m.fighters[0].separationStep, true);
  assert.equal(m.fighters[0].separationStepCooldown, 72);
  run(m, 5);
  assert.equal(m.fighters[1].hp, 100, "Separation Step has six ticks of startup");
  assert.equal(m.fighters[0].x, startX, "Separation Step has no attacker movement");
  assert.equal(m.fighters[0].z, startZ, "Separation Step has no attacker movement");
  m.tick([NEUTRAL, NEUTRAL]);
  assert.equal(m.fighters[1].hp, 84, "first contact occurs on post-input tick six");
  assert.equal(m.fighters[1].state, "hit");
  assert.equal(m.fighters[1].ticks, 16);
  run(m, 18);
  assert.equal(m.fighters[1].hp, 84, "one Separation Step swing cannot hit twice");
  assert.equal(m.fighters[0].state, "idle", "the move recovers after its active window");
  assert.equal(m.fighters[0].separationStep, false);
});

test("Curie Separation Step respects block, range, cooldown, KO, and restart", () => {
  const blocked = new Match();
  blocked.fighters[0].role = "curie";
  blocked.fighters[0].x = 0;
  blocked.fighters[1].x = 1.95;
  blocked.tick([separationStep, { ...NEUTRAL, block: true }]);
  run(blocked, 6, NEUTRAL, { ...NEUTRAL, block: true });
  assert.equal(blocked.fighters[1].hp, 97, "held block takes three damage");
  assert.equal(blocked.fighters[1].state, "block");
  assert.equal(blocked.fighters[1].ticks, 8);

  const outside = new Match();
  outside.fighters[0].role = "curie";
  outside.fighters[0].x = 0;
  outside.fighters[1].x = 1.96;
  outside.tick([separationStep, NEUTRAL]);
  run(outside, 24);
  assert.equal(outside.fighters[1].hp, 100, "a whiff cannot connect after its active window");
  assert.equal(outside.fighters[0].state, "idle");
  assert.equal(outside.fighters[0].separationStepCooldown, 48);
  outside.tick([separationStep, NEUTRAL]);
  assert.equal(outside.fighters[0].state, "idle", "cooldown prevents retriggering");
  run(outside, 46);
  assert.equal(outside.fighters[0].separationStepCooldown, 1);
  outside.tick([separationStep, NEUTRAL]);
  assert.equal(
    outside.fighters[0].separationStep,
    true,
    "a chord at cooldown one reactivates on the same 72nd post-start tick",
  );
  assert.equal(outside.fighters[0].separationStepCooldown, 72);

  const ko = new Match();
  ko.fighters[0].role = "curie";
  ko.fighters[0].x = 0;
  ko.fighters[1].x = 1.95;
  ko.fighters[1].hp = 16;
  ko.tick([separationStep, NEUTRAL]);
  run(ko, 6);
  assert.equal(ko.phase, "roundOver");
  assert.equal(ko.fighters[0].wins, 1);
  run(ko, 120);
  assert.equal(ko.phase, "fight");
  assert.equal(ko.round, 2);
  assert.equal(ko.fighters[0].role, "warburg", "round reset preserves current default roles");
  ko.fighters[0].separationStepCooldown = 12;
  ko.restart();
  assert.equal(ko.phase, "fight");
  assert.equal(ko.fighters[0].role, "warburg");
  assert.equal(ko.fighters[0].separationStepCooldown, 0);
  assert.equal(ko.fighters[0].separationStep, false);
});

test("a light hit interrupts Curie Separation Step without resetting its cooldown", () => {
  const m = new Match();
  m.fighters[0].x = -0.7;
  m.fighters[1].role = "curie";
  m.fighters[1].x = 0.7;
  m.tick([{ ...NEUTRAL, block: true }, separationStep]);
  assert.equal(m.fighters[1].separationStep, true);
  assert.equal(m.fighters[1].separationStepCooldown, 72);

  run(m, 6, { ...NEUTRAL, block: true });
  assert.equal(m.fighters[0].state, "block");
  assert.equal(m.fighters[1].separationStep, true);
  m.tick([light, NEUTRAL]);
  run(m, 7);
  assert.equal(m.fighters[1].hp, 90);
  assert.equal(m.fighters[1].state, "hit");
  assert.equal(m.fighters[1].ticks, 18);
  assert.equal(m.fighters[1].separationStep, false);
  assert.equal(m.fighters[1].separationStepCooldown, 59);

  m.tick([NEUTRAL, NEUTRAL]);
  assert.equal(m.fighters[1].state, "hit");
  assert.equal(m.fighters[1].ticks, 17);
  assert.equal(m.fighters[1].separationStepCooldown, 58);
  run(m, 20);
  assert.equal(m.fighters[1].hp, 90, "the interrupted exchange cannot repeat its light hit");
  assert.ok(m.fighters[1].separationStepCooldown >= 0);
  assert.ok(m.fighters[1].separationStepCooldown < 58);
});

test("a heavy knockdown interrupts Curie Separation Step without resetting its cooldown", () => {
  const m = new Match();
  m.fighters[0].x = -1;
  m.fighters[1].role = "curie";
  m.fighters[1].x = 1;
  m.tick([NEUTRAL, separationStep]);
  assert.equal(m.fighters[1].separationStep, true);
  assert.equal(m.fighters[1].separationStepCooldown, 72);

  m.tick([heavy, NEUTRAL]);
  run(m, 9);
  assert.equal(m.fighters[1].hp, 72);
  assert.equal(m.fighters[1].state, "down");
  assert.equal(m.fighters[1].ticks, 72);
  assert.equal(m.fighters[1].separationStep, false);
  assert.equal(m.fighters[1].separationStepCooldown, 63);

  m.tick([NEUTRAL, NEUTRAL]);
  assert.equal(m.fighters[1].state, "down");
  assert.equal(m.fighters[1].ticks, 71);
  assert.equal(m.fighters[1].separationStepCooldown, 62);
  run(m, 20);
  assert.equal(m.fighters[1].hp, 72, "the interrupted knockdown cannot take a second heavy hit");
  assert.ok(m.fighters[1].separationStepCooldown >= 0);
  assert.ok(m.fighters[1].separationStepCooldown < 62);
});

test("player selection assigns the complementary Nobel fighter and resets a clean round", () => {
  const m = new Match();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["warburg", "opponent"],
    "legacy construction remains Warburg versus the standard opponent",
  );
  m.restart();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["warburg", "opponent"],
    "legacy restart keeps the standard opponent until a Nobel fighter is selected",
  );

  m.fighters[0].hp = 7;
  m.fighters[0].wins = 1;
  m.fighters[0].lactateDriveCooldown = 12;
  m.fighters[1].hp = 3;
  m.fighters[1].wins = 1;
  m.phase = "matchOver";
  m.round = 2;
  m.winner = 1;
  m.selectPlayer("curie");
  assert.equal(m.playerRole, "curie");
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["curie", "warburg"],
  );
  for (const fighter of m.fighters) {
    assert.equal(fighter.hp, 100);
    assert.equal(fighter.wins, 0);
    assert.equal(fighter.state, "idle");
    assert.equal(fighter.ticks, 0);
    assert.equal(fighter.lactateDriveCooldown, 0);
    assert.equal(fighter.separationStepCooldown, 0);
  }
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 1);
  assert.equal(m.winner, null);

  m.selectPlayer("warburg");
  assert.equal(m.playerRole, "warburg");
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["warburg", "curie"],
  );
  assert.throws(() => m.selectPlayer("opponent"), /warburg, curie, or franklin/);
  assert.throws(() => m.selectPlayer("not-a-fighter"), /warburg, curie, or franklin/);
});

test("selected Nobel pair persists through round and both restart paths", () => {
  const m = new Match();
  m.selectPlayer("curie");
  m.fighters[0].wins = 1;
  m.fighters[1].wins = 0;
  m.fighters[1].hp = 0;
  m.phase = "roundOver";
  m.phaseTicks = 119;
  m.tick([NEUTRAL, NEUTRAL]);
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 2);
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["curie", "warburg"],
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [1, 0],
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.hp),
    [100, 100],
  );

  m.restart();
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 1);
  assert.equal(m.winner, null);
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["curie", "warburg"],
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [0, 0],
  );

  m.fighters[0].wins = 2;
  m.fighters[1].hp = 0;
  m.phase = "matchOver";
  m.winner = 0;
  m.restart();
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 1);
  assert.equal(m.winner, null);
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["curie", "warburg"],
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [0, 0],
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.hp),
    [100, 100],
  );
});

test("Franklin is player-only against Warburg and persists through resets", () => {
  const m = new Match();
  m.selectPlayer("franklin");
  assert.equal(m.playerRole, "franklin");
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["franklin", "warburg"],
    "selecting Franklin never assigns her to the AI slot",
  );

  m.fighters[0].wins = 1;
  m.fighters[1].hp = 0;
  m.phase = "roundOver";
  m.phaseTicks = 119;
  m.tick([NEUTRAL, NEUTRAL]);
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["franklin", "warburg"],
    "round reset preserves the selected Franklin-versus-Warburg pair",
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [1, 0],
  );

  m.restart();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["franklin", "warburg"],
    "restart during a match preserves Franklin as the player fighter",
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [0, 0],
  );

  m.fighters[0].wins = 2;
  m.fighters[1].hp = 0;
  m.phase = "matchOver";
  m.winner = 0;
  m.restart();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.role),
    ["franklin", "warburg"],
    "restart after match victory preserves Franklin as the player fighter",
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [0, 0],
  );
});

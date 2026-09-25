import assert from "node:assert/strict";
import { test } from "node:test";
import { Match, NEUTRAL, specialTierForMeter } from "../src/match.ts";
import { SPECIAL_DRAFTS } from "../src/roster/special_drafts.ts";
const light = { ...NEUTRAL, light: true };
const heavy = { ...NEUTRAL, heavy: true };
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
  assert.equal(m.fighters[0].meter, 20);
  assert.equal(m.fighters[1].meter, 12);
  m.restart();
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.tick([NEUTRAL, { ...NEUTRAL, block: true }]);
  m.tick([light, { ...NEUTRAL, block: true }]);
  run(m, 22, NEUTRAL, { ...NEUTRAL, block: true });
  assert.equal(m.fighters[1].hp, 98);
  assert.equal(m.fighters[0].meter, 8);
  assert.equal(m.fighters[1].meter, 10);
});

test("special meter chooses tiers from available meter and only fires on a press edge", () => {
  const m = new Match();
  const special = { ...NEUTRAL, special: true };

  assert.equal(specialTierForMeter(0), 1);
  assert.equal(specialTierForMeter(199), 1);
  assert.equal(specialTierForMeter(200), 2);
  assert.equal(specialTierForMeter(300), 3);

  m.fighters[0].meter = 250;
  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 50, "250 meter selects and spends tier two");
  assert.equal(m.specialReleases[0]?.tier, 2, "release records its selected tier for presentation");

  run(m, 72);
  m.fighters[0].meter = 300;
  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 0, "a new press selects and spends tier three");
  assert.equal(m.specialReleases[0]?.tier, 3, "tier-three releases are explicitly identified");
  m.fighters[0].meter = 300;
  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 300, "a held Special cannot fire repeatedly");
  m.tick([NEUTRAL, NEUTRAL]);

  m.fighters[0].meter = 100;
  m.fighters[0].state = "hit";
  m.fighters[0].ticks = 2;
  m.fighters[0].specialTicks = 0;
  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 100, "Special cannot fire while the fighter is hit");
  m.tick([NEUTRAL, NEUTRAL]);
  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 0, "Special fires once the fighter returns to idle");
});

test("effects are deterministic and expire", () => {
  const first = new Match();
  const second = new Match();
  for (const match of [first, second]) {
    match.fighters[0].id = "curie";
    match.fighters[0].meter = 300;
    match.fighters[0].x = -4;
    match.fighters[1].x = 4;
  }
  const special = { ...NEUTRAL, special: true };
  first.tick([special, NEUTRAL]);
  second.tick([special, NEUTRAL]);
  assert.deepEqual(first.effects, second.effects);
  assert.ok(first.effects.length > 0, "the tier-three projectile sequence is active");
  run(first, 12);
  run(second, 12);
  assert.deepEqual(first.effects, second.effects);
  assert.deepEqual(first.effects, []);

  const guardedZone = new Match();
  guardedZone.fighters[0].id = "curie";
  guardedZone.fighters[0].meter = 200;
  guardedZone.fighters[0].x = 0;
  guardedZone.fighters[1].x = 1.2;
  guardedZone.tick([special, { ...NEUTRAL, block: true }]);
  assert.equal(guardedZone.fighters[1].hp, 100, "guard blocks zone contact");

  const piercing = new Match();
  piercing.fighters[0].id = "franklin";
  piercing.fighters[0].meter = 100;
  piercing.fighters[0].x = -4;
  piercing.fighters[1].x = -1.3;
  piercing.tick([special, { ...NEUTRAL, block: true }]);
  assert.equal(piercing.fighters[1].hp, 84, "ignoresBlock projectile contacts a guard");

  const piercingStun = new Match();
  piercingStun.fighters[0].x = 0;
  piercingStun.fighters[1].x = 1.2;
  piercingStun.effects = [
    {
      kind: "scheduled",
      owner: 0,
      ticks: 0,
      block: { kind: "stun", radius: 2, durationTicks: 12, ignoresBlock: true },
    },
  ];
  piercingStun.tick([NEUTRAL, { ...NEUTRAL, block: true }]);
  assert.equal(piercingStun.fighters[1].state, "hit", "ignoresBlock stun contacts a guard");

  const shielded = new Match();
  shielded.fighters[0].x = 0;
  shielded.fighters[1].x = 1.2;
  shielded.releaseSpecial(0, 1, SPECIAL_DRAFTS.sidney_altman.specials[0]);
  shielded.tick([NEUTRAL, NEUTRAL]);
  assert.equal(
    shielded.effects.some((effect) => effect.kind === "shield"),
    true,
    "shield is active before it is contacted",
  );
  assert.equal(shielded.fighters[1].hp, 100, "shield creation does not fire its counter");
  run(shielded, 10, NEUTRAL, light);
  assert.equal(
    shielded.fighters[1].hp,
    82,
    "shield contact fires its counter instead of firing it on creation",
  );

  const status = new Match();
  status.effects = [
    { kind: "modifier", owner: 0, target: 0, stat: "speed", multiplier: 2, ticks: 1 },
  ];
  status.tick([{ ...NEUTRAL, x: 1 }, NEUTRAL]);
  assert.equal(status.fighters[0].x, -1.61, "a one-tick modifier applies for its full tick");
  assert.deepEqual(status.effects, [], "the one-tick modifier then expires");

  const scheduledStatus = new Match();
  scheduledStatus.effects = [
    {
      kind: "scheduled",
      owner: 0,
      ticks: 0,
      block: {
        kind: "modifier",
        target: "self",
        stat: "speed",
        multiplier: 2,
        durationTicks: 1,
      },
    },
  ];
  scheduledStatus.tick([NEUTRAL, NEUTRAL]);
  assert.equal(scheduledStatus.effects[0].ticks, 1, "scheduled one-tick status survives creation");
  scheduledStatus.tick([{ ...NEUTRAL, x: 1 }, NEUTRAL]);
  assert.equal(scheduledStatus.fighters[0].x, -1.61, "scheduled status applies next action tick");
  assert.deepEqual(scheduledStatus.effects, [], "scheduled one-tick status then expires");

  const shieldedProjectile = new Match();
  shieldedProjectile.fighters[0].x = 0;
  shieldedProjectile.fighters[1].x = 1.2;
  shieldedProjectile.effects = [
    {
      kind: "shield",
      owner: 0,
      block: { kind: "shield", points: 10, durationTicks: 2 },
      points: 10,
      ticks: 2,
    },
    {
      kind: "projectile",
      owner: 1,
      block: {
        kind: "projectile",
        damage: 20,
        range: 2,
        speed: 1.2,
        stunTicks: 8,
        knockback: 0,
      },
      x: 1.2,
      z: 0,
      facing: -Math.PI / 2,
      remaining: 2,
      pattern: undefined,
    },
  ];
  shieldedProjectile.tick([NEUTRAL, NEUTRAL]);
  assert.equal(shieldedProjectile.fighters[0].hp, 90, "projectile contact consumes live shield");

  const counterKnockout = new Match();
  counterKnockout.fighters[0].x = -0.8;
  counterKnockout.fighters[1].x = 0.8;
  counterKnockout.fighters[0].hp = 1;
  counterKnockout.effects = [
    {
      kind: "shield",
      owner: 0,
      block: {
        kind: "shield",
        points: 1,
        durationTicks: 20,
        onHit: [{ kind: "strike", damage: 100, reach: 2, stunTicks: 1, knockback: 0 }],
      },
      points: 1,
      ticks: 20,
    },
  ];
  run(counterKnockout, 10, NEUTRAL, light);
  assert.equal(counterKnockout.phase, "roundOver");
  assert.deepEqual(
    counterKnockout.fighters.map((fighter) => fighter.wins),
    [0, 1],
    "a shield counter cannot resolve after the attacker ends the round",
  );
  assert.deepEqual(counterKnockout.effects, [], "round-end discards pending counter effects");

  const healed = new Match();
  healed.fighters[0].hp = 80;
  healed.fighters[0].damageTaken = 20;
  healed.releaseSpecial(0, 2, SPECIAL_DRAFTS.elizabeth_blackburn.specials[1]);
  healed.tick([NEUTRAL, NEUTRAL]);
  assert.equal(healed.fighters[0].hp, 100);
  assert.equal(healed.fighters[0].damageTaken, 20, "healing does not erase round damageTaken");

  const knockout = new Match();
  knockout.fighters[0].id = "curie";
  knockout.fighters[0].meter = 300;
  knockout.fighters[0].x = -4;
  knockout.fighters[1].x = -1.3;
  knockout.fighters[1].hp = 10;
  knockout.tick([special, NEUTRAL]);
  assert.equal(knockout.phase, "roundOver");
  assert.equal(knockout.fighters[0].wins, 1, "same-tick contacts cannot award repeat wins");
});

test("meter carries through the next round and resets for restart and selection", () => {
  const m = new Match();
  m.fighters[0].meter = 61.5;
  m.fighters[1].meter = 142.25;
  m.fighters[0].x = -0.8;
  m.fighters[1].x = 0.8;
  m.fighters[1].hp = 20;
  m.tick([heavy, NEUTRAL]);
  run(m, 9);
  assert.equal(m.phase, "roundOver");
  const redMeter = m.fighters[0].meter;
  const blueMeter = m.fighters[1].meter;
  run(m, 120);
  assert.equal(m.fighters[0].meter, redMeter);
  assert.equal(m.fighters[1].meter, blueMeter);
  m.restart();
  assert.equal(m.fighters[0].meter, 0);
  assert.equal(m.fighters[1].meter, 0);
  m.fighters[0].meter = 100;
  m.selectPlayer("curie", "warburg");
  assert.equal(m.fighters[0].meter, 0);
  assert.equal(m.fighters[1].meter, 0);
});

test("a held Special does not become a new press across a round reset", () => {
  const m = new Match();
  const special = { ...NEUTRAL, special: true };
  m.fighters[0].meter = 200;
  m.phase = "roundOver";
  m.phaseTicks = 119;

  m.tick([special, NEUTRAL]);
  assert.equal(m.round, 2);
  assert.equal(m.fighters[0].meter, 200);
  assert.equal(m.fighters[0].specialHeld, true);

  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 200, "the held Special does not spend carried meter");
  m.tick([NEUTRAL, NEUTRAL]);
  m.tick([special, NEUTRAL]);
  assert.equal(m.fighters[0].meter, 0, "release and re-press enables the special");
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
  assert.equal(m.fighters[0].id, "warburg");
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
  assert.equal(m.fighters[1].id, "curie");
  assert.equal(m.fighters[1].ticks, 36);
  run(m, 13, NEUTRAL, heavy);
  assert.equal(m.fighters[0].hp, 100, "standard heavy keeps its slower startup");
  m.tick([NEUTRAL, heavy]);
  assert.equal(m.fighters[0].hp, 76);
  assert.equal(m.fighters[0].ticks, 70);
});

test("original specials are selected through the shared meter release", () => {
  const special = { ...NEUTRAL, special: true };
  for (const id of ["warburg", "curie", "franklin"]) {
    for (const [index, meter] of [
      [0, 100],
      [1, 200],
      [2, 300],
    ]) {
      const match = new Match();
      match.fighters[0].id = id;
      match.fighters[0].meter = meter;
      match.tick([special, NEUTRAL]);
      const release = match.specialReleases[0];
      assert.equal(release?.tier, index + 1, `${id} tier ${index + 1} releases from meter`);
      assert.equal(release?.special, SPECIAL_DRAFTS[id].specials[index]);
      assert.ok(release?.special.blocks.length, `${id} tier ${index + 1} has authored blocks`);
    }
  }
});

test("player selection assigns an explicit opponent and resets a clean round", () => {
  const m = new Match();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["warburg", "curie"],
    "construction starts Warburg versus Curie",
  );
  m.restart();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["warburg", "curie"],
    "restart keeps the selected fighter pair",
  );

  m.fighters[0].hp = 7;
  m.fighters[0].wins = 1;
  m.fighters[1].hp = 3;
  m.fighters[1].wins = 1;
  m.phase = "matchOver";
  m.round = 2;
  m.winner = 1;
  m.selectPlayer("curie", "franklin");
  assert.equal(m.playerId, "curie");
  assert.equal(m.opponentId, "franklin");
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["curie", "franklin"],
  );
  for (const fighter of m.fighters) {
    assert.equal(fighter.hp, 100);
    assert.equal(fighter.wins, 0);
    assert.equal(fighter.state, "idle");
    assert.equal(fighter.ticks, 0);
  }
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 1);
  assert.equal(m.winner, null);

  m.selectPlayer("warburg", "curie");
  assert.equal(m.playerId, "warburg");
  assert.equal(m.opponentId, "curie");
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["warburg", "curie"],
  );
  assert.throws(() => m.selectPlayer("opponent", "curie"), /Unknown fighter id/);
  assert.throws(() => m.selectPlayer("warburg", "not-a-fighter"), /Unknown fighter id/);
  assert.throws(() => m.selectPlayer("warburg", "warburg"), /own opponent/);
});

test("selected explicit pair persists through round and both restart paths", () => {
  const m = new Match();
  m.selectPlayer("curie", "franklin");
  m.fighters[0].wins = 1;
  m.fighters[1].wins = 0;
  m.fighters[1].hp = 0;
  m.phase = "roundOver";
  m.phaseTicks = 119;
  m.tick([NEUTRAL, NEUTRAL]);
  assert.equal(m.phase, "fight");
  assert.equal(m.round, 2);
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["curie", "franklin"],
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
    m.fighters.map((fighter) => fighter.id),
    ["curie", "franklin"],
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
    m.fighters.map((fighter) => fighter.id),
    ["curie", "franklin"],
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

test("selected Franklin pair persists through resets", () => {
  const m = new Match();
  m.selectPlayer("franklin", "curie");
  assert.equal(m.playerId, "franklin");
  assert.equal(m.opponentId, "curie");
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["franklin", "curie"],
  );

  m.fighters[0].wins = 1;
  m.fighters[1].hp = 0;
  m.phase = "roundOver";
  m.phaseTicks = 119;
  m.tick([NEUTRAL, NEUTRAL]);
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["franklin", "curie"],
    "round reset preserves the selected explicit pair",
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [1, 0],
  );

  m.restart();
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.id),
    ["franklin", "curie"],
    "restart during a match preserves the selected explicit pair",
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
    m.fighters.map((fighter) => fighter.id),
    ["franklin", "curie"],
    "restart after match victory preserves the selected explicit pair",
  );
  assert.deepEqual(
    m.fighters.map((fighter) => fighter.wins),
    [0, 0],
  );
});

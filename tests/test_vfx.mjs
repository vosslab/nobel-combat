import assert from "node:assert/strict";
import { test } from "node:test";
import { NullEngine, Scene } from "@babylonjs/core";
import { Match } from "../src/match.ts";
import { SpecialVfx, vfxOperationsForEffects } from "../src/vfx.ts";

function projectileEffect(pattern) {
  return {
    kind: "projectile",
    owner: 0,
    block: {
      kind: "projectile",
      damage: 1,
      range: 8,
      speed: 2,
      stunTicks: 0,
      knockback: 0,
      pattern,
    },
    x: 2,
    z: -1,
    facing: Math.PI / 6,
    remaining: 8,
    pattern,
  };
}

test("every projectile pattern has a distinct generic projection", () => {
  const fighters = new Match().fighters;
  const patterns = [
    "single",
    "paired",
    "fan",
    "cross",
    "ring",
    "spiral",
    "returning",
    "alternating",
  ];
  const projections = new Map(
    patterns.map((pattern) => [
      pattern,
      vfxOperationsForEffects([projectileEffect(pattern)], fighters),
    ]),
  );

  assert.equal(projections.size, patterns.length);
  assert.ok(
    [...projections.values()].every((operations) => operations.length > 0),
    "every declared pattern creates at least one visible operation",
  );
  const signatures = new Set(
    [...projections.values()].map((operations) =>
      operations
        .map(
          (operation) =>
            `${operation.shape}:${operation.origin.x.toFixed(2)}:${operation.origin.z.toFixed(2)}`,
        )
        .join(","),
    ),
  );
  assert.equal(signatures.size, patterns.length, "patterns have distinct geometry signatures");

  const single = projections.get("single");
  const implicitSingle = vfxOperationsForEffects([projectileEffect(undefined)], fighters);
  assert.deepEqual(implicitSingle, single, "an omitted pattern preserves the single projection");
});

test("overlapping ring projectiles render every effect operation", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const vfx = new SpecialVfx(scene);
  const fighters = new Match().fighters;
  const effects = [projectileEffect("ring"), projectileEffect("ring"), projectileEffect("ring")];
  const expectedOperations = vfxOperationsForEffects(effects, fighters);

  vfx.syncEffects(effects, fighters);

  assert.equal(vfx.activeCount, expectedOperations.length);
  scene.dispose();
  engine.dispose();
});

import assert from "node:assert/strict";
import test from "node:test";

import { fighterById, ROSTER } from "../src/roster/roster.ts";

const fighters = Object.values(ROSTER);
const fighterIds = new Set(fighters.map((fighter) => fighter.id));

test("roster keys and fighter ids are unique and agree", () => {
  assert.equal(fighters.length, fighterIds.size);
  for (const [key, fighter] of Object.entries(ROSTER)) {
    assert.equal(key, fighter.id);
    assert.equal(fighterById(key), fighter);
  }
});

test("each fighter has three specials", () => {
  for (const fighter of fighters) assert.equal(fighter.specials.length, 3);
});

test("unlock rules reference roster ids and every fighter is reachable", () => {
  for (const fighter of fighters) {
    if (fighter.unlock.kind !== "winAs") continue;
    for (const prerequisite of fighter.unlock.fighterIds) {
      assert.ok(fighterIds.has(prerequisite), `${fighter.id} references ${prerequisite}`);
    }
  }

  const reachable = new Set(
    fighters.filter((fighter) => fighter.unlock.kind === "starter").map((fighter) => fighter.id),
  );
  assert.ok(reachable.size > 0, "roster needs at least one starter");
  let changed = true;
  while (changed) {
    changed = false;
    for (const fighter of fighters) {
      if (reachable.has(fighter.id)) continue;
      const rule = fighter.unlock;
      const canUnlock =
        rule.kind === "winAs"
          ? rule.fighterIds.every((prerequisite) => reachable.has(prerequisite))
          : rule.kind === "wins" &&
            Number.isSafeInteger(rule.count) &&
            rule.count >= 0 &&
            reachable.size > 0;
      if (canUnlock) {
        reachable.add(fighter.id);
        changed = true;
      }
    }
  }

  assert.deepEqual([...reachable].sort(), [...fighterIds].sort());
});

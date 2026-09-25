import assert from "node:assert/strict";
import { test } from "node:test";

import { unlockHint } from "../src/ui/chooser.ts";

test("unlock hints describe each registry rule without duplicating progression logic", () => {
  assert.equal(unlockHint({ kind: "starter" }), "Available now");
  assert.equal(unlockHint({ kind: "wins", count: 1 }), "Win 1 match");
  assert.equal(unlockHint({ kind: "wins", count: 3 }), "Win 3 matches");
  assert.equal(
    unlockHint({ kind: "winAs", fighterIds: ["warburg", "curie"] }),
    "Win as Otto Heinrich Warburg or Marie Curie",
  );
});

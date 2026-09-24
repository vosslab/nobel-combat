import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeFranklinUnlock,
  encodeFranklinUnlock,
  lockedFranklinUnlock,
  recordNobelMatchWin,
} from "../src/franklin_unlock.ts";

const locked = () => lockedFranklinUnlock();

test("missing and malformed unlock records fail closed", () => {
  for (const value of [null, "", "{", "null", "true", "[]", "42", '"warburg"']) {
    const state = decodeFranklinUnlock(value);
    assert.equal(state.unlocked, false, `expected ${String(value)} to remain locked`);
    assert.deepEqual(state.record.wonRoles, []);
  }
});

test("unlock decoder rejects unknown versions, fields, and impossible role data", () => {
  const invalid = [
    { version: 2, wonRoles: [] },
    { version: 1, wonRoles: [], ignored: true },
    { version: 1 },
    { version: 1, wonRoles: "warburg" },
    { version: 1, wonRoles: {} },
    { version: 1, wonRoles: null },
    { version: "1", wonRoles: [] },
    { version: 1, wonRoles: ["franklin"] },
    { version: 1, wonRoles: ["opponent"] },
    { version: 1, wonRoles: ["warburg", "warburg"] },
    { version: 1, wonRoles: ["warburg", "curie", "warburg"] },
    { version: 1, wonRoles: ["warburg", 7] },
  ];
  for (const value of invalid) {
    const state = decodeFranklinUnlock(JSON.stringify(value));
    assert.equal(state.unlocked, false, `expected ${JSON.stringify(value)} to remain locked`);
    assert.deepEqual(state.record.wonRoles, []);
  }
});

test("unlock decoder rejects duplicate top-level JSON keys after escape decoding", () => {
  for (const value of [
    '{"version":1,"version":1,"wonRoles":[]}',
    '{"version":1,"\\u0076ersion":1,"wonRoles":[]}',
    '{"version":1,"wonRoles":[],"wonRoles":[]}',
  ]) {
    const state = decodeFranklinUnlock(value);
    assert.equal(state.unlocked, false, `expected ${value} to remain locked`);
    assert.deepEqual(state.record.wonRoles, []);
  }
});

test("either distinct Nobel win order unlocks Franklin", () => {
  const warburgThenCurie = recordNobelMatchWin(recordNobelMatchWin(locked(), "warburg"), "curie");
  const curieThenWarburg = recordNobelMatchWin(recordNobelMatchWin(locked(), "curie"), "warburg");
  assert.equal(warburgThenCurie.unlocked, true);
  assert.equal(curieThenWarburg.unlocked, true);
  assert.deepEqual(warburgThenCurie.record.wonRoles, ["warburg", "curie"]);
  assert.deepEqual(curieThenWarburg.record.wonRoles, ["warburg", "curie"]);
});

test("duplicate and repeated winner notifications are idempotent", () => {
  const oneWin = recordNobelMatchWin(locked(), "warburg");
  const duplicate = recordNobelMatchWin(oneWin, "warburg");
  const unlocked = recordNobelMatchWin(duplicate, "curie");
  assert.deepEqual(duplicate, oneWin);
  assert.deepEqual(recordNobelMatchWin(unlocked, "curie"), unlocked);
  assert.deepEqual(recordNobelMatchWin(unlocked, "warburg"), unlocked);
});

test("only Nobel fighter roles can reduce a valid record", () => {
  const state = recordNobelMatchWin(locked(), "franklin");
  assert.equal(state.unlocked, false);
  assert.deepEqual(state.record.wonRoles, []);
});

test("encode and decode preserve a valid unlock record", () => {
  const initiallyLocked = locked();
  const partial = recordNobelMatchWin(initiallyLocked, "warburg");
  const original = recordNobelMatchWin(recordNobelMatchWin(locked(), "warburg"), "curie");
  assert.deepEqual(decodeFranklinUnlock(encodeFranklinUnlock(initiallyLocked)), initiallyLocked);
  assert.deepEqual(decodeFranklinUnlock(encodeFranklinUnlock(partial)), partial);
  assert.deepEqual(decodeFranklinUnlock(encodeFranklinUnlock(original)), original);
});

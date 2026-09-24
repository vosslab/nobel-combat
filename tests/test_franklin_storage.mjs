import assert from "node:assert/strict";
import { test } from "node:test";
import { lockedFranklinUnlock, recordNobelMatchWin } from "../src/franklin_unlock.ts";
import {
  FRANKLIN_UNLOCK_STORAGE_KEY,
  readFranklinUnlock,
  writeFranklinUnlock,
} from "../src/franklin_storage.ts";

function storageWith(value) {
  const values = new Map([[FRANKLIN_UNLOCK_STORAGE_KEY, value]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, next) => values.set(key, next),
    values,
  };
}

test("storage reads strict valid records and locks ordinary missing or invalid records", () => {
  const valid = storageWith('{"version":1,"wonRoles":["warburg","curie"]}');
  assert.deepEqual(
    readFranklinUnlock(() => valid),
    {
      state: { record: { version: 1, wonRoles: ["warburg", "curie"] }, unlocked: true },
      readFailed: false,
    },
  );

  for (const value of [null, "{", '{"version":2,"wonRoles":[]}']) {
    const result = readFranklinUnlock(() => storageWith(value));
    assert.deepEqual(result.state, lockedFranklinUnlock());
    assert.equal(result.readFailed, false);
  }
});

test("storage read failures are distinct from ordinary locked records", () => {
  for (const provider of [
    () => {
      throw new Error("localStorage getter denied");
    },
    () => ({
      getItem: () => {
        throw new Error("getItem denied");
      },
      setItem: () => undefined,
    }),
  ]) {
    const result = readFranklinUnlock(provider);
    assert.deepEqual(result.state, lockedFranklinUnlock());
    assert.equal(result.readFailed, true);
  }
});

test("storage writes only encoded bounded records and returns an explicit result", () => {
  const storage = storageWith(null);
  const partial = recordNobelMatchWin(lockedFranklinUnlock(), "warburg");
  assert.deepEqual(
    writeFranklinUnlock(partial, () => storage),
    { written: true },
  );
  assert.equal(
    storage.values.get(FRANKLIN_UNLOCK_STORAGE_KEY),
    '{"version":1,"wonRoles":["warburg"]}',
  );
  assert.deepEqual(readFranklinUnlock(() => storage).state, partial);

  const invalidState = { record: { version: 1, wonRoles: ["franklin"] }, unlocked: false };
  assert.deepEqual(
    writeFranklinUnlock(invalidState, () => storage),
    { written: false },
  );
  assert.equal(
    storage.values.get(FRANKLIN_UNLOCK_STORAGE_KEY),
    '{"version":1,"wonRoles":["warburg"]}',
  );
});

test("storage write failures are contained and report no durable write", () => {
  const state = recordNobelMatchWin(lockedFranklinUnlock(), "warburg");
  for (const provider of [
    () => {
      throw new Error("localStorage getter denied");
    },
    () => ({
      getItem: () => null,
      setItem: () => {
        throw new Error("setItem denied");
      },
    }),
  ]) {
    assert.deepEqual(writeFranklinUnlock(state, provider), { written: false });
  }
});

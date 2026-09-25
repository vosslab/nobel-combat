import assert from "node:assert/strict";
import { test } from "node:test";
import { PROGRESS_STORAGE_KEY, readProgress, writeProgress } from "../src/progress/storage.ts";
import {
  decodeProgress,
  encodeProgress,
  isUnlockRuleSatisfied,
  recordPlayerMatchWin,
  starterProgress,
} from "../src/progress/unlocks.ts";
import { consumeCompletedPlayerMatchWin } from "../src/progress/progression.ts";
import { ROSTER } from "../src/roster/roster.ts";

const matchOver = (playerId, winner = 0, previousPhase = "fight") => ({
  previousPhase,
  phase: "matchOver",
  winner,
  playerId,
});

function storageWith(value) {
  const values = new Map([[PROGRESS_STORAGE_KEY, value]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, next) => values.set(key, next),
    values,
  };
}

test("v2 progress round-trips and derives the roster unlock set", () => {
  const partial = recordPlayerMatchWin(starterProgress(), "warburg");
  const complete = recordPlayerMatchWin(partial, "curie");
  const unlockedIds = Object.values(ROSTER)
    .filter(({ unlock }) => isUnlockRuleSatisfied(complete.record, unlock))
    .map(({ id }) => id);
  assert.deepEqual(decodeProgress(encodeProgress(partial)), partial);
  assert.deepEqual(complete.record, { version: 2, wonAs: ["warburg", "curie"], wins: 2 });
  assert.equal(complete.unlockedSet.has("franklin"), true);
  assert.deepEqual([...complete.unlockedSet], unlockedIds);
});

test("v2 decoder rejects malformed, duplicate, and legacy records", () => {
  const rejected = [
    null,
    "",
    "{",
    '{"version":1,"wonRoles":["warburg","curie"]}',
    '{"version":2,"version":2,"wonAs":[],"wins":0}',
    '{"version":2,"\\u0076ersion":2,"wonAs":[],"wins":0}',
    '{"version":2,"wonAs":["warburg","warburg"],"wins":1}',
    '{"version":2,"wonAs":["unknown"],"wins":1}',
    '{"version":2,"wonAs":[],"wins":-1}',
    '{"version":2,"wonAs":[],"wins":1.5}',
    '{"version":2,"wonAs":[],"wins":0,"extra":true}',
  ];
  for (const value of rejected) assert.deepEqual(decodeProgress(value), starterProgress());
});

test("winAs and wins rules use the recorded fighter set and total wins", () => {
  const oneWin = recordPlayerMatchWin(starterProgress(), "warburg");
  const twoWins = recordPlayerMatchWin(oneWin, "warburg");
  assert.equal(
    isUnlockRuleSatisfied(oneWin.record, { kind: "winAs", fighterIds: ["warburg", "curie"] }),
    false,
  );
  assert.equal(isUnlockRuleSatisfied(twoWins.record, { kind: "wins", count: 2 }), true);
  assert.equal(isUnlockRuleSatisfied(twoWins.record, { kind: "wins", count: 3 }), false);
  assert.deepEqual(twoWins.record, { version: 2, wonAs: ["warburg"], wins: 2 });
});

test("storage failures leave only starters unlocked", () => {
  const stored = storageWith('{"version":2,"wonAs":["warburg"],"wins":1}');
  assert.deepEqual(
    readProgress(() => stored).state,
    recordPlayerMatchWin(starterProgress(), "warburg"),
  );
  assert.equal(
    writeProgress(recordPlayerMatchWin(starterProgress(), "warburg"), () => stored).written,
    true,
  );

  for (const provider of [
    () => {
      throw new Error("storage denied");
    },
    () => ({
      getItem: () => {
        throw new Error("getItem denied");
      },
      setItem: () => {
        throw new Error("setItem denied");
      },
    }),
  ]) {
    assert.deepEqual(readProgress(provider).state, starterProgress());
    assert.deepEqual(writeProgress(starterProgress(), provider), { written: false });
  }
});

test("a player match win is exposed only after a durable write", () => {
  const initial = starterProgress();
  const failed = consumeCompletedPlayerMatchWin(matchOver("warburg"), initial, true, () => false);
  assert.deepEqual(failed, {
    state: starterProgress(),
    progressionAvailable: false,
    committed: false,
  });

  const commits = [];
  const first = consumeCompletedPlayerMatchWin(matchOver("warburg"), initial, true, (next) => {
    commits.push(next);
    return true;
  });
  const second = consumeCompletedPlayerMatchWin(matchOver("warburg"), first.state, true, (next) => {
    commits.push(next);
    return true;
  });
  assert.equal(second.committed, true);
  assert.deepEqual(second.state.record, { version: 2, wonAs: ["warburg"], wins: 2 });
  assert.deepEqual(commits, [first.state, second.state]);
});

test("only a new player match-over edge can write progress", () => {
  const initial = starterProgress();
  for (const event of [
    matchOver("warburg", 1),
    matchOver("warburg", 0, "matchOver"),
    { previousPhase: "fight", phase: "roundOver", winner: 0, playerId: "warburg" },
  ]) {
    let writes = 0;
    const result = consumeCompletedPlayerMatchWin(event, initial, true, () => (++writes, true));
    assert.deepEqual(result.state, initial);
    assert.equal(writes, 0);
  }
});

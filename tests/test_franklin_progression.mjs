import assert from "node:assert/strict";
import { test } from "node:test";
import { lockedFranklinUnlock, recordNobelMatchWin } from "../src/franklin_unlock.ts";
import { consumeCompletedNobelMatchWin } from "../src/franklin_progression.ts";

const matchOver = (playerRole, winner = 0, previousPhase = "fight") => ({
  previousPhase,
  phase: "matchOver",
  winner,
  playerRole,
});

test("eligible Warburg and Curie complete-match edges persist either prerequisite order", () => {
  for (const roles of [
    ["warburg", "curie"],
    ["curie", "warburg"],
  ]) {
    let state = lockedFranklinUnlock();
    const writes = [];
    for (const role of roles) {
      const result = consumeCompletedNobelMatchWin(
        matchOver(role),
        state,
        true,
        (next) => (writes.push(next), true),
      );
      assert.equal(result.committed, true);
      assert.equal(result.progressionAvailable, true);
      state = result.state;
    }
    assert.equal(state.unlocked, true);
    assert.equal(writes.length, 2);
    assert.deepEqual(writes[1].record.wonRoles, ["warburg", "curie"]);
  }
});

test("only a new ordinary player match-over edge records progress once", () => {
  const locked = lockedFranklinUnlock();
  const ignored = [
    { previousPhase: "fight", phase: "roundOver", winner: 0, playerRole: "warburg" },
    matchOver("warburg", 1),
    matchOver("franklin"),
    matchOver("warburg", 0, "matchOver"),
    { previousPhase: "roundOver", phase: "fight", winner: null, playerRole: "warburg" },
  ];
  for (const event of ignored) {
    let writes = 0;
    const result = consumeCompletedNobelMatchWin(event, locked, true, () => (++writes, true));
    assert.deepEqual(result.state, locked);
    assert.equal(result.committed, false);
    assert.equal(writes, 0);
  }

  const first = consumeCompletedNobelMatchWin(matchOver("warburg"), locked, true, () => true);
  let duplicateWrites = 0;
  const duplicate = consumeCompletedNobelMatchWin(
    matchOver("warburg"),
    first.state,
    true,
    () => (++duplicateWrites, true),
  );
  assert.equal(duplicate.committed, false);
  assert.equal(duplicateWrites, 0);
});

test("durable failure and denied startup availability fail closed without an unlock", () => {
  const locked = lockedFranklinUnlock();
  let writes = 0;
  const deniedStartup = consumeCompletedNobelMatchWin(matchOver("warburg"), locked, false, () => {
    writes++;
    return true;
  });
  assert.equal(deniedStartup.committed, false);
  assert.equal(deniedStartup.progressionAvailable, false);
  assert.equal(writes, 0);

  const failedWrite = consumeCompletedNobelMatchWin(
    matchOver("warburg"),
    locked,
    true,
    () => false,
  );
  assert.deepEqual(failedWrite.state, locked);
  assert.equal(failedWrite.committed, false);
  assert.equal(failedWrite.progressionAvailable, false);

  const later = consumeCompletedNobelMatchWin(matchOver("curie"), failedWrite.state, false, () => {
    writes++;
    return true;
  });
  assert.equal(later.committed, false);
  assert.equal(writes, 0);
});

test("the unlocked record is reported only after a changed successful durable write", () => {
  const partial = recordNobelMatchWin(lockedFranklinUnlock(), "warburg");
  const commits = [];
  const result = consumeCompletedNobelMatchWin(matchOver("curie"), partial, true, (next) => {
    commits.push(next);
    return true;
  });
  assert.equal(result.committed, true);
  assert.equal(result.state.unlocked, true);
  assert.deepEqual(commits, [result.state]);
});

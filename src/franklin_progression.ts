import { recordNobelMatchWin } from "./franklin_unlock";
import type { FranklinUnlockState } from "./franklin_unlock";
import type { Phase, PlayerFighterRole } from "./match";

export type FranklinProgressionEvent = Readonly<{
  previousPhase: Phase;
  phase: Phase;
  winner: number | null;
  playerRole: PlayerFighterRole;
}>;

export type FranklinProgressionResult = Readonly<{
  state: FranklinUnlockState;
  progressionAvailable: boolean;
  committed: boolean;
}>;

/**
 * ASVS V2.3.1: accepts progress only from the one legal simulation edge into
 * a completed player match, then commits the changed record before exposing it.
 */
export function consumeCompletedNobelMatchWin(
  event: FranklinProgressionEvent,
  state: FranklinUnlockState,
  progressionAvailable: boolean,
  write: (next: FranklinUnlockState) => boolean,
): FranklinProgressionResult {
  if (
    !progressionAvailable ||
    event.previousPhase === "matchOver" ||
    event.phase !== "matchOver" ||
    event.winner !== 0 ||
    (event.playerRole !== "warburg" && event.playerRole !== "curie")
  ) {
    return { state, progressionAvailable, committed: false };
  }

  const next = recordNobelMatchWin(state, event.playerRole);
  if (next.record.wonRoles.length === state.record.wonRoles.length) {
    return { state, progressionAvailable, committed: false };
  }
  if (!write(next)) return { state, progressionAvailable: false, committed: false };
  return { state: next, progressionAvailable: true, committed: true };
}

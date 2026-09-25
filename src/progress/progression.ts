import { starterProgress, recordPlayerMatchWin } from "./unlocks";
import type { ProgressState } from "./unlocks";
import type { Phase } from "../match";
import { isFighterId } from "../roster/roster";
import type { FighterId } from "../roster/roster";

export type ProgressionEvent = Readonly<{
  previousPhase: Phase;
  phase: Phase;
  winner: number | null;
  playerId: FighterId;
}>;

export type ProgressionResult = Readonly<{
  state: ProgressState;
  progressionAvailable: boolean;
  committed: boolean;
}>;

/**
 * Accept progress only from the simulation edge that completes a player match.
 * The caller may reveal an unlock only after this function reports a durable commit.
 */
export function consumeCompletedPlayerMatchWin(
  event: ProgressionEvent,
  state: ProgressState,
  progressionAvailable: boolean,
  write: (next: ProgressState) => boolean,
): ProgressionResult {
  if (
    !progressionAvailable ||
    event.previousPhase === "matchOver" ||
    event.phase !== "matchOver" ||
    event.winner !== 0 ||
    !isFighterId(event.playerId)
  ) {
    return { state, progressionAvailable, committed: false };
  }

  const next = recordPlayerMatchWin(state, event.playerId);
  if (!write(next)) {
    return { state: starterProgress(), progressionAvailable: false, committed: false };
  }
  return { state: next, progressionAvailable: true, committed: true };
}

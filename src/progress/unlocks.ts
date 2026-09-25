import { ROSTER, isFighterId } from "../roster/roster";
import type { FighterId } from "../roster/roster";
import type { UnlockRule } from "../roster/fighter_def";

export const PROGRESS_VERSION = 2;

export type ProgressRecord = Readonly<{
  version: typeof PROGRESS_VERSION;
  wonAs: FighterId[];
  wins: number;
}>;

export type ProgressState = Readonly<{
  record: ProgressRecord;
  unlockedSet: ReadonlySet<FighterId>;
}>;

const FIGHTER_IDS = Object.keys(ROSTER) as FighterId[];

function topLevelKeysAreUnique(value: string): boolean {
  let index = 0;
  const skipWhitespace = (): void => {
    while (/\s/.test(value[index] ?? "")) index++;
  };
  const readString = (): string | null => {
    if (value[index] !== '"') return null;
    const start = index++;
    while (index < value.length) {
      if (value[index] === "\\") index += 2;
      else if (value[index++] === '"') return value.slice(start, index);
    }
    return null;
  };

  skipWhitespace();
  if (value[index++] !== "{") return true;
  const keys = new Set<string>();
  while (true) {
    skipWhitespace();
    if (value[index] === "}") return true;
    const rawKey = readString();
    if (rawKey === null) return true;
    try {
      const key: unknown = JSON.parse(rawKey);
      if (typeof key === "string" && (keys.has(key) || (keys.add(key), false))) return false;
    } catch {
      return true;
    }
    skipWhitespace();
    if (value[index++] !== ":") return true;

    let depth = 1;
    while (index < value.length) {
      const character = value[index];
      if (character === '"') {
        if (readString() === null) return true;
      } else {
        index++;
        if (character === "{" || character === "[") depth++;
        if (character === "}" || character === "]") depth--;
        if (depth === 0) return true;
        if (depth === 1 && character === ",") break;
      }
    }
    if (index >= value.length) return true;
  }
}

function isProgressRecord(value: unknown): value is ProgressRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (entries.length !== 3 || !("version" in value) || !("wonAs" in value) || !("wins" in value)) {
    return false;
  }
  const { version, wonAs, wins } = value as Record<string, unknown>;
  return (
    version === PROGRESS_VERSION &&
    Array.isArray(wonAs) &&
    wonAs.length <= FIGHTER_IDS.length &&
    wonAs.every(isFighterId) &&
    new Set(wonAs).size === wonAs.length &&
    typeof wins === "number" &&
    Number.isSafeInteger(wins) &&
    wins >= 0
  );
}

export function isUnlockRuleSatisfied(record: ProgressRecord, rule: UnlockRule): boolean {
  return (
    rule.kind === "starter" ||
    (rule.kind === "winAs" &&
      rule.fighterIds.every(
        (required) => isFighterId(required) && record.wonAs.includes(required),
      )) ||
    (rule.kind === "wins" && record.wins >= rule.count)
  );
}

function unlockedSet(record: ProgressRecord): ReadonlySet<FighterId> {
  const unlocked = new Set<FighterId>();
  for (const id of FIGHTER_IDS) {
    if (isUnlockRuleSatisfied(record, ROSTER[id].unlock)) unlocked.add(id);
  }
  return unlocked;
}

function makeState(wonAs: readonly FighterId[], wins: number): ProgressState {
  const record: ProgressRecord = {
    version: PROGRESS_VERSION,
    wonAs: FIGHTER_IDS.filter((id) => wonAs.includes(id)),
    wins,
  };
  return { record, unlockedSet: unlockedSet(record) };
}

export function starterProgress(): ProgressState {
  return makeState([], 0);
}

export function decodeProgress(value: string | null): ProgressState {
  if (value === null) return starterProgress();
  try {
    if (!topLevelKeysAreUnique(value)) return starterProgress();
    const decoded: unknown = JSON.parse(value);
    return isProgressRecord(decoded) ? makeState(decoded.wonAs, decoded.wins) : starterProgress();
  } catch {
    return starterProgress();
  }
}

function sameSet(left: ReadonlySet<FighterId>, right: ReadonlySet<FighterId>): boolean {
  return left.size === right.size && [...left].every((id) => right.has(id));
}

function isProgressState(value: unknown): value is ProgressState {
  if (
    typeof value !== "object" ||
    value === null ||
    !("record" in value) ||
    !("unlockedSet" in value)
  ) {
    return false;
  }
  const { record, unlockedSet: derived } = value as Record<string, unknown>;
  if (!isProgressRecord(record) || !(derived instanceof Set) || ![...derived].every(isFighterId))
    return false;
  return sameSet(derived, unlockedSet(record));
}

export function encodeProgress(state: ProgressState): string {
  if (!isProgressState(state)) throw new TypeError("Progress state must contain a valid record");
  return JSON.stringify(state.record);
}

export function recordPlayerMatchWin(state: ProgressState, id: FighterId): ProgressState {
  if (!isProgressState(state) || !isFighterId(id)) return starterProgress();
  return makeState([...state.record.wonAs, id], state.record.wins + 1);
}

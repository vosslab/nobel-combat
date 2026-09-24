import type { NobelFighterRole } from "./match";

export const FRANKLIN_UNLOCK_VERSION = 1;

export type FranklinUnlockRecord = {
  version: typeof FRANKLIN_UNLOCK_VERSION;
  wonRoles: NobelFighterRole[];
};

export type FranklinUnlockState = {
  record: FranklinUnlockRecord;
  unlocked: boolean;
};

const NOBEL_ROLES: readonly NobelFighterRole[] = ["warburg", "curie"];

function topLevelKeysAreUnique(value: string): boolean {
  let index = 0;
  const skipWhitespace = (): void => {
    while (/\s/.test(value[index] ?? "")) index++;
  };
  const readString = (): string | null => {
    if (value[index] !== '"') return null;
    const start = index++;
    while (index < value.length) {
      if (value[index] === "\\") {
        index += 2;
      } else if (value[index++] === '"') {
        return value.slice(start, index);
      }
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

function isNobelRole(value: unknown): value is NobelFighterRole {
  return typeof value === "string" && NOBEL_ROLES.includes(value as NobelFighterRole);
}

function isRecord(value: unknown): value is FranklinUnlockRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (entries.length !== 2 || !("version" in value) || !("wonRoles" in value)) return false;
  const { version, wonRoles } = value as Record<string, unknown>;
  if (version !== FRANKLIN_UNLOCK_VERSION || !Array.isArray(wonRoles)) return false;
  if (wonRoles.length > NOBEL_ROLES.length || !wonRoles.every(isNobelRole)) return false;
  return new Set(wonRoles).size === wonRoles.length;
}

function makeState(wonRoles: NobelFighterRole[]): FranklinUnlockState {
  const record: FranklinUnlockRecord = {
    version: FRANKLIN_UNLOCK_VERSION,
    wonRoles: NOBEL_ROLES.filter((role) => wonRoles.includes(role)),
  };
  return { record, unlocked: record.wonRoles.length === NOBEL_ROLES.length };
}

export function lockedFranklinUnlock(): FranklinUnlockState {
  return makeState([]);
}

export function decodeFranklinUnlock(value: string | null): FranklinUnlockState {
  if (value === null) return lockedFranklinUnlock();
  try {
    if (!topLevelKeysAreUnique(value)) return lockedFranklinUnlock();
    const decoded: unknown = JSON.parse(value);
    return isRecord(decoded) ? makeState(decoded.wonRoles) : lockedFranklinUnlock();
  } catch {
    return lockedFranklinUnlock();
  }
}

export function encodeFranklinUnlock(state: FranklinUnlockState): string {
  if (!isRecord(state.record))
    throw new TypeError("Franklin unlock state must contain a valid record");
  if (state.unlocked !== (state.record.wonRoles.length === NOBEL_ROLES.length)) {
    throw new TypeError("Franklin unlock state must agree with its record");
  }
  return JSON.stringify(state.record);
}

export function recordNobelMatchWin(
  state: FranklinUnlockState,
  role: NobelFighterRole,
): FranklinUnlockState {
  if (
    !isRecord(state.record) ||
    state.unlocked !== (state.record.wonRoles.length === NOBEL_ROLES.length)
  ) {
    return lockedFranklinUnlock();
  }
  if (!isNobelRole(role)) return makeState(state.record.wonRoles);
  return makeState([...state.record.wonRoles, role]);
}

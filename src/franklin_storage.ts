import {
  FRANKLIN_UNLOCK_VERSION,
  decodeFranklinUnlock,
  encodeFranklinUnlock,
  lockedFranklinUnlock,
} from "./franklin_unlock";
import type { FranklinUnlockState } from "./franklin_unlock";

export const FRANKLIN_UNLOCK_STORAGE_KEY = `nobel-combat.franklin-unlock.v${FRANKLIN_UNLOCK_VERSION}`;

export type FranklinUnlockStorage = Pick<Storage, "getItem" | "setItem">;
export type FranklinUnlockStorageProvider = () => FranklinUnlockStorage;

export type FranklinUnlockReadResult = {
  state: FranklinUnlockState;
  readFailed: boolean;
};

export type FranklinUnlockWriteResult = {
  written: boolean;
};

const browserStorage = (): FranklinUnlockStorage => window.localStorage;

/**
 * ASVS V1.5.2/V2.2.1: stored JSON is accepted only through the reducer's
 * strict allowlisted decoder. ASVS V14.3.3: this key holds only a version and
 * non-sensitive Nobel-role win flags. ASVS V16.5.2/.3: denied storage leaves
 * the game locked and playable. F6B owns the V2.3.1 progression sequence.
 */
export function readFranklinUnlock(
  provider: FranklinUnlockStorageProvider = browserStorage,
): FranklinUnlockReadResult {
  try {
    const value: unknown = provider().getItem(FRANKLIN_UNLOCK_STORAGE_KEY);
    return {
      state:
        typeof value === "string" || value === null
          ? decodeFranklinUnlock(value)
          : lockedFranklinUnlock(),
      readFailed: false,
    };
  } catch {
    return { state: lockedFranklinUnlock(), readFailed: true };
  }
}

export function writeFranklinUnlock(
  state: FranklinUnlockState,
  provider: FranklinUnlockStorageProvider = browserStorage,
): FranklinUnlockWriteResult {
  try {
    const value = encodeFranklinUnlock(state);
    provider().setItem(FRANKLIN_UNLOCK_STORAGE_KEY, value);
    return { written: true };
  } catch {
    return { written: false };
  }
}

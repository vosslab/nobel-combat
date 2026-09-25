import { decodeProgress, encodeProgress, starterProgress } from "./unlocks";
import type { ProgressState } from "./unlocks";

export const PROGRESS_STORAGE_KEY = "nobel-combat.progress.v2";

export type ProgressStorage = Pick<Storage, "getItem" | "setItem">;
export type ProgressStorageProvider = () => ProgressStorage;

export type ProgressReadResult = Readonly<{
  state: ProgressState;
  readFailed: boolean;
}>;

export type ProgressWriteResult = Readonly<{
  written: boolean;
}>;

const browserStorage = (): ProgressStorage => window.localStorage;

export function readProgress(
  provider: ProgressStorageProvider = browserStorage,
): ProgressReadResult {
  try {
    const value: unknown = provider().getItem(PROGRESS_STORAGE_KEY);
    return {
      state:
        typeof value === "string" || value === null ? decodeProgress(value) : starterProgress(),
      readFailed: false,
    };
  } catch {
    return { state: starterProgress(), readFailed: true };
  }
}

export function writeProgress(
  state: ProgressState,
  provider: ProgressStorageProvider = browserStorage,
): ProgressWriteResult {
  try {
    provider().setItem(PROGRESS_STORAGE_KEY, encodeProgress(state));
    return { written: true };
  } catch {
    return { written: false };
  }
}

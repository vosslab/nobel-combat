import type { FighterDef } from "./fighter_def";
import { FIGHTERS_GENETICS_MOLECULAR_BIOLOGY } from "./fighters_genetics_molecular_biology";
import { FIGHTERS_ORIGINALS } from "./fighters_originals";

export const ROSTER = {
  ...FIGHTERS_ORIGINALS,
  ...FIGHTERS_GENETICS_MOLECULAR_BIOLOGY,
} satisfies Readonly<Record<string, FighterDef>>;

export type FighterId = keyof typeof ROSTER;

export function isFighterId(value: unknown): value is FighterId {
  const valid = typeof value === "string" && Object.prototype.hasOwnProperty.call(ROSTER, value);
  return valid;
}

export function fighterById(id: FighterId): FighterDef {
  const fighter = ROSTER[id];
  return fighter;
}

import type { FighterDef } from "./fighter_def";
import { FIGHTERS_CELL_BIOLOGY_NEUROSCIENCE } from "./fighters_cell_biology_neuroscience";
import { FIGHTERS_GENETICS_MOLECULAR_BIOLOGY } from "./fighters_genetics_molecular_biology";
import { FIGHTERS_ORIGINALS } from "./fighters_originals";
import { FIGHTERS_PHYSICS_ENERGY } from "./fighters_physics_energy";

export const ROSTER = {
  ...FIGHTERS_ORIGINALS,
  ...FIGHTERS_CELL_BIOLOGY_NEUROSCIENCE,
  ...FIGHTERS_GENETICS_MOLECULAR_BIOLOGY,
  ...FIGHTERS_PHYSICS_ENERGY,
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

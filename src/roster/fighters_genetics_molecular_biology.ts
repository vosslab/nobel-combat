import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type GeneticsMolecularBiologyFighterId = "barbara_mcclintock";

export const FIGHTERS_GENETICS_MOLECULAR_BIOLOGY = {
  barbara_mcclintock: {
    id: "barbara_mcclintock",
    name: "Barbara McClintock",
    category: "genetics_molecular_biology",
    prize: {
      category: "physiology_medicine",
      year: 1983,
      citation: "for her discovery of mobile genetic elements",
      url: "https://www.nobelprize.org/prizes/medicine/1983/summary/",
    },
    verb: "transposes",
    body: "assets/models/mesh2motion_mcclintock.glb",
    height: 1.65,
    stats: SPECIAL_DRAFTS.barbara_mcclintock.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.barbara_mcclintock.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [8, 2.5, 2.1],
    },
    unlock: { kind: "starter" },
  },
} satisfies Record<GeneticsMolecularBiologyFighterId, FighterDef>;

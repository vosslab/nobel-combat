import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type CellBiologyNeuroscienceFighterId = "linda_buck";

export const FIGHTERS_CELL_BIOLOGY_NEUROSCIENCE = {
  linda_buck: {
    id: "linda_buck",
    name: "Linda B. Buck",
    category: "cell_biology_neuroscience",
    prize: {
      category: "physiology_medicine",
      year: 2004,
      citation:
        "for their discoveries of odorant receptors and the organization of the olfactory system",
      url: "https://www.nobelprize.org/prizes/medicine/2004/summary/",
    },
    verb: "smells",
    body: "assets/models/mesh2motion_buck_2002.glb",
    portrait: "assets/portraits/buck.png",
    height: 1.68,
    stats: SPECIAL_DRAFTS.linda_buck.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.linda_buck.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.4,
      heavyChance: 0.25,
      specialRange: [7, 5.5, 3.2],
    },
    unlock: { kind: "starter" },
  },
} satisfies Record<CellBiologyNeuroscienceFighterId, FighterDef>;

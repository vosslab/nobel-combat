import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type CellBiologyNeuroscienceFighterId = "rita_levi_montalcini" | "linda_buck";

export const FIGHTERS_CELL_BIOLOGY_NEUROSCIENCE = {
  rita_levi_montalcini: {
    id: "rita_levi_montalcini",
    name: "Rita Levi-Montalcini",
    category: "cell_biology_neuroscience",
    prize: {
      category: "physiology_medicine",
      year: 1986,
      citation: "for their discoveries of growth factors",
      url: "https://www.nobelprize.org/prizes/medicine/1986/levi-montalcini/facts/",
    },
    verb: "sprouts",
    body: "assets/models/mesh2motion_levi_montalcini_1950s.glb",
    portrait: "assets/portraits/levi_montalcini.png",
    height: 1.65,
    stats: SPECIAL_DRAFTS.rita_levi_montalcini.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.rita_levi_montalcini.specials,
    ai: {
      preferredRange: 1.7,
      blockChance: 0.42,
      heavyChance: 0.29,
      specialRange: [6, 4.8, 3.1],
    },
    unlock: { kind: "winAs", fighterIds: ["linda_buck"] },
  },
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

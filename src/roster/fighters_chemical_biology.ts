import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type ChemicalBiologyFighterId = "carolyn_bertozzi" | "k_barry_sharpless";

export const FIGHTERS_CHEMICAL_BIOLOGY = {
  carolyn_bertozzi: {
    id: "carolyn_bertozzi",
    name: "Carolyn R. Bertozzi",
    category: "chemical_biology",
    prize: {
      category: "chemistry",
      year: 2022,
      citation: "for the development of click chemistry and bioorthogonal chemistry",
      url: "https://www.nobelprize.org/prizes/chemistry/2022/bertozzi/facts/",
    },
    verb: "clicks",
    body: "assets/models/mesh2motion_bertozzi_2022.glb",
    portrait: "assets/portraits/bertozzi.png",
    height: 1.7,
    stats: SPECIAL_DRAFTS.carolyn_bertozzi.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.carolyn_bertozzi.specials,
    ai: {
      preferredRange: 1.5,
      blockChance: 0.42,
      heavyChance: 0.28,
      specialRange: [5, 4.5, 3],
    },
    unlock: { kind: "winAs", fighterIds: ["curie"] },
  },
  k_barry_sharpless: {
    id: "k_barry_sharpless",
    name: "K. Barry Sharpless",
    category: "chemical_biology",
    prize: {
      category: "chemistry",
      year: 2001,
      citation: "for his work on chirally catalysed oxidation reactions",
      url: "https://www.nobelprize.org/prizes/chemistry/2001/sharpless/facts/",
    },
    verb: "reacts",
    body: "assets/models/mesh2motion_sharpless_2018.glb",
    portrait: "assets/portraits/sharpless.png",
    height: 1.78,
    stats: SPECIAL_DRAFTS.k_barry_sharpless.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.k_barry_sharpless.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.42,
      heavyChance: 0.28,
      specialRange: [2.5, 7, 3],
    },
    unlock: { kind: "winAs", fighterIds: ["carolyn_bertozzi"] },
  },
} satisfies Record<ChemicalBiologyFighterId, FighterDef>;

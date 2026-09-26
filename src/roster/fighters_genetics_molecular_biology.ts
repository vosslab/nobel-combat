import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type GeneticsMolecularBiologyFighterId = "barbara_mcclintock" | "jennifer_doudna";

export const FIGHTERS_GENETICS_MOLECULAR_BIOLOGY = {
  jennifer_doudna: {
    id: "jennifer_doudna",
    name: "Jennifer Doudna",
    category: "genetics_molecular_biology",
    prize: {
      category: "chemistry",
      year: 2020,
      citation: "for the development of a method for genome editing",
      url: "https://www.nobelprize.org/prizes/chemistry/2020/doudna/facts/",
    },
    verb: "edits",
    body: "assets/models/mesh2motion_doudna_2018.glb",
    portrait: "assets/portraits/doudna.png",
    height: 1.68,
    stats: SPECIAL_DRAFTS.jennifer_doudna.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.jennifer_doudna.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [8, 9, 2.6],
    },
    unlock: { kind: "winAs", fighterIds: ["barbara_mcclintock"] },
  },
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
    portrait: "assets/portraits/mcclintock.png",
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

import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type StructuralBiologyBiochemistryFighterId = "dorothy_crowfoot_hodgkin";

export const FIGHTERS_STRUCTURAL_BIOLOGY_BIOCHEMISTRY = {
  dorothy_crowfoot_hodgkin: {
    id: "dorothy_crowfoot_hodgkin",
    name: "Dorothy Crowfoot Hodgkin",
    category: "structural_biology_biochemistry",
    prize: {
      category: "chemistry",
      year: 1964,
      citation:
        "for her determinations by X-ray techniques of the structures of important biochemical substances",
      url: "https://www.nobelprize.org/prizes/chemistry/1964/hodgkin/facts/",
    },
    verb: "diffracts",
    body: "assets/models/mesh2motion_hodgkin_1970.glb",
    portrait: "assets/portraits/hodgkin.png",
    height: 1.65,
    stats: SPECIAL_DRAFTS.dorothy_crowfoot_hodgkin.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.dorothy_crowfoot_hodgkin.specials,
    ai: {
      preferredRange: 1.75,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [8, 3.2, 2.8],
    },
    unlock: { kind: "starter" },
  },
} satisfies Record<StructuralBiologyBiochemistryFighterId, FighterDef>;

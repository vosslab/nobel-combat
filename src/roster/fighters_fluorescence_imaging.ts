import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type FluorescenceImagingFighterId = "roger_tsien";

export const FIGHTERS_FLUORESCENCE_IMAGING = {
  roger_tsien: {
    id: "roger_tsien",
    name: "Roger Y. Tsien",
    category: "fluorescence_imaging",
    prize: {
      category: "chemistry",
      year: 2008,
      citation: "for the discovery and development of the green fluorescent protein, GFP",
      url: "https://www.nobelprize.org/prizes/chemistry/2008/tsien/facts/",
    },
    verb: "fluoresces",
    body: "assets/models/mesh2motion_tsien_2008.glb",
    portrait: "assets/portraits/tsien.png",
    height: 1.75,
    stats: SPECIAL_DRAFTS.roger_tsien.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.roger_tsien.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [4, 5.5, 3.2],
    },
    unlock: { kind: "winAs", fighterIds: ["dorothy_crowfoot_hodgkin"] },
    appearance: { glasses: { style: "wire", offset: [0, 0, -0.035] } },
  },
} satisfies Record<FluorescenceImagingFighterId, FighterDef>;

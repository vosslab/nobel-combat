import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type OriginalFighterId = "warburg" | "curie" | "franklin";

export const FIGHTERS_ORIGINALS = {
  warburg: {
    id: "warburg",
    name: "Otto Heinrich Warburg",
    category: "originals",
    prize: {
      category: "physiology_medicine",
      year: 1931,
      citation: "for the discovery of the nature and mode of action of the respiratory enzyme",
      url: "https://www.nobelprize.org/prizes/medicine/1931/summary/",
    },
    verb: "transfers oxygen",
    body: "assets/models/mesh2motion_doctor_m.glb",
    height: 1.8,
    stats: SPECIAL_DRAFTS.warburg.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.warburg.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [2.45, 3.2, 2.45],
    },
    unlock: { kind: "starter" },
    appearance: { prop: "manometer" },
  },
  curie: {
    id: "curie",
    name: "Marie Curie",
    category: "originals",
    prize: {
      category: "chemistry",
      year: 1911,
      citation:
        "for the discovery of radium and polonium, the isolation of radium, and the study of radium's nature and compounds",
      url: "https://www.nobelprize.org/prizes/chemistry/1911/summary/",
    },
    verb: "separates elements",
    body: "assets/models/mesh2motion_female_31.glb",
    height: 1.62,
    stats: SPECIAL_DRAFTS.curie.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.curie.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [1.95, 2.8, 7],
    },
    unlock: { kind: "starter" },
  },
  franklin: {
    id: "franklin",
    name: "Rosalind Franklin",
    category: "originals",
    prize: null,
    verb: "diffracts DNA",
    body: "assets/models/mesh2motion_female_9.glb",
    height: 1.7,
    stats: SPECIAL_DRAFTS.franklin.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.franklin.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.45,
      heavyChance: 0.3,
      specialRange: [8, 2.4, 3],
    },
    unlock: { kind: "winAs", fighterIds: ["warburg", "curie"] },
  },
} satisfies Record<OriginalFighterId, FighterDef>;

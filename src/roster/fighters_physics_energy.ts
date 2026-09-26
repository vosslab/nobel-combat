import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type PhysicsEnergyFighterId = "john_b_goodenough";

export const FIGHTERS_PHYSICS_ENERGY = {
  john_b_goodenough: {
    id: "john_b_goodenough",
    name: "John B. Goodenough",
    category: "physics_energy",
    prize: {
      category: "chemistry",
      year: 2019,
      citation: "for the development of lithium-ion batteries",
      url: "https://www.nobelprize.org/prizes/chemistry/2019/summary/",
    },
    verb: "charges",
    body: "assets/models/mesh2motion_goodenough_1964.glb",
    portrait: "assets/portraits/goodenough.png",
    height: 1.8,
    stats: SPECIAL_DRAFTS.john_b_goodenough.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.john_b_goodenough.specials,
    ai: {
      preferredRange: 1.55,
      blockChance: 0.5,
      heavyChance: 0.35,
      specialRange: [1.55, 1.55, 4.2],
    },
    unlock: { kind: "starter" },
  },
} satisfies Record<PhysicsEnergyFighterId, FighterDef>;

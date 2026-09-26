import type { FighterDef } from "./fighter_def";
import { SPECIAL_DRAFTS } from "./special_drafts";

type PhysicsEnergyFighterId = "john_b_goodenough" | "donna_strickland";

export const FIGHTERS_PHYSICS_ENERGY = {
  donna_strickland: {
    id: "donna_strickland",
    name: "Donna Strickland",
    category: "physics_energy",
    prize: {
      category: "physics",
      year: 2018,
      citation: "for their method of generating high-intensity, ultra-short optical pulses",
      url: "https://www.nobelprize.org/prizes/physics/2018/summary/",
    },
    verb: "amplifies",
    body: "assets/models/mesh2motion_strickland_1985.glb",
    portrait: "assets/portraits/strickland.png",
    height: 1.65,
    stats: SPECIAL_DRAFTS.donna_strickland.stats,
    meterGain: 1,
    specials: SPECIAL_DRAFTS.donna_strickland.specials,
    ai: {
      preferredRange: 1.7,
      blockChance: 0.42,
      heavyChance: 0.28,
      specialRange: [7, 1.7, 6],
    },
    unlock: { kind: "winAs", fighterIds: ["john_b_goodenough"] },
    appearance: { glasses: { style: "rectangular", offset: [0, 0, -0.065] } },
  },
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

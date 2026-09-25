import type {
  Block,
  BlockOptions,
  DraftFighterId,
  FighterDraft,
  FighterStats,
  ProjectilePattern,
  SpecialDef,
  SpecialPose,
} from "./fighter_def";

const STANDARD_STATS: FighterStats = {
  light: {
    ticks: 22,
    activeWindow: { first: 10, last: 15 },
    reach: 1.8,
    damage: 10,
    blockedDamage: 2,
    stunTicks: 18,
    knockback: 0.25,
  },
  heavy: {
    ticks: 36,
    activeWindow: { first: 15, last: 22 },
    reach: 2.2,
    damage: 24,
    blockedDamage: 5,
    stunTicks: 70,
    knockback: 0.65,
  },
};

const QUICK_STATS: FighterStats = {
  light: {
    ticks: 19,
    activeWindow: { first: 8, last: 13 },
    reach: 1.8,
    damage: 9,
    blockedDamage: 2,
    stunTicks: 15,
    knockback: 0.2,
  },
  heavy: {
    ticks: 32,
    activeWindow: { first: 13, last: 20 },
    reach: 2.05,
    damage: 21,
    blockedDamage: 4,
    stunTicks: 62,
    knockback: 0.55,
  },
};

const POWER_STATS: FighterStats = {
  light: STANDARD_STATS.light,
  heavy: {
    ticks: 40,
    activeWindow: { first: 17, last: 25 },
    reach: 2.35,
    damage: 28,
    blockedDamage: 6,
    stunTicks: 72,
    knockback: 0.75,
  },
};

const REACH_STATS: FighterStats = {
  light: {
    ...STANDARD_STATS.light,
    reach: 2.0,
  },
  heavy: {
    ticks: 38,
    activeWindow: { first: 16, last: 23 },
    reach: 2.6,
    damage: 22,
    blockedDamage: 5,
    stunTicks: 68,
    knockback: 0.6,
  },
};

const WARBURG_STATS: FighterStats = {
  light: STANDARD_STATS.light,
  heavy: {
    ticks: 32,
    activeWindow: { first: 16, last: 23 },
    reach: 2.45,
    damage: 28,
    blockedDamage: 6,
    stunTicks: 72,
    knockback: 0.65,
  },
};

type ProjectileOptions = BlockOptions &
  Readonly<{
    speed?: number;
    stunTicks?: number;
    knockback?: number;
    pattern?: ProjectilePattern;
  }>;

type ZoneOptions = BlockOptions &
  Readonly<{
    stunTicks?: number;
    knockback?: number;
  }>;

function strikeBlock(
  damage: number,
  reach: number,
  stunTicks: number,
  knockback: number,
  options: BlockOptions = {},
): Block {
  const block: Block = {
    kind: "strike",
    damage,
    reach,
    stunTicks,
    knockback,
    ...options,
  };
  return block;
}

function projectileBlock(damage: number, range: number, options: ProjectileOptions = {}): Block {
  const block: Block = {
    ...options,
    kind: "projectile",
    damage,
    range,
    speed: options.speed ?? 2.4,
    stunTicks: options.stunTicks ?? 12,
    knockback: options.knockback ?? 0.25,
  };
  return block;
}

function zoneBlock(
  damage: number,
  radius: number,
  durationTicks: number,
  options: ZoneOptions = {},
): Block {
  const block: Block = {
    ...options,
    kind: "zone",
    damage,
    radius,
    durationTicks,
    stunTicks: options.stunTicks ?? 0,
    knockback: options.knockback ?? 0,
  };
  return block;
}

function stunBlock(radius: number, durationTicks: number, options: BlockOptions = {}): Block {
  const block: Block = { kind: "stun", radius, durationTicks, ...options };
  return block;
}

function repositionBlock(
  direction: "behindOpponent" | "towardOpponent" | "awayFromOpponent",
  distance: number,
  options: BlockOptions = {},
): Block {
  const block: Block = { kind: "reposition", direction, distance, ...options };
  return block;
}

function shieldBlock(points: number, durationTicks: number, options: BlockOptions = {}): Block {
  const block: Block = { kind: "shield", points, durationTicks, ...options };
  return block;
}

function healBlock(amount: number, options: BlockOptions = {}): Block {
  const block: Block = { kind: "heal", amount, ...options };
  return block;
}

function modifierBlock(
  target: "self" | "opponent",
  stat: "damage" | "speed" | "defense",
  multiplier: number,
  durationTicks: number,
  options: BlockOptions = {},
): Block {
  const block: Block = { kind: "modifier", target, stat, multiplier, durationTicks, ...options };
  return block;
}

function special(
  name: string,
  caption: string,
  pose: SpecialPose,
  ticks: number,
  blocks: readonly Block[],
  meterRefund?: number,
): SpecialDef {
  const definition: SpecialDef = {
    name,
    caption,
    pose,
    ticks,
    blocks,
    ...(meterRefund === undefined ? {} : { meterRefund }),
  };
  return definition;
}

function fighterDraft(
  stats: FighterStats,
  first: SpecialDef,
  second: SpecialDef,
  third: SpecialDef,
): FighterDraft {
  const draft: FighterDraft = { stats, specials: [first, second, third] };
  return draft;
}

export const SPECIAL_DRAFTS: Readonly<Record<DraftFighterId, FighterDraft>> = {
  warburg: fighterDraft(
    WARBURG_STATS,
    special("Lactate Drive", "The fast lane is paved with lactate.", "light", 24, [
      repositionBlock("towardOpponent", 2, {
        onHit: [strikeBlock(18, 2, 14, 0.4)],
      }),
    ]),
    special("Aerobic Glycolysis", "Oxygen is optional; the sprint is not.", "block", 72, [
      modifierBlock("self", "speed", 1.2, 72),
    ]),
    special("Oxygen Transfer Surge", "One enzyme, one very long reach.", "heavy", 32, [
      strikeBlock(28, 2.45, 72, 0.65, {
        onHit: [zoneBlock(8, 1.4, 18)],
      }),
    ]),
  ),
  curie: fighterDraft(
    STANDARD_STATS,
    special("Separation Step", "A careful separation, at unsafe speed.", "light", 24, [
      strikeBlock(16, 1.95, 16, 0.25),
    ]),
    special("Radium Glow", "Now glowing. Still not safe to approach.", "block", 48, [
      zoneBlock(3, 2.8, 60, {
        repeat: 5,
        onHit: [modifierBlock("opponent", "speed", 0.65, 60)],
      }),
    ]),
    special("Polonium Burst", "A tiny nucleus makes a huge entrance.", "heavy", 36, [
      projectileBlock(18, 7, { pattern: "ring", repeat: 3, speed: 2.7 }),
    ]),
  ),
  franklin: fighterDraft(
    STANDARD_STATS,
    special("Photo 51", "The X is the spot. The spot is everywhere.", "heavy", 36, [
      projectileBlock(16, 8, {
        pattern: "cross",
        ignoresBlock: true,
        speed: 2.8,
      }),
    ]),
    special("Crystal Fiber", "The diffraction pattern says: hold still.", "block", 42, [
      stunBlock(2.4, 42),
    ]),
    special("Double Helix", "Two strands arrive. Personal space leaves.", "heavy", 48, [
      zoneBlock(10, 2.5, 24, { onHit: [strikeBlock(14, 2.5, 24, 0.5)] }),
    ]),
  ),
  david_baker: fighterDraft(
    STANDARD_STATS,
    special(
      "Rosetta Fold",
      "I asked the amino acids nicely, and they formed a hammer.",
      "heavy",
      34,
      [strikeBlock(18, 2.2, 22, 0.35)],
    ),
    special("De Novo Design", "Specification received: one extremely rude umbrella.", "light", 38, [
      projectileBlock(17, 7, {
        pattern: "spiral",
        onHit: [strikeBlock(12, 1.8, 16, 0.3)],
      }),
    ]),
    special("Top7", "Evolution did not submit this blueprint, but the arena did.", "heavy", 48, [
      stunBlock(2.2, 28),
      zoneBlock(24, 2.5, 18, { delay: 12, knockback: 0.8 }),
    ]),
  ),
  thomas_steitz: fighterDraft(
    POWER_STATS,
    special(
      "50S Slam",
      "The large subunit has entered the chat at terminal velocity.",
      "heavy",
      38,
      [zoneBlock(16, 2.2, 12, { onHit: [strikeBlock(12, 2.2, 28, 0.7)] })],
    ),
    special("Peptidyl Transferase", "One more peptide bond, with feeling.", "light", 30, [
      strikeBlock(14, 3, 18, 0.2, { repeat: 2 }),
    ]),
    special(
      "Translation Termination",
      "Stop codon found. Please exit the ribosome in an orderly fashion.",
      "heavy",
      50,
      [stunBlock(2.4, 32), strikeBlock(22, 2.4, 30, 0.9, { delay: 18 })],
    ),
  ),
  joachim_frank: fighterDraft(
    STANDARD_STATS,
    special("Vitrification", "Please remain perfectly still while becoming glassy.", "block", 36, [
      stunBlock(2, 36),
    ]),
    special(
      "Particle Average",
      "After several hundred takes, that punch is finally in focus.",
      "block",
      42,
      [modifierBlock("self", "damage", 1.35, 96), shieldBlock(8, 30)],
    ),
    special(
      "3D Reconstruction",
      "Your bad side has been computationally averaged away.",
      "heavy",
      48,
      [zoneBlock(20, 2.5, 18, { onHit: [strikeBlock(14, 2.5, 24, 0.65)] })],
    ),
  ),
  dorothy_crowfoot_hodgkin: fighterDraft(
    REACH_STATS,
    special(
      "X-Ray Diffraction",
      "The pattern is beautiful. The damage report is less so.",
      "heavy",
      36,
      [projectileBlock(14, 8, { pattern: "cross", repeat: 1, speed: 3 })],
    ),
    special(
      "Electron Density",
      "You are now constrained by a very persuasive contour map.",
      "block",
      48,
      [
        zoneBlock(2, 3.2, 72, {
          repeat: 5,
          onHit: [modifierBlock("opponent", "speed", 0.6, 48)],
        }),
      ],
    ),
    special(
      "Vitamin B12",
      "A vitamin is technically not supposed to land this hard.",
      "heavy",
      52,
      [zoneBlock(28, 2.8, 16, { delay: 20, knockback: 1 })],
    ),
  ),
  christian_anfinsen: fighterDraft(
    QUICK_STATS,
    special(
      "Denaturation",
      "A little unfolding never hurt anyone in a cartoon arena.",
      "light",
      32,
      [modifierBlock("opponent", "damage", 0.7, 84), modifierBlock("opponent", "speed", 0.75, 84)],
    ),
    special(
      "Sequence Determines Structure",
      "The instructions were in the sequence the whole time.",
      "heavy",
      40,
      [
        projectileBlock(18, 7, {
          pattern: "spiral",
          onHit: [strikeBlock(10, 1.8, 18, 0.35)],
        }),
      ],
    ),
    special(
      "Anfinsen's Dogma",
      "I unfolded for dramatic effect and refolded behind you.",
      "light",
      38,
      [
        repositionBlock("behindOpponent", 1.2, {
          onHit: [strikeBlock(24, 2, 30, 0.7)],
        }),
      ],
    ),
  ),
  jennifer_doudna: fighterDraft(
    QUICK_STATS,
    special("Guide RNA", "Target acquired: one extremely rude chromosome.", "light", 32, [
      projectileBlock(8, 9, {
        homing: true,
        onHit: [stunBlock(1.2, 16)],
      }),
    ]),
    special("Cas9 Cleavage", "Molecular scissors, now with arena-sized handles.", "heavy", 38, [
      projectileBlock(14, 8, {
        homing: true,
        onHit: [strikeBlock(22, 1.8, 28, 0.65)],
      }),
    ]),
    special("CRISPR Rewrite", "Patch notes: opponent now has fewer good ideas.", "block", 48, [
      zoneBlock(8, 2.6, 18, {
        onHit: [modifierBlock("opponent", "damage", 0.6, 90)],
      }),
    ]),
  ),
  barbara_mcclintock: fighterDraft(
    QUICK_STATS,
    special("Ac/Ds", "Two tiny troublemakers changed seats again.", "light", 34, [
      projectileBlock(12, 8, {
        homing: true,
        motif: "helix",
        pattern: "paired",
        speed: 0.4,
        onHit: [modifierBlock("opponent", "speed", 0.7, 54)],
      }),
    ]),
    special("Maize Chromosome", "Corn has entered the chat, chromosomally.", "heavy", 42, [
      zoneBlock(14, 2.5, 14, {
        motif: "maize_chromosome",
        onHit: [strikeBlock(14, 2.5, 24, 0.65)],
      }),
    ]),
    special(
      "TRANSPOSON",
      "Position changed. Please do not ask where the old position went.",
      "light",
      34,
      [
        repositionBlock("behindOpponent", 1.2, {
          motif: "chromosome",
          onHit: [strikeBlock(25, 2.1, 30, 0.75)],
        }),
      ],
    ),
  ),
  elizabeth_blackburn: fighterDraft(
    STANDARD_STATS,
    special("Telomere Cap", "End caps installed. Warranty refuses to cover punches.", "block", 40, [
      shieldBlock(24, 96),
    ]),
    special("Telomerase", "One tiny, entirely game-only refill.", "block", 42, [healBlock(24)]),
    special("Replicative Senescence", "You have divided too many times this round.", "heavy", 50, [
      zoneBlock(9, 3, 30, {
        repeat: 2,
        onHit: [
          modifierBlock("opponent", "speed", 0.55, 96),
          modifierBlock("opponent", "damage", 0.7, 96),
        ],
      }),
    ]),
  ),
  katalin_kariko: fighterDraft(
    STANDARD_STATS,
    special("Modified Nucleoside", "One letter swapped; drama reduced.", "light", 34, [
      projectileBlock(18, 8, { ignoresBlock: true, pattern: "spiral" }),
    ]),
    special("Lipid Nanoparticle", "The bubble mail has arrived.", "heavy", 42, [
      projectileBlock(12, 7, { pattern: "ring", repeat: 3, speed: 2.2 }),
    ]),
    special(
      "mRNA Translation",
      "Ribosome, please assemble a ridiculous amount of confetti.",
      "heavy",
      46,
      [
        projectileBlock(14, 8, {
          homing: true,
          onHit: [modifierBlock("opponent", "damage", 0.65, 84)],
        }),
      ],
    ),
  ),
  sidney_altman: fighterDraft(
    STANDARD_STATS,
    special("RNase P", "Protein called in sick; RNA covered the shift.", "block", 38, [
      shieldBlock(10, 30, {
        onHit: [strikeBlock(18, 2.2, 20, 0.4)],
      }),
    ]),
    special("RNA Catalyst", "The arena has far too many self-starters.", "heavy", 42, [
      zoneBlock(4, 2.4, 54, { repeat: 5, onHit: [strikeBlock(8, 2.4, 10, 0.15)] }),
    ]),
    special("RNA Is the Enzyme", "Surprise: the enzyme brought no protein.", "heavy", 46, [
      strikeBlock(30, 2.8, 36, 0.9, { ignoresBlock: true }),
    ]),
  ),
  thomas_cech: fighterDraft(
    QUICK_STATS,
    special("Group I Intron", "This loop has a very personal boundary issue.", "light", 34, [
      stunBlock(2, 26, { onHit: [modifierBlock("opponent", "speed", 0.7, 48)] }),
    ]),
    special("Self-Splice", "Excuse me while I remove myself from this situation.", "block", 32, [
      repositionBlock("awayFromOpponent", 2.2, {
        onHit: [strikeBlock(17, 2.4, 18, 0.4)],
      }),
    ]),
    special("Ribozyme", "Folded, catalytic, and extremely dramatic.", "heavy", 44, [
      projectileBlock(28, 7, { ignoresBlock: true, pattern: "spiral" }),
    ]),
  ),
  david_baltimore: fighterDraft(
    STANDARD_STATS,
    special(
      "Reverse Transcriptase",
      "The arrow has changed its mind and its alphabet.",
      "heavy",
      38,
      [projectileBlock(22, 8, { homing: true, pattern: "returning", speed: 2.6 })],
    ),
    special(
      "Proviral Integration",
      "A blinking marker has filed the world's least welcome paperwork.",
      "light",
      42,
      [
        projectileBlock(10, 7, {
          delay: 36,
          onHit: [zoneBlock(12, 2, 48, { repeat: 3 })],
        }),
      ],
    ),
    special(
      "Central Dogma Reversed",
      "Arrows are now pointing the wrong way on purpose.",
      "heavy",
      48,
      [
        modifierBlock("opponent", "speed", 0.65, 72),
        projectileBlock(24, 8, { delay: 12, ignoresBlock: true }),
      ],
    ),
  ),
  rita_levi_montalcini: fighterDraft(
    STANDARD_STATS,
    special("NGF", "The nerves have decided to branch out.", "light", 38, [
      projectileBlock(9, 8, { homing: true, pattern: "spiral", repeat: 2 }),
    ]),
    special("Axon Guidance", "Every wrong turn becomes a dendrite.", "heavy", 42, [
      projectileBlock(18, 10, { homing: true, speed: 3.1 }),
    ]),
    special("Growth Factor", "One tiny signal; suddenly the arena needs pruning.", "heavy", 52, [
      zoneBlock(16, 3.4, 36, {
        repeat: 3,
        onHit: [stunBlock(1.4, 14)],
      }),
    ]),
  ),
  linda_buck: fighterDraft(
    QUICK_STATS,
    special(
      "Odorant Receptor",
      "That smell has a name, an address, and nowhere to hide.",
      "light",
      34,
      [projectileBlock(12, 9, { homing: true, ignoresBlock: true })],
    ),
    special(
      "Combinatorial Code",
      "Three notes make a chord. This chord makes everyone leave.",
      "heavy",
      40,
      [projectileBlock(7, 7, { pattern: "fan", repeat: 3, speed: 2.2 })],
    ),
    special("OLFACTORY OVERLOAD", "The nose filed a group complaint.", "heavy", 50, [
      zoneBlock(28, 3, 18, { stunTicks: 30, knockback: 0.9 }),
    ]),
  ),
  carolyn_bertozzi: fighterDraft(
    STANDARD_STATS,
    special(
      "Bioorthogonal Reaction",
      "Everything else is chemistry; you are the only tagged atom.",
      "light",
      34,
      [projectileBlock(20, 8, { ignoresBlock: true, homing: true })],
    ),
    special("Click", "Two harmless pieces. One extremely committed connection.", "heavy", 38, [
      projectileBlock(12, 7, {
        pattern: "paired",
        onHit: [strikeBlock(18, 1.8, 24, 0.55)],
      }),
    ]),
    special(
      "Glycocalyx",
      "Surface sugars: now with arena-sized fluorescent upholstery.",
      "heavy",
      48,
      [
        zoneBlock(8, 2.8, 24, {
          onHit: [modifierBlock("opponent", "speed", 0.6, 84)],
        }),
      ],
    ),
  ),
  k_barry_sharpless: fighterDraft(
    POWER_STATS,
    special(
      "Sharpless Epoxidation",
      "One oxygen atom, placed with unreasonable confidence.",
      "heavy",
      38,
      [strikeBlock(22, 2.5, 26, 0.65, { onHit: [zoneBlock(8, 1.6, 18)] })],
    ),
    special(
      "Click",
      "The projectiles were merely introductions; the bond did the paperwork.",
      "light",
      34,
      [
        projectileBlock(13, 7, {
          pattern: "paired",
          repeat: 1,
          onHit: [strikeBlock(18, 1.8, 20, 0.5)],
        }),
      ],
    ),
    special(
      "Second Nobel",
      "The combo ended in 2001. Then the meter remembered 2022.",
      "heavy",
      48,
      [
        strikeBlock(20, 2.4, 24, 0.6),
        projectileBlock(24, 8, { delay: 30, pattern: "paired", ignoresBlock: true }),
      ],
      100,
    ),
  ),
  roger_tsien: fighterDraft(
    REACH_STATS,
    special("GFP", "You are now fluorescent green. Stealth has left the chat.", "block", 42, [
      zoneBlock(4, 3, 60, {
        repeat: 5,
        onHit: [modifierBlock("opponent", "defense", 0.65, 72)],
      }),
    ]),
    special(
      "Calcium Indicator",
      "Your calcium spike is showing. I have already graphed the next move.",
      "light",
      38,
      [
        projectileBlock(14, 9, {
          homing: true,
          onHit: [modifierBlock("opponent", "speed", 0.65, 54)],
        }),
      ],
    ),
    special(
      "Fluorescent Palette",
      "The paintbox has eight channels, and every one is your problem.",
      "heavy",
      48,
      [
        projectileBlock(10, 8, {
          pattern: "alternating",
          repeat: 5,
          onHit: [zoneBlock(14, 2.2, 18)],
        }),
      ],
    ),
  ),
  dennis_gabor: fighterDraft(
    REACH_STATS,
    special(
      "Interference Pattern",
      "Congratulations: your wavefront has developed an argument with mine.",
      "heavy",
      38,
      [projectileBlock(14, 9, { pattern: "cross", repeat: 1, speed: 2.8 })],
    ),
    special(
      "Holographic Double",
      "This duplicate is three-dimensional and somehow better at blocking.",
      "block",
      38,
      [shieldBlock(18, 42), repositionBlock("awayFromOpponent", 1.4)],
    ),
    special(
      "Wavefront Reconstruction",
      "The smudge was the whole plan. Please meet the reconstructed department.",
      "heavy",
      52,
      [
        zoneBlock(16, 3, 30, {
          repeat: 4,
          onHit: [strikeBlock(10, 3, 16, 0.45)],
        }),
      ],
    ),
  ),
  john_b_goodenough: fighterDraft(
    POWER_STATS,
    special("Lithium Ion", "Charge accumulates. The gloves stay on.", "block", 40, [
      shieldBlock(14, 48),
      modifierBlock("self", "damage", 1.2, 60),
    ]),
    special("Cobalt Oxide Cathode", "High voltage behind a very solid shield.", "block", 42, [
      shieldBlock(30, 72),
    ]),
    special("FULLY CHARGED", "Every hit taken comes back with interest.", "heavy", 48, [
      strikeBlock(24, 4.2, 72, 1.1, { scaleWith: "damageTaken" }),
    ]),
  ),
  donna_strickland: fighterDraft(
    REACH_STATS,
    special("Chirp", "A stretched pulse takes the scenic route.", "light", 38, [
      projectileBlock(9, 11, { pattern: "fan", speed: 1.5, ignoresBlock: true }),
    ]),
    special("Amplify", "The pulse is louder. The laser is still fine.", "block", 38, [
      modifierBlock("self", "damage", 1.7, 54),
    ]),
    special("Pulse Compression", "An ultrashort pulse with an extremely short fuse.", "heavy", 42, [
      projectileBlock(32, 9, { delay: 18, speed: 4.5, stunTicks: 36, knockback: 1 }),
    ]),
  ),
  john_bardeen: fighterDraft(
    POWER_STATS,
    special("Transistor", "A tiny input controls a wildly large output.", "light", 38, [
      strikeBlock(8, 1.8, 10, 0.1, {
        onHit: [strikeBlock(24, 3, 28, 0.8)],
      }),
    ]),
    special("Cooper Pair", "Two electrons, one shared appointment.", "heavy", 40, [
      projectileBlock(16, 8, { pattern: "paired", speed: 3.2 }),
    ]),
    special("BCS Superconductivity", "Resistance drops. The current keeps coming.", "heavy", 52, [
      zoneBlock(12, 3, 30, { repeat: 4, stunTicks: 12, knockback: 0.5 }),
      shieldBlock(18, 42),
    ]),
  ),
  gerhard_herzberg: fighterDraft(
    REACH_STATS,
    special("Absorption Spectrum", "The beam disappears. The return address is you.", "block", 40, [
      shieldBlock(12, 36, {
        onHit: [projectileBlock(20, 8, { pattern: "single", speed: 3 })],
      }),
    ]),
    special("Free Radical", "One unpaired electron; zero chill.", "light", 36, [
      projectileBlock(13, 9, { homing: true, repeat: 2, speed: 2.5 }),
    ]),
    special("Molecular Spectrum", "The dark is full of very specific wavelengths.", "heavy", 52, [
      projectileBlock(8, 10, {
        pattern: "fan",
        repeat: 7,
        speed: 3.1,
        onHit: [stunBlock(0.8, 10)],
      }),
    ]),
  ),
};

export type DraftFighterId =
  | "warburg"
  | "curie"
  | "franklin"
  | "david_baker"
  | "thomas_steitz"
  | "joachim_frank"
  | "dorothy_crowfoot_hodgkin"
  | "christian_anfinsen"
  | "jennifer_doudna"
  | "barbara_mcclintock"
  | "elizabeth_blackburn"
  | "katalin_kariko"
  | "sidney_altman"
  | "thomas_cech"
  | "david_baltimore"
  | "rita_levi_montalcini"
  | "linda_buck"
  | "carolyn_bertozzi"
  | "k_barry_sharpless"
  | "roger_tsien"
  | "dennis_gabor"
  | "john_b_goodenough"
  | "donna_strickland"
  | "john_bardeen"
  | "gerhard_herzberg";

export type SpecialPose = "light" | "heavy" | "block";

export type BlockOptions = Readonly<{
  delay?: number;
  repeat?: number;
  ignoresBlock?: boolean;
  homing?: boolean;
  /** Optional scientific form for generic special-effect presentation. */
  motif?: "helix" | "chromosome" | "maize_chromosome";
  onHit?: readonly Block[];
  scaleWith?: "damageTaken";
}>;

export type ProjectilePattern =
  "single" | "paired" | "fan" | "cross" | "ring" | "spiral" | "returning" | "alternating";

type StrikeBlock = BlockOptions &
  Readonly<{
    kind: "strike";
    damage: number;
    reach: number;
    stunTicks: number;
    knockback: number;
  }>;

type ProjectileBlock = BlockOptions &
  Readonly<{
    kind: "projectile";
    damage: number;
    range: number;
    speed: number;
    stunTicks: number;
    knockback: number;
    pattern?: ProjectilePattern;
  }>;

type ZoneBlock = BlockOptions &
  Readonly<{
    kind: "zone";
    damage: number;
    radius: number;
    durationTicks: number;
    stunTicks: number;
    knockback: number;
  }>;

type StunBlock = BlockOptions &
  Readonly<{
    kind: "stun";
    radius: number;
    durationTicks: number;
  }>;

type RepositionBlock = BlockOptions &
  Readonly<{
    kind: "reposition";
    direction: "behindOpponent" | "towardOpponent" | "awayFromOpponent";
    distance: number;
  }>;

type ShieldBlock = BlockOptions &
  Readonly<{
    kind: "shield";
    points: number;
    durationTicks: number;
  }>;

type HealBlock = BlockOptions & Readonly<{ kind: "heal"; amount: number }>;

type ModifierBlock = BlockOptions &
  Readonly<{
    kind: "modifier";
    target: "self" | "opponent";
    stat: "damage" | "speed" | "defense";
    multiplier: number;
    durationTicks: number;
  }>;

export type Block =
  | StrikeBlock
  | ProjectileBlock
  | ZoneBlock
  | StunBlock
  | RepositionBlock
  | ShieldBlock
  | HealBlock
  | ModifierBlock;

export type SpecialDef = Readonly<{
  name: string;
  caption: string;
  pose: SpecialPose;
  ticks: number;
  blocks: readonly Block[];
  meterRefund?: number;
}>;

export type AttackStats = Readonly<{
  ticks: number;
  activeWindow: Readonly<{ first: number; last: number }>;
  reach: number;
  damage: number;
  blockedDamage: number;
  stunTicks: number;
  knockback: number;
}>;

export type FighterStats = Readonly<{
  light: AttackStats;
  heavy: AttackStats;
}>;

export type FighterDraft = Readonly<{
  stats: FighterStats;
  specials: readonly [SpecialDef, SpecialDef, SpecialDef];
}>;

export type FighterCategory =
  | "originals"
  | "structural_biology_biochemistry"
  | "genetics_molecular_biology"
  | "cell_biology_neuroscience"
  | "chemical_biology"
  | "fluorescence_imaging"
  | "physics_energy";

export type NobelPrize = Readonly<{
  category: "chemistry" | "physics" | "physiology_medicine";
  year: number;
  citation: string;
  url: string;
}>;

export type AiProfile = Readonly<{
  preferredRange: number;
  blockChance: number;
  heavyChance: number;
  specialRange: readonly [number, number, number];
}>;

export type UnlockRule =
  | Readonly<{ kind: "starter" }>
  | Readonly<{ kind: "winAs"; fighterIds: readonly DraftFighterId[] }>
  | Readonly<{ kind: "wins"; count: number }>;

/** The small, bone-attached styling vocabulary supported by the rig loader. */
export type AppearanceKit = Readonly<{
  glasses?: "wire";
  facialHair?: "chinStrap";
  prop?: "manometer";
}>;

export type FighterDef = Readonly<{
  id: DraftFighterId;
  name: string;
  category: FighterCategory;
  prize: NobelPrize | null;
  verb: string;
  body: string;
  height: number;
  stats: FighterStats;
  meterGain: number;
  specials: readonly [SpecialDef, SpecialDef, SpecialDef];
  ai: AiProfile;
  unlock: UnlockRule;
  appearance?: AppearanceKit;
}>;

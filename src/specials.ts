import type { Block, ProjectilePattern } from "./roster/fighter_def";

export type FighterSlot = 0 | 1;

export type ScheduledEffect = Readonly<{
  kind: "scheduled";
  owner: FighterSlot;
  block: Block;
  ticks: number;
}>;

export type ProjectileEffect = Readonly<{
  kind: "projectile";
  owner: FighterSlot;
  block: Extract<Block, { kind: "projectile" }>;
  x: number;
  z: number;
  facing: number;
  remaining: number;
  pattern: ProjectilePattern | undefined;
}>;

export type ZoneEffect = Readonly<{
  kind: "zone";
  owner: FighterSlot;
  block: Extract<Block, { kind: "zone" }>;
  x: number;
  z: number;
  ticks: number;
  contacted?: boolean;
}>;

export type ShieldEffect = {
  kind: "shield";
  owner: FighterSlot;
  block: Extract<Block, { kind: "shield" }>;
  points: number;
  ticks: number;
  createdThisTick?: boolean;
};

export type ModifierEffect = {
  kind: "modifier";
  owner: FighterSlot;
  target: FighterSlot;
  stat: "damage" | "speed" | "defense";
  multiplier: number;
  ticks: number;
  createdThisTick?: boolean;
};

export type Effect =
  ScheduledEffect | ProjectileEffect | ZoneEffect | ShieldEffect | ModifierEffect;

export function scheduledEffects(owner: FighterSlot, blocks: readonly Block[]): Effect[] {
  const effects: Effect[] = [];
  for (const block of blocks) {
    const delay = block.delay ?? 0;
    const repeat = block.repeat ?? 0;
    for (let activation = 0; activation <= repeat; activation++) {
      effects.push({ kind: "scheduled", owner, block, ticks: delay + activation });
    }
  }
  return effects;
}

/** Activate due blocks. Status effects age after they participate in this tick. */
export function advanceEffects(
  effects: readonly Effect[],
  activate: (owner: FighterSlot, block: Block) => readonly Effect[],
): Effect[] {
  const next: Effect[] = [];
  for (const effect of effects) {
    switch (effect.kind) {
      case "scheduled":
        if (effect.ticks === 0) {
          next.push(
            ...activate(effect.owner, effect.block).map((created) =>
              created.kind === "shield" || created.kind === "modifier"
                ? { ...created, createdThisTick: true }
                : created,
            ),
          );
        } else next.push({ ...effect, ticks: effect.ticks - 1 });
        break;
      case "projectile":
      case "zone":
        next.push(effect);
        break;
      case "shield":
      case "modifier":
        next.push(effect);
        break;
    }
  }
  return next;
}

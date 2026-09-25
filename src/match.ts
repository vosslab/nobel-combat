import { fighterById, isFighterId } from "./roster/roster";
import type { FighterId } from "./roster/roster";
import { advanceEffects, scheduledEffects } from "./specials";
import type { Effect, FighterSlot, ProjectileEffect, ZoneEffect } from "./specials";
import type { Block, SpecialDef } from "./roster/fighter_def";

export type { FighterId } from "./roster/roster";

export type Action = {
  x: number;
  z: number;
  light: boolean;
  heavy: boolean;
  block: boolean;
  special: boolean;
};
export type State = "idle" | "move" | "light" | "heavy" | "block" | "hit" | "down" | "getup";

export type Fighter = {
  id: FighterId;
  x: number;
  z: number;
  hp: number;
  wins: number;
  facing: number;
  state: State;
  ticks: number;
  hitDone: boolean;
  attackHeld: boolean;
  specialHeld: boolean;
  specialTicks: number;
  meter: number;
  damageTaken: number;
};
export type Phase = "fight" | "roundOver" | "matchOver";
/** A presentation-only record of specials released during the most recent simulation tick. */
export type SpecialRelease = Readonly<{
  owner: FighterSlot;
  tier: 1 | 2 | 3;
  special: SpecialDef;
  /** Position before a special's scheduled blocks can move its owner. */
  origin: Readonly<{ x: number; z: number; facing: number }>;
  /** Opponent position before release effects can apply knockback. */
  target: Readonly<{ x: number; z: number }>;
}>;
export const NEUTRAL: Action = {
  x: 0,
  z: 0,
  light: false,
  heavy: false,
  block: false,
  special: false,
};
export function specialTierForMeter(meter: number): 1 | 2 | 3 {
  if (meter >= 300) return 3;
  if (meter >= 200) return 2;
  return 1;
}
const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));
const makeFighter = (x: number, id: FighterId): Fighter => ({
  id,
  x,
  z: 0,
  hp: 100,
  wins: 0,
  facing: x < 0 ? 0 : Math.PI,
  state: "idle",
  ticks: 0,
  hitDone: false,
  attackHeld: false,
  specialHeld: false,
  specialTicks: 0,
  meter: 0,
  damageTaken: 0,
});

export class Match {
  fighters: [Fighter, Fighter] = [makeFighter(-1.8, "warburg"), makeFighter(1.8, "curie")];
  playerId: FighterId = "warburg";
  opponentId: FighterId = "curie";
  phase: Phase = "fight";
  round = 1;
  winner: number | null = null;
  phaseTicks = 0;
  effects: Effect[] = [];
  specialReleases: SpecialRelease[] = [];
  private pendingEffects: Effect[] = [];

  selectPlayer(playerId: FighterId, opponentId: FighterId): void {
    if (!isFighterId(playerId) || !isFighterId(opponentId)) {
      throw new TypeError(
        `Unknown fighter id: ${String(!isFighterId(playerId) ? playerId : opponentId)}`,
      );
    }
    if (playerId === opponentId) {
      throw new TypeError("A fighter cannot be their own opponent");
    }
    this.playerId = playerId;
    this.opponentId = opponentId;
    this.resetFighters(false);
  }

  restart(): void {
    this.resetFighters(false);
  }

  private resetFighters(preserveRoundProgress: boolean): void {
    const wins = preserveRoundProgress ? this.fighters.map((fighter) => fighter.wins) : [0, 0];
    const meters = preserveRoundProgress ? this.fighters.map((fighter) => fighter.meter) : [0, 0];
    const specialHeld = preserveRoundProgress
      ? this.fighters.map((fighter) => fighter.specialHeld)
      : [false, false];
    this.fighters = [makeFighter(-1.8, this.playerId), makeFighter(1.8, this.opponentId)];
    this.effects = [];
    this.pendingEffects = [];
    this.fighters[0].wins = wins[0] ?? 0;
    this.fighters[1].wins = wins[1] ?? 0;
    this.fighters[0].meter = meters[0] ?? 0;
    this.fighters[1].meter = meters[1] ?? 0;
    this.fighters[0].specialHeld = specialHeld[0] ?? false;
    this.fighters[1].specialHeld = specialHeld[1] ?? false;
    this.phase = "fight";
    this.round = 1;
    this.winner = null;
    this.phaseTicks = 0;
  }

  tick(actions: [Action, Action]): void {
    this.specialReleases = [];
    if (this.phase === "matchOver") return;
    if (this.phase === "roundOver") {
      for (let index = 0; index < this.fighters.length; index++) {
        const fighter = this.fighters[index];
        if (fighter) fighter.specialHeld = actions[index]?.special ?? false;
      }
      if (++this.phaseTicks >= 120) {
        const nextRound = this.round + 1;
        this.resetFighters(true);
        this.round = nextRound;
      }
      return;
    }
    this.pendingEffects = [];
    const struckThisTick = new Set<number>();
    for (let i = 0; i < 2; i++) {
      if (this.phase !== "fight") break;
      if (struckThisTick.has(i)) continue;
      const f = this.fighters[i];
      const opponent = this.fighters[1 - i];
      const a = actions[i];
      if (!f || !opponent || !a) continue;
      const attack = !f.attackHeld && (a.light || a.heavy);
      f.attackHeld = a.light || a.heavy;
      const special = !f.specialHeld && a.special;
      f.specialHeld = a.special;
      f.facing = Math.atan2(opponent.x - f.x, opponent.z - f.z);
      if (f.ticks > 0) {
        f.ticks--;
        if (f.specialTicks > 0) f.specialTicks--;
        if (f.ticks === 0) {
          if (f.state === "down") {
            f.state = "getup";
            f.ticks = 18;
          } else {
            f.state = "idle";
          }
        }
      }
      if (f.state === "hit" || f.state === "down" || f.state === "getup") continue;
      if (f.specialTicks > 0) continue;
      if (f.state === "light" || f.state === "heavy") {
        if (this.strike(i)) struckThisTick.add(1 - i);
        continue;
      }
      if (special && (f.state === "idle" || f.state === "move") && f.meter >= 100) {
        const tier = specialTierForMeter(f.meter);
        f.meter -= tier * 100;
        const specialDefinition = fighterById(f.id).specials[tier - 1];
        if (specialDefinition) this.releaseSpecial(i as FighterSlot, tier, specialDefinition);
        continue;
      }
      if (a.block) {
        f.state = "block";
        continue;
      }
      if (attack) {
        f.state = a.heavy ? "heavy" : "light";
        const attacks = fighterById(f.id).stats;
        f.ticks = a.heavy ? attacks.heavy.ticks : attacks.light.ticks;
        f.hitDone = false;
        continue;
      }
      // ASVS 2.2.1: bound movement at the input boundary, then constrain it to the arena.
      const x = Number.isFinite(a.x) ? clamp(a.x, -1, 1) : 0;
      const z = Number.isFinite(a.z) ? clamp(a.z, -1, 1) : 0;
      const length = Math.hypot(x, z);
      const scale = length > 1 ? 1 / length : 1;
      const speed = 0.095 * this.modifier(i as FighterSlot, "speed");
      f.x = clamp(f.x + x * scale * speed, -9, 9);
      f.z = clamp(f.z + z * scale * speed, -6, 6);
      f.state = length > 0.1 ? "move" : "idle";
    }
    const [red, blue] = this.fighters;
    const dx = blue.x - red.x;
    const dz = blue.z - red.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 1.1 && distance > 0.001) {
      const push = (1.1 - distance) / 2;
      red.x = clamp(red.x - (dx / distance) * push, -9, 9);
      red.z = clamp(red.z - (dz / distance) * push, -6, 6);
      blue.x = clamp(blue.x + (dx / distance) * push, -9, 9);
      blue.z = clamp(blue.z + (dz / distance) * push, -6, 6);
    }
    if (this.phase === "fight") this.tickEffects();
  }

  private strike(index: number): boolean {
    const f = this.fighters[index];
    const target = this.fighters[1 - index];
    if (!f || !target || f.hitDone) return false;
    const heavy = f.state === "heavy";
    const attacks = fighterById(f.id).stats;
    const attackStats = heavy ? attacks.heavy : attacks.light;
    const active =
      f.ticks <= attackStats.activeWindow.last && f.ticks >= attackStats.activeWindow.first;
    if (!active) return false;
    f.hitDone = true;
    const dx = target.x - f.x;
    const dz = target.z - f.z;
    const distance = Math.hypot(dx, dz);
    const front = dx * Math.sin(f.facing) + dz * Math.cos(f.facing);
    if (distance > attackStats.reach || front < 0 || target.state === "down") return false;
    const blocked = target.state === "block";
    this.gainMeter(f, blocked ? 8 : 20);
    this.gainMeter(target, blocked ? 10 : 12);
    const damage = this.outgoingDamage(f, blocked ? attackStats.blockedDamage : attackStats.damage);
    this.damage(
      index as FighterSlot,
      (1 - index) as FighterSlot,
      damage,
      heavy ? attackStats.stunTicks : 0,
      attackStats.knockback,
    );
    target.state = blocked ? "block" : heavy ? "down" : "hit";
    target.ticks = blocked ? 8 : heavy ? attackStats.stunTicks : attackStats.stunTicks;
    return true;
  }

  private releaseSpecial(owner: FighterSlot, tier: 1 | 2 | 3, special: SpecialDef): void {
    const fighter = this.fighters[owner];
    const origin = { x: fighter.x, z: fighter.z, facing: fighter.facing };
    const target = this.fighters[1 - owner] as Fighter;
    fighter.state = special.pose;
    fighter.ticks = special.ticks;
    fighter.specialTicks = special.ticks;
    fighter.hitDone = true;
    fighter.meter = clamp(fighter.meter + (special.meterRefund ?? 0), 0, 300);
    this.effects.push(...scheduledEffects(owner, special.blocks));
    this.specialReleases.push({
      owner,
      tier,
      special,
      origin,
      target: { x: target.x, z: target.z },
    });
  }

  private tickEffects(): void {
    this.effects = advanceEffects(this.effects, (owner, block) =>
      this.phase === "fight" ? this.activateBlock(owner, block) : [],
    );
    const active = this.effects;
    const next: Effect[] = [];
    for (const effect of active) {
      if (effect.kind === "projectile") {
        const moved = this.moveProjectile(effect);
        if (moved) next.push(moved);
      } else if (effect.kind === "zone") {
        const zone = this.tickZone(effect);
        if (zone) next.push(zone);
      } else if (effect.kind === "shield") {
        if (effect.points > 0) {
          next.push(
            effect.createdThisTick
              ? { ...effect, createdThisTick: false }
              : { ...effect, ticks: effect.ticks - 1 },
          );
        }
      } else if (effect.kind === "modifier") {
        next.push(
          effect.createdThisTick
            ? { ...effect, createdThisTick: false }
            : { ...effect, ticks: effect.ticks - 1 },
        );
      } else {
        next.push(effect);
      }
      if (this.phase !== "fight") {
        this.effects = [];
        this.pendingEffects = [];
        return;
      }
    }
    this.effects = next.filter(
      (effect) => (effect.kind !== "shield" && effect.kind !== "modifier") || effect.ticks > 0,
    );
    this.effects.push(...this.pendingEffects);
  }

  private activateBlock(owner: FighterSlot, block: Block): readonly Effect[] {
    const fighter = this.fighters[owner];
    const target = this.fighters[1 - owner] as Fighter;
    switch (block.kind) {
      case "strike":
        this.resolveContact(owner, block, fighter.x, fighter.z, block.reach, fighter.facing);
        return [];
      case "projectile":
        return [
          {
            kind: "projectile",
            owner,
            block,
            x: fighter.x,
            z: fighter.z,
            facing: fighter.facing,
            remaining: block.range,
            pattern: block.pattern,
          },
        ];
      case "zone":
        return [
          { kind: "zone", owner, block, x: fighter.x, z: fighter.z, ticks: block.durationTicks },
        ];
      case "stun":
        this.resolveContact(owner, block, fighter.x, fighter.z, block.radius);
        return [];
      case "reposition": {
        const dx = target.x - fighter.x;
        const dz = target.z - fighter.z;
        const length = Math.hypot(dx, dz) || 1;
        const direction =
          block.direction === "behindOpponent" ? 1 : block.direction === "towardOpponent" ? 1 : -1;
        const anchor = block.direction === "behindOpponent" ? target : fighter;
        fighter.x = clamp(anchor.x + (dx / length) * block.distance * direction, -9, 9);
        fighter.z = clamp(anchor.z + (dz / length) * block.distance * direction, -6, 6);
        return this.activateOnHit(owner, block);
      }
      case "shield":
        return [{ kind: "shield", owner, block, points: block.points, ticks: block.durationTicks }];
      case "heal":
        fighter.hp = clamp(fighter.hp + block.amount, 0, 100);
        return [];
      case "modifier":
        return [
          {
            kind: "modifier",
            owner,
            target: block.target === "self" ? owner : ((1 - owner) as FighterSlot),
            stat: block.stat,
            multiplier: block.multiplier,
            ticks: block.durationTicks,
          },
        ];
    }
  }

  private activateOnHit(owner: FighterSlot, block: Block): readonly Effect[] {
    if (!block.onHit) return [];
    const effects: Effect[] = [];
    for (const onHit of block.onHit) effects.push(...this.activateBlock(owner, onHit));
    return effects;
  }

  private moveProjectile(effect: ProjectileEffect): ProjectileEffect | null {
    const target = this.fighters[1 - effect.owner] as Fighter;
    const facing = effect.block.homing
      ? Math.atan2(target.x - effect.x, target.z - effect.z)
      : effect.facing;
    const x = clamp(effect.x + Math.sin(facing) * effect.block.speed, -9, 9);
    const z = clamp(effect.z + Math.cos(facing) * effect.block.speed, -6, 6);
    if (this.resolveContact(effect.owner, effect.block, x, z, 0.7, facing)) return null;
    const remaining = effect.remaining - effect.block.speed;
    return remaining > 0 ? { ...effect, x, z, facing, remaining } : null;
  }

  private tickZone(effect: ZoneEffect): ZoneEffect | null {
    const contacted =
      effect.contacted ||
      this.resolveContact(effect.owner, effect.block, effect.x, effect.z, effect.block.radius);
    return effect.ticks > 1 ? { ...effect, ticks: effect.ticks - 1, contacted } : null;
  }

  private resolveContact(
    owner: FighterSlot,
    block: Extract<Block, { kind: "strike" | "projectile" | "zone" | "stun" }>,
    x: number,
    z: number,
    radius: number,
    facing?: number,
  ): boolean {
    const target = this.fighters[1 - owner] as Fighter;
    const dx = target.x - x;
    const dz = target.z - z;
    const distance = Math.hypot(dx, dz);
    const front = facing === undefined ? 0 : dx * Math.sin(facing) + dz * Math.cos(facing);
    if (distance > radius || (block.kind === "strike" && front < 0) || target.state === "down")
      return false;
    if (target.state === "block" && !block.ignoresBlock) return false;
    if (block.kind === "stun") this.stun(owner, (1 - owner) as FighterSlot, block.durationTicks);
    else this.applySpecialDamage(owner, (1 - owner) as FighterSlot, block, x, z);
    this.pendingEffects.push(...this.activateOnHit(owner, block));
    return true;
  }

  private applySpecialDamage(
    owner: FighterSlot,
    target: FighterSlot,
    block: Extract<Block, { kind: "strike" | "projectile" | "zone" }>,
    x: number,
    z: number,
  ): void {
    const damage =
      block.damage + (block.scaleWith === "damageTaken" ? this.fighters[owner].damageTaken : 0);
    this.damage(
      owner,
      target,
      this.outgoingDamage(this.fighters[owner], damage),
      block.stunTicks,
      block.knockback,
      x,
      z,
      block.ignoresBlock ?? false,
    );
  }

  private stun(_owner: FighterSlot, target: FighterSlot, ticks: number): void {
    const fighter = this.fighters[target];
    fighter.state = "hit";
    fighter.ticks = Math.max(fighter.ticks, ticks);
    fighter.specialTicks = 0;
  }

  private outgoingDamage(fighter: Fighter, damage: number): number {
    return damage * this.modifier(fighter === this.fighters[0] ? 0 : 1, "damage");
  }

  private modifier(target: FighterSlot, stat: "damage" | "speed" | "defense"): number {
    return this.effects.reduce(
      (value, effect) =>
        effect.kind === "modifier" && effect.target === target && effect.stat === stat
          ? value * effect.multiplier
          : value,
      1,
    );
  }

  private damage(
    owner: FighterSlot,
    target: FighterSlot,
    damage: number,
    stunTicks: number,
    knockback: number,
    fromX?: number,
    fromZ?: number,
    bypassGuard = false,
  ): void {
    const targetFighter = this.fighters[target];
    if (targetFighter.hp === 0 || this.phase !== "fight") return;
    let remaining = damage / this.modifier(target, "defense");
    for (const effect of this.effects) {
      if (effect.kind !== "shield" || effect.owner !== target || remaining <= 0) continue;
      const absorbed = Math.min(effect.points, remaining);
      if (absorbed === 0) continue;
      remaining -= absorbed;
      effect.points -= absorbed;
      if (effect.block.onHit) {
        this.pendingEffects.push(...scheduledEffects(effect.owner, effect.block.onHit));
      }
    }
    const hpLoss = Math.min(targetFighter.hp, remaining);
    targetFighter.hp -= hpLoss;
    targetFighter.damageTaken += hpLoss;
    if (remaining > 0 && (targetFighter.state !== "block" || bypassGuard)) {
      this.stun(owner, target, stunTicks);
    }
    if (knockback > 0) {
      const originX = fromX ?? this.fighters[owner].x;
      const originZ = fromZ ?? this.fighters[owner].z;
      const distance = Math.hypot(targetFighter.x - originX, targetFighter.z - originZ) || 1;
      targetFighter.x = clamp(
        targetFighter.x + ((targetFighter.x - originX) / distance) * knockback,
        -9,
        9,
      );
      targetFighter.z = clamp(
        targetFighter.z + ((targetFighter.z - originZ) / distance) * knockback,
        -6,
        6,
      );
    }
    if (targetFighter.hp === 0) {
      const fighter = this.fighters[owner];
      fighter.wins++;
      this.winner = owner;
      this.phase = fighter.wins >= 2 ? "matchOver" : "roundOver";
      this.phaseTicks = 0;
      this.effects = [];
      this.pendingEffects = [];
    }
  }

  private gainMeter(fighter: Fighter, baseGain: number): void {
    fighter.meter = clamp(fighter.meter + baseGain * fighterById(fighter.id).meterGain, 0, 300);
  }
}

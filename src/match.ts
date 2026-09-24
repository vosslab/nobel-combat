export type Action = { x: number; z: number; light: boolean; heavy: boolean; block: boolean };
export type State = "idle" | "move" | "light" | "heavy" | "block" | "hit" | "down" | "getup";
export type FighterRole = "warburg" | "curie" | "franklin" | "opponent";
export type NobelFighterRole = "warburg" | "curie";
export type PlayerFighterRole = NobelFighterRole | "franklin";
export type Fighter = {
  role: FighterRole;
  x: number;
  z: number;
  hp: number;
  wins: number;
  facing: number;
  state: State;
  ticks: number;
  hitDone: boolean;
  attackHeld: boolean;
  lactateDrive: boolean;
  lactateDriveCooldown: number;
  aerobicOutputTicks: number;
  aerobicGlycolysisCooldown: number;
  aerobicLightReady: boolean;
  separationStep: boolean;
  separationStepCooldown: number;
};
export type Phase = "fight" | "roundOver" | "matchOver";
export const NEUTRAL: Action = { x: 0, z: 0, light: false, heavy: false, block: false };
const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));
const makeFighter = (x: number, role: FighterRole): Fighter => ({
  role,
  x,
  z: 0,
  hp: 100,
  wins: 0,
  facing: x < 0 ? 0 : Math.PI,
  state: "idle",
  ticks: 0,
  hitDone: false,
  attackHeld: false,
  lactateDrive: false,
  lactateDriveCooldown: 0,
  aerobicOutputTicks: 0,
  aerobicGlycolysisCooldown: 0,
  aerobicLightReady: false,
  separationStep: false,
  separationStepCooldown: 0,
});

export class Match {
  fighters: [Fighter, Fighter] = [makeFighter(-1.8, "warburg"), makeFighter(1.8, "opponent")];
  playerRole: PlayerFighterRole = "warburg";
  private selectionActive = false;
  phase: Phase = "fight";
  round = 1;
  winner: number | null = null;
  phaseTicks = 0;

  selectPlayer(role: PlayerFighterRole): void {
    if (role !== "warburg" && role !== "curie" && role !== "franklin") {
      throw new TypeError("Player fighter must be warburg, curie, or franklin");
    }
    this.playerRole = role;
    this.selectionActive = true;
    this.resetFighters(false);
  }

  restart(): void {
    this.resetFighters(false);
  }

  private resetFighters(preserveWins: boolean): void {
    const wins = preserveWins ? this.fighters.map((fighter) => fighter.wins) : [0, 0];
    const aiRole: FighterRole = this.selectionActive
      ? this.playerRole === "warburg"
        ? "curie"
        : "warburg"
      : "opponent";
    this.fighters = [makeFighter(-1.8, this.playerRole), makeFighter(1.8, aiRole)];
    this.fighters[0].wins = wins[0] ?? 0;
    this.fighters[1].wins = wins[1] ?? 0;
    this.phase = "fight";
    this.round = 1;
    this.winner = null;
    this.phaseTicks = 0;
  }

  tick(actions: [Action, Action]): void {
    if (this.phase === "matchOver") return;
    if (this.phase === "roundOver") {
      if (++this.phaseTicks >= 120) {
        const nextRound = this.round + 1;
        this.resetFighters(true);
        this.round = nextRound;
      }
      return;
    }
    const struckThisTick = new Set<number>();
    for (let i = 0; i < 2; i++) {
      if (struckThisTick.has(i)) continue;
      const f = this.fighters[i];
      const opponent = this.fighters[1 - i];
      const a = actions[i];
      if (!f || !opponent || !a) continue;
      const attack = !f.attackHeld && (a.light || a.heavy);
      f.attackHeld = a.light || a.heavy;
      if (f.lactateDriveCooldown > 0) f.lactateDriveCooldown--;
      if (f.aerobicGlycolysisCooldown > 0) f.aerobicGlycolysisCooldown--;
      if (f.separationStepCooldown > 0) f.separationStepCooldown--;
      const aerobicOutputActive = f.aerobicOutputTicks > 0;
      if (aerobicOutputActive) {
        f.aerobicOutputTicks--;
        if (f.aerobicOutputTicks === 0) f.aerobicLightReady = false;
      } else if (f.aerobicLightReady) {
        f.aerobicLightReady = false;
      }
      f.facing = Math.atan2(opponent.x - f.x, opponent.z - f.z);
      if (f.ticks > 0) {
        f.ticks--;
        if (f.ticks === 0) {
          if (f.state === "down") {
            f.state = "getup";
            f.ticks = 18;
          } else {
            f.state = "idle";
          }
          f.lactateDrive = false;
          f.separationStep = false;
        }
      }
      if (f.state === "hit" || f.state === "down" || f.state === "getup") continue;
      if (f.state === "light" || f.state === "heavy") {
        if (f.lactateDrive && f.ticks >= 6) {
          f.x = clamp(f.x + Math.sin(f.facing) * 0.072, -9, 9);
          f.z = clamp(f.z + Math.cos(f.facing) * 0.072, -6, 6);
        }
        if (this.strike(i)) struckThisTick.add(1 - i);
        continue;
      }
      if (f.role === "warburg" && a.light && a.heavy && attack) {
        if (f.lactateDriveCooldown === 0) {
          f.state = "light";
          f.ticks = 16;
          f.hitDone = false;
          f.lactateDrive = true;
          f.lactateDriveCooldown = 44;
        }
        continue;
      }
      if (f.role === "warburg" && a.light && a.block && attack) {
        if (f.aerobicGlycolysisCooldown === 0) {
          f.aerobicOutputTicks = 72;
          f.aerobicGlycolysisCooldown = 150;
          f.aerobicLightReady = true;
        }
        continue;
      }
      if (f.role === "curie" && a.light && a.block && attack) {
        if (f.separationStepCooldown === 0) {
          f.state = "light";
          f.ticks = 24;
          f.hitDone = false;
          f.separationStep = true;
          f.separationStepCooldown = 72;
        }
        continue;
      }
      if (a.block) {
        f.state = "block";
        continue;
      }
      if (attack) {
        f.state = a.heavy ? "heavy" : "light";
        f.ticks = a.heavy ? (f.role === "warburg" ? 32 : 36) : 22;
        f.hitDone = false;
        f.lactateDrive = false;
        f.separationStep = false;
        continue;
      }
      // ASVS 2.2.1: bound movement at the input boundary, then constrain it to the arena.
      const x = Number.isFinite(a.x) ? clamp(a.x, -1, 1) : 0;
      const z = Number.isFinite(a.z) ? clamp(a.z, -1, 1) : 0;
      const length = Math.hypot(x, z);
      const scale = length > 1 ? 1 / length : 1;
      const speed = f.role === "warburg" && aerobicOutputActive ? 0.115 : 0.095;
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
  }

  private strike(index: number): boolean {
    const f = this.fighters[index];
    const target = this.fighters[1 - index];
    if (!f || !target || f.hitDone) return false;
    const heavy = f.state === "heavy";
    const oxygenTransfer = heavy && f.role === "warburg";
    const lactateDrive = f.lactateDrive && f.role === "warburg";
    const separationStep = f.separationStep && f.role === "curie";
    const active = oxygenTransfer
      ? f.ticks <= 23 && f.ticks >= 16
      : lactateDrive
        ? f.ticks <= 6 && f.ticks >= 1
        : separationStep
          ? f.ticks <= 18 && f.ticks >= 12
          : heavy
            ? f.ticks <= 22 && f.ticks >= 15
            : f.ticks <= 15 && f.ticks >= 10;
    if (!active) return false;
    f.hitDone = true;
    const dx = target.x - f.x;
    const dz = target.z - f.z;
    const distance = Math.hypot(dx, dz);
    const front = dx * Math.sin(f.facing) + dz * Math.cos(f.facing);
    if (
      distance >
        (oxygenTransfer ? 2.45 : lactateDrive ? 2 : separationStep ? 1.95 : heavy ? 2.2 : 1.8) ||
      front < 0 ||
      target.state === "down"
    )
      return false;
    const blocked = target.state === "block";
    const poweredLight = !heavy && !lactateDrive && f.role === "warburg" && f.aerobicLightReady;
    const damage = oxygenTransfer
      ? blocked
        ? 6
        : 28
      : lactateDrive
        ? blocked
          ? 4
          : 18
        : separationStep
          ? blocked
            ? 3
            : 16
          : heavy
            ? blocked
              ? 5
              : 24
            : poweredLight
              ? blocked
                ? 4
                : 14
              : blocked
                ? 2
                : 10;
    target.hp = Math.max(0, target.hp - damage);
    target.state = blocked ? "block" : heavy ? "down" : "hit";
    target.ticks = blocked
      ? 8
      : heavy
        ? oxygenTransfer
          ? 72
          : 70
        : separationStep
          ? 16
          : lactateDrive || poweredLight
            ? 14
            : 18;
    target.lactateDrive = false;
    target.separationStep = false;
    if (poweredLight) f.aerobicLightReady = false;
    const knockback = heavy ? 0.65 : lactateDrive ? 0.4 : 0.25;
    target.x = clamp(target.x + (dx / (distance || 1)) * knockback, -9, 9);
    target.z = clamp(target.z + (dz / (distance || 1)) * knockback, -6, 6);
    if (target.hp === 0) {
      f.wins++;
      this.winner = index;
      this.phase = f.wins >= 2 ? "matchOver" : "roundOver";
      this.phaseTicks = 0;
    }
    return true;
  }
}

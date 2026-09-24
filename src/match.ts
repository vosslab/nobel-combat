export type Action = { x: number; z: number; light: boolean; heavy: boolean; block: boolean };
export type State = "idle" | "move" | "light" | "heavy" | "block" | "hit" | "down" | "getup";
export type Fighter = {
  x: number;
  z: number;
  hp: number;
  wins: number;
  facing: number;
  state: State;
  ticks: number;
  hitDone: boolean;
  attackHeld: boolean;
};
export type Phase = "fight" | "roundOver" | "matchOver";
export const NEUTRAL: Action = { x: 0, z: 0, light: false, heavy: false, block: false };
const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));
const makeFighter = (x: number): Fighter => ({
  x,
  z: 0,
  hp: 100,
  wins: 0,
  facing: x < 0 ? 0 : Math.PI,
  state: "idle",
  ticks: 0,
  hitDone: false,
  attackHeld: false,
});

export class Match {
  fighters: [Fighter, Fighter] = [makeFighter(-3), makeFighter(3)];
  phase: Phase = "fight";
  round = 1;
  winner: number | null = null;
  phaseTicks = 0;

  restart(): void {
    this.fighters = [makeFighter(-3), makeFighter(3)];
    this.phase = "fight";
    this.round = 1;
    this.winner = null;
    this.phaseTicks = 0;
  }

  tick(actions: [Action, Action]): void {
    if (this.phase === "matchOver") return;
    if (this.phase === "roundOver") {
      if (++this.phaseTicks >= 120) {
        const wins = this.fighters.map((f) => f.wins);
        this.fighters = [makeFighter(-3), makeFighter(3)];
        this.fighters[0].wins = wins[0] ?? 0;
        this.fighters[1].wins = wins[1] ?? 0;
        this.round++;
        this.phase = "fight";
        this.phaseTicks = 0;
      }
      return;
    }
    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i];
      const opponent = this.fighters[1 - i];
      const a = actions[i];
      if (!f || !opponent || !a) continue;
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
        }
      }
      if (f.state === "hit" || f.state === "down" || f.state === "getup") continue;
      if (f.state === "light" || f.state === "heavy") {
        this.strike(i);
        continue;
      }
      if (a.block) {
        f.state = "block";
        continue;
      }
      const attack = !f.attackHeld && (a.light || a.heavy);
      f.attackHeld = a.light || a.heavy;
      if (attack) {
        f.state = a.heavy ? "heavy" : "light";
        f.ticks = a.heavy ? 36 : 22;
        f.hitDone = false;
        continue;
      }
      // ASVS 2.2.1: bound movement at the input boundary, then constrain it to the arena.
      const x = Number.isFinite(a.x) ? clamp(a.x, -1, 1) : 0;
      const z = Number.isFinite(a.z) ? clamp(a.z, -1, 1) : 0;
      const length = Math.hypot(x, z);
      const scale = length > 1 ? 1 / length : 1;
      f.x = clamp(f.x + x * scale * 0.095, -9, 9);
      f.z = clamp(f.z + z * scale * 0.095, -6, 6);
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

  private strike(index: number): void {
    const f = this.fighters[index];
    const target = this.fighters[1 - index];
    if (!f || !target || f.hitDone) return;
    const heavy = f.state === "heavy";
    const active = heavy ? f.ticks <= 22 && f.ticks >= 15 : f.ticks <= 15 && f.ticks >= 10;
    if (!active) return;
    f.hitDone = true;
    const dx = target.x - f.x;
    const dz = target.z - f.z;
    const distance = Math.hypot(dx, dz);
    const front = dx * Math.sin(f.facing) + dz * Math.cos(f.facing);
    if (distance > (heavy ? 2.2 : 1.8) || front < 0 || target.state === "down") return;
    const blocked = target.state === "block";
    target.hp = Math.max(0, target.hp - (blocked ? (heavy ? 5 : 2) : heavy ? 24 : 10));
    target.state = blocked ? "block" : heavy ? "down" : "hit";
    target.ticks = blocked ? 8 : heavy ? 70 : 18;
    target.x = clamp(target.x + (dx / (distance || 1)) * (heavy ? 0.65 : 0.25), -9, 9);
    target.z = clamp(target.z + (dz / (distance || 1)) * (heavy ? 0.65 : 0.25), -6, 6);
    if (target.hp === 0) {
      f.wins++;
      this.winner = index;
      this.phase = f.wins >= 2 ? "matchOver" : "roundOver";
      this.phaseTicks = 0;
    }
  }
}

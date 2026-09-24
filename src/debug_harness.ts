import { Match, NEUTRAL } from "./match";
import type { Action, Fighter, Phase, State } from "./match";

export type DebugFighterPatch = Partial<Fighter>;
export type DebugMatchPatch = Partial<Pick<Match, "phase" | "round" | "winner" | "phaseTicks">>;
export type DebugFighterSnapshot = Readonly<Fighter>;
export type DebugMatchSnapshot = Readonly<{
  fighters: readonly [DebugFighterSnapshot, DebugFighterSnapshot];
  phase: Phase;
  round: number;
  winner: number | null;
  phaseTicks: number;
}>;

const STATES: readonly State[] = [
  "idle",
  "move",
  "light",
  "heavy",
  "block",
  "hit",
  "down",
  "getup",
];
const PHASES: readonly Phase[] = ["fight", "roundOver", "matchOver"];
const FIGHTER_FIELDS: ReadonlySet<string> = new Set([
  "x",
  "z",
  "hp",
  "wins",
  "facing",
  "state",
  "ticks",
  "hitDone",
  "attackHeld",
]);
const MATCH_FIELDS: ReadonlySet<string> = new Set(["phase", "round", "winner", "phaseTicks"]);
const ACTION_FIELDS: ReadonlySet<string> = new Set(["x", "z", "light", "heavy", "block"]);
const STATE_TICK_LIMITS: Readonly<Record<State, readonly [number, number]>> = {
  idle: [0, 0],
  move: [0, 0],
  light: [1, 22],
  heavy: [1, 36],
  block: [0, 8],
  hit: [1, 18],
  down: [1, 70],
  getup: [1, 18],
};

function validFighterIndex(index: number): index is 0 | 1 {
  return index === 0 || index === 1;
}

function validState(value: State): boolean {
  return STATES.includes(value);
}

function validPhase(value: Phase): boolean {
  return PHASES.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateAllowedKeys(value: unknown, allowed: ReadonlySet<string>, label: string): void {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown ${label} field: ${key}`);
    }
  }
}

function validateNumber(
  label: string,
  value: unknown,
  minimum: number,
  maximum: number,
  integer = false,
): void {
  const valid =
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum &&
    (!integer || Number.isInteger(value));
  if (!valid) {
    throw new Error(
      `${label} must be ${integer ? "an integer" : "a number"} from ${minimum} to ${maximum}`,
    );
  }
}

function validateBoolean(label: string, value: unknown): void {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
}

function validateAction(action: Action): void {
  validateAllowedKeys(action, ACTION_FIELDS, "action");
  validateNumber("Action x", action.x, -1, 1);
  validateNumber("Action z", action.z, -1, 1);
  validateBoolean("Action light", action.light);
  validateBoolean("Action heavy", action.heavy);
  validateBoolean("Action block", action.block);
}

function copyAction(action: Action): Action {
  validateAction(action);
  const copied = {
    x: action.x,
    z: action.z,
    light: action.light,
    heavy: action.heavy,
    block: action.block,
  };
  return copied;
}

function copyFighter(fighter: Fighter): DebugFighterSnapshot {
  const copied = {
    x: fighter.x,
    z: fighter.z,
    hp: fighter.hp,
    wins: fighter.wins,
    facing: fighter.facing,
    state: fighter.state,
    ticks: fighter.ticks,
    hitDone: fighter.hitDone,
    attackHeld: fighter.attackHeld,
  };
  return Object.freeze(copied);
}

function validateFighter(fighter: Fighter): void {
  validateAllowedKeys(fighter, FIGHTER_FIELDS, "fighter");
  validateNumber("Fighter x", fighter.x, -9, 9);
  validateNumber("Fighter z", fighter.z, -6, 6);
  validateNumber("Fighter hp", fighter.hp, 0, 100);
  validateNumber("Fighter wins", fighter.wins, 0, 2, true);
  validateNumber("Fighter facing", fighter.facing, -Math.PI, Math.PI);
  if (!validState(fighter.state)) {
    throw new Error(`Unknown fighter state: ${fighter.state}`);
  }
  const [minimumTicks, maximumTicks] = STATE_TICK_LIMITS[fighter.state];
  validateNumber("Fighter ticks", fighter.ticks, minimumTicks, maximumTicks, true);
  validateBoolean("Fighter hitDone", fighter.hitDone);
  validateBoolean("Fighter attackHeld", fighter.attackHeld);
}

function validateMatch(match: Pick<Match, "phase" | "round" | "winner" | "phaseTicks">): void {
  validateAllowedKeys(match, MATCH_FIELDS, "match");
  if (!validPhase(match.phase)) {
    throw new Error(`Unknown match phase: ${match.phase}`);
  }
  if (match.winner !== null && !validFighterIndex(match.winner)) {
    throw new Error("Match winner must be 0, 1, or null");
  }
  validateNumber("Match round", match.round, 1, 2, true);
  validateNumber("Match phaseTicks", match.phaseTicks, 0, 119, true);
}

/**
 * Test-only facade for deterministic browser and Node scenarios. It owns no
 * globals and returns frozen copies, so scenario code cannot mutate a match
 * except through an explicit tick, restart, or force operation.
 */
export class DebugHarness {
  private readonly match: Match;

  constructor(match: Match = new Match()) {
    this.match = match;
  }

  tick(actions: readonly [Action, Action] = [NEUTRAL, NEUTRAL]): DebugMatchSnapshot {
    if (!Array.isArray(actions) || actions.length !== 2) {
      throw new Error("Actions must contain exactly two actions");
    }
    const copiedActions: [Action, Action] = [copyAction(actions[0]), copyAction(actions[1])];
    this.match.tick(copiedActions);
    return this.snapshot();
  }

  advance(
    ticks: number,
    actions: readonly [Action, Action] = [NEUTRAL, NEUTRAL],
  ): DebugMatchSnapshot {
    if (!Number.isSafeInteger(ticks) || ticks < 0) {
      throw new Error("Ticks must be a non-negative safe integer");
    }
    for (let tick = 0; tick < ticks; tick++) {
      this.tick(actions);
    }
    return this.snapshot();
  }

  restart(): DebugMatchSnapshot {
    this.match.restart();
    return this.snapshot();
  }

  forceFighter(index: 0 | 1, patch: DebugFighterPatch): DebugMatchSnapshot {
    if (!validFighterIndex(index)) {
      throw new Error("Fighter index must be 0 or 1");
    }
    const fighter = this.match.fighters[index];
    const candidate: Fighter = { ...fighter, ...patch };
    validateFighter(candidate);
    Object.assign(fighter, candidate);
    return this.snapshot();
  }

  forceMatch(patch: DebugMatchPatch): DebugMatchSnapshot {
    const candidate = {
      phase: this.match.phase,
      round: this.match.round,
      winner: this.match.winner,
      phaseTicks: this.match.phaseTicks,
      ...patch,
    };
    validateMatch(candidate);
    Object.assign(this.match, candidate);
    return this.snapshot();
  }

  snapshot(): DebugMatchSnapshot {
    const red = copyFighter(this.match.fighters[0]);
    const blue = copyFighter(this.match.fighters[1]);
    const fighters: readonly [DebugFighterSnapshot, DebugFighterSnapshot] = Object.freeze([
      red,
      blue,
    ]);
    const snapshot = {
      fighters,
      phase: this.match.phase,
      round: this.match.round,
      winner: this.match.winner,
      phaseTicks: this.match.phaseTicks,
    };
    return Object.freeze(snapshot);
  }
}

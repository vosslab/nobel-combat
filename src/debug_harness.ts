import { Match, NEUTRAL } from "./match";
import type { Action, Fighter, Phase, State } from "./match";
import { isFighterId } from "./roster/roster";
import type { FighterId } from "./roster/roster";
import type { Effect } from "./specials";
import type { Block } from "./roster/fighter_def";

export type DebugFighterPatch = Partial<Omit<Fighter, "id">>;
export type DebugMatchPatch = Partial<Pick<Match, "phase" | "round" | "winner" | "phaseTicks">>;
export type DebugFighterSnapshot = Readonly<Fighter>;
export type DebugMatchSnapshot = Readonly<{
  fighters: readonly [DebugFighterSnapshot, DebugFighterSnapshot];
  effects: readonly Effect[];
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
  "specialHeld",
  "specialTicks",
  "meter",
  "damageTaken",
]);
const MATCH_FIELDS: ReadonlySet<string> = new Set(["phase", "round", "winner", "phaseTicks"]);
const ACTION_FIELDS: ReadonlySet<string> = new Set([
  "x",
  "z",
  "light",
  "heavy",
  "block",
  "special",
]);
const STATE_TICK_LIMITS: Readonly<Record<State, readonly [number, number]>> = {
  idle: [0, 0],
  move: [0, 0],
  light: [1, 24],
  heavy: [1, 40],
  block: [0, 8],
  hit: [1, 18],
  down: [1, 72],
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
  validateBoolean("Action special", action.special);
}

function copyAction(action: Action): Action {
  validateAction(action);
  const copied = {
    x: action.x,
    z: action.z,
    light: action.light,
    heavy: action.heavy,
    block: action.block,
    special: action.special,
  };
  return copied;
}

function copyFighter(fighter: Fighter): DebugFighterSnapshot {
  const copied = {
    id: fighter.id,
    x: fighter.x,
    z: fighter.z,
    hp: fighter.hp,
    wins: fighter.wins,
    facing: fighter.facing,
    state: fighter.state,
    ticks: fighter.ticks,
    hitDone: fighter.hitDone,
    attackHeld: fighter.attackHeld,
    specialHeld: fighter.specialHeld,
    specialTicks: fighter.specialTicks,
    meter: fighter.meter,
    damageTaken: fighter.damageTaken,
  };
  return Object.freeze(copied);
}

function copyBlock<BlockType extends Block>(block: BlockType): BlockType {
  const onHit = block.onHit?.map(copyBlock);
  return Object.freeze({
    ...block,
    ...(onHit === undefined ? {} : { onHit: Object.freeze(onHit) }),
  }) as BlockType;
}

function copyEffect(effect: Effect): Effect {
  switch (effect.kind) {
    case "scheduled":
      return Object.freeze({ ...effect, block: copyBlock(effect.block) });
    case "projectile":
      return Object.freeze({ ...effect, block: copyBlock(effect.block) });
    case "zone":
      return Object.freeze({ ...effect, block: copyBlock(effect.block) });
    case "shield":
      return Object.freeze({ ...effect, block: copyBlock(effect.block) });
    case "modifier":
      return Object.freeze({ ...effect });
  }
}

function validateFighter(fighter: Fighter): void {
  if (!isFighterId(fighter.id)) {
    throw new Error(`Unknown fighter id: ${String(fighter.id)}`);
  }
  validateNumber("Fighter x", fighter.x, -9, 9);
  validateNumber("Fighter z", fighter.z, -6, 6);
  validateNumber("Fighter hp", fighter.hp, 0, 100);
  validateNumber("Fighter wins", fighter.wins, 0, 2, true);
  validateNumber("Fighter facing", fighter.facing, -Math.PI, Math.PI);
  if (!validState(fighter.state)) {
    throw new Error(`Unknown fighter state: ${fighter.state}`);
  }
  if (fighter.specialTicks > 0) {
    if (fighter.state !== "light" && fighter.state !== "heavy" && fighter.state !== "block") {
      throw new Error("An active special must use its authored pose");
    }
    validateNumber("Fighter ticks", fighter.ticks, 1, 96, true);
    validateNumber("Fighter specialTicks", fighter.specialTicks, 1, fighter.ticks, true);
  } else {
    const [minimumTicks, maximumTicks] = STATE_TICK_LIMITS[fighter.state];
    validateNumber("Fighter ticks", fighter.ticks, minimumTicks, maximumTicks, true);
    validateNumber("Fighter specialTicks", fighter.specialTicks, 0, 0, true);
  }
  validateBoolean("Fighter hitDone", fighter.hitDone);
  validateBoolean("Fighter attackHeld", fighter.attackHeld);
  validateBoolean("Fighter specialHeld", fighter.specialHeld);
  validateNumber("Fighter meter", fighter.meter, 0, 300);
  validateNumber("Fighter damageTaken", fighter.damageTaken, 0, 100);
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
  private readonly afterTick: ((previousPhase: Phase) => void) | undefined;

  constructor(match: Match = new Match(), afterTick?: (previousPhase: Phase) => void) {
    this.match = match;
    this.afterTick = afterTick;
  }

  tick(actions: readonly [Action, Action] = [NEUTRAL, NEUTRAL]): DebugMatchSnapshot {
    if (!Array.isArray(actions) || actions.length !== 2) {
      throw new Error("Actions must contain exactly two actions");
    }
    const copiedActions: [Action, Action] = [copyAction(actions[0]), copyAction(actions[1])];
    const previousPhase = this.match.phase;
    this.match.tick(copiedActions);
    this.afterTick?.(previousPhase);
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

  /** Select a complete match pair through Match's public validation boundary. */
  selectPlayer(playerId: FighterId, opponentId: FighterId): DebugMatchSnapshot {
    this.match.selectPlayer(playerId, opponentId);
    return this.snapshot();
  }

  forceFighter(index: 0 | 1, patch: DebugFighterPatch): DebugMatchSnapshot {
    if (!validFighterIndex(index)) {
      throw new Error("Fighter index must be 0 or 1");
    }
    const fighter = this.match.fighters[index];
    validateAllowedKeys(patch, FIGHTER_FIELDS, "fighter");
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
      effects: Object.freeze(this.match.effects.map(copyEffect)),
      phase: this.match.phase,
      round: this.match.round,
      winner: this.match.winner,
      phaseTicks: this.match.phaseTicks,
    };
    return Object.freeze(snapshot);
  }
}

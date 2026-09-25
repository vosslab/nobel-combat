import { NEUTRAL } from "./match";
import { specialTierForMeter } from "./match";
import type { Action, Match } from "./match";
import { fighterById } from "./roster/roster";

export type RandomSource = () => number;
export type AiController = (match: Match) => Action;

export function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

const LIGHT_COOLDOWN_TICKS = 42;
const HEAVY_COOLDOWN_TICKS = 66;
const BLOCK_TICKS = 28;

/**
 * Creates Blue's small, deterministic-per-random-source combat controller.
 *
 * The controller owns transient reaction and attack cadence state. Match owns
 * all authoritative combat state, so a caller can use a seeded random source
 * for repeatable simulations without changing the match contract.
 */
export function createAi(random: RandomSource = Math.random): AiController {
  let cooldown = 0;
  let blockTicks = 0;
  let previousHp: number | undefined;

  return (match: Match): Action => {
    const [red, blue] = match.fighters;
    if (match.phase !== "fight") {
      cooldown = 0;
      blockTicks = 0;
      previousHp = blue.hp;
      return NEUTRAL;
    }

    const dx = red.x - blue.x;
    const dz = red.z - blue.z;
    const distance = Math.hypot(dx, dz);
    const profile = fighterById(blue.id).ai;
    if (previousHp !== undefined && blue.hp < previousHp && random() < profile.blockChance) {
      blockTicks = BLOCK_TICKS;
    }
    previousHp = blue.hp;
    if (blockTicks > 0) blockTicks--;
    if (cooldown > 0) cooldown--;

    const canAct = blue.state === "idle" || blue.state === "move" || blue.state === "block";
    if (canAct && blockTicks === 0 && blue.meter >= 100) {
      const tier = specialTierForMeter(blue.meter);
      const specialRange = profile.specialRange[tier - 1];
      if (specialRange !== undefined && distance <= specialRange) {
        return { ...NEUTRAL, special: true };
      }
    }

    const attack =
      canAct && distance <= profile.preferredRange && cooldown === 0 && blockTicks === 0;
    const heavy = attack && random() < profile.heavyChance;
    if (attack) cooldown = heavy ? HEAVY_COOLDOWN_TICKS : LIGHT_COOLDOWN_TICKS;

    return {
      x: distance > profile.preferredRange ? (dx / (distance || 1)) * 0.72 : 0,
      z: distance > profile.preferredRange ? (dz / (distance || 1)) * 0.72 : 0,
      light: attack && !heavy,
      heavy,
      block: blockTicks > 0,
      special: false,
    };
  };
}

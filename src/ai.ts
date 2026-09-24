import { NEUTRAL } from "./match";
import type { Action, Match } from "./match";

export type RandomSource = () => number;
export type AiController = (match: Match) => Action;

export function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

const APPROACH_DISTANCE = 1.55;
const ATTACK_DISTANCE = 2.1;
const LIGHT_COOLDOWN_TICKS = 42;
const HEAVY_COOLDOWN_TICKS = 66;
const BLOCK_TICKS = 28;
const WARBURG_LACTATE_REACH = 2.45;
const WARBURG_GLYCOLYSIS_REACH = 3.2;
const CURIE_SEPARATION_REACH = 1.95;

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
    if (previousHp !== undefined && blue.hp < previousHp && random() < 0.45) {
      blockTicks = BLOCK_TICKS;
    }
    previousHp = blue.hp;
    if (blockTicks > 0) blockTicks--;
    if (cooldown > 0) cooldown--;

    const canAct = blue.state === "idle" || blue.state === "move" || blue.state === "block";
    if (canAct && cooldown === 0 && blockTicks === 0) {
      if (
        blue.role === "warburg" &&
        blue.lactateDriveCooldown === 0 &&
        distance > ATTACK_DISTANCE &&
        distance <= WARBURG_LACTATE_REACH
      ) {
        cooldown = LIGHT_COOLDOWN_TICKS;
        return { x: 0, z: 0, light: true, heavy: true, block: false };
      }
      if (
        blue.role === "warburg" &&
        blue.aerobicGlycolysisCooldown === 0 &&
        !blue.aerobicLightReady &&
        distance > WARBURG_LACTATE_REACH &&
        distance <= WARBURG_GLYCOLYSIS_REACH
      ) {
        cooldown = LIGHT_COOLDOWN_TICKS;
        return { x: 0, z: 0, light: true, heavy: false, block: true };
      }
      if (
        blue.role === "curie" &&
        blue.separationStepCooldown === 0 &&
        distance <= CURIE_SEPARATION_REACH
      ) {
        cooldown = LIGHT_COOLDOWN_TICKS;
        return { x: 0, z: 0, light: true, heavy: false, block: true };
      }
    }

    const attack = canAct && distance < ATTACK_DISTANCE && cooldown === 0 && blockTicks === 0;
    if (attack && blue.role === "warburg" && blue.aerobicLightReady) {
      cooldown = LIGHT_COOLDOWN_TICKS;
      return { x: 0, z: 0, light: true, heavy: false, block: false };
    }
    if (attack) cooldown = random() < 0.3 ? HEAVY_COOLDOWN_TICKS : LIGHT_COOLDOWN_TICKS;

    return {
      x: distance > APPROACH_DISTANCE ? (dx / (distance || 1)) * 0.72 : 0,
      z: distance > APPROACH_DISTANCE ? (dz / (distance || 1)) * 0.72 : 0,
      light: attack && cooldown === LIGHT_COOLDOWN_TICKS,
      heavy: attack && cooldown === HEAVY_COOLDOWN_TICKS,
      block: blockTicks > 0,
    };
  };
}

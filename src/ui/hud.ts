import { fighterById } from "../roster/roster";
import type { FighterId } from "../roster/roster";
import { specialTierForMeter } from "../match";
import type { Match, Phase } from "../match";

export type ControlHelp = Readonly<{
  keyboard: string;
  gamepad: string;
}>;

type HudElements = Readonly<{
  redName: HTMLElement;
  blueName: HTMLElement;
  redStatus: HTMLElement;
  blueStatus: HTMLElement;
  redHealth: HTMLElement;
  blueHealth: HTMLElement;
  redWins: HTMLElement;
  blueWins: HTMLElement;
  redMeter: HTMLElement;
  blueMeter: HTMLElement;
  redSpecial: HTMLElement;
  blueSpecial: HTMLElement;
  status: HTMLElement;
}>;

export const CONTROL_HELP: ControlHelp = {
  keyboard: [
    "WASD move",
    "J light",
    "K heavy knockdown",
    "L block",
    "I Special",
    "P/Space pause",
    "R restart",
  ].join(" \u00b7 "),
  gamepad: [
    "Gamepad: left stick/D-pad move",
    "right stick view",
    "south light",
    "east heavy knockdown",
    "north Special (button 3)",
    "right shoulder block",
    "Start restart",
  ].join(" \u00b7 "),
};

export function fighterName(id: FighterId): string {
  return fighterById(id).name;
}

export function fighterLabel(id: FighterId, index: number): string {
  return `${fighterName(id)}${index === 1 ? " AI" : ""}`;
}

export function matchStatusText(phase: Phase, round: number, winnerId: FighterId): string {
  if (phase === "fight") return `ROUND ${round}`;
  const winner = fighterName(winnerId).toUpperCase();
  return phase === "roundOver" ? `${winner} KO!` : `${winner} WINS THE MATCH`;
}

export function renderHud(match: Match, elements: HudElements): void {
  const [red, blue] = match.fighters;
  const redLabel = fighterLabel(red.id, 0);
  const blueLabel = fighterLabel(blue.id, 1);
  elements.redName.textContent = redLabel.toUpperCase();
  elements.blueName.textContent = blueLabel.toUpperCase();
  elements.redStatus.setAttribute("aria-label", `${redLabel} status`);
  elements.blueStatus.setAttribute("aria-label", `${blueLabel} status`);
  elements.redHealth.style.width = `${red.hp}%`;
  elements.blueHealth.style.width = `${blue.hp}%`;
  elements.redHealth.parentElement?.setAttribute("aria-label", `${redLabel} health`);
  elements.blueHealth.parentElement?.setAttribute("aria-label", `${blueLabel} health`);
  elements.redHealth.parentElement?.setAttribute("aria-valuenow", String(red.hp));
  elements.blueHealth.parentElement?.setAttribute("aria-valuenow", String(blue.hp));
  elements.redWins.textContent = `Wins ${red.wins}`;
  elements.blueWins.textContent = `Wins ${blue.wins}`;
  renderMeter(red, redLabel, elements.redMeter, elements.redSpecial);
  renderMeter(blue, blueLabel, elements.blueMeter, elements.blueSpecial);
  const winner = match.fighters[match.winner === 1 ? 1 : 0];
  const message = matchStatusText(match.phase, match.round, winner.id);
  if (elements.status.textContent !== message) elements.status.textContent = message;
}

function renderMeter(
  fighter: Match["fighters"][number],
  label: string,
  meter: HTMLElement,
  special: HTMLElement,
): void {
  const definition = fighterById(fighter.id);
  const tier = specialTierForMeter(fighter.meter);
  const nextSpecial = definition.specials[tier - 1]!;
  meter.style.width = `${(fighter.meter / 300) * 100}%`;
  meter.parentElement?.setAttribute("aria-label", `${label} special meter`);
  meter.parentElement?.setAttribute("aria-valuenow", String(fighter.meter));
  meter.parentElement?.setAttribute(
    "aria-valuetext",
    `${fighter.meter} of 300, next: ${nextSpecial.name}`,
  );
  special.textContent = `Next: ${nextSpecial.name}`;
}

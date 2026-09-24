import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Camera,
  FreeCamera,
} from "@babylonjs/core";
import { Match, NEUTRAL } from "./match";
import type { Action, Fighter, PlayerFighterRole } from "./match";
import { DebugHarness } from "./debug_harness";
import { decodeFranklinUnlock, lockedFranklinUnlock } from "./franklin_unlock";
import type { FranklinUnlockState } from "./franklin_unlock";
import { consumeCompletedNobelMatchWin } from "./franklin_progression";
import { readFranklinUnlock, writeFranklinUnlock } from "./franklin_storage";
import { installPlaytestProbe, playtestMode } from "./playtest_probe";
import { createAi } from "./ai";
import { mapPlayerInput, mapSelectionInput } from "./input";
import { loadRiggedFighters } from "./rigged_fighter";
import type { RiggedFighterModel } from "./rigged_fighter";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const redHealth = document.querySelector<HTMLElement>("#red-health");
const blueHealth = document.querySelector<HTMLElement>("#blue-health");
const status = document.querySelector<HTMLElement>("#status");
const redWins = document.querySelector<HTMLElement>("#red-wins");
const blueWins = document.querySelector<HTMLElement>("#blue-wins");
const redName = document.querySelector<HTMLElement>("#red-name");
const blueName = document.querySelector<HTMLElement>("#blue-name");
const redStatus = document.querySelector<HTMLElement>("#red-status");
const blueStatus = document.querySelector<HTMLElement>("#blue-status");
const moveIndicator = document.querySelector<HTMLDivElement>("#move-indicator");
const moveName = document.querySelector<HTMLElement>("#move-name");
const moveMeterFill = document.querySelector<HTMLElement>("#move-meter-fill");
const curieIndicator = document.querySelector<HTMLDivElement>("#curie-indicator");
const curieMeterFill = document.querySelector<HTMLElement>("#curie-meter-fill");
const fighterSelect = document.querySelector<HTMLDialogElement>("#fighter-select");
const fighterChoices = document.querySelector<HTMLFieldSetElement>("#fighter-choices");
const fighterSelectHelp = document.querySelector<HTMLElement>("#fighter-select-help");
const selectWarburg = document.querySelector<HTMLInputElement>("#select-warburg");
const selectCurie = document.querySelector<HTMLInputElement>("#select-curie");
const startMatch = document.querySelector<HTMLButtonElement>("#start-match");
const changeFighter = document.querySelector<HTMLButtonElement>("#change-fighter");
const franklinUnlockAnnouncement = document.querySelector<HTMLElement>(
  "#franklin-unlock-announcement",
);
const playerMoveHelp = document.querySelector<HTMLElement>("#player-move-help");
const gamepadMoveHelp = document.querySelector<HTMLElement>("#gamepad-move-help");
if (
  !canvas ||
  !redHealth ||
  !blueHealth ||
  !status ||
  !redWins ||
  !blueWins ||
  !redName ||
  !blueName ||
  !redStatus ||
  !blueStatus ||
  !moveIndicator ||
  !moveName ||
  !moveMeterFill ||
  !curieIndicator ||
  !curieMeterFill ||
  !fighterSelect ||
  !fighterChoices ||
  !fighterSelectHelp ||
  !selectWarburg ||
  !selectCurie ||
  !startMatch ||
  !changeFighter ||
  !franklinUnlockAnnouncement ||
  !playerMoveHelp ||
  !gamepadMoveHelp
)
  throw new Error("Game host is incomplete");
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.clearColor = new Color4(0.07, 0.09, 0.15, 1);
const camera = new FreeCamera("camera", new Vector3(0, 8, -15), scene);
camera.setTarget(new Vector3(0, 1, 0));
camera.minZ = 0.1;
new HemisphericLight("sky", new Vector3(0, 1, 0), scene).intensity = 0.9;
const sun = new DirectionalLight("sun", new Vector3(-0.4, -1, 0.3), scene);
sun.intensity = 0.7;
const material = (name: string, color: Color3): StandardMaterial => {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  return m;
};
const floor = MeshBuilder.CreateGround("arena", { width: 20, height: 14 }, scene);
floor.material = material("floor", new Color3(0.2, 0.25, 0.31));
const trim = material("trim", new Color3(0.7, 0.76, 0.72));
for (const x of [-10, 10]) {
  const wall = MeshBuilder.CreateBox("side", { width: 0.2, height: 0.35, depth: 14.2 }, scene);
  wall.position.set(x, 0.17, 0);
  wall.material = trim;
}
for (const z of [-7, 7]) {
  const wall = MeshBuilder.CreateBox("end", { width: 20, height: 0.35, depth: 0.2 }, scene);
  wall.position.set(0, 0.17, z);
  wall.material = trim;
}
const line = MeshBuilder.CreateBox("center", { width: 0.035, height: 0.01, depth: 13 }, scene);
line.position.y = 0.012;
line.material = trim;
const oxygenCueMaterial = new StandardMaterial("oxygen-transfer-cue-material", scene);
oxygenCueMaterial.diffuseColor = new Color3(1, 0.28, 0.2);
oxygenCueMaterial.emissiveColor = new Color3(0.8, 0.09, 0.03);
oxygenCueMaterial.disableLighting = true;
const oxygenCue = MeshBuilder.CreateTorus(
  "oxygen-transfer-impact-cue",
  { diameter: 1.35, thickness: 0.07, tessellation: 32 },
  scene,
);
oxygenCue.material = oxygenCueMaterial;
oxygenCue.isPickable = false;
oxygenCue.setEnabled(false);
const outputCueMaterial = new StandardMaterial("aerobic-output-cue-material", scene);
outputCueMaterial.diffuseColor = new Color3(0.3, 0.9, 0.78);
outputCueMaterial.emissiveColor = new Color3(0.08, 0.62, 0.48);
outputCueMaterial.disableLighting = true;
outputCueMaterial.alpha = 0.55;
const outputCue = MeshBuilder.CreateTorus(
  "aerobic-output-cue",
  { diameter: 2.0, thickness: 0.035, tessellation: 40 },
  scene,
);
outputCue.rotation.x = Math.PI / 2;
outputCue.material = outputCueMaterial;
outputCue.isPickable = false;
outputCue.setEnabled(false);
let oxygenCueTicks = 0;
let previousHealth: [number, number] = [100, 100];

let models: [RiggedFighterModel, RiggedFighterModel] | null = null;
const match = new Match();
void loadRiggedFighters(scene, (message) => {
  status.textContent = message;
})
  .then((loaded) => {
    models = loaded;
  })
  .catch((error: unknown) => {
    status.textContent = error instanceof Error ? error.message : String(error);
  });
const debug = playtestMode() === "debug" ? new DebugHarness(match) : null;
installPlaytestProbe(
  match,
  engine,
  scene,
  camera,
  debug,
  () => ({
    yaw: cameraYaw,
    pitch: cameraPitch,
    zoom: cameraZoom,
  }),
  () => (models ? match.fighters.map((fighter) => modelForRole(fighter.role).snapshot()) : null),
  () => ({
    oxygen: {
      enabled: oxygenCue.isEnabled(),
      x: oxygenCue.position.x,
      y: oxygenCue.position.y,
      z: oxygenCue.position.z,
    },
    output: {
      enabled: outputCue.isEnabled(),
      x: outputCue.position.x,
      y: outputCue.position.y,
      z: outputCue.position.z,
    },
  }),
  () => mapPlayerInput(keys, navigator.getGamepads?.()[0], cameraYaw),
);
const keys = new Set<string>();
const startupUnlock = readFranklinUnlock();
let unlockState: FranklinUnlockState = startupUnlock.state;
let unlockProgressionAvailable = !startupUnlock.readFailed;
let selectedRole: PlayerFighterRole = "warburg";
let selectionConfirmed = debug !== null;
let selectionHeld = { previous: false, next: false, confirm: false };
let waitingForSelectionRelease = false;
let franklinUnlockAnnounced = false;
const fighterRoles = (): readonly PlayerFighterRole[] =>
  unlockState.unlocked ? ["warburg", "curie", "franklin"] : ["warburg", "curie"];
const isPlayerFighterRole = (value: string): value is PlayerFighterRole =>
  value === "warburg" || value === "curie" || value === "franklin";
const fighterChoice = (role: PlayerFighterRole): HTMLInputElement | null =>
  fighterChoices.querySelector(`input[name="fighter"][value="${role}"]`);
function createFranklinChoice(): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "fighter-choice";
  label.htmlFor = "select-franklin";
  const input = document.createElement("input");
  input.id = "select-franklin";
  input.name = "fighter";
  input.type = "radio";
  input.value = "franklin";
  const description = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = "Rosalind Franklin";
  const detail = document.createElement("small");
  detail.textContent = "Precision timing and structural insight";
  description.append(name, detail);
  label.append(input, description);
  return label;
}
function renderFighterChoices(): void {
  const franklinChoice = fighterChoice("franklin");
  if (unlockState.unlocked && !franklinChoice) fighterChoices!.append(createFranklinChoice());
  if (!unlockState.unlocked && franklinChoice) franklinChoice.closest("label")?.remove();
  if (!fighterRoles().includes(selectedRole)) selectedRole = "warburg";
  for (const role of fighterRoles()) {
    const choice = fighterChoice(role);
    if (choice) choice.checked = role === selectedRole;
  }
  fighterSelectHelp!.textContent = unlockState.unlocked
    ? "Select Otto Heinrich Warburg, Marie Curie, or Rosalind Franklin. The other fighter is controlled by the AI."
    : "Select Otto Heinrich Warburg or Marie Curie. The other fighter is controlled by the AI.";
}
function decodedFranklinUnlock(value: unknown): FranklinUnlockState {
  try {
    const encoded = JSON.stringify(value);
    return typeof encoded === "string" ? decodeFranklinUnlock(encoded) : lockedFranklinUnlock();
  } catch {
    return lockedFranklinUnlock();
  }
}
function setInjectedFranklinUnlock(value: unknown): void {
  unlockState = decodedFranklinUnlock(value);
  renderFighterChoices();
}
/**
 * F6B calls this only after it has durably committed the decoded unlock record.
 * This seam deliberately has no storage dependency so post-commit behavior is
 * independently testable and cannot optimistically reveal Franklin.
 */
function handleFranklinUnlockCommitted(value: unknown): void {
  const committedState = decodedFranklinUnlock(value);
  if (!committedState.unlocked) return;
  unlockState = committedState;
  renderFighterChoices();
  if (franklinUnlockAnnounced) return;
  franklinUnlockAnnounced = true;
  franklinUnlockAnnouncement!.textContent = "Rosalind Franklin is now available.";
}
function consumeCompletedMatchProgression(
  previousPhase: "fight" | "roundOver" | "matchOver",
): void {
  const result = consumeCompletedNobelMatchWin(
    {
      previousPhase,
      phase: match.phase,
      winner: match.winner,
      playerRole: match.playerRole,
    },
    unlockState,
    unlockProgressionAvailable,
    (next) => writeFranklinUnlock(next).written,
  );
  unlockProgressionAvailable = result.progressionAvailable;
  if (!result.committed) return;
  unlockState = result.state;
  if (result.state.unlocked) handleFranklinUnlockCommitted(result.state.record);
}
function updateControlsHelp(): void {
  if (selectedRole === "warburg") {
    playerMoveHelp!.textContent =
      "WASD move · J light · K Oxygen Transfer · L block · J+K Lactate Drive · J+L Aerobic Glycolysis · R restart";
    gamepadMoveHelp!.textContent =
      "Gamepad: left stick/D-pad move · right stick view · south light · east Oxygen Transfer · south+east Lactate Drive · south+right shoulder Aerobic Glycolysis · right shoulder block · Start restart";
  } else if (selectedRole === "curie") {
    playerMoveHelp!.textContent =
      "WASD move · J light · K heavy knockdown · L block · J+L Separation Step · R restart";
    gamepadMoveHelp!.textContent =
      "Gamepad: left stick/D-pad move · right stick view · south light · east heavy knockdown · south+right shoulder Separation Step · right shoulder block · Start restart";
  } else {
    playerMoveHelp!.textContent = "WASD move · J light · K heavy knockdown · L block · R restart";
    gamepadMoveHelp!.textContent =
      "Gamepad: left stick/D-pad move · right stick view · south light · east heavy knockdown · right shoulder block · Start restart";
  }
}
function setSelectedRole(role: PlayerFighterRole, focus = false): void {
  if (!fighterRoles().includes(role)) return;
  selectedRole = role;
  renderFighterChoices();
  updateControlsHelp();
  if (focus) fighterChoice(role)?.focus();
}
function confirmSelection(): void {
  if (selectionConfirmed) return;
  selectionConfirmed = true;
  waitingForSelectionRelease = true;
  restartHeld = false;
  match.selectPlayer(selectedRole);
  fighterSelect!.close();
  canvas!.focus();
}
function reopenFighterSelection(): void {
  if (match.phase !== "matchOver") return;
  if (!fighterRoles().includes(selectedRole)) selectedRole = "warburg";
  renderFighterChoices();
  updateControlsHelp();
  selectionConfirmed = false;
  selectionHeld = mapSelectionInput(keys, navigator.getGamepads?.()[0]);
  waitingForSelectionRelease = false;
  restartHeld = false;
  accumulator = 0;
  fighterSelect!.hidden = false;
  fighterSelect!.showModal();
  requestAnimationFrame(() => fighterChoice(selectedRole)?.focus());
}
function updateSelectionInput(): void {
  if (selectionConfirmed) return;
  const input = mapSelectionInput(keys, navigator.getGamepads?.()[0]);
  const previous = input.previous && !input.next && !selectionHeld.previous;
  const next = input.next && !input.previous && !selectionHeld.next;
  const confirm = input.confirm && !selectionHeld.confirm;
  selectionHeld = input;
  const roles = fighterRoles();
  const selectedIndex = roles.indexOf(selectedRole);
  if (previous || next) {
    const direction = next ? 1 : -1;
    const index = selectedIndex < 0 ? 0 : selectedIndex;
    setSelectedRole(roles[(index + direction + roles.length) % roles.length]!, true);
  }
  if (confirm) confirmSelection();
}
setSelectedRole("warburg");
if (selectionConfirmed) fighterSelect.hidden = true;
else {
  fighterSelect.showModal();
  requestAnimationFrame(() => selectWarburg.focus());
}
fighterSelect.addEventListener("cancel", (event) => event.preventDefault());
fighterSelect.addEventListener("keydown", (event) => {
  if (event.code !== "Tab") return;
  const active = document.activeElement;
  const onRadio = active instanceof HTMLInputElement && active.name === "fighter";
  if (event.shiftKey && onRadio) {
    event.preventDefault();
    startMatch.focus();
  } else if (!event.shiftKey && active === startMatch) {
    event.preventDefault();
    fighterChoice(selectedRole)?.focus();
  }
});
fighterChoices.addEventListener("change", (event) => {
  const choice = event.target;
  if (!(choice instanceof HTMLInputElement) || !isPlayerFighterRole(choice.value)) return;
  setSelectedRole(choice.value);
});
startMatch.addEventListener("click", confirmSelection);
changeFighter.addEventListener("click", reopenFighterSelection);
if (playtestMode()) {
  Object.defineProperty(window, "__fightSetFranklinUnlock", {
    value: (value: unknown): void => setInjectedFranklinUnlock(value),
  });
  Object.defineProperty(window, "__fightCommitFranklinUnlock", {
    value: (value: unknown): void => handleFranklinUnlockCommitted(value),
  });
}
let cameraYaw = 0;
let cameraPitch = 0.5;
let cameraZoom = 1;
let dragging = false;
let pointerX = 0;
let pointerY = 0;
const clampView = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));
canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  pointerX = event.clientX;
  pointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  cameraYaw += (event.clientX - pointerX) * 0.006;
  cameraPitch = clampView(cameraPitch - (event.clientY - pointerY) * 0.004, 0.3, 0.85);
  pointerX = event.clientX;
  pointerY = event.clientY;
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});
canvas.addEventListener("pointercancel", () => {
  dragging = false;
});
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    cameraZoom = clampView(cameraZoom + Math.sign(event.deltaY) * 0.08, 0.85, 1.5);
  },
  { passive: false },
);
window.addEventListener("keydown", (e) => {
  if (
    [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyJ",
      "KeyK",
      "KeyL",
      "KeyR",
      "KeyQ",
      "KeyE",
      "BracketLeft",
      "BracketRight",
      "PageUp",
      "PageDown",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Space",
    ].includes(e.code)
  )
    e.preventDefault();
  keys.add(e.code);
  updateSelectionInput();
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  updateSelectionInput();
});
window.addEventListener("blur", () => {
  keys.clear();
  updateSelectionInput();
});
document
  .querySelector<HTMLButtonElement>("#restart")
  ?.addEventListener("click", () => match.restart());
let restartHeld = false;
function playerAction(): Action {
  if (waitingForSelectionRelease) {
    const selection = mapSelectionInput(keys, navigator.getGamepads?.()[0]);
    if (selection.previous || selection.next || selection.confirm) return NEUTRAL;
    waitingForSelectionRelease = false;
  }
  const frame = mapPlayerInput(keys, navigator.getGamepads?.()[0], cameraYaw);
  if (frame.restart && !restartHeld) match.restart();
  restartHeld = frame.restart;
  return frame.action;
}
const aiAction = createAi();
function drawFighter(f: Fighter, model: RiggedFighterModel): void {
  model.root.position.set(f.x, 0, f.z);
  model.root.rotation.y = f.facing;
  model.setFighterName(fighterName(f.role));
  model.update(f.state);
}
function modelForRole(role: Fighter["role"]): RiggedFighterModel {
  if (!models) throw new Error("Rigged fighters are not loaded");
  switch (role) {
    case "warburg":
      return models[0];
    case "curie":
    case "franklin":
    case "opponent":
      // Curie and Franklin use the authored female_31 model in separate
      // matches. Combat state remains independent of presentation.
      return models[1];
  }
}
function fighterName(
  role: Fighter["role"],
): "Otto Heinrich Warburg" | "Marie Curie" | "Rosalind Franklin" {
  switch (role) {
    case "warburg":
      return "Otto Heinrich Warburg";
    case "curie":
    case "opponent":
      return "Marie Curie";
    case "franklin":
      return "Rosalind Franklin";
  }
}
function fighterLabel(fighter: Fighter, index: number): string {
  return `${fighterName(fighter.role)}${index === 1 ? " AI" : ""}`;
}
function hud(): void {
  const [red, blue] = match.fighters;
  const redLabel = fighterLabel(red, 0);
  const blueLabel = fighterLabel(blue, 1);
  redName!.textContent = redLabel.toUpperCase();
  blueName!.textContent = blueLabel.toUpperCase();
  redStatus!.setAttribute("aria-label", `${redLabel} status`);
  blueStatus!.setAttribute("aria-label", `${blueLabel} status`);
  redHealth!.style.width = red.hp + "%";
  blueHealth!.style.width = blue.hp + "%";
  redHealth!.parentElement?.setAttribute("aria-label", `${redLabel} health`);
  blueHealth!.parentElement?.setAttribute("aria-label", `${blueLabel} health`);
  redHealth!.parentElement?.setAttribute("aria-valuenow", String(red.hp));
  blueHealth!.parentElement?.setAttribute("aria-valuenow", String(blue.hp));
  redWins!.textContent = "Wins " + red.wins;
  blueWins!.textContent = "Wins " + blue.wins;
  const activeMoves = [red, blue]
    .filter((fighter) => fighter.role === "warburg")
    .flatMap((fighter) => [
      fighter.state === "heavy" ? "OXYGEN TRANSFER" : "",
      fighter.lactateDrive ? "LACTATE DRIVE" : "",
      fighter.aerobicOutputTicks > 0 ? "AEROBIC GLYCOLYSIS" : "",
    ])
    .filter(Boolean);
  moveName!.textContent = activeMoves.join("  +  ");
  moveIndicator!.hidden = activeMoves.length === 0;
  const warburg = [red, blue].find((fighter) => fighter.role === "warburg");
  moveMeterFill!.style.width = `${((warburg?.aerobicOutputTicks ?? 0) / 72) * 100}%`;
  const curie = [red, blue].find((fighter) => fighter.role === "curie" && fighter.separationStep);
  curieIndicator!.hidden = !curie;
  curieMeterFill!.style.width = `${curie ? ((24 - curie.ticks) / 24) * 100 : 0}%`;
  const winner = match.winner === 1 ? blue : red;
  const message =
    match.phase === "fight"
      ? "ROUND " + match.round
      : match.phase === "roundOver"
        ? `${fighterName(winner.role).toUpperCase()} KO!`
        : `${fighterName(winner.role).toUpperCase()} WINS THE MATCH`;
  if (status!.textContent !== message) status!.textContent = message;
  changeFighter!.hidden = match.phase !== "matchOver";
}
let accumulator = 0;
let last = performance.now();
engine.runRenderLoop(() => {
  const now = performance.now();
  if (!models) {
    last = now;
    scene.render();
    return;
  }
  const frameSeconds = Math.min((now - last) / 1000, 0.05);
  accumulator = Math.min(accumulator + frameSeconds, 0.25);
  last = now;
  const pad = navigator.getGamepads?.()[0];
  const stickX = pad?.axes[2] ?? 0;
  const stickY = pad?.axes[3] ?? 0;
  const orbitX =
    Number(keys.has("KeyE")) -
    Number(keys.has("KeyQ")) +
    (Math.abs(stickX) > 0.2 && Number.isFinite(stickX) ? stickX : 0);
  const orbitY = Math.abs(stickY) > 0.2 && Number.isFinite(stickY) ? stickY : 0;
  cameraYaw += clampView(orbitX, -1, 1) * frameSeconds * 1.6;
  cameraPitch = clampView(
    cameraPitch +
      (Number(keys.has("PageUp")) - Number(keys.has("PageDown"))) * frameSeconds * 0.8 -
      orbitY * frameSeconds * 0.9,
    0.3,
    0.85,
  );
  cameraZoom = clampView(
    cameraZoom +
      (Number(keys.has("BracketLeft")) - Number(keys.has("BracketRight"))) * frameSeconds * 0.8,
    0.85,
    1.5,
  );
  updateSelectionInput();
  if (!selectionConfirmed) accumulator = 0;
  while (!debug && selectionConfirmed && accumulator >= 1 / 60) {
    const previousPhase = match.phase;
    match.tick([playerAction(), aiAction(match)]);
    consumeCompletedMatchProgression(previousPhase);
    accumulator -= 1 / 60;
  }
  if (debug) accumulator = 0;
  const [red, blue] = match.fighters;
  drawFighter(red, modelForRole(red.role));
  drawFighter(blue, modelForRole(blue.role));
  const warburgIndex = red.role === "warburg" ? 0 : blue.role === "warburg" ? 1 : null;
  const warburg = warburgIndex === 0 ? red : warburgIndex === 1 ? blue : null;
  const warburgTarget = warburgIndex === 0 ? blue : warburgIndex === 1 ? red : null;
  const previousTargetHealth = warburgIndex === 0 ? previousHealth[1] : previousHealth[0];
  if (
    warburg &&
    warburgTarget &&
    warburg.state === "heavy" &&
    warburgTarget.hp < previousTargetHealth
  )
    oxygenCueTicks = 12;
  if (
    match.phase === "fight" &&
    match.round === 1 &&
    red.hp === 100 &&
    blue.hp === 100 &&
    red.wins === 0 &&
    blue.wins === 0
  )
    oxygenCueTicks = 0;
  previousHealth = [red.hp, blue.hp];
  if (oxygenCueTicks > 0) {
    const progress = oxygenCueTicks / 12;
    oxygenCue.position.set(warburgTarget?.x ?? 0, 1.35, warburgTarget?.z ?? 0);
    oxygenCue.rotation.y = Math.PI - cameraYaw;
    oxygenCue.scaling.setAll(1 + (1 - progress) * 0.18);
    oxygenCueMaterial.alpha = 0.85 * progress;
    oxygenCue.setEnabled(true);
    oxygenCueTicks--;
  } else {
    oxygenCue.setEnabled(false);
  }
  outputCue.position.set(warburg?.x ?? 0, 0.045, warburg?.z ?? 0);
  outputCue.scaling.setAll(0.85 + ((warburg?.aerobicOutputTicks ?? 0) / 72) * 0.15);
  outputCue.setEnabled(Boolean(warburg && warburg.aerobicOutputTicks > 0));
  const mid = new Vector3((red.x + blue.x) / 2, 0.75, (red.z + blue.z) / 2);
  const separationX = red.x - blue.x;
  const separationZ = red.z - blue.z;
  const aspect = engine.getRenderWidth() / Math.max(engine.getRenderHeight(), 1);
  const verticalFov =
    camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED
      ? camera.fov
      : 2 * Math.atan(Math.tan(camera.fov / 2) / aspect);
  const horizontalFov =
    camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED
      ? 2 * Math.atan(Math.tan(camera.fov / 2) * aspect)
      : camera.fov;
  const verticalHalfAngle = Math.max(0.025, verticalFov / 2 - 0.05);
  const horizontalHalfAngle = Math.max(0.025, horizontalFov / 2 - 0.05);
  const sinYaw = Math.sin(cameraYaw);
  const cosYaw = Math.cos(cameraYaw);
  const sinPitch = Math.sin(cameraPitch);
  const cosPitch = Math.cos(cameraPitch);
  // These dimensions conservatively cover the current vendored humans in any
  // camera orbit. Their bind-pose GLB bounds have a maximum horizontal radius
  // of 0.97 and a maximum height of 1.8 world units.
  const fighterRadius = 0.97;
  const fighterTop = Math.max(
    red.role === "warburg" ? 1.8 : 1.67,
    blue.role === "warburg" ? 1.8 : 1.67,
  );
  const sideSeparation = Math.abs(separationX * cosYaw + separationZ * sinYaw) / 2;
  const groundUpSeparation =
    Math.abs(-separationX * sinYaw + separationZ * cosYaw) * sinPitch * 0.5;
  const depthSeparation = Math.abs(separationX * sinYaw - separationZ * cosYaw) * cosPitch * 0.5;
  const bodyVerticalExtent = Math.max(0.75, fighterTop - 0.75);
  const horizontalExtent = sideSeparation + fighterRadius;
  const verticalExtent =
    bodyVerticalExtent * cosPitch + groundUpSeparation + fighterRadius * sinPitch + 0.15;
  const fighterDepthRadius = fighterRadius * cosPitch + bodyVerticalExtent * sinPitch + 0.15;
  const depthExtent = depthSeparation + fighterDepthRadius;
  // Perspective fit uses each camera-space screen axis and adds the nearest
  // fighter depth. The prior circumscribed-sphere fit charged the diagonal
  // silhouette radius to the narrower FOV on both axes, shrinking the fighters
  // unnecessarily in ordinary landscape play.
  const framingDistance = Math.max(
    depthExtent + horizontalExtent / Math.tan(horizontalHalfAngle),
    depthExtent + verticalExtent / Math.tan(verticalHalfAngle),
  );
  const zoomDistance = 1 + (cameraZoom - 0.85) * 0.7;
  const radius = Math.max(6.5, framingDistance) * zoomDistance;
  const desired = mid.add(
    new Vector3(sinYaw * cosPitch * radius, sinPitch * radius, -cosYaw * cosPitch * radius),
  );
  // The debug harness can advance hundreds of ticks between rendered frames.
  // Snap its camera to the resulting state; live play retains smooth tracking.
  camera.position = debug ? desired : Vector3.Lerp(camera.position, desired, 0.08);
  camera.setTarget(mid);
  hud();
  scene.render();
});
window.addEventListener("resize", () => engine.resize());

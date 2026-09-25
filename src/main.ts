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
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Match, NEUTRAL } from "./match";
import type { Action, Fighter } from "./match";
import { fighterById, ROSTER } from "./roster/roster";
import type { FighterId } from "./roster/roster";
import { FighterChooser } from "./ui/chooser";
import { HitCues } from "./ui/hit_cues";
import { CONTROL_HELP, renderHud } from "./ui/hud";
import { SuperCard } from "./ui/super_card";
import { SpecialVfx } from "./vfx";
import { DebugHarness } from "./debug_harness";
import { consumeCompletedPlayerMatchWin } from "./progress/progression";
import { readProgress, writeProgress } from "./progress/storage";
import { decodeProgress, starterProgress } from "./progress/unlocks";
import type { ProgressState } from "./progress/unlocks";
import { installPlaytestProbe, playtestMode } from "./playtest_probe";
import { createAi, createRandomSource } from "./ai";
import { mapPlayerInput, mapSelectionInput } from "./input";
import { loadMatchFighters } from "./rig/loader";
import type { RiggedFighterModel } from "./rig/presentation";

const fixedPlaytestSeed = 0x1;
const aiSeed = playtestMode() ? fixedPlaytestSeed : Math.floor(Math.random() * 2 ** 32);
const opponentSeed = playtestMode()
  ? fixedPlaytestSeed ^ 0x9e3779b9
  : Math.floor(Math.random() * 2 ** 32);
const aiRandom = createRandomSource(aiSeed);
const opponentRandom = createRandomSource(opponentSeed);
const canvas = document.querySelector<HTMLCanvasElement>("#game");
const redHealth = document.querySelector<HTMLElement>("#red-health");
const blueHealth = document.querySelector<HTMLElement>("#blue-health");
const redMeter = document.querySelector<HTMLElement>("#red-meter");
const blueMeter = document.querySelector<HTMLElement>("#blue-meter");
const redSpecial = document.querySelector<HTMLElement>("#red-special");
const blueSpecial = document.querySelector<HTMLElement>("#blue-special");
const status = document.querySelector<HTMLElement>("#status");
const redWins = document.querySelector<HTMLElement>("#red-wins");
const blueWins = document.querySelector<HTMLElement>("#blue-wins");
const redName = document.querySelector<HTMLElement>("#red-name");
const blueName = document.querySelector<HTMLElement>("#blue-name");
const redStatus = document.querySelector<HTMLElement>("#red-status");
const blueStatus = document.querySelector<HTMLElement>("#blue-status");
const redBanner = document.querySelector<HTMLElement>("#red-special-banner");
const redBannerName = document.querySelector<HTMLElement>("#red-special-banner-name");
const redBannerCaption = document.querySelector<HTMLElement>("#red-special-banner-caption");
const blueBanner = document.querySelector<HTMLElement>("#blue-special-banner");
const blueBannerName = document.querySelector<HTMLElement>("#blue-special-banner-name");
const blueBannerCaption = document.querySelector<HTMLElement>("#blue-special-banner-caption");
const superCardRoot = document.querySelector<HTMLElement>("#super-card");
const superCardFighter = document.querySelector<HTMLElement>("#super-card-fighter");
const superCardSpecial = document.querySelector<HTMLElement>("#super-card-special");
const superCardCaption = document.querySelector<HTMLElement>("#super-card-caption");
const superCardAnnouncement = document.querySelector<HTMLElement>("#super-card-announcement");
const fighterSelect = document.querySelector<HTMLDialogElement>("#fighter-select");
const fighterChoices = document.querySelector<HTMLFieldSetElement>("#fighter-choices");
const fighterDetail = document.querySelector<HTMLElement>("#fighter-detail");
const fighterSelectHelp = document.querySelector<HTMLElement>("#fighter-select-help");
const startMatch = document.querySelector<HTMLButtonElement>("#start-match");
const changeFighter = document.querySelector<HTMLButtonElement>("#change-fighter");
const retryModelLoad = document.querySelector<HTMLButtonElement>("#retry-model-load");
const franklinUnlockAnnouncement = document.querySelector<HTMLElement>(
  "#franklin-unlock-announcement",
);
const playerMoveHelp = document.querySelector<HTMLElement>("#player-move-help");
const gamepadMoveHelp = document.querySelector<HTMLElement>("#gamepad-move-help");
if (
  !canvas ||
  !redHealth ||
  !blueHealth ||
  !redMeter ||
  !blueMeter ||
  !redSpecial ||
  !blueSpecial ||
  !status ||
  !redWins ||
  !blueWins ||
  !redName ||
  !blueName ||
  !redStatus ||
  !blueStatus ||
  !redBanner ||
  !redBannerName ||
  !redBannerCaption ||
  !blueBanner ||
  !blueBannerName ||
  !blueBannerCaption ||
  !superCardRoot ||
  !superCardFighter ||
  !superCardSpecial ||
  !superCardCaption ||
  !superCardAnnouncement ||
  !fighterSelect ||
  !fighterChoices ||
  !fighterDetail ||
  !fighterSelectHelp ||
  !startMatch ||
  !changeFighter ||
  !retryModelLoad ||
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
const shadowGenerator = new ShadowGenerator(1024, sun);
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.useKernelBlur = true;
shadowGenerator.blurKernel = 24;
shadowGenerator.setDarkness(0.68);
const material = (name: string, color: Color3): StandardMaterial => {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  return m;
};
const floor = MeshBuilder.CreateGround("arena", { width: 20, height: 14 }, scene);
floor.material = material("floor", new Color3(0.2, 0.25, 0.31));
floor.receiveShadows = true;
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
const centerMark = MeshBuilder.CreateBox(
  "center-mark",
  { width: 0.02, height: 0.01, depth: 13 },
  scene,
);
centerMark.position.y = 0.012;
centerMark.material = material("center-mark", new Color3(0.32, 0.39, 0.47));
const arenaMark = material("arena-mark", new Color3(0.26, 0.32, 0.39));
for (const x of [-7.6, 7.6]) {
  for (const z of [-4.6, 0, 4.6]) {
    const tick = MeshBuilder.CreateBox(
      "arena-boundary-tick",
      { width: 0.12, height: 0.012, depth: 0.7 },
      scene,
    );
    tick.position.set(x, 0.014, z);
    tick.material = arenaMark;
  }
}
const orbitMark = material("orbit-mark", new Color3(0.34, 0.41, 0.48));
const orbit = MeshBuilder.CreateTorus(
  "arena-orbit",
  { diameter: 6.5, thickness: 0.075, tessellation: 64 },
  scene,
);
orbit.position.y = 0.042;
orbit.material = orbitMark;
for (const [x, z, width, depth] of [
  [0, -3.25, 0.72, 0.14],
  [3.25, 0, 0.14, 0.72],
  [0, 3.25, 0.72, 0.14],
  [-3.25, 0, 0.14, 0.72],
] as const) {
  const calibration = MeshBuilder.CreateBox(
    "arena-calibration-mark",
    { width, height: 0.012, depth },
    scene,
  );
  calibration.position.set(x, 0.018, z);
  calibration.material = orbitMark;
}
const hitCues = new HitCues(scene);
const specialVfx = new SpecialVfx(scene);
const superCard = new SuperCard({
  root: superCardRoot,
  fighterName: superCardFighter,
  specialName: superCardSpecial,
  caption: superCardCaption,
  announcement: superCardAnnouncement,
});
let previousHealth: [number, number] = [100, 100];

let models: [RiggedFighterModel, RiggedFighterModel] | null = null;
let modelIds: [FighterId, FighterId] | null = null;
let pendingModelPair: string | null = null;
let failedModelPair: string | null = null;
let modelLoadRevision = 0;
const match = new Match();
type SpecialBanner = {
  root: HTMLElement;
  name: HTMLElement;
  caption: HTMLElement;
  remaining: number;
};
const banners: [SpecialBanner, SpecialBanner] = [
  { root: redBanner, name: redBannerName, caption: redBannerCaption, remaining: 0 },
  { root: blueBanner, name: blueBannerName, caption: blueBannerCaption, remaining: 0 },
];
function presentSpecialReleases(): void {
  for (const release of match.specialReleases) {
    const fighter = match.fighters[release.owner];
    if (!fighter) continue;
    specialVfx.release(release, fighter);
    const banner = banners[release.owner];
    if (!banner) continue;
    banner.name.textContent = release.special.name;
    banner.caption.textContent = release.special.caption;
    banner.remaining = 2.8;
    banner.root.hidden = false;
    if (release.tier === 3) superCard.present(fighterById(fighter.id).name, release.special);
  }
}
function tickMatch(actions: [Action, Action]): void {
  const previousPhase = match.phase;
  match.tick(actions);
  presentSpecialReleases();
  consumeCompletedMatchProgression(previousPhase);
}
const debug =
  playtestMode() === "debug"
    ? new DebugHarness(match, (previousPhase) => {
        presentSpecialReleases();
        consumeCompletedMatchProgression(previousPhase);
      })
    : null;
function visibleModelBounds(model: RiggedFighterModel): {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
} | null {
  const visibleMeshes = model.root
    .getChildMeshes()
    .filter((mesh) => mesh.getTotalVertices() > 0 && mesh.isEnabled(true));
  if (!visibleMeshes.length) return null;
  const bounds = model.root.getHierarchyBoundingVectors(
    true,
    (mesh) =>
      typeof mesh.getTotalVertices === "function" &&
      mesh.getTotalVertices() > 0 &&
      mesh.isEnabled(true),
  );
  return {
    min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
    max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
  };
}
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
  () => models?.map((model) => model.snapshot()) ?? null,
  () =>
    models?.map((model) => ({
      ...model.snapshot(),
      bounds: visibleModelBounds(model),
    })) ?? null,
  () => ({
    impacts: hitCues.snapshots(),
    activeSpecialEffects: specialVfx.activeCount,
  }),
  () => mapPlayerInput(keys, navigator.getGamepads?.()[0], cameraYaw),
);
const keys = new Set<string>();
let restartHeld = false;
let accumulator = 0;
const startupProgress = readProgress();
let progressState: ProgressState = startupProgress.state;
let progressionAvailable = !startupProgress.readFailed;
const availableFighterIds = (): readonly FighterId[] =>
  (Object.keys(ROSTER) as FighterId[]).filter((id) => progressState.unlockedSet.has(id));
function chooseOpponent(playerId: FighterId): FighterId {
  const candidates = availableFighterIds().filter((id) => id !== playerId);
  if (!candidates.length) throw new Error("No unlocked opponent is available.");
  const index = Math.min(candidates.length - 1, Math.floor(opponentRandom() * candidates.length));
  return candidates[index]!;
}
function decodedProgress(value: unknown): ProgressState {
  try {
    const encoded = JSON.stringify(value);
    return typeof encoded === "string" ? decodeProgress(encoded) : starterProgress();
  } catch {
    return starterProgress();
  }
}
function setInjectedProgress(value: unknown): void {
  progressState = decodedProgress(value);
  fighterChooser.refresh();
}
function newlyUnlocked(previous: ProgressState, next: ProgressState): FighterId[] {
  return [...next.unlockedSet].filter((id) => !previous.unlockedSet.has(id));
}
function announceUnlocked(ids: readonly FighterId[]): void {
  if (!ids.length) return;
  const names = ids.map((id) => fighterById(id).name);
  franklinUnlockAnnouncement!.textContent =
    names.length === 1
      ? `${names[0]} is now available.`
      : `${names.join(" and ")} are now available.`;
}
function handleCommittedProgress(next: ProgressState): void {
  const added = newlyUnlocked(progressState, next);
  progressState = next;
  fighterChooser.refresh();
  announceUnlocked(added);
}
function consumeCompletedMatchProgression(
  previousPhase: "fight" | "roundOver" | "matchOver",
): void {
  const result = consumeCompletedPlayerMatchWin(
    {
      previousPhase,
      phase: match.phase,
      winner: match.winner,
      playerId: match.playerId,
    },
    progressState,
    progressionAvailable,
    (next) => writeProgress(next).written,
  );
  progressionAvailable = result.progressionAvailable;
  if (!result.committed) {
    if (!progressionAvailable) {
      progressState = result.state;
      fighterChooser.refresh();
    }
    return;
  }
  handleCommittedProgress(result.state);
}
playerMoveHelp.textContent = CONTROL_HELP.keyboard;
gamepadMoveHelp.textContent = CONTROL_HELP.gamepad;
const fighterChooser = new FighterChooser({
  dialog: fighterSelect,
  choices: fighterChoices,
  detail: fighterDetail,
  help: fighterSelectHelp,
  start: startMatch,
  change: changeFighter,
  initiallyConfirmed: debug !== null,
  availableIds: availableFighterIds,
  currentInput: (): ReturnType<typeof mapSelectionInput> =>
    mapSelectionInput(keys, navigator.getGamepads?.()[0]),
  canReopen: (): boolean => match.phase === "matchOver",
  onOpen: (): void => {
    restartHeld = false;
    accumulator = 0;
  },
  onConfirm: (id: FighterId): void => {
    restartHeld = false;
    match.selectPlayer(id, chooseOpponent(id));
    canvas.focus();
  },
});
function updateSelectionInput(): void {
  fighterChooser.update(mapSelectionInput(keys, navigator.getGamepads?.()[0]));
}
if (fighterChooser.isConfirmed) fighterSelect.hidden = true;
else {
  fighterSelect.showModal();
  requestAnimationFrame(() => fighterChooser.focusSelected());
}
if (playtestMode()) {
  Object.defineProperty(window, "__fightSetProgress", {
    value: (value: unknown): void => setInjectedProgress(value),
  });
  Object.defineProperty(window, "__fightCommitProgress", {
    value: (value: unknown): void => handleCommittedProgress(decodedProgress(value)),
  });
}
if (playtestMode() === "debug") {
  Object.defineProperty(window, "__fightPreviewVfx", {
    value: (shape: Parameters<SpecialVfx["preview"]>[0]): void =>
      specialVfx.preview(shape, match.fighters[0]),
  });
}
let cameraYaw = 0;
let cameraPitch = 0.5;
let cameraZoom = 1;
let cameraFramed = false;
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
      "KeyI",
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
  ?.addEventListener("click", () => restartMatch());
function playerAction(): Action {
  if (
    fighterChooser.blockActionsUntilRelease(mapSelectionInput(keys, navigator.getGamepads?.()[0]))
  )
    return NEUTRAL;
  const frame = mapPlayerInput(keys, navigator.getGamepads?.()[0], cameraYaw);
  if (frame.restart && !restartHeld) restartMatch();
  restartHeld = frame.restart;
  return frame.action;
}
const aiAction = createAi(aiRandom);
function drawFighter(f: Fighter, model: RiggedFighterModel): void {
  model.root.position.set(f.x, 0, f.z);
  model.root.rotation.y = f.facing;
  model.setFighterName(fighterById(f.id).name);
  model.update(f.state, f);
}
function hud(): void {
  renderHud(match, {
    redName: redName!,
    blueName: blueName!,
    redStatus: redStatus!,
    blueStatus: blueStatus!,
    redHealth: redHealth!,
    blueHealth: blueHealth!,
    redMeter: redMeter!,
    blueMeter: blueMeter!,
    redSpecial: redSpecial!,
    blueSpecial: blueSpecial!,
    redWins: redWins!,
    blueWins: blueWins!,
    status: status!,
  });
  changeFighter!.hidden = match.phase !== "matchOver";
}
let last = performance.now();
function resetPairPresentation(): void {
  accumulator = 0;
  last = performance.now();
  for (const banner of banners) {
    banner.remaining = 0;
    banner.root.hidden = true;
  }
  superCard.dismiss();
  previousHealth = match.fighters.map((fighter) => fighter.hp) as [number, number];
}
function samePair(first: readonly FighterId[], second: readonly FighterId[]): boolean {
  return first[0] === second[0] && first[1] === second[1];
}
function hideModelLoadRetry(): void {
  retryModelLoad!.hidden = true;
}
function clearModelLoadFailure(): void {
  failedModelPair = null;
  hideModelLoadRetry();
}
function disposeLoadedPair(): void {
  for (const model of models ?? []) {
    for (const mesh of model.root.getChildMeshes()) {
      shadowGenerator.removeShadowCaster(mesh, false);
    }
    model.dispose();
  }
  models = null;
  modelIds = null;
}
function loadCurrentPair(): void {
  const [red, blue] = match.fighters;
  const wanted: [FighterId, FighterId] = [red.id, blue.id];
  if (models && modelIds && samePair(modelIds, wanted)) return;
  if (models && modelIds && samePair(modelIds, [wanted[1], wanted[0]])) {
    models = [models[1], models[0]];
    modelIds = wanted;
    resetPairPresentation();
    return;
  }

  const key = `${wanted[0]}:${wanted[1]}`;
  if (failedModelPair && failedModelPair !== key) clearModelLoadFailure();
  if (pendingModelPair || failedModelPair === key) return;
  const revision = ++modelLoadRevision;
  pendingModelPair = key;
  clearModelLoadFailure();
  disposeLoadedPair();
  resetPairPresentation();
  status!.textContent = `Loading ${fighterById(wanted[0]).name} and ${fighterById(wanted[1]).name}...`;
  void loadMatchFighters(scene, wanted[0], wanted[1], (message) => {
    const [currentRed, currentBlue] = match.fighters;
    if (revision === modelLoadRevision && samePair([currentRed.id, currentBlue.id], wanted))
      status!.textContent = message;
  })
    .then((loaded) => {
      if (revision !== modelLoadRevision) {
        loaded.forEach((model) => model.dispose());
        return;
      }
      const [currentRed, currentBlue] = match.fighters;
      const currentPair: [FighterId, FighterId] = [currentRed.id, currentBlue.id];
      if (!samePair(wanted, currentPair) && !samePair([wanted[1], wanted[0]], currentPair)) {
        loaded.forEach((model) => model.dispose());
        pendingModelPair = null;
        return;
      }
      models = samePair(wanted, currentPair) ? loaded : [loaded[1], loaded[0]];
      modelIds = currentPair;
      for (const model of models) {
        for (const mesh of model.root.getChildMeshes()) {
          if (mesh.getTotalVertices() > 0) shadowGenerator.addShadowCaster(mesh);
        }
      }
      pendingModelPair = null;
      clearModelLoadFailure();
      resetPairPresentation();
    })
    .catch(() => {
      if (revision !== modelLoadRevision) return;
      pendingModelPair = null;
      const [currentRed, currentBlue] = match.fighters;
      if (!samePair([currentRed.id, currentBlue.id], wanted)) return;
      failedModelPair = key;
      status!.textContent = "Could not load fighters. Retry to continue.";
      retryModelLoad!.hidden = false;
    });
}
retryModelLoad.addEventListener("click", () => {
  const [red, blue] = match.fighters;
  const key = `${red.id}:${blue.id}`;
  if (failedModelPair !== key) return;
  clearModelLoadFailure();
  loadCurrentPair();
});
function restartMatch(): void {
  clearModelLoadFailure();
  match.restart();
}
engine.runRenderLoop(() => {
  const now = performance.now();
  const [initialRed, initialBlue] = match.fighters;
  const wanted: [FighterId, FighterId] = [initialRed.id, initialBlue.id];
  loadCurrentPair();
  if (!models) {
    last = now;
    scene.render();
    return;
  }
  if (!modelIds || !samePair(modelIds, wanted)) {
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
  if (!fighterChooser.isConfirmed) accumulator = 0;
  while (!debug && fighterChooser.isConfirmed && accumulator >= 1 / 60) {
    tickMatch([playerAction(), aiAction(match)]);
    accumulator -= 1 / 60;
  }
  if (debug) accumulator = 0;
  const [red, blue] = match.fighters;
  if (!models[0].root.isEnabled()) models[0].root.setEnabled(true);
  if (!models[1].root.isEnabled()) models[1].root.setEnabled(true);
  drawFighter(red, models[0]);
  drawFighter(blue, models[1]);
  if (red.hp < previousHealth[0]) hitCues.begin(0, red, cameraYaw);
  if (blue.hp < previousHealth[1]) hitCues.begin(1, blue, cameraYaw);
  previousHealth = [red.hp, blue.hp];
  hitCues.update([red, blue], cameraYaw, frameSeconds);
  specialVfx.syncEffects(match.effects, match.fighters);
  specialVfx.update(frameSeconds);
  superCard.update(frameSeconds);
  for (const banner of banners) {
    banner.remaining = Math.max(0, banner.remaining - frameSeconds);
    banner.root.hidden = banner.remaining === 0;
  }
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
  // This shared radius covers the current vendored bodies in any camera orbit;
  // each fighter's measured height comes from the roster.
  const fighterRadius = 0.97;
  const fighterTop = Math.max(fighterById(red.id).height, fighterById(blue.id).height);
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
  const radius = Math.max(5.5, framingDistance) * zoomDistance;
  const desired = mid.add(
    new Vector3(sinYaw * cosPitch * radius, sinPitch * radius, -cosYaw * cosPitch * radius),
  );
  // Frame the fighters immediately when their assets first become visible;
  // otherwise the initial camera position leaves them small while it eases in.
  // Live tracking responds quickly to resize and movement while bounding each
  // rendered camera step to preserve comfort. Debug transitions snap after
  // batched ticks so deterministic captures land directly on their fixture.
  if (debug || !cameraFramed) camera.position.copyFrom(desired);
  else {
    const delta = desired.subtract(camera.position);
    const follow = 1 - Math.exp(-12 * frameSeconds);
    const fraction = Math.min(follow, 1.8 / Math.max(delta.length(), 1e-9));
    camera.position.addInPlace(delta.scale(fraction));
  }
  cameraFramed = true;
  camera.setTarget(mid);
  hud();
  scene.render();
});
window.addEventListener("resize", () => engine.resize());

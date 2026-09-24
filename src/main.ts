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
  FreeCamera,
} from "@babylonjs/core";
import { Match } from "./match";
import type { Action, Fighter } from "./match";
import { DebugHarness } from "./debug_harness";
import { installPlaytestProbe, playtestMode } from "./playtest_probe";
import { createAi } from "./ai";
import { mapPlayerInput } from "./input";
import { loadRiggedFighters } from "./rigged_fighter";
import type { RiggedFighterModel } from "./rigged_fighter";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const redHealth = document.querySelector<HTMLElement>("#red-health");
const blueHealth = document.querySelector<HTMLElement>("#blue-health");
const status = document.querySelector<HTMLElement>("#status");
const redWins = document.querySelector<HTMLElement>("#red-wins");
const blueWins = document.querySelector<HTMLElement>("#blue-wins");
if (!canvas || !redHealth || !blueHealth || !status || !redWins || !blueWins)
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

let models: [RiggedFighterModel, RiggedFighterModel] | null = null;
void loadRiggedFighters(scene, (message) => {
  status.textContent = message;
})
  .then((loaded) => {
    models = loaded;
  })
  .catch((error: unknown) => {
    status.textContent = error instanceof Error ? error.message : String(error);
  });
const match = new Match();
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
  () => models?.map((model) => model.snapshot()) ?? null,
  () => mapPlayerInput(keys, navigator.getGamepads?.()[0], cameraYaw),
);
const keys = new Set<string>();
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
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
document
  .querySelector<HTMLButtonElement>("#restart")
  ?.addEventListener("click", () => match.restart());
let restartHeld = false;
function playerAction(): Action {
  const frame = mapPlayerInput(keys, navigator.getGamepads?.()[0], cameraYaw);
  if (frame.restart && !restartHeld) match.restart();
  restartHeld = frame.restart;
  return frame.action;
}
const aiAction = createAi();
function drawFighter(f: Fighter, model: RiggedFighterModel): void {
  model.root.position.set(f.x, 0, f.z);
  model.root.rotation.y = f.facing;
  model.update(f.state);
}
function hud(): void {
  const [red, blue] = match.fighters;
  redHealth!.style.width = red.hp + "%";
  blueHealth!.style.width = blue.hp + "%";
  redHealth!.parentElement?.setAttribute("aria-valuenow", String(red.hp));
  blueHealth!.parentElement?.setAttribute("aria-valuenow", String(blue.hp));
  redWins!.textContent = "Wins " + red.wins;
  blueWins!.textContent = "Wins " + blue.wins;
  const message =
    match.phase === "fight"
      ? "ROUND " + match.round
      : match.phase === "roundOver"
        ? (match.winner === 0 ? "RED" : "BLUE") + " KO!"
        : (match.winner === 0 ? "RED" : "BLUE") + " WINS THE MATCH";
  if (status!.textContent !== message) status!.textContent = message;
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
  while (!debug && accumulator >= 1 / 60) {
    match.tick([playerAction(), aiAction(match)]);
    accumulator -= 1 / 60;
  }
  if (debug) accumulator = 0;
  const [red, blue] = match.fighters;
  drawFighter(red, models[0]);
  drawFighter(blue, models[1]);
  const mid = new Vector3((red.x + blue.x) / 2, 1, (red.z + blue.z) / 2);
  const span = Math.hypot(red.x - blue.x, red.z - blue.z);
  const radius = (4 + span * 0.55) * cameraZoom;
  const desired = mid.add(
    new Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch) * radius,
      Math.sin(cameraPitch) * radius,
      -Math.cos(cameraYaw) * Math.cos(cameraPitch) * radius,
    ),
  );
  camera.position = Vector3.Lerp(camera.position, desired, 0.08);
  camera.setTarget(mid);
  hud();
  scene.render();
});
window.addEventListener("resize", () => engine.resize());

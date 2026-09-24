import { Matrix, Vector3 } from "@babylonjs/core";
import type { Engine, FreeCamera, Scene } from "@babylonjs/core";
import type { Match } from "./match";
import type { DebugHarness } from "./debug_harness";
import type { InputFrame } from "./input";

export function playtestMode(): "live" | "debug" | null {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) return null;
  const query = new URLSearchParams(location.search);
  if (query.get("debug") === "1") return "debug";
  return query.get("playtest") === "1" ? "live" : null;
}

export function installPlaytestProbe(
  match: Match,
  engine: Engine,
  scene: Scene,
  camera: FreeCamera,
  debug: DebugHarness | null,
  view: () => { yaw: number; pitch: number; zoom: number },
  rigs: () => ReadonlyArray<{
    rootId: number;
    activeClip: string | undefined;
    disposed: boolean;
    x: number;
    y: number;
    z: number;
    yaw: number;
  }> | null,
  cues: () => {
    oxygen: { enabled: boolean; x: number; y: number; z: number };
    output: { enabled: boolean; x: number; y: number; z: number };
  },
  input: () => InputFrame,
): void {
  if (!playtestMode()) return;
  const project = (x: number, y: number, z: number): { x: number; y: number; z: number } => {
    const point = Vector3.Project(
      new Vector3(x, y, z),
      Matrix.Identity(),
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
    );
    return { x: point.x, y: point.y, z: point.z };
  };
  Object.defineProperty(window, "__fightSnapshot", {
    value: () => ({
      fighters: match.fighters.map((fighter) => ({ ...fighter })),
      phase: match.phase,
      round: match.round,
      winner: match.winner,
      camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      target: { x: camera.getTarget().x, y: camera.getTarget().y, z: camera.getTarget().z },
      view: view(),
      rigs: rigs(),
      cues: cues(),
      input: input(),
      screen: match.fighters.map((fighter) => project(fighter.x, 1.2, fighter.z)),
      screenBounds: match.fighters.map((fighter) => ({
        feet: project(fighter.x, 0, fighter.z),
        head: project(fighter.x, 2.7, fighter.z),
        modelTop: project(fighter.x, fighter.role === "warburg" ? 1.8 : 1.67, fighter.z),
      })),
    }),
  });
  if (debug) Object.defineProperty(window, "__fightDebug", { value: debug });
}

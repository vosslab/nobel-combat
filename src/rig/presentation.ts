import { Node, Skeleton, TransformNode } from "@babylonjs/core";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Fighter, State } from "../match";
import type { FighterId } from "../roster/roster";
import type { AppearanceKit } from "../roster/fighter_def";
import type { AppearanceKitRuntime } from "./appearance_kit";
import type { ClipMap } from "./clips";

const LOOPING_STATES = new Set<State>(["idle", "move", "block"]);
const CLIP_SPEEDS: Record<State, number> = {
  idle: 1,
  move: 1,
  light: 18 / 11,
  heavy: 1,
  block: 1,
  hit: 2,
  down: 5,
  getup: 2,
};

export type RiggedFighterSnapshot = Readonly<{
  rootId: number;
  fighterId: FighterId;
  fighterName: string;
  skeletonIds: readonly string[];
  materialIds: readonly string[];
  materialAlphas: readonly number[];
  enabled: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  activeClip: State | undefined;
  propVisual: Readonly<{
    flowActive: boolean;
    flowProgress: number;
    gaugeAngle: number;
  }> | null;
  appearanceProp: AppearanceKit["prop"] | undefined;
  disposed: boolean;
}>;

export type RiggedFighterModel = {
  root: TransformNode;
  setFighterName: (name: string) => void;
  update: (state: State, fighter: Readonly<Fighter>) => void;
  dispose: () => void;
  snapshot: () => RiggedFighterSnapshot;
};

export function materialsFor(root: TransformNode): Set<Material> {
  const materials = new Set<Material>();
  for (const mesh of root.getChildMeshes()) if (mesh.material) materials.add(mesh.material);
  return materials;
}

export function createFighter(
  root: TransformNode,
  fighterId: FighterId,
  initialFighterName: string,
  skeletons: Skeleton[],
  clips: ClipMap,
  disposeEntries: () => void,
  kitRuntime: AppearanceKitRuntime | null = null,
  appearanceProp: AppearanceKit["prop"] | undefined,
): RiggedFighterModel {
  root.setEnabled(false);
  let activeState: State | undefined;
  let fighterName = initialFighterName;
  let disposed = false;
  const groups = Object.values(clips);

  function update(state: State, fighter: Readonly<Fighter>): void {
    if (activeState !== state) {
      activeState = state;
      for (const group of groups) group.stop();
      const clip = clips[state];
      if (state === "getup") clip.start(false, -CLIP_SPEEDS[state], clip.to, clip.from);
      else clip.start(LOOPING_STATES.has(state), CLIP_SPEEDS[state], clip.from, clip.to);
    }
    kitRuntime?.propVisual?.update(state, fighter.ticks, fighter.specialTicks);
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    for (const group of groups) group.dispose();
    kitRuntime?.dispose();
    disposeEntries();
    root.dispose();
  }

  function setFighterName(name: string): void {
    fighterName = name;
  }

  function snapshot(): RiggedFighterSnapshot {
    return Object.freeze({
      rootId: root.uniqueId,
      fighterId,
      fighterName,
      skeletonIds: skeletons.map((skeleton) => skeleton.id),
      materialIds: [...materialsFor(root)].map((material) => material.id),
      materialAlphas: [...materialsFor(root)].map((material) => material.alpha),
      enabled: root.isEnabled(),
      x: root.position.x,
      y: root.position.y,
      z: root.position.z,
      yaw: root.rotation.y,
      activeClip: activeState,
      propVisual: kitRuntime?.propVisual ? Object.freeze(kitRuntime.propVisual.snapshot()) : null,
      appearanceProp,
      disposed,
    });
  }

  return { root, setFighterName, update, dispose, snapshot };
}

export function parentRootNodes(root: TransformNode, nodes: Node[]): void {
  for (const node of nodes) node.parent = root;
}

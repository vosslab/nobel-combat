import { AnimationGroup, Scene, Skeleton, TransformNode } from "@babylonjs/core";
import type { Node } from "@babylonjs/core";
import type { InstantiatedEntries } from "@babylonjs/core/assetContainer";
import type { Material } from "@babylonjs/core/Materials/material";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

import type { State } from "./match";

const WARBURG_MODEL_URL = "assets/models/mesh2motion_doctor_m.glb";
const CURIE_MODEL_URL = "assets/models/mesh2motion_female_31.glb";
const BASE_ANIMATION_URL = "assets/animations/mesh2motion_human_base.glb";
const ADDON_ANIMATION_URL = "assets/animations/mesh2motion_human_addon.glb";
const CLIP_NAMES = ["idle", "move", "light", "heavy", "block", "hit", "down", "getup"] as const;
type ClipName = (typeof CLIP_NAMES)[number];
type ClipMap = Record<ClipName, AnimationGroup>;

// These native clips cover every combat state. Match owns their timing; this
// table only controls visible playback speed within those fixed state windows.
const SOURCE_CLIPS: Record<ClipName, string> = {
  idle: "Fighting Idle",
  move: "Walk",
  light: "Fighting Left Jab",
  heavy: "Punch_Cross",
  block: "Defend",
  hit: "Hit_Knockback",
  down: "Death_C",
  getup: "LayToIdle",
};
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
  fighterName: FighterPresentationName;
  skeletonIds: readonly string[];
  materialIds: readonly string[];
  materialAlphas: readonly number[];
  x: number;
  y: number;
  z: number;
  yaw: number;
  activeClip: State | undefined;
  disposed: boolean;
}>;

export type FighterPresentationName = "Otto Heinrich Warburg" | "Marie Curie" | "Rosalind Franklin";

export type RiggedFighterModel = {
  root: TransformNode;
  setFighterName: (name: FighterPresentationName) => void;
  update: (state: State) => void;
  dispose: () => void;
  snapshot: () => RiggedFighterSnapshot;
};

export type RiggedFighterLoadError = (message: string) => void;
type AssetContainer = Awaited<ReturnType<typeof LoadAssetContainerAsync>>;

function sourceGroupByName(groups: AnimationGroup[]): Map<string, AnimationGroup> {
  return new Map(groups.map((group) => [group.name, group]));
}

/**
 * Animation GLBs target the character's skeletal transform nodes. A glTF
 * model can legitimately have repeated display-node names (for example,
 * separate eyebrow meshes), so the whole scene graph is neither needed nor
 * safe as an animation lookup table. Restrict the mapping to nodes linked to
 * a cloned skeleton and reject an ambiguous skeletal name before cloning.
 */
function skeletonNodeMap(skeletons: Skeleton[]): Map<string, Node> {
  const candidates = new Map<string, Set<Node>>();
  const add = (name: string, node: Node): void => {
    if (!name) return;
    const matching = candidates.get(name) ?? new Set<Node>();
    matching.add(node);
    candidates.set(name, matching);
  };
  for (const skeleton of skeletons) {
    for (const bone of skeleton.bones) {
      const node = bone.getTransformNode();
      if (!node) continue;
      // Mesh2Motion exports use matching bone and transform-node names. Keep
      // both identifiers because Babylon preserves either depending on how a
      // glTF asset was instantiated.
      add(bone.name, node);
      add(node.name, node);
    }
  }
  const byName = new Map<string, Node>();
  for (const [name, matching] of candidates) {
    if (matching.size !== 1)
      throw new Error(`Mesh2Motion model has ambiguous skeletal node '${name}'.`);
    const node = matching.values().next().value;
    if (!node) throw new Error(`Mesh2Motion model has no skeletal node '${name}'.`);
    byName.set(name, node);
  }
  if (byName.size === 0)
    throw new Error("Mesh2Motion model has no linked skeletal transform nodes.");
  return byName;
}

function cloneClip(
  source: AnimationGroup,
  targetNodes: Map<string, Node>,
  label: string,
): AnimationGroup {
  for (const targeted of source.targetedAnimations) {
    const target = targeted.target as Node;
    if (!targetNodes.has(target.name))
      throw new Error(
        `Mesh2Motion animation '${source.name}' cannot target '${target.name}' on ${label}.`,
      );
  }
  return source.clone(
    `${label} ${source.name}`,
    (target: Node) => targetNodes.get(target.name),
    true,
    true,
  );
}

function clipsForInstance(
  skeletons: Skeleton[],
  sourceGroups: Map<string, AnimationGroup>,
  label: string,
): ClipMap {
  const targets = skeletonNodeMap(skeletons);
  const clips = {} as Partial<ClipMap>;
  for (const state of CLIP_NAMES) {
    const sourceName = SOURCE_CLIPS[state];
    const source = sourceGroups.get(sourceName);
    if (!source)
      throw new Error(`Mesh2Motion animation library is missing '${sourceName}' for ${state}.`);
    clips[state] = cloneClip(source, targets, label);
  }
  return clips as ClipMap;
}

function materialsFor(root: TransformNode): Set<Material> {
  const materials = new Set<Material>();
  for (const mesh of root.getChildMeshes()) if (mesh.material) materials.add(mesh.material);
  return materials;
}

function assertIndependentInstances(redRoot: TransformNode, blueRoot: TransformNode): void {
  const blueMaterials = materialsFor(blueRoot);
  for (const material of materialsFor(redRoot)) {
    if (blueMaterials.has(material))
      throw new Error("Mesh2Motion fighter instances unexpectedly share a material.");
  }
}

function assertIndependentAnimationResources(
  redEntries: InstantiatedEntries,
  blueEntries: InstantiatedEntries,
  redClips: ClipMap,
  blueClips: ClipMap,
): void {
  for (const skeleton of redEntries.skeletons) {
    if (blueEntries.skeletons.includes(skeleton))
      throw new Error("Mesh2Motion fighter instances unexpectedly share a skeleton.");
  }
  for (const state of CLIP_NAMES) {
    if (redClips[state] === blueClips[state])
      throw new Error("Mesh2Motion fighter instances unexpectedly share an animation group.");
  }
}

function createFighter(
  root: TransformNode,
  initialFighterName: FighterPresentationName,
  skeletons: Skeleton[],
  clips: ClipMap,
  disposeEntries: () => void,
): RiggedFighterModel {
  let activeState: State | undefined;
  let fighterName = initialFighterName;
  let disposed = false;
  const groups = Object.values(clips);

  function update(state: State): void {
    if (activeState === state) return;
    activeState = state;
    for (const group of groups) group.stop();
    const clip = clips[state];
    if (state === "getup") clip.start(false, -CLIP_SPEEDS[state], clip.to, clip.from);
    else clip.start(LOOPING_STATES.has(state), CLIP_SPEEDS[state], clip.from, clip.to);
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    for (const group of groups) group.dispose();
    disposeEntries();
    root.dispose();
  }

  function setFighterName(name: FighterPresentationName): void {
    fighterName = name;
  }

  function snapshot(): RiggedFighterSnapshot {
    return Object.freeze({
      rootId: root.uniqueId,
      fighterName,
      skeletonIds: skeletons.map((skeleton) => skeleton.id),
      materialIds: [...materialsFor(root)].map((material) => material.id),
      materialAlphas: [...materialsFor(root)].map((material) => material.alpha),
      x: root.position.x,
      y: root.position.y,
      z: root.position.z,
      yaw: root.rotation.y,
      activeClip: activeState,
      disposed,
    });
  }

  update("idle");
  return { root, setFighterName, update, dispose, snapshot };
}

function parentRootNodes(root: TransformNode, nodes: Node[]): void {
  for (const node of nodes) node.parent = root;
}

function readableLoadError(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `Could not load the Mesh2Motion humanoid assets: ${detail}`;
}

function loadFailure(error: unknown): Error {
  const failure = new Error(readableLoadError(error));
  Object.defineProperty(failure, "cause", { value: error });
  return failure;
}

function createSourceRelease(...assets: AssetContainer[]): () => void {
  let remainingFighters = 2;
  let disposed = false;
  return (): void => {
    remainingFighters--;
    if (remainingFighters !== 0 || disposed) return;
    disposed = true;
    for (const asset of assets) asset.dispose();
  };
}

/**
 * Loads the CC0 Mesh2Motion Warburg and female_31 assets with independent rigs.
 * Match remains the sole authority for movement, combat, and timing.
 */
export async function loadRiggedFighters(
  scene: Scene,
  onError: RiggedFighterLoadError,
): Promise<[RiggedFighterModel, RiggedFighterModel]> {
  try {
    const [warburgModelAsset, curieModelAsset, baseAnimationAsset, addonAnimationAsset] =
      await Promise.all([
        LoadAssetContainerAsync(WARBURG_MODEL_URL, scene),
        LoadAssetContainerAsync(CURIE_MODEL_URL, scene),
        LoadAssetContainerAsync(BASE_ANIMATION_URL, scene),
        LoadAssetContainerAsync(ADDON_ANIMATION_URL, scene),
      ]);
    const sourceGroups = sourceGroupByName([
      ...baseAnimationAsset.animationGroups,
      ...addonAnimationAsset.animationGroups,
    ]);
    const redEntries = warburgModelAsset.instantiateModelsToScene(
      (sourceName) => `Warburg ${sourceName}`,
      true,
    );
    const blueEntries = curieModelAsset.instantiateModelsToScene(
      (sourceName) => `Curie ${sourceName}`,
      true,
    );
    const redRoot = new TransformNode("Warburg rig root", scene);
    const blueRoot = new TransformNode("Curie rig root", scene);
    parentRootNodes(redRoot, redEntries.rootNodes);
    parentRootNodes(blueRoot, blueEntries.rootNodes);
    const redClips = clipsForInstance(redEntries.skeletons, sourceGroups, "Warburg");
    const blueClips = clipsForInstance(blueEntries.skeletons, sourceGroups, "Curie");
    assertIndependentInstances(redRoot, blueRoot);
    assertIndependentAnimationResources(redEntries, blueEntries, redClips, blueClips);
    const releaseSource = createSourceRelease(
      warburgModelAsset,
      curieModelAsset,
      baseAnimationAsset,
      addonAnimationAsset,
    );
    const red = createFighter(
      redRoot,
      "Otto Heinrich Warburg",
      redEntries.skeletons,
      redClips,
      () => {
        redEntries.dispose();
        releaseSource();
      },
    );
    const blue = createFighter(blueRoot, "Marie Curie", blueEntries.skeletons, blueClips, () => {
      blueEntries.dispose();
      releaseSource();
    });
    return [red, blue];
  } catch (error) {
    const failure = loadFailure(error);
    onError(failure.message);
    throw failure;
  }
}

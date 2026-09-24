import {
  AnimationGroup,
  Color3,
  Mesh,
  MeshBuilder,
  Node,
  Scene,
  Skeleton,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import { AnimatorAvatar } from "@babylonjs/core/Animations/animatorAvatar";
import type { InstantiatedEntries } from "@babylonjs/core/assetContainer";
import type { Material } from "@babylonjs/core/Materials/material";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

import type { Fighter, State } from "./match";

const WARBURG_MODEL_URL = "assets/models/mesh2motion_doctor_m.glb";
const CURIE_MODEL_URL = "assets/models/curie_period.glb";
const FRANKLIN_MODEL_URL = "assets/models/mesh2motion_female_9.glb";
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
const CURIE_BONE_MAP = new Map<string, string>([
  ["root", "Root"],
  ["pelvis", "hips"],
  ["spine_01", "Bone"],
  ["spine_02", "chest"],
  ["spine_03", "chest-1"],
  ["clavicle_l", "shoulder.L"],
  ["upperarm_l", "upper_arm.L"],
  ["lowerarm_l", "forearm.L"],
  ["hand_l", "hand.L"],
  ["clavicle_r", "shoulder.R"],
  ["upperarm_r", "upper_arm.R"],
  ["lowerarm_r", "forearm.R"],
  ["hand_r", "hand.R"],
  ["neck_01", "neck"],
  ["head", "head"],
  ["thigh_l", "thigh.L"],
  ["calf_l", "shin.L"],
  ["foot_l", "foot.L"],
  ["ball_l", "toe.L"],
  ["thigh_r", "thigh.R"],
  ["calf_r", "shin.R"],
  ["foot_r", "foot.R"],
  ["ball_r", "toe.R"],
  ["index_01_l", "f_index.01.L"],
  ["index_02_l", "f_index.02.L"],
  ["index_03_l", "f_index.03.L"],
  ["middle_01_l", "f_middle.01.L"],
  ["middle_02_l", "f_middle.02.L"],
  ["middle_03_l", "f_middle.03.L"],
  ["ring_01_l", "f_ring.01.L"],
  ["ring_02_l", "f_ring.02.L"],
  ["ring_03_l", "f_ring.03.L"],
  ["pinky_01_l", "f_pinky.01.L"],
  ["pinky_02_l", "f_pinky.02.L"],
  ["pinky_03_l", "f_pinky.03.L"],
  ["thumb_01_l", "thumb.01.L"],
  ["thumb_02_l", "thumb.02.L"],
  ["thumb_03_l", "thumb.03.L"],
  ["index_01_r", "f_index.01.R"],
  ["index_02_r", "f_index.02.R"],
  ["index_03_r", "f_index.03.R"],
  ["middle_01_r", "f_middle.01.R"],
  ["middle_02_r", "f_middle.02.R"],
  ["middle_03_r", "f_middle.03.R"],
  ["ring_01_r", "f_ring.01.R"],
  ["ring_02_r", "f_ring.02.R"],
  ["ring_03_r", "f_ring.03.R"],
  ["pinky_01_r", "f_pinky.01.R"],
  ["pinky_02_r", "f_pinky.02.R"],
  ["pinky_03_r", "f_pinky.03.R"],
  ["thumb_01_r", "thumb.01.R"],
  ["thumb_02_r", "thumb.02.R"],
  ["thumb_03_r", "thumb.03.R"],
]);
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
  enabled: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  activeClip: State | undefined;
  researchVisual: Readonly<{
    flowActive: boolean;
    flowProgress: number;
    gaugeAngle: number;
  }> | null;
  disposed: boolean;
}>;

export type FighterPresentationName = "Otto Heinrich Warburg" | "Marie Curie" | "Rosalind Franklin";

export type RiggedFighterModel = {
  root: TransformNode;
  setFighterName: (name: FighterPresentationName) => void;
  update: (state: State, fighter: Readonly<Fighter>) => void;
  dispose: () => void;
  snapshot: () => RiggedFighterSnapshot;
};

export type RiggedFighterLoadError = (message: string) => void;
type AssetContainer = Awaited<ReturnType<typeof LoadAssetContainerAsync>>;
type WarburgResearchVisual = {
  gaugeNeedle: TransformNode;
  flowPulse: Mesh;
  flowProgress: number;
};

function sourceGroupByName(groups: AnimationGroup[]): Map<string, AnimationGroup> {
  return new Map(groups.map((group) => [group.name, group]));
}

function completeClipMap(clips: Partial<ClipMap>, label: string): ClipMap {
  const required = (state: ClipName): AnimationGroup => {
    const clip = clips[state];
    if (!clip) throw new Error(`Animation map is missing '${state}' for ${label}.`);
    return clip;
  };
  return {
    idle: required("idle"),
    move: required("move"),
    light: required("light"),
    heavy: required("heavy"),
    block: required("block"),
    hit: required("hit"),
    down: required("down"),
    getup: required("getup"),
  };
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
    const target: unknown = targeted.target;
    if (!(target instanceof Node))
      throw new Error(`Mesh2Motion animation '${source.name}' has a non-node target on ${label}.`);
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
  const clips: Partial<ClipMap> = {};
  for (const state of CLIP_NAMES) {
    const sourceName = SOURCE_CLIPS[state];
    const source = sourceGroups.get(sourceName);
    if (!source)
      throw new Error(`Mesh2Motion animation library is missing '${sourceName}' for ${state}.`);
    clips[state] = cloneClip(source, targets, label);
  }
  return completeClipMap(clips, label);
}

function curieClipsForInstance(
  root: TransformNode,
  sourceGroups: Map<string, AnimationGroup>,
  label: string,
): ClipMap {
  const avatar = new AnimatorAvatar(label, root, false, false);
  avatar.showWarnings = false;
  const clips: Partial<ClipMap> = {};
  for (const state of CLIP_NAMES) {
    const sourceName = SOURCE_CLIPS[state];
    const source = sourceGroups.get(sourceName);
    if (!source)
      throw new Error(`Mesh2Motion animation library is missing '${sourceName}' for ${state}.`);
    const clip = avatar.retargetAnimationGroup(source, {
      animationGroupName: `${label} ${sourceName}`,
      mapNodeNames: CURIE_BONE_MAP,
      retargetAnimationKeys: true,
      fixRootPosition: false,
    });
    if (clip.targetedAnimations.length < 8) {
      clip.dispose();
      const message =
        `Curie animation '${sourceName}' mapped only ` +
        `${clip.targetedAnimations.length} skeletal channels.`;
      throw new Error(message);
    }
    clips[state] = clip;
  }
  return completeClipMap(clips, label);
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
  researchVisual: WarburgResearchVisual | null = null,
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
    if (researchVisual) {
      const oxygenTransfer = fighter.role === "warburg" && state === "heavy";
      const progress = oxygenTransfer ? Math.max(0, Math.min(1, 1 - fighter.ticks / 32)) : 0;
      researchVisual.flowProgress = progress;
      researchVisual.gaugeNeedle.rotation.x = oxygenTransfer ? -0.9 + progress * 1.8 : -0.3;
      researchVisual.flowPulse.position.y = -0.095 + progress * 0.19;
      researchVisual.flowPulse.setEnabled(oxygenTransfer);
    }
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
      enabled: root.isEnabled(),
      x: root.position.x,
      y: root.position.y,
      z: root.position.z,
      yaw: root.rotation.y,
      activeClip: activeState,
      researchVisual: researchVisual
        ? Object.freeze({
            flowProgress: researchVisual.flowProgress,
            gaugeAngle: researchVisual.gaugeNeedle.rotation.x,
            flowActive: researchVisual.flowPulse.isEnabled(),
          })
        : null,
      disposed,
    });
  }

  return { root, setFighterName, update, dispose, snapshot };
}

function requiredRigTransform(skeletons: Skeleton[], name: string): TransformNode {
  const node = skeletonNodeMap(skeletons).get(name);
  if (!(node instanceof TransformNode)) {
    throw new Error(`Warburg presentation requires the '${name}' skeletal transform node.`);
  }
  return node;
}

function createWarburgResearchVisual(skeletons: Skeleton[], scene: Scene): WarburgResearchVisual {
  const brass = new StandardMaterial("warburg-manometer-brass", scene);
  brass.diffuseColor = new Color3(0.67, 0.42, 0.18);
  brass.specularColor = new Color3(0.42, 0.31, 0.18);
  const dial = new StandardMaterial("warburg-manometer-dial", scene);
  dial.diffuseColor = new Color3(0.08, 0.12, 0.16);
  dial.emissiveColor = new Color3(0.015, 0.035, 0.045);
  const needleMaterial = new StandardMaterial("warburg-manometer-needle", scene);
  needleMaterial.diffuseColor = new Color3(0.88, 0.17, 0.08);
  needleMaterial.emissiveColor = new Color3(0.52, 0.055, 0.018);
  needleMaterial.disableLighting = true;
  const glass = new StandardMaterial("warburg-manometer-glass", scene);
  glass.diffuseColor = new Color3(0.42, 0.8, 0.82);
  glass.emissiveColor = new Color3(0.045, 0.14, 0.15);
  glass.alpha = 0.38;
  glass.backFaceCulling = false;
  const flowMaterial = new StandardMaterial("warburg-manometer-flow", scene);
  flowMaterial.diffuseColor = new Color3(0.92, 0.12, 0.04);
  flowMaterial.emissiveColor = new Color3(0.8, 0.045, 0.008);
  flowMaterial.disableLighting = true;

  const pelvis = requiredRigTransform(skeletons, "pelvis");
  const gaugeMount = new TransformNode("Warburg belt gauge mount", scene);
  gaugeMount.parent = pelvis;
  gaugeMount.position.set(0.2, 0.015, 0.055);
  const gaugeBody = MeshBuilder.CreateCylinder(
    "Warburg belt pressure gauge",
    { diameter: 0.18, height: 0.035, tessellation: 24 },
    scene,
  );
  gaugeBody.parent = gaugeMount;
  gaugeBody.rotation.z = -Math.PI / 2;
  gaugeBody.material = brass;
  gaugeBody.isPickable = false;
  const gaugeFace = MeshBuilder.CreateCylinder(
    "Warburg pressure gauge face",
    { diameter: 0.145, height: 0.006, tessellation: 24 },
    scene,
  );
  gaugeFace.parent = gaugeMount;
  gaugeFace.position.x = 0.02;
  gaugeFace.rotation.z = -Math.PI / 2;
  gaugeFace.material = dial;
  gaugeFace.isPickable = false;
  const gaugeBezel = MeshBuilder.CreateTorus(
    "Warburg pressure gauge bezel",
    { diameter: 0.17, thickness: 0.012, tessellation: 24 },
    scene,
  );
  gaugeBezel.parent = gaugeMount;
  gaugeBezel.position.x = 0.024;
  gaugeBezel.rotation.z = -Math.PI / 2;
  gaugeBezel.material = brass;
  gaugeBezel.isPickable = false;
  const gaugeNeedle = new TransformNode("Warburg pressure gauge needle pivot", scene);
  gaugeNeedle.parent = gaugeMount;
  gaugeNeedle.position.x = 0.029;
  const needle = MeshBuilder.CreateBox(
    "Warburg pressure gauge needle",
    { width: 0.005, height: 0.058, depth: 0.004 },
    scene,
  );
  needle.parent = gaugeNeedle;
  needle.position.y = 0.028;
  needle.material = needleMaterial;
  needle.isPickable = false;

  const forearm = requiredRigTransform(skeletons, "lowerarm_l");
  const tubeMount = new TransformNode("Warburg forearm manometer mount", scene);
  tubeMount.parent = forearm;
  tubeMount.position.set(0.025, 0.14, 0.045);
  const tube = MeshBuilder.CreateCylinder(
    "Warburg protected glass manometer",
    { diameter: 0.045, height: 0.27, tessellation: 16 },
    scene,
  );
  tube.parent = tubeMount;
  tube.material = glass;
  tube.isPickable = false;
  for (const [label, y] of [
    ["lower", -0.13],
    ["upper", 0.13],
  ] as const) {
    const collar = MeshBuilder.CreateTorus(
      `Warburg manometer ${label} collar`,
      { diameter: 0.056, thickness: 0.008, tessellation: 16 },
      scene,
    );
    collar.parent = tubeMount;
    collar.position.y = y;
    collar.material = brass;
    collar.isPickable = false;
  }
  const flowPulse = MeshBuilder.CreateCylinder(
    "Warburg iron-red manometer pulse",
    { diameter: 0.014, height: 0.045, tessellation: 12 },
    scene,
  );
  flowPulse.parent = tubeMount;
  flowPulse.position.y = -0.095;
  flowPulse.material = flowMaterial;
  flowPulse.isPickable = false;
  flowPulse.setEnabled(false);

  return { gaugeNeedle, flowPulse, flowProgress: 0 };
}

function parentRootNodes(root: TransformNode, nodes: Node[]): void {
  for (const node of nodes) node.parent = root;
}

function readableLoadError(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `Could not load the fighter humanoid assets: ${detail}`;
}

function loadFailure(error: unknown): Error {
  const failure = new Error(readableLoadError(error));
  Object.defineProperty(failure, "cause", { value: error });
  return failure;
}

function createSourceRelease(remainingFighters: number, ...assets: AssetContainer[]): () => void {
  let disposed = false;
  return (): void => {
    remainingFighters--;
    if (remainingFighters !== 0 || disposed) return;
    disposed = true;
    for (const asset of assets) asset.dispose();
  };
}

/**
 * Loads Warburg and Franklin on the CC0 Mesh2Motion rig, and Curie from the
 * CC0 period-dress asset. Babylon retargets the same local clips for Curie.
 * Match remains the sole authority for movement, combat, and timing.
 */
export async function loadRiggedFighters(
  scene: Scene,
  onError: RiggedFighterLoadError,
): Promise<[RiggedFighterModel, RiggedFighterModel, RiggedFighterModel]> {
  try {
    const [
      warburgModelAsset,
      curieModelAsset,
      franklinModelAsset,
      baseAnimationAsset,
      addonAnimationAsset,
    ] = await Promise.all([
      LoadAssetContainerAsync(WARBURG_MODEL_URL, scene),
      LoadAssetContainerAsync(CURIE_MODEL_URL, scene),
      LoadAssetContainerAsync(FRANKLIN_MODEL_URL, scene),
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
    const curieEntries = curieModelAsset.instantiateModelsToScene(
      (sourceName) => `Curie ${sourceName}`,
      true,
    );
    const franklinEntries = franklinModelAsset.instantiateModelsToScene(
      (sourceName) => `Franklin ${sourceName}`,
      true,
    );
    const redRoot = new TransformNode("Warburg rig root", scene);
    const curieRoot = new TransformNode("Curie rig root", scene);
    const franklinRoot = new TransformNode("Franklin rig root", scene);
    parentRootNodes(redRoot, redEntries.rootNodes);
    parentRootNodes(curieRoot, curieEntries.rootNodes);
    parentRootNodes(franklinRoot, franklinEntries.rootNodes);
    const redClips = clipsForInstance(redEntries.skeletons, sourceGroups, "Warburg");
    const curieClips = curieClipsForInstance(curieRoot, sourceGroups, "Marie Curie");
    const franklinClips = clipsForInstance(franklinEntries.skeletons, sourceGroups, "Franklin");
    const warburgResearchVisual = createWarburgResearchVisual(redEntries.skeletons, scene);
    assertIndependentInstances(redRoot, curieRoot);
    assertIndependentInstances(redRoot, franklinRoot);
    assertIndependentInstances(curieRoot, franklinRoot);
    assertIndependentAnimationResources(redEntries, curieEntries, redClips, curieClips);
    assertIndependentAnimationResources(redEntries, franklinEntries, redClips, franklinClips);
    assertIndependentAnimationResources(curieEntries, franklinEntries, curieClips, franklinClips);
    const releaseSource = createSourceRelease(
      3,
      warburgModelAsset,
      curieModelAsset,
      franklinModelAsset,
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
      warburgResearchVisual,
    );
    const curie = createFighter(
      curieRoot,
      "Marie Curie",
      curieEntries.skeletons,
      curieClips,
      () => {
        curieEntries.dispose();
        releaseSource();
      },
    );
    const franklin = createFighter(
      franklinRoot,
      "Rosalind Franklin",
      franklinEntries.skeletons,
      franklinClips,
      () => {
        franklinEntries.dispose();
        releaseSource();
      },
    );
    return [red, curie, franklin];
  } catch (error) {
    const failure = loadFailure(error);
    onError(failure.message);
    throw failure;
  }
}

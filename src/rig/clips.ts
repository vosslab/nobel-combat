import { AnimationGroup, Node, Skeleton } from "@babylonjs/core";

export const CLIP_NAMES = [
  "idle",
  "move",
  "light",
  "heavy",
  "block",
  "hit",
  "down",
  "getup",
] as const;
export type ClipName = (typeof CLIP_NAMES)[number];
export type ClipMap = Record<ClipName, AnimationGroup>;

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

export function sourceGroupByName(groups: AnimationGroup[]): Map<string, AnimationGroup> {
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

/** Build the clip lookup from linked skeletal nodes, excluding repeated mesh-node names. */
export function skeletonNodeMap(skeletons: Skeleton[]): Map<string, Node> {
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
      add(bone.name, node);
      add(node.name, node);
    }
  }
  const byName = new Map<string, Node>();
  for (const [name, matching] of candidates) {
    if (matching.size !== 1) throw new Error(`Model has ambiguous skeletal node '${name}'.`);
    const node = matching.values().next().value;
    if (!node) throw new Error(`Model has no skeletal node '${name}'.`);
    byName.set(name, node);
  }
  if (byName.size === 0) throw new Error("Model has no linked skeletal transform nodes.");
  return byName;
}

function cloneClip(
  source: AnimationGroup,
  targets: Map<string, Node>,
  label: string,
): AnimationGroup {
  for (const targeted of source.targetedAnimations) {
    const target: unknown = targeted.target;
    if (!(target instanceof Node)) {
      throw new Error(`Animation '${source.name}' has a non-node target on ${label}.`);
    }
    if (!targets.has(target.name)) {
      throw new Error(`Animation '${source.name}' cannot target '${target.name}' on ${label}.`);
    }
  }
  return source.clone(
    `${label} ${source.name}`,
    (target: Node) => targets.get(target.name),
    true,
    true,
  );
}

export function clipsForInstance(
  skeletons: Skeleton[],
  sourceGroups: Map<string, AnimationGroup>,
  label: string,
): ClipMap {
  const targets = skeletonNodeMap(skeletons);
  const clips: Partial<ClipMap> = {};
  for (const state of CLIP_NAMES) {
    const sourceName = SOURCE_CLIPS[state];
    const source = sourceGroups.get(sourceName);
    if (!source) throw new Error(`Animation library is missing '${sourceName}' for ${state}.`);
    clips[state] = cloneClip(source, targets, label);
  }
  return completeClipMap(clips, label);
}

import { AnimationGroup, Scene, TransformNode } from "@babylonjs/core";
import type { InstantiatedEntries } from "@babylonjs/core/assetContainer";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";
import { fighterById, isFighterId } from "../roster/roster";
import type { FighterId } from "../roster/roster";
import type { FighterDef } from "../roster/fighter_def";
import { applyAppearanceKit } from "./appearance_kit";
import type { AppearanceKitRuntime } from "./appearance_kit";
import { clipsForInstance, sourceGroupByName } from "./clips";
import type { ClipMap } from "./clips";
import { createFighter, materialsFor, parentRootNodes } from "./presentation";
import type { RiggedFighterModel } from "./presentation";

const BASE_ANIMATION_PATH = "assets/animations/mesh2motion_human_base.glb";
const ADDON_ANIMATION_PATH = "assets/animations/mesh2motion_human_addon.glb";
const BASE_BODY_HEIGHT = 1.8;

type AssetContainer = Awaited<ReturnType<typeof LoadAssetContainerAsync>>;
type RiggedInstance = Readonly<{
  model: RiggedFighterModel;
  entries: InstantiatedEntries;
  clips: ClipMap;
}>;

export type RiggedFighterLoadError = (message: string) => void;

const assetsByScene = new WeakMap<Scene, Map<string, Promise<AssetContainer>>>();

function cachedAsset(scene: Scene, url: string): Promise<AssetContainer> {
  let assets = assetsByScene.get(scene);
  if (!assets) {
    assets = new Map<string, Promise<AssetContainer>>();
    assetsByScene.set(scene, assets);
  }
  const cached = assets.get(url);
  if (cached) return cached;

  const loading = LoadAssetContainerAsync(url, scene);
  assets.set(url, loading);
  void loading.catch(() => {
    if (assets?.get(url) === loading) assets.delete(url);
  });
  return loading;
}

function createInstance(
  scene: Scene,
  id: FighterId,
  fighter: FighterDef,
  asset: AssetContainer,
  sourceGroups: Map<string, AnimationGroup>,
  slot: 0 | 1,
): RiggedInstance {
  const { name } = fighter;
  const label = `${name} instance ${slot + 1}`;
  let entries: InstantiatedEntries | undefined;
  let root: TransformNode | undefined;
  let clips: ClipMap | undefined;
  let kitRuntime: AppearanceKitRuntime | null = null;
  try {
    entries = asset.instantiateModelsToScene((sourceName) => `${label} ${sourceName}`, true);
    root = new TransformNode(`${label} root`, scene);
    const bodyScale = fighter.height / BASE_BODY_HEIGHT;
    root.scaling.set(bodyScale, bodyScale, bodyScale);
    parentRootNodes(root, entries.rootNodes);
    clips = clipsForInstance(entries.skeletons, sourceGroups, name);
    kitRuntime = applyAppearanceKit(root, entries.skeletons, scene, label, fighter.appearance);
    const model = createFighter(
      root,
      id,
      name,
      entries.skeletons,
      clips,
      () => entries?.dispose(),
      kitRuntime,
      fighter.appearance?.prop,
    );
    return { model, entries, clips };
  } catch (error) {
    for (const clip of Object.values(clips ?? {})) clip.dispose();
    kitRuntime?.dispose();
    entries?.dispose();
    root?.dispose();
    throw error;
  }
}

function assertIndependentPair(first: RiggedInstance, second: RiggedInstance): void {
  const secondMaterials = materialsFor(second.model.root);
  for (const material of materialsFor(first.model.root)) {
    if (secondMaterials.has(material))
      throw new Error("Fighter instances unexpectedly share a material.");
  }
  for (const skeleton of first.entries.skeletons) {
    if (second.entries.skeletons.includes(skeleton))
      throw new Error("Fighter instances unexpectedly share a skeleton.");
  }
  for (const state of Object.keys(first.clips) as (keyof ClipMap)[]) {
    if (first.clips[state] === second.clips[state])
      throw new Error("Fighter instances unexpectedly share an animation group.");
  }
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

/** Load two independent instances for the requested ids, reusing source GLBs by URL. */
export async function loadMatchFighters(
  scene: Scene,
  playerId: FighterId,
  opponentId: FighterId,
  onError: RiggedFighterLoadError,
): Promise<[RiggedFighterModel, RiggedFighterModel]> {
  const instances: RiggedInstance[] = [];
  try {
    if (!isFighterId(playerId) || !isFighterId(opponentId)) {
      throw new TypeError(
        `Unknown fighter id: ${String(!isFighterId(playerId) ? playerId : opponentId)}`,
      );
    }
    const playerBody = fighterById(playerId).body;
    const opponentBody = fighterById(opponentId).body;
    const [playerAsset, opponentAsset, baseAnimationAsset, addonAnimationAsset] = await Promise.all(
      [
        cachedAsset(scene, playerBody),
        cachedAsset(scene, opponentBody),
        cachedAsset(scene, BASE_ANIMATION_PATH),
        cachedAsset(scene, ADDON_ANIMATION_PATH),
      ],
    );
    const sourceGroups = sourceGroupByName([
      ...baseAnimationAsset.animationGroups,
      ...addonAnimationAsset.animationGroups,
    ]);
    instances.push(
      createInstance(scene, playerId, fighterById(playerId), playerAsset, sourceGroups, 0),
    );
    instances.push(
      createInstance(scene, opponentId, fighterById(opponentId), opponentAsset, sourceGroups, 1),
    );
    const player = instances[0];
    const opponent = instances[1];
    if (!player || !opponent) throw new Error("The model loader did not create two fighters.");
    assertIndependentPair(player, opponent);
    return [player.model, opponent.model];
  } catch (error) {
    for (const instance of instances) instance.model.dispose();
    const failure = loadFailure(error);
    onError(failure.message);
    throw failure;
  }
}

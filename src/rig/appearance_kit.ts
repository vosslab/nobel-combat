import {
  Color3,
  Mesh,
  MeshBuilder,
  Node,
  Scene,
  Skeleton,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { Material } from "@babylonjs/core/Materials/material";
import type { AppearanceKit } from "../roster/fighter_def";
import { skeletonNodeMap } from "./clips";

export type PropVisual = Readonly<{
  update: (state: string, ticks: number, specialTicks: number) => void;
  snapshot: () => Readonly<{ flowActive: boolean; flowProgress: number; gaugeAngle: number }>;
}>;

export type AppearanceKitRuntime = Readonly<{
  propVisual: PropVisual | null;
  dispose: () => void;
}>;

class KitResources {
  private readonly materials = new Set<Material>();
  private readonly nodes = new Set<Node>();

  own<T extends Material>(owned: T): T {
    this.materials.add(owned);
    return owned;
  }

  ownNode<T extends Node>(owned: T): T {
    this.nodes.add(owned);
    return owned;
  }

  dispose(): void {
    for (const owned of this.nodes) owned.dispose();
    this.nodes.clear();
    for (const owned of this.materials) owned.dispose(false, false);
    this.materials.clear();
  }
}

type Color = readonly [number, number, number];

const color = ([red, green, blue]: Color): Color3 => new Color3(red, green, blue);

function material(
  resources: KitResources,
  scene: Scene,
  name: string,
  value: Color,
): StandardMaterial {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = color(value);
  result.specularColor = Color3.Black();
  return resources.own(result);
}

function requiredBone(
  skeletons: Skeleton[],
  names: readonly string[],
  label: string,
): TransformNode {
  const nodes = skeletonNodeMap(skeletons);
  for (const name of names) {
    const node = nodes.get(name);
    if (node instanceof TransformNode) return node;
  }
  throw new Error(`${label} requires skeletal node '${names[0]}'.`);
}

function attach(
  resources: KitResources,
  mesh: Mesh,
  parent: TransformNode,
  value: Vector3,
  kitMaterial: StandardMaterial,
): Mesh {
  resources.ownNode(mesh);
  mesh.parent = parent;
  mesh.position.copyFrom(value);
  mesh.material = kitMaterial;
  mesh.isPickable = false;
  return mesh;
}

function addWireGlasses(
  resources: KitResources,
  head: TransformNode,
  scene: Scene,
  label: string,
): void {
  // These dimensions are deliberately expressed in the body model's local units.
  // The original double scaling made the frames effectively pin-sized at the game camera.
  const wire = material(resources, scene, `${label} wire glasses`, [0.34, 0.27, 0.12]);
  wire.emissiveColor = new Color3(0.06, 0.04, 0.008);
  for (const [side, x] of [
    ["left", -0.041],
    ["right", 0.041],
  ] as const) {
    const frame = attach(
      resources,
      MeshBuilder.CreateTorus(
        `${label} ${side} wire glass`,
        { diameter: 0.07, thickness: 0.011, tessellation: 16 },
        scene,
      ),
      head,
      new Vector3(x, 0.005, 0.04),
      wire,
    );
    frame.scaling.set(1, 0.78, 1);
    frame.rotation.x = Math.PI / 2;
  }
  attach(
    resources,
    MeshBuilder.CreateBox(
      `${label} wire bridge`,
      { width: 0.035, height: 0.012, depth: 0.016 },
      scene,
    ),
    head,
    new Vector3(0, 0.005, 0.04),
    wire,
  );
}

function addChinStrap(
  resources: KitResources,
  head: TransformNode,
  scene: Scene,
  label: string,
): void {
  const beard = material(resources, scene, `${label} chin strap beard`, [0.29, 0.27, 0.23]);
  attach(
    resources,
    MeshBuilder.CreateTube(
      `${label} chin strap`,
      {
        path: [
          new Vector3(-0.15, 0, -0.11),
          new Vector3(-0.16, -0.12, -0.13),
          new Vector3(0, -0.23, -0.15),
          new Vector3(0.16, -0.12, -0.13),
          new Vector3(0.15, 0, -0.11),
        ],
        radius: 0.028,
        tessellation: 10,
      },
      scene,
    ),
    head,
    Vector3.Zero(),
    beard,
  );
}

function createManometer(
  resources: KitResources,
  skeletons: Skeleton[],
  scene: Scene,
  label: string,
): PropVisual {
  const brass = material(resources, scene, `${label} manometer brass`, [0.67, 0.42, 0.18]);
  brass.specularColor = new Color3(0.42, 0.31, 0.18);
  const dial = material(resources, scene, `${label} manometer dial`, [0.08, 0.12, 0.16]);
  dial.emissiveColor = new Color3(0.015, 0.035, 0.045);
  const needleMaterial = material(
    resources,
    scene,
    `${label} manometer needle`,
    [0.88, 0.17, 0.08],
  );
  needleMaterial.emissiveColor = new Color3(0.52, 0.055, 0.018);
  needleMaterial.disableLighting = true;
  const glass = material(resources, scene, `${label} manometer glass`, [0.42, 0.8, 0.82]);
  glass.emissiveColor = new Color3(0.045, 0.14, 0.15);
  glass.alpha = 0.38;
  glass.backFaceCulling = false;
  const flow = material(resources, scene, `${label} manometer flow`, [0.92, 0.12, 0.04]);
  flow.emissiveColor = new Color3(0.8, 0.045, 0.008);
  flow.disableLighting = true;
  const pelvis = requiredBone(skeletons, ["pelvis", "hips"], `${label} manometer`);
  const gauge = resources.ownNode(new TransformNode(`${label} belt gauge mount`, scene));
  gauge.parent = pelvis;
  gauge.position.set(0.2, 0.015, 0.055);
  const gaugeBody = attach(
    resources,
    MeshBuilder.CreateCylinder(
      `${label} belt pressure gauge`,
      { diameter: 0.18, height: 0.035, tessellation: 24 },
      scene,
    ),
    gauge,
    Vector3.Zero(),
    brass,
  );
  gaugeBody.rotation.z = -Math.PI / 2;
  const face = attach(
    resources,
    MeshBuilder.CreateCylinder(
      `${label} pressure gauge face`,
      { diameter: 0.145, height: 0.006, tessellation: 24 },
      scene,
    ),
    gauge,
    new Vector3(0.02, 0, 0),
    dial,
  );
  face.rotation.z = -Math.PI / 2;
  const bezel = attach(
    resources,
    MeshBuilder.CreateTorus(
      `${label} pressure gauge bezel`,
      { diameter: 0.17, thickness: 0.012, tessellation: 24 },
      scene,
    ),
    gauge,
    new Vector3(0.024, 0, 0),
    brass,
  );
  bezel.rotation.z = -Math.PI / 2;
  const needle = resources.ownNode(
    new TransformNode(`${label} pressure gauge needle pivot`, scene),
  );
  needle.parent = gauge;
  needle.position.x = 0.029;
  attach(
    resources,
    MeshBuilder.CreateBox(
      `${label} pressure gauge needle`,
      { width: 0.005, height: 0.058, depth: 0.004 },
      scene,
    ),
    needle,
    new Vector3(0, 0.028, 0),
    needleMaterial,
  );
  const forearm = requiredBone(skeletons, ["lowerarm_l", "forearm.L"], `${label} manometer`);
  const tubeMount = resources.ownNode(new TransformNode(`${label} forearm manometer mount`, scene));
  tubeMount.parent = forearm;
  tubeMount.position.set(0.025, 0.14, 0.045);
  attach(
    resources,
    MeshBuilder.CreateCylinder(
      `${label} protected glass manometer`,
      { diameter: 0.045, height: 0.27, tessellation: 16 },
      scene,
    ),
    tubeMount,
    Vector3.Zero(),
    glass,
  );
  const scale = material(resources, scene, `${label} manometer scale`, [0.92, 0.78, 0.32]);
  scale.emissiveColor = new Color3(0.25, 0.16, 0.02);
  attach(
    resources,
    MeshBuilder.CreateBox(
      `${label} manometer scale line`,
      { width: 0.007, height: 0.19, depth: 0.008 },
      scene,
    ),
    tubeMount,
    new Vector3(0.018, 0, -0.018),
    scale,
  );
  for (const y of [-0.065, 0, 0.065]) {
    attach(
      resources,
      MeshBuilder.CreateBox(
        `${label} manometer scale tick ${y}`,
        { width: 0.022, height: 0.007, depth: 0.008 },
        scene,
      ),
      tubeMount,
      new Vector3(0.018, y, -0.018),
      scale,
    );
  }
  for (const [part, y] of [
    ["lower", -0.13],
    ["upper", 0.13],
  ] as const) {
    attach(
      resources,
      MeshBuilder.CreateTorus(
        `${label} manometer ${part} collar`,
        { diameter: 0.056, thickness: 0.008, tessellation: 16 },
        scene,
      ),
      tubeMount,
      new Vector3(0, y, 0),
      brass,
    );
  }
  const pulse = attach(
    resources,
    MeshBuilder.CreateCylinder(
      `${label} iron-red manometer pulse`,
      { diameter: 0.014, height: 0.045, tessellation: 12 },
      scene,
    ),
    tubeMount,
    new Vector3(0, -0.095, 0),
    flow,
  );
  pulse.setEnabled(false);
  let active = false;
  let progress = 0;
  return {
    update: (_state, _ticks, specialTicks): void => {
      active = specialTicks > 0;
      progress = active ? Math.max(0, Math.min(1, 1 - specialTicks / 32)) : 0;
      needle.rotation.x = active ? -0.9 + progress * 1.8 : -0.3;
      pulse.position.y = -0.095 + progress * 0.19;
      pulse.setEnabled(active);
    },
    snapshot: () => ({ flowActive: active, flowProgress: progress, gaugeAngle: needle.rotation.x }),
  };
}

/** Attach only the approved reusable pieces for one roster-defined fighter. */
export function applyAppearanceKit(
  _root: TransformNode,
  skeletons: Skeleton[],
  scene: Scene,
  label: string,
  kit: AppearanceKit | undefined,
): AppearanceKitRuntime | null {
  if (!kit) return null;
  const resources = new KitResources();
  try {
    if (kit.glasses || kit.facialHair) {
      const head = requiredBone(skeletons, ["head"], `${label} appearance kit`);
      if (kit.glasses === "wire") addWireGlasses(resources, head, scene, label);
      if (kit.facialHair === "chinStrap") addChinStrap(resources, head, scene, label);
    }
    return {
      propVisual:
        kit.prop === "manometer" ? createManometer(resources, skeletons, scene, label) : null,
      dispose: (): void => resources.dispose(),
    };
  } catch (error) {
    resources.dispose();
    throw error;
  }
}

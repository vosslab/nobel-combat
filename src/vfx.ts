import { Color3, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { AbstractMesh, Scene } from "@babylonjs/core";
import type { Fighter, SpecialRelease } from "./match";
import type { ProjectilePattern } from "./roster/fighter_def";
import type { Effect, FighterSlot, ProjectileEffect, ZoneEffect } from "./specials";

export type VfxShape =
  | "ring"
  | "beam"
  | "orb"
  | "helix"
  | "crystal"
  | "cloud"
  | "chain"
  | "burst"
  | "cob"
  | "chromosome"
  | "chromosomeGap";
export type VfxPoint = Readonly<{ x: number; z: number }>;
export type VfxPlanOperation = Readonly<{
  shape: VfxShape;
  origin: VfxPoint;
  destination?: VfxPoint;
  scale?: number;
  turn?: number;
}>;

type TransientVisual = VfxPlanOperation & {
  mesh: AbstractMesh;
  age: number;
  owner: FighterSlot;
  facing: number;
};
type LiveVisual = VfxPlanOperation & { mesh: AbstractMesh; owner: FighterSlot; facing: number };

const SHAPES: readonly VfxShape[] = [
  "ring",
  "beam",
  "orb",
  "helix",
  "crystal",
  "cloud",
  "chain",
  "burst",
  "cob",
  "chromosome",
  "chromosomeGap",
];
const TRANSIENT_SECONDS = 0.82;
const MAX_ZONE_RING_RADIUS = 1.25;

function visualMesh(shape: VfxShape, name: string, scene: Scene): AbstractMesh {
  switch (shape) {
    case "ring":
      return MeshBuilder.CreateTorus(
        name,
        { diameter: 2, thickness: 0.08, tessellation: 32 },
        scene,
      );
    case "beam":
      return MeshBuilder.CreateBox(name, { width: 0.28, height: 0.28, depth: 3.2 }, scene);
    case "orb":
      return MeshBuilder.CreateSphere(name, { diameter: 0.72, segments: 16 }, scene);
    case "helix": {
      const path = Array.from({ length: 25 }, (_, index) => {
        const t = (index / 24) * Math.PI * 5;
        return new Vector3(Math.cos(t) * 0.46, index * 0.07, Math.sin(t) * 0.46);
      });
      return MeshBuilder.CreateTube(name, { path, radius: 0.07, tessellation: 8 }, scene);
    }
    case "crystal":
      return MeshBuilder.CreatePolyhedron(name, { type: 1, size: 0.8 }, scene);
    case "cloud":
      return MeshBuilder.CreateSphere(
        name,
        { diameterX: 1.7, diameterY: 0.65, diameterZ: 1.15 },
        scene,
      );
    case "chain": {
      const links = Array.from({ length: 5 }, (_, index) => {
        const link = MeshBuilder.CreateTorus(
          `${name}-link-${index}`,
          { diameter: 0.3, thickness: 0.06, tessellation: 12 },
          scene,
        );
        link.position.x = (index - 2) * 0.2;
        link.position.y = index % 2 === 0 ? -0.055 : 0.055;
        link.rotation.x = index % 2 === 0 ? 0 : Math.PI / 2;
        return link;
      });
      return Mesh.MergeMeshes(links, true, true, undefined, false, true) ?? links[0]!;
    }
    case "burst":
      return MeshBuilder.CreatePolyhedron(name, { type: 3, size: 0.88 }, scene);
    case "cob": {
      const cob = MeshBuilder.CreateCylinder(
        name,
        { height: 1.25, diameter: 0.44, tessellation: 12 },
        scene,
      );
      const kernels = Array.from({ length: 16 }, (_, index) => {
        const row = Math.floor(index / 4);
        const angle = ((index % 4) / 4) * Math.PI * 2 + (row % 2) * 0.32;
        const kernel = MeshBuilder.CreateSphere(
          `${name}-kernel-${index}`,
          { diameter: 0.16, segments: 8 },
          scene,
        );
        kernel.position.set(Math.cos(angle) * 0.25, -0.43 + row * 0.29, Math.sin(angle) * 0.25);
        return kernel;
      });
      return Mesh.MergeMeshes([cob, ...kernels], true, true, undefined, false, true) ?? cob;
    }
    case "chromosome": {
      const endpoints = [
        new Vector3(-0.42, -0.5, 0),
        new Vector3(0.42, 0.5, 0),
        new Vector3(-0.42, 0.5, 0),
        new Vector3(0.42, -0.5, 0),
      ];
      const arms = [
        MeshBuilder.CreateTube(
          `${name}-arm-a`,
          { path: [endpoints[0]!, endpoints[1]!], radius: 0.14 },
          scene,
        ),
        MeshBuilder.CreateTube(
          `${name}-arm-b`,
          { path: [endpoints[2]!, endpoints[3]!], radius: 0.14 },
          scene,
        ),
      ];
      const lobes = endpoints.map((position, index) => {
        const lobe = MeshBuilder.CreateSphere(
          `${name}-lobe-${index}`,
          { diameter: 0.34, segments: 8 },
          scene,
        );
        lobe.position.copyFrom(position);
        return lobe;
      });
      return Mesh.MergeMeshes([...arms, ...lobes], true, true, undefined, false, true) ?? arms[0]!;
    }
    case "chromosomeGap": {
      // A ground-plane X keeps the abandoned chromosome legible from the combat
      // camera, while four near-contiguous fragments leave its central break open.
      const outer = [
        new Vector3(-0.62, 0, -0.62),
        new Vector3(0.62, 0, 0.62),
        new Vector3(-0.62, 0, 0.62),
        new Vector3(0.62, 0, -0.62),
      ];
      const inner = [
        new Vector3(-0.06, 0, -0.06),
        new Vector3(0.06, 0, 0.06),
        new Vector3(-0.06, 0, 0.06),
        new Vector3(0.06, 0, -0.06),
      ];
      const fragments = outer.map((endpoint, index) =>
        MeshBuilder.CreateTube(
          `${name}-fragment-${index}`,
          { path: [endpoint, inner[index]!], radius: 0.14 },
          scene,
        ),
      );
      return Mesh.MergeMeshes(fragments, true, true, undefined, false, true) ?? fragments[0]!;
    }
  }
}

function materialFor(name: string, scene: Scene): StandardMaterial {
  const material = new StandardMaterial(`vfx-${name}-material`, scene);
  material.diffuseColor = new Color3(0.95, 0.74, 0.25);
  material.emissiveColor = new Color3(0.58, 0.28, 0.05);
  material.disableLighting = true;
  material.alpha = 0.82;
  return material;
}

function distance(a: VfxPoint, b: VfxPoint): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

function projectileShape(effect: ProjectileEffect): VfxShape {
  return effect.block.motif === "helix" ? "helix" : "orb";
}

function projectilePoint(effect: ProjectileEffect, forward: number, sideways: number): VfxPoint {
  const forwardX = Math.sin(effect.facing);
  const forwardZ = Math.cos(effect.facing);
  return {
    x: effect.x + forwardX * forward - forwardZ * sideways,
    z: effect.z + forwardZ * forward + forwardX * sideways,
  };
}

function projectileOperation(
  effect: ProjectileEffect,
  forward = 0,
  sideways = 0,
): VfxPlanOperation {
  return {
    shape: projectileShape(effect),
    origin: projectilePoint(effect, forward, sideways),
    scale: projectileShape(effect) === "helix" ? 1.2 : 0.9,
    turn: effect.facing,
  };
}

function pairedProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  // Stagger a pair along and across its travel path so the camera can distinguish
  // both projectiles when their homing paths converge.
  const shape = effect.block.motif === "helix" ? "helix" : "chain";
  return [-1, 1].map((sign) => {
    const origin = projectilePoint(effect, 0.52 * sign, 0.46 * sign);
    return { shape, origin, scale: 0.42, turn: effect.facing };
  });
}

function fanProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  return [-0.7, 0, 0.7].map((sideways) => projectileOperation(effect, 0.18, sideways));
}

function crossProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  return [-1, 1].flatMap((forward) =>
    [-1, 1].map((sideways) => ({
      shape: "crystal" as const,
      origin: projectilePoint(effect, forward * 0.52, sideways * 0.52),
      scale: 0.48,
      turn: effect.facing,
    })),
  );
}

function ringProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  const orbit = [-0.62, 0.62];
  const satellites = orbit.flatMap((forward) =>
    orbit.map((sideways) => projectileOperation(effect, forward, sideways)),
  );
  return [{ shape: "ring", origin: { x: effect.x, z: effect.z }, scale: 0.86 }, ...satellites];
}

function spiralProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  return [
    { shape: "helix", origin: projectilePoint(effect, 0.62, 0), scale: 0.62, turn: effect.facing },
    {
      shape: "helix",
      origin: projectilePoint(effect, 0.12, 0.52),
      scale: 0.54,
      turn: effect.facing,
    },
    {
      shape: "helix",
      origin: projectilePoint(effect, -0.38, 0),
      scale: 0.46,
      turn: effect.facing,
    },
  ];
}

function returningProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  return [
    projectileOperation(effect, 0.35),
    {
      shape: "chain",
      origin: projectilePoint(effect, -0.32, 0.38),
      scale: 0.45,
      turn: effect.facing,
    },
    {
      shape: "chain",
      origin: projectilePoint(effect, -0.7, -0.24),
      scale: 0.36,
      turn: effect.facing,
    },
  ];
}

function alternatingProjectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  return [
    projectileOperation(effect, 0.28, 0.42),
    {
      shape: "crystal",
      origin: projectilePoint(effect, -0.28, -0.42),
      scale: 0.52,
      turn: effect.facing,
    },
  ];
}

function projectileOperations(effect: ProjectileEffect): readonly VfxPlanOperation[] {
  const pattern: ProjectilePattern = effect.pattern ?? "single";
  switch (pattern) {
    case "single":
      return [projectileOperation(effect)];
    case "paired":
      return pairedProjectileOperations(effect);
    case "fan":
      return fanProjectileOperations(effect);
    case "cross":
      return crossProjectileOperations(effect);
    case "ring":
      return ringProjectileOperations(effect);
    case "spiral":
      return spiralProjectileOperations(effect);
    case "returning":
      return returningProjectileOperations(effect);
    case "alternating":
      return alternatingProjectileOperations(effect);
  }
}

function zoneOperations(effect: ZoneEffect): readonly VfxPlanOperation[] {
  const origin = { x: effect.x, z: effect.z };
  const operations: VfxPlanOperation[] = [
    { shape: "ring", origin, scale: Math.min(effect.block.radius, MAX_ZONE_RING_RADIUS) },
  ];
  if (effect.block.motif === "chromosome" || effect.block.motif === "maize_chromosome") {
    operations.push({ shape: "chromosome", origin, scale: 0.78 });
  }
  if (effect.block.motif === "maize_chromosome") {
    operations.push({
      shape: "cob",
      origin: { x: origin.x + effect.block.radius * 0.38, z: origin.z },
      scale: 0.82,
    });
  }
  return operations;
}

/**
 * Derive persistent special visuals from the simulation's current effects.
 * Effect records, rather than release metadata, own projectile count, timing,
 * position, zone geometry, and modifier targeting.
 */
export function vfxOperationsForEffects(
  effects: readonly Effect[],
  fighters: readonly Fighter[],
): readonly VfxPlanOperation[] {
  const operations: VfxPlanOperation[] = [];
  for (const effect of effects) {
    switch (effect.kind) {
      case "projectile":
        operations.push(...projectileOperations(effect));
        break;
      case "zone":
        operations.push(...zoneOperations(effect));
        break;
      case "modifier": {
        const target = fighters[effect.target];
        if (target) operations.push({ shape: "cloud", origin: target, scale: 0.8 });
        break;
      }
      case "scheduled":
      case "shield":
        break;
    }
  }
  return operations;
}

/** Reposition has no persistent Effect, so it keeps a short release-only bridge cue. */
export function repositionReleasePlan(
  release: SpecialRelease,
  destination: VfxPoint,
): readonly VfxPlanOperation[] {
  const reposition = release.special.blocks.find((block) => block.kind === "reposition");
  if (!reposition) return [];
  const origin = { x: release.origin.x, z: release.origin.z };
  const operations: VfxPlanOperation[] = [
    ...(reposition.motif === "chromosome" ? [] : [{ shape: "ring" as const, origin, scale: 0.7 }]),
    { shape: "beam", origin, destination, scale: 0.45 },
    { shape: "ring", origin: destination, scale: 0.95 },
  ];
  if (reposition.motif === "chromosome")
    operations.push({ shape: "chromosomeGap", origin, scale: 0.86, turn: release.origin.facing });
  const strike = release.special.blocks
    .flatMap((block) => block.onHit ?? [])
    .find((block) => block.kind === "strike");
  if (strike && distance(destination, release.target) <= strike.reach)
    operations.push({ shape: "burst", origin: release.target, scale: 0.75 });
  return operations;
}

/** Reusable meshes for current simulation effects and short reposition bridges. */
export class SpecialVfx {
  private readonly available = new Map<VfxShape, AbstractMesh[]>();
  private readonly transient: TransientVisual[] = [];
  private readonly live = new Map<string, LiveVisual>();
  private readonly blockIds = new WeakMap<object, number>();
  private nextBlockId = 0;

  constructor(private readonly scene: Scene) {
    for (const shape of SHAPES) {
      this.available.set(shape, []);
    }
  }

  release(release: SpecialRelease, fighter: Fighter): void {
    for (const operation of repositionReleasePlan(release, fighter))
      this.activateTransient(operation, release.owner, release.origin.facing);
  }

  syncEffects(effects: readonly Effect[], fighters: readonly Fighter[]): void {
    const wanted = new Map<string, { operation: VfxPlanOperation; owner: FighterSlot }>();
    const occurrences = new Map<string, number>();
    for (const effect of effects) {
      if (effect.kind === "scheduled" || effect.kind === "shield") continue;
      const base =
        effect.kind === "modifier"
          ? `${effect.kind}:${effect.owner}:${effect.target}:${effect.stat}`
          : `${effect.kind}:${effect.owner}:${this.blockId(effect.block)}`;
      const occurrence = occurrences.get(base) ?? 0;
      occurrences.set(base, occurrence + 1);
      const operations = vfxOperationsForEffects([effect], fighters);
      operations.forEach((operation, index) =>
        wanted.set(`${base}:${occurrence}:${index}`, { operation, owner: effect.owner }),
      );
    }
    for (const [key, visual] of this.live) {
      if (wanted.has(key)) continue;
      visual.mesh.setEnabled(false);
      this.live.delete(key);
    }
    for (const [key, wantedVisual] of wanted) {
      const existing = this.live.get(key);
      if (existing) {
        Object.assign(existing, wantedVisual.operation, { owner: wantedVisual.owner });
      } else {
        const mesh = this.acquire(wantedVisual.operation.shape);
        mesh.setEnabled(true);
        this.live.set(key, {
          ...wantedVisual.operation,
          mesh,
          owner: wantedVisual.owner,
          facing: 0,
        });
      }
    }
  }

  /** Debug-only caller seam for visual capture; normal play uses live effects. */
  preview(shape: VfxShape, fighter: Fighter): void {
    this.activateTransient({ shape, origin: fighter, scale: 1 }, 0, fighter.facing);
  }

  private blockId(block: object): number {
    const known = this.blockIds.get(block);
    if (known !== undefined) return known;
    const next = this.nextBlockId++;
    this.blockIds.set(block, next);
    return next;
  }

  private acquire(shape: VfxShape): AbstractMesh {
    const meshes = this.available.get(shape);
    if (!meshes) throw new Error(`Unknown VFX shape: ${shape}`);
    const reusable = meshes.find((mesh) => !mesh.isEnabled());
    if (reusable) return reusable;
    const index = meshes.length;
    const mesh = visualMesh(shape, `vfx-${shape}-${index}`, this.scene);
    mesh.material = materialFor(`${shape}-${index}`, this.scene);
    mesh.isPickable = false;
    mesh.setEnabled(false);
    meshes.push(mesh);
    return mesh;
  }

  private activateTransient(operation: VfxPlanOperation, owner: FighterSlot, facing: number): void {
    const mesh = this.acquire(operation.shape);
    mesh.setEnabled(true);
    this.transient.push({ ...operation, mesh, age: 0, owner, facing });
  }

  private draw(visual: LiveVisual | TransientVisual, alpha: number): void {
    const color =
      visual.shape === "cob" || visual.shape === "chromosome" || visual.shape === "chromosomeGap"
        ? new Color3(1, 0.72, 0.12)
        : visual.owner === 0
          ? new Color3(1, 0.31, 0.23)
          : new Color3(0.25, 0.72, 1);
    const material = visual.mesh.material as StandardMaterial;
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.8);
    material.alpha = alpha;
    const destination = visual.destination ?? visual.origin;
    const scale = visual.scale ?? 1;
    visual.mesh.position.set(
      visual.origin.x,
      visual.shape === "cob" ? 1.05 : 0.72,
      visual.origin.z,
    );
    visual.mesh.rotation.set(0, visual.turn ?? visual.facing, 0);
    visual.mesh.scaling.setAll(scale);
    if (visual.destination) {
      const length = distance(visual.origin, destination);
      visual.mesh.position.set(
        (visual.origin.x + destination.x) / 2,
        0.55,
        (visual.origin.z + destination.z) / 2,
      );
      visual.mesh.rotation.y = Math.atan2(
        destination.x - visual.origin.x,
        destination.z - visual.origin.z,
      );
      visual.mesh.scaling.set(scale, scale, (length / 3.2) * scale);
    }
    switch (visual.shape) {
      case "ring":
        visual.mesh.position.y = 0.045;
        break;
      case "helix":
        visual.mesh.position.y = 0.5;
        visual.mesh.rotation.y += 0.12;
        break;
      case "cloud":
        visual.mesh.position.y = 0.55;
        visual.mesh.scaling.y = scale * 0.55;
        break;
      case "burst":
        visual.mesh.position.y = 0.86;
        break;
      case "orb":
        visual.mesh.position.y = 1.1;
        break;
      case "chain":
        visual.mesh.position.y = 1.05;
        break;
      case "cob":
        break;
      case "chromosome":
        visual.mesh.position.y = 0.94;
        break;
      case "chromosomeGap":
        visual.mesh.position.y = 0.12;
        break;
      case "beam":
      case "crystal":
        break;
    }
  }

  update(frameSeconds: number): void {
    for (const visual of this.live.values()) this.draw(visual, 0.88);
    for (let index = this.transient.length - 1; index >= 0; index--) {
      const visual = this.transient[index];
      if (!visual) continue;
      visual.age += frameSeconds;
      const progress = Math.min(visual.age / TRANSIENT_SECONDS, 1);
      if (progress >= 1) {
        visual.mesh.setEnabled(false);
        this.transient.splice(index, 1);
      } else this.draw(visual, 0.82 * (1 - progress));
    }
  }

  get activeCount(): number {
    return this.live.size + this.transient.length;
  }
}

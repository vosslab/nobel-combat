import { Color3, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";
import type { Fighter } from "../match";

const DURATION_SECONDS = 0.5;
const CAMERA_OFFSET = 0.48;
const HIT_COLOR = new Color3(1, 0.78, 0.2);
const BLOCK_COLOR = new Color3(0.42, 0.82, 1);
const HIT_EMISSIVE = new Color3(1, 0.46, 0.06);
const BLOCK_EMISSIVE = new Color3(0.12, 0.55, 0.9);

type HitCue = {
  mesh: ReturnType<typeof MeshBuilder.CreateTorus>;
  material: StandardMaterial;
  kind: "hit" | "block" | null;
  remaining: number;
};

export type HitCueSnapshot = Readonly<{
  enabled: boolean;
  kind: "hit" | "block" | null;
  x: number;
  y: number;
  z: number;
  alpha: number;
}>;

export class HitCues {
  private readonly cues: readonly [HitCue, HitCue];

  constructor(scene: Scene) {
    this.cues = [this.createCue(scene, 0), this.createCue(scene, 1)];
  }

  begin(index: 0 | 1, fighter: Fighter, cameraYaw: number): void {
    const cue = this.cues[index];
    const blocked = fighter.state === "block";
    cue.kind = blocked ? "block" : "hit";
    cue.material.diffuseColor.copyFrom(blocked ? BLOCK_COLOR : HIT_COLOR);
    cue.material.emissiveColor.copyFrom(blocked ? BLOCK_EMISSIVE : HIT_EMISSIVE);
    cue.remaining = DURATION_SECONDS;
    this.position(cue, fighter, cameraYaw);
    cue.mesh.scaling.setAll(0.76);
    cue.material.alpha = 1;
    cue.mesh.setEnabled(true);
  }

  update(fighters: [Fighter, Fighter], cameraYaw: number, frameSeconds: number): void {
    for (const [index, cue] of this.cues.entries()) {
      if (cue.remaining <= 0) {
        cue.mesh.setEnabled(false);
        continue;
      }
      const fighter = fighters[index];
      if (!fighter) continue;
      const progress = cue.remaining / DURATION_SECONDS;
      this.position(cue, fighter, cameraYaw);
      cue.mesh.scaling.setAll(0.76 + (1 - progress) * 0.62);
      cue.material.alpha = progress;
      cue.remaining = Math.max(0, cue.remaining - frameSeconds);
    }
  }

  snapshots(): readonly HitCueSnapshot[] {
    return this.cues.map((cue) => ({
      enabled: cue.mesh.isEnabled(),
      kind: cue.remaining > 0 ? cue.kind : null,
      x: cue.mesh.position.x,
      y: cue.mesh.position.y,
      z: cue.mesh.position.z,
      alpha: cue.material.alpha,
    }));
  }

  private createCue(scene: Scene, index: number): HitCue {
    const material = new StandardMaterial(`hit-impact-${index}-material`, scene);
    material.diffuseColor.copyFrom(HIT_COLOR);
    material.emissiveColor.copyFrom(HIT_EMISSIVE);
    material.disableLighting = true;
    const mesh = MeshBuilder.CreateTorus(
      `hit-impact-${index}`,
      { diameter: 1.05, thickness: 0.14, tessellation: 24 },
      scene,
    );
    mesh.material = material;
    mesh.isPickable = false;
    mesh.setEnabled(false);
    return { mesh, material, kind: null, remaining: 0 };
  }

  private position(cue: HitCue, fighter: Fighter, cameraYaw: number): void {
    cue.mesh.position.set(
      fighter.x + Math.sin(cameraYaw) * CAMERA_OFFSET,
      cue.kind === "block" ? 1.08 : 1.35,
      fighter.z - Math.cos(cameraYaw) * CAMERA_OFFSET,
    );
    cue.mesh.rotation.x = Math.PI / 2;
    cue.mesh.rotation.y = Math.PI - cameraYaw;
  }
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { Bone, Matrix, NullEngine, Scene, Skeleton, TransformNode } from "@babylonjs/core";
import { applyAppearanceKit } from "../src/rig/appearance_kit.ts";

function skeletonWithBones(scene, names) {
  const skeleton = new Skeleton("kit test skeleton", "kit test skeleton", scene);
  for (const name of names) {
    const node = new TransformNode(name, scene);
    const bone = new Bone(name, skeleton, null, Matrix.Identity());
    bone.linkTransformNode(node);
  }
  return skeleton;
}

test("head accessories follow the head bone", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const root = new TransformNode("accessory root", scene);
  const skeleton = skeletonWithBones(scene, ["head"]);
  const head = skeleton.bones[0].getTransformNode();
  assert.ok(head instanceof TransformNode);

  const runtime = applyAppearanceKit(root, [skeleton], scene, "accessory kit", {
    glasses: "wire",
    facialHair: "chinStrap",
  });
  assert.ok(runtime);
  const accessories = scene.meshes.filter((mesh) => mesh.name.startsWith("accessory kit"));
  assert.ok(accessories.length > 0, "accessories generate visible meshes");
  assert.ok(
    accessories.every((mesh) => mesh.parent === head),
    "all head accessories must follow the head bone",
  );

  runtime.dispose();
  scene.dispose();
  engine.dispose();
});

test("manometer owns and releases its bone-attached visual resources", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const root = new TransformNode("prop root", scene);
  const skeleton = skeletonWithBones(scene, ["pelvis", "lowerarm_l"]);
  const runtime = applyAppearanceKit(root, [skeleton], scene, "prop kit", { prop: "manometer" });
  assert.ok(runtime?.propVisual, "manometer must expose its visual controller");
  assert.equal(runtime.propVisual.snapshot().flowActive, false, "flow starts inactive");
  runtime.propVisual.update("special", 0, 16);
  assert.equal(runtime.propVisual.snapshot().flowActive, true, "flow activates during a special");
  assert.ok(
    scene.meshes.some((mesh) => mesh.name.startsWith("prop kit belt pressure gauge")),
    "manometer gauge must be attached during its lifecycle",
  );

  runtime.dispose();

  assert.equal(
    scene.meshes.filter((mesh) => mesh.name.startsWith("prop kit")).length,
    0,
    "kit disposal must release generated prop meshes",
  );
  assert.equal(
    scene.materials.filter((material) => material.name.startsWith("prop kit")).length,
    0,
    "kit disposal must release generated prop materials",
  );
  scene.dispose();
  engine.dispose();
});

test("failed kit construction leaves no kit-owned nodes, meshes, or materials", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const root = new TransformNode("failure root", scene);
  const skeleton = skeletonWithBones(scene, ["head", "pelvis"]);
  assert.throws(
    () =>
      applyAppearanceKit(root, [skeleton], scene, "failed kit", {
        glasses: "wire",
        prop: "manometer",
      }),
    /lowerarm_l/,
  );
  assert.equal(
    scene.meshes.filter((mesh) => mesh.name.startsWith("failed kit")).length,
    0,
    "failed construction must dispose kit meshes",
  );
  assert.equal(
    scene.transformNodes.filter((node) => node.name.startsWith("failed kit")).length,
    0,
    "failed construction must dispose kit transform nodes",
  );
  assert.equal(
    scene.materials.filter((material) => material.name.startsWith("failed kit")).length,
    0,
    "failed construction must dispose kit materials",
  );
  scene.dispose();
  engine.dispose();
});

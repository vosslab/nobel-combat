import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const REQUIRED_CLIPS = Object.freeze({
  idle: "Fighting Idle",
  move: "Walk",
  light: "Fighting Left Jab",
  heavy: "Punch_Cross",
  block: "Defend",
  hit: "Hit_Knockback",
  down: "Death_D",
  getup: "LayToIdle",
});
const GAMEPLAY_SOURCES = ["src/match.ts", "src/ai.ts", "src/debug_harness.ts"];
const RENDERING_IMPORT =
  /(?:from\s*["'](?:@babylonjs(?:\/|["'])|[^"']*(?:\.glb|rigged_fighter|renderer)[^"']*)["']|import\s*\(\s*["'](?:@babylonjs(?:\/|["'])|[^"']*(?:\.glb|rigged_fighter|renderer)[^"']*)["']\s*\)|require\s*\(\s*["'](?:@babylonjs(?:\/|["'])|[^"']*(?:\.glb|rigged_fighter|renderer)[^"']*)["']\s*\))/;

function repositoryPath(relativePath) {
  return new URL(relativePath, `${new URL(".", import.meta.url)}../`);
}

function readGlbJson(glb) {
  assert.ok(glb.length >= 20, "GLB must include a header and JSON chunk header");
  assert.equal(glb.toString("ascii", 0, 4), "glTF", "GLB magic must be glTF");
  assert.equal(glb.readUInt32LE(4), 2, "GLB version must be 2");
  assert.equal(glb.readUInt32LE(8), glb.length, "GLB header length must match the file");

  const jsonLength = glb.readUInt32LE(12);
  assert.equal(glb.toString("ascii", 16, 20), "JSON", "first GLB chunk must be JSON");
  assert.ok(20 + jsonLength <= glb.length, "GLB JSON chunk must stay within the file");
  return JSON.parse(glb.toString("utf8", 20, 20 + jsonLength).trimEnd());
}

test("authoritative combat modules have no rendering or asset imports", async () => {
  for (const relativePath of GAMEPLAY_SOURCES) {
    const source = await readFile(repositoryPath(relativePath), "utf8");
    assert.doesNotMatch(
      source,
      RENDERING_IMPORT,
      `${relativePath} must remain independent of Babylon, GLB assets, and rendering modules`,
    );
  }
});

async function readGlb(relativePath) {
  return readGlbJson(await readFile(repositoryPath(relativePath)));
}

function animationByName(document) {
  return new Map((document.animations ?? []).map((animation) => [animation.name, animation]));
}

test("Mesh2Motion human model has one complete local skin", async () => {
  const document = await readGlb("assets/models/mesh2motion_male_5.glb");

  assert.equal(document.asset?.version, "2.0");
  assert.equal(document.skins?.length, 1, "fighter model needs one skin");
  const skin = document.skins[0];
  assert.ok(Array.isArray(skin?.joints), "skin must declare its joints");
  assert.equal(skin.joints.length, 66, "Mesh2Motion male_5 must retain its complete 66-joint rig");
  assert.equal(new Set(skin.joints).size, skin.joints.length, "skin joints must be unique");
  assert.ok(skin.joints.every((joint) => Number.isInteger(joint) && joint >= 0));
  assert.ok(
    skin.joints.every((joint) => document.nodes?.[joint]),
    "skin joints must name nodes",
  );

});

test("curated Mesh2Motion animations cover every combat state on the local human rig", async () => {
  const [model, base, addon] = await Promise.all([
    readGlb("assets/models/mesh2motion_male_5.glb"),
    readGlb("assets/animations/mesh2motion_human_base.glb"),
    readGlb("assets/animations/mesh2motion_human_addon.glb"),
  ]);
  const skin = model.skins?.[0];
  assert.ok(skin, "fighter model must define a skin");
  const rigNames = new Set(skin.joints.map((joint) => model.nodes?.[joint]?.name));
  assert.equal(rigNames.size, skin.joints.length, "fighter rig joint names must be unique");

  const baseAnimations = animationByName(base);
  const addonAnimations = animationByName(addon);
  const allAnimations = new Map([...baseAnimations, ...addonAnimations]);
  for (const [state, clipName] of Object.entries(REQUIRED_CLIPS)) {
    const animation = allAnimations.get(clipName);
    assert.ok(animation, `${state} requires local native clip '${clipName}'`);
    assert.ok(animation.channels?.length > 0, `${state} clip must animate a skeletal target`);
    for (const channel of animation.channels) {
      const targetName = animation === baseAnimations.get(clipName)
        ? base.nodes?.[channel.target?.node]?.name
        : addon.nodes?.[channel.target?.node]?.name;
      assert.ok(
        rigNames.has(targetName),
        `${state} clip '${clipName}' targets '${targetName}', absent from male_5 rig`,
      );
    }
  }
});

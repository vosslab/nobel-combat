import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { ROSTER } from "../src/roster/roster.ts";

const REQUIRED_CLIPS = Object.freeze({
  idle: "Fighting Idle",
  move: "Walk",
  light: "Fighting Left Jab",
  heavy: "Punch_Cross",
  block: "Defend",
  hit: "Hit_Knockback",
  down: "Death_C",
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

test("model manifest lists the unique roster bodies in declaration order", async () => {
  const manifest = await readFile(repositoryPath("assets/models/MANIFEST.txt"), "utf8");
  assert.ok(manifest.endsWith("\n"), "model manifest must end with a newline");
  const listedModels = manifest.trimEnd().split(/\r?\n/);
  const rosterModels = [...new Set(Object.values(ROSTER).map((fighter) => fighter.body))];
  assert.deepEqual(listedModels, rosterModels);
  for (const modelPath of listedModels) {
    assert.match(modelPath, /^assets\/models\/[a-z0-9_]+\.glb$/);
    assert.ok(
      (await readFile(repositoryPath(modelPath))).length > 0,
      `${modelPath} must be non-empty`,
    );
  }
});

async function readGlb(relativePath) {
  return readGlbJson(await readFile(repositoryPath(relativePath)));
}

function animationByName(document) {
  return new Map((document.animations ?? []).map((animation) => [animation.name, animation]));
}

function skinJointNames(document, label, expectedJointCount = 66) {
  assert.equal(document.asset?.version, "2.0");
  assert.equal(document.skins?.length, 1, `${label} needs one skin`);
  const skin = document.skins[0];
  assert.ok(Array.isArray(skin?.joints), `${label} skin must declare its joints`);
  assert.equal(
    skin.joints.length,
    expectedJointCount,
    `${label} must retain its complete ${expectedJointCount}-joint rig`,
  );
  assert.equal(
    new Set(skin.joints).size,
    skin.joints.length,
    `${label} skin joints must be unique`,
  );
  assert.ok(skin.joints.every((joint) => Number.isInteger(joint) && joint >= 0));
  assert.ok(
    skin.joints.every((joint) => document.nodes?.[joint]),
    `${label} skin joints must name nodes`,
  );
  const names = skin.joints.map((joint) => document.nodes?.[joint]?.name);
  assert.equal(new Set(names).size, names.length, `${label} rig joint names must be unique`);
  assert.ok(names.every((name) => typeof name === "string" && name.length > 0));
  return names;
}

test("registered bodies retain the canonical native Mesh2Motion skeleton", async () => {
  const canonical = await readGlb("assets/models/mesh2motion_male_5.glb");
  const canonicalJointNames = skinJointNames(canonical, "Mesh2Motion male_5");
  const rosterBodies = [...new Set(Object.values(ROSTER).map((fighter) => fighter.body))];
  for (const body of rosterBodies) {
    const model = await readGlb(body);
    assert.ok(model.meshes?.length > 0, `${body} must contain rendered mesh data`);
    for (const [nodeIndex, node] of (model.nodes ?? []).entries()) {
      if (node.mesh !== undefined) {
        assert.equal(
          node.skin,
          0,
          `${body} mesh-bearing node ${nodeIndex} must use its canonical skin`,
        );
      }
    }
    assert.deepEqual(
      skinJointNames(model, body),
      canonicalJointNames,
      `${body} must retain the canonical native skeleton for direct clip cloning`,
    );
  }
});

test("curated Mesh2Motion clips target the complete canonical skeleton", async () => {
  const [canonical, base, addon] = await Promise.all([
    readGlb("assets/models/mesh2motion_male_5.glb"),
    readGlb("assets/animations/mesh2motion_human_base.glb"),
    readGlb("assets/animations/mesh2motion_human_addon.glb"),
  ]);
  const canonicalJointNames = new Set(skinJointNames(canonical, "Mesh2Motion male_5"));

  const baseAnimations = animationByName(base);
  const addonAnimations = animationByName(addon);
  const allAnimations = new Map([...baseAnimations, ...addonAnimations]);
  for (const [state, clipName] of Object.entries(REQUIRED_CLIPS)) {
    const animation = allAnimations.get(clipName);
    assert.ok(animation, `${state} requires local native clip '${clipName}'`);
    const document = animation === baseAnimations.get(clipName) ? base : addon;
    const targets = new Set(
      animation.channels.map((channel) => document.nodes?.[channel.target?.node]?.name),
    );
    assert.deepEqual(
      targets,
      canonicalJointNames,
      `${state} clip '${clipName}' must target the complete canonical skeleton`,
    );
  }
});

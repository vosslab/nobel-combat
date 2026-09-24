import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const REQUIRED_CLIPS = ["idle", "move", "light", "heavy", "block", "hit", "down", "getup"];
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

test("neutral humanoid GLB has one complete skin and the combat animation contract", async () => {
  const glb = await readFile(repositoryPath("src/assets/neutral_humanoid.glb"));
  const document = readGlbJson(glb);

  assert.equal(document.asset?.version, "2.0");
  assert.equal(document.skins?.length, 1, "neutral fighter needs one skin");
  const skin = document.skins[0];
  assert.ok(Array.isArray(skin?.joints), "skin must declare its joints");
  assert.equal(skin.joints.length, 14, "neutral fighter rig must have fourteen joints");
  assert.equal(new Set(skin.joints).size, skin.joints.length, "skin joints must be unique");
  assert.ok(skin.joints.every((joint) => Number.isInteger(joint) && joint >= 0));
  assert.ok(
    skin.joints.every((joint) => document.nodes?.[joint]),
    "skin joints must name nodes",
  );

  const clipNames = document.animations?.map((animation) => animation.name);
  assert.deepEqual(clipNames, REQUIRED_CLIPS, "GLB clips must exactly match combat states");
  for (const animation of document.animations) {
    assert.ok(animation.channels?.length > 0, `${animation.name} must animate at least one joint`);
    for (const channel of animation.channels) {
      assert.ok(
        skin.joints.includes(channel.target?.node),
        `${animation.name} must target a skin joint`,
      );
      assert.equal(channel.target?.path, "rotation", `${animation.name} must be skeletal motion`);
    }
  }
});

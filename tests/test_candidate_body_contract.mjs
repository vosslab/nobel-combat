import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const checkCandidateBody = new URL("../devel/check_candidate_body.mjs", import.meta.url);
const canonicalRig = await readFile(
  new URL("../assets/models/mesh2motion_male_5.glb", import.meta.url),
);
const canonicalJsonLength = canonicalRig.readUInt32LE(12);
const canonicalDocument = JSON.parse(
  canonicalRig.toString("utf8", 20, 20 + canonicalJsonLength).trimEnd(),
);
const canonicalJointNames = canonicalDocument.skins[0].joints.map(
  (joint) => canonicalDocument.nodes[joint].name,
);

function align4(value) {
  return (value + 3) & ~3;
}

function glb(document) {
  const json = Buffer.from(JSON.stringify(document), "utf8");
  const padding = Buffer.alloc(align4(json.length) - json.length, 0x20);
  const chunk = Buffer.concat([
    Buffer.from(Uint32Array.of(json.length + padding.length).buffer),
    Buffer.from("JSON"),
    json,
    padding,
  ]);
  const header = Buffer.alloc(12);
  header.write("glTF");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(header.length + chunk.length, 8);
  return Buffer.concat([header, chunk]);
}

function candidate(nodes, { jointNames = canonicalJointNames, includeSkin = true } = {}) {
  const candidateNodes = nodes.map((node) =>
    node?.mesh === undefined || node.skin !== undefined ? node : { ...node, skin: 0 },
  );
  const jointOffset = candidateNodes.length;
  return glb({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [...candidateNodes, ...jointNames.map((name) => ({ name }))],
    meshes: [{ primitives: [] }, { primitives: [] }],
    ...(includeSkin
      ? {
          skins: [{ joints: jointNames.map((_, index) => jointOffset + index) }],
        }
      : {}),
  });
}

function run(path) {
  return spawnSync(process.execPath, [checkCandidateBody.pathname, path], {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function rejects(path) {
  assert.equal(run(path).status, 1);
}

test("candidate body preflight accepts a preserved donor mesh with the canonical rig", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nobel-combat-candidate-body-"));
  try {
    const path = join(directory, "reachable.glb");
    await writeFile(path, candidate([{ name: "Character_Female_09", mesh: 0 }]));
    assert.equal(run(path).status, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("candidate body preflight rejects a reordered or missing canonical rig", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nobel-combat-candidate-body-"));
  try {
    const reorderedPath = join(directory, "reordered-rig.glb");
    await writeFile(
      reorderedPath,
      candidate([{ name: "Visible body", mesh: 0 }], {
        jointNames: [
          canonicalJointNames[1],
          canonicalJointNames[0],
          ...canonicalJointNames.slice(2),
        ],
      }),
    );
    rejects(reorderedPath);

    const missingSkinPath = join(directory, "missing-rig.glb");
    await writeFile(
      missingSkinPath,
      candidate([{ name: "Visible body", mesh: 0 }], { includeSkin: false }),
    );
    rejects(missingSkinPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("candidate body preflight names an orphaned mesh before capture", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nobel-combat-candidate-body-"));
  try {
    const path = join(directory, "orphaned.glb");
    await writeFile(
      path,
      candidate([
        { name: "Visible body", mesh: 0 },
        { name: "Orphaned costume", mesh: 1 },
      ]),
    );
    rejects(path);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("candidate body preflight rejects a reachable mesh bound to another skin", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nobel-combat-candidate-body-"));
  try {
    const path = join(directory, "wrong-skin.glb");
    await writeFile(path, candidate([{ name: "Visible body", mesh: 0, skin: 1 }]));
    rejects(path);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

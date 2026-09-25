import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const repair = new URL("../devel/repair_skin_joint_order.mjs", import.meta.url);

function align4(value) {
  return (value + 3) & ~3;
}

function glb(json, bin, opaque = undefined) {
  const jsonBytes = Buffer.from(JSON.stringify(json), "utf8");
  const jsonPadding = Buffer.alloc(align4(jsonBytes.length) - jsonBytes.length, 0x20);
  const binPadding = Buffer.alloc(align4(bin.length) - bin.length);
  const chunks = [
    Buffer.from(Uint32Array.of(jsonBytes.length + jsonPadding.length).buffer),
    Buffer.from("JSON"),
    jsonBytes,
    jsonPadding,
    Buffer.from(Uint32Array.of(bin.length + binPadding.length).buffer),
    Buffer.from("BIN\0"),
    bin,
    binPadding,
  ];
  if (opaque) {
    const padding = Buffer.alloc(align4(opaque.bytes.length) - opaque.bytes.length);
    chunks.push(
      Buffer.from(Uint32Array.of(opaque.bytes.length + padding.length).buffer),
      Buffer.from(opaque.type),
      opaque.bytes,
      padding,
    );
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write("glTF");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + body.length, 8);
  return Buffer.concat([header, body]);
}

function parseGlb(bytes) {
  let offset = 12;
  let json;
  let bin;
  while (offset < bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "JSON") json = JSON.parse(body.toString("utf8").trimEnd());
    if (type === "BIN\0") bin = body;
    offset += 8 + length;
  }
  assert.ok(json && bin, "fixture is a standard GLB");
  return { json, bin };
}

function matrix(tag) {
  const output = Buffer.alloc(64);
  output.writeFloatLE(tag, 0);
  return output;
}

function fixture(order, { secondSkin = false } = {}) {
  const joints = Buffer.from([0, 1, 2, 0, 2, 1, 0, 2]);
  const bin = Buffer.concat([joints, matrix(10), matrix(20), matrix(30)]);
  const nodeByName = new Map([
    ["a", 0],
    ["b", 1],
    ["c", 2],
  ]);
  return glb(
    {
      asset: { version: "2.0" },
      buffers: [{ byteLength: bin.length }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: joints.length },
        { buffer: 0, byteOffset: joints.length, byteLength: 192 },
      ],
      accessors: [
        {
          bufferView: 0,
          componentType: 5121,
          count: 2,
          type: "VEC4",
          min: [9, 9, 9, 9],
          max: [9, 9, 9, 9],
        },
        { bufferView: 1, componentType: 5126, count: 3, type: "MAT4" },
      ],
      nodes: [{ name: "a" }, { name: "b" }, { name: "c" }, { mesh: 0, skin: 0 }],
      meshes: [{ primitives: [{ attributes: { JOINTS_0: 0 } }] }],
      skins: [
        { joints: order.map((name) => nodeByName.get(name)), inverseBindMatrices: 1 },
        ...(secondSkin
          ? [{ joints: order.map((name) => nodeByName.get(name)), inverseBindMatrices: 1 }]
          : []),
      ],
    },
    bin,
  );
}

function repairFile(source, input, output) {
  execFileSync(process.execPath, [repair.pathname, source, input, output], { stdio: "pipe" });
}

function jointValues(doc) {
  const accessor = doc.json.accessors[doc.json.meshes[0].primitives[0].attributes.JOINTS_0];
  const view = doc.json.bufferViews[accessor.bufferView];
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return [...doc.bin.subarray(start, start + accessor.count * 4)];
}

function matrixTags(doc) {
  const accessor = doc.json.accessors[doc.json.skins[0].inverseBindMatrices];
  const view = doc.json.bufferViews[accessor.bufferView];
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count }, (_, index) =>
    doc.bin.readFloatLE(start + index * 64),
  );
}

test("joint-order repair preserves skinning meanings and fails closed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nobel-combat-rig-repair-"));
  try {
    const source = join(directory, "source.glb");
    const input = join(directory, "input.glb");
    const output = join(directory, "output.glb");
    const opaque = join(directory, "opaque.glb");
    const rejected = join(directory, "rejected.glb");
    const multiSkin = join(directory, "multi-skin.glb");
    await writeFile(source, fixture(["a", "b", "c"]));
    await writeFile(input, fixture(["c", "a", "b"]));

    repairFile(source, input, output);
    const repaired = parseGlb(await readFile(output));
    assert.deepEqual(repaired.json.skins[0].joints, [0, 1, 2], "canonical joint order is restored");
    assert.deepEqual(
      jointValues(repaired),
      [2, 0, 1, 2, 1, 0, 2, 1],
      "vertex joint names keep their meaning",
    );
    assert.deepEqual(
      matrixTags(repaired),
      [20, 30, 10],
      "inverse-bind rows stay paired with bone names",
    );
    const joints =
      repaired.json.accessors[repaired.json.meshes[0].primitives[0].attributes.JOINTS_0];
    assert.deepEqual(joints.min, [1, 0, 1, 1], "JOINTS min is recomputed");
    assert.deepEqual(joints.max, [2, 0, 2, 2], "JOINTS max is recomputed");

    await writeFile(
      opaque,
      glb(parseGlb(await readFile(input)).json, parseGlb(await readFile(input)).bin, {
        type: "TEST",
        bytes: Buffer.from("x"),
      }),
    );
    assert.throws(() => repairFile(source, opaque, rejected), /unsupported opaque TEST chunk/);
    await assert.rejects(readFile(rejected), { code: "ENOENT" });

    await writeFile(multiSkin, fixture(["c", "a", "b"], { secondSkin: true }));
    assert.throws(() => repairFile(source, multiSkin, rejected), /exactly one canonical skin/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

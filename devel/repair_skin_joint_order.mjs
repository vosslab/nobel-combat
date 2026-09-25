#!/usr/bin/env node
/**
 * Reorders an authored GLB skin to a native source GLB's joint-name order.
 *
 * Blender exports can preserve joint names while changing their array order.
 * This command restores direct native-clip compatibility, remapping both
 * JOINTS_n values and inverse-bind rows. It rejects layouts it cannot prove.
 */
import { readFile, writeFile } from "node:fs/promises";

const GLB_MAGIC = "glTF";
const JSON_CHUNK = "JSON";
const BIN_CHUNK = "BIN\0";

function fail(message) {
  throw new Error(`repair_skin_joint_order: ${message}`);
}

function align4(value) {
  return (value + 3) & ~3;
}

async function readGlb(path) {
  const data = await readFile(path);
  if (data.toString("ascii", 0, 4) !== GLB_MAGIC) fail(`${path}: missing GLB magic`);
  if (data.readUInt32LE(4) !== 2) fail(`${path}: expected GLB version 2`);
  if (data.readUInt32LE(8) !== data.length) fail(`${path}: GLB length header mismatch`);
  let offset = 12;
  let json;
  let bin;
  while (offset < data.length) {
    if (offset + 8 > data.length) fail(`${path}: truncated chunk header`);
    const length = data.readUInt32LE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const body = data.subarray(offset + 8, offset + 8 + length);
    if (body.length !== length) fail(`${path}: truncated ${type} chunk`);
    if (type === JSON_CHUNK) {
      if (json) fail(`${path}: duplicate JSON chunk`);
      json = JSON.parse(body.toString("utf8").trimEnd());
    } else if (type === BIN_CHUNK) {
      if (bin) fail(`${path}: duplicate BIN chunk`);
      bin = body;
    } else {
      fail(`${path}: unsupported opaque ${type} chunk`);
    }
    offset += 8 + length;
  }
  if (!json || !bin) fail(`${path}: expected JSON and BIN chunks`);
  if (json.buffers?.length !== 1 || json.buffers[0].uri)
    fail(`${path}: expected one embedded buffer`);
  if (json.buffers[0].byteLength > bin.length)
    fail(`${path}: declared buffer extends past BIN chunk`);
  return { data, json, bin };
}

function jointNames(doc, label) {
  const skin = doc.skins?.[0];
  if (!skin?.joints?.length) fail(`${label}: canonical skin has no joints`);
  const names = skin.joints.map((nodeIndex) => {
    const name = doc.nodes?.[nodeIndex]?.name;
    if (!name) fail(`${label}: canonical skin joint ${nodeIndex} is unnamed`);
    return name;
  });
  if (new Set(names).size !== names.length)
    fail(`${label}: canonical skin has duplicate joint names`);
  return names;
}

function componentSize(componentType) {
  if (componentType !== 5121) fail("JOINTS accessor must use UNSIGNED_BYTE components");
  return 1;
}
function readInteger(buffer, offset, componentType) {
  componentSize(componentType);
  return buffer.readUInt8(offset);
}
function writeInteger(buffer, offset, componentType, value) {
  componentSize(componentType);
  return buffer.writeUInt8(value, offset);
}

function accessorLayout(doc, bin, accessorIndex, label) {
  const accessor = doc.accessors?.[accessorIndex];
  if (!accessor) fail(`${label}: missing accessor ${accessorIndex}`);
  if (accessor.sparse) fail(`${label}: sparse accessor ${accessorIndex} is unsupported`);
  if (accessor.bufferView === undefined)
    fail(`${label}: accessor ${accessorIndex} has no bufferView`);
  const view = doc.bufferViews?.[accessor.bufferView];
  if (!view || view.buffer !== 0)
    fail(`${label}: accessor ${accessorIndex} must use embedded buffer 0`);
  if (view.byteStride !== undefined) fail(`${label}: strided accessors are unsupported`);
  const elementSize =
    accessor.type === "VEC4"
      ? componentSize(accessor.componentType) * 4
      : accessor.type === "MAT4" && accessor.componentType === 5126
        ? 64
        : undefined;
  if (!elementSize)
    fail(
      `${label}: unsupported accessor ${accessorIndex} ${accessor.type}/${accessor.componentType}`,
    );
  const stride = elementSize;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const end = start + stride * (accessor.count - 1) + elementSize;
  if (start < 0 || end > bin.length || end > (view.byteOffset ?? 0) + view.byteLength) {
    fail(`${label}: accessor ${accessorIndex} points outside its bufferView`);
  }
  return { accessor, elementSize, stride, start };
}

function appendAccessor(target, bytes, sourceAccessor, type, componentType) {
  const buffer = target.json.buffers[0];
  const byteOffset = align4(buffer.byteLength);
  const padding = Buffer.alloc(byteOffset - buffer.byteLength);
  target.appended.push(padding, bytes);
  buffer.byteLength = byteOffset + bytes.length;
  const bufferViewIndex = target.json.bufferViews.length;
  target.json.bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.length });
  const accessorIndex = target.json.accessors.length;
  const {
    byteOffset: _ignored,
    bufferView: _oldView,
    sparse: _sparse,
    ...metadata
  } = sourceAccessor;
  target.json.accessors.push({
    ...metadata,
    bufferView: bufferViewIndex,
    type,
    componentType,
    count: sourceAccessor.count,
  });
  return accessorIndex;
}

function copyAndRemapJoints(target, accessorIndex, mapping, skinLength, label) {
  const { accessor, elementSize, stride, start } = accessorLayout(
    target.json,
    target.bin,
    accessorIndex,
    label,
  );
  if (accessor.type !== "VEC4" || accessor.normalized)
    fail(`${label}: JOINTS accessor must be an unnormalized VEC4`);
  const width = componentSize(accessor.componentType);
  const output = Buffer.alloc(accessor.count * elementSize);
  const bounds =
    accessor.min !== undefined || accessor.max !== undefined
      ? {
          min: [Infinity, Infinity, Infinity, Infinity],
          max: [-Infinity, -Infinity, -Infinity, -Infinity],
        }
      : undefined;
  for (let element = 0; element < accessor.count; element += 1) {
    const sourceOffset = start + element * stride;
    const targetOffset = element * elementSize;
    for (let component = 0; component < 4; component += 1) {
      const oldIndex = readInteger(
        target.bin,
        sourceOffset + component * width,
        accessor.componentType,
      );
      if (oldIndex >= skinLength)
        fail(`${label}: JOINTS value ${oldIndex} is outside skin range ${skinLength}`);
      const newIndex = mapping[oldIndex];
      writeInteger(output, targetOffset + component * width, accessor.componentType, newIndex);
      if (bounds) {
        bounds.min[component] = Math.min(bounds.min[component], newIndex);
        bounds.max[component] = Math.max(bounds.max[component], newIndex);
      }
    }
  }
  const rewritten = appendAccessor(target, output, accessor, "VEC4", accessor.componentType);
  if (bounds) {
    if (accessor.min !== undefined) target.json.accessors[rewritten].min = bounds.min;
    if (accessor.max !== undefined) target.json.accessors[rewritten].max = bounds.max;
  }
  return rewritten;
}

function copyAndReorderMatrices(target, accessorIndex, mapping, skinLength, label) {
  const { accessor, elementSize, stride, start } = accessorLayout(
    target.json,
    target.bin,
    accessorIndex,
    label,
  );
  if (
    accessor.type !== "MAT4" ||
    accessor.componentType !== 5126 ||
    accessor.count !== skinLength
  ) {
    fail(`${label}: inverse bind accessor must be ${skinLength} FLOAT MAT4 values`);
  }
  const output = Buffer.alloc(accessor.count * elementSize);
  for (let oldIndex = 0; oldIndex < skinLength; oldIndex += 1) {
    target.bin.copy(
      output,
      mapping[oldIndex] * elementSize,
      start + oldIndex * stride,
      start + oldIndex * stride + elementSize,
    );
  }
  return appendAccessor(target, output, accessor, "MAT4", 5126);
}

function targetUses(doc) {
  const uses = [];
  const meshNodes = new Set();
  for (const [nodeIndex, node] of (doc.nodes ?? []).entries()) {
    if (node.mesh === undefined) continue;
    if (node.skin !== 0) fail(`mesh-bearing node ${nodeIndex} must use canonical skin 0`);
    if (meshNodes.has(node.mesh)) fail(`mesh ${node.mesh} is shared by multiple nodes`);
    meshNodes.add(node.mesh);
    const mesh = doc.meshes?.[node.mesh];
    if (!mesh) fail(`node ${nodeIndex} references missing mesh ${node.mesh}`);
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const joints = Object.entries(primitive.attributes ?? {}).filter(
        ([semantic]) => semantic === "JOINTS_0",
      );
      if (
        Object.keys(primitive.attributes ?? {}).some((semantic) =>
          /^JOINTS_[1-9][0-9]*$/.test(semantic),
        )
      ) {
        fail(`node ${nodeIndex} primitive ${primitiveIndex}: JOINTS_1 and later are unsupported`);
      }
      if (joints.length)
        uses.push({
          nodeIndex,
          meshIndex: node.mesh,
          primitiveIndex,
          primitive,
          joints,
        });
    }
  }
  return uses;
}

function buildGlb(json, originalBin, originalByteLength, appended) {
  const bin = Buffer.concat([originalBin.subarray(0, originalByteLength), ...appended]);
  const jsonBytes = Buffer.from(JSON.stringify(json), "utf8");
  const jsonPadding = Buffer.alloc(align4(jsonBytes.length) - jsonBytes.length, 0x20);
  const binPadding = Buffer.alloc(align4(bin.length) - bin.length);
  const totalLength =
    12 + 8 + jsonBytes.length + jsonPadding.length + 8 + bin.length + binPadding.length;
  const header = Buffer.alloc(12);
  header.write(GLB_MAGIC, 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBytes.length + jsonPadding.length, 0);
  jsonHeader.write(JSON_CHUNK, 4, "ascii");
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length + binPadding.length, 0);
  binHeader.write(BIN_CHUNK, 4, "ascii");
  return Buffer.concat([header, jsonHeader, jsonBytes, jsonPadding, binHeader, bin, binPadding]);
}

async function main() {
  const [sourcePath, inputPath, outputPath] = process.argv.slice(2);
  if (!sourcePath || !inputPath || !outputPath)
    fail("usage: repair_skin_joint_order.mjs SOURCE.glb INPUT.glb OUTPUT.glb");
  const [source, target] = await Promise.all([readGlb(sourcePath), readGlb(inputPath)]);
  if (source.json.skins?.length !== 1 || target.json.skins?.length !== 1)
    fail("source and target must each have exactly one canonical skin");
  const sourceOrder = jointNames(source.json, "source");
  const targetOrder = jointNames(target.json, "target");
  if (targetOrder.length !== sourceOrder.length) fail("canonical skin joint counts differ");
  const sourceIndexByName = new Map(sourceOrder.map((name, index) => [name, index]));
  const mapping = targetOrder.map((name) => {
    const index = sourceIndexByName.get(name);
    if (index === undefined) fail(`target canonical joint ${name} is absent from source`);
    return index;
  });
  if (mapping.every((newIndex, oldIndex) => newIndex === oldIndex)) {
    await writeFile(outputPath, target.data);
    console.log(
      JSON.stringify(
        { repairedSkins: 0, repairedPrimitives: 0, identityNoOp: true, outputPath },
        null,
        2,
      ),
    );
    return;
  }
  const state = { ...target, originalByteLength: target.json.buffers[0].byteLength, appended: [] };
  const uses = targetUses(state.json);
  const skin = state.json.skins[0];
  const targetNodesByName = new Map(
    skin.joints.map((nodeIndex) => [state.json.nodes[nodeIndex].name, nodeIndex]),
  );
  if (skin.inverseBindMatrices === undefined) fail("canonical skin is missing inverseBindMatrices");
  skin.inverseBindMatrices = copyAndReorderMatrices(
    state,
    skin.inverseBindMatrices,
    mapping,
    skin.joints.length,
    "canonical skin",
  );
  skin.joints = sourceOrder.map((name) => {
    const targetNode = targetNodesByName.get(name);
    if (targetNode === undefined) fail(`target canonical joint ${name} is missing`);
    return targetNode;
  });
  for (const use of uses) {
    for (const [semantic, accessorIndex] of use.joints) {
      use.primitive.attributes[semantic] = copyAndRemapJoints(
        state,
        accessorIndex,
        mapping,
        mapping.length,
        `node ${use.nodeIndex} ${semantic}`,
      );
    }
  }
  await writeFile(
    outputPath,
    buildGlb(state.json, state.bin, state.originalByteLength, state.appended),
  );
  console.log(
    JSON.stringify(
      { repairedSkins: state.json.skins.length, repairedPrimitives: uses.length, outputPath },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});

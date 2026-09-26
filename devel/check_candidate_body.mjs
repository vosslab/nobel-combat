/**
 * Check candidate GLBs for default-scene reachability and canonical skin structure/order.
 *
 * The capture harness loads the candidate as a scene. Meshes disconnected from
 * that scene therefore produce an apparently valid file with no visible body.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const GLB_MAGIC = "glTF";
const JSON_CHUNK = "JSON";
const CANONICAL_RIG_PATH = fileURLToPath(
  new URL("../assets/models/mesh2motion_male_5.glb", import.meta.url),
);

function fail(message) {
  throw new Error(`check_candidate_body: ${message}`);
}

function nodeLabel(node, index) {
  return node?.name ? `"${node.name}" (node ${index})` : `node ${index}`;
}

function readDocument(bytes, path) {
  if (bytes.length < 20) fail(`${path}: GLB is shorter than its header and JSON chunk header`);
  if (bytes.toString("ascii", 0, 4) !== GLB_MAGIC) fail(`${path}: missing GLB magic`);
  if (bytes.readUInt32LE(4) !== 2) fail(`${path}: expected GLB version 2`);
  if (bytes.readUInt32LE(8) !== bytes.length) fail(`${path}: GLB length header mismatch`);

  let offset = 12;
  let document;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) fail(`${path}: truncated chunk header`);
    const length = bytes.readUInt32LE(offset);
    const nextOffset = offset + 8 + length;
    if (nextOffset > bytes.length) fail(`${path}: truncated GLB chunk`);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === JSON_CHUNK) {
      if (document) fail(`${path}: duplicate JSON chunk`);
      try {
        document = JSON.parse(
          bytes
            .subarray(offset + 8, nextOffset)
            .toString("utf8")
            .trimEnd(),
        );
      } catch {
        fail(`${path}: invalid JSON chunk`);
      }
    }
    offset = nextOffset;
  }
  if (!document) fail(`${path}: missing JSON chunk`);
  if (document.asset?.version !== "2.0") fail(`${path}: JSON asset must declare glTF 2.0`);
  return document;
}

function defaultSceneRoots(document, path) {
  if (!Array.isArray(document.scenes) || document.scenes.length === 0)
    fail(`${path}: missing default scene`);
  const sceneIndex = document.scene ?? 0;
  if (!Number.isInteger(sceneIndex) || !document.scenes[sceneIndex])
    fail(`${path}: default scene ${sceneIndex} does not exist`);
  const roots = document.scenes[sceneIndex].nodes ?? [];
  if (!Array.isArray(roots)) fail(`${path}: default scene nodes must be an array`);
  return roots;
}

function validNodes(document, path) {
  const nodes = document.nodes ?? [];
  if (!Array.isArray(nodes)) fail(`${path}: nodes must be an array`);
  for (const [index, node] of nodes.entries()) {
    if (!node || typeof node !== "object" || Array.isArray(node))
      fail(`${path}: node ${index} must be an object`);
  }
  return nodes;
}

function reachableNodes(nodes, roots, path) {
  const reachable = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const index = pending.pop();
    if (!Number.isInteger(index) || !nodes[index])
      fail(`${path}: scene references missing node ${index}`);
    if (reachable.has(index)) continue;
    reachable.add(index);
    const children = nodes[index].children ?? [];
    if (!Array.isArray(children))
      fail(`${path}: ${nodeLabel(nodes[index], index)} children must be an array`);
    pending.push(...children);
  }
  return reachable;
}

function jointNames(document, path) {
  const skins = document.skins ?? [];
  if (!Array.isArray(skins) || skins.length !== 1) fail(`${path}: requires exactly one skin`);
  const skin = skins[0];
  if (!skin || typeof skin !== "object" || Array.isArray(skin))
    fail(`${path}: skin 0 must be an object`);
  if (!Array.isArray(skin.joints)) fail(`${path}: skin 0 joints must be an array`);

  const nodes = validNodes(document, path);
  const jointIndexes = skin.joints;
  if (new Set(jointIndexes).size !== jointIndexes.length)
    fail(`${path}: skin 0 joints must reference unique nodes`);
  const names = jointIndexes.map((joint, index) => {
    if (!Number.isInteger(joint) || !nodes[joint])
      fail(`${path}: skin 0 joint ${index} references missing node ${joint}`);
    const name = nodes[joint].name;
    if (typeof name !== "string" || name.length === 0)
      fail(`${path}: skin 0 joint ${index} must name its node`);
    return name;
  });
  if (new Set(names).size !== names.length) fail(`${path}: skin 0 joint names must be unique`);
  return names;
}

async function canonicalJointNames() {
  const document = readDocument(await readFile(CANONICAL_RIG_PATH), CANONICAL_RIG_PATH);
  const names = jointNames(document, CANONICAL_RIG_PATH);
  if (names.length !== 66)
    fail(`${CANONICAL_RIG_PATH}: canonical Mesh2Motion rig must have exactly 66 named joints`);
  return names;
}

function meshBearingNodes(document, path) {
  const nodes = validNodes(document, path);
  const meshes = document.meshes ?? [];
  if (!Array.isArray(meshes)) fail(`${path}: meshes must be an array`);
  return nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.mesh !== undefined);
}

function checkCandidateRig(document, path, canonicalNames) {
  const candidateNames = jointNames(document, path);
  if (
    candidateNames.length !== canonicalNames.length ||
    candidateNames.some((name, index) => name !== canonicalNames[index])
  ) {
    fail(`${path}: skin 0 joint names must match the canonical Mesh2Motion rig in order`);
  }
}

function checkCandidateBody(document, canonicalNames, path = "candidate GLB") {
  const roots = defaultSceneRoots(document, path);
  const nodes = validNodes(document, path);
  const reachable = reachableNodes(nodes, roots, path);
  const meshNodes = meshBearingNodes(document, path);
  const meshes = document.meshes ?? [];
  for (const { node, index } of meshNodes) {
    if (!Number.isInteger(node.mesh) || !meshes[node.mesh])
      fail(`${path}: ${nodeLabel(node, index)} references missing mesh ${node.mesh}`);
  }
  const reachableMeshCount = meshNodes.filter(({ index }) => reachable.has(index)).length;
  if (reachableMeshCount === 0) fail(`${path}: default scene reaches zero mesh-bearing nodes`);
  for (const { node, index } of meshNodes) {
    if (!reachable.has(index))
      fail(`${path}: mesh-bearing ${nodeLabel(node, index)} is unreachable from the default scene`);
    if (node.skin !== 0) fail(`${path}: mesh-bearing ${nodeLabel(node, index)} must use skin 0`);
  }
  checkCandidateRig(document, path, canonicalNames);
}

async function checkCandidateBodyFile(path) {
  const [candidateBytes, canonicalNames] = await Promise.all([
    readFile(path),
    canonicalJointNames(),
  ]);
  checkCandidateBody(readDocument(candidateBytes, path), canonicalNames, path);
}

async function main(argumentsList) {
  if (argumentsList.length !== 1) {
    console.error("Usage: check_candidate_body.mjs <candidate.glb>");
    process.exitCode = 2;
    return;
  }
  try {
    await checkCandidateBodyFile(argumentsList[0]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) await main(process.argv.slice(2));

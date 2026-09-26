#!/usr/bin/env node
/**
 * Check that Babylon can load a locally authored candidate GLB.
 *
 * This complements check_candidate_body.mjs: it catches loader-level problems
 * such as unresolved material references before the browser capture starts.
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { NullEngine, Scene } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader.js";
import "@babylonjs/loaders/glTF/index.js";

async function checkCandidateLoad(path) {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  let assetContainer;
  try {
    const bytes = await readFile(path);
    assetContainer = await LoadAssetContainerAsync(new Uint8Array(bytes), scene, {
      name: basename(path),
      pluginExtension: ".glb",
    });
  } finally {
    assetContainer?.dispose();
    scene.dispose();
    engine.dispose();
  }
}

async function main(argumentsList) {
  if (argumentsList.length !== 1) {
    console.error("Usage: check_candidate_load.mjs <candidate.glb>");
    process.exitCode = 2;
    return;
  }
  try {
    await checkCandidateLoad(argumentsList[0]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

await main(process.argv.slice(2));

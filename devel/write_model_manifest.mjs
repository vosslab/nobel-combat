import { readFile, stat, writeFile } from "node:fs/promises";
import { ROSTER } from "../src/roster/roster.ts";

const modelsDirectory = new URL("../assets/models/", import.meta.url);
const manifestPath = new URL("../assets/models/MANIFEST.txt", import.meta.url);
const bodyPaths = [...new Set(Object.values(ROSTER).map((fighter) => fighter.body))];
const expectedManifest = `${bodyPaths.join("\n")}\n`;

async function validateRosterModels() {
  for (const bodyPath of bodyPaths) {
    if (!/^assets\/models\/[a-z0-9_]+\.glb$/.test(bodyPath)) {
      throw new Error(`Unsafe roster model path: ${bodyPath}`);
    }
    const modelPath = new URL(bodyPath.slice("assets/models/".length), modelsDirectory);
    const model = await stat(modelPath);
    if (!model.isFile() || model.size === 0) {
      throw new Error(`Roster model must exist and be non-empty: ${bodyPath}`);
    }
  }
}

async function main() {
  if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== "--check")) {
    throw new Error("Usage: node --import tsx devel/write_model_manifest.mjs [--check]");
  }

  await validateRosterModels();

  if (process.argv[2] === "--check") {
    const manifest = await readFile(manifestPath, "utf8").catch((error) => {
      if (error.code === "ENOENT") {
        throw new Error(
          "Model manifest is missing. Run: node --import tsx devel/write_model_manifest.mjs",
        );
      }
      throw error;
    });
    if (manifest !== expectedManifest) {
      throw new Error(
        "Model manifest is stale. Run: node --import tsx devel/write_model_manifest.mjs",
      );
    }
    return;
  }

  await writeFile(manifestPath, expectedManifest, "utf8");
}

await main();

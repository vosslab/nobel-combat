import { readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import { ROSTER } from "../src/roster/roster.ts";

const modelsDirectory = new URL("../assets/models/", import.meta.url);
const manifestPath = new URL("../assets/models/MANIFEST.txt", import.meta.url);
const receiptPath = new URL("../assets/portraits/capture_receipt.json", import.meta.url);
const bodyPaths = [...new Set(Object.values(ROSTER).map((fighter) => fighter.body))];
const portraitPaths = [...new Set(Object.values(ROSTER).map((fighter) => fighter.portrait))];
const expectedManifest = `${bodyPaths.join("\n")}\n`;

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function readCaptureReceipts() {
  const contents = await readFile(receiptPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") {
      throw new Error("Portrait capture receipt is missing: assets/portraits/capture_receipt.json");
    }
    throw error;
  });
  try {
    const receipt = JSON.parse(contents);
    if (!Array.isArray(receipt.receipts)) {
      throw new Error("missing receipts array");
    }
    return receipt.receipts;
  } catch (error) {
    throw new Error(`Invalid portrait capture receipt: ${error.message}`, { cause: error });
  }
}

async function validateRosterAssets() {
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

  const receipts = await readCaptureReceipts();
  for (const [fighterId, fighter] of Object.entries(ROSTER)) {
    if (!/^assets\/portraits\/[a-z0-9_]+\.png$/.test(fighter.portrait)) {
      throw new Error(`Unsafe roster portrait path for ${fighterId}: ${fighter.portrait}`);
    }
    const portraitPath = new URL(`../${fighter.portrait}`, import.meta.url);
    const portrait = await stat(portraitPath);
    if (!portrait.isFile() || portrait.size === 0) {
      throw new Error(`Roster portrait must exist and be non-empty: ${fighter.portrait}`);
    }

    const matchingReceipts = receipts.filter((receipt) => receipt.fighterId === fighterId);
    if (matchingReceipts.length !== 1) {
      throw new Error(
        `Expected one portrait capture receipt for ${fighterId}, found ${matchingReceipts.length}`,
      );
    }
    const receipt = matchingReceipts[0];
    const bodyBytes = await readFile(
      new URL(fighter.body.slice("assets/models/".length), modelsDirectory),
    );
    const portraitBytes = await readFile(portraitPath);
    const servedBody = Array.isArray(receipt.servedBodySha256)
      ? receipt.servedBodySha256.filter((entry) => entry.fighterId === fighterId)
      : [];
    if (
      receipt.body !== fighter.body ||
      receipt.bodySha256 !== sha256(bodyBytes) ||
      receipt.image !== basename(fighter.portrait) ||
      receipt.imageSha256 !== sha256(portraitBytes) ||
      servedBody.length !== 1 ||
      servedBody[0].sha256 !== receipt.bodySha256
    ) {
      throw new Error(
        `Portrait capture receipt does not bind current body and portrait for ${fighterId}`,
      );
    }
  }
}

async function main() {
  const arguments_ = process.argv.slice(2);
  if (
    arguments_.some((argument) => argument !== "--check" && argument !== "--print-portraits") ||
    new Set(arguments_).size !== arguments_.length
  ) {
    throw new Error(
      "Usage: node --import tsx devel/write_model_manifest.mjs [--check] [--print-portraits]",
    );
  }

  await validateRosterAssets();

  if (arguments_.includes("--check")) {
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
  } else {
    await writeFile(manifestPath, expectedManifest, "utf8");
  }

  if (arguments_.includes("--print-portraits")) {
    process.stdout.write(`${portraitPaths.join("\n")}\n`);
  }
}

await main();

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { ROSTER } from "../src/roster/roster.ts";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The chooser needs a readable head and hair silhouette at card scale. Keep one
// shared, front-biased frame; roster height only compensates for ground alignment.
const PORTRAIT_FRAME = { x: 1050, y: 250, width: 170, height: 170 };

function parseOptions(args) {
  const fighters = [];
  let url = "http://127.0.0.1:4173/";
  let outputDirectory = "tests/_temp/roster_work/face-portraits";
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--url" || value === "--output-dir") {
      const optionValue = args[index + 1];
      if (!optionValue) throw new Error(`Missing value for ${value}`);
      if (value === "--url") url = optionValue;
      else outputDirectory = optionValue;
      index += 1;
    } else if (value.startsWith("--")) {
      throw new Error(`Unknown option: ${value}`);
    } else {
      fighters.push(value);
    }
  }
  if (!fighters.length) {
    throw new Error(
      "Usage: node --import tsx devel/capture_fighter_portraits.mjs <fighter-id>... [--url URL] [--output-dir DIR]",
    );
  }
  for (const id of fighters) {
    if (!(id in ROSTER)) throw new Error(`Unknown roster fighter: ${id}`);
  }
  return { fighters, url, outputDirectory: resolve(REPO, outputDirectory) };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function retainedReceipts(outputDirectory, fighterIds) {
  const receiptPath = resolve(outputDirectory, "capture_receipt.json");
  try {
    const prior = JSON.parse(readFileSync(receiptPath, "utf8"));
    if (!Array.isArray(prior.receipts)) return [];
    return prior.receipts.filter((receipt) => !fighterIds.includes(receipt.fighterId));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function settle(page) {
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  mkdirSync(options.outputDirectory, { recursive: true });
  const priorReceipts = retainedReceipts(options.outputDirectory, options.fighters);
  const appUrl = new URL(options.url);
  appUrl.searchParams.set("debug", "1");
  const browser = await chromium.launch({ headless: true });
  const receipts = [];
  try {
    for (const fighterId of options.fighters) {
      const fighter = ROSTER[fighterId];
      const opponentId = fighterId === "warburg" ? "curie" : "warburg";
      const bodyIds = [fighterId, opponentId];
      const bodies = bodyIds.map((id) => {
        const fighter = ROSTER[id];
        const path = resolve(REPO, fighter.body);
        const bytes = readFileSync(path);
        return {
          id,
          path,
          body: fighter.body,
          bytes,
          sha256: sha256(bytes),
          url: new URL(fighter.body, appUrl).toString(),
          servedSha256: [],
        };
      });
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 4,
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      for (const body of bodies) {
        await page.route(
          (url) => url.toString() === body.url,
          async (route) => {
            body.servedSha256.push(sha256(body.bytes));
            await route.fulfill({ body: body.bytes, contentType: "model/gltf-binary" });
          },
        );
      }

      try {
        await page.goto(appUrl.toString());
        await page.waitForFunction(() => window.__fightDebug?.selectPlayer);
        await page.evaluate(
          ({ playerId, opponentId }) => window.__fightDebug.selectPlayer(playerId, opponentId),
          { playerId: opponentId, opponentId: fighterId },
        );
        await page.waitForFunction(
          ({ playerId, opponentId }) => {
            const snapshot = window.__fightSnapshot?.();
            return (
              snapshot?.fighters?.[0]?.id === playerId &&
              snapshot?.fighters?.[1]?.id === opponentId &&
              snapshot?.rigs?.length === 2 &&
              snapshot?.models?.filter((model) => model.enabled).length === 2
            );
          },
          { playerId: opponentId, opponentId: fighterId },
        );
        await page.evaluate(() => {
          window.__fightDebug.forceFighter(0, {
            x: -1.35,
            z: 0,
            state: "idle",
            ticks: 0,
            attackHeld: false,
            hitDone: false,
          });
          window.__fightDebug.forceFighter(1, {
            x: 1.35,
            z: 0,
            state: "idle",
            ticks: 0,
            attackHeld: false,
            hitDone: false,
          });
        });
        await settle(page);
        await page.keyboard.press("p");
        await page.waitForFunction(
          () => document.querySelector("#pause-match")?.getAttribute("aria-pressed") === "true",
        );
        await page.keyboard.down("ShiftLeft");
        await page.keyboard.down("PageUp");
        await page.waitForTimeout(650);
        await page.keyboard.up("PageUp");
        await page.keyboard.up("ShiftLeft");
        await page.keyboard.down("BracketRight");
        await page.waitForTimeout(1100);
        await page.keyboard.up("BracketRight");
        await settle(page);
        await page.waitForTimeout(200);
        const crop = {
          ...PORTRAIT_FRAME,
          y: Math.round(PORTRAIT_FRAME.y - (fighter.height - 1.65) * 200),
        };
        const image = basename(fighter.portrait);
        const imagePath = resolve(options.outputDirectory, image);
        await page.screenshot({
          path: resolve(options.outputDirectory, `${fighterId}-full.png`),
          scale: "device",
        });
        await page.screenshot({ path: imagePath, clip: crop, scale: "device" });
        if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
        for (const body of bodies) {
          if (body.servedSha256.length !== 1 || body.servedSha256[0] !== body.sha256) {
            throw new Error(`Model bytes did not match for ${body.id}`);
          }
        }
        const imageBytes = readFileSync(imagePath);
        receipts.push({
          fighterId,
          body: fighter.body,
          bodySha256: bodies[0].sha256,
          comparisonId: opponentId,
          capturePose: "paused idle; shared front-biased face-and-hair crop",
          viewport: { width: 1280, height: 800, deviceScaleFactor: 4 },
          crop,
          image,
          imageSha256: sha256(imageBytes),
          servedBodySha256: bodies.map((body) => ({
            fighterId: body.id,
            sha256: body.servedSha256[0],
          })),
        });
        console.log(JSON.stringify({ fighterId, imagePath, errors }));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(
    resolve(options.outputDirectory, "capture_receipt.json"),
    `${JSON.stringify({ url: options.url, receipts: [...priorReceipts, ...receipts] }, null, 2)}\n`,
  );
}

await main();

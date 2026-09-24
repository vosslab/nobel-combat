/// <reference types="node" />
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

const scriptsDirectory = fileURLToPath(new URL(".", import.meta.url));

async function runScenario(testInfo: TestInfo, script: string, url: string): Promise<void> {
  const output: string[] = [];
  const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [script, "--url", url], {
        cwd: scriptsDirectory,
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (chunk: Buffer) => output.push(chunk.toString()));
      child.stderr.on("data", (chunk: Buffer) => output.push(chunk.toString()));
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({ code, signal }));
    },
  );
  const transcript = output.join("");
  if (result.code !== 0) {
    await testInfo.attach(`${script} output`, { body: transcript, contentType: "text/plain" });
  }
  expect(result, transcript).toEqual({ code: 0, signal: null });
}

test.describe.configure({ mode: "serial" });

test("debug harness covers deterministic combat, camera, and endurance scenarios", async ({
  baseURL,
}, testInfo) => {
  test.setTimeout(180_000);
  await runScenario(testInfo, "agent_scenarios.mjs", baseURL!);
});

test("live browser completes six keyboard and synthetic-gamepad matches", async ({
  baseURL,
}, testInfo) => {
  test.setTimeout(660_000);
  await runScenario(testInfo, "playtest_matches.mjs", baseURL!);
});

test("live keyboard and synthetic-gamepad traversal stays responsive and visible", async ({
  baseURL,
}, testInfo) => {
  test.setTimeout(90_000);
  await runScenario(testInfo, "playtest_traversal.mjs", baseURL!);
});

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { FRANKLIN_UNLOCK_STORAGE_KEY } from "../../src/franklin_storage";

// Selector contract: #game is the arena canvas (src/index.html:11); fighter
// choice uses the radio labels created at src/index.html:71 and src/main.ts:294-323;
// the chooser dialog is src/index.html:59. __fightSnapshot is the local-only
// observability contract installed by src/playtest_probe.ts:46-63.
test.describe.configure({ mode: "serial" });

const CAPTURE_DIRECTORY = resolve("test-results/franklin-endurance-f7c");
const STATES = ["idle", "move", "light", "heavy", "block", "hit", "down", "getup"] as const;
type CombatState = (typeof STATES)[number];
type Point = { x: number; y: number; z: number };
type Fighter = {
  role: string;
  x: number;
  z: number;
  hp: number;
  wins: number;
  state: CombatState;
  ticks: number;
};
type Rig = {
  activeClip: CombatState | undefined;
  disposed: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
};
type Snapshot = {
  sampledAt: number;
  fighters: Fighter[];
  phase: "fight" | "roundOver" | "matchOver";
  round: number;
  winner: number | null;
  camera: Point;
  target: Point;
  view: { yaw: number; pitch: number; zoom: number };
  rigs: Rig[] | null;
  screen: Point[];
  screenBounds: { feet: Point; head: Point; modelTop: Point }[];
};
type Metrics = {
  samples: number;
  minDistance: number;
  maxDistance: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxCameraStep: number;
  maxCameraRawStep: number;
  maxCameraStepContext: string;
  maxYawStep: number;
  captured: Set<CombatState>;
  screen: { width: number; height: number };
};

function liveUrl(baseURL: string): string {
  const url = new URL(baseURL);
  url.searchParams.set("playtest", "1");
  return url.toString();
}

function distance(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function angleDistance(left: number, right: number): number {
  return Math.abs(Math.atan2(Math.sin(left - right), Math.cos(left - right)));
}

async function frames(page: Page, count = 4): Promise<void> {
  await page.evaluate(
    (remaining) =>
      new Promise<void>((resolve) => {
        const next = (): void => {
          if (--remaining === 0) resolve();
          else requestAnimationFrame(next);
        };
        requestAnimationFrame(next);
      }),
    count,
  );
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => Snapshot }
    ).__fightSnapshot?.();
    if (!value) throw new Error("Live production snapshot was unavailable.");
    return { ...value, sampledAt: performance.now() };
  });
}

async function seedAndChooseFranklin(page: Page, baseURL: string): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    let value = 0x0f7c0001;
    Object.defineProperty(Math, "random", {
      configurable: true,
      value: (): number => (value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0) / 2 ** 32,
    });
  });
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, wonRoles: ["warburg", "curie"] }));
  }, FRANKLIN_UNLOCK_STORAGE_KEY);
  await page.goto(liveUrl(baseURL));
  await page.waitForFunction(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => Snapshot }
    ).__fightSnapshot?.();
    return value?.rigs?.length === 2;
  });
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: /Rosalind Franklin/ })).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Choose your fighter" })).toBeHidden();
  await frames(page);
  expect((await snapshot(page)).fighters.map((fighter) => fighter.role)).toEqual([
    "franklin",
    "warburg",
  ]);
  return errors;
}

async function release(page: Page, keys: readonly string[]): Promise<void> {
  for (const key of keys) await page.keyboard.up(key);
}

async function hold(page: Page, keys: readonly string[], milliseconds: number): Promise<void> {
  for (const key of keys) await page.keyboard.down(key);
  await frames(page, Math.max(1, Math.round(milliseconds / 16.67)));
  await release(page, keys);
  await frames(page);
}

async function holdAndSample(
  page: Page,
  keys: readonly string[],
  milliseconds: number,
  metrics: Metrics,
  previous: Snapshot | null,
): Promise<Snapshot> {
  for (const key of keys) await page.keyboard.down(key);
  const deadline = Date.now() + milliseconds;
  let current = previous;
  while (Date.now() < deadline) {
    current = await record(page, metrics, current);
    await frames(page, 3);
  }
  await release(page, keys);
  await frames(page);
  return record(page, metrics, current);
}

function assertSnapshot(
  value: Snapshot,
  label: string,
  screen: { width: number; height: number },
): void {
  expect(value.fighters).toHaveLength(2);
  expect(value.rigs).toHaveLength(2);
  expect(["fight", "roundOver", "matchOver"]).toContain(value.phase);
  expect(Number.isInteger(value.round)).toBe(true);
  expect(value.round).toBeGreaterThanOrEqual(1);
  expect(value.round).toBeLessThanOrEqual(3);
  expect(value.fighters.map((fighter) => fighter.role)).toEqual(["franklin", "warburg"]);
  for (const fighter of value.fighters) {
    expect(Number.isFinite(fighter.x), `${label}: nonfinite fighter x`).toBe(true);
    expect(Number.isFinite(fighter.z), `${label}: nonfinite fighter z`).toBe(true);
    expect(fighter.x).toBeGreaterThanOrEqual(-9);
    expect(fighter.x).toBeLessThanOrEqual(9);
    expect(fighter.z).toBeGreaterThanOrEqual(-6);
    expect(fighter.z).toBeLessThanOrEqual(6);
    expect(fighter.hp).toBeGreaterThanOrEqual(0);
    expect(fighter.hp).toBeLessThanOrEqual(100);
    expect(Number.isInteger(fighter.wins), `${label}: noninteger fighter wins`).toBe(true);
    expect(fighter.wins).toBeGreaterThanOrEqual(0);
    expect(fighter.wins).toBeLessThanOrEqual(2);
    expect(STATES).toContain(fighter.state);
  }
  if (value.phase === "matchOver") {
    const winner = value.fighters[value.winner ?? -1];
    expect(winner, `${label}: match-over has no winner`).toBeTruthy();
    expect(winner!.wins, `${label}: match-over winner lacks two wins`).toBeGreaterThanOrEqual(2);
  }
  for (const [index, rig] of (value.rigs ?? []).entries()) {
    const fighter = value.fighters[index];
    expect(rig.disposed, `${label}: disposed rig ${index}`).toBe(false);
    expect(rig.activeClip, `${label}: clip drift for rig ${index}`).toBe(fighter?.state);
    expect(distance(rig, { x: fighter?.x ?? NaN, y: 0, z: fighter?.z ?? NaN })).toBeLessThan(0.03);
  }
  const projectedPoints = value.screen.flatMap((screen, index) => [
    { kind: "center", fighter: index, point: screen },
    { kind: "feet", fighter: index, point: value.screenBounds[index]?.feet },
    { kind: "head", fighter: index, point: value.screenBounds[index]?.head },
    { kind: "model top", fighter: index, point: value.screenBounds[index]?.modelTop },
  ]);
  for (const { kind, fighter, point } of projectedPoints) {
    expect(point, `${label}: missing projected fighter point`).toBeTruthy();
    expect(
      [point?.x, point?.y, point?.z].every(Number.isFinite),
      `${label}: nonfinite projection`,
    ).toBe(true);
    expect(point!.x).toBeGreaterThanOrEqual(8);
    expect(point!.x).toBeLessThanOrEqual(screen.width - 8);
    const projectionContext = `${label}: ${kind} of fighter ${fighter}; point=${JSON.stringify(point)} screen=${JSON.stringify(screen)} fighters=${JSON.stringify(value.fighters.map(({ x, z, state }) => ({ x, z, state })))} camera=${JSON.stringify(value.camera)} target=${JSON.stringify(value.target)} view=${JSON.stringify(value.view)}`;
    expect(point!.y, projectionContext).toBeGreaterThanOrEqual(8);
    expect(point!.y, projectionContext).toBeLessThanOrEqual(screen.height - 8);
    expect(point!.z).toBeGreaterThanOrEqual(-0.01);
    expect(point!.z).toBeLessThanOrEqual(1.01);
  }
  expect(value.view.pitch).toBeGreaterThanOrEqual(0.3);
  expect(value.view.pitch).toBeLessThanOrEqual(0.85);
  expect(value.view.zoom).toBeGreaterThanOrEqual(0.85);
  expect(value.view.zoom).toBeLessThanOrEqual(1.5);
}

function recordCameraStep(
  metrics: Metrics,
  previous: Snapshot | null,
  current: Snapshot,
  context: string,
): void {
  if (!previous) return;
  const rawStep = distance(current.camera, previous.camera);
  const elapsedMs = Math.max(1, current.sampledAt - previous.sampledAt);
  const renderedFrames = Math.max(1, elapsedMs / (1000 / 60));
  const step = rawStep / renderedFrames;
  if (step > metrics.maxCameraStep) {
    metrics.maxCameraStep = step;
    metrics.maxCameraRawStep = rawStep;
    metrics.maxCameraStepContext = `${context}; raw=${rawStep.toFixed(4)} elapsedMs=${elapsedMs.toFixed(2)} frames=${renderedFrames.toFixed(2)} from=${JSON.stringify(previous.camera)} to=${JSON.stringify(current.camera)}`;
  }
  metrics.maxYawStep = Math.max(
    metrics.maxYawStep,
    angleDistance(current.view.yaw, previous.view.yaw) / renderedFrames,
  );
}

async function record(page: Page, metrics: Metrics, previous: Snapshot | null): Promise<Snapshot> {
  const value = await snapshot(page);
  assertSnapshot(value, `sample ${metrics.samples}`, metrics.screen);
  const [player, opponent] = value.fighters;
  metrics.samples++;
  metrics.minDistance = Math.min(
    metrics.minDistance,
    Math.hypot(player!.x - opponent!.x, player!.z - opponent!.z),
  );
  metrics.maxDistance = Math.max(
    metrics.maxDistance,
    Math.hypot(player!.x - opponent!.x, player!.z - opponent!.z),
  );
  metrics.minX = Math.min(metrics.minX, player!.x);
  metrics.maxX = Math.max(metrics.maxX, player!.x);
  metrics.minZ = Math.min(metrics.minZ, player!.z);
  metrics.maxZ = Math.max(metrics.maxZ, player!.z);
  recordCameraStep(metrics, previous, value, `live sample ${metrics.samples}`);
  for (const state of STATES) {
    if (!metrics.captured.has(state) && value.fighters.some((fighter) => fighter.state === state)) {
      await page.screenshot({ path: resolve(CAPTURE_DIRECTORY, `${state}.png`) });
      metrics.captured.add(state);
    }
  }
  return value;
}

async function sampleFor(
  page: Page,
  metrics: Metrics,
  milliseconds: number,
  previous: Snapshot | null,
): Promise<Snapshot> {
  const deadline = Date.now() + milliseconds;
  let current = previous;
  while (Date.now() < deadline) {
    current = await record(page, metrics, current);
    await frames(page, 3);
  }
  return current ?? record(page, metrics, null);
}

async function closeDistance(
  page: Page,
  metrics: Metrics,
  previous: Snapshot | null,
): Promise<Snapshot> {
  let current = previous;
  for (let attempt = 0; attempt < 24; attempt++) {
    current = await record(page, metrics, current);
    const [player, opponent] = current.fighters;
    if (Math.hypot(player!.x - opponent!.x, player!.z - opponent!.z) < 1.7) return current;
    await hold(
      page,
      [opponent!.x > player!.x ? "KeyD" : "KeyA", opponent!.z > player!.z ? "KeyS" : "KeyW"],
      120,
    );
  }
  throw new Error("Production controls did not close fighters into attack range.");
}

async function circleAroundOpponent(
  page: Page,
  metrics: Metrics,
  previous: Snapshot,
  clockwise: boolean,
): Promise<Snapshot> {
  const path = clockwise
    ? [["KeyW"], ["KeyD"], ["KeyS"], ["KeyA"]]
    : [["KeyS"], ["KeyD"], ["KeyW"], ["KeyA"]];
  let current = previous;
  for (const keys of path) {
    await hold(page, keys, 340);
    current = await sampleFor(page, metrics, 110, current);
  }
  return current;
}

async function blockIncomingAttack(
  page: Page,
  metrics: Metrics,
  previous: Snapshot,
): Promise<Snapshot> {
  const initialHealth = previous.fighters[0]?.hp;
  if (initialHealth === undefined)
    throw new Error("Franklin was unavailable for block validation.");
  await page.keyboard.down("KeyL");
  try {
    const deadline = Date.now() + 8_000;
    let current = previous;
    while (Date.now() < deadline) {
      current = await record(page, metrics, current);
      const player = current.fighters[0];
      if (player?.state === "block" && player.hp < initialHealth) return current;
      await frames(page, 3);
    }
    throw new Error("Warburg did not land a live attack into Franklin's held block.");
  } finally {
    await page.keyboard.up("KeyL");
  }
}

async function restartLiveMatch(
  page: Page,
  metrics: Metrics,
  previous: Snapshot | null,
): Promise<Snapshot> {
  await page.keyboard.down("KeyR");
  await frames(page);
  await page.keyboard.up("KeyR");
  const current = await sampleFor(page, metrics, 160, previous);
  expect(current).toMatchObject({ phase: "fight", round: 1, winner: null });
  expect(current.fighters.map((fighter) => ({ hp: fighter.hp, wins: fighter.wins }))).toEqual([
    { hp: 100, wins: 0 },
    { hp: 100, wins: 0 },
  ]);
  return current;
}

async function refreshScreenBounds(page: Page, metrics: Metrics): Promise<void> {
  const viewport = page.viewportSize();
  const canvasBox = await page.locator("#game").boundingBox();
  if (!viewport || !canvasBox) throw new Error("Viewport or game canvas bounds were unavailable.");
  metrics.screen = {
    width: Math.min(viewport.width, Math.round(canvasBox.width)),
    height: Math.min(viewport.height, Math.round(canvasBox.height)),
  };
}

async function setViewportAndRefresh(
  page: Page,
  metrics: Metrics,
  size: { width: number; height: number },
): Promise<Snapshot> {
  await page.setViewportSize(size);
  // Babylon receives window resize asynchronously; wait for rendered frames so
  // playtest projections use the resized engine dimensions as well as CSS.
  let previous = await snapshot(page);
  for (let frame = 1; frame <= 4; frame++) {
    await frames(page, 1);
    const current = await snapshot(page);
    recordCameraStep(
      metrics,
      previous,
      current,
      `viewport ${size.width}x${size.height} frame ${frame}`,
    );
    previous = current;
  }
  await refreshScreenBounds(page, metrics);
  // The preceding snapshot belongs to the old viewport basis. Begin the next
  // live movement sample from this settled frame rather than measuring a
  // multi-frame intentional reframe as one continuity step.
  return record(page, metrics, null);
}

async function maxSeparationViewportTrial(
  sourcePage: Page,
  baseURL: string,
  metrics: Metrics,
  size: { width: number; height: number },
  errors: string[],
): Promise<void> {
  const page = await sourcePage.context().newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize(size);
  const url = new URL(baseURL);
  url.searchParams.set("debug", "1");
  await page.goto(url.toString());
  await page.waitForFunction(() => {
    const value = (
      window as typeof window & { __fightSnapshot?: () => Snapshot }
    ).__fightSnapshot?.();
    return value?.rigs?.length === 2;
  });
  await page.evaluate(() => {
    const debug = (
      window as typeof window & {
        __fightDebug?: {
          forceFighter(index: 0 | 1, patch: Record<string, unknown>): unknown;
          forceMatch(patch: Record<string, unknown>): unknown;
        };
      }
    ).__fightDebug;
    if (!debug) throw new Error("Deterministic camera fixture was unavailable.");
    debug.forceFighter(0, {
      role: "franklin",
      x: -3.375,
      z: 0,
      hp: 100,
      wins: 0,
      state: "idle",
      ticks: 0,
    });
    debug.forceFighter(1, {
      role: "warburg",
      x: 3.375,
      z: 0,
      hp: 100,
      wins: 0,
      state: "idle",
      ticks: 0,
    });
    debug.forceMatch({ phase: "fight", round: 1, winner: null, phaseTicks: 0 });
  });
  await frames(page);
  await refreshScreenBounds(page, metrics);
  const current = await record(page, metrics, null);
  const [player, opponent] = current.fighters;
  expect(
    Math.hypot(player!.x - opponent!.x, player!.z - opponent!.z),
    `debug camera fixture at ${size.width}x${size.height}`,
  ).toBeGreaterThanOrEqual(6.75);
  await page.close();
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return (): number => (value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0) / 2 ** 32;
}

test("Franklin production path remains visible, synchronized, and stable through live traversal, combat, and endurance", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(150_000);
  mkdirSync(CAPTURE_DIRECTORY, { recursive: true });
  const errors = await seedAndChooseFranklin(page, baseURL!);
  const metrics: Metrics = {
    samples: 0,
    minDistance: Infinity,
    maxDistance: 0,
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
    maxCameraStep: 0,
    maxCameraRawStep: 0,
    maxCameraStepContext: "none",
    maxYawStep: 0,
    captured: new Set<CombatState>(),
    screen: { width: 0, height: 0 },
  };
  await refreshScreenBounds(page, metrics);
  const initial = await record(page, metrics, null);
  for (const [index, bounds] of initial.screenBounds.entries()) {
    const projectedHeight = (bounds.feet.y - bounds.modelTop.y) / metrics.screen.height;
    expect(
      projectedHeight,
      `initial camera: fighter ${index} projected height ${projectedHeight.toFixed(3)} is too small`,
    ).toBeGreaterThanOrEqual(0.27);
  }
  let previous: Snapshot | null;

  // Keep the pair at the same known separation in both viewport fixtures.
  // Live keyboard traversal and maximum distance remain covered below and by
  // the deterministic combat/camera scenarios.
  const cameraErrors: string[] = [];
  await maxSeparationViewportTrial(
    page,
    baseURL!,
    metrics,
    {
      width: 1400,
      height: 700,
    },
    cameraErrors,
  );
  await maxSeparationViewportTrial(
    page,
    baseURL!,
    metrics,
    {
      width: 700,
      height: 1000,
    },
    cameraErrors,
  );
  expect(cameraErrors).toEqual([]);
  previous = await setViewportAndRefresh(page, metrics, { width: 1280, height: 720 });
  // Continue to the bounded arena edge before crossing its full width/depth.
  previous = await holdAndSample(page, ["KeyA", "KeyW"], 1_500, metrics, previous);
  previous = await holdAndSample(page, ["KeyD", "KeyS"], 4_800, metrics, previous);
  previous = await sampleFor(page, metrics, 700, previous);

  // Both directions execute a four-segment circle around the opponent.
  previous = await circleAroundOpponent(page, metrics, previous, true);
  previous = await circleAroundOpponent(page, metrics, previous, false);

  // Exercise the free view while the pair keeps their authoritative positions.
  previous = await holdAndSample(page, ["KeyE"], 500, metrics, previous);
  previous = await sampleFor(page, metrics, 250, previous);
  const canvas = page.locator("#game");
  await canvas.hover();
  await page.mouse.wheel(0, 240);
  previous = await sampleFor(page, metrics, 180, previous);
  previous = await holdAndSample(page, ["PageDown"], 900, metrics, previous);
  expect(previous.view.pitch).toBeCloseTo(0.3, 2);
  previous = await holdAndSample(page, ["PageUp"], 900, metrics, previous);
  expect(previous.view.pitch).toBeCloseTo(0.85, 2);
  previous = await holdAndSample(page, ["BracketRight"], 900, metrics, previous);
  expect(previous.view.zoom).toBeCloseTo(0.85, 2);
  previous = await holdAndSample(page, ["BracketLeft"], 900, metrics, previous);
  expect(previous.view.zoom).toBeCloseTo(1.5, 2);

  // Start the combat matrix from a clean live round, after traversal has
  // already supplied the arena/camera evidence.
  previous = await restartLiveMatch(page, metrics, previous);
  previous = await closeDistance(page, metrics, previous);
  previous = await blockIncomingAttack(page, metrics, previous);
  // Leave the live block response intact, then restart before another AI
  // exchange. Deterministic fixtures cover knockdown and get-up state mapping.
  previous = await restartLiveMatch(page, metrics, previous);

  // Seeded randomized rapid inputs include opposing directions and a neutral
  // tail. Every interval checks state, camera, screen, and rig invariants.
  const random = seededRandom(0x0f7c0002);
  for (let step = 0; step < 180; step++) {
    const keys: string[] = [];
    if (random() > 0.45) keys.push("KeyA");
    if (random() > 0.45) keys.push("KeyD");
    if (random() > 0.45) keys.push("KeyW");
    if (random() > 0.45) keys.push("KeyS");
    if (random() > 0.88) keys.push("KeyJ");
    if (random() > 0.94) keys.push("KeyK");
    if (random() > 0.86) keys.push("KeyL");
    await hold(page, keys, 55);
    previous = await record(page, metrics, previous);
    if (previous.phase === "matchOver") {
      await hold(page, ["KeyR"], 80);
      previous = await record(page, metrics, previous);
    }
  }
  await release(page, [
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS",
    "KeyJ",
    "KeyK",
    "KeyL",
    "KeyQ",
    "KeyE",
    "KeyR",
  ]);
  await sampleFor(page, metrics, 10_000, previous);

  expect([...metrics.captured]).toEqual(expect.arrayContaining(["idle", "move", "block"]));
  expect(metrics.minDistance).toBeLessThan(1.8);
  expect(metrics.maxDistance).toBeGreaterThanOrEqual(6);
  expect(metrics.minX).toBeLessThan(-2);
  expect(metrics.maxX).toBeGreaterThan(0);
  expect(metrics.minZ).toBeLessThan(-2);
  expect(metrics.maxZ).toBeGreaterThan(2);
  expect(metrics.maxX - metrics.minX).toBeGreaterThan(8);
  expect(metrics.maxZ - metrics.minZ).toBeGreaterThan(5);
  expect(metrics.maxCameraStep, metrics.maxCameraStepContext).toBeLessThan(2.5);
  expect(metrics.maxYawStep).toBeLessThan(0.25);
  expect(metrics.samples).toBeGreaterThan(250);
  expect(errors).toEqual([]);
});

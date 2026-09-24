import { chromium } from "playwright";

function readOption(name, fallback) {
  const position = process.argv.indexOf(name);
  if (position < 0) return fallback;
  const value = process.argv[position + 1];
  if (!value) throw new Error(`Missing value for ${name}`);
  return value;
}

function positionalArguments() {
  const optionsWithValues = new Set(["--url", "--device", "--winner"]);
  return process.argv.slice(2).filter((argument, index, arguments_) => {
    if (optionsWithValues.has(argument) || optionsWithValues.has(arguments_[index - 1]))
      return false;
    return !argument.startsWith("--");
  });
}

function liveUrl() {
  const url = new URL(readOption("--url", "http://127.0.0.1:4173/"));
  url.searchParams.set("playtest", "1");
  return url.toString();
}

const positional = positionalArguments();
const selectedDevice = readOption("--device", positional[0] ?? null);
const selectedWinner = readOption("--winner", positional[1] ?? null);

const browser = await chromium.launch({ headless: true });
const results = [];
const observed = new Set();
let failures = 0;
async function snapshot(page) {
  return page.evaluate(() => window.__fightSnapshot?.());
}
async function setInput(page, device, action) {
  if (device === "gamepad") {
    await page.evaluate((a) => {
      window.__testPad.axes = [a.x, a.z];
      window.__testPad.buttons[0].pressed = a.light;
      window.__testPad.buttons[1].pressed = a.heavy;
      window.__testPad.buttons[5].pressed = a.block;
    }, action);
  } else {
    for (const [code, on] of Object.entries({
      KeyA: action.x < -0.2,
      KeyD: action.x > 0.2,
      KeyW: action.z < -0.2,
      KeyS: action.z > 0.2,
      KeyJ: action.light,
      KeyK: action.heavy,
      KeyL: action.block,
    })) {
      if (on) await page.keyboard.down(code);
      else await page.keyboard.up(code);
    }
  }
}
async function run(device, desired) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  if (device === "gamepad")
    await page.addInitScript(() => {
      window.__testPad = {
        id: "Standard Gamepad",
        index: 0,
        mapping: "standard",
        connected: true,
        timestamp: 0,
        axes: [0, 0],
        buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0, touched: false })),
      };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__testPad] });
    });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(liveUrl());
  let s;
  for (let i = 0; i < 40; i++) {
    s = await snapshot(page);
    if (s?.rigs?.length === 2) break;
    await page.waitForTimeout(100);
  }
  if (!s?.rigs || s.rigs.length !== 2)
    throw new Error("Two visible fighter rigs did not load: " + errors.join(" | "));
  const begun = Date.now();
  let lastAttack = 0;
  let maxDistance = 0;
  let minDistance = 100;
  let crossed = false;
  let rounds = new Set();
  while (Date.now() - begun < 90000) {
    s = await snapshot(page);
    const [red, blue] = s.fighters;
    const distance = Math.hypot(red.x - blue.x, red.z - blue.z);
    minDistance = Math.min(minDistance, distance);
    maxDistance = Math.max(maxDistance, distance);
    if (red.x > blue.x) crossed = true;
    observed.add(red.state);
    observed.add(blue.state);
    rounds.add(s.round);
    if (s.phase === "matchOver") break;
    const action = { x: 0, z: 0, light: false, heavy: false, block: false };
    if (desired === "red" && s.phase === "fight") {
      if (distance > 1.7) {
        action.x = Math.sign(blue.x - red.x);
        action.z = Math.sign(blue.z - red.z);
      }
      if (
        (blue.state === "light" || blue.state === "heavy") &&
        ["idle", "move", "block"].includes(red.state)
      )
        action.block = true;
      else if (
        distance < 2.15 &&
        ["idle", "move", "block"].includes(red.state) &&
        Date.now() - lastAttack > 460
      ) {
        action.heavy = true;
        lastAttack = Date.now();
      }
    }
    await setInput(page, device, action);
    await page.waitForTimeout(70);
  }
  await setInput(page, device, { x: 0, z: 0, light: false, heavy: false, block: false });
  if (device === "gamepad") {
    await page.evaluate(() => (window.__testPad.buttons[9].pressed = true));
    await page.waitForTimeout(120);
    await page.evaluate(() => (window.__testPad.buttons[9].pressed = false));
  } else {
    await page.keyboard.down("r");
    await page.waitForTimeout(120);
    await page.keyboard.up("r");
  }
  const restarted = await snapshot(page);
  const result = {
    device,
    desired,
    winner: s.winner,
    phase: s.phase,
    round: s.round,
    redHp: s.fighters[0].hp,
    blueHp: s.fighters[1].hp,
    seconds: Math.round((Date.now() - begun) / 1000),
    minDistance: +minDistance.toFixed(2),
    maxDistance: +maxDistance.toFixed(2),
    crossed,
    states: [...observed],
    rounds: [...rounds],
    restarted: {
      phase: restarted.phase,
      round: restarted.round,
      hp: restarted.fighters.map((f) => f.hp),
      wins: restarted.fighters.map((f) => f.wins),
    },
    errors,
  };
  results.push(result);
  console.log(JSON.stringify(result));
  if (
    s.phase !== "matchOver" ||
    s.winner !== (desired === "red" ? 0 : 1) ||
    restarted.phase !== "fight" ||
    restarted.round !== 1 ||
    restarted.fighters.some((f) => f.hp !== 100 || f.wins !== 0) ||
    errors.length
  )
    failures++;
  await page.close();
}
try {
  for (const device of selectedDevice ? [selectedDevice] : ["keyboard", "gamepad"])
    for (const desired of selectedWinner ? [selectedWinner] : ["blue", "red", "red"])
      await run(device, desired);
} finally {
  await browser.close();
}
console.log(JSON.stringify({ failures, observed: [...observed], results: results.length }));
if (failures) process.exitCode = 1;

import { chromium } from "playwright";

function readOption(name, fallback) {
  const position = process.argv.indexOf(name);
  if (position < 0) return fallback;
  const value = process.argv[position + 1];
  if (!value) throw new Error(`Missing value for ${name}`);
  return value;
}

function liveUrl() {
  const url = new URL(readOption("--url", "http://127.0.0.1:4173/"));
  url.searchParams.set("playtest", "1");
  return url.toString();
}

const browser = await chromium.launch({ headless: true });
const results = [];
async function control(page, device, x, z, action = "") {
  if (device === "gamepad") {
    await page.evaluate(
      ({ x, z, action }) => {
        const p = window.__testPad;
        p.axes = [x, z];
        for (const b of p.buttons) b.pressed = false;
        if (action === "light") p.buttons[0].pressed = true;
        if (action === "heavy") p.buttons[1].pressed = true;
        if (action === "block") p.buttons[5].pressed = true;
        if (action === "restart") p.buttons[9].pressed = true;
      },
      { x, z, action },
    );
  } else {
    const map = {
      KeyA: x < 0,
      KeyD: x > 0,
      KeyW: z < 0,
      KeyS: z > 0,
      KeyJ: action === "light",
      KeyK: action === "heavy",
      KeyL: action === "block",
      KeyR: action === "restart",
    };
    for (const [key, down] of Object.entries(map)) {
      if (down) await page.keyboard.down(key);
      else await page.keyboard.up(key);
    }
  }
}
async function waitForNeutralFrame(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
async function confirmFighter(page, device) {
  await page.waitForSelector("#start-match");
  await page.waitForFunction(() => document.querySelector("#select-warburg")?.checked === true);
  if (device === "keyboard") {
    await page.keyboard.press("Enter");
  } else {
    await page.evaluate(() => (window.__testPad.buttons[9].pressed = true));
    await page.waitForFunction(() => !document.querySelector("#fighter-select")?.open);
    await page.evaluate(() => (window.__testPad.buttons[9].pressed = false));
  }
  await page.waitForFunction(
    () =>
      window
        .__fightSnapshot?.()
        .fighters.map((fighter) => fighter.role)
        .join(",") === "warburg,curie",
  );
  await waitForNeutralFrame(page);
}
async function run(device) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => {
    let value = 0x0f7c0001;
    Object.defineProperty(Math, "random", {
      configurable: true,
      value: () => (value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0) / 2 ** 32,
    });
  });
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
  await confirmFighter(page, device);
  await page.waitForFunction(() => window.__fightSnapshot?.().rigs?.length === 2);
  const observed = new Set();
  let min = 100,
    max = 0,
    crossed = false,
    edges = false,
    camJump = 0,
    offscreen = 0,
    previous;
  async function sample(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const s = await page.evaluate(() => window.__fightSnapshot());
      const [red, blue] = s.fighters;
      const d = Math.hypot(red.x - blue.x, red.z - blue.z);
      min = Math.min(min, d);
      max = Math.max(max, d);
      crossed ||= red.x > blue.x;
      edges ||= Math.abs(red.x) > 8.8 || Math.abs(red.z) > 5.8;
      observed.add(red.state);
      observed.add(blue.state);
      if (s.screen.some((p) => p.x < 0 || p.x > 1280 || p.y < 0 || p.y > 800 || p.z < 0 || p.z > 1))
        offscreen++;
      if (previous)
        camJump = Math.max(
          camJump,
          Math.hypot(s.camera.x - previous.x, s.camera.y - previous.y, s.camera.z - previous.z),
        );
      previous = s.camera;
      await page.waitForTimeout(70);
    }
  }
  await control(page, device, -1, -1);
  await sample(2800);
  await control(page, device, 1, 1);
  await sample(5000);
  await control(page, device, 0, 0);
  await sample(200);
  await control(page, device, 0, 0, "restart");
  await sample(150);
  await control(page, device, 0, 0);
  let s = await page.evaluate(() => window.__fightSnapshot());
  const restart = {
    phase: s.phase,
    round: s.round,
    hp: s.fighters.map((f) => f.hp),
    wins: s.fighters.map((f) => f.wins),
    roles: s.fighters.map((f) => f.role),
  };
  const beforeDirectional = s.fighters[0].x;
  if (device === "gamepad") {
    await page.evaluate(() => (window.__testPad.buttons[15].pressed = true));
  } else {
    await page.keyboard.down("ArrowRight");
  }
  await sample(200);
  if (device === "gamepad") {
    await page.evaluate(() => (window.__testPad.buttons[15].pressed = false));
  } else {
    await page.keyboard.up("ArrowRight");
  }
  const afterDirectional = (await page.evaluate(() => window.__fightSnapshot())).fighters[0].x;

  // The traversal portion can leave either fighter in a long hit reaction.
  // Start the live attack probe from a fresh, observable match state instead
  // of assuming eight short taps will land during the AI's next opening.
  await control(page, device, 0, 0, "restart");
  await page.waitForFunction(() => {
    const s = window.__fightSnapshot?.();
    return s?.phase === "fight" && s.round === 1 && s.fighters.every((f) => f.hp === 100);
  });
  await control(page, device, 0, 0);

  let lightHit = false;
  for (let attempt = 0; attempt < 45 && !lightHit; attempt++) {
    s = await page.evaluate(() => window.__fightSnapshot());
    const [red, blue] = s.fighters;
    const distance = Math.hypot(red.x - blue.x, red.z - blue.z);
    if (
      s.phase !== "fight" ||
      red.state === "down" ||
      red.state === "getup" ||
      blue.state === "down"
    ) {
      await control(page, device, 0, 0, "restart");
      await page.waitForFunction(() => {
        const current = window.__fightSnapshot?.();
        return (
          current?.phase === "fight" &&
          current.round === 1 &&
          current.fighters.every((f) => f.hp === 100)
        );
      });
      await control(page, device, 0, 0);
    } else if (distance > 1.65) {
      await control(page, device, Math.sign(blue.x - red.x), Math.sign(blue.z - red.z));
      await page.waitForTimeout(70);
    } else {
      await control(page, device, 0, 0);
      await page.waitForTimeout(70);
      const ready = await page.evaluate(() => {
        const current = window.__fightSnapshot();
        return ["idle", "move", "block"].includes(current.fighters[0].state);
      });
      if (!ready) continue;
      const hpBefore = (await page.evaluate(() => window.__fightSnapshot())).fighters[1].hp;
      await control(page, device, 0, 0, "light");
      let attackStarted = false;
      try {
        await page.waitForFunction(
          () => window.__fightSnapshot?.().fighters[0].state === "light",
          undefined,
          { timeout: 1000 },
        );
        attackStarted = true;
      } catch {
        // Retry from the next observable opening; this can happen when the AI
        // knocks the player down between the readiness sample and input tick.
      }
      await control(page, device, 0, 0);
      if (attackStarted) {
        try {
          await page.waitForFunction(
            (previousHp) => window.__fightSnapshot?.().fighters[1].hp < previousHp,
            hpBefore,
            { timeout: 1200 },
          );
          lightHit = true;
        } catch {
          // A blocked or out-of-range swing is still retried after recovery.
        }
      }
    }
  }
  // Isolate block observation from damage carried over from the traversal and
  // attack probes. Begin the held-block sample from a fresh round so the live
  // fighter can enter block before the AI's approach connects.
  await control(page, device, 0, 0, "restart");
  await sample(150);
  await control(page, device, 0, 0);
  await control(page, device, 0, 0, "block");
  await sample(1200);
  await control(page, device, 0, 0);
  const result = {
    device,
    min: +min.toFixed(2),
    max: +max.toFixed(2),
    crossed,
    edges,
    camJump: +camJump.toFixed(2),
    offscreen,
    observed: [...observed],
    directionalMove: +(afterDirectional - beforeDirectional).toFixed(2),
    lightHit,
    restart,
    errors,
  };
  results.push(result);
  console.log(JSON.stringify(result));
  await page.close();
}
try {
  for (const device of ["keyboard", "gamepad"]) await run(device);
} finally {
  await browser.close();
}
if (
  results.some(
    (r) =>
      !r.crossed ||
      !r.edges ||
      r.offscreen !== 0 ||
      r.directionalMove <= 0 ||
      !r.lightHit ||
      !r.observed.includes("block") ||
      r.errors.length ||
      r.restart.round !== 1 ||
      r.restart.hp.some((h) => h !== 100) ||
      r.restart.roles.join(",") !== "warburg,curie",
  )
)
  process.exitCode = 1;

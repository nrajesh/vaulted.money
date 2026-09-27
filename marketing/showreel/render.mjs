#!/usr/bin/env node
/**
 * Renders the showreel composition (index.html) to an MP4, frame by frame.
 *
 * Zero npm dependencies: it drives headless Chromium over the Chrome DevTools
 * Protocol using Node's built-in WebSocket, and pipes screenshots into ffmpeg.
 *
 * Every frame is rendered deterministically: the page exposes
 * `window.__render(seconds)`, which poses the whole scene for that instant.
 * Nothing runs on the wall clock, so the output is identical on every run.
 *
 * Motion blur is real temporal supersampling: each output frame is the
 * average of `--blur` sub-frames (8 by default) spread across a 180° shutter.
 *
 * Usage:
 *   node marketing/showreel/render.mjs                 # full 1080p60 render
 *   node marketing/showreel/render.mjs --draft         # 540p30, no blur
 *   node marketing/showreel/render.mjs --stills 0.5,2  # PNG stills to out/
 *
 * Environment:
 *   CHROME_PATH  Chromium/Chrome binary (defaults to the Playwright install)
 *   FFMPEG_PATH  ffmpeg with libx264 + aac (defaults to `ffmpeg` on PATH)
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION, WIDTH, HEIGHT } from "./timeline.mjs";
import { renderSoundtrack } from "./soundtrack.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(ROOT, "out");

// ── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] !== undefined
    ? args[index + 1]
    : fallback;
};

const draft = flag("draft");
const fps = Number(option("fps", draft ? 30 : 60));
const blurSamples = Math.max(1, Number(option("blur", draft ? 1 : 8)));
const scale = Number(option("scale", draft ? 0.5 : 1));
const workers = Math.max(1, Number(option("workers", 3)));
const fromSeconds = Number(option("from", 0));
const toSeconds = Math.min(DURATION, Number(option("to", DURATION)));
const stills = option("stills", "").split(",").filter(Boolean).map(Number);
const outputFile = option(
  "out",
  join(
    OUT_DIR,
    draft ? "vaulted-money-showreel-draft.mp4" : "vaulted-money-showreel.mp4",
  ),
);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const chromePath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

// ── Fonts ───────────────────────────────────────────────────────────────────
// Headless Chromium may not reach Google Fonts (e.g. behind a proxy), so the
// Latin subsets are downloaded once into out/fonts and served locally.
const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400..900" +
  "&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400..600&display=block";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export async function ensureFonts() {
  const cssPath = join(OUT_DIR, "fonts.css");
  if (existsSync(cssPath)) return;
  console.log("• Downloading fonts (one-off)");
  mkdirSync(join(OUT_DIR, "fonts"), { recursive: true });
  const css = await (
    await fetch(FONT_CSS_URL, { headers: { "user-agent": BROWSER_USER_AGENT } })
  ).text();
  const blocks = [
    ...css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]+\})/g),
  ]
    .filter(([, subset]) => subset === "latin" || subset === "latin-ext")
    .map(([, , block]) => block);
  const localBlocks = [];
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+)\)/)[1];
    const fileName = url.split("/").pop();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Font download failed: ${url}`);
    writeFileSync(
      join(OUT_DIR, "fonts", fileName),
      Buffer.from(await response.arrayBuffer()),
    );
    localBlocks.push(block.replace(url, `fonts/${fileName}`));
  }
  if (!localBlocks.length)
    throw new Error("No font faces found in the Google Fonts response");
  writeFileSync(cssPath, localBlocks.join("\n"));
}

// ── Static file server (ES modules cannot load from file://) ────────────────
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
};

export function startStaticServer(port = 0) {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://x").pathname,
    );
    const relativePath = normalize(pathname === "/" ? "/index.html" : pathname);
    // Never serve anything outside the showreel folder.
    if (relativePath.includes("..")) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(join(ROOT, relativePath));
      response.writeHead(200, {
        "content-type":
          MIME_TYPES[extname(relativePath)] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// ── Minimal Chrome DevTools Protocol client ─────────────────────────────────
class DevToolsSession {
  #socket;
  #nextId = 1;
  #pending = new Map();

  static async connect(webSocketUrl) {
    const session = new DevToolsSession();
    session.#socket = new WebSocket(webSocketUrl);
    session.#socket.addEventListener("message", (event) =>
      session.#onMessage(event),
    );
    await new Promise((resolve, reject) => {
      session.#socket.addEventListener("open", resolve, { once: true });
      session.#socket.addEventListener("error", reject, { once: true });
    });
    return session;
  }

  #onMessage(event) {
    const message = JSON.parse(event.data);
    if (!message.id || !this.#pending.has(message.id)) return;
    const { resolve, reject } = this.#pending.get(message.id);
    this.#pending.delete(message.id);
    if (message.error)
      reject(new Error(`${message.error.message} (${message.error.code})`));
    else resolve(message.result);
  }

  send(method, params = {}) {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) =>
      this.#pending.set(id, { resolve, reject }),
    );
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      );
    }
    return result.value;
  }

  close() {
    this.#socket.close();
  }
}

export async function launchPage(pageUrl) {
  const debuggingPort = await freePort();
  const chrome = spawn(
    chromePath,
    [
      "--headless",
      `--remote-debugging-port=${debuggingPort}`,
      "--hide-scrollbars",
      "--mute-audio",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--font-render-hinting=none",
      `--window-size=${WIDTH},${HEIGHT}`,
      // Chromium refuses to sandbox as root (e.g. in CI containers).
      ...(process.getuid?.() === 0 ? ["--no-sandbox"] : []),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  chrome.stderr.resume();

  // Wait for the DevTools endpoint to come up.
  let targets;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${debuggingPort}/json/list`,
      );
      targets = await response.json();
      if (targets.some((target) => target.type === "page")) break;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const pageTarget = targets?.find((target) => target.type === "page");
  if (!pageTarget) throw new Error("Chromium did not expose a page target");

  const session = await DevToolsSession.connect(
    pageTarget.webSocketDebuggerUrl,
  );
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: scale,
    mobile: false,
  });
  await session.send("Page.navigate", { url: pageUrl });

  for (let attempt = 0; attempt < 300; attempt++) {
    const ready = await session
      .evaluate("window.__showreelReady === true")
      .catch(() => false);
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const error = await session.evaluate("window.__showreelError ?? null");
  if (error) throw new Error(`Composition failed to load: ${error}`);

  return {
    async capture(seconds) {
      await session.evaluate(`window.__render(${seconds})`);
      const { data } = await session.send("Page.captureScreenshot", {
        format: "png",
        optimizeForSpeed: true,
        captureBeyondViewport: false,
      });
      return Buffer.from(data, "base64");
    },
    evaluate: (expression) => session.evaluate(expression),
    close() {
      session.close();
      chrome.kill("SIGKILL");
    },
  };
}

// ── Rendering ───────────────────────────────────────────────────────────────
function formatDuration(milliseconds) {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, "0")}s`;
}

async function renderStills(pages, times) {
  mkdirSync(join(OUT_DIR, "stills"), { recursive: true });
  for (const [index, seconds] of times.entries()) {
    const png = await pages[index % pages.length].capture(seconds);
    const name = `still-${seconds.toFixed(3).padStart(6, "0")}.png`;
    writeFileSync(join(OUT_DIR, "stills", name), png);
    console.log(`  wrote out/stills/${name}`);
  }
}

async function renderVideo(pages) {
  const audioPath = join(OUT_DIR, "soundtrack.wav");
  console.log("• Synthesising soundtrack");
  writeFileSync(audioPath, renderSoundtrack());

  const firstFrame = Math.floor(fromSeconds * fps);
  const lastFrame = Math.ceil(toSeconds * fps) - 1;
  const frameCount = lastFrame - firstFrame + 1;
  const width = Math.round(WIDTH * scale);
  const height = Math.round(HEIGHT * scale);

  // Sub-frames are averaged by tmix, then every Nth blended frame is kept.
  const videoFilters = [];
  if (blurSamples > 1) {
    videoFilters.push(`tmix=frames=${blurSamples}`);
    videoFilters.push(
      `select='eq(mod(n\\,${blurSamples})\\,${blurSamples - 1})'`,
    );
    videoFilters.push(`setpts=N/(${fps}*TB)`);
  }
  // Post: a soft bloom (screen-blended downsampled blur) and fine film grain.
  const bloomWidth = Math.round(width / 4);
  const bloomHeight = Math.round(height / 4);
  const filterGraph = [
    `[0:v]${videoFilters.length ? videoFilters.join(",") + "," : ""}format=gbrp,split[base][glow]`,
    `[glow]scale=${bloomWidth}:${bloomHeight},gblur=sigma=${(10 * scale).toFixed(1)},scale=${width}:${height}[bloom]`,
    `[base][bloom]blend=all_mode=screen:all_opacity=0.28,noise=alls=5:allf=t,format=yuv420p[video]`,
  ].join(";");

  const ffmpegArgs = [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "image2pipe",
    "-framerate",
    String(fps * blurSamples),
    "-c:v",
    "png",
    "-i",
    "-",
    "-ss",
    String(fromSeconds),
    "-t",
    String(toSeconds - fromSeconds),
    "-i",
    audioPath,
    "-filter_complex",
    filterGraph,
    "-map",
    "[video]",
    "-map",
    "1:a",
    "-r",
    String(fps),
    "-c:v",
    "libx264",
    "-preset",
    draft ? "veryfast" : "slow",
    "-crf",
    draft ? "23" : "14",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "256k",
    "-movflags",
    "+faststart",
    "-shortest",
    outputFile,
  ];
  const ffmpeg = spawn(ffmpegPath, ffmpegArgs, {
    stdio: ["pipe", "inherit", "inherit"],
  });
  const ffmpegDone = new Promise((resolve, reject) => {
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)),
    );
  });

  // A shutter of 0.5 frames (180°), sampled at the centre of each slice.
  const shutter = 0.5;
  const samples = [];
  for (let frame = firstFrame; frame <= lastFrame; frame++) {
    for (let sub = 0; sub < blurSamples; sub++) {
      const offset =
        blurSamples > 1 ? ((sub + 0.5) / blurSamples - 0.5) * shutter : 0;
      samples.push(
        Math.min(Math.max((frame + offset) / fps, 0), DURATION - 1e-4),
      );
    }
  }

  // Each browser renders every Nth sample; results are written in order.
  // The look-ahead window keeps memory bounded.
  const results = new Array(samples.length);
  const lookAhead = pages.length * 6;
  let written = 0;
  let wake = () => {};
  const workerLoops = pages.map(async (page, workerIndex) => {
    for (
      let index = workerIndex;
      index < samples.length;
      index += pages.length
    ) {
      while (index - written > lookAhead) {
        await new Promise((resolve) => (wake = resolve));
      }
      results[index] = await page.capture(samples[index]);
      wake();
    }
  });

  const startedAt = Date.now();
  let failure;
  Promise.all(workerLoops).catch((error) => (failure = error));
  while (written < samples.length) {
    if (failure) throw failure;
    if (!results[written]) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      continue;
    }
    if (!ffmpeg.stdin.write(results[written])) {
      await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
    }
    results[written] = null;
    written++;
    wake();
    if (written % (fps * blurSamples) === 0 || written === samples.length) {
      const elapsed = Date.now() - startedAt;
      const remaining = (elapsed / written) * (samples.length - written);
      process.stdout.write(
        `\r• Rendering ${Math.floor(written / blurSamples)}/${frameCount} frames` +
          `  (${formatDuration(elapsed)} elapsed, ~${formatDuration(remaining)} left)  `,
      );
    }
  }
  ffmpeg.stdin.end();
  await ffmpegDone;
  console.log(`\n✓ Wrote ${outputFile.replace(ROOT + "/", "")}`);
  if (!draft) await encodeWebCopy(outputFile);
}

/**
 * The master is encoded near-losslessly (grain is expensive), so also write
 * a lighter copy for websites, chat and social uploads.
 */
function encodeWebCopy(masterFile) {
  const webFile = masterFile.replace(/\.mp4$/, "-web.mp4");
  const ffmpegArgs = [
    "-y",
    "-loglevel",
    "error",
    "-i",
    masterFile,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "22",
    "-maxrate",
    "14M",
    "-bufsize",
    "28M",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    webFile,
  ];
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { stdio: "inherit" });
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited with ${code}`));
      console.log(`✓ Wrote ${webFile.replace(ROOT + "/", "")}`);
      resolve();
    });
  });
}

async function main() {
  if (!chromePath) throw new Error("No Chromium found. Set CHROME_PATH.");
  mkdirSync(OUT_DIR, { recursive: true });
  await ensureFonts();

  const server = await startStaticServer();
  const pageUrl = `http://127.0.0.1:${server.address().port}/index.html?render`;
  const workerCount = stills.length
    ? Math.min(workers, stills.length)
    : workers;
  console.log(
    `• ${WIDTH * scale}×${HEIGHT * scale} @ ${fps}fps, ${blurSamples}× motion-blur samples, ` +
      `${workerCount} browser${workerCount > 1 ? "s" : ""}`,
  );
  const pages = await Promise.all(
    Array.from({ length: workerCount }, () => launchPage(pageUrl)),
  );
  try {
    if (stills.length) await renderStills(pages, stills);
    else await renderVideo(pages);
  } finally {
    pages.forEach((page) => page.close());
    server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`\n✗ ${error.stack ?? error}`);
    process.exit(1);
  });
}

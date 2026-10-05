#!/usr/bin/env node
/**
 * Renders the film to MP4: headless Chromium (Playwright) poses each frame via
 * window.__render(t), ffmpeg encodes it together with the soundtrack.
 *
 *   node marketing/api-demo/render.mjs                 # 1920x1080, 30 fps
 *   node marketing/api-demo/render.mjs --draft         # 960x540, 15 fps
 *   node marketing/api-demo/render.mjs --stills 3,20   # PNG stills to out/stills
 *   node marketing/api-demo/render.mjs --silent        # skip the soundtrack
 *
 * Env: PLAYWRIGHT_MODULE (path to playwright/index.mjs), FFMPEG_PATH.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION, FPS as BASE_FPS } from "./timeline.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, "..", "..");
const OUT = join(ROOT, "out");
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const draft = flag("draft");
const fps = draft ? 15 : BASE_FPS;
const scale = draft ? 0.5 : 1;
const workers = Number(opt("workers", 4));
const stills = opt("stills", "").split(",").filter(Boolean).map(Number);
const from = Number(opt("from", 0));
const to = Math.min(DURATION, Number(opt("to", DURATION)));
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const TYPES = { ".html": "text/html", ".css": "text/css", ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = url.startsWith("/repo/") ? join(REPO, url.slice(6)) : join(ROOT, url === "/" ? "index.html" : url);
  if (!normalize(file).startsWith(REPO)) return res.writeHead(403).end();
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
async function openPage() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(base + "/index.html");
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}
const shoot = (page, t, type, quality) =>
  page.evaluate((x) => window.__render(x), t).then(() => page.screenshot({ type, quality: type === "jpeg" ? quality : undefined }));

if (stills.length) {
  mkdirSync(join(OUT, "stills"), { recursive: true });
  const page = await openPage();
  for (const t of stills) {
    writeFileSync(join(OUT, "stills", `still-${String(t).replace(".", "_")}.png`), await shoot(page, t, "png"));
    console.log("• still", t);
  }
  await browser.close(); server.close();
  process.exit(0);
}

// frames
const frames = join(OUT, "frames");
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
const first = Math.floor(from * fps);
const total = Math.ceil(to * fps);
let done = 0;
await Promise.all(
  Array.from({ length: workers }, async (_, w) => {
    const page = await openPage();
    for (let i = first + w; i < total; i += workers) {
      writeFileSync(join(frames, `f${String(i - first).padStart(5, "0")}.jpg`), await shoot(page, i / fps, "jpeg", 93));
      if (++done % 150 === 0) console.log(`  ${done}/${total - first} frames`);
    }
  }),
);
await browser.close(); server.close();

// audio
const audio = join(OUT, "soundtrack.wav");
const silent = flag("silent");
if (!silent) {
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [join(ROOT, "soundtrack.mjs")], { stdio: "inherit" });
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error("soundtrack failed"))));
  });
}
const outFile = opt("out", join(OUT, draft ? "vaulted-money-local-api-draft.mp4" : "vaulted-money-local-api.mp4"));
const ff = ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(frames, "f%05d.jpg")];
if (!silent) ff.push("-ss", String(from), "-t", String(to - from), "-i", audio);
ff.push("-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", draft ? "26" : "17", "-pix_fmt", "yuv420p", "-vf", "format=yuv420p");
if (!silent) ff.push("-c:a", "aac", "-b:a", "192k", "-shortest");
ff.push("-movflags", "+faststart", outFile);
await new Promise((resolve, reject) => {
  const p = spawn(ffmpeg, ff, { stdio: "inherit" });
  p.on("close", (c) => (c === 0 ? resolve() : reject(new Error("ffmpeg failed"))));
});
rmSync(frames, { recursive: true, force: true });
console.log("✓", outFile);

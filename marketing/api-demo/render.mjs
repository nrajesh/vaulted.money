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
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, "..", "..");
const OUT = join(ROOT, "out");
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
// --cut short renders the 70-second teaser (short/), otherwise the full walkthrough.
const cut = opt("cut", "full");
const timeline = await import(cut === "short" ? "./short/timeline.mjs" : "./timeline.mjs");
const { DURATION, FPS: BASE_FPS } = timeline;
const chapters = timeline.chapters;
const prefix = cut === "short" ? "teaser-" : "";
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
  await page.goto(base + "/index.html?cut=" + cut);
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
const audio = join(OUT, cut === "short" ? "soundtrack-short.wav" : "soundtrack.wav");
const silent = flag("silent");
if (!silent) {
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [join(ROOT, "soundtrack.mjs")], { stdio: "inherit", env: { ...process.env, CUT: cut } });
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error("soundtrack failed"))));
  });
}
const outFile = opt("out", join(OUT, cut === "short" ? (draft ? "vaulted-money-teaser-draft.mp4" : "vaulted-money-teaser.mp4") : draft ? "vaulted-money-local-api-draft.mp4" : "vaulted-money-local-api.mp4"));

// Chapters: embedded in the MP4 (QuickTime, VLC, most players show a chapter
// menu), plus a WebVTT track, YouTube-style timestamps and a click-to-seek player page.
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const vttTime = (t) => `${String(Math.floor(t / 3600)).padStart(2, "0")}:${String(Math.floor(t / 60) % 60).padStart(2, "0")}:${(t % 60).toFixed(3).padStart(6, "0")}`;
const chapterList = chapters();
const metaFile = join(OUT, prefix + "chapters.ffmetadata");
writeFileSync(metaFile, ";FFMETADATA1\n" + chapterList.map((c) => `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(c.start * 1000)}\nEND=${Math.round(c.end * 1000)}\ntitle=${c.title}\n`).join("\n"));
writeFileSync(join(OUT, prefix + "chapters.vtt"), "WEBVTT\n\n" + chapterList.map((c) => `${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.title}\n`).join("\n"));
const srtTime = (t) => vttTime(t).replace(".", ",");
writeFileSync(join(OUT, prefix + "chapters.srt"), chapterList.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.title}\n`).join("\n"));
writeFileSync(join(OUT, prefix + "chapters.txt"), chapterList.map((c) => `${mmss(c.start)} ${c.title}`).join("\n") + "\n");
const videoName = outFile.split("/").pop();
if (chapterList.length) writeFileSync(join(OUT, prefix + "player.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vaulted Money · Local API film</title>
<style>
:root{--bg:#0a0f1a;--card:#0d1526;--line:#1e2a44;--fg:#f1f5f9;--muted:#8fa3bf;--accent:#5fcfdc}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.4 Inter,system-ui,sans-serif}
main{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;max-width:1500px;margin:0 auto;padding:24px}
video{width:100%;border-radius:14px;background:#000;border:1px solid var(--line)}
h1{font-size:20px;margin:0 0 14px}nav{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;align-self:start;position:sticky;top:24px}
nav button{all:unset;display:flex;gap:12px;width:100%;padding:10px 12px;border-radius:10px;cursor:pointer;box-sizing:border-box}
nav button:hover{background:#13203a}nav button.on{background:#10303a;color:var(--accent)}nav time{color:var(--muted);font-variant-numeric:tabular-nums;min-width:44px}
@media(max-width:900px){main{grid-template-columns:1fr}nav{position:static}}
</style></head><body><main>
<section><h1>Vaulted Money · the Local API</h1>
<video id="v" controls preload="metadata" src="${videoName}"><track kind="chapters" srclang="en" label="Chapters" src="chapters.vtt" default></video></section>
<nav aria-label="Chapters"><h1 style="font-size:15px;color:var(--muted);margin:4px 12px 8px">CHAPTERS</h1>
${chapterList.map((c) => `<button data-t="${c.start}"><time>${mmss(c.start)}</time><span>${c.title}</span></button>`).join("\n")}
</nav></main>
<script>
const v=document.getElementById("v"),btns=[...document.querySelectorAll("nav button")];
btns.forEach(b=>b.onclick=()=>{v.currentTime=+b.dataset.t;v.play()});
v.ontimeupdate=()=>{let a=-1;btns.forEach((b,i)=>{if(v.currentTime>=+b.dataset.t)a=i});btns.forEach((b,i)=>b.classList.toggle("on",i===a))};
</script></body></html>`);
const ff = ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(frames, "f%05d.jpg")];
if (!silent) ff.push("-ss", String(from), "-t", String(to - from), "-i", audio);
// QuickTime needs a real chapter track (a text track the video refers to as "chap").
// MP4Box builds exactly that; without it, fall back to ffmpeg's own chapters.
const hasMp4Box = spawnSync("which", ["MP4Box"]).status === 0 && chapterList.length > 0;
if (!hasMp4Box && chapterList.length) ff.push("-i", metaFile, "-map_metadata", String(silent ? 1 : 2), "-map_chapters", String(silent ? 1 : 2));
ff.push("-map", "0:v"); if (!silent) ff.push("-map", "1:a");
// A keyframe on every chapter marker, so players can show its thumbnail and jump there instantly.
if (chapterList.length) ff.push("-force_key_frames", chapterList.map((c) => c.start.toFixed(3)).join(","));
ff.push("-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", draft ? "26" : "17", "-pix_fmt", "yuv420p", "-vf", "format=yuv420p");
if (!silent) ff.push("-c:a", "aac", "-b:a", "192k", "-shortest");
const encoded = hasMp4Box ? outFile.replace(/\.mp4$/, ".encoded.mp4") : outFile;
ff.push("-movflags", "+faststart", encoded);
await new Promise((resolve, reject) => {
  const p = spawn(ffmpeg, ff, { stdio: "inherit" });
  p.on("close", (c) => (c === 0 ? resolve() : reject(new Error("ffmpeg failed"))));
});
if (hasMp4Box) {
  // Video is track 1, audio track 2 (if any), the chapter track is added last.
  const chapterTrack = silent ? 2 : 3;
  const mp4box = ["-add", encoded, "-add", join(OUT, prefix + "chapters.srt") + ":name=Chapters:lang=eng:disable", "-ref", `1:chap:${chapterTrack}`];
  if (!silent) mp4box.push("-ref", `2:chap:${chapterTrack}`);
  mp4box.push("-new", outFile); // (adding the older Nero chapter list too makes MP4Box drop the track)
  const result = spawnSync("MP4Box", mp4box, { stdio: ["ignore", "ignore", "inherit"] });
  if (result.status !== 0) throw new Error("MP4Box failed");
  rmSync(encoded, { force: true });
}
rmSync(frames, { recursive: true, force: true });
console.log("✓", outFile);

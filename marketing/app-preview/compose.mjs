#!/usr/bin/env node
/**
 * Turns the simulator recording into the App Store preview: trims to the
 * story, scales to 886×1920 (iPhone 6.9"), lays a caption card over each
 * screen, and adds the calm score with quiet taps on the touches.
 *
 *   node marketing/app-preview/compose.mjs [--name raw]
 *   → out/vaulted-money-app-preview.mp4 (H.264 30 fps + AAC, −14 LUFS)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { calmScoreCues } from "./cues.mjs";
import { SEGMENTS, captionTimeline } from "./captions.mjs";
import { renderScore, writeWav } from "../showreel/calmScore.mjs";
import { requireTools } from "../shared/tools.mjs";

const REPO = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(import.meta.dirname, "out");
const WIDTH = 886;
const HEIGHT = 1920;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One transparent 886×1920 PNG per caption: a dark glass card near the top. */
async function renderCaptions(captions, dir) {
  const { chromium } = await import(
    path.join(REPO, "marketing/node_modules/playwright/index.mjs")
  );
  const browser = await chromium.launch(
    process.env.CHROME ? { executablePath: process.env.CHROME } : {},
  );
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const files = [];
  for (const [i, c] of captions.entries()) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
      <div style="position:absolute;left:33px;right:33px;top:150px;padding:34px 38px;border-radius:34px;
        background:rgba(7,15,31,.84);backdrop-filter:blur(8px);box-shadow:0 18px 50px rgba(0,0,0,.35);
        font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;color:#fff">
        <div style="font-size:56px;font-weight:800;letter-spacing:-1px;line-height:1.1;text-wrap:balance">${escapeHtml(c.headline)}</div>
        ${c.sub ? `<div style="margin-top:14px;font-size:34px;font-weight:700;color:hsl(183 51% 74%)">${escapeHtml(c.sub)}</div>` : ""}
      </div></body></html>`);
    const file = path.join(dir, `caption-${i + 1}.png`);
    await page.screenshot({ path: file, omitBackground: true });
    files.push(file);
  }
  await browser.close();
  return files;
}

requireTools(["ffmpeg"]);
const name = arg("name", "raw");
const raw = path.join(OUT, `${name}.mp4`);
const marks = JSON.parse(
  readFileSync(path.join(OUT, `${name}.marks.json`), "utf8"),
);
const story = marks.end - marks.start;
const strings = JSON.parse(
  readFileSync(path.join(REPO, "marketing/shared/strings/en.json"), "utf8"),
);
const captions = captionTimeline(strings, SEGMENTS, story);

const work = path.join(OUT, "compose");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
const captionFiles = await renderCaptions(captions, work);

const wav = path.join(work, "score.wav");
writeWav(
  wav,
  renderScore({ seconds: story, cues: calmScoreCues(SEGMENTS, story) }),
  48000,
);

// The simulator writes no frames while the screen is still, so the final
// screen's hold may be missing: clone the last frame out to the story's end.
const inputs = [
  "-ss",
  String(marks.start),
  "-i",
  raw,
  ...captionFiles.flatMap((f) => ["-i", f]),
  "-i",
  wav,
];
let chain = `[0:v]tpad=stop_mode=clone:stop_duration=6,trim=duration=${story.toFixed(3)},setpts=PTS-STARTPTS,fps=30,scale=${WIDTH}:-2,crop=${WIDTH}:${HEIGHT}[v0]`;
captions.forEach((c, i) => {
  chain += `;[v${i}][${i + 1}:v]overlay=0:0:enable='between(t,${c.start},${c.end})'[v${i + 1}]`;
});
const audioIndex = captionFiles.length + 1;
chain += `;[${audioIndex}:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]`;

const out = path.join(OUT, "vaulted-money-app-preview.mp4");
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  ...inputs,
  "-filter_complex",
  chain,
  "-map",
  `[v${captions.length}]`,
  "-map",
  "[a]",
  "-c:v",
  "libx264",
  "-profile:v",
  "high",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "16",
  "-c:a",
  "aac",
  "-b:a",
  "256k",
  "-ar",
  "48000",
  "-t",
  story.toFixed(3),
  "-movflags",
  "+faststart",
  out,
]);
console.log(
  `✓ ${path.relative(REPO, out)} (${story.toFixed(1)} s, ${WIDTH}×${HEIGHT})`,
);

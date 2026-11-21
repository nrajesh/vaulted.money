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
import { chapterTimeline } from "./captions.mjs";
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

/**
 * One transparent 886×1920 PNG per chapter card: the chapter's title on a
 * dark veil over the cut between two screens, so captions never cover the
 * app while it is on screen.
 */
async function renderCaptions(captions, dir) {
  const { chromium } = await import(
    path.join(REPO, "marketing/node_modules/playwright/index.mjs")
  );
  const browser = await chromium.launch(
    process.env.CHROME
      ? { executablePath: process.env.CHROME }
      : // Playwright's full Chromium: works without the separate
        // "headless shell" download.
        { channel: "chromium" },
  );
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const files = [];
  for (const [i, c] of captions.entries()) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 70px;
        background:linear-gradient(180deg,rgba(7,15,31,.45),rgba(7,15,31,.82) 45%,rgba(7,15,31,.82) 60%,rgba(7,15,31,.45));
        font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;color:#fff">
        <div style="width:90px;height:8px;border-radius:4px;background:hsl(183 51% 64%);margin-bottom:40px"></div>
        <div style="font-size:88px;font-weight:800;letter-spacing:-2px;line-height:1.05;text-wrap:balance">${escapeHtml(c.headline)}</div>
        ${c.sub ? `<div style="margin-top:28px;font-size:42px;font-weight:600;line-height:1.25;color:hsl(183 51% 74%)">${escapeHtml(c.sub)}</div>` : ""}
      </div></body></html>`);
    const file = path.join(dir, `caption-${i + 1}.png`);
    await page.screenshot({ path: file, omitBackground: true });
    files.push(file);
  }
  await browser.close();
  return files;
}

/**
 * The opening and closing brand cards: the app icon, name and tagline on a
 * dark veil laid over the real app footage (Apple allows text and graphics
 * over screen captures, not separate title cards). The opening one is the
 * natural poster frame.
 */
const BRAND_IN = 1.8; // seconds the opening card shows
const BRAND_OUT = 2.4; // seconds the closing card holds after the story

async function renderBrandCards(dir) {
  const { chromium } = await import(
    path.join(REPO, "marketing/node_modules/playwright/index.mjs")
  );
  const browser = await chromium.launch(
    process.env.CHROME
      ? { executablePath: process.env.CHROME }
      : { channel: "chromium" },
  );
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const icon = `data:image/png;base64,${readFileSync(
    path.join(
      REPO,
      "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    ),
  ).toString("base64")}`;
  const card = (
    veil,
    extra,
  ) => `<!doctype html><html><body style="margin:0;background:transparent">
    <div style="position:absolute;inset:0;background:${veil};display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;color:#fff;text-align:center">
      <img src="${icon}" style="width:300px;height:300px;border-radius:66px;box-shadow:0 30px 80px rgba(0,0,0,.5)">
      <div style="margin-top:56px;font-size:92px;font-weight:800;letter-spacing:-2px">Vaulted Money</div>
      <div style="margin-top:18px;font-size:46px;font-weight:700;color:hsl(183 51% 74%)">Private Vault, Open Code</div>
      ${extra}
    </div></body></html>`;
  const cards = [
    card(
      "radial-gradient(circle at 50% 45%,rgba(7,15,31,.9),rgba(7,15,31,.97))",
      "",
    ),
    card(
      "radial-gradient(circle at 50% 45%,rgba(7,15,31,.93),rgba(7,15,31,.98))",
      `<div style="margin-top:70px;font-size:40px;font-weight:600;color:rgba(255,255,255,.82);line-height:1.5">No sign-up. No cloud. No ads.<br>Your money stays on your device.</div>`,
    ),
  ];
  const files = [];
  for (const [i, html] of cards.entries()) {
    await page.setContent(html);
    await page.waitForLoadState("load");
    const file = path.join(dir, `brand-${i + 1}.png`);
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
// Scene marks are seconds into the video; make them seconds into the story.
const scenes = (marks.scenes ?? []).map((t) => t - marks.start);
const captions = chapterTimeline(scenes, story);
const total = story + BRAND_OUT;
if (total > 30)
  console.warn(
    `! ${total.toFixed(1)} s is over Apple's 30-second limit; shorten the story.`,
  );

const work = path.join(OUT, "compose");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
const captionFiles = await renderCaptions(captions, work);
const [openCard, endCard] = await renderBrandCards(work);

const wav = path.join(work, "score.wav");
writeWav(
  wav,
  renderScore({ seconds: total, cues: calmScoreCues(scenes, story) }),
  48000,
);

// The simulator writes no frames while the screen is still, so the final
// screen's hold may be missing: clone the last frame out to the story's end.
// Trim inside the filter, after fps=30 has filled the gaps the simulator
// leaves while the screen is still; seeking the input would skip a still
// opening screen and shift every caption.
const inputs = [
  "-i",
  raw,
  ...captionFiles.flatMap((f) => [
    "-loop",
    "1",
    "-t",
    total.toFixed(3),
    "-i",
    f,
  ]),
  "-loop",
  "1",
  "-t",
  total.toFixed(3),
  "-i",
  openCard,
  "-loop",
  "1",
  "-t",
  total.toFixed(3),
  "-i",
  endCard,
  "-i",
  wav,
];
let chain = `[0:v]fps=30,tpad=stop_mode=clone:stop_duration=6,trim=start=${marks.start}:duration=${total.toFixed(3)},setpts=PTS-STARTPTS,scale=${WIDTH}:-2,crop=${WIDTH}:${HEIGHT}[v0]`;
// Each chapter card is a transition: the app behind it blurs in, the card
// slides in from the right, holds, and slides out to the left while the
// blur clears on the next screen.
const SLIDE = 0.35;
captions.forEach((c, i) => {
  const { start, end } = c;
  const blurOut = Math.max(start, end - SLIDE).toFixed(3);
  chain += `;[v${i}]split[b${i}][s${i}]`;
  chain += `;[s${i}]gblur=sigma=28,format=rgba,fade=t=in:st=${start}:d=${SLIDE}:alpha=1,fade=t=out:st=${blurOut}:d=${SLIDE}:alpha=1[bl${i}]`;
  chain += `;[b${i}][bl${i}]overlay=0:0:enable='between(t,${start},${end})'[u${i}]`;
  const slideIn = `W*pow(1-(t-${start})/${SLIDE},2)`;
  const slideOut = `-W*pow(max(0,(t-(${end}-${SLIDE}))/${SLIDE}),2)`;
  chain += `;[u${i}][${i + 1}:v]overlay=x='if(lt(t,${start}+${SLIDE}),${slideIn},${slideOut})':y=0:enable='between(t,${start},${end})'[v${i + 1}]`;
});
const n = captions.length;
const openIndex = n + 1;
const endIndex = n + 2;
chain += `;[${openIndex}:v]format=rgba,fade=t=out:st=${(BRAND_IN - 0.4).toFixed(2)}:d=0.4:alpha=1[open]`;
chain += `;[${endIndex}:v]format=rgba,fade=t=in:st=${story.toFixed(3)}:d=0.5:alpha=1[end]`;
chain += `;[v${n}][open]overlay=0:0:enable='lt(t,${BRAND_IN})'[vo]`;
chain += `;[vo][end]overlay=0:0:enable='gte(t,${story.toFixed(3)})'[vout]`;
const audioIndex = captionFiles.length + 3;
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
  "[vout]",
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
  total.toFixed(3),
  "-movflags",
  "+faststart",
  out,
]);
console.log(
  `✓ ${path.relative(REPO, out)} (${total.toFixed(1)} s, ${WIDTH}×${HEIGHT})`,
);

/**
 * Renders "You see everything. We see nothing." to an MP4.
 *
 *   node marketing/showreel/vault/capture.mjs            # once (app running)
 *   node marketing/showreel/vault/render.mjs             # 1080p30 → out/ and ../final/
 *   node marketing/showreel/vault/render.mjs --scale 2   # 4K30 → out/ and ../final/
 *   node marketing/showreel/vault/render.mjs --stills 2,12,20
 *   node marketing/showreel/vault/render.mjs --draft     # 960×540, quick check
 *   node marketing/showreel/vault/render.mjs --reuse     # new sound on the last run's frames
 *
 * A small static server serves this folder, headless Chromium draws each
 * frame (film.mjs poses the stage for any time), and ffmpeg encodes them
 * with the score, normalised to −14 LUFS.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { DURATION, FPS, HEIGHT, WIDTH } from "./timeline.mjs";
import { renderScore } from "./score.mjs";
import { writeWav } from "../calmScore.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const HERE = import.meta.dirname;
const OUT = path.join(HERE, "out");
const ROOT = path.join(HERE, ".."); // serves ../lib too
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
const draft = flag("draft");
const scale = draft ? 0.5 : Number(option("scale") ?? 1);
const workers = Number(option("workers") ?? 4);
const stills = option("stills")?.split(",").map(Number);
mkdirSync(path.join(OUT, "stills"), { recursive: true });

// Fonts: Latin subsets, downloaded once and served locally afterwards.
async function ensureFonts() {
  const cssPath = path.join(OUT, "fonts.css");
  if (existsSync(cssPath)) return;
  mkdirSync(path.join(OUT, "fonts"), { recursive: true });
  const css = await (
    await fetch(
      "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400..600&display=block",
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        },
      },
    )
  ).text();
  const blocks = [
    ...css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]+\})/g),
  ]
    .filter(([, subset]) => subset === "latin")
    .map(([, , block]) => block);
  const local = [];
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+)\)/)[1];
    const file = url.split("/").pop();
    writeFileSync(
      path.join(OUT, "fonts", file),
      Buffer.from(await (await fetch(url)).arrayBuffer()),
    );
    local.push(block.replace(url, `fonts/${file}`));
  }
  if (!local.length) throw new Error("No font faces in the Google Fonts reply");
  writeFileSync(cssPath, local.join("\n"));
}

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/vault/film.html`;

await ensureFonts();
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
});
async function openPage() {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: scale,
  });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(url);
  await page.waitForFunction(
    () => window.__filmReady || window.__filmError,
    null,
    {
      timeout: 120_000,
    },
  );
  const error = await page.evaluate(() => window.__filmError);
  if (error) throw new Error(error);
  return page;
}

try {
  if (stills) {
    const page = await openPage();
    for (const t of stills) {
      await page.evaluate((s) => window.__render(s), t);
      const file = path.join(OUT, "stills", `t${t.toFixed(2)}.png`);
      await page.screenshot({ path: file });
      console.log(`  wrote ${file}`);
    }
  } else {
    const frames = Math.round(DURATION * FPS);
    const dir = path.join(
      OUT,
      draft ? "frames-draft" : scale > 1 ? `frames-${scale}x` : "frames",
    );
    mkdirSync(dir, { recursive: true });
    let next = 0;
    let done = 0;
    // --reuse keeps the frames from the last run (for a sound-only change).
    if (!flag("reuse"))
      await Promise.all(
        Array.from({ length: workers }, async () => {
          const page = await openPage();
          for (;;) {
            const n = next++;
            if (n >= frames) break;
            await page.evaluate((s) => window.__render(s), n / FPS);
            await page.screenshot({
              path: path.join(dir, `f${String(n).padStart(5, "0")}.jpg`),
              type: "jpeg",
              quality: 96,
              timeout: 120_000,
            });
            if (++done % 150 === 0) console.log(`  ${done}/${frames} frames`);
          }
        }),
      );

    const wav = path.join(OUT, "score.wav");
    writeWav(wav, renderScore({ seconds: DURATION }), 48000);
    // One fixed gain to reach −14 LUFS: the quiet offline moment stays quiet
    // (a loudness normaliser that rides the level would flatten the arc).
    const measured = spawnSync(
      ffmpeg,
      [
        "-hide_banner",
        "-nostats",
        "-i",
        wav,
        "-af",
        "ebur128",
        "-f",
        "null",
        "-",
      ],
      { encoding: "utf8" },
    ).stderr;
    const loudness = Number(
      measured.match(/I:\s+(-?[\d.]+) LUFS\s+Threshold/)?.[1],
    );
    if (!Number.isFinite(loudness))
      throw new Error("Could not measure loudness");
    const gain = (-14 - loudness).toFixed(2);
    const resolutionSuffix =
      scale === 2 ? "-4k" : scale > 1 ? `-${Math.round(WIDTH * scale)}p` : "";
    const name = `vaulted-money-film${draft ? "-draft" : resolutionSuffix}.mp4`;
    const target = path.join(OUT, name);
    const result = spawnSync(
      ffmpeg,
      [
        "-y",
        "-v",
        "error",
        "-framerate",
        String(FPS),
        "-i",
        path.join(dir, "f%05d.jpg"),
        "-i",
        wav,
        "-af",
        "loudnorm=I=-14:TP=-1.5:LRA=11",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-g",
        "60",
        "-crf",
        draft ? "24" : "17",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-c:a",
        "aac",
        "-b:a",
        "256k",
        "-ar",
        "48000",
        "-t",
        String(DURATION),
        target,
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0) throw new Error("ffmpeg failed");
    console.log(`✓ ${target}`);
    if (!draft && (scale === 1 || scale === 2)) {
      const suffix = scale === 2 ? "-4k" : "";
      const final = path.join(HERE, `../final/vaulted-money-film${suffix}.mp4`);
      copyFileSync(target, final);
      console.log(`✓ ${final}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}

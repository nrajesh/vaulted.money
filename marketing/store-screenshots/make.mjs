#!/usr/bin/env node
/**
 * Makes every store image from the real app in one command.
 *
 *   pnpm marketing:screenshots [--set <id>|all] [--lang en] [--no-build]
 *
 * Builds the web app, serves it, captures the screens each set needs (both
 * themes, fixed clock and seed), renders the slides and writes
 * out/<set>/<lang>/NN.png. See README.md.
 */
import { spawn, execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { captureShots } from "../shared/capture.mjs";
import { requireTools } from "../shared/tools.mjs";
import { SETS } from "./sets.mjs";
import { buildSlide, headlineToHtml } from "./slide.mjs";
import { renderSlide, startAssetServer } from "./render.mjs";

const REPO = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(import.meta.dirname, "out");
const CAPTURES = path.join(OUT, "captures");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const setArg = arg("set", "all");
const lang = arg("lang", "en");
const setIds = setArg === "all" ? Object.keys(SETS) : setArg.split(",");
for (const id of setIds)
  if (!SETS[id])
    throw new Error(
      `Unknown set "${id}". Sets: ${Object.keys(SETS).join(", ")}`,
    );

requireTools(["ffmpeg"]);
const strings = JSON.parse(
  readFileSync(
    path.join(REPO, `marketing/shared/strings/${lang}.json`),
    "utf8",
  ),
);

const freePort = () =>
  new Promise((resolve) => {
    const srv = net.createServer().listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

async function startApp() {
  if (!process.argv.includes("--no-build")) {
    console.log("Building the web app…");
    execFileSync("pnpm", ["build"], { cwd: REPO, stdio: "ignore" });
  }
  const port = await freePort();
  const child = spawn(
    path.join(REPO, "node_modules/.bin/vite"),
    ["preview", "--port", String(port), "--strictPort"],
    { cwd: REPO, stdio: "ignore" },
  );
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(url);
      return { url, stop: () => child.kill() };
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  child.kill();
  throw new Error("The app's preview server did not start");
}

// Which shots each capture device needs, and whose rules apply to it.
const needs = {};
for (const id of setIds) {
  const set = SETS[id];
  if (set.device === "banner") continue;
  needs[set.device] ??= { shots: new Set(), store: set.store };
  set.shots.forEach((s) => needs[set.device].shots.add(s));
  if (set.store === "apple") needs[set.device].store = "apple";
}

const app = await startApp();
try {
  for (const [device, { shots, store }] of Object.entries(needs)) {
    console.log(`Capturing ${device} (${[...shots].join(", ")})…`);
    await captureShots({
      baseUrl: app.url,
      device,
      themes: ["dark", "light"],
      shotIds: [...shots].sort(),
      outDir: CAPTURES,
      store,
    });
  }
} finally {
  app.stop();
}
copyFileSync(
  path.join(REPO, "assets/brand/mac-icon.png"),
  path.join(CAPTURES, "icon.png"),
);

const { chromium } = await import(
  path.join(REPO, "marketing/node_modules/playwright/index.mjs")
);
const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
);
const assets = await startAssetServer(CAPTURES);
const written = [];
try {
  for (const id of setIds) {
    const set = SETS[id];
    if (set.device === "banner") {
      const feature = strings.feature;
      const slide = {
        width: set.width,
        height: set.height,
        page: "dark",
        feature: true,
        icon: "/captures/icon.png",
        headline: feature.headline,
        headlineHtml: headlineToHtml(feature.headline),
        body: feature.body,
        devices: [],
      };
      written.push(
        await renderSlide(
          browser,
          assets.url,
          slide,
          path.join(OUT, id, lang, "feature.png"),
        ),
      );
      continue;
    }
    for (const [i, shot] of set.shots.entries()) {
      // Crops measured during capture (see capture.mjs `cropBelow`).
      const crops = {};
      for (const theme of ["dark", "light"]) {
        const name = `${set.device}-${theme}-${shot}`;
        const sidecar = path.join(CAPTURES, `${name}.json`);
        if (existsSync(sidecar))
          crops[`${name}.png`] = JSON.parse(
            readFileSync(sidecar, "utf8"),
          ).visibleFraction;
      }
      const slide = buildSlide(id, shot, strings, crops);
      slide.devices = slide.devices.map((d) => ({
        ...d,
        image: `/captures/${d.image}`,
      }));
      const file = path.join(
        OUT,
        id,
        lang,
        `${String(i + 1).padStart(2, "0")}.png`,
      );
      written.push(await renderSlide(browser, assets.url, slide, file));
    }
  }
} finally {
  assets.close();
  await browser.close();
}

mkdirSync(OUT, { recursive: true });
const counts = setIds.map(
  (id) =>
    `${id.padEnd(13)} ${written.filter((f) => f.includes(`${path.sep}${id}${path.sep}`)).length} image(s)`,
);
console.log(
  `\n${counts.join("\n")}\n\nWrote ${written.length} images to ${path.relative(REPO, OUT)}/<set>/${lang}/`,
);

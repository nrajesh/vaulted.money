/**
 * App Store "Header and Search Results" image: one universal 5244×2950 PNG
 * that App Store Connect crops for both the product page header and search
 * results. Built from the captures `pnpm marketing:screenshots` already made,
 * so run that first.
 *
 *   CHROME="/path/to/Chrome" node marketing/store-screenshots/header.mjs
 *
 * Output: marketing/store-screenshots/out/appStoreHeader/universal.png
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { startAssetServer } from "./render.mjs";

const TOOL_DIR = import.meta.dirname;
const REPO = path.resolve(TOOL_DIR, "../..");
const CAPTURES = path.join(TOOL_DIR, "out/captures");
const OUT_DIR = path.join(TOOL_DIR, "out/appStoreHeader");
const WIDTH = 5244;
const HEIGHT = 2950;

if (!existsSync(path.join(CAPTURES, "iphone-dark-1.png"))) {
  console.error("No captures yet: run `pnpm marketing:screenshots` first.");
  process.exit(1);
}

const { chromium } = await import(
  path.join(REPO, "marketing/node_modules/playwright/index.mjs")
);
const browser = await chromium.launch(
  process.env.CHROME
    ? { executablePath: process.env.CHROME }
    : { channel: "chromium" },
);
const assets = await startAssetServer(CAPTURES);
mkdirSync(OUT_DIR, { recursive: true });
const raw = path.join(OUT_DIR, "raw.png");
const file = path.join(OUT_DIR, "universal.png");
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  await page.goto(`${assets.url}/templates/header.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: raw });
} finally {
  await browser.close();
  assets.close();
}
// Apple rejects images with an alpha channel: re-encode as plain RGB.
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-i",
  raw,
  "-pix_fmt",
  "rgb24",
  file,
]);
rmSync(raw);
console.log(`✓ ${path.relative(REPO, file)} (${WIDTH}×${HEIGHT})`);

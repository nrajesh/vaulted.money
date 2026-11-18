/**
 * Renders slides to PNG at exact store sizes.
 *
 * A small static server serves the template (this folder) and the captures
 * (`/captures/`); each slide's data is handed to the page before it loads.
 * The result is checked for size and re-encoded without an alpha channel,
 * because the stores reject screenshots with transparency.
 */
import { execFileSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
} from "node:fs";
import http from "node:http";
import path from "node:path";
import { pngSize } from "./png.mjs";

const TOOL_DIR = import.meta.dirname;
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".png": "image/png",
};

/** Serves the tool folder at / and `capturesDir` at /captures/. Resolves to { url, close }. */
export function startAssetServer(capturesDir) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = url.startsWith("/captures/")
      ? path.join(capturesDir, path.basename(url))
      : path.join(TOOL_DIR, path.normalize(url).replace(/^(\.\.[/\\])+/, ""));
    if (!file.startsWith(TOOL_DIR) && !file.startsWith(capturesDir)) {
      res.writeHead(403).end();
      return;
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => server.close(),
      }),
    ),
  );
}

/** Drops the alpha channel (the image is already opaque) with ffmpeg. */
function flatten(file) {
  const tmp = `${file}.rgb.png`;
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    file,
    "-pix_fmt",
    "rgb24",
    tmp,
  ]);
  renameSync(tmp, file);
}

/** Renders one slide (data from buildSlide, image paths under /captures/) to `outFile`. */
export async function renderSlide(browser, baseUrl, slide, outFile) {
  const page = await browser.newPage({
    viewport: { width: slide.width, height: slide.height },
    deviceScaleFactor: 1,
  });
  try {
    await page.addInitScript((data) => {
      window.__slide = data;
    }, slide);
    page.on("pageerror", (err) => {
      throw err;
    });
    await page.goto(`${baseUrl}/templates/slide.html`);
    await page.waitForSelector("body[data-ready='1']", { timeout: 30_000 });
    mkdirSync(path.dirname(outFile), { recursive: true });
    await page.screenshot({ path: outFile, omitBackground: false });
  } finally {
    await page.close();
  }
  flatten(outFile);
  const size = pngSize(readFileSync(outFile));
  if (size.width !== slide.width || size.height !== slide.height || size.alpha)
    throw new Error(
      `${outFile}: ${size.width}×${size.height}${size.alpha ? " with alpha" : ""}, expected ${slide.width}×${slide.height} opaque`,
    );
  return outFile;
}

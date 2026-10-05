#!/usr/bin/env node
/**
 * Checks that every card title and bullet fits on one line, at the moment each
 * takeaway slide is fully visible. Prints the offenders (none = pass).
 *   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node marketing/api-demo/qa-cards.mjs
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENES } from "./timeline.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, "..", "..");
const TYPES = { ".html": "text/html", ".css": "text/css", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = url.startsWith("/repo/") ? join(REPO, url.slice(6)) : join(ROOT, url === "/" ? "index.html" : url);
  if (!normalize(file).startsWith(REPO) || !existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
let failures = 0;
for (const s of SCENES) {
  // late in the scene: all cards are up and any code word has flipped
  const t = s.end - 1.2;
  const bad = await page.evaluate((x) => { window.__render(x); return window.__checkFit(); }, t);
  if (bad.length) { failures += bad.length; console.log(`✗ ${s.id} (${t.toFixed(1)} s):`, bad); }
}
console.log(failures ? `${failures} text(s) overflow` : "✓ every card title and bullet fits on one line");
await browser.close(); server.close();
process.exit(failures ? 1 : 0);

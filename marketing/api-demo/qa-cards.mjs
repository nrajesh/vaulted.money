#!/usr/bin/env node
/**
 * Quality gates for the film, checked on the real composition:
 *  1. every card title and bullet fits on one line;
 *  2. every label, title and bullet starts with a capital letter;
 *  3. nothing new appears in the last 3 seconds before a scene starts to
 *     dissolve, so every card and screenshot is in focus for at least 3 s.
 *
 *   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node marketing/api-demo/qa-cards.mjs
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { DISSOLVE, SCENES } from "./timeline.mjs";

const HOLD = 3.0; // seconds every card must stay in focus before the dissolve
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
const fail = (scene, what, items) => { failures += items.length; console.log(`✗ ${scene} · ${what}:`, items); };
for (const s of SCENES) {
  const justBefore = s.end - DISSOLVE - 0.05; // last moment before the dissolve starts
  const fit = await page.evaluate((x) => { window.__render(x); return window.__checkFit(); }, justBefore);
  if (fit.length) fail(s.id, "does not fit on one line", fit);
  const caps = await page.evaluate((x) => { window.__render(x); return window.__checkCaps(); }, justBefore);
  if (caps.length) fail(s.id, "starts with a lower-case letter", caps);
  const before = await page.evaluate((x) => { window.__render(x); return window.__snapshot(); }, justBefore - HOLD);
  const after = await page.evaluate((x) => { window.__render(x); return window.__snapshot(); }, justBefore);
  const late = after.filter((a, i) => a.o >= 0.98 && before[i].o < 0.98).map((a) => a.label);
  if (late.length) fail(s.id, `appears less than ${HOLD} s before the dissolve`, late);
}
console.log(failures ? `${failures} problem(s)` : `✓ ${SCENES.length} scenes: text fits, capitals correct, every card in focus for at least ${HOLD} s`);
await browser.close(); server.close();
process.exit(failures ? 1 : 0);

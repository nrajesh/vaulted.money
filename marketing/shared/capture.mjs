/**
 * Captures the app's real screens for the store images and the showreels.
 *
 * Every run shows the same numbers: the browser's clock is fixed to
 * FIXED_NOW and Math.random is replaced with a seeded generator before the
 * app loads, so "Generate Data" builds identical demo ledgers each time.
 * Each screen's visible text is checked with findAntiGoals before it is
 * saved; a problem stops the run with the shot id and what was found.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { findAntiGoals } from "./antiGoals.mjs";

const require = createRequire(import.meta.url);
const story = require("./story.json");

export const FIXED_NOW = new Date("2026-11-20T10:00:00");
export const SEED = 20261120;

/** CSS viewport and pixel ratio per capture device. */
export const DEVICES = {
  iphone: { width: 440, height: 956, scale: 3, mobile: true },
  duoOuter: { width: 466, height: 678, scale: 3, mobile: true },
  duoInner: { width: 669, height: 951, scale: 3, mobile: true },
  android: { width: 412, height: 915, scale: 3, mobile: true },
  ipad: { width: 1032, height: 1376, scale: 2, mobile: true },
  androidTablet: { width: 800, height: 1280, scale: 2, mobile: true },
  mac: { width: 1440, height: 900, scale: 2, mobile: false },
};

const loadChromium = async () => {
  const { chromium } = await import(
    path.join(import.meta.dirname, "../node_modules/playwright/index.mjs")
  );
  return chromium.launch(
    process.env.CHROME ? { executablePath: process.env.CHROME } : {},
  );
};

// Runs in the page before the app: seeded Math.random (mulberry32), and
// crypto.randomUUID drawn from it, because records get random ids and lists
// break ties by id.
const seedRandom = (seed) => {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hex = (n) =>
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
  crypto.randomUUID = () =>
    `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(Math.random() * 4)]}${hex(3)}-${hex(12)}`;
};

// Runs in the page: the text drawn inside the top `fraction` of the viewport.
const visibleText = (fraction) => {
  const limit = window.innerHeight * fraction;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const parts = [];
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim()) continue;
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    const style = getComputedStyle(node.parentElement);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (rect.width && rect.bottom > 0 && rect.top < limit)
      parts.push(node.textContent);
  }
  return parts.join(" ");
};

async function runAction(page, action) {
  if (action.do === "wait") return page.waitForTimeout(action.ms);
  if (action.do === "scroll") return page.mouse.wheel(0, action.y);
  if (action.do === "type")
    return page.keyboard.type(action.text, { delay: 25 });
  if (action.do === "click") {
    const target = action.name
      ? page.getByRole(action.role, { name: action.name, exact: true })
      : page.getByRole(action.role);
    // `ifPresent`: a switch that an earlier pass already flipped (AI on,
    // two-panel layout chosen) stays as it is.
    if (action.ifPresent && !(await target.first().isVisible())) return;
    return target.first().click({ timeout: 10_000 });
  }
  throw new Error(`Unknown story action: ${JSON.stringify(action)}`);
}

async function openDemoLedger(page, baseUrl) {
  await page.goto(`${baseUrl}/ledgers?demo=1`);
  await page
    .getByRole("button", { name: "Generate Data" })
    .click({ timeout: 30_000 });
  try {
    await page.getByText("Home Budget").first().waitFor({ timeout: 60_000 });
  } catch {
    throw new Error("Demo data did not finish loading");
  }
  // The name shows while demo data is still being written, and a redraw can
  // swallow the first tap, so try a few times.
  for (let attempt = 1; ; attempt++) {
    await page.getByText("Home Budget").first().click();
    try {
      await page.waitForURL(/dashboard/, { timeout: 15_000 });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

/**
 * Captures `shotIds` on `device` in each theme. Writes
 * `<outDir>/<device>-<theme>-<id>.png` and returns the paths.
 * `store` decides which anti-goal rules apply ("apple" | "play" | "mac").
 */
export async function captureShots({
  baseUrl,
  device,
  themes,
  shotIds,
  outDir,
  store = "mac",
}) {
  const spec = DEVICES[device];
  if (!spec) throw new Error(`Unknown capture device "${device}"`);
  mkdirSync(outDir, { recursive: true });
  const browser = await loadChromium();
  const written = [];
  try {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: spec.scale,
      isMobile: spec.mobile,
      hasTouch: spec.mobile,
    });
    await context.addInitScript(seedRandom, SEED);
    const page = await context.newPage();
    await page.clock.setFixedTime(FIXED_NOW);
    try {
      await openDemoLedger(page, baseUrl);
    } catch (error) {
      // Keep what the screen showed, so a failed run can be diagnosed.
      await page.screenshot({
        path: path.join(outDir, `failed-${device}.png`),
      });
      throw error;
    }

    for (const theme of themes) {
      await page.evaluate(
        (t) => localStorage.setItem("vite-ui-theme", t),
        theme,
      );
      await page.emulateMedia({ colorScheme: theme });
      for (const id of shotIds) {
        const shot = story.find((s) => s.id === id);
        // Shot 6 needs room for two panels; small tablets show it sideways.
        const sideways = shot.landscape?.includes(device);
        await page.setViewportSize(
          sideways
            ? { width: spec.height, height: spec.width }
            : { width: spec.width, height: spec.height },
        );
        await page.goto(`${baseUrl}${shot.route}`);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1500);
        for (const action of shot.actions) await runAction(page, action);
        // `cropBelow`: show the screen down to just below this text, measured
        // on each device (the agent card sits at a different height on each).
        let fraction = shot.visibleFraction ?? 1;
        if (shot.cropBelow) {
          const box = await page
            .getByText(shot.cropBelow)
            .first()
            .boundingBox();
          const height = page.viewportSize().height;
          if (box) {
            fraction = Math.min(1, (box.y + box.height + 6) / height);
            // On wide screens the card's note sits beside its title, so stop
            // above the card instead.
            const below = await page.evaluate(visibleText, fraction);
            if (findAntiGoals(below, "apple").length)
              fraction = Math.max(0.2, (box.y - 24) / height);
          }
        }
        const text = await page.evaluate(visibleText, fraction);
        const problems = findAntiGoals(text, store);
        if (problems.length)
          throw new Error(
            `Shot ${id} on ${device} (${theme}): ${problems.join("; ")}`,
          );
        const file = path.join(outDir, `${device}-${theme}-${id}.png`);
        await page.screenshot({ path: file });
        writeFileSync(
          file.replace(/\.png$/, ".json"),
          JSON.stringify({ visibleFraction: fraction }),
        );
        written.push(file);
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  return written;
}

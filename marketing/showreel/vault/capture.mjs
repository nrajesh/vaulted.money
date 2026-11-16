/**
 * Captures the real app for the "You see everything. We see nothing." film.
 *
 * Every picture of the app in the film comes from here: the running app with
 * its demo data, driven like a person would (typing a search one key at a
 * time, applying it, opening pages) and photographed after every step. The
 * film plays those photographs back in order, so what moves on screen is what
 * the app did. The clock and Math.random are pinned (FIXED_NOW, SEED from
 * marketing/shared/capture.mjs), so every figure agrees across shots.
 *
 * The offline shot is taken with the browser's network switched off.
 *
 *   pnpm dev                                         # in another terminal
 *   node marketing/showreel/vault/capture.mjs        # → vault/out/shots/
 *
 * PLAYWRIGHT_MODULE points at a Playwright install if it is not resolvable.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { FIXED_NOW, SEED } from "../../shared/capture.mjs";
import { findAntiGoals } from "../../shared/antiGoals.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const BASE = process.env.APP_URL ?? "http://127.0.0.1:8081";
const OUT = path.join(import.meta.dirname, "out/shots");
mkdirSync(OUT, { recursive: true });

const PHONE = { width: 440, height: 956 };
const QUERY = "groceries over 20 last month";
const OFFLINE_QUERY = QUERY; // the same question, with the network off

// Same generator as marketing/shared/capture.mjs, so the demo ledger matches
// the store screenshots.
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

/** The box of the first visible element whose text matches, as fractions of the viewport. */
const boxOf = (page, locator) =>
  locator
    .first()
    .boundingBox()
    .then((b) => {
      if (!b) return null;
      const { width, height } = page.viewportSize();
      return {
        x: b.x / width,
        y: b.y / height,
        w: b.width / width,
        h: b.height / height,
      };
    })
    .catch(() => null);

const notes = {};

async function shoot(page, name, { check = true } = {}) {
  if (check) {
    const text = await page.locator("body").innerText();
    // "0 selected" is an empty toolbar the app now hides; the rest are the
    // repo's never-show list for videos.
    const problems = findAntiGoals(text, "mac");
    if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`);
  }
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

async function openLedger(context, theme) {
  await context.addInitScript(seedRandom, SEED);
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto(`${BASE}/ledgers?demo=1`);
  await page
    .getByRole("button", { name: "Generate Data" })
    .click({ timeout: 30_000 });
  await page.getByText("Home Budget").first().waitFor({ timeout: 60_000 });
  for (let attempt = 1; ; attempt++) {
    await page.getByText("Home Budget").first().click();
    try {
      await page.waitForURL(/dashboard/, { timeout: 15_000 });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
  await page.evaluate((t) => localStorage.setItem("vite-ui-theme", t), theme);
  await page.emulateMedia({ colorScheme: theme });
  return page;
}

const go = async (page, route) => {
  await page.goto(`${BASE}${route}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
};

/** Types `text` into the search box, photographing after every key. */
async function typeSearch(page, prefix, text) {
  await page.getByRole("combobox").first().click();
  await page.waitForTimeout(400);
  await shoot(page, `${prefix}-00`, { check: false });
  for (let i = 0; i < text.length; i++) {
    await page.keyboard.type(text[i]);
    await page.waitForTimeout(90);
    await shoot(page, `${prefix}-${String(i + 1).padStart(2, "0")}`, {
      check: false,
    });
  }
  await page.keyboard.type(" ");
  await page.waitForTimeout(900);
  await shoot(page, `${prefix}-understood`, { check: false });
  notes[`${prefix}-understood`] = {
    input: await boxOf(page, page.getByRole("combobox")),
    panel: await boxOf(page, page.getByText("Understood as")),
    apply: await boxOf(page, page.getByText(/^Apply all/)),
  };
  await page
    .getByText(/^Apply all/)
    .first()
    .click();
  await page.waitForTimeout(500);
  const done = page.getByRole("button", { name: "Done", exact: true });
  if (
    await done
      .first()
      .isVisible()
      .catch(() => false)
  )
    await done.first().click();
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(1200);
  await shoot(page, `${prefix}-result`, { check: false });
  notes[`${prefix}-result`] = { frames: text.length };
}

const browser = await chromium.launch();
try {
  // ── Phone, light theme: "you see everything" ────────────────────────────
  {
    const context = await browser.newContext({
      viewport: PHONE,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await openLedger(context, "light");

    await go(page, "/transactions");
    await shoot(page, "list");
    // The rows the opening's loose amounts fly to: text and position.
    notes.list = {
      rows: await page.evaluate(() => {
        const W = innerWidth;
        const H = innerHeight;
        const out = [];
        for (const el of document.querySelectorAll("main *")) {
          if (el.children.length) continue;
          const text = el.textContent.trim();
          if (!/^[-+]?[€$£]|^-?[A-Z]{0,3}\$?[€$£]?-?\d[\d,.]*$/.test(text))
            continue;
          if (!/\d\.\d\d$/.test(text)) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.top < 150 || r.bottom > H - 80) continue;
          out.push({
            text,
            x: r.left / W,
            y: r.top / H,
            w: r.width / W,
            h: r.height / H,
          });
        }
        return out;
      }),
    };

    await go(page, "/analytics");
    await page.mouse.wheel(0, 150);
    await page
      .getByRole("button", { name: "Pie chart", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1500);
    await shoot(page, "charts");
    notes.charts = {
      total: await boxOf(page, page.getByText("Total spent")),
      ring: await boxOf(page, page.locator("svg.recharts-surface")),
    };
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(800);
    await shoot(page, "charts-categories");

    await go(page, "/transactions");
    await typeSearch(page, "search", QUERY);

    // Spending insights: one budget over beside budgets with money left.
    await go(page, "/insights");
    const over = page.getByText(/over budget$/).last();
    await over.scrollIntoViewIfNeeded();
    const y = (await over.boundingBox()).y;
    await page.mouse.wheel(0, y - 300);
    await page.waitForTimeout(800);
    await shoot(page, "budgets");
    notes.budgets = {
      over: await boxOf(page, page.getByText(/over budget$/).last()),
      left: await boxOf(page, page.getByText(/\d remaining$/)),
    };

    await go(page, "/calendar");
    await shoot(page, "calendar");
    // Open a day that is still to come.
    await page
      .getByRole("button", { name: /25/ })
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(700);
    await shoot(page, "calendar-day");
    await context.close();
  }

  // ── Phone, dark theme, network off: "we see nothing" ────────────────────
  {
    const context = await browser.newContext({
      viewport: PHONE,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await openLedger(context, "dark");
    await go(page, "/transactions");
    await shoot(page, "dark-list");
    await go(page, "/analytics");
    await page.mouse.wheel(0, 150);
    await page
      .getByRole("button", { name: "Pie chart", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1500);
    await shoot(page, "dark-charts");
    await go(page, "/transactions");
    await context.setOffline(true);
    await typeSearch(page, "offline", OFFLINE_QUERY);
    await context.setOffline(false);
    await context.close();
  }

  // ── Bigger screens, dark: the device family ─────────────────────────────
  for (const [name, viewport, scale, mobile] of [
    ["tablet", { width: 1032, height: 1376 }, 2, true],
    ["desktop", { width: 1440, height: 900 }, 2, false],
  ]) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: scale,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await openLedger(context, "dark");
    await go(page, "/analytics");
    await page
      .getByRole("button", { name: "Pie chart", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1500);
    await shoot(page, `${name}-charts`);
    await context.close();
  }
} finally {
  await browser.close();
}

writeFileSync(
  path.join(OUT, "notes.json"),
  JSON.stringify(
    { query: QUERY, offlineQuery: OFFLINE_QUERY, ...notes },
    null,
    1,
  ),
);
console.log(`✓ captures in ${OUT}`);

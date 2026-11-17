/**
 * Captures the real app for the Vaulted Money film: one feature per device.
 *
 * Every picture of the app in the film comes from here: the running app with
 * its demo data, at each device's own screen size, driven like a person would
 * (the search is typed one key at a time and photographed after each key).
 * The clock and Math.random are pinned (FIXED_NOW, SEED from
 * marketing/shared/capture.mjs), so every figure agrees across devices.
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
import { DEVICES } from "./capture.devices.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const BASE = process.env.APP_URL ?? "http://127.0.0.1:8081";
const OUT = path.join(import.meta.dirname, "out/shots");
mkdirSync(OUT, { recursive: true });

const QUERY = "groceries over 20 last month";

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

const notes = { query: QUERY };

/** The box of a locator's first match, as fractions of the viewport. */
const boxOf = async (page, locator) => {
  const b = await locator
    .first()
    .boundingBox()
    .catch(() => null);
  if (!b) return null;
  const { width, height } = page.viewportSize();
  return {
    x: b.x / width,
    y: b.y / height,
    w: b.width / width,
    h: b.height / height,
  };
};

async function shoot(page, name, { check = true } = {}) {
  if (check) {
    const problems = findAntiGoals(
      await page.locator("body").innerText(),
      "mac",
    );
    if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`);
  }
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

async function open(browser, device) {
  const spec = DEVICES[device];
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: spec.scale,
    isMobile: spec.mobile,
    hasTouch: spec.mobile,
  });
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
  await page.evaluate(
    (t) => localStorage.setItem("vite-ui-theme", t),
    spec.theme,
  );
  await page.emulateMedia({ colorScheme: spec.theme });
  return { context, page };
}

const go = async (page, route) => {
  await page.goto(`${BASE}${route}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1800);
};

/** Scrolls so `locator` sits `offset` px below the top of the screen. */
const bringTo = async (page, locator, offset) => {
  await locator.first().scrollIntoViewIfNeeded();
  const box = await locator.first().boundingBox();
  await page.mouse.wheel(0, box.y - offset);
  await page.waitForTimeout(1200);
};

/** Applies a search off camera (the film shows typing once, on the iPhone). */
async function applySearch(page, text, pick) {
  await page.getByRole("combobox").first().click();
  await page.keyboard.type(`${text} `);
  await page.waitForTimeout(900);
  await page.getByText(pick).first().click();
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
}

const browser = await chromium.launch();
try {
  // ── iPhone: plain-English search, typed key by key ──────────────────────
  {
    const { context, page } = await open(browser, "iphone");
    await go(page, "/transactions");
    await shoot(page, "iphone-list");
    // The rows the opening's loose amounts fly to.
    notes.rows = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("main *")) {
        if (el.children.length) continue;
        const text = el.textContent.trim();
        if (!/^-?[€$£]?-?[\d,]+\.\d\d$/.test(text.replace(/^US/, ""))) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || r.top < 150 || r.bottom > innerHeight - 80) continue;
        out.push({
          text,
          x: r.left / innerWidth,
          y: r.top / innerHeight,
          h: r.height / innerHeight,
        });
      }
      return out;
    });
    await page.getByRole("combobox").first().click();
    await page.waitForTimeout(400);
    await shoot(page, "iphone-search-00", { check: false });
    for (let i = 0; i < QUERY.length; i++) {
      await page.keyboard.type(QUERY[i]);
      await page.waitForTimeout(90);
      await shoot(page, `iphone-search-${String(i + 1).padStart(2, "0")}`, {
        check: false,
      });
    }
    await page.keyboard.type(" ");
    await page.waitForTimeout(900);
    await shoot(page, "iphone-understood", { check: false });
    notes.ask = {
      input: await boxOf(page, page.getByRole("combobox")),
      chips: await boxOf(page, page.getByText(/^Apply all/)),
    };
    await page
      .getByText(/^Apply all/)
      .first()
      .click();
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(1200);
    await shoot(page, "iphone-result", { check: false });
    await context.close();
  }

  // ── Android: subscriptions and bills that are coming up ─────────────────
  {
    const { context, page } = await open(browser, "android");
    await go(page, "/scheduled");
    // Narrow the list to subscriptions and household bills.
    for (const category of ["entertainment", "utilities"]) {
      try {
        await applySearch(
          page,
          category,
          new RegExp(`^Category: ${category}`, "i"),
        );
      } catch {
        await page.keyboard.press("Escape").catch(() => {});
      }
    }
    await bringTo(page, page.getByRole("checkbox").nth(0), 250);
    await shoot(page, "android-bills");
    notes.bills = { first: await boxOf(page, page.getByRole("checkbox")) };
    await context.close();
  }

  // ── iPad: this month's spending insights ────────────────────────────────
  {
    const { context, page } = await open(browser, "ipad");
    await go(page, "/insights");
    await shoot(page, "ipad-month");
    notes.month = {
      budgets: await boxOf(page, page.getByText("Budget Analysis")),
      payees: await boxOf(page, page.getByText("Top Payee Spending")),
    };
    await context.close();
  }

  // ── iPhone Duo: the money flow, folded and then opened out ─────────────
  for (const [device, name, offset] of [
    ["duoFolded", "duo-folded", 150],
    ["duo", "duo-flow", 360],
  ]) {
    const { context, page } = await open(browser, device);
    await go(page, "/reports/advanced");
    await applySearch(page, "this year", /^Date:/);
    await bringTo(page, page.getByText("Financial Flow"), 60);
    await page.mouse.wheel(0, offset);
    await page.waitForTimeout(1000);
    await shoot(page, name);
    await context.close();
  }

  // ── Desktop: the month as a line, as bars and as a ring; then AI ────────
  {
    const { context, page } = await open(browser, "desktop");
    await go(page, "/analytics");
    for (const [label, name] of [
      ["Line chart", "desktop-line"],
      ["Bar chart", "desktop-bar"],
      ["Pie chart", "desktop-pie"],
    ]) {
      await page
        .getByRole("button", { name: label, exact: true })
        .first()
        .click();
      await page.waitForTimeout(1500);
      // Park the pointer where it opens nothing (the sidebar widens on hover).
      await page.mouse.move(1000, 890);
      await page.waitForTimeout(500);
      await shoot(page, name);
    }
    // AI is off until it is switched on: photograph both sides of the switch.
    await go(page, "/ai-providers");
    await page.mouse.move(1000, 890);
    await shoot(page, "desktop-ai-off");
    notes.ai = { toggle: await boxOf(page, page.getByRole("switch")) };
    await page.getByRole("button", { name: "Turn on AI" }).click();
    await page.waitForTimeout(1500);
    await page.mouse.move(1000, 890);
    await shoot(page, "desktop-ai-on");
    await context.close();
  }
} finally {
  await browser.close();
}

writeFileSync(path.join(OUT, "notes.json"), JSON.stringify(notes, null, 1));
console.log(`✓ captures in ${OUT}`);

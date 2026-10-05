#!/usr/bin/env node
/**
 * Screenshots the REAL Vaulted Money app showing the data the API run created.
 *
 * Needs the app's dev server and out/backup-*.json from capture-api:
 *   pnpm exec vitest run --config marketing/api-demo/vitest.capture.config.ts
 *   node marketing/api-demo/capture-screens.mjs
 *
 * Environment: APP_URL (default: starts nothing, expects http://127.0.0.1:5199),
 * PLAYWRIGHT_MODULE (path to playwright's index.mjs).
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "out");
const SCREENS = join(OUT, "screens");
const APP = process.env.APP_URL || "http://127.0.0.1:5199";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
mkdirSync(SCREENS, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1100, height: 980 },
  deviceScaleFactor: 1.5,
  colorScheme: "dark",
});
const page = await context.newPage();
// "Today" is late September so the month views show the ledger's data.
await page.clock.install({ time: new Date("2026-09-30T10:00:00") });

/** Replace the app's data with a snapshot the API produced, then open it. */
async function load(name) {
  const { data } = JSON.parse(readFileSync(join(OUT, `backup-${name}.json`), "utf8"));
  await page.goto(`${APP}/ledgers`);
  await page.waitForTimeout(1200);
  await page.evaluate(async (payload) => {
    const m = await import("/src/providers/LocalDataProvider.ts");
    await new m.LocalDataProvider().importData(payload);
  }, data);
  await page.reload();
  await page.waitForTimeout(1500);
  await page.getByText("Home", { exact: true }).first().click();
  await page.waitForTimeout(1500);
}

async function shot(path, file, { clearDate = false, prepare } = {}) {
  await page.goto(`${APP}${path}`);
  await page.waitForTimeout(2200);
  if (clearDate) {
    const chip = page.getByText(/^Date:/).first();
    if (await chip.count()) {
      await chip.locator("xpath=..").locator("svg, button").last().click().catch(() => {});
      await page.waitForTimeout(800);
    }
  }
  await page.addStyleTag({ content: "button.fixed, .fixed.rounded-full { display: none !important; }" });
  if (prepare) await prepare();
  await page.mouse.move(1000, 700);
  await page.screenshot({ path: join(SCREENS, `${file}.png`) });
  console.log("•", file);
}

await load("imported");
await shot("/transactions", "tx-imported", { clearDate: true });

await load("history");
await shot("/transactions", "tx-history", { clearDate: true });

await load("mcp-added");
await shot("/transactions", "tx-mcp-added", { clearDate: true });

await load("mcp-imported");
await shot("/transactions", "tx-mcp-imported", { clearDate: true });
await shot("/dashboard", "dashboard-mcp");

await load("final");
await shot("/transactions", "tx-final", { clearDate: true });
await shot("/dashboard", "dashboard");
await shot("/analytics", "analytics");
await shot("/budgets", "budgets");
await shot("/accounts", "accounts");
await shot("/ai-providers", "ai-providers");

// The Local API card only has controls in the desktop app. Give a second page
// the Electron bridge's API surface so the REAL card renders as it does there
// (the app switches to hash routing when that bridge exists).
const TOKEN = JSON.parse(readFileSync(join(OUT, "api-run.json"), "utf8")).token;
const desktop = await context.newPage();
await desktop.setViewportSize({ width: 1440, height: 1500 });
await desktop.addInitScript((token) => {
  let status = {
    enabled: false, port: 47821, token, running: false,
    url: "http://127.0.0.1:47821/api/v1",
  };
  window.electron = {
    getApiConfig: async () => status,
    setApiConfig: async (u) => (status = { ...status, ...u, running: u.enabled ?? status.running }),
    regenerateApiToken: async () => status,
    onApiRequest: () => () => {},
    sendApiResponse: () => {},
  };
  window.__setApi = (enabled) => (status = { ...status, enabled, running: enabled });
}, TOKEN);
await desktop.goto(`${APP}/#/settings`);
await desktop.waitForTimeout(2500);
const card = async (file) => {
  await desktop.waitForTimeout(4500); // let the toast leave
  await desktop.mouse.move(1300, 850);
  await desktop.addStyleTag({ content: "button.fixed, .fixed.rounded-full { display: none !important; }" });
  const label = desktop.locator("label", { hasText: "Enable local API" }).first();
  await label.scrollIntoViewIfNeeded();
  // Climb from the label to the card (the first wide ancestor with a border).
  const clip = await label.evaluate((el) => {
    let node = el;
    while (node.parentElement) {
      node = node.parentElement;
      const style = getComputedStyle(node);
      if (node.getBoundingClientRect().width > 700 && parseFloat(style.borderTopWidth) > 0) break;
    }
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await desktop.screenshot({ path: join(SCREENS, `${file}.png`), clip });
  console.log("•", file);
};
await card("settings-api-off");
await desktop.getByRole("switch", { name: /enable local api/i }).click();
await desktop.waitForTimeout(800);
await card("settings-api-on");
await desktop.close();
// Light theme: the app reads its theme from localStorage ("vite-ui-theme").
await load("final");
await page.evaluate(() => localStorage.setItem("vite-ui-theme", "light"));
await shot("/dashboard", "dashboard-light");
await page.evaluate(() => localStorage.setItem("vite-ui-theme", "dark"));

await page.goto(`${APP}/ledgers`);
await page.waitForTimeout(1500);
await page.screenshot({ path: join(SCREENS, "ledgers.png") });

await browser.close();

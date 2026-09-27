#!/usr/bin/env node
/**
 * Captures the real app for the showreel.
 *
 * Starts the Vite dev server, opens the app in headless Chromium with a fresh
 * profile, generates the app's own demo data, walks through real flows
 * (CSV import, AI provider setup, "Categorize Missing") and screenshots each
 * screen in dark and light themes, on desktop and mobile. Everything lands in
 * out/screens/ with a manifest.json of element positions, so the film can
 * point at real buttons.
 *
 * Math.random is seeded before the app loads, so the demo data (and therefore
 * every number on screen) is the same on every run.
 *
 *   pnpm install                                   # the app's dependencies
 *   node marketing/showreel/capture.mjs            # → out/screens/
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { freePort, launchChrome, wait } from "./lib/chrome.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, "..", "..");
const OUT = join(ROOT, "out", "screens");
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 };
const TABLET = { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 3, mobile: true };

/**
 * A bank export as a user might download it. Payees are taken from the
 * ledger's own history, so "Categorize Missing" can match every row locally
 * (the same path a real user with history takes; no AI call is needed).
 */
function bankExport(payees, date) {
  const lines = payees.map(
    ({ vendor, amount }) =>
      `${date},Joint Checking,${vendor},${amount.toFixed(2)},EUR,Card payment`,
  );
  return (
    ["Date,Account,Payee,Amount,Currency,Notes", ...lines].join("\n") + "\n"
  );
}

/** Seeded Math.random, injected before any app script runs. */
const SEED_SCRIPT = `(() => {
  let state = 20260927;
  Math.random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
})();`;

/** Keeps screenshots free of transient toasts unless a shot wants one. */
const HIDE_TOASTS_CSS = `
html[data-hide-toasts] [role="region"][aria-label^="Notifications"],
html[data-hide-toasts] [data-sonner-toaster] { display: none !important; }
* { caret-color: transparent !important; }`;

async function startVite() {
  const port = await freePort();
  const vite = spawn(
    join(REPO, "node_modules", ".bin", "vite"),
    ["--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    { cwd: REPO, stdio: ["ignore", "pipe", "pipe"] },
  );
  vite.stdout.resume();
  vite.stderr.resume();
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => vite.kill() };
    } catch {
      // Still starting.
    }
    await wait(200);
  }
  vite.kill();
  throw new Error("Vite did not start. Did you run `pnpm install`?");
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const csvPath = join(OUT, "bank-export.csv");

  const vite = await startVite();
  const profile = mkdtempSync(join(tmpdir(), "vaulted-capture-"));
  const browser = await launchChrome({ ...DESKTOP, userDataDir: profile });
  const { session } = browser;
  const manifest = {
    desktop: DESKTOP,
    tablet: TABLET,
    mobile: MOBILE,
    screens: {},
  };

  await session.send("Page.addScriptToEvaluateOnNewDocument", {
    source: SEED_SCRIPT,
  });
  await session.send("DOM.enable");

  // ── Helpers ──────────────────────────────────────────────────────────────
  const evaluate = (expression) => session.evaluate(expression);

  async function viewport({
    width,
    height,
    deviceScaleFactor,
    mobile = false,
  }) {
    await session.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor,
      mobile,
    });
    await session.send("Emulation.setTouchEmulationEnabled", {
      enabled: mobile,
    });
  }

  async function settle(milliseconds = 1600) {
    // Park the pointer away from the hover-to-expand sidebar.
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: 1200,
      y: 760,
    });
    await wait(milliseconds);
  }

  async function goto(path, milliseconds) {
    await session.send("Page.navigate", { url: vite.url + path });
    await waitFor(`document.readyState === "complete"`);
    await evaluate(`(() => {
      const style = document.createElement("style");
      style.textContent = ${JSON.stringify(HIDE_TOASTS_CSS)};
      document.head.append(style);
      document.documentElement.dataset.hideToasts = "1";
    })()`);
    await settle(milliseconds);
  }

  async function waitFor(expression, timeout = 30000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await evaluate(expression).catch(() => false)) return;
      await wait(150);
    }
    throw new Error(`Timed out waiting for: ${expression}`);
  }

  const waitForText = (text, timeout) =>
    waitFor(
      `document.body.innerText.includes(${JSON.stringify(text)})`,
      timeout,
    );

  /** Click the first visible element whose text contains `text`. */
  async function click(text, selector = "button, a, [role=menuitem]") {
    const clicked = await evaluate(`(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((element) => element.offsetParent !== null &&
          element.textContent.trim().includes(${JSON.stringify(text)}));
      if (!target) return false;
      target.scrollIntoView({ block: "center" });
      target.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Nothing to click for "${text}"`);
    await wait(700);
  }

  async function typeInto(selector, text) {
    await evaluate(`(() => {
      const field = document.querySelector(${JSON.stringify(selector)});
      field.scrollIntoView({ block: "center" });
      field.focus();
    })()`);
    await session.send("Input.insertText", { text });
    await wait(150);
  }

  /**
   * Bounding boxes (CSS px) for callouts, keyed by name. Each query is
   * [selector, text?, minHeight?, excludeText?, nth?]. Among visible matches
   * that contain the text (and not excludeText) and are at least minHeight
   * tall, the innermost ones are kept and the nth is returned, so "the card
   * that says over budget" finds the card rather than the page around it.
   */
  async function rects(queries) {
    return evaluate(`(() => {
      const found = {};
      for (const [name, [selector, text, minHeight = 0, exclude, nth = 0]] of Object.entries(${JSON.stringify(queries)})) {
        const candidates = [...document.querySelectorAll(selector)].filter((element) => {
          // getClientRects (not offsetParent) so fixed dialogs count as visible.
          if (element.getClientRects().length === 0) return false;
          if (text && !element.textContent.includes(text)) return false;
          if (exclude && element.textContent.includes(exclude)) return false;
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height >= minHeight;
        });
        const innermost = candidates.filter(
          (element) => !candidates.some((other) => other !== element && element.contains(other)),
        );
        const match = innermost[nth];
        if (!match) continue;
        const box = match.getBoundingClientRect();
        found[name] = { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
      }
      return found;
    })()`);
  }

  /**
   * Screenshot the viewport (or a taller slice of the page when `fullHeight`
   * is set) and record it in the manifest with any element boxes.
   */
  async function shot(
    name,
    { queries = {}, fullHeight, clip, toasts = false } = {},
  ) {
    await evaluate(
      `document.documentElement.toggleAttribute("data-hide-toasts", ${!toasts})`,
    );
    await wait(250);
    const metrics = await session.send("Page.getLayoutMetrics");
    const width = metrics.cssLayoutViewport.clientWidth;
    let height = metrics.cssLayoutViewport.clientHeight;
    if (fullHeight) {
      height = Math.min(fullHeight, metrics.cssContentSize.height);
    }
    const area = clip ?? { x: 0, y: 0, width, height };
    const { data } = await session.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: Boolean(fullHeight || clip),
      clip: { ...area, scale: 1 },
    });
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, "base64"));
    manifest.screens[name] = {
      width: area.width,
      height: area.height,
      originX: area.x,
      originY: area.y,
      rects: await rects(queries),
    };
    console.log(`  ✓ ${name}`);
  }

  async function chooseCsv() {
    const { root } = await session.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: 'input[type=file][accept=".csv"]',
    });
    await session.send("DOM.setFileInputFiles", { nodeId, files: [csvPath] });
    await waitForText("Import Settings");
    await wait(800);
  }

  async function setTheme(theme) {
    await evaluate(`localStorage.setItem("vite-ui-theme", "${theme}")`);
  }

  async function openLedger(name) {
    await evaluate(`(() => {
      let card = [...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === ${JSON.stringify(name)});
      while (card && typeof card.onclick !== "function") card = card.parentElement;
      card.click();
    })()`);
    await waitFor(`location.pathname === "/dashboard"`);
    await settle(2500);
  }

  try {
    // ── Demo data, generated by the app itself ─────────────────────────────
    console.log("• Generating the app's demo data");
    await viewport(DESKTOP);
    await goto("/ledgers");
    await setTheme("dark");
    await goto("/ledgers");
    await click("Generate demo data");
    // The app reloads the page once generation has finished; a marker on
    // window tells us when that reload has happened.
    await evaluate(`window.__beforeDemoReload = true`);
    await click("Generate Data", "[role=alertdialog] button");
    await waitFor(
      `window.__beforeDemoReload === undefined && document.readyState === "complete" &&
        document.body.innerText.includes("Home Budget")`,
      180000,
    );
    await goto("/ledgers", 2000);
    await shot("desktop-ledgers-dark");
    await openLedger("Home Budget");

    // Six everyday payees this ledger has already categorised.
    const payees = await evaluate(`(async () => {
      const { db } = await import("/src/lib/dexieDB.ts");
      const ledgerId = localStorage.getItem("activeLedgerId");
      const history = await db.transactions.where("user_id").equals(ledgerId).toArray();
      const picked = new Map();
      for (const row of history) {
        if (!row.vendor || !row.category || row.transfer_id) continue;
        if (row.category === "Transfer" || row.amount >= 0 || row.amount < -250) continue;
        if (row.account !== "Joint Checking" || picked.has(row.vendor)) continue;
        picked.set(row.vendor, { vendor: row.vendor, amount: row.amount });
      }
      return [...picked.values()].slice(0, 6);
    })()`);
    if (payees.length < 4) {
      const sample = await evaluate(`(async () => {
        const { db } = await import("/src/lib/dexieDB.ts");
        const ledgerId = localStorage.getItem("activeLedgerId");
        const rows = await db.transactions.toArray();
        return JSON.stringify({ ledgerId, total: rows.length, sample: rows.slice(0, 2) });
      })()`);
      throw new Error(`Demo ledger has too little history: ${sample}`);
    }
    // Dated the last day of this month so the new rows sort to the top.
    const monthEnd = await evaluate(`(() => {
      const now = new Date();
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const pad = (value) => String(value).padStart(2, "0");
      return last.getFullYear() + "-" + pad(last.getMonth() + 1) + "-" + pad(last.getDate());
    })()`);
    writeFileSync(csvPath, bankExport(payees, monthEnd));

    // ── Desktop, dark ──────────────────────────────────────────────────────
    console.log("• Desktop screens (dark)");
    await shot("desktop-dashboard-dark", {
      fullHeight: 1500,
      queries: {
        overview: ["div", "Overview", 110],
        runway: ["div", "Financial Runway", 200],
        spending: ["div", "Spending by Category", 300],
      },
    });
    await goto("/transactions", 2200);
    await shot("desktop-transactions-dark", {
      queries: {
        importCsv: ["button", "Import CSV"],
        categorize: ["button", "Categorize Missing"],
      },
    });

    // CSV import: the real two-step dialog.
    const accountFilter = await evaluate(
      `localStorage.getItem("filter_selectedAccounts")`,
    );
    await chooseCsv();
    await shot("desktop-import-settings-dark", {
      queries: { dialog: ["[role=dialog]"], preview: ["[role=dialog] table"] },
    });
    await click("Next", "[role=dialog] button");
    await waitForText("Map Columns");
    await wait(900);
    await shot("desktop-import-map-dark", {
      queries: { dialog: ["[role=dialog]"] },
    });
    await click("Import Transactions", "[role=dialog] button");
    await wait(2000);
    // The importer narrows the list to the imported accounts; put the
    // account filter back so later screens show the whole ledger.
    await evaluate(`(() => {
      const previous = ${JSON.stringify(accountFilter)};
      if (previous === null) localStorage.removeItem("filter_selectedAccounts");
      else localStorage.setItem("filter_selectedAccounts", previous);
    })()`);
    await goto("/transactions", 2200);
    await waitFor(
      `document.querySelector("table")?.innerText.includes("Uncategorized")`,
    );
    await shot("desktop-transactions-imported-dark", {
      queries: {
        table: ["table"],
        header: ["thead"],
        firstRow: ["tbody tr"],
        categoryHeader: ["th", "Category"],
        subCategoryHeader: ["th", "Sub-category"],
        categorize: ["button", "Categorize Missing"],
        importCsv: ["button", "Import CSV"],
      },
    });

    // Optional AI: a local, OpenAI-compatible model as the provider.
    await goto("/ai-providers", 1800);
    await click("Add AI Provider");
    await waitForText("Add AI Provider");
    await typeInto(
      '[role=dialog] input[placeholder^="e.g., Local"]',
      "Local Llama",
    );
    await typeInto('[role=dialog] input[placeholder^="e.g., gpt"]', "llama3.1");
    await typeInto(
      '[role=dialog] input[placeholder^="https"]',
      "http://localhost:11434/v1",
    );
    await typeInto("[role=dialog] textarea", "Runs on this machine");
    await click(
      "Set as default provider",
      "[role=dialog] label, [role=dialog] button",
    );
    await shot("desktop-ai-provider-dark", {
      queries: { dialog: ["[role=dialog]"] },
    });
    await click("Save Provider", "[role=dialog] button");
    await settle(1500);
    await shot("desktop-ai-providers-dark", {
      queries: { table: ["table"], row: ["tbody tr"], title: ["h1"] },
    });

    await goto("/settings", 1800);
    await typeInto("#ai-api-key", "local-model");
    await waitFor(`Object.keys(localStorage).some((key) =>
      key.startsWith("vaultedmoney_ai_apiKey_") && localStorage.getItem(key))`);
    await evaluate(`document.activeElement.blur()`);
    await settle(1200);
    const aiCard = await evaluate(`(() => {
      const heading = [...document.querySelectorAll("h1,h2,h3,div")].find((e) => e.textContent.trim() === "AI Integrations (BYOK)");
      let card = heading;
      while (card && card.getBoundingClientRect().height < 280) card = card.parentElement;
      card.scrollIntoView({ block: "center" });
      const box = card.getBoundingClientRect();
      return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
    })()`);
    await wait(500);
    await shot("desktop-settings-ai-dark", { clip: aiCard });

    // "Categorize Missing": matched from the ledger's own history.
    await goto("/transactions", 2200);
    await click("Categorize Missing");
    await waitFor(
      `!document.querySelector("table")?.innerText.includes("Uncategorized")`,
    );
    await settle(1200);
    await shot("desktop-transactions-categorized-dark", {
      toasts: true,
      queries: {
        table: ["table"],
        header: ["thead"],
        firstRow: ["tbody tr"],
        categoryHeader: ["th", "Category"],
        subCategoryHeader: ["th", "Sub-category"],
        categorize: ["button", "Categorize Missing"],
        toast: ["li, [data-sonner-toast]", "Categorized", 40],
      },
    });

    await goto("/budgets", 2400);
    await shot("desktop-budgets-dark", {
      queries: {
        summary: ["div", "Avg. Monthly Budget", 90],
        overBudget: ["div", "over budget", 160],
        onTrack: ["div", "remaining", 160, "-€"],
        activeBudgets: ["h2, h3, div", "Active Budgets", 20],
      },
    });
    await goto("/insights", 2400);
    await shot("desktop-insights-dark", {
      queries: {
        alertA: ["div", "You have exceeded", 190, null, 0],
        alertB: ["div", "You have exceeded", 190, null, 1],
      },
    });
    await goto("/analytics", 2800);
    await shot("desktop-analytics-dark", { fullHeight: 1500 });
    await goto("/calendar", 2400);
    await shot("desktop-calendar-dark");
    await goto("/reports/essential", 2800);
    await shot("desktop-reports-essential-dark", {
      fullHeight: 1900,
      queries: {
        pdf: ["button", "PDF"],
        excel: ["button", "Excel"],
        csv: ["button", "CSV"],
        netWorth: ["div", "Net Worth Statement", 150],
      },
    });
    await goto("/reports/advanced", 3200);
    const sankey = await evaluate(`(() => {
      const heading = [...document.querySelectorAll("h1,h2,h3,div")].find((e) => e.textContent.trim().startsWith("Financial Flow"));
      let card = heading;
      while (card && card.getBoundingClientRect().height < 500) card = card.parentElement;
      card.scrollIntoView({ block: "center" });
      const box = card.getBoundingClientRect();
      return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: Math.min(box.height, 1100) };
    })()`);
    await wait(1200);
    await shot("desktop-reports-sankey-dark", { clip: sankey });

    // ── Desktop, light (the gold and navy mark) ────────────────────────────
    console.log("• Desktop screens (light)");
    await setTheme("light");
    await goto("/ledgers", 2000);
    await shot("desktop-ledgers-light");
    await goto("/dashboard", 2600);
    await shot("desktop-dashboard-light");
    await goto("/transactions", 2200);
    await shot("desktop-transactions-light");
    await goto("/budgets", 2400);
    await shot("desktop-budgets-light");
    await goto("/reports/essential", 2800);
    await shot("desktop-reports-essential-light");

    // ── Tablet (landscape) ─────────────────────────────────────────────────
    console.log("• Tablet screens");
    await viewport(TABLET);
    await setTheme("light");
    await goto("/budgets", 2600);
    await shot("tablet-budgets-light");
    await setTheme("dark");
    await goto("/calendar", 2600);
    await shot("tablet-calendar-dark");

    // ── Mobile ─────────────────────────────────────────────────────────────
    console.log("• Mobile screens");
    await viewport(MOBILE);
    for (const theme of ["dark", "light"]) {
      await setTheme(theme);
      await goto("/transactions", 2600);
      await shot(`mobile-transactions-${theme}`, { fullHeight: 2400 });
      await goto("/budgets", 2600);
      await shot(`mobile-budgets-${theme}`, { fullHeight: 2400 });
      await goto("/analytics", 3000);
      await shot(`mobile-analytics-${theme}`, { fullHeight: 2400 });
      await goto("/ledgers", 2000);
      await shot(`mobile-ledgers-${theme}`);
    }

    writeFileSync(
      join(OUT, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log(
      `✓ ${Object.keys(manifest.screens).length} screens → out/screens/`,
    );
  } catch (error) {
    // Leave evidence of where the flow went wrong.
    const { data } = await session.send("Page.captureScreenshot", {
      format: "png",
    });
    writeFileSync(join(OUT, "_failure.png"), Buffer.from(data, "base64"));
    console.error("  (screenshot of the failure: out/screens/_failure.png)");
    throw error;
  } finally {
    browser.close();
    vite.stop();
    await wait(300);
    // Chromium may still be flushing its profile; never mask the real error.
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    } catch {
      console.warn(`  (could not remove temporary profile ${profile})`);
    }
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.stack ?? error}`);
  process.exit(1);
});

/**
 * Records a REAL run of the Local API for the explainer video.
 *
 * Boots the production ApiServer on a real loopback socket, with the real
 * router and the real Dexie data provider (fake-indexeddb under vitest), then
 * plays the story the film tells: ledger → account → transactions → CSV import
 * → categorise (history, then opt-in AI) → analytics → budget → security
 * probes → backup. Every request and response is written to out/api-run.json.
 *
 * The only stand-in is the "AI": a tiny OpenAI-compatible server on 127.0.0.1
 * that records exactly what it was sent, so the film can prove vendor names
 * (and no amounts) are all that leave the API.
 *
 *   pnpm exec vitest run --config marketing/api-demo/vitest.capture.config.ts
 */
import * as http from "http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { ApiServer } from "../../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "@/api/handleRequest";
import type { ApiRequest } from "@/api/http";

const OUT = join(__dirname, "out");
const TOKEN = "vm_live_9fKq2xT7LbZ0aPwR4dYcN8sHuE3jVmG6oXtQ1iBzA5k";
const PORT = 47821;
const AI_PORT = 11434;
const dataProvider = new LocalDataProvider();

type Step = {
  id: string;
  label: string;
  method: string;
  path: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  status: number;
  responseHeaders: Record<string, string>;
  response: unknown;
};
const steps: Step[] = [];
const extra: Record<string, unknown> = {};

function raw(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string }>(
    (resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port: PORT,
          path,
          method,
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
            ...headers,
          },
        },
        (res) => {
          let text = "";
          res.on("data", (c) => (text += c));
          res.on("end", () =>
            resolve({ status: res.statusCode ?? 0, headers: res.headers, text }),
          );
        },
      );
      req.on("error", reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    },
  );
}

async function call(
  id: string,
  label: string,
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
) {
  const res = await raw(method, `/api/v1${path}`, body, headers);
  let parsed: unknown = res.text;
  try {
    parsed = res.text ? JSON.parse(res.text) : null;
  } catch {
    // CSV and other non-JSON bodies stay as text.
  }
  steps.push({
    id,
    label,
    method,
    path: `/api/v1${path}`,
    requestHeaders: headers,
    requestBody: body,
    status: res.status,
    responseHeaders: {
      "content-type": String(res.headers["content-type"] ?? ""),
      "content-disposition": String(res.headers["content-disposition"] ?? ""),
    },
    response: parsed,
  });
  return { status: res.status, json: parsed as any, text: res.text };
}

it("records the explainer-video API run", async () => {
  mkdirSync(OUT, { recursive: true });
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  localStorage.clear();

  // A local stand-in for a user's own model; remembers what it was sent.
  const aiRequests: { url: string; authorization?: string; body: any }[] = [];
  const aiServer = http.createServer((req, res) => {
    let text = "";
    req.on("data", (c) => (text += c));
    req.on("end", () => {
      const body = JSON.parse(text || "{}");
      aiRequests.push({ url: req.url ?? "", authorization: req.headers.authorization, body });
      const prompt: string = body.messages?.[0]?.content ?? "";
      const asked: string[] = JSON.parse(prompt.match(/Vendors\/Payees to Categorize:\n(\[.*\])/)?.[1] ?? "[]");
      const guess: Record<string, [string, string]> = {
        "Trattoria Roma": ["Food", "Dining out"],
        "StreamBox": ["Entertainment", "Subscriptions"],
        "Green Energy Co": ["Utilities", "Electricity"],
        "Pharma Plus": ["Health", "Pharmacy"],
      };
      const out: Record<string, { categoryName: string; subCategoryName: string }> = {};
      for (const v of asked) {
        const g = guess[v];
        if (g) out[v] = { categoryName: g[0], subCategoryName: g[1] };
      }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(out) } }] }));
    });
  });
  await new Promise<void>((r) => aiServer.listen(AI_PORT, "127.0.0.1", r));

  const server = new ApiServer((request) =>
    handleApiRequest(request as ApiRequest, { dataProvider }),
  );
  await server.start(PORT, TOKEN);

  try {
    // ── 0. Ledger ────────────────────────────────────────────────────────
    await call("ledgers-empty", "Fresh install: no ledgers", "GET", "/ledgers");
    const ledger = (await call("ledger", "Create a ledger", "POST", "/ledgers", { name: "Home", currency: "EUR" })).json;
    const L = `/ledgers/${ledger.id}`;

    // ── 1. Accounts ──────────────────────────────────────────────────────
    await call("account", "Add an account", "POST", `${L}/accounts`, {
      name: "Checking", currency: "EUR", starting_balance: 2400, type: "Checking",
    });
    await call("account2", "Add a second account", "POST", `${L}/accounts`, {
      name: "Savings", currency: "EUR", starting_balance: 12000, type: "Savings",
    });

    // Categories the AI will be allowed to choose from.
    for (const [name, subs] of [
      ["Food", ["Groceries", "Dining out"]],
      ["Housing", ["Rent"]],
      ["Transport", ["Public transit"]],
      ["Utilities", ["Electricity"]],
      ["Entertainment", ["Subscriptions"]],
      ["Health", ["Pharmacy"]],
      ["Income", ["Salary"]],
    ] as const) {
      await call(`cat-${name}`, `Category ${name}`, "POST", `${L}/categories`, { name, sub_categories: subs });
    }

    // ── 2. Add transactions one by one (builds the history) ──────────────
    await call("tx1", "Add a transaction", "POST", `${L}/transactions`, {
      date: "2026-09-01", amount: -42.5, account: "Checking", vendor: "Corner Market", category: "Food", sub_category: "Groceries",
    });
    await call("tx-bulk", "Add several at once", "POST", `${L}/transactions/bulk`, {
      transactions: [
        { date: "2026-09-01", amount: 3200, account: "Checking", vendor: "Acme Payroll", category: "Income", sub_category: "Salary" },
        { date: "2026-09-02", amount: -1150, account: "Checking", vendor: "Landlord", category: "Housing", sub_category: "Rent" },
        { date: "2026-09-03", amount: -62, account: "Checking", vendor: "City Transit", category: "Transport", sub_category: "Public transit" },
      ],
    });

    // ── 3. Import a bank statement (CSV) ─────────────────────────────────
    const header = "Date;Account;Vendor;Category;Amount;Remarks;Currency;transfer_id;is_scheduled_origin;Frequency;End Date";
    const rows = [
      ["05/09/2026", "Corner Market", "-38.20"],
      ["06/09/2026", "Trattoria Roma", "-54.00"],
      ["08/09/2026", "StreamBox", "-12.99"],
      ["09/09/2026", "City Transit", "-62.00"],
      ["11/09/2026", "Green Energy Co", "-88.40"],
      ["13/09/2026", "Corner Market", "-27.80"],
      ["15/09/2026", "Pharma Plus", "-19.45"],
      ["18/09/2026", "Trattoria Roma", "-47.50"],
      ["22/09/2026", "Corner Market", "-51.10"],
      ["27/09/2026", "StreamBox", "-12.99"],
    ].map(([d, v, a]) => `${d};Checking;${v};;${a};Card payment;EUR;;;;`);
    const csv = [header, ...rows].join("\n") + "\n";
    extra.csv = csv;
    await call("import-dry", "Preview the CSV (dry run)", "POST", `${L}/transactions/import`, { csv, dry_run: true });
    await call("import", "Import the CSV", "POST", `${L}/transactions/import`, { csv });
    // Snapshots let the film show the real app before and after each step.
    const snapshot = async (name: string) =>
      writeFileSync(join(OUT, `backup-${name}.json`), (await raw("GET", "/api/v1/backups/export")).text);
    await snapshot("imported");

    // ── 4. Categorise: history first ─────────────────────────────────────
    await call("cat-dry", "Categorise: preview", "POST", `${L}/transactions/categorize-missing`, { dry_run: true });
    await call("cat-hist", "Categorise from history", "POST", `${L}/transactions/categorize-missing`, {});
    await snapshot("history");

    // ── 5. Optional AI ───────────────────────────────────────────────────
    await call("ai-none", "AI requested but not configured", "POST", `${L}/transactions/categorize-missing`, { use_ai: true });
    const provider = (await call("ai-provider", "Register a local model", "POST", "/ai-providers", {
      name: "Local model", type: "CUSTOM", baseUrl: `http://127.0.0.1:${AI_PORT}/v1`, model: "llama3", isDefault: true,
    })).json;
    await call("ai-key", "Store its key (write-only)", "PUT", `/ai-providers/${provider.id}/api-key`, { api_key: "sk-local-demo-key" });
    await call("ai-list", "List providers: key is never returned", "GET", "/ai-providers");
    aiRequests.length = 0;
    await call("ai-dry", "AI categorise: preview", "POST", `${L}/transactions/categorize-missing`, { use_ai: true, dry_run: true });
    extra.aiRequest = aiRequests[0] ?? null;
    await call("ai", "AI categorise", "POST", `${L}/transactions/categorize-missing`, { use_ai: true });

    // ── 6. Insights ──────────────────────────────────────────────────────
    await call("analytics", "Analytics for September", "GET", `${L}/analytics?from=2026-09-01&to=2026-09-30&group_by=month`);
    await call("insights", "Insights", "GET", `${L}/insights`);
    await call("budget", "Create a budget", "POST", `${L}/budgets`, {
      budget_scope: "category", category: "Food", target_amount: 250, frequency: "Monthly", start_date: "2026-09-01",
    });
    await call("report-csv", "Income & expense report as CSV", "GET", `${L}/reports/income-expense?from=2026-09-01&format=csv`);
    await call("txlist", "List transactions", "GET", `${L}/transactions?type=expense&limit=5`);

    // ── 7. Security probes ───────────────────────────────────────────────
    await call("sec-nobearer", "No token", "GET", "/ledgers", undefined, { Authorization: "" });
    await call("sec-wrong", "Wrong token", "GET", "/ledgers", undefined, { Authorization: "Bearer nope" });
    await call("sec-origin", "Browser origin", "GET", "/ledgers", undefined, { Origin: "https://evil.example" });

    // ── 8. OpenAPI + index ───────────────────────────────────────────────
    const oa = await call("openapi", "OpenAPI description", "GET", "/openapi.json");
    const index = await call("index", "Endpoint index", "GET", "");
    extra.openapi = {
      version: oa.json.openapi,
      title: oa.json.info?.title,
      paths: Object.keys(oa.json.paths).length,
      operations: Object.values(oa.json.paths).reduce((n: number, p: any) => n + Object.keys(p).length, 0),
      tags: [...new Set(Object.values(oa.json.paths).flatMap((p: any) => Object.values(p).flatMap((o: any) => o.tags ?? [])))],
      sample: oa.json.paths[`/ledgers/{ledgerId}/transactions/categorize-missing`],
      bytes: oa.text.length,
    };
    extra.routeCount = index.json?.endpoints?.length ?? index.json?.routes?.length ?? null;

    // ── 9. Backups ───────────────────────────────────────────────────────
    const backup = await call("backup", "Encrypted backup", "POST", "/backups/export", { password: "correct horse battery" });
    extra.backupHead = backup.text.slice(0, 120);
    const plain = await raw("GET", "/api/v1/backups/export");
    writeFileSync(join(OUT, "backup-final.json"), plain.text);

    expect(steps.find((s) => s.id === "ai")?.status).toBe(200);
  } finally {
    await server.stop();
    await new Promise((r) => aiServer.close(r));
  }
  writeFileSync(join(OUT, "api-run.json"), JSON.stringify({ token: TOKEN, steps, extra }, null, 2));
});

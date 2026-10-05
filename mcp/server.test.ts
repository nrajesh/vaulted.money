import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiServer } from "../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "@/api/handleRequest";
import type { ApiRequest } from "@/api/http";
// @ts-expect-error plain ESM module without types
import { createServer, normalizeBankCsv, parseCsv, resolvePeriod } from "./server.mjs";

/**
 * The MCP tools against the real HTTP server, router and Dexie (only the
 * Electron IPC hop is replaced by a direct call), as an agent would use them.
 */
const TOKEN = "m".repeat(43);
const dataProvider = new LocalDataProvider();

describe("MCP server tools", () => {
  let api: ApiServer;
  let mcp: ReturnType<typeof createServer>;
  let files: Record<string, string>;
  let base: string;
  const post = (path: string, body: unknown) =>
    fetch(base + path, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const run = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await mcp.call(name, args);
    const body = result.content[0].text as string;
    return { isError: !!result.isError, text: body, json: result.isError ? undefined : JSON.parse(body) };
  };

  beforeEach(async () => {
    await db.open();
    await Promise.all(db.tables.map((t) => t.clear()));
    api = new ApiServer((request) => handleApiRequest(request as ApiRequest, { dataProvider }));
    const port = 20000 + Math.floor(Math.random() * 20000);
    await api.start(port, TOKEN);
    files = {};
    base = `http://127.0.0.1:${port}/api/v1`;
    mcp = createServer({
      baseUrl: base,
      token: TOKEN,
      readFile: (p: string) => {
        if (!(p in files)) throw new Error("ENOENT");
        return files[p];
      },
    });
    await post("/ledgers", { name: "Home", currency: "EUR" });
  });
  afterEach(() => api.stop());

  it("exposes a small tool set over the MCP protocol", async () => {
    const init = await mcp.handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } });
    expect(init.result.serverInfo.name).toBe("vaulted-money");
    expect(await mcp.handle({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeUndefined();
    const list = await mcp.handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(list.result.tools.map((t: { name: string }) => t.name)).toEqual([
      "list_ledgers", "spending_summary", "find_transactions", "budgets_and_insights", "search_api", "call_api", "add_transaction", "import_csv",
    ]);
    const unknown = await mcp.handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } });
    expect(unknown.error.code).toBe(-32602);
  });

  it("adds a transaction, then answers where the money went", async () => {
    await run("add_transaction", { date: "2026-09-01", amount: 3200, account: "Checking", vendor: "Acme", category: "Income" });
    const added = await run("add_transaction", { date: "2026-09-02", amount: -80, account: "Checking", vendor: "Corner Market", category: "Food" });
    expect(added.json).toMatchObject({ created: true, amount: -80, vendor: "Corner Market" });
    expect((await run("list_ledgers")).json[0].accounts[0]).toMatchObject({ name: "Checking" });

    const summary = await run("spending_summary", { from: "2026-09-01", to: "2026-09-30" });
    expect(summary.json.period).toEqual({ label: "custom", from: "2026-09-01", to: "2026-09-30" });
    expect(summary.json.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(summary.json.totals).toMatchObject({ income: 3200, expenses: 80 });
    expect(summary.json.by_category[0]).toMatchObject({ category: "Food", spent: 80 });

    const found = await run("find_transactions", { search: "Corner", from: "2026-09-01", to: "2026-09-30" });
    expect(found.json).toMatchObject({ total_matches: 1, sum_of_shown: -80 });
  });

  it("answers for a named period using the server's clock, and re-reads the token", async () => {
    let token = "stale";
    const clocked = createServer({ baseUrl: base, getToken: () => token, now: () => new Date(2026, 9, 5) });
    const stale = await clocked.handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_ledgers", arguments: {} } });
    expect(stale.result.isError).toBe(true);
    expect(stale.result.content[0].text).toContain("401");
    token = TOKEN; // regenerated and saved: no restart needed
    await run("add_transaction", { date: "2026-09-10", amount: -20, account: "Checking", vendor: "Kiosk", category: "Food" });
    const r = await clocked.call("spending_summary", { period: "last_30_days" });
    const j = JSON.parse(r.content[0].text);
    expect(j).toMatchObject({ today: "2026-10-05", period: { label: "last_30_days", from: "2026-09-06", to: "2026-10-05" } });
    expect(j.totals.expenses).toBe(20);
  });

  it("maps a bank CSV, previews first and imports on request", async () => {
    files["/tmp/bank.csv"] = 'Booking Date,Description,Amount\n2026-09-05,"Cafe, Central","-4,50"\n2026-09-06,Landlord,-1150.00\n';
    const preview = await run("import_csv", { path: "/tmp/bank.csv", account: "Checking" });
    expect(preview.json).toMatchObject({ dry_run: true, rows_in_file: 2 });
    expect(preview.json.column_mapping).toMatchObject({ Date: "Booking Date", Vendor: "Description", Amount: "Amount" });
    expect((await run("find_transactions", {})).json.total_matches).toBe(0);

    const done = await run("import_csv", { path: "/tmp/bank.csv", account: "Checking", dry_run: false });
    expect(done.json.result).toMatchObject({ imported: 2 });
    const rows = (await run("find_transactions", { sort: "x" })).json.transactions;
    expect(rows.map((t: { amount: number }) => t.amount).sort()).toEqual([-1150, -4.5]);
  });

  it("reports unreadable or unmappable files without calling the API", async () => {
    expect((await run("import_csv", { path: "/missing.csv" })).isError).toBe(true);
    files["/tmp/odd.csv"] = "foo,bar\n1,2\n";
    const bad = await run("import_csv", { path: "/tmp/odd.csv", account: "Checking" });
    expect(bad.isError).toBe(true);
    expect(bad.text).toContain("No column found for Date");
  });

  it("previews destructive calls and only runs them when confirmed", async () => {
    await run("add_transaction", { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" });
    const accounts = (await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data;
    const path = `/ledgers/{ledgerId}/accounts/${accounts[0].id}`;

    const preview = await run("call_api", { method: "DELETE", path });
    expect(preview.json).toMatchObject({ preview: true, executed: false });
    expect((await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data).toHaveLength(1);

    const done = await run("call_api", { method: "DELETE", path, confirm: true });
    expect(done.json).toEqual({ deleted: true });
    expect((await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data).toHaveLength(0);
  });

  it("lets the API itself preview endpoints that support dry_run", async () => {
    await run("add_transaction", { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "" });
    const preview = await run("call_api", { method: "POST", path: "/ledgers/{ledgerId}/transactions/categorize-missing", body: {} });
    expect(preview.json).toMatchObject({ preview: true, result: { dry_run: true } });
  });

  it("finds the rest of the API with search_api", async () => {
    const hits = (await run("search_api", { query: "merge vendors" })).json;
    expect(hits[0]).toMatchObject({ method: "POST", path: "/ledgers/{ledgerId}/vendors/merge" });
    expect(hits[0].body).toHaveProperty("target*");
  });

  it("asks which ledger when there are several, and accepts a name", async () => {
    await post("/ledgers", { name: "Work", currency: "USD" });
    const fresh = createServer({ baseUrl: base, token: TOKEN });
    const via = (args: object) => fresh.handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "spending_summary", arguments: args } });
    const ambiguous = (await via({})).result;
    expect(ambiguous.isError).toBe(true);
    expect(ambiguous.content[0].text).toContain("Home");
    const named = (await via({ ledger: "work" })).result;
    expect(JSON.parse(named.content[0].text)).toMatchObject({ ledger: "Work", currency: "USD" });
  });
});

describe("CSV helpers", () => {
  it("parses quoted cells and European amounts", () => {
    expect(parseCsv('a,b\n"x, y","1,5"\n', ",")).toEqual([["a", "b"], ["x, y", "1,5"]]);
    const n = normalizeBankCsv("Date;Payee;Value\n05.09.2026;Shop;1.234,56\n", { account: "A", currency: "EUR" });
    expect(n.csv).toContain("05/09/2026;A;Shop;;1234.56;;EUR");
  });
});

describe("periods", () => {
  const now = new Date(2026, 9, 5); // 5 Oct 2026
  it("resolves named periods to exact dates", () => {
    expect(resolvePeriod({}, now)).toEqual({ label: "last_30_days", from: "2026-09-06", to: "2026-10-05" });
    expect(resolvePeriod({ period: "this_month" }, now)).toMatchObject({ from: "2026-10-01", to: "2026-10-05" });
    expect(resolvePeriod({ period: "last_month" }, now)).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
    expect(resolvePeriod({ period: "last_7_days" }, now)).toMatchObject({ from: "2026-09-29", to: "2026-10-05" });
    expect(resolvePeriod({ period: "last_90_days" }, now)).toMatchObject({ from: "2026-07-08", to: "2026-10-05" });
    expect(resolvePeriod({ period: "this_year" }, now)).toMatchObject({ from: "2026-01-01", to: "2026-10-05" });
    expect(resolvePeriod({ period: "last_year" }, now)).toMatchObject({ from: "2025-01-01", to: "2025-12-31" });
    expect(resolvePeriod({ from: "2026-02-01" }, now)).toMatchObject({ label: "custom", from: "2026-02-01", to: "2026-10-05" });
    expect(() => resolvePeriod({ period: "yesterday" }, now)).toThrow(/Unknown period/);
  });
});

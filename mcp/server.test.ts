import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiServer } from "../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "@/api/handleRequest";
import type { ApiRequest } from "@/api/http";
// @ts-expect-error plain ESM module without types
import { createServer, normalizeBankCsv, parseCsv, projectPayoff, requiredPayment, resolvePeriod } from "./server.mjs";

/**
 * The MCP tools against the real HTTP server, router and Dexie (only the
 * Electron IPC hop is replaced by a direct call), as an agent would use them.
 */
// The backup builder reads this build-time constant (see src/api/api.test.ts).
(globalThis as { __APP_VERSION__?: string }).__APP_VERSION__ = "test";
const TOKEN = "m".repeat(43);
const LIMIT_TOOL_DEFINITION_CHARS = 13_000;
const dataProvider = new LocalDataProvider();

describe("MCP server tools", () => {
  let api: ApiServer;
  let mcp: ReturnType<typeof createServer>;
  let files: Record<string, string>;
  let saved: Record<string, string>;
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
    saved = {};
    base = `http://127.0.0.1:${port}/api/v1`;
    mcp = createServer({
      baseUrl: base,
      token: TOKEN,
      exportDir: "/exports",
      writeFile: (path: string, data: string) => {
        saved[path] = data;
      },
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
      "find_entity", "add_transactions", "budget_history", "payoff_projection",
    ]);
    // Small and local models re-read every definition on every turn, so keep
    // the whole set small. (It was 105 kB when every endpoint was a tool.)
    expect(JSON.stringify(list.result.tools).length).toBeLessThan(LIMIT_TOOL_DEFINITION_CHARS);
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

  it("filters transactions to the last N days, reporting the dates used", async () => {
    const day = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    for (const [offset, vendor] of [[0, "Today"], [1, "Yesterday"], [2, "TwoDaysAgo"]] as const) {
      await run("add_transaction", { date: day(offset), amount: -5, account: "Checking", vendor, category: "Food" });
    }
    const found = await run("find_transactions", { days: 2 });
    expect(found.json.period).toMatchObject({ label: "last_2_days", from: day(1), to: day(0) });
    expect(found.json.transactions.map((t: { vendor: string }) => t.vendor).sort()).toEqual(["Today", "Yesterday"]);
    const summary = await run("spending_summary", { days: 2 });
    expect(summary.json.period).toMatchObject({ from: day(1), to: day(0) });
    // Through the protocol a bad value comes back as an error result.
    const bad = await mcp.handle({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "find_transactions", arguments: { days: 0 } } });
    expect(bad.result.isError).toBe(true);
    expect(bad.result.content[0].text).toMatch(/whole number/);
  });

  it("saves a large export to a file instead of cutting it off", async () => {
    const rows = Array.from({ length: 300 }, (_, i) => ({ date: "2026-09-02", amount: -(i + 1), account: "Checking", vendor: `Shop ${i}`, category: "Food", remarks: "x".repeat(60) }));
    const ledger = (await run("list_ledgers")).json[0].id as string;
    expect((await post(`/ledgers/${ledger}/transactions/bulk`, { transactions: rows })).ok).toBe(true);
    const result = await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/transactions/export" });
    expect(result.json.saved_to).toMatch(/^\/exports\/\d{8}-\d{6}-.+\.csv$/);
    expect(result.json.characters).toBeGreaterThan(20000);
    // Nothing is lost: the file holds every row, the chat only a short preview.
    const content = saved[result.json.saved_to];
    expect(content).toHaveLength(result.json.characters);
    expect(content.split("\n").filter((l: string) => l.includes("Shop ")).length).toBe(300);
    expect(result.json.preview.length).toBeLessThanOrEqual(1500);
  });

  it("returns a small export inline without writing a file", async () => {
    await run("add_transaction", { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" });
    const small = await mcp.call("call_api", { method: "GET", path: "/ledgers/{ledgerId}/transactions/export" });
    expect(small.content[0].text).toContain("Kiosk");
    expect(saved).toEqual({});
  });

  it("runs the read-only backup export without a preview", async () => {
    const result = await run("call_api", { method: "POST", path: "/backups/export", body: {} });
    expect(result.json.preview).toBeUndefined();
    expect(JSON.stringify(result.json)).toContain("Home");
  });

  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const ledgerId = async () => (await run("list_ledgers")).json[0].id as string;

  it("finds a name across kinds and says when it is ambiguous", async () => {
    const ledger = await ledgerId();
    await post(`/ledgers/${ledger}/accounts`, { name: "Abc", currency: "EUR" });
    await post(`/ledgers/${ledger}/categories`, { name: "Abc" });
    await post(`/ledgers/${ledger}/budgets`, { category: "Abc", target_amount: 10 });
    const found = await run("find_entity", { query: "abc" });
    expect(found.json.matches.map((m: { type: string }) => m.type).sort()).toEqual(["account", "budget", "category"]);
    expect(found.json.ambiguous).toBe(true);
    expect(found.json.note).toMatch(/Ask the user which one/);

    const none = await run("find_entity", { query: "zzz" });
    expect(none.json).toMatchObject({ matches: [], ambiguous: false });

    // Case and accents are ignored; one exact match is not ambiguous.
    await post(`/ledgers/${ledger}/accounts`, { name: "Café", currency: "EUR" });
    const cafe = await run("find_entity", { query: "CAFE" });
    expect(cafe.json.matches).toHaveLength(1);
    expect(cafe.json).toMatchObject({ ambiguous: false, note: "One match." });
  });

  it("previews a bulk add, flags typos and duplicates, then adds on request", async () => {
    await run("add_transaction", { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" });
    const rows = [
      { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" }, // already there
      { date: "2026-09-03", amount: -12.5, account: "Chekcing", vendor: "Bakery", category: "Food" }, // typo in account
      { date: "2026-09-04", amount: 100, account: "Checking", vendor: "Employer", category: "Salary" },
    ];
    const preview = await run("add_transactions", { transactions: rows });
    expect(preview.json).toMatchObject({ dry_run: true, rows: 3, total_income: 100, total_expenses: 17.5, new_accounts: ["Chekcing"], new_categories: ["Salary"] });
    expect(preview.json.possible_duplicates.count).toBe(1);
    expect(preview.json.date_range).toEqual({ from: "2026-09-02", to: "2026-09-04" });
    // A preview changes nothing.
    expect((await run("find_transactions", {})).json.total_matches).toBe(1);

    const added = await run("add_transactions", { transactions: rows, dry_run: false, skip_duplicates: true });
    expect(added.json).toMatchObject({ dry_run: false, added: 2, skipped_duplicates: 1 });
    expect(added.json.ids).toHaveLength(2);
    expect((await run("find_transactions", {})).json.total_matches).toBe(3);
  });

  it("rejects a bad bulk add without calling the API, naming the rows", async () => {
    const bad = await mcp.call("add_transactions", { dry_run: false, transactions: [
      { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" },
      { date: "2026-02-30", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" },
      { date: "2026-09-02", amount: 0, account: "", vendor: "Kiosk", category: "Food" },
    ] });
    expect(bad.isError).toBe(true);
    expect(bad.content[0].text).toMatch(/Row 2: date "2026-02-30"/);
    expect(bad.content[0].text).toMatch(/Row 3: amount/);
    expect(bad.content[0].text).toMatch(/Row 3: account is missing/);
    expect((await run("find_transactions", {})).json.total_matches).toBe(0);
    const tooMany = await mcp.call("add_transactions", { transactions: Array.from({ length: 1001 }, () => ({ date: "2026-09-02", amount: -1, account: "A", vendor: "V" })) });
    expect(tooMany.isError).toBe(true);
  });

  it("shows which budgets are regularly missed", async () => {
    const now = new Date();
    const midMonth = (monthsAgo: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`;
    };
    for (const [monthsAgo, amount] of [30, 60, 50, 80].entries()) {
      await run("add_transaction", { date: midMonth(monthsAgo), amount: -amount, account: "Checking", vendor: "Shop", category: "Food" });
    }
    const ledger = await ledgerId();
    await post(`/ledgers/${ledger}/budgets`, { category: "Food", target_amount: 50, start_date: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString() });
    await post(`/ledgers/${ledger}/budgets`, { category: "Food", target_amount: 5, frequency: "One-time" });
    const history = await run("budget_history", {});
    expect(history.json.budgets).toHaveLength(1);
    expect(history.json.budgets[0]).toMatchObject({ name: "Food", target: 50, periods_counted: 3, periods_missed: 2, miss_rate_pct: 66.67, worst_overspend: 30 });
    expect(history.json.budgets[0].periods.at(-1)).toMatchObject({ running: true });
    expect(history.json.regularly_missed).toEqual(["Food"]);
    expect(history.json.not_measured[0]).toMatch(/one date range/);
    expect((await mcp.handle({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "budget_history", arguments: { periods: 99 } } })).result.isError).toBe(true);
  });

  it("projects a loan payoff next to what the ledger leaves over", async () => {
    for (const offset of [20, 50, 80]) {
      await run("add_transaction", { date: day(offset), amount: 3000, account: "Checking", vendor: "Employer", category: "Salary" });
      await run("add_transaction", { date: day(offset), amount: -2000, account: "Checking", vendor: "Shop", category: "Living" });
    }
    const result = await run("payoff_projection", { balance: 12000, annual_rate_pct: 6, monthly_payment: 500, extra_monthly: 100, target_months: 24 });
    expect(result.json.current_payment).toMatchObject({ never: false, months: 26 });
    expect(result.json.with_extra.months).toBeLessThan(result.json.current_payment.months);
    expect(result.json.with_extra.total_interest).toBeLessThan(result.json.current_payment.total_interest);
    const goal = result.json.to_clear_in_target;
    expect(goal.months).toBeLessThanOrEqual(24);
    expect(goal.extra_needed_per_month).toBeCloseTo(goal.monthly_payment_needed - 500, 2);
    const capacity = result.json.ledger_capacity;
    expect(capacity.average_monthly_net).toBeCloseTo(3000 / capacity.months_with_data, 1);
    expect(goal.affordable_from_average_net).toBe(true);
    expect(result.json.assumptions).toMatch(/not financial advice/);

    expect((await run("payoff_projection", { balance: 12000, annual_rate_pct: 6, monthly_payment: 500, include_capacity: false })).json.ledger_capacity).toBeUndefined();
    const bad = await mcp.handle({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "payoff_projection", arguments: { balance: -5, annual_rate_pct: 6, monthly_payment: 500 } } });
    expect(bad.result.isError).toBe(true);
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

  it("resolves the last N days, today included", () => {
    expect(resolvePeriod({ days: 1 }, now)).toEqual({ label: "last_1_days", from: "2026-10-05", to: "2026-10-05" });
    expect(resolvePeriod({ days: 2 }, now)).toEqual({ label: "last_2_days", from: "2026-10-04", to: "2026-10-05" });
    expect(resolvePeriod({ days: 10 }, now)).toMatchObject({ from: "2026-09-26", to: "2026-10-05" });
    // Explicit dates win over `days`.
    expect(resolvePeriod({ days: 2, from: "2026-01-01" }, now)).toMatchObject({ label: "custom", from: "2026-01-01" });
    for (const bad of [0, -3, 1.5, 4000]) expect(() => resolvePeriod({ days: bad }, now)).toThrow(/whole number/);
  });
});

describe("loan payoff maths", () => {
  const now = new Date(2026, 9, 5); // 5 Oct 2026
  it("pays off an interest-free loan in balance / payment months", () => {
    expect(projectPayoff({ balance: 12000, annualRatePct: 0, monthlyPayment: 500 }, now)).toEqual({ never: false, months: 24, total_interest: 0, total_paid: 12000, payoff_month: "2028-10" });
  });
  it("adds interest, and a bigger payment finishes sooner and cheaper", () => {
    const base = projectPayoff({ balance: 12000, annualRatePct: 6, monthlyPayment: 500 }, now);
    expect(base).toMatchObject({ never: false, months: 26 });
    expect(base.total_interest).toBeGreaterThan(800);
    expect(base.total_interest).toBeLessThan(1000);
    expect(base.total_paid).toBeCloseTo(12000 + base.total_interest, 2);
    const faster = projectPayoff({ balance: 12000, annualRatePct: 6, monthlyPayment: 600 }, now);
    expect(faster.months).toBeLessThan(base.months);
    expect(faster.total_interest).toBeLessThan(base.total_interest);
  });
  it("says never when the payment does not cover the interest", () => {
    expect(projectPayoff({ balance: 12000, annualRatePct: 6, monthlyPayment: 60 }, now)).toMatchObject({ never: true, months: null, monthly_interest_at_start: 60 });
    expect(projectPayoff({ balance: 12000, annualRatePct: 6, monthlyPayment: 30 }, now).never).toBe(true);
  });
  it("finds the smallest payment that clears the loan in time", () => {
    const payment = requiredPayment({ balance: 12000, annualRatePct: 6, months: 24 });
    expect(payment).toBeGreaterThan(531);
    expect(payment).toBeLessThan(533);
    expect(projectPayoff({ balance: 12000, annualRatePct: 6, monthlyPayment: payment }, now).months).toBeLessThanOrEqual(24);
    expect(projectPayoff({ balance: 12000, annualRatePct: 6, monthlyPayment: payment - 0.05 }, now).months).toBeGreaterThan(24);
    expect(requiredPayment({ balance: 1200, annualRatePct: 0, months: 12 })).toBe(100);
  });
});

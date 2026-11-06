import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiServer } from "../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "@/api/handleRequest";
import type { ApiRequest } from "@/api/http";
// @ts-expect-error plain ESM module without types
import { appConfigCandidates, createServer, exportFolder, loadConnection, normalizeBankCsv, parseCsv, projectPayoff, requiredPayment, resolvePeriod } from "./server.mjs";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, linkSync, mkdtempSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
      saveExport: (dir: string, name: string, data: string) => {
        saved[`${dir}/${name}`] = data;
        return `${dir}/${name}`;
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
    const missing = await run("import_csv", { path: "/missing.csv" });
    expect(missing.isError).toBe(true);
    // Neither the path nor the OS error ("ENOENT") goes back to the model.
    expect(missing.text).toBe("Cannot read that file.");
    files["/tmp/odd.csv"] = "foo,bar\n1,2\n";
    const bad = await run("import_csv", { path: "/tmp/odd.csv", account: "Checking" });
    expect(bad.isError).toBe(true);
    // One message for all the missing columns, listing the names that would be accepted.
    expect(bad.text).toBe(
      "The first line has 2 columns; none is named Date, Vendor or Amount. Accepted names (any case) for " +
        "Date: date, booking date, transaction date, posted, posting date, value date; " +
        "Vendor: vendor, payee, description, merchant, name, counterparty, details; Amount: amount, value, sum.",
    );
    files["/tmp/no-amount.csv"] = "Date,Description,Balance\n2026-09-05,Cafe,10\n";
    expect((await run("import_csv", { path: "/tmp/no-amount.csv", account: "Checking" })).text).toBe(
      "The first line has 3 columns; none is named Amount. Accepted names (any case) for Amount: amount, value, sum.",
    );
  });

  it("never repeats text from the file, even when it looks like column names", async () => {
    // FAKE secrets only. Each first line could be mistaken for a header.
    const firstLines = [
      "ghp_aB3dE6gH9jK2mN5pQ8sT1vW4yZ7bC0eF3hJ6",
      "AKIAIOSFODNN7EXAMPLE,wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "hunter2, AKIA1234",
      "dGhpc2lzYXNlY3JldGtleQ==",
      "my bank password is Tr0ub4dor",
      "pin ١٢٣٤٥٦٧٨",
      "key＝secretvalue",
      "aws_key=AKIAFAKE,password=hunter2",
      "Card 4111111111111111,Note: call me",
    ];
    for (const [i, line] of firstLines.entries()) {
      files[`/tmp/secret-${i}.txt`] = `${line}\nmore\n`;
      for (const delimiter of [undefined, ",", "|"]) {
        const r = await run("import_csv", { path: `/tmp/secret-${i}.txt`, account: "Checking", delimiter });
        expect(r.isError).toBe(true);
        expect(r.text).toMatch(/^The first line has \d+ columns?; none is named Date, Vendor or Amount\. Accepted names/);
        for (const cell of line.split(/[,|]/).map((c) => c.trim()).filter(Boolean)) expect(r.text).not.toContain(cell);
        expect(r.text).not.toMatch(/ghp_|AKIA|hunter2|Tr0ub4dor|secretvalue|١٢٣|4111|call me|dGhpc2/);
      }
    }
  });

  it("only accepts a known delimiter", async () => {
    files["/tmp/bank.csv"] = "Date,Description,Amount\n2026-09-05,Cafe,-4\n";
    const bad = await run("import_csv", { path: "/tmp/bank.csv", account: "Checking", delimiter: "\n" });
    expect(bad.isError).toBe(true);
    expect(bad.text).toMatch(/delimiter/i);
    expect((await run("import_csv", { path: "/tmp/bank.csv", account: "Checking", delimiter: "," })).isError).toBe(false);
  });

  it("refuses the app's config file, the token file and other file types", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vm-guard-"));
    try {
      const fakeConfig = join(dir, "api-config.json");
      const fakeTokenFile = join(dir, "token.txt");
      writeFileSync(fakeConfig, '{"token":"FAKE-TOKEN"}');
      writeFileSync(fakeTokenFile, "FAKE-TOKEN");
      const guarded = createServer({
        baseUrl: base,
        token: TOKEN,
        env: { VM_CONFIG_FILE: fakeConfig, VM_TOKEN_FILE: fakeTokenFile },
        readFile: (p: string) => files[p] ?? "Date,Description,Amount\n",
      });
      const go = async (path: string) => {
        const r = await guarded.call("import_csv", { path, account: "Checking" });
        return { isError: !!r.isError, text: r.content[0].text as string };
      };
      for (const path of [fakeConfig, fakeTokenFile]) {
        const r = await go(path);
        expect(r.isError).toBe(true);
        expect(r.text).toMatch(/can't import|cannot import|not a bank/i);
        expect(r.text).not.toContain("FAKE-TOKEN");
      }
      // A symlink to a protected file is refused too.
      const link = join(dir, "link.csv");
      symlinkSync(fakeConfig, link);
      expect((await go(link)).isError).toBe(true);
      expect((await go("/tmp/notes.json")).text).toMatch(/\.csv/);
      files["/tmp/UPPER.CSV"] = "Date,Description,Amount\n2026-09-05,Cafe,-4\n";
      expect((await go("/tmp/UPPER.CSV")).isError).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a protected file reached by case variant, hard link or symlink", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vm-guard-"));
    try {
      const fakeTokenFile = join(dir, "token.txt");
      writeFileSync(fakeTokenFile, "FAKE-TOKEN");
      const guarded = createServer({
        baseUrl: base,
        token: TOKEN,
        env: { VM_CONFIG_FILE: join(dir, "none.json"), VM_TOKEN_FILE: fakeTokenFile },
        readFile: (p: string) => readFileSync(p, "utf8"),
      });
      const go = async (path: string) => {
        const r = await guarded.call("import_csv", { path, account: "Checking" });
        return { isError: !!r.isError, text: r.content[0].text as string };
      };
      const variant = join(dir, "Token.txt");
      if (existsSync(variant)) {
        // Case-insensitive filesystem: the variant is the same file.
        const r = await go(variant);
        expect(r.isError).toBe(true);
        expect(r.text).toMatch(/not a bank statement/);
        expect(r.text).not.toContain("FAKE-TOKEN");
      }
      const hard = join(dir, "hard.txt");
      linkSync(fakeTokenFile, hard);
      const h = await go(hard);
      expect(h.isError).toBe(true);
      expect(h.text).toMatch(/not a bank statement/);
      expect(h.text).not.toContain("FAKE-TOKEN");
      const soft = join(dir, "soft.txt");
      symlinkSync(fakeTokenFile, soft);
      const sl = await go(soft);
      expect(sl.isError).toBe(true);
      expect(sl.text).toMatch(/not a bank statement/);
      const normal = join(dir, "bank.csv");
      writeFileSync(normal, "Date,Description,Amount\n2026-09-05,Cafe,-4\n");
      expect((await go(normal)).isError).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("folds case on macOS and Windows even when neither file exists", async () => {
    for (const platform of ["darwin", "win32"]) {
      const guarded = createServer({
        baseUrl: base,
        token: TOKEN,
        platform,
        env: { VM_CONFIG_FILE: "/nonexistent-vm/none.json", VM_TOKEN_FILE: "/nonexistent-vm/Token.txt" },
        readFile: () => "FAKE-TOKEN",
      });
      const r = await guarded.call("import_csv", { path: "/nonexistent-vm/token.txt", account: "Checking" });
      expect(r.isError).toBe(true);
      expect(r.content[0].text).toMatch(/not a bank statement/);
    }
  });

  it("echoes only a short, single-line list of column names", async () => {
    const names = Array.from({ length: 40 }, (_, i) => `col${i}${"x".repeat(80)}`);
    files["/tmp/wide.csv"] = names.join(",") + "\n1,2\n";
    const r = await run("import_csv", { path: "/tmp/wide.csv", account: "Checking" });
    expect(r.isError).toBe(true);
    expect(r.text).not.toContain("\n");
    expect(r.text).not.toContain("x".repeat(41));
    expect(r.text).not.toContain("col25");
  });

  it("says plainly when the app is not running", async () => {
    const offline = createServer({
      baseUrl: base,
      token: TOKEN,
      fetchImpl: () => Promise.reject(new TypeError("fetch failed")),
    });
    const r = await offline.call("list_ledgers", {}).catch((e: Error) => ({ isError: true, content: [{ text: e.message }] }));
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toBe("Vaulted Money is not running. Open the desktop app (it can stay in the tray) and try again.");
    const viaProtocol = await offline.handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_ledgers", arguments: {} } });
    expect(viaProtocol.result.content[0].text).toContain("is not running");
  });

  it("reports a connection lookup failure as itself, looked up once per request", async () => {
    let lookups = 0;
    const switchedOff = createServer({
      getConnection: () => {
        lookups++;
        throw new Error("Vaulted Money's Local API is off. Open the app, go to Settings → Local API and switch it on.");
      },
      fetchImpl: () => Promise.reject(new TypeError("fetch failed")),
    });
    const r = await switchedOff.handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_ledgers", arguments: {} } });
    expect(r.result.content[0].text).toContain("Local API is off");
    expect(r.result.content[0].text).not.toContain("not running");
    expect(lookups).toBe(1);
    let connections = 0;
    let fetches = 0;
    const live = createServer({
      getConnection: () => (connections++, { baseUrl: base, token: TOKEN }),
      fetchImpl: (url: URL, init: RequestInit) => (fetches++, fetch(url, init)),
    });
    expect((await live.call("list_ledgers", {})).isError).toBeFalsy();
    expect(fetches).toBeGreaterThan(0);
    expect(connections).toBe(fetches);
  });

  it("previews destructive calls and only runs them when confirmed", async () => {
    await run("add_transaction", { date: "2026-09-02", amount: -5, account: "Checking", vendor: "Kiosk", category: "Food" });
    const accounts = (await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data;
    const path = `/ledgers/{ledgerId}/accounts/${accounts[0].id}`;

    const preview = await run("call_api", { method: "DELETE", path });
    expect(preview.json).toMatchObject({ preview: true, executed: false });
    expect((await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data).toHaveLength(1);
    // Only the boolean true confirms. Strings and numbers a model might send stay previews.
    for (const confirm of ["false", "no", 1, "true", 0, "yes"]) {
      const stillPreview = await run("call_api", { method: "DELETE", path, confirm });
      expect(stillPreview.json).toMatchObject({ preview: true, executed: false });
    }
    expect((await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data).toHaveLength(1);
    // Nor can a path reach a different endpoint from the one shown: dot
    // segments in any spelling, and tabs or newlines the URL parser would drop.
    const sneakyPaths = [
      "/ledgers/{ledgerId}/accounts/../../..", "/ledgers/%2e%2e/x", "/ledgers/{ledgerId}/.%2E/accounts", "/../x", "..",
      "/ledgers/{ledgerId}/.\t./x", "/ledgers/{ledgerId}/.\n./x", "/ledgers/{ledgerId}/.\r./x", "/ledgers/{ledgerId}/./accounts", "/ledgers\\..\\x",
    ];
    for (const sneaky of sneakyPaths) {
      for (const method of ["DELETE", "GET"]) {
        const r = await run("call_api", { method, path: sneaky, confirm: true });
        expect(r.isError, `${method} ${JSON.stringify(sneaky)}`).toBe(true);
        expect(r.text).toMatch(/control characters|segments/);
      }
    }
    expect((await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/accounts" })).json.data).toHaveLength(1);
    // Backstop in every request: the URL that runs must be exactly the path asked for
    // (here the parser would turn the backslash into a slash).
    const rewritten = await mcp.handle({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "call_api", arguments: { method: "GET", path: "/ledgers\\{ledgerId}" } } });
    expect(rewritten.result.isError).toBe(true);
    expect(rewritten.result.content[0].text).toMatch(/not a plain API path/);
    // A ".." inside the query string is only a value, so it is allowed.
    const query = await run("call_api", { method: "GET", path: "/ledgers/{ledgerId}/transactions?search=.." });
    expect(query.isError).toBe(false);

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

    // VM_EXPORT_DIR, as documented, moves where the file goes.
    const moved: Record<string, string> = {};
    const elsewhere = createServer({ baseUrl: base, token: TOKEN, env: { VM_EXPORT_DIR: "/chosen" }, saveExport: (dir: string, name: string, data: string) => { moved[`${dir}/${name}`] = data; return `${dir}/${name}`; } });
    const again = JSON.parse((await elsewhere.call("call_api", { method: "GET", path: "/ledgers/{ledgerId}/transactions/export" })).content[0].text);
    expect(again.saved_to).toMatch(/^\/chosen\/\d{8}-\d{6}-.+\.csv$/);
    expect(Object.keys(moved)).toEqual([again.saved_to]);
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

describe("MCP connection discovery", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "vm-conn-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));
  const write = (name: string, content: string) => {
    const file = join(dir, name);
    writeFileSync(file, content);
    return file;
  };
  const config = (extra: Record<string, unknown> = {}) =>
    write("api-config.json", JSON.stringify({ enabled: true, port: 51234, token: "cfg-token", ...extra }));
  const nowhere = join(tmpdir(), "vm-does-not-exist-token");

  it("reads token and port from the app config", () => {
    const VM_CONFIG_FILE = config();
    expect(loadConnection({ VM_CONFIG_FILE, VM_TOKEN_FILE: nowhere }, "linux", dir)).toEqual({
      token: "cfg-token",
      baseUrl: "http://127.0.0.1:51234/api/v1",
    });
  });

  it("follows a changed port", () => {
    const VM_CONFIG_FILE = config();
    const env = { VM_CONFIG_FILE, VM_TOKEN_FILE: nowhere };
    expect(loadConnection(env, "linux", dir).baseUrl).toContain(":51234/");
    config({ port: 60000 });
    expect(loadConnection(env, "linux", dir).baseUrl).toContain(":60000/");
  });

  it("prefers the VM_TOKEN env over the config", () => {
    const VM_CONFIG_FILE = config();
    expect(loadConnection({ VM_CONFIG_FILE, VM_TOKEN: "env-token", VM_BASE_URL: "http://x/api/v1" }, "linux", dir)).toEqual({
      token: "env-token",
      baseUrl: "http://x/api/v1",
    });
  });

  it("prefers the config over a token file with a different token and port", () => {
    const VM_CONFIG_FILE = config();
    const VM_TOKEN_FILE = write("tok", "file-token\n");
    expect(loadConnection({ VM_CONFIG_FILE, VM_TOKEN_FILE }, "linux", dir)).toEqual({
      token: "cfg-token",
      baseUrl: "http://127.0.0.1:51234/api/v1",
    });
  });

  it("falls back to the token file when no config exists", () => {
    const VM_TOKEN_FILE = write("tok", "file-token\n");
    expect(loadConnection({ VM_CONFIG_FILE: join(dir, "nope.json"), VM_TOKEN_FILE }, "linux", dir)).toEqual({
      token: "file-token",
      baseUrl: "http://127.0.0.1:47821/api/v1",
    });
  });

  it("prefers VM_TOKEN over both the config and the token file", () => {
    const VM_CONFIG_FILE = config();
    const VM_TOKEN_FILE = write("tok", "file-token");
    expect(loadConnection({ VM_CONFIG_FILE, VM_TOKEN_FILE, VM_TOKEN: "env-token" }, "linux", dir).token).toBe("env-token");
  });

  it("says the Local API is off even when a token file exists", () => {
    const VM_CONFIG_FILE = config({ enabled: false });
    const VM_TOKEN_FILE = write("tok", "file-token");
    expect(() => loadConnection({ VM_CONFIG_FILE, VM_TOKEN_FILE }, "linux", dir)).toThrow("Local API is off");
  });

  it("says the Local API is off when the config is disabled", () => {
    const VM_CONFIG_FILE = config({ enabled: false });
    expect(() => loadConnection({ VM_CONFIG_FILE, VM_TOKEN_FILE: nowhere }, "linux", dir)).toThrow(
      "Vaulted Money's Local API is off. Open the app, go to Settings → Local API and switch it on.",
    );
  });

  it.each([
    ["missing", () => join(dir, "nope.json")],
    ["empty", () => write("empty.json", "")],
    ["invalid JSON", () => write("bad.json", "{not json")],
  ])("says it could not find the app for a %s config", (_label, make) => {
    expect(() => loadConnection({ VM_CONFIG_FILE: make(), VM_TOKEN_FILE: nowhere }, "linux", dir)).toThrow(
      "Could not find Vaulted Money. Open the desktop app once, or set VM_TOKEN.",
    );
  });

  it("lists the config candidates per platform", () => {
    const home = "/Users/Jane Doe";
    expect(appConfigCandidates({}, "darwin", home)).toEqual([
      "/Users/Jane Doe/Library/Application Support/Vaulted Money/api-config.json",
      "/Users/Jane Doe/Library/Application Support/vite_react_shadcn_ts/api-config.json",
    ]);
    expect(appConfigCandidates({ APPDATA: "C:\\Users\\Jane Doe\\AppData\\Roaming" }, "win32", "C:\\Users\\Jane Doe")).toEqual([
      join("C:\\Users\\Jane Doe\\AppData\\Roaming", "Vaulted Money", "api-config.json"),
      join("C:\\Users\\Jane Doe\\AppData\\Roaming", "vite_react_shadcn_ts", "api-config.json"),
    ]);
    expect(appConfigCandidates({ XDG_CONFIG_HOME: "/x/cfg" }, "linux", home)).toEqual([
      "/x/cfg/Vaulted Money/api-config.json",
      "/x/cfg/vite_react_shadcn_ts/api-config.json",
    ]);
    expect(appConfigCandidates({}, "linux", home)[0]).toBe("/Users/Jane Doe/.config/Vaulted Money/api-config.json");
  });
});

/**
 * The real export writer (nothing injected), in throwaway folders. A download
 * can hold the whole ledger, so it must never overwrite or follow an existing
 * file, and the folder must be private and the user's own.
 */
describe("saving large exports", () => {
  let home: string;
  const fixed = new Date("2026-01-02T03:04:05Z");
  const stamp = "20260102-030405";
  const big = "y".repeat(25_000);
  const serverFor = (env: Record<string, string>, disposition = 'attachment; filename="Main_transactions_export.csv"') =>
    createServer({
      baseUrl: "http://127.0.0.1:1/api/v1",
      token: "FAKE",
      env,
      home,
      now: () => fixed,
      fetchImpl: async (url: URL) =>
        new URL(url).pathname.endsWith("/ledgers")
          ? new Response(JSON.stringify({ data: [{ id: "L1", name: "Main", currency: "EUR" }] }))
          : new Response(big, { headers: { "content-disposition": disposition } }),
    });
  const download = async (server: ReturnType<typeof createServer>) => {
    const r = await server.call("call_api", { method: "GET", path: "/ledgers/{ledgerId}/transactions/export" });
    return { isError: !!r.isError, text: r.content[0].text as string, json: r.isError ? undefined : JSON.parse(r.content[0].text) };
  };
  const mode = (p: string) => statSync(p).mode & 0o777;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "vm-export-"));
  });
  afterEach(() => rmSync(home, { recursive: true, force: true }));

  it("writes an owner-only file in a private folder, and gives a same-second name a suffix", async () => {
    const dir = join(home, "exports");
    const server = serverFor({ VM_EXPORT_DIR: dir });
    const first = await download(server);
    const second = await download(server);
    expect(first.json.saved_to).toBe(join(dir, `${stamp}-Main_transactions_export.csv`));
    expect(second.json.saved_to).toBe(join(dir, `${stamp}-Main_transactions_export-1.csv`));
    expect(readFileSync(first.json.saved_to, "utf8")).toBe(big);
    expect(readFileSync(second.json.saved_to, "utf8")).toBe(big);
    expect(mode(first.json.saved_to)).toBe(0o600);
    expect(mode(dir)).toBe(0o700);
  });

  it("does not write through a symlink planted at the export's name", async () => {
    const dir = join(home, "exports");
    mkdirSync(dir, { mode: 0o700 });
    const victim = join(home, "victim.txt");
    writeFileSync(victim, "ORIGINAL");
    symlinkSync(victim, join(dir, `${stamp}-Main_transactions_export.csv`));
    const r = await download(serverFor({ VM_EXPORT_DIR: dir }));
    expect(r.json.saved_to).toBe(join(dir, `${stamp}-Main_transactions_export-1.csv`));
    expect(readFileSync(victim, "utf8")).toBe("ORIGINAL");
  });

  it("leaves an existing folder's permissions alone, and refuses a symlinked folder or the home folder", async () => {
    const open = join(home, "open");
    mkdirSync(open);
    chmodSync(open, 0o755);
    const saved = await download(serverFor({ VM_EXPORT_DIR: open }));
    expect(saved.isError).toBe(false);
    expect(mode(open)).toBe(0o755);
    expect(mode(saved.json.saved_to)).toBe(0o600);

    const elsewhere = join(home, "elsewhere");
    mkdirSync(elsewhere);
    symlinkSync(elsewhere, join(home, "linked"));
    const linked = await download(serverFor({ VM_EXPORT_DIR: join(home, "linked") }));
    expect(linked.isError).toBe(true);
    expect(linked.text).toMatch(/symbolic link/);
    expect(readdirSync(elsewhere)).toEqual([]);

    // The home folder is recognised by identity, however it is spelled.
    const spellings = ["~", `${home}/`, `${home}/./`, join(home, "open", "..")];
    const upper = home.toUpperCase();
    if (upper !== home && existsSync(upper)) spellings.push(upper); // case-insensitive filesystem
    for (const spelling of spellings) {
      const atHome = await download(serverFor({ VM_EXPORT_DIR: spelling }));
      expect(atHome.isError).toBe(true);
      expect(atHome.text).toMatch(/home folder/);
    }
    expect(readdirSync(home).sort()).toEqual(["elsewhere", "linked", "open"]);
  });

  it.skipIf(typeof process.getuid !== "function" || process.getuid() === 0)("refuses a folder that belongs to someone else", async () => {
    // The filesystem root, owned by root, stands in for another user's folder; nothing is written there.
    const r = await download(serverFor({ VM_EXPORT_DIR: "/" }));
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/another user/);
  });

  it("resolves a relative or ~/ VM_EXPORT_DIR against the home folder", async () => {
    expect(exportFolder({}, home)).toBe(join(home, "vaulted-exports"));
    expect(exportFolder({ VM_EXPORT_DIR: "rel-exports" }, home)).toBe(join(home, "rel-exports"));
    expect(exportFolder({ VM_EXPORT_DIR: "~/tilde" }, home)).toBe(join(home, "tilde"));
    expect(exportFolder({ VM_EXPORT_DIR: "/abs/dir" }, home)).toBe("/abs/dir");
    const r = await download(serverFor({ VM_EXPORT_DIR: "rel-exports" }));
    expect(r.json.saved_to).toBe(join(home, "rel-exports", `${stamp}-Main_transactions_export.csv`));
    expect(existsSync(r.json.saved_to)).toBe(true);
  });

  it("falls back to export.txt for a malformed or hostile file name", async () => {
    const dir = join(home, "exports");
    const malformed = await download(serverFor({ VM_EXPORT_DIR: dir }, "attachment; filename*=UTF-8''%E0%A4%A"));
    expect(malformed.json.saved_to).toBe(join(dir, `${stamp}-export.txt`));
    const traversal = await download(serverFor({ VM_EXPORT_DIR: dir }, "attachment; filename*=UTF-8''..%2F..%2Fevil.sh"));
    expect(traversal.json.saved_to).toBe(join(dir, `${stamp}-evil.sh`));
    expect(readdirSync(home).sort()).toEqual(["exports"]);
  });
});

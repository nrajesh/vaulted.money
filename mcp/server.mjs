#!/usr/bin/env node
/**
 * Vaulted Money MCP server: a handful of tools over the desktop app's Local
 * API, for local agents (LM Studio, Claude Code, any MCP client).
 *
 * Zero dependencies (Node 18+). Speaks MCP over stdio. It is a separate
 * process that calls the API over HTTP, so the desktop app must be running
 * with Settings -> Local API switched on (the window may be closed to the tray).
 *
 * Why so few tools: every tool definition is re-read by the model on every
 * turn, so a model with 99 tools is slow. Six read tools cover most questions
 * and return trimmed, pre-aggregated answers; `search_api` + `call_api` reach
 * every other endpoint without loading its schema up front.
 *
 *   VM_TOKEN_FILE  file holding the access token (default ~/.vaulted-token)
 *   VM_TOKEN       the token itself (overrides the file)
 *   VM_BASE_URL    default http://127.0.0.1:47821/api/v1
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""));
const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }] });
const fail = (message) => ({ isError: true, content: [{ type: "text", text: message }] });
const round = (n) => Math.round(n * 100) / 100;
const pad2 = (n) => String(n).padStart(2, "0");
/** YYYY-MM-DD in the computer's local time zone. */
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const PERIODS = ["this_month", "last_month", "last_7_days", "last_30_days", "last_90_days", "this_year", "last_year"];
/**
 * Turn a named period (or explicit from/to) into dates. Models do not know
 * today's date and are unreliable at date arithmetic, so the server does it
 * and reports exactly which dates it used.
 */
export function resolvePeriod({ period, from, to } = {}, now = new Date()) {
  if (from || to) return { label: "custom", from: from ?? "0000-01-01", to: to ?? ymd(now) };
  const y = now.getFullYear(), m = now.getMonth();
  const daysAgo = (n) => ymd(new Date(y, m, now.getDate() - n));
  switch (period ?? "last_30_days") {
    case "this_month": return { label: "this_month", from: ymd(new Date(y, m, 1)), to: ymd(now) };
    case "last_month": return { label: "last_month", from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
    case "last_7_days": return { label: "last_7_days", from: daysAgo(6), to: ymd(now) };
    case "last_90_days": return { label: "last_90_days", from: daysAgo(89), to: ymd(now) };
    case "this_year": return { label: "this_year", from: `${y}-01-01`, to: ymd(now) };
    case "last_year": return { label: "last_year", from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    case "last_30_days": return { label: "last_30_days", from: daysAgo(29), to: ymd(now) };
    default: throw new Error(`Unknown period "${period}". Use one of: ${PERIODS.join(", ")}, or pass from/to (YYYY-MM-DD).`);
  }
}

// ── CSV helpers (quote-aware) ───────────────────────────────────────────────
export function parseCsv(input, delimiter) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}
const csvCell = (v) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const ALIASES = {
  Date: ["date", "booking date", "transaction date", "posted", "posting date", "value date"],
  Vendor: ["vendor", "payee", "description", "merchant", "name", "counterparty", "details"],
  Amount: ["amount", "value", "sum"],
  Category: ["category"],
  Currency: ["currency"],
  Account: ["account", "account name"],
  Remarks: ["remarks", "notes", "memo", "reference", "note"],
};
/** DD/MM/YYYY out; accepts YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY. */
function toAppDate(raw) {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
  return s;
}
/**
 * Reshape a bank CSV into the app's import format (the one the Import CSV
 * button and the API use). Returns { csv, rows, mapped, problems }.
 */
export function normalizeBankCsv(input, { account, currency, delimiter } = {}) {
  const first = input.split(/\r?\n/, 1)[0] ?? "";
  const delim = delimiter ?? [";", ",", "\t"].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const [header, ...body] = parseCsv(input, delim);
  if (!header) return { problems: ["The file is empty."] };
  const lower = header.map((h) => h.trim().toLowerCase());
  const index = {};
  for (const [target, names] of Object.entries(ALIASES)) {
    const at = lower.findIndex((h) => names.includes(h));
    if (at >= 0) index[target] = at;
  }
  const problems = [];
  for (const need of ["Date", "Vendor", "Amount"]) if (index[need] === undefined) problems.push(`No column found for ${need}. Columns in the file: ${header.join(", ")}`);
  if (index.Account === undefined && !account) problems.push("The file has no account column: pass `account`.");
  if (problems.length) return { problems };
  const out = ["Date;Account;Vendor;Category;Amount;Remarks;Currency;transfer_id;is_scheduled_origin;Frequency;End Date"];
  for (const r of body) {
    const get = (k) => (index[k] !== undefined ? (r[index[k]] ?? "").trim() : "");
    const amount = get("Amount").replace(/\s/g, "").replace(/[€$£]/g, "");
    // "1.234,56" (European) and "1,234.56" both become "1234.56".
    const normalized = /,\d{1,2}$/.test(amount) ? amount.replace(/\./g, "").replace(",", ".") : amount.replace(/,/g, "");
    out.push([toAppDate(get("Date")), get("Account") || account, get("Vendor"), get("Category"), normalized, get("Remarks"), get("Currency") || currency || "", "", "", "", ""].map(csvCell).join(";"));
  }
  return { csv: out.join("\n") + "\n", rows: body.length, mapped: Object.fromEntries(Object.entries(index).map(([k, v]) => [k, header[v]])), problems };
}

// ── schema description for search_api ───────────────────────────────────────
function describeBody(schema) {
  const props = schema?.properties;
  if (!props) return undefined;
  const required = new Set(schema.required ?? []);
  return Object.fromEntries(Object.entries(props).map(([k, v]) => [k + (required.has(k) ? "*" : ""), v.enum ? v.enum.join("|") : Array.isArray(v.type) ? v.type.join("|") : (v.type ?? "any")]));
}

export function createServer({ baseUrl, token, getToken, now = () => new Date(), fetchImpl = fetch, readFile = (p) => readFileSync(p, "utf8") }) {
  let ledgers, spec;
  const api = async (method, path, { query, body } = {}) => {
    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [k, v] of Object.entries(clean(query ?? {}))) url.searchParams.set(k, String(v));
    const res = await fetchImpl(url, { method, headers: { Authorization: `Bearer ${getToken ? getToken() : token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const raw = await res.text();
    let json;
    try { json = raw ? JSON.parse(raw) : null; } catch { json = undefined; }
    return { ok: res.ok, status: res.status, json, raw };
  };
  const apiError = (r) => fail(`API ${r.status}: ${r.json?.error?.message ?? r.raw.slice(0, 300)}${r.json?.error?.details ? " " + JSON.stringify(r.json.error.details) : ""}`);

  async function fetchLedgers() {
    const r = await api("GET", "/ledgers");
    if (!r.ok) throw new Error(`API ${r.status}: ${r.json?.error?.message ?? r.raw.slice(0, 200)}${r.status === 401 ? " (check the token in ~/.vaulted-token matches Settings -> Local API)" : ""}`);
    if (!r.json.data.length) throw new Error("There are no ledgers yet.");
    return r.json.data;
  }
  async function resolveLedger(ref) {
    if (!ledgers?.length) ledgers = await fetchLedgers(); // never cache a failure or an empty list
    if (!ref) {
      if (ledgers.length === 1) return ledgers[0];
      throw new Error(`Several ledgers exist: ${ledgers.map((l) => `${l.name} (${l.id})`).join(", ")}. Pass \`ledger\` (name or id).`);
    }
    const hit = ledgers.find((l) => l.id === ref) ?? ledgers.find((l) => l.name.toLowerCase() === ref.toLowerCase());
    if (!hit) throw new Error(`No ledger "${ref}". Available: ${ledgers.map((l) => l.name).join(", ")}`);
    return hit;
  }
  async function loadSpec() {
    if (spec) return spec;
    const r = await api("GET", "/openapi.json");
    if (!r.ok) throw new Error(`Could not load the OpenAPI spec (${r.status}).`);
    spec = r.json;
    return spec;
  }

  const ledgerProp = { ledger: { type: "string", description: "Ledger name or id. Optional when there is only one ledger." } };
  const PERIOD_PROP = { type: "string", enum: PERIODS, description: "Named period; the server works out the dates" };
  const read = { readOnlyHint: true, openWorldHint: false };

  const tools = [
    {
      name: "list_ledgers",
      description: "List ledgers with their accounts and balances. Start here to see what exists.",
      inputSchema: { type: "object", properties: {} },
      annotations: read,
      async run() {
        ledgers = await fetchLedgers();
        const out = [];
        for (const l of ledgers) {
          const accounts = (await api("GET", `/ledgers/${l.id}/accounts`)).json?.data ?? [];
          out.push({ ledger: l.name, id: l.id, currency: l.currency, accounts: accounts.map((a) => ({ name: a.name, type: a.type, currency: a.currency, balance: round(a.balance ?? 0) })) });
        }
        return text(out);
      },
    },
    {
      name: "spending_summary",
      description: "Where the money goes: totals plus top categories, vendors and accounts, and a time series. Prefer `period` over dates. Default: last_30_days. The result states the exact dates used and today's date. Use for 'where is my money going', 'how much did I spend', 'compare months'.",
      inputSchema: { type: "object", properties: { ...ledgerProp, period: PERIOD_PROP, from: { type: "string", description: "YYYY-MM-DD; only if no named period fits" }, to: { type: "string", description: "YYYY-MM-DD" }, group_by: { type: "string", enum: ["day", "week", "month"] }, top: { type: "number", description: "Rows per breakdown (default 8)" } } },
      annotations: read,
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const range = resolvePeriod(a, now());
        const r = await api("GET", `/ledgers/${l.id}/analytics`, { query: { from: range.from, to: range.to, group_by: a.group_by ?? "month" } });
        if (!r.ok) return apiError(r);
        const top = a.top ?? 8;
        const j = r.json;
        const pick = (rows, key) => rows.filter((x) => x.expenses > 0).slice(0, top).map((x) => ({ [key]: x[key], spent: round(x.expenses), share_pct: x.share, count: x.count }));
        return text({ ledger: l.name, today: ymd(now()), period: range, currency: j.currency, totals: j.totals, by_category: pick(j.byCategory, "category"), by_vendor: pick(j.byVendor, "vendor"), by_account: pick(j.byAccount ?? [], "account"), series: j.series });
      },
    },
    {
      name: "find_transactions",
      description: "Look up transactions. Negative amounts are expenses. Use for 'what did I spend at X', 'biggest expenses', 'show uncategorised'. Returns total matches and up to `limit` rows (default 20).",
      inputSchema: { type: "object", properties: { ...ledgerProp, period: { ...PERIOD_PROP, description: "Optional: limit to a named period. Omit for all dates." }, search: { type: "string", description: "Free text" }, vendor: { type: "string" }, category: { type: "string" }, sub_category: { type: "string" }, account: { type: "string" }, type: { type: "string", enum: ["income", "expense"] }, min_amount: { type: "number" }, max_amount: { type: "number" }, from: { type: "string" }, to: { type: "string" }, exclude_transfers: { type: "boolean" }, limit: { type: "number" }, offset: { type: "number" } } },
      annotations: read,
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const { ledger: _ledger, period, ...query } = a;
        const range = period ? resolvePeriod({ period }, now()) : undefined;
        if (range) Object.assign(query, { from: range.from, to: range.to });
        query.limit = Math.min(query.limit ?? 20, 100);
        const r = await api("GET", `/ledgers/${l.id}/transactions`, { query });
        if (!r.ok) return apiError(r);
        const sum = round(r.json.data.reduce((s, t) => s + t.amount, 0));
        return text({ ledger: l.name, today: ymd(now()), period: range ?? "all dates unless from/to given", total_matches: r.json.total, shown: r.json.data.length, sum_of_shown: sum, transactions: r.json.data.map((t) => clean({ id: t.id, date: t.date?.slice(0, 10), amount: t.amount, currency: t.currency, account: t.account, vendor: t.vendor, category: t.category, sub_category: t.sub_category, remarks: t.remarks })) });
      },
    },
    {
      name: "budgets_and_insights",
      description: "Budget status (spent vs target) and the biggest spending changes versus the previous 30 days. Use for 'am I over budget', 'what changed'.",
      inputSchema: { type: "object", properties: { ...ledgerProp } },
      annotations: read,
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const [b, i] = await Promise.all([api("GET", `/ledgers/${l.id}/budgets`), api("GET", `/ledgers/${l.id}/insights`)]);
        if (!b.ok) return apiError(b);
        if (!i.ok) return apiError(i);
        return text({
          ledger: l.name,
          budgets: (b.json.data ?? []).filter((x) => x.is_active).map((x) => clean({ name: x.category_name ?? x.budget_scope_name, scope: x.budget_scope, target: x.target_amount, spent: round(x.spent_amount ?? 0), frequency: x.frequency, currency: x.currency, goal: x.is_goal || undefined })),
          budget_health: i.json.budgets,
          biggest_vendor_changes: (i.json.trends?.vendors ?? []).slice(0, 5),
          biggest_account_changes: (i.json.trends?.accounts ?? []).slice(0, 3),
          compared_periods: { current: i.json.trends?.currentPeriod, previous: i.json.trends?.previousPeriod },
        });
      },
    },
    {
      name: "search_api",
      description: "Find other endpoints (reports, currencies, recurring transactions, backups, vendors, categories, CSV export, maintenance...). Returns the best matches with their parameters; then use call_api.",
      inputSchema: { type: "object", properties: { query: { type: "string", description: "Keywords, e.g. 'recurring', 'merge vendors', 'export csv'" } }, required: ["query"] },
      annotations: read,
      async run(a) {
        const s = await loadSpec();
        const words = a.query.toLowerCase().split(/\s+/).filter(Boolean);
        const hits = [];
        for (const [path, ops] of Object.entries(s.paths)) {
          for (const [method, op] of Object.entries(ops)) {
            const hay = `${method} ${path} ${op.summary ?? ""} ${(op.tags ?? []).join(" ")}`.toLowerCase();
            const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
            if (score) hits.push({ score, method: method.toUpperCase(), path, op });
          }
        }
        hits.sort((x, y) => y.score - x.score);
        return text(hits.slice(0, 6).map(({ method, path, op }) => clean({
          method, path, summary: op.summary,
          query: Object.fromEntries((op.parameters ?? []).filter((p) => p.in === "query").map((p) => [p.name, p.description ?? ""])) ,
          body: describeBody(op.requestBody?.content?.["application/json"]?.schema),
        })).map((o) => (o.query && !Object.keys(o.query).length ? { ...o, query: undefined } : o)));
      },
    },
    {
      name: "call_api",
      description: "Call any endpoint found with search_api. Use {ledgerId} in the path for the resolved ledger. GET runs immediately. Anything that changes data returns a PREVIEW unless confirm is true: show the user the preview and only then repeat with confirm true. Endpoints with dry_run are previewed by the API itself.",
      inputSchema: { type: "object", properties: { ...ledgerProp, method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }, path: { type: "string", description: "e.g. /ledgers/{ledgerId}/vendors" }, query: { type: "object" }, body: { type: "object" }, confirm: { type: "boolean", description: "true only after the user approved the preview" } }, required: ["method", "path"] },
      annotations: { destructiveHint: true, openWorldHint: false },
      async run(a) {
        let path = a.path.replace(/^\/?api\/v1/, "").replace(/^(?!\/)/, "/");
        if (path.includes("{ledgerId}")) path = path.replaceAll("{ledgerId}", (await resolveLedger(a.ledger)).id);
        const method = a.method.toUpperCase();
        if (method === "GET") {
          const r = await api("GET", path, { query: a.query });
          return r.ok ? text(r.json ?? r.raw.slice(0, 20000)) : apiError(r);
        }
        let body = a.body;
        if (!a.confirm) {
          const s = await loadSpec().catch(() => undefined);
          // Find the spec entry for this path ({param} segments match anything).
          const known = s && Object.entries(s.paths).find(([p, ops]) => ops[method.toLowerCase()] && new RegExp("^" + p.replace(/\{\w+\}/g, "[^/]+") + "$").test(path));
          const supportsDryRun = known && "dry_run" in (known[1][method.toLowerCase()].requestBody?.content?.["application/json"]?.schema?.properties ?? {});
          if (supportsDryRun) {
            const r = await api(method, path, { query: a.query, body: { ...(body ?? {}), dry_run: true } });
            return r.ok ? text({ preview: true, note: "Nothing changed. Repeat with confirm:true after the user approves.", result: r.json }) : apiError(r);
          }
          return text({ preview: true, executed: false, would_call: `${method} ${path}`, query: a.query, body, note: "Nothing changed. Show this to the user; if they approve, repeat the call with confirm:true." });
        }
        // Confirmed: deletion endpoints that demand an explicit flag get it.
        if (/cleanup|cleanup-duplicates/.test(path)) body = { confirm_delete: true, ...(body ?? {}) };
        const r = await api(method, path, { query: a.query, body });
        return r.ok ? text(r.status === 204 ? { deleted: true } : (r.json ?? r.raw.slice(0, 20000))) : apiError(r);
      },
    },
    {
      name: "add_transaction",
      description: "Add one transaction. Negative amount = expense, positive = income. Unknown accounts, vendors and categories are created. Returns the new id (delete it with call_api DELETE /ledgers/{ledgerId}/transactions/{id}).",
      inputSchema: { type: "object", properties: { ...ledgerProp, date: { type: "string", description: "YYYY-MM-DD" }, amount: { type: "number" }, account: { type: "string" }, vendor: { type: "string" }, category: { type: "string" }, sub_category: { type: "string" }, remarks: { type: "string" }, currency: { type: "string", description: "Defaults to the account's" } }, required: ["date", "amount", "account", "vendor", "category"] },
      annotations: { destructiveHint: false, openWorldHint: false },
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const { ledger: _ledger, ...body } = a;
        const r = await api("POST", `/ledgers/${l.id}/transactions`, { body: clean(body) });
        if (!r.ok) return apiError(r);
        const t = r.json;
        return text({ created: true, id: t.id, date: t.date?.slice(0, 10), amount: t.amount, currency: t.currency, account: t.account, vendor: t.vendor, category: t.category });
      },
    },
    {
      name: "import_csv",
      description: "Import a bank/statement CSV from a file on this computer. Columns are mapped automatically (date, description/payee, amount, ...). The default is a PREVIEW (dry_run true); repeat with dry_run false to import. The file's contents never pass through the chat.",
      inputSchema: { type: "object", properties: { ...ledgerProp, path: { type: "string", description: "Absolute path to the .csv file" }, account: { type: "string", description: "Account name, if the file has no account column" }, currency: { type: "string" }, delimiter: { type: "string" }, dry_run: { type: "boolean", description: "Default true" } }, required: ["path"] },
      annotations: { destructiveHint: false, openWorldHint: false },
      async run(a) {
        const l = await resolveLedger(a.ledger);
        let input;
        try { input = readFile(a.path); } catch (e) { return fail(`Cannot read ${a.path}: ${e.message}`); }
        const n = normalizeBankCsv(input, { account: a.account, currency: a.currency ?? l.currency, delimiter: a.delimiter });
        if (n.problems?.length) return fail(n.problems.join(" "));
        const dry = a.dry_run !== false;
        const r = await api("POST", `/ledgers/${l.id}/transactions/import`, { body: { csv: n.csv, dry_run: dry } });
        if (!r.ok) return apiError(r);
        return text({ ledger: l.name, dry_run: dry, rows_in_file: n.rows, column_mapping: n.mapped, result: dry ? { rows: r.json.rows, preview: r.json.preview, note: "Nothing imported yet. Repeat with dry_run:false to import." } : r.json });
      },
    },
  ];

  const byName = new Map(tools.map((t) => [t.name, t]));
  const publicTools = tools.map(({ run: _run, ...def }) => def);

  /** Handle one JSON-RPC message; returns the response object or undefined. */
  async function handle(message) {
    const { id, method, params } = message;
    const reply = (result) => ({ jsonrpc: "2.0", id, result });
    const error = (code, msg) => ({ jsonrpc: "2.0", id, error: { code, message: msg } });
    if (id === undefined) return undefined; // notifications need no reply
    if (method === "initialize") return reply({ protocolVersion: params?.protocolVersion ?? "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "vaulted-money", version: "1.0.0" } });
    if (method === "ping") return reply({});
    if (method === "tools/list") return reply({ tools: publicTools });
    if (method === "tools/call") {
      const tool = byName.get(params?.name);
      if (!tool) return error(-32602, `Unknown tool ${params?.name}`);
      try { return reply(await tool.run(params.arguments ?? {})); } catch (e) { return reply(fail(e instanceof Error ? e.message : String(e))); }
    }
    return error(-32601, `Method not found: ${method}`);
  }
  return { tools: publicTools, handle, call: (name, args) => byName.get(name).run(args ?? {}) };
}

/** Read the token from VM_TOKEN or the token file. */
export function loadToken(env = process.env) {
  if (env.VM_TOKEN) return env.VM_TOKEN.trim();
  const file = env.VM_TOKEN_FILE ?? join(homedir(), ".vaulted-token");
  try { return readFileSync(file, "utf8").trim(); } catch { throw new Error(`No token: set VM_TOKEN, or save the token from Settings -> Local API in ${file}`); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // The token is re-read on every request, so regenerating it in Settings only
  // needs the new value saved to the token file (no restart).
  const server = createServer({ baseUrl: process.env.VM_BASE_URL ?? "http://127.0.0.1:47821/api/v1", getToken: () => loadToken() });
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    let at;
    while ((at = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, at).trim();
      buffer = buffer.slice(at + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      server.handle(message).then((response) => response && process.stdout.write(JSON.stringify(response) + "\n"));
    }
  });
  process.stderr.write("vaulted-money MCP server ready (stdio)\n");
}

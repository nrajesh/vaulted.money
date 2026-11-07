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
 * turn, so a model with ~100 tools is slow. A dozen curated tools cover the
 * common questions and return trimmed, pre-aggregated answers; `search_api` +
 * `call_api` reach every other endpoint without loading its schema up front.
 *
 * Where the token comes from, first match wins (looked up again on every request):
 *   1. VM_TOKEN       the token itself
 *   2. the desktop app's own api-config.json (token, port, on/off), or the
 *      file named by VM_CONFIG_FILE instead
 *   3. VM_TOKEN_FILE  a file holding the token (default ~/.vaulted-token); only
 *                     used when no app config is found, it does not override one
 *
 *   VM_BASE_URL    the API address; when set it wins over the config's port
 *                  (default http://127.0.0.1:47821/api/v1)
 *   VM_EXPORT_DIR  where large downloads are saved (default ~/vaulted-exports;
 *                  a relative path or ~/... is taken from the home folder)
 */
import { lstatSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
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
export function resolvePeriod({ period, from, to, days } = {}, now = new Date()) {
  if (from || to) return { label: "custom", from: from ?? "0000-01-01", to: to ?? ymd(now) };
  const y = now.getFullYear(), m = now.getMonth();
  const daysAgo = (n) => ymd(new Date(y, m, now.getDate() - n));
  if (days !== undefined && days !== null) {
    // "last 2 days" = today and yesterday, the same convention as last_7_days.
    if (!Number.isInteger(days) || days < 1 || days > 3650) throw new Error(`\`days\` must be a whole number from 1 to 3650, got ${days}.`);
    return { label: `last_${days}_days`, from: daysAgo(days - 1), to: ymd(now) };
  }
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
const DELIMITERS = [",", ";", "\t", "|"];
const CSV_EXTENSIONS = [".csv", ".tsv", ".txt"];
/** Resolve symlinks and the true on-disk spelling when the file exists; otherwise just make the path absolute. */
function realOrResolved(p) {
  try { return realpathSync.native(p); } catch { return resolve(p); }
}
function fileIdentity(p) {
  try { const s = statSync(p); return `${s.dev}:${s.ino}`; } catch { return undefined; }
}
/**
 * True when `path` is one of the protected files. Compares the real path (case
 * folded on macOS and Windows, whose filesystems ignore case) and, as a second
 * check, the file identity (device + inode), which also catches hard links.
 */
function isProtectedFile(path, files, platform) {
  const fold = (p) => (platform === "darwin" || platform === "win32" ? p.toLowerCase() : p);
  const target = fold(realOrResolved(path));
  if (files.some((f) => fold(f) === target)) return true;
  const id = fileIdentity(path);
  return id !== undefined && files.some((f) => fileIdentity(f) === id);
}
/** Files import_csv must never read: the app's own config files and the token file. */
function protectedFiles(env, platform, home) {
  const files = [...appConfigCandidates(env, platform, home), ...(env.VM_CONFIG_FILE ? [env.VM_CONFIG_FILE] : [])];
  files.push(env.VM_TOKEN_FILE ?? join(home, ".vaulted-token"));
  return files.map(realOrResolved);
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
  const missing = ["Date", "Vendor", "Amount"].filter((need) => index[need] === undefined);
  if (missing.length) {
    // Never repeat the file's own text: if this is not a bank statement, its
    // first line could be a password or a key. Say what would be accepted instead.
    const names = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} or ${missing.at(-1)}`;
    const accepted = missing.map((need) => `${need}: ${ALIASES[need].join(", ")}`).join("; ");
    problems.push(`The first line has ${header.length} ${header.length === 1 ? "column" : "columns"}; none is named ${names}. Accepted names (any case) for ${accepted}.`);
  }
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

// --- search_api ranking -----------------------------------------------------
// Whole-word matching (with a crude plural stem), not substring matching:
// "Delete a budget" must not match everything that contains the letter "a".
const SEARCH_STOPWORDS = new Set(["a", "an", "the", "of", "to", "in", "on", "one", "and", "or", "with", "by", "is", "for", "all", "it", "its", "as", "at", "from", "my", "me"]);
// Verbs people use for an operation, mapped to the HTTP method that does it.
const VERB_TO_METHOD = { get: "get", list: "get", show: "get", read: "get", fetch: "get", find: "get", create: "post", add: "post", new: "post", update: "patch", edit: "patch", rename: "patch", change: "patch", delete: "delete", remove: "delete" };
const searchStem = (word) => word.replace(/ies$/, "y").replace(/s$/, "");
const searchTokens = (text) => (text ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(searchStem);

/** Score one operation against the query words. Summary words count most, then path and tags, then a matching verb. */
export function scoreOperation(queryWords, { method, path, summary, tags }) {
  const summaryTokens = new Set(searchTokens(summary));
  const pathTokens = new Set(searchTokens(path.replace(/\{[^}]*\}/g, " ")));
  const tagTokens = new Set(searchTokens((tags ?? []).join(" ")));
  let score = 0;
  for (const word of queryWords) {
    const stem = searchStem(word);
    if (summaryTokens.has(stem)) score += 2;
    if (pathTokens.has(stem)) score += 1;
    if (tagTokens.has(stem)) score += 1;
    if (VERB_TO_METHOD[word] === method.toLowerCase()) score += 1;
  }
  return score;
}

// --- helpers for find_entity, add_transactions and payoff_projection ---------
/** Compare names the way a person would: ignoring case, accents and extra spaces. */
export const normName = (s) => String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
/** A real calendar day written YYYY-MM-DD (rejects 2026-02-30). */
export const isCalendarDay = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const cents = (n) => Math.round(n * 100) / 100;

/**
 * Month-by-month loan payoff, rounded to the cent each month like a lender
 * does. Models are unreliable at this arithmetic, so it is done here.
 * Returns `never: true` when the payment does not even cover the interest.
 */
export function projectPayoff({ balance, annualRatePct, monthlyPayment }, now = new Date()) {
  const monthlyRate = annualRatePct / 100 / 12;
  if (balance <= 0) return { never: false, months: 0, total_interest: 0, total_paid: 0, payoff_month: ymd(now).slice(0, 7) };
  if (!(monthlyPayment > balance * monthlyRate)) return { never: true, months: null, monthly_interest_at_start: cents(balance * monthlyRate) };
  let remaining = balance, interest = 0, months = 0;
  while (remaining > 0.004 && months < 1200) {
    const accrued = cents(remaining * monthlyRate);
    interest += accrued;
    remaining = cents(remaining + accrued - Math.min(monthlyPayment, remaining + accrued));
    months++;
  }
  if (remaining > 0.004) return { never: true, months: null, monthly_interest_at_start: cents(balance * monthlyRate) };
  const end = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return { never: false, months, total_interest: cents(interest), total_paid: cents(balance + interest), payoff_month: `${end.getFullYear()}-${pad2(end.getMonth() + 1)}` };
}

/** The smallest monthly payment (to the cent) that clears the loan within `months`. */
export function requiredPayment({ balance, annualRatePct, months }) {
  const monthlyRate = annualRatePct / 100 / 12;
  let payment = Math.ceil((monthlyRate === 0 ? balance / months : (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))) * 100) / 100;
  // Rounding each month can leave a few cents over: step up until it clears in time.
  for (let i = 0; i < 100; i++) {
    const result = projectPayoff({ balance, annualRatePct, monthlyPayment: payment });
    if (!result.never && result.months <= months) break;
    payment = cents(payment + 0.01);
  }
  return payment;
}

/** Responses longer than this are saved to a file instead of passing through the chat. */
export const INLINE_LIMIT = 20000;

/** The export folder: VM_EXPORT_DIR made absolute (relative and ~/ paths start at home), or ~/vaulted-exports. */
export function exportFolder(env, home) {
  const chosen = env.VM_EXPORT_DIR?.trim();
  if (!chosen) return join(home, "vaulted-exports");
  return resolve(home, chosen === "~" ? "." : chosen.replace(/^~[/\\]/, ""));
}

/**
 * Save an export without ever replacing or following an existing file, and
 * return the path written. The folder must be a real folder owned by this user,
 * not a symlink and not the home folder itself. A missing folder is created
 * owner-only (0700); an existing one keeps its permissions. The file is created
 * owner-only (0600) with O_EXCL ("wx"), which also fails on a planted symlink;
 * if the name is taken, -1, -2, ... is added.
 */
export function writeExportFile(dir, fileName, data, { home = homedir(), uid = process.getuid?.() } = {}) {
  let folder;
  try { folder = lstatSync(dir); } catch (e) {
    if (e?.code !== "ENOENT") throw e;
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    folder = lstatSync(dir);
  }
  if (folder.isSymbolicLink()) throw new Error("the export folder is a symbolic link");
  if (!folder.isDirectory()) throw new Error("the export folder is not a folder");
  // Compare by identity, not by spelling: "~/", "~/." and a case variant are all home.
  let homeInfo;
  try { homeInfo = statSync(home); } catch { /* no home folder to protect */ }
  if (homeInfo && folder.dev === homeInfo.dev && folder.ino === homeInfo.ino) throw new Error("the export folder is your home folder; set VM_EXPORT_DIR to a folder of its own");
  // uid is unavailable on Windows, where the user's profile folder is private already.
  if (uid !== undefined && folder.uid !== uid) throw new Error("the export folder belongs to another user");
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot) : "";
  for (let attempt = 0; attempt < 100; attempt++) {
    const path = join(dir, attempt ? `${stem}-${attempt}${extension}` : fileName);
    try {
      writeFileSync(path, data, { mode: 0o600, flag: "wx" });
      return path;
    } catch (e) {
      if (e?.code !== "EEXIST") throw e;
    }
  }
  throw new Error("too many exports with the same name; delete some old ones");
}
/** POST endpoints that only read (they are POST so that a password is not put in the URL). */
const READ_ONLY_POSTS = [/^\/backups\/export$/];

export function createServer({
  baseUrl,
  getBaseUrl,
  token,
  getToken,
  now = () => new Date(),
  fetchImpl = fetch,
  readFile = (p) => readFileSync(p, "utf8"),
  env = process.env,
  platform = process.platform,
  home = homedir(),
  getConnection,
  exportDir = exportFolder(env, home),
  // Owner-only and never overwriting: exports can hold the whole ledger.
  saveExport = (dir, fileName, data) => writeExportFile(dir, fileName, data, { home }),
}) {
  let ledgers, spec;
  const api = async (method, path, { query, body } = {}) => {
    // Look the connection up once, outside the fetch's try: a missing or
    // switched-off config must be reported as that, not as "not running".
    const connection = getConnection ? getConnection() : { baseUrl: getBaseUrl ? getBaseUrl() : baseUrl, token: getToken ? getToken() : token };
    const base = connection.baseUrl.replace(/\/$/, "");
    const url = new URL(base + path);
    // The endpoint that runs must be exactly the one asked for: no segment
    // resolved away, no character dropped. The parser only adds %-encoding, so
    // comparing the decoded forms ignores that and catches everything else.
    const decoded = (value) => { try { return decodeURIComponent(value); } catch { return value; } };
    const intended = new URL(base).pathname.replace(/\/$/, "") + path.split(/[?#]/)[0];
    if (decoded(url.pathname) !== decoded(intended)) throw new Error("That path is not a plain API path (it has \"..\", \".\", a backslash or control characters).");
    for (const [k, v] of Object.entries(clean(query ?? {}))) url.searchParams.set(k, String(v));
    let res;
    try {
      res = await fetchImpl(url, { method, headers: { Authorization: `Bearer ${connection.token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      // Connection refused or reset: the desktop app is not running.
      throw new Error("Vaulted Money is not running. Open the desktop app (it can stay in the tray) and try again.");
    }
    const raw = await res.text();
    let json;
    try { json = raw ? JSON.parse(raw) : null; } catch { json = undefined; }
    return { ok: res.ok, status: res.status, json, raw, disposition: res.headers?.get?.("content-disposition") ?? "" };
  };
  /**
   * Hand a successful response to the model. Small ones pass straight through.
   * A large export (CSV, backup) would be cut off or flood a small model's
   * context, so it is written to a file and the model gets the path, the size
   * and a short preview.
   */
  function deliver(r) {
    const isJson = r.json !== undefined && r.json !== null;
    const isDownload = /attachment/i.test(r.disposition);
    if (r.raw.length <= INLINE_LIMIT || (isJson && !isDownload)) return text(isJson ? r.json : r.raw);
    const suggested = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(r.disposition)?.[1] ?? "export.txt";
    let decoded;
    try { decoded = decodeURIComponent(suggested); } catch { decoded = "export.txt"; } // malformed %-escape
    const safeName = basename(decoded).replace(/[^\w.-]+/g, "_") || "export.txt";
    const stamp = now().toISOString().replace(/[-:]/g, "").replace(/\..*$/, "").replace("T", "-");
    let file;
    try {
      file = saveExport(exportDir, `${stamp}-${safeName}`, r.raw);
    } catch (e) {
      return fail(`The response is ${r.raw.length} characters, too large to show, and it could not be saved in ${exportDir}: ${e instanceof Error ? e.message : e}`);
    }
    return text({ saved_to: file, characters: r.raw.length, preview: r.raw.slice(0, 1500), note: "Too large to show here, so it was saved on this computer only. Open that file to see all of it. It may contain your financial data: delete it when you are done." });
  }
  const apiError = (r) => fail(`API ${r.status}: ${r.json?.error?.message ?? r.raw.slice(0, 300)}${r.json?.error?.details ? " " + JSON.stringify(r.json.error.details) : ""}`);

  async function fetchLedgers() {
    const r = await api("GET", "/ledgers");
    if (!r.ok) throw new Error(`API ${r.status}: ${r.json?.error?.message ?? r.raw.slice(0, 200)}${r.status === 401 ? " (the token no longer matches Settings -> Local API; reconnect or restart the app)" : ""}`);
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
  const DAYS_PROP = { type: "number", description: "The last N days including today (2 = today and yesterday). Use for 'last 2 days', 'past 10 days'; the server works out the dates." };
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
      description: "Where the money goes: totals plus top categories, vendors and accounts, and a time series. Prefer `period` or `days` over dates. Default: last_30_days. The result states the exact dates used and today's date. Use for 'where is my money going', 'how much did I spend', 'compare months'.",
      inputSchema: { type: "object", properties: { ...ledgerProp, period: PERIOD_PROP, days: DAYS_PROP, from: { type: "string", description: "YYYY-MM-DD; only if no named period fits" }, to: { type: "string", description: "YYYY-MM-DD" }, group_by: { type: "string", enum: ["day", "week", "month"] }, top: { type: "number", description: "Rows per breakdown (default 8)" } } },
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
      inputSchema: { type: "object", properties: { ...ledgerProp, period: { ...PERIOD_PROP, description: "Optional: limit to a named period. Omit for all dates." }, days: DAYS_PROP, search: { type: "string", description: "Free text" }, vendor: { type: "string" }, category: { type: "string" }, sub_category: { type: "string" }, account: { type: "string" }, type: { type: "string", enum: ["income", "expense"] }, min_amount: { type: "number" }, max_amount: { type: "number" }, from: { type: "string" }, to: { type: "string" }, exclude_transfers: { type: "boolean" }, limit: { type: "number" }, offset: { type: "number" } } },
      annotations: read,
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const { ledger: _ledger, period, days, ...query } = a;
        // Explicit from/to win; otherwise `days`, then the named period.
        const range = !query.from && !query.to && (days !== undefined || period) ? resolvePeriod({ period, days }, now()) : undefined;
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
        const words = a.query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !SEARCH_STOPWORDS.has(w));
        const hits = [];
        for (const [path, ops] of Object.entries(s.paths)) {
          for (const [method, op] of Object.entries(ops)) {
            const score = scoreOperation(words, { method, path, summary: op.summary, tags: op.tags });
            if (score) hits.push({ score, method: method.toUpperCase(), path, op });
          }
        }
        // Ties go to the shorter path: "get a budget" should beat deeper routes.
        hits.sort((x, y) => y.score - x.score || x.path.length - y.path.length);
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
        if (typeof a.path !== "string" || typeof a.method !== "string") return fail("Give `method` and `path`.");
        // URL parsing drops tabs and newlines and resolves ".." (also written
        // %2e%2e), which could reach a different endpoint than the one previewed.
        // A ".." in the query string is just a value, so only the path part is checked.
        if (/[\u0000-\u001F\u007F]/.test(a.path)) return fail("The path must not contain control characters.");
        if (a.path.split(/[?#]/)[0].split(/[/\\]/).some((segment) => /^(\.|%2e){1,2}$/i.test(segment))) return fail("The path must not contain \".\" or \"..\" segments.");
        let path = a.path.replace(/^\/?api\/v1/, "").replace(/^(?!\/)/, "/");
        if (path.includes("{ledgerId}")) path = path.replaceAll("{ledgerId}", (await resolveLedger(a.ledger)).id);
        const method = a.method.toUpperCase();
        // A POST that only reads (an encrypted backup export) needs no preview.
        if (method === "GET" || (method === "POST" && READ_ONLY_POSTS.some((p) => p.test(path)))) {
          const r = await api(method, path, { query: a.query, body: method === "GET" ? undefined : (a.body ?? {}) });
          return r.ok ? deliver(r) : apiError(r);
        }
        let body = a.body;
        // Only a real boolean true confirms: "false", "no" or 1 must not run a change.
        if (a.confirm !== true) {
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
        return r.ok ? (r.status === 204 ? text({ deleted: true }) : deliver(r)) : apiError(r);
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
      description: "Import a bank/statement CSV from a file on this computer. Columns are mapped automatically (date, description/payee, amount, ...). The default is a PREVIEW (dry_run true); repeat with dry_run false to import. The whole file is not sent to the chat: only the matched column mapping and a short preview of rows come back.",
      inputSchema: { type: "object", properties: { ...ledgerProp, path: { type: "string", description: "Absolute path to the .csv file" }, account: { type: "string", description: "Account name, if the file has no account column" }, currency: { type: "string" }, delimiter: { type: "string", enum: DELIMITERS, description: "Optional: , ; tab or |. Detected automatically if omitted." }, dry_run: { type: "boolean", description: "Default true" } }, required: ["path"] },
      annotations: { destructiveHint: false, openWorldHint: false },
      async run(a) {
        if (a.delimiter !== undefined && !DELIMITERS.includes(a.delimiter)) return fail("The delimiter must be one of: comma, semicolon, tab or | (pipe).");
        if (typeof a.path === "string" && isProtectedFile(a.path, protectedFiles(env, platform, home), platform)) return fail("I can't import that file: it is not a bank statement. Pick your bank's CSV export instead.");
        if (typeof a.path !== "string" || !CSV_EXTENSIONS.includes(extname(a.path).toLowerCase())) return fail("I can only import bank statement files ending in .csv, .tsv or .txt.");
        const l = await resolveLedger(a.ledger);
        let input;
        // No path and no OS error text: they would tell the model what exists on this computer.
        try { input = readFile(a.path); } catch { return fail("Cannot read that file."); }
        const n = normalizeBankCsv(input, { account: a.account, currency: a.currency ?? l.currency, delimiter: a.delimiter });
        if (n.problems?.length) return fail(n.problems.join(" "));
        const dry = a.dry_run !== false;
        const r = await api("POST", `/ledgers/${l.id}/transactions/import`, { body: { csv: n.csv, dry_run: dry } });
        if (!r.ok) return apiError(r);
        return text({ ledger: l.name, dry_run: dry, rows_in_file: n.rows, column_mapping: n.mapped, result: dry ? { rows: r.json.rows, preview: r.json.preview, note: "Nothing imported yet. Repeat with dry_run:false to import." } : r.json });
      },
    },
    {
      name: "find_entity",
      description: "Look up a name across accounts, vendors, categories, sub-categories, budgets and recurring transactions. Call it BEFORE deleting, renaming or merging something the user named, so you know whether the name means more than one thing. If `ambiguous` is true, ask the user which one they mean.",
      inputSchema: { type: "object", properties: { ...ledgerProp, query: { type: "string", description: "The name or part of it" } }, required: ["query"] },
      annotations: read,
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const wanted = normName(a.query);
        if (!wanted) return fail("Give a name to look for.");
        const get = async (path) => (await api("GET", `/ledgers/${l.id}/${path}`)).json?.data ?? [];
        const [accounts, vendors, categories, budgets, recurring] = await Promise.all([get("accounts"), get("vendors"), get("categories"), get("budgets"), get("scheduled-transactions")]);
        const found = [];
        const consider = (type, name, details) => {
          const n = normName(name);
          if (n && n.includes(wanted)) found.push({ exact: n === wanted, match: clean({ type, name, ...details }) });
        };
        for (const x of accounts) consider("account", x.name, { id: x.id, account_type: x.type, currency: x.currency, balance: round(x.balance ?? 0) });
        for (const x of vendors) consider("vendor", x.name, { id: x.id });
        for (const c of categories) {
          consider("category", c.name, { id: c.id, sub_categories: c.sub_categories?.length });
          for (const s of c.sub_categories ?? []) consider("sub_category", s.name, { id: s.id, in_category: c.name, category_id: c.id });
        }
        for (const b of budgets) consider("budget", b.budget_scope && b.budget_scope !== "category" ? (b.budget_scope_name || b.category_name) : (b.sub_category_name ? `${b.category_name} / ${b.sub_category_name}` : b.category_name), { id: b.id, scope: b.budget_scope ?? "category", target: b.target_amount, frequency: b.frequency, goal: b.is_goal || undefined });
        for (const r of recurring) consider("recurring_transaction", r.vendor, { id: r.id, amount: r.amount, frequency: r.frequency, account: r.account, next: r.date?.slice(0, 10) });
        found.sort((x, y) => Number(y.exact) - Number(x.exact));
        const exact = found.filter((f) => f.exact);
        const kinds = [...new Set(exact.map((f) => f.match.type))];
        const ambiguous = exact.length > 1 || (exact.length === 0 && found.length > 1);
        return text({
          ledger: l.name,
          query: a.query,
          matches: found.slice(0, 25).map((f) => ({ ...f.match, exact: f.exact || undefined })),
          ambiguous,
          note: ambiguous
            ? `${exact.length > 1 ? `The name matches ${kinds.join(" and ")} exactly` : "Several things partly match"}. Ask the user which one they mean before changing anything.`
            : found.length ? "One match." : "Nothing matches. Check the spelling, or try a shorter part of the name.",
        });
      },
    },
    {
      name: "add_transactions",
      description: "Add many transactions at once (up to 1000), for a pasted statement, a receipt list or a PDF you have read. Rows: {date YYYY-MM-DD, amount (negative = expense), account, vendor, category, sub_category?, remarks?, currency?}. The default is a PREVIEW that flags new accounts (often a typo), new categories and likely duplicates of what is already there; repeat with dry_run false to add.",
      inputSchema: { type: "object", properties: { ...ledgerProp, transactions: { type: "array", items: { type: "object", properties: { date: { type: "string" }, amount: { type: "number" }, account: { type: "string" }, vendor: { type: "string" }, category: { type: "string" }, sub_category: { type: "string" }, remarks: { type: "string" }, currency: { type: "string" } }, required: ["date", "amount", "account", "vendor"] } }, dry_run: { type: "boolean", description: "Default true" }, skip_duplicates: { type: "boolean", description: "Leave out rows that look like ones already recorded" } }, required: ["transactions"] },
      annotations: { destructiveHint: false, openWorldHint: false },
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const input = a.transactions;
        if (!Array.isArray(input) || !input.length) return fail("`transactions` must be a non-empty list.");
        if (input.length > 1000) return fail(`${input.length} rows is more than the 1000 allowed in one call. Split it into batches.`);
        const problems = [];
        const rows = input.map((row, i) => {
          const at = `Row ${i + 1}`;
          const text_ = (v) => (typeof v === "string" ? v.trim() : v);
          const r = clean({ date: text_(row.date), amount: row.amount, account: text_(row.account), vendor: text_(row.vendor), category: text_(row.category) ?? "", sub_category: text_(row.sub_category), remarks: text_(row.remarks), currency: text_(row.currency)?.toUpperCase?.() });
          if (!isCalendarDay(r.date)) problems.push(`${at}: date "${row.date}" is not a real YYYY-MM-DD day.`);
          if (typeof r.amount !== "number" || !Number.isFinite(r.amount) || r.amount === 0) problems.push(`${at}: amount must be a non-zero number.`);
          if (!r.account) problems.push(`${at}: account is missing.`);
          if (!r.vendor) problems.push(`${at}: vendor is missing.`);
          if (r.currency && !/^[A-Z]{3}$/.test(r.currency)) problems.push(`${at}: currency "${row.currency}" is not a 3-letter code.`);
          return { ...r, category: r.category ?? "" };
        });
        if (problems.length) return fail(`Nothing was added. ${problems.length} problem(s):\n${problems.slice(0, 10).join("\n")}${problems.length > 10 ? `\n...and ${problems.length - 10} more` : ""}`);

        // Compare with what is already there, so a typo does not quietly create a new account.
        const dates = rows.map((r) => r.date).sort();
        const get = async (path, query) => (await api("GET", `/ledgers/${l.id}/${path}`, { query })).json?.data ?? [];
        const [accounts, vendors, categories, existing] = await Promise.all([get("accounts"), get("vendors"), get("categories"), get("transactions", { from: dates[0], to: dates.at(-1), limit: 1000 })]);
        const known = (list) => new Set(list.map((x) => normName(x.name)));
        const knownAccounts = known(accounts), knownVendors = known(vendors), knownCategories = known(categories);
        const unseen = (field, set) => [...new Map(rows.filter((r) => r[field] && !set.has(normName(r[field]))).map((r) => [normName(r[field]), r[field]])).values()];
        const key = (r) => `${String(r.date).slice(0, 10)}|${normName(r.account)}|${normName(r.vendor)}|${cents(r.amount)}`;
        const seen = new Set(existing.map(key));
        const duplicates = rows.filter((r) => seen.has(key(r)));
        const toAdd = a.skip_duplicates === true ? rows.filter((r) => !seen.has(key(r))) : rows;

        const dry = a.dry_run !== false;
        if (dry) {
          const newVendors = unseen("vendor", knownVendors);
          return text({
            ledger: l.name, dry_run: true, rows: rows.length, date_range: { from: dates[0], to: dates.at(-1) },
            total_income: cents(rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0)),
            total_expenses: cents(-rows.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0)),
            new_accounts: unseen("account", knownAccounts), new_categories: unseen("category", knownCategories),
            new_vendors: { count: newVendors.length, examples: newVendors.slice(0, 10) },
            possible_duplicates: { count: duplicates.length, examples: duplicates.slice(0, 5), checked_against: existing.length },
            sample: rows.slice(0, 5),
            note: "Nothing added yet. Show the user new_accounts (a likely typo if the account already exists under another spelling) and possible_duplicates, then repeat with dry_run:false. Use skip_duplicates:true to leave out the duplicates.",
          });
        }
        if (!toAdd.length) return text({ ledger: l.name, dry_run: false, added: 0, note: "Every row looked like a duplicate, so nothing was added." });
        const r = await api("POST", `/ledgers/${l.id}/transactions/bulk`, { body: { transactions: toAdd } });
        if (!r.ok) return apiError(r);
        const ids = (r.json?.data ?? []).map((t) => t.id);
        return text({ ledger: l.name, dry_run: false, added: r.json?.count ?? ids.length, skipped_duplicates: a.skip_duplicates === true ? duplicates.length : 0, ids: ids.slice(0, 100), ids_not_shown: Math.max(0, ids.length - 100) || undefined, undo: "Each can be removed with call_api DELETE /ledgers/{ledgerId}/transactions/{id}." });
      },
    },
    {
      name: "budget_history",
      description: "Which budgets you keep missing: spent against target for each past month, quarter or year, with how many were missed. Use for 'which budgets am I regularly over', 'did I stick to my budget'. The running period is shown but not counted.",
      inputSchema: { type: "object", properties: { ...ledgerProp, periods: { type: "number", description: "How many periods back, 1-24 (default 6)" } } },
      annotations: read,
      async run(a) {
        const l = await resolveLedger(a.ledger);
        const r = await api("GET", `/ledgers/${l.id}/budgets/history`, { query: { periods: a.periods ?? 6 } });
        if (!r.ok) return apiError(r);
        const budgets = r.json.data.map((b) => ({
          name: b.name, scope: b.scope, frequency: b.frequency, currency: b.currency, target: b.target_amount, ...b.summary,
          periods: b.periods.map((p) => clean({ start: p.period_start, spent: p.spent, missed: p.missed || undefined, running: p.in_progress || undefined })),
        }));
        return text({
          ledger: l.name, today: r.json.as_of, periods_requested: r.json.periods_requested, budgets,
          regularly_missed: budgets.filter((b) => b.periods_counted >= 3 && b.miss_rate_pct >= 50).map((b) => b.name),
          not_measured: r.json.skipped.map((s) => `${s.name}: ${s.reason}`),
        });
      },
    },
    {
      name: "payoff_projection",
      description: "Can a loan be paid off in time? Computes months to payoff and interest for the current payment, with any extra, and the payment needed to clear it within `target_months`, next to what the ledger shows is left over each month. Needs the balance and interest rate from the user (they are not stored). Use for 'can I pay this off in two years'.",
      inputSchema: { type: "object", properties: { ...ledgerProp, balance: { type: "number", description: "Amount still owed" }, annual_rate_pct: { type: "number", description: "Yearly interest rate in percent, e.g. 6.5" }, monthly_payment: { type: "number", description: "What is paid each month now" }, extra_monthly: { type: "number", description: "Optional extra to try each month" }, target_months: { type: "number", description: "Payoff goal in months (default 24)" }, include_capacity: { type: "boolean", description: "Also read the last year's income and spending from the ledger (default true)" } }, required: ["balance", "annual_rate_pct", "monthly_payment"] },
      annotations: read,
      async run(a) {
        const num = (v, name, min, max) => { if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new Error(`\`${name}\` must be a number from ${min} to ${max}.`); return v; };
        const balance = num(a.balance, "balance", 0.01, 1e9), rate = num(a.annual_rate_pct, "annual_rate_pct", 0, 100), payment = num(a.monthly_payment, "monthly_payment", 0.01, 1e9);
        const extra = a.extra_monthly === undefined ? 0 : num(a.extra_monthly, "extra_monthly", 0, 1e9);
        const target = a.target_months === undefined ? 24 : num(a.target_months, "target_months", 1, 600);
        const at = now();
        const scenario = (monthlyPayment) => projectPayoff({ balance, annualRatePct: rate, monthlyPayment }, at);
        const needed = requiredPayment({ balance, annualRatePct: rate, months: Math.round(target) });
        const out = { today: ymd(at), inputs: { balance, annual_rate_pct: rate, monthly_payment: payment }, current_payment: { monthly_payment: payment, ...scenario(payment) } };
        if (extra > 0) out.with_extra = { monthly_payment: cents(payment + extra), extra, ...scenario(payment + extra) };
        out.to_clear_in_target = { target_months: Math.round(target), monthly_payment_needed: needed, extra_needed_per_month: cents(Math.max(0, needed - payment)), ...scenario(needed) };
        if (a.include_capacity !== false) {
          try {
            const l = await resolveLedger(a.ledger);
            const range = resolvePeriod({ days: 365 }, at);
            const r = await api("GET", `/ledgers/${l.id}/analytics`, { query: { from: range.from, to: range.to, group_by: "month" } });
            if (!r.ok) throw new Error(`API ${r.status}`);
            const months = r.json.series?.length ?? 0;
            if (!months) out.ledger_capacity = { ledger: l.name, note: "No income or spending in the last year to base this on." };
            else {
              const net = cents(r.json.totals.net / months);
              out.ledger_capacity = { ledger: l.name, period: range, currency: r.json.currency, months_with_data: months, average_monthly_income: cents(r.json.totals.income / months), average_monthly_expenses: cents(r.json.totals.expenses / months), average_monthly_net: net, note: "Income minus expenses, transfers excluded, averaged over the months that have data. Repayments recorded as expenses are already taken out of this; repayments recorded as transfers are not." };
              out.to_clear_in_target.affordable_from_average_net = out.to_clear_in_target.extra_needed_per_month <= Math.max(0, net);
            }
          } catch (e) {
            out.ledger_capacity = { unavailable: e instanceof Error ? e.message : String(e) };
          }
        }
        out.assumptions = "Fixed rate, payments made on time every month, no fees or rate changes. The balance and payments are taken to be in the ledger's currency. An estimate, not financial advice.";
        return text(out);
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

const DEFAULT_BASE_URL = "http://127.0.0.1:47821/api/v1";
// Electron's userData folder: the app can use either name (product name or package name), so both are tried.
const APP_FOLDER_NAMES = ["Vaulted Money", "vite_react_shadcn_ts"];

/** Where the desktop app keeps api-config.json (token, port, enabled), most likely first. */
export function appConfigCandidates(env = process.env, platform = process.platform, home = homedir()) {
  const root = platform === "darwin" ? join(home, "Library", "Application Support")
    : platform === "win32" ? (env.APPDATA || join(home, "AppData", "Roaming"))
    : (env.XDG_CONFIG_HOME || join(home, ".config"));
  return APP_FOLDER_NAMES.map((name) => join(root, name, "api-config.json"));
}

/**
 * Find the token and base URL: VM_TOKEN, then the desktop app's own
 * api-config.json, then the token file as a fallback. Re-read per request so a new token or port needs no restart.
 */
export function loadConnection(env = process.env, platform = process.platform, home = homedir()) {
  const baseUrl = env.VM_BASE_URL ?? DEFAULT_BASE_URL;
  if (env.VM_TOKEN) return { token: env.VM_TOKEN.trim(), baseUrl };
  const candidates = env.VM_CONFIG_FILE ? [env.VM_CONFIG_FILE] : appConfigCandidates(env, platform, home);
  for (const file of candidates) {
    let config;
    try { config = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    if (!config || typeof config !== "object") continue;
    if (config.enabled === false) throw new Error("Vaulted Money's Local API is off. Open the app, go to Settings \u2192 Local API and switch it on.");
    if (typeof config.token === "string" && config.token) {
      return { token: config.token, baseUrl: env.VM_BASE_URL ?? (Number.isInteger(config.port) ? `http://127.0.0.1:${config.port}/api/v1` : DEFAULT_BASE_URL) };
    }
  }
  try {
    const fromFile = readFileSync(env.VM_TOKEN_FILE ?? join(home, ".vaulted-token"), "utf8").trim();
    if (fromFile) return { token: fromFile, baseUrl };
  } catch { /* no token file either */ }
  throw new Error("Could not find Vaulted Money. Open the desktop app once, or set VM_TOKEN.");
}

/** Read the token (kept for callers that only need the token). */
export function loadToken(env = process.env) {
  return loadConnection(env).token;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // The connection is re-read on every request, so a regenerated token or a
  // changed port in the app's config is picked up without a restart.
  const server = createServer({ getConnection: () => loadConnection() });
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

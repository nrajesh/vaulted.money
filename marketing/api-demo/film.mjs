/**
 * The composition. Every scene is a pure function of time: window.__render(t)
 * poses the whole frame, so any frame renders identically in any order.
 * All API text on screen comes from out/api-run.json, a real recorded run.
 */
import { SCENES, FADE, scene } from "./timeline.mjs";

// ── motion helpers ──────────────────────────────────────────────────────────
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2),
};
const tw = (t, a, b, f = ease.out) => f(prog(t, a, b));
const stage = document.getElementById("stage");
const h = (html) => {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
};

/** Fade + rise an element in at `at`; optional `out` fade-out time. */
function appear(el, t, at, { dy = 24, dur = 0.7, out = Infinity, dx = 0, scale = 0 } = {}) {
  const k = tw(t, at, at + dur) * (Number.isFinite(out) ? 1 - tw(t, out, out + 0.5, ease.inOut) : 1);
  el.style.opacity = k;
  el.style.transform = `translate(${(1 - k) * dx}px, ${(1 - k) * dy}px) scale(${1 - (1 - k) * scale})`;
  el.style.visibility = k > 0.001 ? "visible" : "hidden";
}
/** A highlight ring that pulses in at `at`. */
function ring(el, t, at, until = Infinity) {
  const k = tw(t, at, at + 0.5) * (Number.isFinite(until) ? 1 - tw(t, until, until + 0.5) : 1);
  el.style.opacity = k;
  el.style.transform = `scale(${1 + (1 - k) * 0.06})`;
}

// ── data ────────────────────────────────────────────────────────────────────
const run = await (await fetch("out/api-run.json")).json();
const step = (id) => run.steps.find((s) => s.id === id);
const short = (id) => (typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(id) ? id.slice(0, 8) + "…" : id);
const LEDGER_ID = step("ledger").response.id;

// ── syntax colouring ────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const val = (v) =>
  typeof v === "string"
    ? `<span class="s">"${esc(short(v))}"</span>`
    : typeof v === "number"
      ? `<span class="n">${v}</span>`
      : `<span class="v">${v}</span>`;
/** Pretty-print JSON as coloured lines; short objects stay on one line. */
function jsonLines(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const inline = (x) =>
    x && typeof x === "object"
      ? Array.isArray(x)
        ? "[" + x.map(inline).join(", ") + "]"
        : "{ " + Object.entries(x).map(([k, v]) => `<span class="k">"${k}"</span>: ${inline(v)}`).join(", ") + " }"
      : val(x);
  const plain = (x) => inline(x).replace(/<[^>]+>/g, "");
  if (typeof value === "string" && value.length > 46) {
    // Wrap long strings across lines so nothing runs off the terminal.
    const words = value.split(" ");
    const rows = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > 46) { rows.push(cur); cur = w; } else cur = (cur + " " + w).trim();
    }
    rows.push(cur);
    return rows.map((r, i) => pad + `<span class="s">${i === 0 ? '"' : " "}${esc(r)}${i === rows.length - 1 ? '"' : ""}</span>`);
  }
  if (value === null || typeof value !== "object") return [pad + val(value)];
  if (plain(value).length + indent * 2 < 62) return [pad + inline(value)];
  const out = [];
  if (Array.isArray(value)) {
    out.push(pad + "[");
    value.forEach((x, i) => {
      const lines = jsonLines(x, indent + 1);
      lines[lines.length - 1] += i < value.length - 1 ? "," : "";
      out.push(...lines);
    });
    out.push(pad + "]");
  } else {
    out.push(pad + "{");
    const entries = Object.entries(value);
    entries.forEach(([k, v], i) => {
      const lines = jsonLines(v, indent + 1);
      lines[0] = "  ".repeat(indent + 1) + `<span class="k">"${k}"</span>: ` + lines[0].trimStart();
      lines[lines.length - 1] += i < entries.length - 1 ? "," : "";
      out.push(...lines);
    });
    out.push(pad + "}");
  }
  return out;
}

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
/** What each step shows on screen: a faithful subset of the real response. */
const VIEW = {
  "ledgers-empty": (r) => r,
  ledger: (r) => pick(r, ["id", "name", "currency", "icon"]),
  account: (r) => pick(r, ["id", "name", "currency", "starting_balance", "type"]),
  account2: (r) => pick(r, ["id", "name", "currency", "starting_balance", "type"]),
  tx1: (r) => pick(r, ["date", "amount", "account", "vendor", "category", "sub_category"]),
  "tx-bulk": (r) => ({ data: r.data.map((x) => pick(x, ["date", "amount", "vendor", "category"])) }),
  "import-dry": (r) => ({ dry_run: r.dry_run, rows: r.rows, imported: r.imported, preview: [pick(r.preview[0], ["Vendor", "Category", "Amount"]), "…"] }),
  import: (r) => r,
  "cat-hist": (r) => ({ ...pick(r, ["uncategorized_found", "categorized", "still_uncategorized", "sources"]) }),
  "ai-none": (r) => r,
  "ai-provider": (r) => pick(r, ["name", "baseUrl", "model", "isDefault", "has_api_key"]),
  "ai-key": (r) => pick(r, ["name", "has_api_key"]),
  "ai-dry": (r) => ({ ...pick(r, ["dry_run", "matched", "sources"]), changes: r.changes.slice(0, 2).map((c) => pick(c, ["vendor", "category", "sub_category", "source"])) }),
  ai: (r) => pick(r, ["categorized", "still_uncategorized", "sources"]),
  analytics: (r) => ({ totals: r.totals, byCategory: r.byCategory.slice(0, 3).map((c) => pick(c, ["category", "expenses", "share"])) }),
  budget: (r) => pick(r, ["category_name", "target_amount", "frequency", "budget_scope", "is_active"]),
  "sec-nobearer": (r) => r,
  "sec-wrong": (r) => r,
  "sec-origin": (r) => r,
};

/** A realistic curl line for a recorded step ($L stands for the ledger id). */
function curlLines(s) {
  let path = s.path.replace("/api/v1", "").replace(LEDGER_ID, "$L");
  const q = path.includes("?") ? `"$VM${path}"` : `$VM${path}`;
  const lines = [];
  const body = s.requestBody !== undefined ? JSON.stringify(s.requestBody) : null;
  const flags = s.method === "GET" ? "" : `-X ${s.method} `;
  const hdr = s.requestHeaders?.Origin ? `-H "$AUTH" -H "Origin: ${s.requestHeaders.Origin}"` : s.requestHeaders?.Authorization === "Bearer nope" ? `-H "Authorization: Bearer nope"` : s.requestHeaders && "Authorization" in s.requestHeaders ? "" : `-H "$AUTH"`;
  lines.push(`curl -s ${flags}${q}` + (hdr || body ? " \\" : ""));
  if (hdr || body) {
    let second = "  " + [hdr, body ? `-d '${body}'` : ""].filter(Boolean).join(" ");
    if (second.length > 68 && body) {
      lines[0] = lines[0];
      lines.push("  " + hdr + " \\");
      // wrap long bodies at commas
      const parts = body.match(/.{1,60}(,|$)/g) ?? [body];
      parts.forEach((p, i) => lines.push("  " + (i === 0 ? "-d '" : "   ") + p + (i === parts.length - 1 ? "'" : "")));
    } else lines.push(second);
  }
  return lines;
}
const hlCmd = (text) =>
  esc(text)
    .replace(/(curl|export)/, '<span class="k">$1</span>')
    .replace(/(\$[A-Z]+)/g, '<span class="v">$1</span>')
    .replace(/(&#39;|')([^']*)(')/g, '<span class="s">$1$2$3</span>')
    .replace(/(-X \w+|-H|-d|-s)/g, '<span class="p">$1</span>');

// ── terminal component ──────────────────────────────────────────────────────
/**
 * items: {at, cmd:[lines]} types out; {at, step:id} shows the real response;
 * {at, raw:[html lines]} shows lines as given.
 */
function makeTerm({ x, y, w, hgt, title, items }) {
  const el = h(`<div class="term" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px">
    <div class="bar"><i></i><i></i><i></i><span>${title}</span></div>
    <div class="body"><div class="scroll"></div></div></div>`);
  const scroller = el.querySelector(".scroll");
  const bodyH = hgt - 46 - 36;
  const CPS = 70; // typing speed (chars/s)
  const LPS = 9; // response lines revealed per second
  const prepared = items.map((it) => {
    if (it.cmd) return { ...it, kind: "cmd", text: it.cmd.join("\n") };
    const s = it.step ? step(it.step) : null;
    const lines = it.raw ?? jsonLines((VIEW[it.step] ?? ((r) => r))(s.response));
    return { ...it, kind: "out", s, lines };
  });
  return {
    el,
    update(t) {
      let html = [];
      let count = 0;
      for (const it of prepared) {
        if (t < it.at) break;
        if (it.kind === "cmd") {
          const typed = it.text.slice(0, Math.floor((t - it.at) * CPS));
          html.push(`<span class="d">$</span> ` + typed.split("\n").map(hlCmd).join("\n  ").replace(/\n {2} {2}/g, "\n    "));
          count += typed.split("\n").length;
        } else {
          const n = Math.min(it.lines.length, Math.floor((t - it.at) * LPS) + 1);
          const status = it.s ? (it.s.status < 300 ? `<span class="status good">${it.s.status} ${it.s.status === 201 ? "Created" : "OK"}</span>` : `<span class="status bad">${it.s.status} ${it.s.status === 401 ? "Unauthorized" : it.s.status === 403 ? "Forbidden" : "Bad Request"}</span>`) : "";
          html.push(status ? status + "\n" + it.lines.slice(0, n).join("\n") : it.lines.slice(0, n).join("\n"));
          count += n + (status ? 1 : 0);
        }
        html.push("");
        count += 1;
      }
      // blinking caret on the last line
      scroller.innerHTML = html.join("\n") + (Math.floor(t * 2) % 2 ? '<span class="caret"></span>' : "");
      scroller.style.transform = `translateY(${-Math.max(0, count * 30 - bodyH)}px)`;
    },
  };
}

// ── small builders ──────────────────────────────────────────────────────────
const ICON = {
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9M16 7l3 3"/></svg>',
  power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 14h.01M16 14h.01"/></svg>',
};
const head = (title, sub) => h(`<div class="head"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>`);
/** A framed screenshot; `hgt`/`off` crop it to a band (off = px skipped at display scale). */
const shot = (src, x, y, w, ratio, cap, { hgt, off = 0 } = {}) =>
  h(`<div class="shot" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt ?? Math.round(w * ratio)}px"><img src="${src}" style="position:absolute;left:0;top:${-off}px;width:100%;height:auto">${cap ? `<div class="cap">${cap}</div>` : ""}</div>`);
const tag = (cls, icon, title, sub, x, y) =>
  h(`<div class="tag ${cls}" style="left:${x}px;top:${y}px"><div class="ico">${icon}</div><div>${title}${sub ? `<small>${sub}</small>` : ""}</div></div>`);
const ringAt = (x, y, w, hgt, cls = "") => h(`<div class="ring ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px"></div>`);
/** Ring positioned in a screenshot's own 1440x900 coordinate space. */
const shotRing = (sh, x, y, w, hgt, cls = "") => {
  // Coordinates are in the 1100x980 app viewport, minus the crop offset.
  const W = parseFloat(sh.style.width) / 1100;
  const off = -parseFloat(sh.querySelector("img").style.top);
  return ringAt(parseFloat(sh.style.left) + x * W, parseFloat(sh.style.top) + y * W - off, w * W, hgt * W, cls);
};

// ── scenes ──────────────────────────────────────────────────────────────────
const built = {}; // id -> { el, update(lt) }
const add = (id, nodes, update) => {
  const el = h(`<section class="scene" id="s-${id}"></section>`);
  nodes.forEach((n) => el.append(n));
  stage.append(el);
  built[id] = { el, update };
};
const S = (name) => `out/screens/${name}.png`;
const RATIO = 980 / 1100;

// 0 · title
{
  const logo = h(`<img src="/repo/assets/brand/dark-icon.png" class="abs" style="left:710px;top:70px;width:500px;height:500px;object-fit:contain">`);
  const word = h(`<div class="abs" style="left:0;right:0;top:500px;text-align:center;font:800 132px/1 var(--sans);letter-spacing:-.045em;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));-webkit-background-clip:text;background-clip:text;color:transparent">Vaulted Money</div>`);
  const sub = h(`<div class="abs" style="left:0;right:0;top:632px;text-align:center;font:600 46px var(--sans);letter-spacing:-.02em">Now with a <span style="padding:2px 18px;border-radius:12px;background:hsl(188 57% 59% / .16);border:1px solid hsl(188 57% 59% / .5);color:var(--accent-soft)">Local API</span></div>`);
  const line = h(`<div class="abs" style="left:0;right:0;top:730px;text-align:center;font:500 30px var(--sans);color:var(--muted)">Your money. Your device. Your API.</div>`);
  const pills = h(`<div class="abs" style="left:0;right:0;top:820px;text-align:center;display:flex;gap:18px;justify-content:center"><span class="pill g">Privacy-first</span><span class="pill b">Data-local</span><span class="pill o">Open-sourced</span></div>`);
  add("title", [logo, word, sub, line, pills], (t) => {
    appear(logo, t, 0.2, { dur: 1.2, scale: 0.15, dy: 0 });
    logo.style.filter = `drop-shadow(0 0 ${30 + 20 * Math.sin(t * 2)}px hsl(188 57% 59% / .45))`;
    appear(word, t, 1.0);
    appear(sub, t, 2.4);
    appear(line, t, 3.6);
    appear(pills, t, 4.8);
  });
}

// 1 · enable
{
  const hd = head("Off by default. <em>One switch.</em>", "Settings → Local API. Nothing runs until you turn it on.");
  const W = 1130;
  const off = shot(S("settings-api-off"), 96, 280, W, 221 / 2016);
  const on = shot(S("settings-api-on"), 96, 280, W, 716 / 2016);
  on.style.height = Math.round((W * 716) / 2016) + "px";
  const r1 = ringAt(96 + W * 0.94, 280 + 0.2 * ((W * 716) / 2016) - 6, 90, 52);
  const r2 = ringAt(96 + 14, 280 + ((W * 716) / 2016) * 0.66, W - 28, 62);
  const term = makeTerm({
    x: 96, y: 740, w: W, hgt: 290, title: "zsh — vaulted-money",
    items: [
      { at: 5.0, cmd: [`export VM="http://127.0.0.1:47821/api/v1"`] },
      { at: 6.4, cmd: [`curl -s $VM/ledgers -H "$AUTH"`] },
      { at: 8.0, step: "ledgers-empty" },
    ],
  });
  const t1 = tag("good", ICON.server, "127.0.0.1 only", "Never reachable from the network", 1290, 330);
  const t2 = tag("", ICON.key, "Bearer token", "256 random bits. Regenerate anytime", 1290, 470);
  const t3 = tag("warn", ICON.power, "App must be running", "Desktop app (Electron)", 1290, 610);
  add("enable", [hd, off, on, r1, r2, term.el, t1, t2, t3], (t) => {
    appear(hd, t, 0.2);
    appear(off, t, 0.6, { dy: 30 });
    on.style.opacity = tw(t, 2.4, 3.0) * tw(t, 0.6, 1.3);
    off.style.opacity = tw(t, 0.6, 1.3) * (1 - tw(t, 2.8, 3.1));
    ring(r1, t, 1.6, 3.4);
    ring(r2, t, 4.2, 6.0);
    appear(t1, t, 2.6, { dx: 40, dy: 0 });
    appear(t2, t, 4.0, { dx: 40, dy: 0 });
    appear(t3, t, 5.2, { dx: 40, dy: 0 });
    appear(term.el, t, 4.6);
    term.update(t);
  });
  built.enable.termOffset = 0;
}

// 2 · create ledger + account
{
  const hd = head("Create a ledger. <em>Add an account.</em>", "Plain JSON over HTTP: no SDK, no sign-up, no waiting for a cloud.");
  const term = makeTerm({
    x: 96, y: 270, w: 880, hgt: 750, title: "zsh — vaulted-money",
    items: [
      { at: 1.0, cmd: curlLines(step("ledger")) },
      { at: 3.4, step: "ledger" },
      { at: 5.4, cmd: curlLines(step("account")) },
      { at: 8.2, step: "account" },
      { at: 10.6, cmd: [`# …and a second one (Savings, €12,000)`] },
    ],
  });
  const led = shot(S("ledgers"), 1010, 300, 814, RATIO, "Vaulted Money app · Ledgers", { hgt: 560 });
  const acc = shot(S("accounts"), 1010, 300, 814, RATIO, "Vaulted Money app · Accounts", { hgt: 560 });
  const chip = tag("good", ICON.check, "Already in the app", "The open UI refreshes after every API change", 1010, 900);
  add("create", [hd, term.el, led, acc, chip], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.5);
    term.update(t);
    appear(led, t, 4.2, { dx: 60, dy: 0 });
    appear(acc, t, 9.0, { dx: 0, dy: 0 });
    appear(chip, t, 10.4, { dy: 20 });
  });
}

// 3 · transactions: add, bulk, import CSV
{
  const hd = head("Add transactions. <em>Or import a statement.</em>", "One at a time, in bulk, or straight from your bank's CSV. Preview first with <b style='color:var(--accent-soft)'>dry_run</b>.");
  const term = makeTerm({
    x: 96, y: 270, w: 880, hgt: 750, title: "zsh — vaulted-money",
    items: [
      { at: 0.8, cmd: curlLines(step("tx1")) },
      { at: 3.3, step: "tx1" },
      { at: 4.6, cmd: [`curl -s -X POST $VM/ledgers/$L/transactions/import \\`, `  -H "$AUTH" -d @sept-statement.json   # { "csv": "...", "dry_run": true }`] },
      { at: 7.2, step: "import-dry" },
      { at: 9.4, cmd: [`# same call without dry_run`] },
      { at: 10.4, step: "import" },
    ],
  });
  const csv = h(`<div class="card" style="left:1010px;top:270px;width:814px;padding:18px 22px"><div style="display:flex;align-items:center;gap:10px;color:var(--muted);font:600 17px var(--sans);margin-bottom:10px"><span style="color:var(--accent);width:22px;height:22px;display:inline-block">${ICON.file}</span>sept-statement.csv · 10 rows · Category column empty</div><div style="font:500 15px/24px var(--mono);color:hsl(210 30% 85%);white-space:pre;overflow:hidden">Date;Account;Vendor;Category;Amount
05/09/2026;Checking;Corner Market;;-38.20
06/09/2026;Checking;Trattoria Roma;;-54.00
08/09/2026;Checking;StreamBox;;-12.99</div></div>`);
  const tx = shot(S("tx-imported"), 1010, 470, 814, RATIO, "Vaulted Money app · Transactions (uncategorised)", { hgt: 430, off: 300 });
  const rg = shotRing(tx, 215, 575, 235, 380);
  const chip = tag("good", ICON.check, "10 imported · 0 skipped", "", 1010, 282);
  add("import", [hd, term.el, csv, tx, rg, chip], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4);
    term.update(t);
    appear(csv, t, 2.0, { dx: 50, dy: 0 });
    appear(tx, t, 10.4, { dx: 50, dy: 0 });
    csv.style.opacity = Math.min(csv.style.opacity, 1 - 0.55 * tw(t, 10.2, 10.8));
    ring(rg, t, 11.4, 13.5);
    appear(chip, t, 10.8, { dy: 0 });
  });
  built.import.t0 = 0;
}

// 4 · categorise from history
{
  const hd = head("Categorise from <em>your own history</em>", "No AI involved: the API reuses the category you last gave each vendor.");
  const term = makeTerm({
    x: 96, y: 270, w: 880, hgt: 750, title: "zsh — vaulted-money",
    items: [
      { at: 0.8, cmd: [`curl -s -X POST $VM/ledgers/$L/transactions/categorize-missing \\`, `  -H "$AUTH" -d '{}'`] },
      { at: 3.2, step: "cat-hist" },
    ],
  });
  const tx = shot(S("tx-history"), 1010, 290, 814, RATIO, "Vaulted Money app · after the call", { hgt: 430, off: 300 });
  const rgA = shotRing(tx, 215, 575, 235, 380);
  const t1 = tag("good", ICON.check, "4 matched from history", "Corner Market, City Transit", 1010, 770);
  const t2 = tag("warn", ICON.sparkles, "6 still uncategorised", "New vendors have no history yet", 1010, 870);
  add("history", [hd, term.el, tx, rgA, t1, t2], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4);
    term.update(t);
    appear(tx, t, 5.2, { dx: 50, dy: 0 });
    appear(t1, t, 6.6, { dy: 14 });
    appear(t2, t, 8.2, { dy: 14 });
    ring(rgA, t, 7.2, 8.4);
  });
}

// 5 · optional AI
{
  const hd = head("AI is <em>optional</em>, and only when you ask", "Off unless you pass <b style='color:var(--accent-soft)'>use_ai: true</b>. Point it at a model running on your own machine.");
  const term = makeTerm({
    x: 96, y: 270, w: 880, hgt: 750, title: "zsh — vaulted-money",
    items: [
      { at: 0.8, cmd: [`curl -s -X POST $VM/ledgers/$L/transactions/categorize-missing \\`, `  -H "$AUTH" -d '{"use_ai":true}'`] },
      { at: 2.8, step: "ai-none" },
      { at: 4.2, cmd: [`# register a model on localhost, store its key (write-only)`] },
      { at: 5.4, step: "ai-provider" },
      { at: 7.2, step: "ai-key" },
      { at: 8.6, cmd: [`curl … categorize-missing -d '{"use_ai":true}'`] },
      { at: 10.0, step: "ai" },
    ],
  });
  const req = run.extra.aiRequest;
  const prompt = req.body.messages[0].content;
  const vendors = JSON.parse(prompt.match(/Vendors\/Payees to Categorize:\n(\[.*\])/)[1]);
  const cats = [...prompt.matchAll(/Category: "([^"]+)"/g)].map((m) => m[1]);
  const panel = h(`<div class="card" style="left:1010px;top:270px;width:814px;height:750px">
    <h3>What the model actually received</h3>
    <div class="sub" style="font-family:var(--mono);font-size:16px;word-break:break-all">POST http://127.0.0.1:11434/v1/chat/completions</div>
    <div style="margin-top:24px;font:600 17px var(--sans);color:var(--muted);letter-spacing:.06em">VENDOR NAMES (${vendors.length})</div>
    <div style="margin-top:12px" id="vend">${vendors.map((v) => `<span class="vchip">${esc(v)}</span>`).join("")}</div>
    <div style="margin-top:12px;font:600 17px var(--sans);color:var(--muted);letter-spacing:.06em">YOUR CATEGORIES</div>
    <div style="margin-top:12px" id="cats">${cats.map((v) => `<span class="vchip" style="font-size:18px;padding:6px 12px">${esc(v)}</span>`).join("")}</div>
    <div style="margin-top:12px;font:600 17px var(--sans);color:var(--muted);letter-spacing:.06em">NEVER SENT</div>
    <div style="margin-top:12px" id="nev"><span class="vchip no">amounts</span><span class="vchip no">dates</span><span class="vchip no">accounts</span><span class="vchip no">balances</span></div>
    <div class="sub" style="margin-top:14px;font-size:16px">Recorded from the model's own request log. The key never appears in any response.</div>
  </div>`);
  const tx = shot(S("tx-final"), 1010, 290, 814, RATIO, "Vaulted Money app · after AI categorise", { hgt: 430, off: 300 });
  const chip = tag("good", ICON.check, "6 categorised by the local model", "Ask for it, review it, or never use it", 1010, 770);
  add("ai", [hd, term.el, panel, tx, chip], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4);
    term.update(t);
    appear(panel, t, 5.8, { dx: 50, dy: 0 });
    for (const [id, at] of [["vend", 7.0], ["cats", 8.4], ["nev", 9.6]]) {
      const el = panel.querySelector("#" + id);
      appear(el, t, at, { dy: 10 });
    }
    panel.style.opacity = tw(t, 5.8, 6.5) * (1 - tw(t, 11.4, 12.0));
    panel.style.visibility = panel.style.opacity > 0.01 ? "visible" : "hidden";
    appear(tx, t, 11.8, { dx: 40, dy: 0 });
    appear(chip, t, 12.4, { dy: 14 });
  });
}

// 6 · privacy
{
  const hd = head("Private by design, <em>and provably so</em>", "Real responses from the same run:");
  const probe = (id, title, y, cls) => {
    const s = step(id);
    return h(`<div class="card" style="left:1010px;top:${y}px;width:814px;padding:18px 24px">
      <div style="display:flex;align-items:center;gap:14px"><span class="m GET">GET</span><b style="font:700 22px var(--sans)">${title}</b><span class="status bad" style="margin-left:auto">${s.status}</span></div>
      <div style="font:500 17px var(--mono);color:hsl(210 30% 80%);margin-top:10px">${esc(JSON.stringify(s.response.error))}</div></div>`);
  };
  const p1 = probe("sec-nobearer", "No token", 240);
  const p2 = probe("sec-wrong", "Wrong token", 372);
  const p3 = probe("sec-origin", "A web page tries it (Origin header)", 504);
  const keyed = h(`<div class="card" style="left:1010px;top:636px;width:814px;padding:18px 24px">
      <div style="display:flex;align-items:center;gap:14px"><span class="m GET">GET</span><b style="font:700 22px var(--sans)">AI providers: is a key stored?</b><span class="status good" style="margin-left:auto">200</span></div>
      <div style="font:500 17px var(--mono);color:hsl(210 30% 80%);margin-top:10px"><span class="k">"has_api_key"</span>: <span class="v">true</span> <span class="d">  // the key itself is never returned</span></div></div>`);
  // diagram: device boundary
  const diagram = h(`<svg class="abs" style="left:96px;top:250px" width="860" height="640" viewBox="0 0 860 640" fill="none">
    <rect x="10" y="60" width="560" height="540" rx="28" stroke="hsl(188 57% 59%)" stroke-width="2.5" stroke-dasharray="10 8" />
    <text x="40" y="104" fill="hsl(188 57% 70%)" font-family="Inter" font-weight="700" font-size="20" letter-spacing="2">YOUR DEVICE</text>
    <g font-family="Inter" font-weight="700" font-size="22" fill="#e8f1f8">
      <rect id="d-app" x="50" y="150" width="480" height="92" rx="16" fill="hsl(222 84% 5%)" stroke="hsl(217 32% 26%)"/><text x="80" y="206">Vaulted Money app</text>
      <rect id="d-api" x="50" y="285" width="480" height="92" rx="16" fill="hsl(222 84% 5%)" stroke="hsl(188 57% 59%)" stroke-width="2"/><text x="80" y="340">Local API · 127.0.0.1:47821</text>
      <rect id="d-db" x="50" y="420" width="480" height="92" rx="16" fill="hsl(222 84% 5%)" stroke="hsl(217 32% 26%)"/><text x="80" y="475">IndexedDB (your data)</text>
    </g>
    <path d="M290 242v43M290 377v43" stroke="hsl(188 57% 59%)" stroke-width="3" stroke-linecap="round"/>
    <g id="d-cloud" opacity="0">
      <path d="M720 190h-60a40 40 0 1 1 8-79 48 48 0 0 1 92 20 34 34 0 0 1-40 59Z" stroke="hsl(215 20% 55%)" stroke-width="3" transform="translate(-20 10)"/>
      <path d="M600 120l150 150M750 120L600 270" stroke="hsl(0 84% 66%)" stroke-width="7" stroke-linecap="round" transform="translate(-10 -4)"/>
      <path d="M570 330H640" stroke="hsl(0 84% 66%)" stroke-width="3" stroke-dasharray="6 8"/>
      <text x="580" y="300" fill="hsl(0 70% 76%)" font-family="Inter" font-weight="700" font-size="20" transform="translate(30 60)">No cloud account</text>
      <text x="580" y="330" fill="hsl(215 20% 65%)" font-family="Inter" font-weight="500" font-size="18" transform="translate(30 60)">Nothing leaves the device</text>
    </g>
  </svg>`);
  const foot = h(`<div class="abs" style="left:96px;top:930px;display:flex;gap:14px"><span class="pill b">dry_run first</span><span class="pill o">confirm_delete required</span><span class="pill g">Encrypted .lock backups</span></div>`);
  add("privacy", [hd, diagram, p1, p2, p3, keyed, foot], (t) => {
    appear(hd, t, 0.2);
    appear(diagram, t, 0.6, { dy: 20 });
    diagram.querySelector("#d-cloud").style.opacity = tw(t, 2.0, 2.8);
    appear(p1, t, 3.0, { dx: 50, dy: 0 });
    appear(p2, t, 4.2, { dx: 50, dy: 0 });
    appear(p3, t, 5.4, { dx: 50, dy: 0 });
    appear(keyed, t, 6.6, { dx: 50, dy: 0 });
    appear(foot, t, 8.2);
  });
}

// ── chat with your money (MCP) ──────────────────────────────────────────────
// Every tool call, argument and number below is a recorded call of the real
// MCP server against the real API (out/mcp-run.json). Only the assistant's
// wording is illustrative, and the film says so.
const mcpRun = await (await fetch("out/mcp-run.json")).json();
const rec = (id) => mcpRun.calls.find((c) => c.id === id);
const rj = (id) => JSON.parse(rec(id).text);
const eur = (n, d = 2) => "€" + Number(n).toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
ICON.wrench = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg>';

const argsText = (a) => jsonLines(a).join("\n");
/**
 * A chat window. items: {at, user} typed by the user; {at, tool, args, lines,
 * approve?} a tool call (optionally behind an approval prompt); {at, bot} an
 * answer streamed word by word.
 */
function makeChat({ x, y, w, hgt, title, items }) {
  const el = h(`<div class="chat" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px">
    <div class="chat-bar"><span class="dot"></span><b>${title}</b><span class="chat-tag">vaulted-money · 8 tools</span></div>
    <div class="chat-body"><div class="chat-col"></div></div></div>`);
  const col = el.querySelector(".chat-col");
  const bodyH = hgt - 56 - 30;
  const nodes = items.map((it) => {
    let node;
    if (it.user !== undefined) node = h(`<div class="msg user"></div>`);
    else if (it.bot !== undefined) {
      node = h(`<div class="msg bot"></div>`);
      // Split into words, never inside a tag, so the answer can stream. A
      // half-streamed <b> is closed by the HTML parser, so partial text is fine.
      it.words = [];
      let word = "", inTag = false;
      for (const ch of it.bot) {
        word += ch;
        if (ch === "<") inTag = true;
        else if (ch === ">") inTag = false;
        else if (!inTag && /\s/.test(ch)) { it.words.push(word); word = ""; }
      }
      if (word) it.words.push(word);
    } else {
      node = h(`<div class="tool"><div class="tool-head"><span>${ICON.wrench}</span><b>${it.tool}</b><span class="state"></span><span class="mcp">mcp/vaulted-money</span></div>
        <div class="tool-args">${argsText(it.args)}</div>
        ${it.approve ? `<div class="tool-approve"><span>Allow this tool call?</span><span class="sp"></span><span class="btn">Deny</span><span class="btn allow">Allow</span></div>` : ""}
        <div class="tool-res"></div></div>`);
    }
    col.append(node);
    return { it, node };
  });
  return {
    el,
    update(t) {
      for (const { it, node } of nodes) {
        const k = t >= it.at ? tw(t, it.at, it.at + 0.4) : 0;
        node.style.display = t >= it.at ? "" : "none";
        node.style.opacity = k;
        if (t < it.at) continue;
        const dt = t - it.at;
        if (it.user !== undefined) node.textContent = it.user.slice(0, Math.floor(dt * 48) + 1);
        else if (it.bot !== undefined) node.innerHTML = it.words.slice(0, Math.floor(dt * 11) + 1).join("");
        else {
          const approveEnd = it.approve ? 2.3 : 0;
          const runEnd = approveEnd + 1.1;
          const state = node.querySelector(".state");
          const approve = node.querySelector(".tool-approve");
          if (approve) {
            approve.style.display = dt < approveEnd - 0.2 ? "" : "none";
            approve.style.opacity = tw(dt, 0.5, 0.9);
            node.querySelector(".btn.allow").classList.toggle("on", dt > 1.7);
          }
          const res = node.querySelector(".tool-res");
          if (dt < approveEnd) { state.textContent = it.approve ? "waiting for approval" : ""; state.className = "state run"; res.style.display = "none"; }
          else if (dt < runEnd) { state.textContent = "running…"; state.className = "state run"; res.style.display = "none"; }
          else {
            state.textContent = "✓ done"; state.className = "state done";
            res.style.display = "";
            res.innerHTML = it.lines.slice(0, Math.floor((dt - runEnd) * 7) + 1).join("\n");
          }
        }
      }
      const overflow = col.offsetHeight - bodyH;
      col.style.transform = `translateY(${-Math.max(0, overflow)}px)`;
    },
  };
}
const dim = (s) => `<span class="d">${s}</span>`;

// 7a · intro: local model + small tool set
{
  const o = run.extra.openapi;
  const kb = (n) => Math.round(n / 1024);
  const specKb = kb(o.bytes), toolsKb = Math.round((run.extra.mcpToolListBytes ?? 5200) / 1024);
  const hd = head("Chat with your money. <em>On your own machine.</em>", "A local model plus a small MCP server: no cloud, no per-token bill, and your data never leaves the Mac.");
  const box = (x, title, sub, cls = "") => h(`<div class="card" style="left:${x}px;top:290px;width:384px;padding:20px 22px;${cls}"><h3 style="font-size:23px">${title}</h3><div class="sub" style="font-size:17px">${sub}</div></div>`);
  const flow = [
    box(96, "Local model", "LM Studio, Claude Code, any MCP client"),
    box(552, "MCP server", "8 small tools · one file, no dependencies", "border-color:hsl(188 57% 59%);box-shadow:0 0 40px hsl(188 57% 59% / .22)"),
    box(1008, "Local API", "127.0.0.1 · bearer token · OpenAPI 3.1"),
    box(1464, "Vaulted Money", "Your data, on your device"),
  ];
  const arrows = [0, 1, 2].map((i) => h(`<svg class="abs" style="left:${480 + i * 456}px;top:338px" width="72" height="30" viewBox="0 0 72 30" fill="none"><path d="M2 15h60m-12-11 12 11-12 11" stroke="hsl(188 57% 59%)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  const read = ["list_ledgers", "spending_summary", "find_transactions", "budgets_and_insights", "search_api"];
  const write = ["call_api", "add_transaction", "import_csv"];
  const chips = h(`<div class="abs" style="left:96px;top:500px;width:1730px">
    <div style="font:700 16px var(--sans);letter-spacing:.08em;color:var(--good);margin-bottom:10px">READ-ONLY</div>
    <div>${read.map((n) => `<span class="vchip" style="color:hsl(152 60% 70%);background:hsl(152 60% 40% / .10);border-color:hsl(152 60% 40% / .5)">${n}</span>`).join("")}</div>
    <div style="font:700 16px var(--sans);letter-spacing:.08em;color:var(--warn);margin:12px 0 10px">CAN CHANGE DATA · ASKS FIRST</div>
    <div>${write.map((n) => `<span class="vchip" style="color:hsl(35 92% 72%);background:hsl(35 92% 62% / .10);border-color:hsl(35 92% 62% / .5)">${n}</span>`).join("")}</div></div>`);
  const cmp = h(`<div class="card" style="left:96px;top:760px;width:1728px;padding:24px 30px">
    <div style="display:grid;grid-template-columns:330px 1fr;row-gap:16px;align-items:center">
      <div style="font:600 20px var(--sans)">Full OpenAPI spec<div style="font:500 16px var(--sans);color:var(--muted)">${o.operations} operations</div></div>
      <div style="display:flex;align-items:center;gap:16px"><div id="b1" style="height:30px;border-radius:8px;background:linear-gradient(90deg,hsl(0 70% 55%),hsl(20 85% 60%));width:0"></div><b style="font:700 24px var(--mono)">${specKb} KB</b></div>
      <div style="font:600 20px var(--sans)">These 8 tools<div style="font:500 16px var(--sans);color:var(--muted)">re-read on every turn</div></div>
      <div style="display:flex;align-items:center;gap:16px"><div id="b2" style="height:30px;border-radius:8px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));width:0"></div><b style="font:700 24px var(--mono)">${toolsKb} KB</b><span style="font:600 20px var(--sans);color:var(--accent-soft)">≈${Math.round(specKb / toolsKb)}× less for a local model to read</span></div>
    </div></div>`);
  add("mcp", [hd, ...flow, ...arrows, chips, cmp], (t) => {
    appear(hd, t, 0.2);
    flow.forEach((f, i) => appear(f, t, 1.0 + i * 0.7, { dy: 20 }));
    arrows.forEach((a, i) => appear(a, t, 1.6 + i * 0.7, { dx: -20, dy: 0 }));
    appear(chips, t, 4.6);
    appear(cmp, t, 6.6);
    cmp.querySelector("#b1").style.width = 900 * tw(t, 7.0, 8.2) + "px";
    cmp.querySelector("#b2").style.width = Math.max(2, 900 * (toolsKb / specKb) * tw(t, 8.4, 9.2)) + "px";
  });
}

// 7b · ask: where is my money going / am I over budget
{
  const sp = rj("q-spending"), bu = rj("q-budget");
  const cat = (n) => sp.by_category.find((c) => c.category === n);
  const food = bu.budgets[0];
  const hd = head("Ask in plain words. <em>Get answers from your own data.</em>", "The server works out the dates, so the same question gives the same answer.");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.8, user: "Where is my money going?" },
      { at: 2.2, tool: "spending_summary", args: rec("q-spending").args, lines: [
        `${dim("period")}  ${sp.period.label}  ${dim(`${sp.period.from} → ${sp.period.to}`)}`,
        `${dim("spent")}   ${eur(sp.totals.expenses)}   ${dim("income")} ${eur(sp.totals.income)}`,
        sp.by_category.slice(0, 3).map((c) => `${c.category} ${c.share_pct}%`).join(" · ") ] },
      { at: 5.4, bot: `Mostly <b>${cat("Housing").category}</b>: ${eur(cat("Housing").spent, 0)} (${Math.round(cat("Housing").share_pct)}%). Then <b>Food</b> at ${eur(cat("Food").spent, 0)} and <b>Transport</b> at ${eur(cat("Transport").spent, 0)}. You spent <b>${eur(sp.totals.expenses)}</b> from 1 to 30 Sep.` },
      { at: 9.0, user: "Am I over budget anywhere?" },
      { at: 10.2, tool: "budgets_and_insights", args: {}, lines: [
        `${dim("Food")}  target ${eur(food.target, 0)}  spent ${eur(food.spent)}`,
        `${dim("status")}  <span style="color:var(--bad)">${bu.budget_health[0].status}</span>  ${dim(bu.budget_health[0].message)}` ] },
      { at: 12.6, bot: `Yes: <b class="bad">Food</b> is at ${eur(food.spent)} of ${eur(food.target, 0)} (${Math.round(bu.budget_health[0].percentUsed)}%), <b>${eur(food.spent - food.target)}</b> over.` },
    ],
  });
  const echo = h(`<div class="card" style="left:1010px;top:270px;width:814px;padding:22px 26px">
    <div style="font:700 15px var(--sans);letter-spacing:.08em;color:var(--muted)">WHAT THE SERVER ADDED TO THE ANSWER</div>
    <div style="font:500 20px/1.7 var(--mono);margin-top:10px"><span class="d">today</span>  <span style="color:var(--accent-soft)">${sp.today}</span><br><span class="d">period</span> <span style="color:var(--accent-soft)">${sp.period.from} → ${sp.period.to}</span></div>
    <div class="sub" style="font-size:17px;margin-top:8px">Models don't know today's date, so the server resolves "last 30 days" itself and states the exact range.</div></div>`);
  const dash = shot(S("dashboard"), 1010, 510, 814, RATIO, "Vaulted Money · Dashboard", { hgt: 480, off: 235 });
  const rg = shotRing(dash, 560, 345, 520, 235, "warn");
  const note = h(`<div class="abs" style="left:96px;top:1030px;font:500 15px var(--sans);color:hsl(215 16% 50%)">Assistant wording is illustrative. Every tool call, argument and number is a real recorded result.</div>`);
  add("ask", [hd, chat.el, echo, dash, rg, note], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.4, { dy: 20 });
    chat.update(t);
    appear(echo, t, 5.0, { dx: 40, dy: 0 });
    appear(dash, t, 11.6, { dy: 20 });
    ring(rg, t, 13.0);
  });
}

// 7c · add a transaction by chat
{
  const ad = rj("q-add");
  const hd = head("Add a transaction. <em>Just say it.</em>", "Changes ask first, and the result shows up in the app straight away.");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.8, user: "Add a €12.50 coffee at Cafe Central today, Food › Dining out." },
      { at: 3.0, tool: "add_transaction", args: rec("q-add").args, approve: true, lines: [
        `${dim("created")} true   ${dim("id")} ${short(ad.id)}`,
        `${eur(ad.amount)}  ${ad.vendor}  ${dim("·")} ${ad.category}  ${dim(ad.date)}` ] },
      { at: 8.0, bot: `Done. Added <b>${eur(Math.abs(ad.amount))}</b> at <b>${ad.vendor}</b> (Food › Dining out) on 30 Sep. Say "undo" and I'll delete it.` },
    ],
  });
  const tx = shot(S("tx-mcp-added"), 1010, 290, 814, RATIO, "Vaulted Money app · Transactions, live", { hgt: 430, off: 287 });
  const rg = shotRing(tx, 60, 575, 1010, 55, "");
  const chip = tag("good", ICON.check, "Undo is one call", "The id comes back, so any change can be reversed", 1010, 760);
  add("add", [hd, chat.el, tx, rg, chip], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.4, { dy: 20 });
    chat.update(t);
    appear(tx, t, 8.6, { dx: 40, dy: 0 });
    ring(rg, t, 9.4);
    appear(chip, t, 9.8, { dy: 14 });
  });
}

// 7d · import a messy bank CSV by chat
{
  const pre = rj("q-import-preview"), imp = rj("q-import");
  const map = Object.entries(pre.column_mapping).map(([to, from]) => `${from}→${to}`).join(", ");
  const csvLines = run.extra.statement.split("\n").slice(0, 5);
  const hd = head("Import a bank CSV. <em>No reformatting.</em>", "The file is read on your computer, so its contents never pass through the chat.");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.8, user: "Import ~/Downloads/bank-statement.csv into Checking. Preview first." },
      { at: 2.4, tool: "import_csv", args: rec("q-import-preview").args, lines: [
        `${dim("dry_run")} true   ${dim("rows")} ${pre.rows_in_file}   ${dim("imported")} 0`,
        `${dim("mapped")}  ${map}` ] },
      { at: 4.6, bot: `I mapped <b>Booking Date→Date</b> and <b>Description→Vendor</b>, and read amounts like 2.450,00 correctly. ${pre.rows_in_file} rows, <b>nothing imported yet</b>. Import them?` },
      { at: 8.3, user: "Yes, import." },
      { at: 9.0, tool: "import_csv", args: rec("q-import").args, approve: true, lines: [
        `${dim("imported")} <span class="ok">${imp.result.imported}</span>   ${dim("skipped")} ${imp.result.skipped}` ] },
      { at: 13.2, bot: `Imported <b>${imp.result.imported}</b> transactions. They have no category yet. Want me to categorise them from your history?` },
    ],
  });
  const csv = h(`<div class="card" style="left:1010px;top:270px;width:814px;padding:18px 22px"><div style="display:flex;align-items:center;gap:10px;color:var(--muted);font:600 17px var(--sans);margin-bottom:10px"><span style="color:var(--accent);width:22px;height:22px;display:inline-block">${ICON.file}</span><b style="color:var(--fg)">${run.extra.statementPath}</b></div><div style="font:500 16px var(--sans);color:var(--muted);margin:-4px 0 10px">comma-separated, ISO dates, amounts like "2.450,00"</div><div style="font:500 16px/24px var(--mono);color:hsl(210 30% 85%);white-space:pre;overflow:hidden">${esc(csvLines.join("\n"))}</div></div>`);
  const tx = shot(S("tx-mcp-imported"), 1010, 480, 814, RATIO, "Vaulted Money app · Transactions", { hgt: 460, off: 287 });
  const rg = shotRing(tx, 60, 575, 1010, 300, "");
  add("csv", [hd, chat.el, csv, tx, rg], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.4, { dy: 20 });
    chat.update(t);
    appear(csv, t, 1.2, { dx: 40, dy: 0 });
    appear(tx, t, 12.8, { dx: 40, dy: 0 });
    csv.style.opacity = Math.min(csv.style.opacity, 1 - 0.5 * tw(t, 12.6, 13.2));
    ring(rg, t, 13.8);
  });
}

// 7e · safe deletion: preview, approve, confirm
{
  const accounts = rj("q-accounts").data;
  const hd = head("Deleting? <em>It asks twice.</em>", "A preview first, then your approval. Nothing changes until you say so.");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.8, user: "Delete the Old Card account." },
      { at: 1.8, tool: "call_api", args: rec("q-accounts").args, lines: [`${dim("accounts")}  ${accounts.map((a) => a.name).join(", ")}`] },
      { at: 3.6, tool: "call_api", args: { method: "DELETE", path: "/ledgers/{ledgerId}/accounts/" + short(rec("q-delete").args.path.split("/").pop()) }, lines: [
        `<span style="color:var(--warn)">preview: true   executed: false</span>`,
        `${dim("Nothing changed. Show this to the user; if they approve, repeat with confirm:true.")}` ] },
      { at: 5.5, bot: `<b>Old Card</b> has no transactions. This will delete the account itself. Shall I go ahead?` },
      { at: 7.6, user: "Go ahead." },
      { at: 8.2, tool: "call_api", args: { method: "DELETE", path: "/ledgers/{ledgerId}/accounts/" + short(rec("q-delete").args.path.split("/").pop()), confirm: true }, approve: true, lines: [`<span class="ok">deleted: true</span>`] },
      { at: 12.4, bot: `Done. <b>Old Card</b> is deleted and your other accounts are untouched.` },
    ],
  });
  const steps = [
    ["1", "The model previews", "Nothing is deleted yet. The tool just says what it would do."],
    ["2", "You approve", "Your client asks before running any tool that can change data."],
    ["3", "Then it happens", "Deleting an account keeps its transactions. Deleting a ledger does not."],
  ].map(([n, t1, t2], i) => h(`<div class="stepcard" style="left:1010px;top:${290 + i * 150}px;width:814px"><div class="n">${n}</div><div><b>${t1}</b><small>${t2}</small></div></div>`));
  const lock = tag("warn", ICON.lock, "Safety lives in the approval prompt", "Keep tool approval on for call_api, add_transaction and import_csv", 1010, 780);
  add("safe", [hd, chat.el, ...steps, lock], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.4, { dy: 20 });
    chat.update(t);
    steps.forEach((s, i) => appear(s, t, [3.0, 7.4, 11.4][i], { dx: 40, dy: 0 }));
    appear(lock, t, 12.6, { dy: 14 });
  });
}

// 7f · more questions, one card each
{
  const sp = rj("q-spending"), vend = rj("q-vendor");
  const csvRows = rec("q-report").text.trim().split("\n").slice(0, 6).join("\n");
  const card = (x, q, chain, ans, extra = "") => h(`<div class="mini" style="left:${x}px;top:320px;width:556px;height:440px"><span class="q">${q}</span><div class="chain">${chain.map((c) => `<span class="t">${c}</span>`).join('<span>→</span>')}</div><div class="ans">${ans}</div>${extra}</div>`);
  const hd = head("Anything else <em>is one question away.</em>", "Small tool set, whole API: search_api finds the endpoint, call_api uses it.");
  const c1 = card(96, "Which vendors cost me the most?", ["spending_summary"], sp.by_vendor.filter((v) => v.spent > 0).slice(0, 3).map((v) => `<b>${v.vendor}</b> ${eur(v.spent)}`).join("<br>") + `<br><span style="color:var(--muted);font-size:18px">…out of ${eur(sp.totals.expenses)} in 30 days</span>`);
  const c2 = card(682, "How much did I spend at Corner Market?", ["find_transactions"], `<b>${vend.total_matches} purchases</b>, ${eur(Math.abs(vend.sum_of_shown))} in total.<br><span style="color:var(--muted);font-size:18px">${vend.transactions.map((t) => eur(Math.abs(t.amount))).join(" · ")}</span>`);
  const c3 = card(1268, "Give me September's income and expenses as a CSV.", ["search_api", "call_api"], `Found <b>GET …/reports/income-expense</b> and fetched it:`, `<div class="csv">${esc(csvRows)}</div>`);
  add("more", [hd, c1, c2, c3], (t) => {
    appear(hd, t, 0.2);
    appear(c1, t, 0.8, { dy: 30 }); appear(c2, t, 3.0, { dy: 30 }); appear(c3, t, 5.2, { dy: 30 });
  });
}

// 8 · three ways to use it
{
  const hd = head("Pair it with <em>any interface</em>", "The same API drives all three.");
  const col = (x, title, sub) => h(`<div class="card" style="left:${x}px;top:250px;width:556px;height:620px;padding:26px 28px"><h3>${title}</h3><div class="sub">${sub}</div></div>`);
  const c1 = col(96, "Vaulted Money UI", "Your data, in the app you already use");
  const c2 = col(682, "Your own GUI", "A dashboard built on <span style='font-family:var(--mono);font-size:16px'>/analytics</span>");
  const c3 = col(1268, "Postman collection", "Import, set the token, press Run");
  const ui = shot(S("dashboard"), 114, 400, 520, RATIO, "", { hgt: 440, off: 130 });
  // custom GUI drawn from the real analytics response
  const cats = run.steps.find((s) => s.id === "analytics").response.byCategory.filter((c) => c.expenses > 0);
  const max = Math.max(...cats.map((c) => c.expenses));
  const gui = h(`<div class="abs" style="left:704px;top:400px;width:512px;height:440px">
    <div style="border:1px solid var(--border);border-radius:14px;background:hsl(217 32% 9%);padding:20px 22px;height:100%">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:800 24px var(--sans);letter-spacing:-.02em">Home · September</b><span style="font:600 15px var(--sans);color:var(--muted)">my-dashboard.html</span></div>
      <div style="font:800 40px var(--sans);letter-spacing:-.03em;margin-top:8px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 52%));-webkit-background-clip:text;background-clip:text;color:transparent">€${step("analytics").response.totals.expenses.toLocaleString("en", { minimumFractionDigits: 2 })}</div>
      <div style="font:500 15px var(--sans);color:var(--muted);margin-bottom:14px">spent · from GET /analytics</div>
      ${cats.map((c, i) => `<div class="bar" data-i="${i}" style="margin:9px 0"><div style="display:flex;justify-content:space-between;font:600 16px var(--sans)"><span>${c.category}</span><span style="color:var(--muted)">€${c.expenses.toFixed(0)}</span></div><div style="height:12px;border-radius:7px;background:hsl(217 32% 16%);margin-top:5px;overflow:hidden"><i class="fill" data-w="${(c.expenses / max) * 100}" style="display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));width:0"></i></div></div>`).join("")}
    </div></div>`);
  const folders = ["00 Smoke and security", "01 Ledgers", "02 Accounts", "05 Transactions", "10 AI providers", "11 Analytics, insights and reports", "13 Maintenance (clean-up tools)", "14 CSV import and export", "98 Cleanup"];
  const pm = h(`<div class="abs" style="left:1290px;top:400px;width:512px">
    ${folders.map((f, i) => `<div class="pmf" data-i="${i}" style="display:flex;align-items:center;gap:12px;padding:9px 14px;margin-bottom:6px;border-radius:10px;background:hsl(217 32% 11%);border:1px solid var(--border);font:600 17px var(--sans)"><span class="ok" style="width:18px;height:18px;flex:none">${ICON.check}</span>${f}</div>`).join("")}
    <div style="margin-top:6px;font:700 21px var(--sans);color:var(--accent-soft)">202 requests · 545 assertions</div></div>`);
  add("ways", [hd, c1, c2, c3, ui, gui, pm], (t) => {
    appear(hd, t, 0.2);
    appear(c1, t, 0.8); appear(ui, t, 1.2);
    appear(c2, t, 3.0); appear(gui, t, 3.4);
    gui.querySelectorAll(".fill").forEach((f, i) => (f.style.width = f.dataset.w * tw(t, 4.0 + i * 0.12, 5.0 + i * 0.12) + "%"));
    appear(c3, t, 5.8); appear(pm, t, 6.2);
    pm.querySelectorAll(".pmf").forEach((f, i) => appear(f, t, 6.4 + i * 0.22, { dy: 8, dur: 0.4 }));
  });
}

// 9 · why it's different
{
  const hd = head("One vault. <em>Every interface.</em>", "A local-first money app that is also a local-first platform.");
  const nodes = [
    ["Vaulted Money UI", 300, 0], ["Your own GUI", 620, 1], ["Postman", 940, 2], ["Scripts & cron", 1260, 3], ["Local AI agents", 1580, 4],
  ];
  const hub = h(`<div class="abs" style="left:560px;top:250px;width:800px;display:flex;flex-direction:column;align-items:center">
    <div style="display:flex;align-items:center;gap:22px;padding:22px 34px;border-radius:22px;background:var(--card);border:1px solid var(--accent);box-shadow:0 0 60px hsl(188 57% 59% / .25)">
      <img src="/repo/assets/brand/dark-icon.png" style="width:84px;height:84px;object-fit:contain"><div><div style="font:800 30px var(--sans);letter-spacing:-.02em">Your data, on your device</div><div style="font:500 18px var(--sans);color:var(--muted)">IndexedDB · no account · works offline</div></div></div>
    <div style="width:3px;height:56px;background:var(--accent)"></div>
    <div style="padding:14px 28px;border-radius:14px;background:hsl(246 90% 66% / .16);border:1px solid hsl(246 90% 66% / .5);font:700 24px var(--mono)">REST API · OpenAPI 3.1</div></div>`);
  const spokes = nodes.map(([label, x]) => h(`<div class="abs" style="left:${x - 110}px;top:560px;width:240px;text-align:center"><div style="width:3px;height:44px;background:var(--border);margin:0 auto"></div><div style="padding:18px 10px;border-radius:14px;background:var(--card);border:1px solid var(--border);font:700 22px var(--sans)">${label}</div></div>`));
  const lines = h(`<svg class="abs" style="left:0;top:470px" width="1920" height="100" fill="none"><path d="M300 100V60H1580V100M960 0V60" stroke="hsl(217 32% 26%)" stroke-width="3"/></svg>`);
  const pts = [
    ["Local-first", "No cloud account. Your data never leaves the machine."],
    ["Open spec", "OpenAPI 3.1 generated from the code. Build anything."],
    ["Your choice", "Use our UI, write your own, or just curl it."],
  ];
  const cards = pts.map(([t1, t2], i) => h(`<div class="card" style="left:${96 + i * 600}px;top:790px;width:576px;padding:22px 26px"><h3 style="color:var(--accent-soft)">${t1}</h3><div class="sub" style="font-size:20px">${t2}</div></div>`));
  add("unique", [hd, lines, hub, ...spokes, ...cards], (t) => {
    appear(hd, t, 0.2);
    appear(hub, t, 0.6);
    lines.style.opacity = tw(t, 1.6, 2.4);
    spokes.forEach((s, i) => appear(s, t, 2.0 + i * 0.35, { dy: 20 }));
    cards.forEach((c, i) => appear(c, t, 4.6 + i * 1.3, { dy: 20 }));
  });
}

// 10 · outro
{
  const logo = h(`<img src="/repo/assets/brand/dark-icon.png" class="abs" style="left:810px;top:180px;width:300px;height:300px;object-fit:contain">`);
  const word = h(`<div class="abs" style="left:0;right:0;top:500px;text-align:center;font:800 120px/1 var(--sans);letter-spacing:-.045em;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));-webkit-background-clip:text;background-clip:text;color:transparent">Vaulted Money</div>`);
  const tagline = h(`<div class="abs" style="left:0;right:0;top:650px;text-align:center;font:600 40px var(--sans);letter-spacing:-.02em">Your money, your device, <span style="color:var(--accent-soft)">your API.</span></div>`);
  const pills = h(`<div class="abs" style="left:0;right:0;top:740px;display:flex;gap:18px;justify-content:center"><span class="pill g">Privacy-first</span><span class="pill b">Data-local</span><span class="pill o">Open-sourced</span></div>`);
  const url = h(`<div class="abs" style="left:0;right:0;top:850px;text-align:center;font:500 28px var(--mono);color:var(--muted)">vaulted.money · github.com/nrajesh/vaulted.money</div>`);
  const black = h(`<div class="abs" style="inset:0;background:#000;opacity:0"></div>`);
  add("outro", [logo, word, tagline, pills, url, black], (t) => {
    appear(logo, t, 0.1, { dur: 1.0, scale: 0.12, dy: 0 });
    logo.style.filter = `drop-shadow(0 0 ${30 + 15 * Math.sin(t * 2)}px hsl(188 57% 59% / .4))`;
    appear(word, t, 0.7);
    appear(tagline, t, 1.5);
    appear(pills, t, 2.3);
    appear(url, t, 3.0);
    black.style.opacity = tw(t, 5.0, 6.0, (x) => x);
  });
}

// ── chapter pills ───────────────────────────────────────────────────────────
const labels = [...new Set(SCENES.filter((s) => s.label).map((s) => s.label))];
const bar = h(`<div id="chapters">${labels.map((l) => `<span class="chip" data-label="${l}">${l}</span>`).join("")}</div>`);
stage.append(bar);

// ── the frame function ──────────────────────────────────────────────────────
window.__render = (t) => {
  for (const sc of SCENES) {
    const b = built[sc.id];
    const lt = t - sc.start;
    const first = sc.id === "title";
    const last = sc.id === "outro";
    const inK = first ? 1 : tw(t, sc.start, sc.start + FADE, ease.inOut);
    const outK = last ? 1 : 1 - tw(t, sc.end - FADE, sc.end, ease.inOut);
    const k = lt < 0 || t >= sc.end ? 0 : Math.min(inK, outK);
    b.el.style.opacity = k;
    b.el.style.visibility = k > 0.001 ? "visible" : "hidden";
    if (k > 0.001) b.update(lt);
  }
  const active = SCENES.find((c) => t >= c.start && t < c.end);
  bar.style.opacity = t < scene("enable").start || t >= scene("outro").start ? 0 : 1;
  bar.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.label === active?.label));
};

await document.fonts.ready;
await Promise.all([...document.images].map((i) => (i.complete ? 0 : i.decode().catch(() => {}))));
window.__render(0);
window.__ready = true;

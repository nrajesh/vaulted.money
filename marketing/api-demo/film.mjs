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
 * {at, raw:[html lines]} shows lines as given. Typing is fast on purpose: the
 * demo only needs to be seen, the takeaway slide is what gets read.
 */
function makeTerm({ x, y, w, hgt, title, items }) {
  const el = h(`<div class="term" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px">
    <div class="bar"><i></i><i></i><i></i><span>${title}</span></div>
    <div class="body"><div class="scroll"></div></div></div>`);
  const scroller = el.querySelector(".scroll");
  const bodyH = hgt - 46 - 36;
  const CPS = 150; // typing speed (chars/s)
  const LPS = 24; // response lines revealed per second
  const prepared = items.map((it) => {
    if (it.cmd) return { ...it, kind: "cmd", text: it.cmd.join("\n") };
    const s = it.step ? step(it.step) : null;
    const lines = it.raw ?? jsonLines((VIEW[it.step] ?? ((r) => r))(s.response));
    return { ...it, kind: "out", s, lines };
  });
  return {
    el,
    update(t) {
      const html = [];
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
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 14h.01M16 14h.01"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
};
const head = (title, sub) => h(`<div class="head"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>`);
const glow = (s) => `<span class="glow">${s}</span>`;
/** A framed screenshot with its label above the frame; `hgt`/`off` crop it to a band. */
const shot = (src, x, y, w, ratio, cap, { hgt, off = 0 } = {}) =>
  h(`<div class="shotwrap" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt ?? Math.round(w * ratio)}px">${cap ? `<div class="shotlabel">${cap}</div>` : ""}<div class="shot"><img src="${src}" style="position:absolute;left:0;top:${-off}px;width:100%;height:auto"></div></div>`);
const tag = (cls, icon, title, sub, x, y) =>
  h(`<div class="tag ${cls}" style="left:${x}px;top:${y}px"><div class="ico">${icon}</div><div>${title}${sub ? `<small>${sub}</small>` : ""}</div></div>`);
const ringAt = (x, y, w, hgt, cls = "") => h(`<div class="ring ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px"></div>`);
/** Ring positioned in a screenshot's own 1100x980 app-viewport coordinates. */
const shotRing = (sh, x, y, w, hgt, cls = "") => {
  const W = parseFloat(sh.style.width) / 1100;
  const off = -parseFloat(sh.querySelector("img").style.top);
  return ringAt(parseFloat(sh.style.left) + x * W, parseFloat(sh.style.top) + y * W - off, w * W, hgt * W, cls);
};
/** Code word that flips into its plain meaning after `dur` seconds. */
const flip = (code, plain) => `<span class="flip"><span class="fa">${esc(code)}</span><span class="fb">${plain}</span></span>`;
function setFlip(root, t, at, dur = 1.5) {
  const k = tw(t, at + dur, at + dur + 0.5);
  root.querySelectorAll(".flip").forEach((f) => {
    f.querySelector(".fa").style.opacity = 1 - k;
    f.querySelector(".fb").style.opacity = k;
  });
  return k;
}

// ── scene registry ──────────────────────────────────────────────────────────
const built = {};
/**
 * Build a scene. `opts.take` adds a takeaway slide at `take.at`: the demo
 * recedes and up to two big cards stay up for the rest of the scene.
 * card: {icon, title, code?, text}; code flips into the title after 1.5 s.
 */
function add(id, nodes, update, opts = {}) {
  const el = h(`<section class="scene" id="s-${id}"></section>`);
  const headNode = nodes.find((n) => n.classList?.contains("head"));
  const demo = h(`<div class="demo"></div>`);
  if (headNode) el.append(headNode);
  nodes.filter((n) => n !== headNode).forEach((n) => demo.append(n));
  el.append(demo);
  let cards = [];
  if (opts.take) {
    const { cards: spec, y = 380 } = opts.take;
    cards = spec.map((c, i) => {
      const node = h(`<div class="take" style="left:${96 + i * 908}px;top:${y}px"><div class="tk-ico">${c.icon}</div><div><div class="tk-title">${c.code ? flip(c.code, c.title) : `<span class="fb">${c.title}</span>`}</div><p class="tk-text">${c.text}</p></div></div>`);
      el.append(node);
      return { node, c };
    });
  }
  stage.append(el);
  built[id] = {
    el,
    update(lt) {
      update(lt);
      if (!opts.take) return;
      const at = opts.take.at;
      const k = tw(lt, at, at + 0.7, ease.inOut);
      demo.style.opacity = 1 - 0.88 * k;
      demo.style.filter = k > 0 ? `blur(${3 * k}px)` : "none";
      cards.forEach(({ node, c }, i) => {
        const start = at + 0.3 + i * 0.9;
        appear(node, lt, start, { dy: 28, dur: 0.8 });
        if (c.code) {
          const f = setFlip(node, lt, start + 0.2);
          node.querySelector(".tk-text").style.opacity = f;
        }
      });
    },
  };
}
const S = (name) => `out/screens/${name}.png`;
const RATIO = 980 / 1100;

// ── 0 · title ───────────────────────────────────────────────────────────────
{
  const logo = h(`<img src="/repo/assets/brand/dark-icon.png" class="abs" style="left:710px;top:70px;width:500px;height:500px;object-fit:contain">`);
  const word = h(`<div class="abs" style="left:0;right:0;top:500px;text-align:center;font:800 132px/1 var(--sans);letter-spacing:-.045em;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));-webkit-background-clip:text;background-clip:text;color:transparent">Vaulted Money</div>`);
  const sub = h(`<div class="abs" style="left:0;right:0;top:632px;text-align:center;font:600 46px var(--sans);letter-spacing:-.02em">Now with a <span style="padding:2px 18px;border-radius:12px;background:hsl(188 57% 59% / .16);border:1px solid hsl(188 57% 59% / .5);color:var(--accent-soft)">Local API</span></div>`);
  const line = h(`<div class="abs" style="left:0;right:0;top:730px;text-align:center;font:500 30px var(--sans);color:var(--muted)">Your money. Your device. Your API.</div>`);
  const pills = h(`<div class="abs" style="left:0;right:0;top:820px;text-align:center;display:flex;gap:18px;justify-content:center"><span class="pill g glowbox">Privacy-first</span><span class="pill b glowbox">Data-local</span><span class="pill o">Open-sourced</span></div>`);
  add("title", [logo, word, sub, line, pills], (t) => {
    appear(logo, t, 0.2, { dur: 1.2, scale: 0.15, dy: 0 });
    logo.style.filter = `drop-shadow(0 0 ${30 + 20 * Math.sin(t * 2)}px hsl(188 57% 59% / .45))`;
    appear(word, t, 1.0);
    appear(sub, t, 2.4);
    appear(line, t, 3.6);
    appear(pills, t, 4.8);
  });
}

// ── 1 · switch it on ────────────────────────────────────────────────────────
{
  const hd = head("Off by default. <em>One switch.</em>", "Settings → Local API. Nothing runs until you turn it on.");
  const W = 1130, Hon = (W * 716) / 2016;
  const off = shot(S("settings-api-off"), 96, 290, W, 221 / 2016, "In the app · Settings → Local API");
  const on = shot(S("settings-api-on"), 96, 290, W, 716 / 2016);
  const r1 = ringAt(96 + W * 0.94, 290 + 0.2 * Hon - 6, 90, 52);
  const term = makeTerm({
    x: 96, y: 740, w: W, hgt: 290, title: "zsh — vaulted-money",
    items: [
      { at: 2.8, cmd: [`curl -s $VM/ledgers -H "$AUTH"`] },
      { at: 3.6, step: "ledgers-empty" },
    ],
  });
  add("enable", [hd, off, on, r1, term.el], (t) => {
    appear(hd, t, 0.2);
    appear(off, t, 0.4, { dy: 24 });
    on.style.opacity = tw(t, 1.6, 2.1) * tw(t, 0.4, 0.9);
    off.style.opacity = tw(t, 0.4, 0.9) * (1 - tw(t, 1.9, 2.2));
    ring(r1, t, 1.0, 2.4);
    appear(term.el, t, 2.4);
    term.update(t);
  }, { take: { at: 6.0, cards: [
    { icon: ICON.power, title: "Off until you switch it on", text: "One switch in Settings. Nothing runs before that." },
    { icon: ICON.shield, title: "Reachable only from your device", text: `${glow("Never on the network")}, and every request needs your private token.` },
  ] } });
}

// ── 2 · create a ledger and an account ──────────────────────────────────────
{
  const hd = head("Create a ledger. <em>Add an account.</em>", "Plain JSON over HTTP: no SDK, no sign-up, no waiting for a cloud.");
  const term = makeTerm({
    x: 96, y: 290, w: 880, hgt: 720, title: "zsh — vaulted-money",
    items: [
      { at: 0.8, cmd: curlLines(step("ledger")) },
      { at: 1.8, step: "ledger" },
      { at: 3.2, cmd: curlLines(step("account")) },
      { at: 4.4, step: "account" },
    ],
  });
  const led = shot(S("ledgers"), 1010, 290, 814, RATIO, "In the app · Ledgers", { hgt: 560 });
  const acc = shot(S("accounts"), 1010, 290, 814, RATIO, "In the app · Accounts", { hgt: 560 });
  add("create", [hd, term.el, led, acc], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4);
    term.update(t);
    appear(led, t, 2.4, { dx: 50, dy: 0 });
    appear(acc, t, 5.4, { dx: 0, dy: 0 });
  }, { take: { at: 7.4, cards: [
    { icon: ICON.chat, title: "Plain requests, no sign-up", text: "Create ledgers and accounts with a simple web request." },
    { icon: ICON.eye, title: "It shows up in the app", text: "The open app refreshes after every change you make." },
  ] } });
}

// ── 3 · transactions ────────────────────────────────────────────────────────
{
  const hd = head("Add transactions. <em>Or import a statement.</em>", "One at a time, in bulk, or straight from your bank's CSV.");
  const term = makeTerm({
    x: 96, y: 290, w: 880, hgt: 720, title: "zsh — vaulted-money",
    items: [
      { at: 0.6, cmd: curlLines(step("tx1")) },
      { at: 1.8, step: "tx1" },
      { at: 3.0, cmd: [`curl -s -X POST $VM/ledgers/$L/transactions/import \\`, `  -H "$AUTH" -d @sept-statement.json   # { "csv": "...", "dry_run": true }`] },
      { at: 4.2, step: "import-dry" },
      { at: 5.8, step: "import" },
    ],
  });
  const csv = h(`<div class="card" style="left:1010px;top:290px;width:814px;padding:18px 22px"><div style="display:flex;align-items:center;gap:10px;color:var(--muted);font:600 17px var(--sans);margin-bottom:10px"><span style="color:var(--accent);width:22px;height:22px;display:inline-block">${ICON.file}</span>sept-statement.csv · 10 rows · Category column empty</div><div style="font:500 15px/24px var(--mono);color:hsl(210 30% 85%);white-space:pre;overflow:hidden">Date;Account;Vendor;Category;Amount
05/09/2026;Checking;Corner Market;;-38.20
06/09/2026;Checking;Trattoria Roma;;-54.00
08/09/2026;Checking;StreamBox;;-12.99</div></div>`);
  const tx = shot(S("tx-imported"), 1010, 520, 814, RATIO, "In the app · Transactions, no categories yet", { hgt: 440, off: 287 });
  const rg = shotRing(tx, 215, 575, 235, 380);
  add("import", [hd, term.el, csv, tx, rg], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4);
    term.update(t);
    appear(csv, t, 1.0, { dx: 50, dy: 0 });
    appear(tx, t, 6.2, { dx: 50, dy: 0 });
    ring(rg, t, 7.0, 9.0);
  }, { take: { at: 8.6, cards: [
    { icon: ICON.plus, title: "One transaction or thousands", text: "Add them singly, in bulk, or from a bank CSV file." },
    { icon: ICON.eye, code: "dry_run", title: "Preview before anything changes", text: "A trial run shows exactly what would happen first." },
  ] } });
}

// ── 4 · categorise from history ─────────────────────────────────────────────
{
  const hd = head("Categorise from <em>your own history</em>", "No AI involved: the API reuses the category you last gave each vendor.");
  const term = makeTerm({
    x: 96, y: 290, w: 880, hgt: 720, title: "zsh — vaulted-money",
    items: [
      { at: 0.6, cmd: [`curl -s -X POST $VM/ledgers/$L/transactions/categorize-missing \\`, `  -H "$AUTH" -d '{}'`] },
      { at: 1.8, step: "cat-hist" },
    ],
  });
  const tx = shot(S("tx-history"), 1010, 290, 814, RATIO, "In the app · after categorising", { hgt: 430, off: 287 });
  const rg = shotRing(tx, 215, 575, 235, 380);
  add("history", [hd, term.el, tx, rg], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4);
    term.update(t);
    appear(tx, t, 3.0, { dx: 50, dy: 0 });
    ring(rg, t, 4.0, 5.4);
  }, { take: { at: 5.0, cards: [
    { icon: ICON.history, title: "It learns from your habits", text: "Shops you've categorised before are matched automatically." },
    { icon: ICON.shield, title: "No AI involved", text: `This step runs ${glow("on your device")}, using your own history.` },
  ] } });
}

// ── 5 · optional AI ─────────────────────────────────────────────────────────
{
  const hd = head("AI is <em>optional</em>, and only when you ask", "Off unless you request it. Point it at a model running on your own device.");
  const term = makeTerm({
    x: 96, y: 290, w: 880, hgt: 720, title: "zsh — vaulted-money",
    items: [
      { at: 0.5, cmd: [`curl … categorize-missing -d '{"use_ai":true}'`] },
      { at: 1.4, step: "ai-none" },
      { at: 2.8, cmd: [`# register a model on localhost (key is write-only)`] },
      { at: 3.4, step: "ai-provider" },
      { at: 4.4, cmd: [`curl … categorize-missing -d '{"use_ai":true}'`] },
      { at: 5.2, step: "ai" },
    ],
  });
  const req = run.extra.aiRequest;
  const prompt = req.body.messages[0].content;
  const vendors = JSON.parse(prompt.match(/Vendors\/Payees to Categorize:\n(\[.*\])/)[1]);
  const cats = [...prompt.matchAll(/Category: "([^"]+)"/g)].map((m) => m[1]);
  const answers = [];
  for (const c of step("ai").response.changes) if (!answers.find((a) => a.vendor === c.vendor)) answers.push(c);
  const label = (txt) => `<div style="margin-top:24px;font:700 17px var(--sans);color:var(--muted);letter-spacing:.08em">${txt}</div>`;
  const left = h(`<div class="card" style="left:96px;top:290px;width:840px;height:700px;padding:30px 34px">
    <h3 style="font-size:32px">What the model received</h3>
    ${label("SHOP NAMES")}<div style="margin-top:12px">${vendors.map((v) => `<span class="vchip">${esc(v)}</span>`).join("")}</div>
    ${label("YOUR CATEGORIES")}<div style="margin-top:12px">${cats.map((v) => `<span class="vchip" style="font-size:20px;padding:6px 12px">${esc(v)}</span>`).join("")}</div>
    ${label("NEVER SENT")}<div style="margin-top:12px"><span class="vchip no">amounts</span><span class="vchip no">dates</span><span class="vchip no">accounts</span><span class="vchip no">balances</span></div></div>`);
  const right = h(`<div class="card" style="left:984px;top:290px;width:840px;height:700px;padding:30px 34px">
    <h3 style="font-size:32px">What it answered</h3>
    <div class="sub" style="font-size:20px">${answers.length} shops, ${step("ai").response.categorized} transactions categorised</div>
    <div style="margin-top:22px">${answers.map((a) => `<div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;font:600 28px var(--sans)"><span class="vchip" style="margin:0">${esc(a.vendor)}</span><span style="color:var(--muted)">→</span><span>${esc(a.category)} <span style="color:var(--muted)">›</span> ${esc(a.sub_category)}</span></div>`).join("")}</div>
    <div class="sub" style="margin-top:26px;font-size:19px">Recorded from the model's own request log. The key never appears in any response.</div></div>`);
  add("ai", [hd, term.el, left, right], (t) => {
    appear(hd, t, 0.2);
    appear(term.el, t, 0.4, { out: 6.6 });
    term.update(t);
    appear(left, t, 7.0, { dx: -30, dy: 0, out: 13.0 });
    appear(right, t, 8.2, { dx: 30, dy: 0, out: 13.0 });
  }, { take: { at: 13.4, cards: [
    { icon: ICON.sparkles, code: "use_ai", title: "AI only when you ask", text: `Off by default. It can be ${glow("a model on your own device")}.` },
    { icon: ICON.shield, title: "Only shop names are shared", text: "Never amounts, dates or accounts. You review the result." },
  ] } });
}

// ── 6 · privacy ─────────────────────────────────────────────────────────────
{
  const hd = head(`${glow("Private")} by design, <em>and provably so</em>`, "Real responses from the same run:");
  const probe = (id, title, y) => {
    const s = step(id);
    return h(`<div class="card" style="left:1010px;top:${y}px;width:814px;padding:18px 24px">
      <div style="display:flex;align-items:center;gap:14px"><span class="m GET">GET</span><b style="font:700 24px var(--sans)">${title}</b><span class="status bad" style="margin-left:auto">${s.status}</span></div>
      <div style="font:500 17px var(--mono);color:hsl(210 30% 80%);margin-top:10px">${esc(JSON.stringify(s.response.error))}</div></div>`);
  };
  const p1 = probe("sec-nobearer", "No token", 270);
  const p2 = probe("sec-wrong", "Wrong token", 400);
  const p3 = probe("sec-origin", "A web page tries it", 530);
  const keyed = h(`<div class="card" style="left:1010px;top:660px;width:814px;padding:18px 24px">
      <div style="display:flex;align-items:center;gap:14px"><span class="m GET">GET</span><b style="font:700 24px var(--sans)">Is an AI key stored?</b><span class="status good" style="margin-left:auto">200</span></div>
      <div style="font:500 17px var(--mono);color:hsl(210 30% 80%);margin-top:10px"><span class="k">"has_api_key"</span>: <span class="v">true</span> <span class="d">  // the key itself is never returned</span></div></div>`);
  const diagram = h(`<svg class="abs" style="left:96px;top:250px" width="860" height="640" viewBox="0 0 860 640" fill="none">
    <rect x="10" y="60" width="560" height="540" rx="28" stroke="hsl(188 57% 59%)" stroke-width="2.5" stroke-dasharray="10 8" />
    <text x="40" y="104" fill="hsl(188 57% 70%)" font-family="Inter" font-weight="800" font-size="22" letter-spacing="2">YOUR DEVICE</text>
    <g font-family="Inter" font-weight="700" font-size="26" fill="#e8f1f8">
      <rect x="50" y="150" width="480" height="92" rx="16" fill="hsl(222 84% 5%)" stroke="hsl(217 32% 26%)"/><text x="80" y="206">Vaulted Money app</text>
      <rect x="50" y="285" width="480" height="92" rx="16" fill="hsl(222 84% 5%)" stroke="hsl(188 57% 59%)" stroke-width="2"/><text x="80" y="340">Local API</text><text x="450" y="340" font-family="JetBrains Mono" font-size="19" font-weight="500" fill="hsl(215 20% 65%)" text-anchor="end">127.0.0.1</text>
      <rect x="50" y="420" width="480" height="92" rx="16" fill="hsl(222 84% 5%)" stroke="hsl(217 32% 26%)"/><text x="80" y="475">Your data</text><text x="450" y="475" font-size="19" font-weight="500" fill="hsl(215 20% 65%)" text-anchor="end">stored on this device</text>
    </g>
    <path d="M290 242v43M290 377v43" stroke="hsl(188 57% 59%)" stroke-width="3" stroke-linecap="round"/>
    <g id="d-cloud" opacity="0">
      <path d="M720 190h-60a40 40 0 1 1 8-79 48 48 0 0 1 92 20 34 34 0 0 1-40 59Z" stroke="hsl(215 20% 55%)" stroke-width="3" transform="translate(-20 10)"/>
      <path d="M600 120l150 150M750 120L600 270" stroke="hsl(0 84% 66%)" stroke-width="7" stroke-linecap="round" transform="translate(-10 -4)"/>
      <path d="M570 330H640" stroke="hsl(0 84% 66%)" stroke-width="3" stroke-dasharray="6 8"/>
      <text x="580" y="300" fill="hsl(0 70% 76%)" font-family="Inter" font-weight="700" font-size="22" transform="translate(30 60)">No cloud account</text>
      <text x="580" y="330" fill="hsl(215 20% 65%)" font-family="Inter" font-weight="500" font-size="19" transform="translate(30 60)">Nothing leaves the device</text>
    </g>
  </svg>`);
  const check = ICON.check;
  const feats = h(`<div class="abs" style="left:96px;top:930px;display:flex;gap:16px">
    <span class="ftag">${check}${flip("dry_run", "Preview before any change")}</span>
    <span class="ftag">${check}${flip("confirm_delete", "Deletes need your OK")}</span>
    <span class="ftag">${check}${flip(".lock", "Encrypted backups")}</span></div>`);
  add("privacy", [hd, diagram, p1, p2, p3, keyed, feats], (t) => {
    appear(hd, t, 0.2);
    appear(diagram, t, 0.5, { dy: 20 });
    diagram.querySelector("#d-cloud").style.opacity = tw(t, 1.4, 2.0);
    appear(p1, t, 2.2, { dx: 50, dy: 0 });
    appear(p2, t, 3.2, { dx: 50, dy: 0 });
    appear(p3, t, 4.2, { dx: 50, dy: 0 });
    appear(keyed, t, 5.2, { dx: 50, dy: 0 });
    appear(feats, t, 6.4);
    setFlip(feats, t, 6.6, 1.6);
  });
}

// ── chat with your data (MCP) ───────────────────────────────────────────────
// Every tool call, argument and number below is a recorded call of the real
// MCP server against the real API (out/mcp-run.json). Only the assistant's
// wording is illustrative, and the film says so.
const mcpRun = await (await fetch("out/mcp-run.json")).json();
const rec = (id) => mcpRun.calls.find((c) => c.id === id);
const rj = (id) => JSON.parse(rec(id).text);
const eur = (n, d = 2) => "€" + Number(n).toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const argsText = (a) => jsonLines(a).join("\n");
const dim = (s) => `<span class="d">${s}</span>`;

/**
 * A chat window. items: {at, user} typed by the user; {at, tool, args, lines,
 * approve?} a tool call (optionally behind an approval prompt); {at, bot} an
 * answer streamed word by word. Speeds are brisk so the demo does not drag.
 */
function makeChat({ x, y, w, hgt, title, items }) {
  const el = h(`<div class="chat" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px">
    <div class="chat-bar"><span class="dot"></span><b>${title}</b><span class="chat-tag">vaulted-money · ${run.extra.mcpTools?.length ?? 8} tools</span></div>
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
        const k = t >= it.at ? tw(t, it.at, it.at + 0.3) : 0;
        node.style.display = t >= it.at ? "" : "none";
        node.style.opacity = k;
        if (t < it.at) continue;
        const dt = t - it.at;
        if (it.user !== undefined) node.textContent = it.user.slice(0, Math.floor(dt * 110) + 1);
        else if (it.bot !== undefined) node.innerHTML = it.words.slice(0, Math.floor(dt * 22) + 1).join("");
        else {
          const approveEnd = it.approve ? 1.7 : 0;
          const runEnd = approveEnd + 0.6;
          const state = node.querySelector(".state");
          const approve = node.querySelector(".tool-approve");
          if (approve) {
            approve.style.display = dt < approveEnd - 0.1 ? "" : "none";
            approve.style.opacity = tw(dt, 0.3, 0.6);
            node.querySelector(".btn.allow").classList.toggle("on", dt > 1.1);
          }
          const res = node.querySelector(".tool-res");
          if (dt < approveEnd) { state.textContent = it.approve ? "waiting for approval" : ""; state.className = "state run"; res.style.display = "none"; }
          else if (dt < runEnd) { state.textContent = "running…"; state.className = "state run"; res.style.display = "none"; }
          else {
            state.textContent = "✓ done"; state.className = "state done";
            res.style.display = "";
            res.innerHTML = it.lines.slice(0, Math.floor((dt - runEnd) * 14) + 1).join("\n");
          }
        }
      }
      const overflow = col.offsetHeight - bodyH;
      col.style.transform = `translateY(${-Math.max(0, overflow)}px)`;
    },
  };
}

// ── 7a · intro: a local model and a small tool set ──────────────────────────
{
  const o = run.extra.openapi;
  const nTools = run.extra.mcpTools?.length ?? 8;
  const specKb = o.bytes / 1000, toolsKb = (run.extra.mcpToolListBytes ?? 5600) / 1000;
  const fmt = (n) => (n >= 10 ? Math.round(n) : n.toFixed(1));
  const hd = head(`Chat with your money. <em>On your own device.</em>`, `A local model and a small helper: ${glow("no cloud, no per-token bill")}, and your data stays on your device.`);
  const box = (x, title, sub, cls = "") => h(`<div class="card" style="left:${x}px;top:290px;width:384px;padding:20px 22px;${cls}"><h3 style="font-size:25px">${title}</h3><div class="sub" style="font-size:18px">${sub}</div></div>`);
  const flow = [
    box(96, "Local model", "LM Studio, Claude Code, or any compatible app"),
    box(544, "Helper (MCP server)", `${nTools} small tools in one file`, "border-color:hsl(188 57% 59%);box-shadow:0 0 40px hsl(188 57% 59% / .22)"),
    box(992, "Local API", "Only reachable from this device"),
    box(1440, "Vaulted Money", "Your data, on your device"),
  ];
  const arrows = [0, 1, 2].map((i) => h(`<svg class="abs" style="left:${484 + i * 448}px;top:338px" width="56" height="30" viewBox="0 0 72 30" fill="none"><path d="M2 15h60m-12-11 12 11-12 11" stroke="hsl(188 57% 59%)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  const readChips = [["list_ledgers", "See your ledgers"], ["spending_summary", "Spending summary"], ["find_transactions", "Find transactions"], ["budgets_and_insights", "Budgets and insights"], ["search_api", "Search the API"]];
  const writeChips = [["call_api", "Use any endpoint"], ["add_transaction", "Add a transaction"], ["import_csv", "Import a CSV"]];
  const chip = (c, kind) => `<span class="vchip" style="${kind === "r" ? "color:hsl(152 60% 72%);background:hsl(152 60% 40% / .10);border-color:hsl(152 60% 40% / .5)" : "color:hsl(35 92% 74%);background:hsl(35 92% 62% / .10);border-color:hsl(35 92% 62% / .5)"};font-family:var(--sans);font-size:24px">${flip(c[0], c[1])}</span>`;
  const chips = h(`<div class="abs" style="left:96px;top:480px;width:1730px">
    <div style="font:700 17px var(--sans);letter-spacing:.08em;color:var(--good);margin-bottom:10px">LOOK ONLY</div>
    <div>${readChips.map((c) => chip(c, "r")).join("")}</div>
    <div style="font:700 17px var(--sans);letter-spacing:.08em;color:var(--warn);margin:12px 0 10px">CAN CHANGE THINGS · ASKS YOU FIRST</div>
    <div>${writeChips.map((c) => chip(c, "w")).join("")}</div></div>`);
  const cmp = h(`<div class="card" style="left:96px;top:760px;width:1728px;padding:24px 30px">
    <div style="display:grid;grid-template-columns:360px 1fr;row-gap:16px;align-items:center">
      <div style="font:600 22px var(--sans)">The full API description<div style="font:500 17px var(--sans);color:var(--muted)">${o.operations} operations</div></div>
      <div style="display:flex;align-items:center;gap:16px"><div id="b1" style="height:30px;border-radius:8px;background:linear-gradient(90deg,hsl(0 70% 55%),hsl(20 85% 60%));width:0"></div><b style="font:700 24px var(--mono)">${fmt(specKb)} kB</b></div>
      <div style="font:600 22px var(--sans)">These ${nTools} tools<div style="font:500 17px var(--sans);color:var(--muted)">read again on every question</div></div>
      <div style="display:flex;align-items:center;gap:16px"><div id="b2" style="height:30px;border-radius:8px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));width:0"></div><b style="font:700 24px var(--mono)">${fmt(toolsKb)} kB</b><span style="font:600 22px var(--sans);color:var(--accent-soft)">about ${Math.round(specKb / toolsKb)}× less for a local model to read</span></div>
    </div></div>`);
  add("mcp", [hd, ...flow, ...arrows, chips, cmp], (t) => {
    appear(hd, t, 0.2);
    flow.forEach((f, i) => appear(f, t, 0.8 + i * 0.5, { dy: 20 }));
    arrows.forEach((a, i) => appear(a, t, 1.2 + i * 0.5, { dx: -20, dy: 0 }));
    appear(chips, t, 3.0);
    setFlip(chips, t, 3.2, 1.8);
    appear(cmp, t, 5.4);
    cmp.querySelector("#b1").style.width = 900 * tw(t, 5.8, 6.8) + "px";
    cmp.querySelector("#b2").style.width = Math.max(2, 900 * (toolsKb / specKb) * tw(t, 7.0, 7.8)) + "px";
  }, { take: { at: 8.6, cards: [
    { icon: ICON.chat, title: "Chat with your own money", text: `Ask a local model in plain words. ${glow("Nothing leaves your device.")}` },
    { icon: ICON.layers, title: "Small by design", text: `${nTools} simple tools, so even local models answer quickly.` },
  ] } });
}

// ── 7b · ask ────────────────────────────────────────────────────────────────
{
  const sp = rj("q-spending"), bu = rj("q-budget");
  const cat = (n) => sp.by_category.find((c) => c.category === n);
  const food = bu.budgets[0];
  const hd = head("Ask in plain words. <em>Get answers from your own data.</em>");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.5, user: "Where is my money going?" },
      { at: 1.2, tool: "spending_summary", args: rec("q-spending").args, lines: [
        `${dim("period")}  ${sp.period.label}  ${dim(`${sp.period.from} → ${sp.period.to}`)}`,
        `${dim("spent")}   ${eur(sp.totals.expenses)}   ${dim("income")} ${eur(sp.totals.income)}`,
        sp.by_category.slice(0, 3).map((c) => `${c.category} ${c.share_pct}%`).join(" · ") ] },
      { at: 2.9, bot: `Mostly <b>${cat("Housing").category}</b>: ${eur(cat("Housing").spent, 0)} (${Math.round(cat("Housing").share_pct)}%). Then <b>Food</b> at ${eur(cat("Food").spent, 0)} and <b>Transport</b> at ${eur(cat("Transport").spent, 0)}. You spent <b>${eur(sp.totals.expenses)}</b> from 1 to 30 Sep.` },
      { at: 5.0, user: "Am I over budget anywhere?" },
      { at: 5.6, tool: "budgets_and_insights", args: {}, lines: [
        `${dim("Food")}  target ${eur(food.target, 0)}  spent ${eur(food.spent)}`,
        `${dim("status")}  <span style="color:var(--bad)">${bu.budget_health[0].status}</span>  ${dim(bu.budget_health[0].message)}` ] },
      { at: 7.0, bot: `Yes: <b class="bad">Food</b> is at ${eur(food.spent)} of ${eur(food.target, 0)} (${Math.round(bu.budget_health[0].percentUsed)}%), <b>${eur(food.spent - food.target)}</b> over.` },
    ],
  });
  const echo = h(`<div class="card" style="left:1010px;top:270px;width:814px;padding:24px 28px">
    <div style="font:700 15px var(--sans);letter-spacing:.08em;color:var(--muted)">THE QUESTION HAD NO DATE</div>
    <div style="font:500 26px/1.45 var(--sans);margin-top:10px">The model chose <b>“last 30 days”</b>. The server turned that into <b style="color:var(--accent-soft)">${sp.period.from} → ${sp.period.to}</b> and said so in the answer.</div></div>`);
  const dash = shot(S("dashboard"), 1010, 520, 814, RATIO, "In the app · Dashboard", { hgt: 470, off: 235 });
  const rg = shotRing(dash, 560, 345, 520, 235, "warn");
  const note = h(`<div class="abs" style="left:96px;top:1036px;font:500 15px var(--sans);color:hsl(215 16% 50%)">Assistant wording is illustrative. Every tool call, argument and number is a real recorded result.</div>`);
  add("ask", [hd, chat.el, echo, dash, rg, note], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.3, { dy: 20 });
    chat.update(t);
    appear(echo, t, 3.4, { dx: 40, dy: 0 });
    appear(dash, t, 7.2, { dy: 20 });
    ring(rg, t, 8.0);
  }, { take: { at: 9.0, cards: [
    { icon: ICON.chat, title: "Ask in plain words", text: "No dates, no formulas. The tools read your real ledger." },
    { icon: ICON.calendar, title: "Exact dates, every time", text: "The model picks “last 30 days”. The server does the date maths." },
  ] } });
}

// ── 7c · add a transaction ──────────────────────────────────────────────────
{
  const ad = rj("q-add");
  const hd = head("Add a transaction. <em>Just say it.</em>");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.5, user: "Add a €12.50 coffee at Cafe Central today, Food › Dining out." },
      { at: 1.4, tool: "add_transaction", args: rec("q-add").args, approve: true, lines: [
        `${dim("created")} true   ${dim("id")} ${short(ad.id)}`,
        `${eur(ad.amount)}  ${ad.vendor}  ${dim("·")} ${ad.category}  ${dim(ad.date)}` ] },
      { at: 4.2, bot: `Done. Added <b>${eur(Math.abs(ad.amount))}</b> at <b>${ad.vendor}</b> (Food › Dining out) on 30 Sep. Say "undo" and I'll delete it.` },
    ],
  });
  const tx = shot(S("tx-mcp-added"), 1010, 320, 814, RATIO, "In the app · Transactions, live", { hgt: 430, off: 287 });
  const rg = shotRing(tx, 60, 575, 1010, 55, "");
  add("add", [hd, chat.el, tx, rg], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.3, { dy: 20 });
    chat.update(t);
    appear(tx, t, 4.4, { dx: 40, dy: 0 });
    ring(rg, t, 5.2, 6.6);
  }, { take: { at: 6.4, cards: [
    { icon: ICON.chat, title: "Say it, and it's added", text: "Describe the purchase in your own words." },
    { icon: ICON.undo, title: "Nothing changes without your OK", text: "Your chat app asks first, and every change can be undone." },
  ] } });
}

// ── 7d · import a messy bank CSV ────────────────────────────────────────────
{
  const pre = rj("q-import-preview"), imp = rj("q-import");
  const map = Object.entries(pre.column_mapping).map(([to, from]) => `${from}→${to}`).join(", ");
  const csvLines = run.extra.statement.split("\n").slice(0, 5);
  const hd = head("Import a bank CSV. <em>No reformatting.</em>");
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.5, user: "Import ~/Downloads/bank-statement.csv into Checking. Preview first." },
      { at: 1.3, tool: "import_csv", args: rec("q-import-preview").args, lines: [
        `${dim("dry_run")} true   ${dim("rows")} ${pre.rows_in_file}   ${dim("imported")} 0`,
        `${dim("mapped")}  ${map}` ] },
      { at: 2.9, bot: `I mapped <b>Booking Date→Date</b> and <b>Description→Vendor</b>, and read amounts like 2.450,00 correctly. ${pre.rows_in_file} rows, <b>nothing imported yet</b>. Import them?` },
      { at: 5.0, user: "Yes, import." },
      { at: 5.5, tool: "import_csv", args: rec("q-import").args, approve: true, lines: [
        `${dim("imported")} <span class="ok">${imp.result.imported}</span>   ${dim("skipped")} ${imp.result.skipped}` ] },
      { at: 8.0, bot: `Imported <b>${imp.result.imported}</b> transactions. They have no category yet. Want me to categorise them from your history?` },
    ],
  });
  const csv = h(`<div class="card" style="left:1010px;top:270px;width:814px;padding:18px 22px"><div style="display:flex;align-items:center;gap:10px;color:var(--muted);font:600 17px var(--sans);margin-bottom:10px"><span style="color:var(--accent);width:22px;height:22px;display:inline-block">${ICON.file}</span><b style="color:var(--fg)">${run.extra.statementPath}</b></div><div style="font:500 16px var(--sans);color:var(--muted);margin:-4px 0 10px">comma-separated, ISO dates, amounts like "2.450,00"</div><div style="font:500 16px/24px var(--mono);color:hsl(210 30% 85%);white-space:pre;overflow:hidden">${esc(csvLines.join("\n"))}</div></div>`);
  const tx = shot(S("tx-mcp-imported"), 1010, 540, 814, RATIO, "In the app · Transactions", { hgt: 440, off: 287 });
  const rg = shotRing(tx, 60, 575, 1010, 300, "");
  add("csv", [hd, chat.el, csv, tx, rg], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.3, { dy: 20 });
    chat.update(t);
    appear(csv, t, 0.6, { dx: 40, dy: 0 });
    appear(tx, t, 7.6, { dx: 40, dy: 0 });
    csv.style.opacity = Math.min(csv.style.opacity, 1 - 0.5 * tw(t, 7.4, 8.0));
    ring(rg, t, 8.6, 10.2);
  }, { take: { at: 10.4, cards: [
    { icon: ICON.file, title: "Bank files, as they come", text: "Different column names, dates and number styles are handled for you." },
    { icon: ICON.eye, title: "Preview, then import", text: `Nothing is imported until you say yes. ${glow("The file stays on your device.")}` },
  ] } });
}

// ── 7e · safe deletion ──────────────────────────────────────────────────────
{
  const accounts = rj("q-accounts").data;
  const hd = head("Deleting? <em>It asks twice.</em>");
  const delPath = "/ledgers/{ledgerId}/accounts/" + short(rec("q-delete").args.path.split("/").pop());
  const chat = makeChat({
    x: 96, y: 250, w: 880, hgt: 770, title: "Local model · chat",
    items: [
      { at: 0.5, user: "Delete the Old Card account." },
      { at: 1.0, tool: "call_api", args: rec("q-accounts").args, lines: [`${dim("accounts")}  ${accounts.map((a) => a.name).join(", ")}`] },
      { at: 2.2, tool: "call_api", args: { method: "DELETE", path: delPath }, lines: [
        `<span style="color:var(--warn)">preview: true   executed: false</span>`,
        `${dim("Nothing changed. Show this to the user; if they approve, repeat with confirm:true.")}` ] },
      { at: 3.6, bot: `<b>Old Card</b> has no transactions. This will delete the account itself. Shall I go ahead?` },
      { at: 5.0, user: "Go ahead." },
      { at: 5.4, tool: "call_api", args: { method: "DELETE", path: delPath, confirm: true }, approve: true, lines: [`<span class="ok">deleted: true</span>`] },
      { at: 8.0, bot: `Done. <b>Old Card</b> is deleted and your other accounts are untouched.` },
    ],
  });
  const steps = [
    ["1", "The model previews", "Nothing is deleted yet. It only says what it would do."],
    ["2", "You approve", "Your chat app asks before any tool that can change data."],
    ["3", "Then it happens", "Past transactions stay in your ledger, still labelled with the old account's name."],
  ].map(([n, t1, t2], i) => h(`<div class="stepcard" style="left:1010px;top:${290 + i * 200}px;width:814px;padding:24px 28px"><div class="n">${n}</div><div><b style="font-size:30px">${t1}</b><small style="font-size:22px">${t2}</small></div></div>`));
  add("safe", [hd, chat.el, ...steps], (t) => {
    appear(hd, t, 0.2);
    appear(chat.el, t, 0.3, { dy: 20 });
    chat.update(t);
    steps.forEach((s, i) => appear(s, t, [1.6, 4.4, 7.4][i], { dx: 40, dy: 0 }));
  });
}

// ── 7f · more questions, one card each ──────────────────────────────────────
{
  const sp = rj("q-spending"), vend = rj("q-vendor");
  const csvRows = rec("q-report").text.trim().split("\n").slice(0, 6).join("\n");
  const chainHtml = (items) => items.map((c) => `<span class="t">${flip(c[0], c[1])}</span>`).join("<span>→</span>");
  const card = (x, q, chain, ans, extra = "") => h(`<div class="mini" style="left:${x}px;top:310px;width:556px;height:520px"><span class="q" style="font-size:25px">${q}</span><div class="chain" style="font-size:19px">${chainHtml(chain)}</div><div class="ans" style="font-size:27px">${ans}</div>${extra}</div>`);
  const hd = head("Anything else <em>is one question away.</em>", "A small tool set that still reaches the whole API.");
  const c1 = card(96, "Which vendors cost me the most?", [["spending_summary", "Spending summary"]], sp.by_vendor.filter((v) => v.spent > 0).slice(0, 3).map((v) => `<b>${v.vendor}</b> ${eur(v.spent)}`).join("<br>") + `<br><span style="color:var(--muted);font-size:20px">…out of ${eur(sp.totals.expenses)} in 30 days</span>`);
  const c2 = card(682, "How much did I spend at Corner Market?", [["find_transactions", "Find transactions"]], `<b>${vend.total_matches} purchases</b>, ${eur(Math.abs(vend.sum_of_shown))} in total.<br><span style="color:var(--muted);font-size:20px">${vend.transactions.map((t) => eur(Math.abs(t.amount))).join(" · ")}</span>`);
  const c3 = card(1268, "Give me September's income and expenses as a CSV.", [["search_api", "Search the API"], ["call_api", "Fetch the report"]], `Found the income and expense report and fetched it:`, `<div class="csv" style="font-size:16px">${esc(csvRows)}</div>`);
  add("more", [hd, c1, c2, c3], (t) => {
    appear(hd, t, 0.2);
    appear(c1, t, 0.6, { dy: 30 }); appear(c2, t, 2.0, { dy: 30 }); appear(c3, t, 3.4, { dy: 30 });
    [c1, c2, c3].forEach((c, i) => setFlip(c, t, [0.8, 2.2, 3.6][i], 1.4));
  });
}

// ── 8 · three ways to use it ────────────────────────────────────────────────
{
  const hd = head("Pair it with <em>any interface</em>", "The same API drives all three.");
  const col = (x, title, sub) => h(`<div class="card" style="left:${x}px;top:260px;width:556px;height:660px;padding:26px 28px"><h3>${title}</h3><div class="sub">${sub}</div></div>`);
  const c1 = col(96, "Vaulted Money app", "Your data, in the app you already use");
  const c2 = col(682, "Your own interface", "A dashboard you build on the API's spending data");
  const c3 = col(1268, "Postman collection", "Import it, add your token, press Run");
  const ui = shot(S("dashboard"), 114, 420, 520, RATIO, "", { hgt: 460, off: 130 });
  const cats = run.steps.find((s) => s.id === "analytics").response.byCategory.filter((c) => c.expenses > 0);
  const max = Math.max(...cats.map((c) => c.expenses));
  const gui = h(`<div class="abs" style="left:704px;top:420px;width:512px;height:460px">
    <div style="border:1px solid var(--border);border-radius:14px;background:hsl(217 32% 9%);padding:20px 22px;height:100%">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:800 24px var(--sans);letter-spacing:-.02em">Home · September</b><span style="font:600 15px var(--sans);color:var(--muted)">my-dashboard.html</span></div>
      <div style="font:800 40px var(--sans);letter-spacing:-.03em;margin-top:8px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 52%));-webkit-background-clip:text;background-clip:text;color:transparent">€${step("analytics").response.totals.expenses.toLocaleString("en", { minimumFractionDigits: 2 })}</div>
      <div style="font:500 15px var(--sans);color:var(--muted);margin-bottom:14px">spent this month</div>
      ${cats.map((c, i) => `<div class="bar" style="margin:9px 0"><div style="display:flex;justify-content:space-between;font:600 16px var(--sans)"><span>${c.category}</span><span style="color:var(--muted)">€${c.expenses.toFixed(0)}</span></div><div style="height:12px;border-radius:7px;background:hsl(217 32% 16%);margin-top:5px;overflow:hidden"><i class="fill" data-w="${(c.expenses / max) * 100}" style="display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));width:0"></i></div></div>`).join("")}
    </div></div>`);
  const folders = ["Smoke and security", "Ledgers", "Accounts", "Transactions", "AI providers", "Analytics and reports", "Clean-up tools", "CSV import and export", "Cleanup"];
  const pm = h(`<div class="abs" style="left:1290px;top:420px;width:512px">
    ${folders.map((f) => `<div class="pmf" style="display:flex;align-items:center;gap:12px;padding:9px 14px;margin-bottom:6px;border-radius:10px;background:hsl(217 32% 11%);border:1px solid var(--border);font:600 17px var(--sans)"><span class="ok" style="width:18px;height:18px;flex:none">${ICON.check}</span>${f}</div>`).join("")}
    <div style="margin-top:8px;font:700 21px var(--sans);color:var(--accent-soft)">202 requests · 545 automatic checks</div></div>`);
  add("ways", [hd, c1, c2, c3, ui, gui, pm], (t) => {
    appear(hd, t, 0.2);
    appear(c1, t, 0.6); appear(ui, t, 0.9);
    appear(c2, t, 2.4); appear(gui, t, 2.7);
    gui.querySelectorAll(".fill").forEach((f, i) => (f.style.width = f.dataset.w * tw(t, 3.2 + i * 0.1, 4.0 + i * 0.1) + "%"));
    appear(c3, t, 4.6); appear(pm, t, 4.9);
    pm.querySelectorAll(".pmf").forEach((f, i) => appear(f, t, 5.1 + i * 0.15, { dy: 8, dur: 0.4 }));
  });
}

// ── 9 · light or dark ───────────────────────────────────────────────────────
{
  const hd = head("Day or night, <em>your choice</em>", "The app follows your system theme, or the toggle you pick.");
  const W = 1000, H = Math.round(W * RATIO * 0.72);
  const frame = (src, label) => `<div class="shotwrap" style="left:0;top:0;width:${W}px;height:${H}px"><div class="shot"><img src="${src}" style="position:absolute;left:0;top:-${Math.round(W * 0.12)}px;width:100%;height:auto"></div></div>`;
  const stageEl = h(`<div class="abs" style="left:96px;top:300px;width:${W}px;height:${H}px">
    <div class="shotlabel" style="position:absolute;left:2px;top:-36px;font:600 17px var(--sans);color:var(--muted)"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--accent);margin-right:9px"></span>In the app · Dashboard</div>
    ${frame(S("dashboard"))}
    <div id="lightlayer" style="position:absolute;inset:0;clip-path:circle(0px at 94% 6%)">${frame(S("dashboard-light"))}</div>
    <div id="toggle" style="position:absolute;right:${Math.round(W * 0.052)}px;top:${Math.round(W * 0.012)}px;width:46px;height:46px;border-radius:50%"></div>
  </div>`);
  const ringT = ringAt(96 + W - 90, 300 + 6, 70, 70);
  // Brand marks: silver/cyan on dark, navy/gold on light, as in the brand manual.
  const marks = h(`<div class="abs" style="left:1180px;top:300px;width:644px;height:${H}px;border-radius:20px;overflow:hidden;border:1px solid var(--border)">
    <div style="position:absolute;inset:0;background:hsl(222 84% 5%);display:grid;place-items:center"><img src="/repo/assets/brand/dark-icon.png" style="width:260px;height:260px;object-fit:contain"></div>
    <div id="marklight" style="position:absolute;inset:0;background:#f7f9fc;display:grid;place-items:center;clip-path:circle(0px at 90% 8%)"><img src="/repo/assets/brand/light-icon.png" style="width:260px;height:260px;object-fit:contain"></div></div>`);
  const cap = h(`<div class="abs" style="left:1180px;top:${300 + H + 24}px;width:644px;font:600 24px/1.4 var(--sans);color:var(--muted)">Silver and cyan by night. Navy and gold by day.</div>`);
  add("themes", [hd, stageEl, ringT, marks, cap], (t) => {
    appear(hd, t, 0.2);
    appear(stageEl, t, 0.4, { dy: 24 });
    appear(marks, t, 0.7, { dy: 24 });
    appear(cap, t, 1.2);
    ring(ringT, t, 2.4, 3.8);
    const r = 1500 * tw(t, 3.2, 4.8, ease.inOut);
    stageEl.querySelector("#lightlayer").style.clipPath = `circle(${r}px at 94% 6%)`;
    marks.querySelector("#marklight").style.clipPath = `circle(${r * 0.9}px at 90% 8%)`;
  });
}

// ── 10 · why it's different ─────────────────────────────────────────────────
{
  const hd = head(`One vault. <em>Every interface.</em>`, "A money app that is also a platform you can build on.");
  const NW = 300, GAP = 57, X0 = 96;
  const nodeX = (i) => X0 + i * (NW + GAP);
  const nodes = ["Vaulted Money app", "Your own interface", "Postman", "Scripts and automations", "Local AI chat"];
  const hub = h(`<div class="abs" style="left:560px;top:250px;width:800px;height:118px;display:flex;align-items:center;justify-content:center;gap:22px;border-radius:22px;background:var(--card);border:1px solid var(--accent);box-shadow:0 0 60px hsl(188 57% 59% / .25)">
    <img src="/repo/assets/brand/dark-icon.png" style="width:84px;height:84px;object-fit:contain"><div style="font:800 32px var(--sans);letter-spacing:-.02em">${glow("Your data")}, on your device</div></div>`);
  const api = h(`<div class="abs" style="left:610px;top:430px;width:700px;height:72px;display:flex;align-items:center;justify-content:center;border-radius:16px;background:hsl(246 90% 66% / .16);border:1px solid hsl(246 90% 66% / .5);font:700 28px var(--sans)">${flip("REST API · OpenAPI 3.1", "One open API for everything")}</div>`);
  const lines = h(`<svg class="abs" style="left:0;top:0" width="1920" height="1080" fill="none"><g stroke="hsl(217 32% 30%)" stroke-width="3" stroke-linecap="round"><path d="M960 368V430M960 502V556"/><path d="M${nodeX(0) + NW / 2} 600V556H${nodeX(4) + NW / 2}V600M${nodeX(1) + NW / 2} 556V600M${nodeX(2) + NW / 2} 556V600M${nodeX(3) + NW / 2} 556V600"/></g></svg>`);
  const spokes = nodes.map((label, i) => h(`<div class="abs" style="left:${nodeX(i)}px;top:600px;width:${NW}px;height:96px;display:grid;place-items:center;text-align:center;border-radius:16px;background:var(--card);border:1px solid var(--border);font:700 24px/1.2 var(--sans);padding:0 14px">${label}</div>`));
  const pts = [
    ["Local-first", `${glow("No cloud account.")} It works offline.`],
    ["One open API", "Documented in an open standard, so you can build anything on it."],
    ["Your choice of interface", "Use ours, build your own, or script it."],
  ];
  const CW = 560, CG = 24;
  const cards = pts.map(([t1, t2], i) => h(`<div class="card" style="left:${X0 + i * (CW + CG)}px;top:760px;width:${CW}px;height:190px;padding:24px 28px"><h3 style="font-size:30px;color:var(--accent-soft)">${t1}</h3><div class="sub" style="font-size:23px;margin-top:10px">${t2}</div></div>`));
  add("unique", [hd, lines, hub, api, ...spokes, ...cards], (t) => {
    appear(hd, t, 0.2);
    appear(hub, t, 0.5);
    appear(api, t, 1.2);
    setFlip(api, t, 1.4, 1.6);
    lines.style.opacity = tw(t, 2.0, 2.8);
    spokes.forEach((s, i) => appear(s, t, 2.4 + i * 0.3, { dy: 16 }));
    cards.forEach((c, i) => appear(c, t, 4.4 + i * 1.0, { dy: 20 }));
  });
}

// ── 11 · end card ───────────────────────────────────────────────────────────
const qrSite = await (await fetch("out/qr-site.svg")).text();
const qrGit = await (await fetch("out/qr-github.svg")).text();
{
  const logo = h(`<img src="/repo/assets/brand/dark-icon.png" class="abs" style="left:810px;top:60px;width:300px;height:300px;object-fit:contain">`);
  const word = h(`<div class="abs" style="left:0;right:0;top:350px;text-align:center;font:800 112px/1 var(--sans);letter-spacing:-.045em;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%));-webkit-background-clip:text;background-clip:text;color:transparent">Vaulted Money</div>`);
  const tagline = h(`<div class="abs" style="left:0;right:0;top:490px;text-align:center;font:600 40px var(--sans);letter-spacing:-.02em">Your money, your device, <span class="glow">your API.</span></div>`);
  const pills = h(`<div class="abs" style="left:0;right:0;top:570px;display:flex;gap:18px;justify-content:center"><span class="pill g glowbox">Privacy-first</span><span class="pill b glowbox">Data-local</span><span class="pill o">Open-sourced</span></div>`);
  const links = h(`<div class="abs" style="left:0;right:0;top:700px;text-align:center"><div style="font:500 30px var(--mono);color:var(--fg)">vaulted.money</div><div style="font:500 30px var(--mono);color:var(--muted);margin-top:14px">github.com/nrajesh/vaulted.money</div></div>`);
  const qr = (svg, label, sub) => `<div style="width:330px;text-align:center"><div style="width:300px;height:300px;margin:0 auto;border-radius:18px;overflow:hidden;background:#fff;padding:8px;box-shadow:0 0 50px hsl(188 57% 59% / .25)"><div style="width:100%;height:100%" class="qr">${svg}</div></div><div style="font:700 26px var(--sans);margin-top:16px">${label}</div><div style="font:500 20px var(--sans);color:var(--muted)">${sub}</div></div>`;
  const qrs = h(`<div class="abs" style="left:0;right:0;top:590px;display:flex;gap:90px;justify-content:center">${qr(qrSite, "Website", "vaulted.money")}${qr(qrGit, "Source code", "github.com/nrajesh/vaulted.money")}</div>`);
  qrs.querySelectorAll(".qr svg").forEach((svg) => {
    const n = svg.getAttribute("width"); // modules per side
    svg.setAttribute("viewBox", `0 0 ${n} ${n}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.shapeRendering = "crispEdges";
  });
  const scan = h(`<div class="abs" style="left:0;right:0;top:1032px;text-align:center;font:500 22px var(--sans);color:var(--muted)">Scan with your phone's camera</div>`);
  const black = h(`<div class="abs" style="inset:0;background:#000;opacity:0"></div>`);
  add("outro", [logo, word, tagline, pills, links, qrs, scan, black], (t) => {
    appear(logo, t, 0.1, { dur: 1.0, scale: 0.12, dy: 0 });
    logo.style.filter = `drop-shadow(0 0 ${30 + 15 * Math.sin(t * 2)}px hsl(188 57% 59% / .4))`;
    appear(word, t, 0.7);
    appear(tagline, t, 1.4);
    appear(pills, t, 2.1, { out: 6.8 });
    appear(links, t, 3.2, { out: 6.8 });
    // The addresses give way to scannable codes.
    qrs.style.opacity = tw(t, 7.4, 8.4);
    qrs.style.transform = `translateY(${(1 - tw(t, 7.4, 8.4)) * 24}px)`;
    scan.style.opacity = tw(t, 8.2, 9.0);
    black.style.opacity = tw(t, 11.8, 13.0, (x) => x);
  });
}

// ── chapter pills ───────────────────────────────────────────────────────────
const labels = [...new Set(SCENES.filter((s) => s.label).map((s) => s.label))];
const bar = h(`<div id="chapters">${labels.map((l) => `<span class="chip" data-label="${l}">${l}</span>`).join("")}</div>`);
stage.append(bar);

// ── the frame function ──────────────────────────────────────────────────────
window.__render = (t) => {
  stage.style.setProperty("--g", (0.5 + 0.5 * Math.sin(t * 1.8)).toFixed(3)); // glow pulse
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

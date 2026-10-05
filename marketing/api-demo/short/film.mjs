/**
 * The teaser composition (see timeline.mjs). Like the full film, every scene is
 * a pure function of time: window.__render(t) poses the whole frame. App screens
 * are real screenshots, and every number comes from the recorded run.
 */
import { SCENES, DISSOLVE } from "./timeline.mjs";

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "short/styles.css";
document.head.append(link);

// ── motion helpers ──────────────────────────────────────────────────────────
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
};
const tw = (t, a, b, f = ease.out) => f(prog(t, a, b));
const stage = document.getElementById("stage");
const h = (html) => {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function appear(el, t, at, { dy = 26, dx = 0, dur = 0.7, scale = 0, out = Infinity } = {}) {
  const k = tw(t, at, at + dur) * (Number.isFinite(out) ? 1 - tw(t, out, out + 0.5, ease.inOut) : 1);
  el.style.opacity = k;
  el.style.transform = `translate(${(1 - k) * dx}px, ${(1 - k) * dy}px) scale(${1 - (1 - k) * scale})`;
  el.style.visibility = k > 0.001 ? "visible" : "hidden";
}
/** Pop with a little overshoot (used for stickers). */
function pop(el, t, at, dur = 0.6) {
  const k = clamp((t - at) / dur);
  const s = k <= 0 ? 0.6 : 1 + (ease.back(k) - 1) * 0.5;
  el.style.opacity = tw(t, at, at + 0.25);
  el.style.transform = `scale(${k <= 0 ? 0.6 : 0.6 + 0.4 * ease.back(k)})`;
  el.style.visibility = k > 0 ? "visible" : "hidden";
  void s;
}
/** Stroke-draw an icon: every shape in `root` is drawn from nothing to complete. */
function drawIn(root, k) {
  root.querySelectorAll("path, circle, rect, line, polyline, polygon").forEach((n) => {
    n.setAttribute("pathLength", "1");
    n.style.strokeDasharray = "1";
    n.style.strokeDashoffset = String(1 - clamp(k));
  });
}
const ringAt = (x, y, w, hgt, cls = "") => h(`<div class="ring ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px"></div>`);
function ring(el, t, at, until = Infinity) {
  const k = tw(t, at, at + 0.5) * (Number.isFinite(until) ? 1 - tw(t, until, until + 0.5) : 1);
  el.style.opacity = k;
  el.style.transform = `scale(${1 + (1 - k) * 0.06})`;
}

// ── data (recorded, real) ───────────────────────────────────────────────────
const run = await (await fetch("out/api-run.json")).json();
const mcpRun = await (await fetch("out/mcp-run.json")).json();
const rj = (id) => JSON.parse(mcpRun.calls.find((c) => c.id === id).text);
const eur = (n, d = 2) => "€" + Number(n).toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const S = (name) => `out/screens/${name}.png`;
const RATIO = 980 / 1100;

// ── icons (stroke style; drawn in on appearance) ────────────────────────────
const ICON = {
  cardSlash: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M4 21 20 3"/>',
  bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
  cloudUp: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/><path d="M12 17v-6m0 0-2.4 2.4M12 11l2.4 2.4"/>',
  lock: '<rect x="4.5" y="11" width="15" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="16" r="1.3"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/><path d="m14 4-4 16"/>',
  export: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  terminal: '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 10 3 2.5L7 15M12.5 15H17"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 16v2M12.5 11v7M17 7v11"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  arrow: '<path d="M4 12h15m-5-6 6 6-6 6"/>',
};
const svg = (inner, size, w = 1.7) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
/** A rounded tinted square holding an icon: the recurring visual motif. */
const sticker = (inner, size, tint, content = null) => `<div class="sticker" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.28)}px;background:hsl(${tint} / .14);border:2px solid hsl(${tint} / .6);box-shadow:0 0 ${Math.round(size * 0.4)}px hsl(${tint} / .28);color:hsl(${tint})">${content ?? svg(inner, Math.round(size * 0.56))}</div>`;
const CYAN = "188 57% 59%", GOLD = "32 83% 72%", RED = "0 84% 66%", GREEN = "152 60% 55%", INDIGO = "246 90% 74%";

// ── scene registry ──────────────────────────────────────────────────────────
const built = {};
const add = (id, nodes, update) => {
  const el = h(`<section class="scene" id="s-${id}"></section>`);
  nodes.forEach((n) => el.append(n));
  stage.append(el);
  built[id] = { el, update };
};
/** A framed real screenshot (label above the frame, bottom edge faded). */
const shot = (src, x, y, w, cap, { hgt, off = 0 } = {}) =>
  h(`<div class="shotwrap pop" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt ?? Math.round(w * RATIO)}px"><div class="shotlabel">${cap}</div><div class="shot"><img src="${src}" style="position:absolute;left:0;top:${-off}px;width:100%;height:auto"></div></div>`);
const shotRing = (sh, x, y, w, hgt, cls = "") => {
  const W = parseFloat(sh.style.width) / 1100;
  const off = -parseFloat(sh.querySelector("img").style.top);
  return ringAt(parseFloat(sh.style.left) + x * W, parseFloat(sh.style.top) + y * W - off, w * W, hgt * W, cls);
};
const brand = h(`<div class="brandmark"><img src="/repo/assets/brand/dark-icon.png"><span>Vaulted Money</span></div>`);

// ── 1 · hook ────────────────────────────────────────────────────────────────
{
  const title = h(`<div class="bigq" style="left:96px;top:250px;font-size:150px">Another<br>budget app?</div>`);
  const sub = h(`<div class="abs" style="left:100px;top:600px;font:500 46px var(--sans);color:var(--muted)"><span class="tx">You've tried the rest.</span></div>`);
  const pains = [
    [ICON.cardSlash, "Monthly fees"],
    [ICON.bank, "Your bank login"],
    [ICON.cloudUp, "Your data in their cloud"],
  ].map(([ic, label], i) => h(`<div class="pcard pop" style="left:1010px;top:${150 + i * 280}px;width:814px;height:236px;border-color:hsl(${RED} / .5);display:flex;align-items:center;gap:36px;padding:0 44px">
      ${sticker(ic, 150, RED)}<div class="word" style="font-size:50px;white-space:nowrap"><span class="tx">${label}</span></div>
      <div class="xbadge" style="position:absolute;right:26px;top:24px;width:50px;height:50px;border-radius:50%;background:hsl(${RED});color:#1b0505;display:grid;place-items:center"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round">${ICON.x}</svg></div></div>`));
  add("hook", [title, sub, ...pains], (t) => {
    appear(title, t, 0.3, { dur: 0.9 });
    appear(sub, t, 1.4);
    pains.forEach((p, i) => {
      const at = 2.2 + i * 0.7;
      appear(p, t, at, { dx: 60, dy: 0 });
      drawIn(p.querySelector(".sticker"), tw(t, at + 0.1, at + 0.9, (x) => x));
      pop(p.querySelector(".xbadge"), t, at + 0.9, 0.4);
    });
  });
}

// ── 2 · the promise: Free. Private. Open. Yours. ───────────────────────────
{
  const hd = h(`<div class="bigq" style="left:96px;top:110px;font-size:88px">Vaulted Money <em>does it differently.</em></div>`);
  const pillars = [
    { word: "Free", line: "No subscription. Every feature included.", tint: GOLD, inner: null, free: true },
    { word: "Private", line: "Lives on your device. No account.", tint: CYAN, inner: ICON.lock },
    { word: "Open", line: "Code anyone can read and audit.", tint: GREEN, inner: ICON.code },
    { word: "Yours", line: "Export everything, any time.", tint: INDIGO, inner: ICON.export },
  ];
  const cards = pillars.map((p, i) => {
    const content = p.free ? `<div style="font:800 76px/1 var(--sans);letter-spacing:-.04em">€0</div>` : null;
    return h(`<div class="pcard pop" style="left:${96 + i * 439}px;top:340px;width:410px;height:560px;border-color:hsl(${p.tint} / .5);padding:36px 30px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:26px">
      ${sticker(p.inner, 190, p.tint, content)}
      <div class="word ${p.free ? "gold" : ""}" style="color:${p.free ? "" : `hsl(${p.tint})`};font-size:68px"><span class="tx">${p.word}</span></div>
      <div class="line"><span class="tx">${p.line}</span></div></div>`);
  });
  add("promise", [hd, ...cards], (t) => {
    appear(hd, t, 0.2, { dur: 0.8 });
    cards.forEach((c, i) => {
      const at = 1.0 + i * 0.6;
      appear(c, t, at, { dy: 40 });
      const st = c.querySelector(".sticker");
      if (!pillars[i].free) drawIn(st, tw(t, at + 0.15, at + 0.9, (x) => x));
    });
  });
}

// ── 3 · "Where did my money go?" ────────────────────────────────────────────
{
  const sp = rj("q-spending");
  const q = h(`<div class="bigq" style="left:96px;top:140px">Where did<br>my money<br><em>go?</em></div>`);
  const top3 = sp.by_category.slice(0, 3);
  const rows = top3.map((c, i) => h(`<div class="pop" style="position:absolute;left:96px;top:${560 + i * 112}px;width:700px">
      <div style="display:flex;justify-content:space-between;font:700 32px var(--sans);margin-bottom:10px"><span class="tx">${c.category}</span><span style="color:var(--accent-soft)">${Math.round(c.share_pct)}%</span></div>
      <div style="height:26px;border-radius:13px;background:hsl(217 32% 14%);overflow:hidden"><i class="fill" data-w="${(c.share_pct / top3[0].share_pct) * 100}" style="display:block;height:100%;width:0;border-radius:13px;background:linear-gradient(90deg,hsl(183 51% 74%),hsl(199 54% 46%))"></i></div></div>`));
  const cap = h(`<div class="abs" style="left:96px;top:1000px;font:600 22px var(--sans);color:var(--muted)"><span class="tx">Answered from your own data, on your device.</span></div>`);
  const screen = shot(S("analytics"), 920, 250, 904, "Real screen · Analytics", { hgt: 700, off: 110 });
  add("where", [q, ...rows, cap, screen], (t) => {
    appear(q, t, 0.3, { dur: 0.9 });
    appear(screen, t, 1.0, { dx: 60, dy: 0 });
    rows.forEach((r, i) => {
      appear(r, t, 1.8 + i * 0.5);
      r.querySelector(".fill").style.width = (r.querySelector(".fill").dataset.w * tw(t, 2.0 + i * 0.5, 3.0 + i * 0.5)).toFixed(1) + "%";
    });
    appear(cap, t, 3.8);
  });
}

// ── 4 · "Am I over budget?" ─────────────────────────────────────────────────
{
  const bu = rj("q-budget");
  const food = bu.budgets[0];
  const pct = Math.round(bu.budget_health[0].percentUsed);
  const q = h(`<div class="bigq" style="left:96px;top:150px">Am I over<br><em>budget?</em></div>`);
  const big = h(`<div class="pop" style="position:absolute;left:96px;top:520px"><div class="gold" style="font:800 220px/1 var(--sans);letter-spacing:-.05em"><span class="tx">${pct}%</span></div><div style="font:600 36px var(--sans);margin-top:10px"><span class="tx">Food: ${eur(food.spent, 0)} of ${eur(food.target, 0)}</span></div><div style="font:500 28px var(--sans);color:var(--muted);margin-top:8px"><span class="tx">Spot it before the month ends.</span></div></div>`);
  const screen = shot(S("dashboard"), 920, 270, 904, "Real screen · Dashboard", { hgt: 540, off: 265 });
  const rg = shotRing(screen, 560, 345, 520, 235, "warn");
  add("budget", [q, big, screen, rg], (t) => {
    appear(q, t, 0.3, { dur: 0.9 });
    appear(screen, t, 1.0, { dx: 60, dy: 0 });
    ring(rg, t, 2.0);
    appear(big, t, 2.3, { dy: 30 });
  });
}

// ── 5 · "Got a messy bank file?" ────────────────────────────────────────────
{
  const rows = run.extra.statement.split("\n").slice(0, 4);
  const q = h(`<div class="bigq" style="left:96px;top:130px">Got a messy<br><em>bank file?</em></div>`);
  const csv = h(`<div class="pcard pop" style="left:96px;top:450px;width:760px;padding:24px 28px"><div style="display:flex;align-items:center;gap:10px;color:var(--muted);font:600 20px var(--sans);margin-bottom:12px"><span style="width:26px;height:26px;color:var(--accent)">${svg(ICON.file, 26)}</span><span class="tx">Your bank's file, as it comes</span></div><div style="font:500 20px/30px var(--mono);color:hsl(210 30% 85%);white-space:pre">${esc(rows.join("\n"))}</div></div>`);
  const arrow = h(`<div class="abs" style="left:868px;top:560px;color:var(--accent);width:90px;height:90px">${svg(ICON.arrow, 90, 2)}</div>`);
  const chips = ["No bank login", "No retyping"].map((txt, i) => h(`<span class="ftag pop" style="position:absolute;left:${96 + i * 330}px;top:800px;font-size:28px;padding:16px 26px"><span style="width:26px;height:26px">${svg(ICON.check, 26, 2.6)}</span><span class="tx">${txt}</span></span>`));
  const screen = shot(S("tx-mcp-imported"), 940, 280, 884, "Real screen · Transactions", { hgt: 515, off: 270 });
  add("file", [q, csv, arrow, ...chips, screen], (t) => {
    appear(q, t, 0.3, { dur: 0.9 });
    appear(csv, t, 1.0, { dy: 30 });
    appear(arrow, t, 2.4, { dx: -30, dy: 0 });
    appear(screen, t, 2.8, { dx: 60, dy: 0 });
    chips.forEach((c, i) => appear(c, t, 3.8 + i * 0.6, { dy: 20 }));
  });
}

// ── 6 · plug in your own tools (the API story) ──────────────────────────────
{
  const sp = rj("q-spending");
  const cat = (n) => sp.by_category.find((c) => c.category === n);
  const answer = `Mostly <b>Housing</b>: ${eur(cat("Housing").spent, 0)} (${Math.round(cat("Housing").share_pct)}%). Then <b>Food</b> ${eur(cat("Food").spent, 0)} and <b>Transport</b> ${eur(cat("Transport").spent, 0)}.`;
  const words = answer.match(/\S+\s*/g);
  const q = h(`<div class="bigq" style="left:96px;top:100px;font-size:84px">Want it smarter? <em>Plug in your own tools.</em></div>`);
  const chat = h(`<div class="chat pop" style="left:96px;top:330px;width:860px;height:560px"><div class="chat-bar"><span class="dot"></span><b>Your local AI</b><span class="chat-tag">Runs on your device</span></div>
    <div class="chat-body"><div class="chat-col"><div class="msg user" id="u" style="font-size:30px"></div>
    <div class="tool" id="tl" style="display:none"><div class="tool-head"><span>${svg(ICON.chart, 20)}</span><b>Spending summary</b><span class="state done">✓ done</span></div></div>
    <div class="msg bot" id="b" style="font-size:30px;display:none"></div></div></div></div>`);
  const uq = "Where is my money going?";
  const rowsData = [
    [ICON.chat, "Chat with a local AI", "Your questions, answered on your device"],
    [ICON.terminal, "Script it", "Automate the boring monthly bits"],
    [ICON.chart, "Build your own dashboard", "Your screens, your rules"],
  ];
  const rowsEls = rowsData.map(([ic, t1, t2], i) => h(`<div class="pop" style="position:absolute;left:1010px;top:${330 + i * 170}px;width:814px;display:flex;align-items:center;gap:26px">${sticker(ic, 112, i === 0 ? CYAN : i === 1 ? GREEN : INDIGO)}<div><div style="font:800 40px var(--sans);letter-spacing:-.02em;white-space:nowrap"><span class="tx">${t1}</span></div><div style="font:500 26px var(--sans);color:var(--muted);margin-top:6px;white-space:nowrap"><span class="tx">${t2}</span></div></div></div>`));
  const foot = h(`<div class="abs" style="left:1010px;top:860px;font:600 24px var(--sans);color:var(--muted)"><span class="tx">Optional. Made for tinkerers. Nothing leaves your device.</span></div>`);
  add("tinker", [q, chat, ...rowsEls, foot], (t) => {
    appear(q, t, 0.3, { dur: 0.9 });
    appear(chat, t, 0.9, { dy: 30 });
    const u = chat.querySelector("#u");
    u.style.opacity = tw(t, 1.4, 1.6);
    u.textContent = uq.slice(0, Math.max(0, Math.floor((t - 1.5) * 40)));
    u.style.display = t >= 1.4 ? "" : "none";
    const tl = chat.querySelector("#tl");
    tl.style.display = t >= 2.6 ? "" : "none";
    tl.style.opacity = tw(t, 2.6, 2.9);
    const b = chat.querySelector("#b");
    b.style.display = t >= 3.2 ? "" : "none";
    b.innerHTML = words.slice(0, Math.max(0, Math.floor((t - 3.2) * 16))).join("");
    rowsEls.forEach((r, i) => {
      const at = 2.8 + i * 0.6;
      appear(r, t, at, { dx: 40, dy: 0 });
      drawIn(r.querySelector(".sticker"), tw(t, at + 0.1, at + 0.8, (x) => x));
    });
    appear(foot, t, 5.0);
  });
}

// ── 7 · side by side ────────────────────────────────────────────────────────
{
  const hd = h(`<div class="bigq" style="left:96px;top:110px;font-size:92px">Not like <em>the others.</em></div>`);
  const colL = h(`<div class="abs" style="left:96px;top:300px;font:700 28px var(--sans);letter-spacing:.06em;color:var(--muted)"><span class="tx">Many budget apps</span></div>`);
  const colR = h(`<div class="abs" style="left:1000px;top:300px;font:800 28px var(--sans);letter-spacing:.06em" ><span class="tx glow">Vaulted Money</span></div>`);
  const pairs = [
    ["Monthly fee", "Free. No subscription.", true],
    ["Your data on their servers", "Your data on your device", false],
    ["Closed code you can't check", "Open code anyone can audit", false],
    ["Locked in", "Export everything, any time", false],
  ];
  const rows = pairs.map(([bad, good, gold], i) => {
    const y = 360 + i * 150;
    return h(`<div class="pop" style="position:absolute;left:0;top:${y}px;width:1920px;height:128px">
      <div class="pcard" style="left:96px;top:0;width:850px;height:128px;border-color:hsl(${RED} / .35);display:flex;align-items:center;gap:22px;padding:0 30px"><span style="color:hsl(${RED});width:38px;height:38px;flex:none">${svg(ICON.x, 38, 2.6)}</span><span style="font:600 36px var(--sans);color:hsl(210 20% 75%);white-space:nowrap"><span class="tx">${bad}</span></span></div>
      <div class="pcard" style="left:974px;top:0;width:850px;height:128px;border-color:hsl(${gold ? GOLD : CYAN} / .6);display:flex;align-items:center;gap:22px;padding:0 30px"><span style="color:hsl(${gold ? GOLD : CYAN});width:38px;height:38px;flex:none">${svg(ICON.check, 38, 2.8)}</span><span class="${gold ? "gold" : ""}" style="font:800 38px var(--sans);letter-spacing:-.02em;white-space:nowrap"><span class="tx">${good}</span></span></div></div>`);
  });
  add("switch", [hd, colL, colR, ...rows], (t) => {
    appear(hd, t, 0.2, { dur: 0.8 });
    appear(colL, t, 0.8); appear(colR, t, 0.8);
    rows.forEach((r, i) => appear(r, t, 1.3 + i * 0.7, { dy: 30 }));
  });
}

// ── 8 · the next step ───────────────────────────────────────────────────────
const qrSite = await (await fetch("out/qr-site.svg")).text();
{
  const logo = h(`<img src="/repo/assets/brand/dark-icon.png" class="abs" style="left:80px;top:60px;width:320px;height:320px;object-fit:contain">`);
  const word = (txt, cls, tint) => `<span style="color:${tint ? `hsl(${tint})` : "inherit"}" class="${cls}"><span class="tx">${txt}</span></span>`;
  const line = h(`<div class="abs" style="left:96px;top:380px;font:800 100px/1.05 var(--sans);letter-spacing:-.045em;white-space:nowrap">
    <span class="w" style="display:inline-block">${word("Free.", "gold")}</span> <span class="w" style="display:inline-block">${word("Private.", "", CYAN)}</span><br>
    <span class="w" style="display:inline-block">${word("Open.", "", GREEN)}</span> <span class="w" style="display:inline-block">${word("Yours.", "", INDIGO)}</span></div>`);
  const domain = h(`<div class="abs" style="left:100px;top:700px;font:500 60px var(--mono);color:var(--fg)"><span class="tx">vaulted.money</span></div>`);
  const fine = h(`<div class="abs" style="left:100px;top:880px;width:1100px;font:500 22px/1.45 var(--sans);color:var(--muted)"><span class="tx">Free to use and to build (MIT license). The app-store versions are an optional one-time purchase that supports development.</span></div>`);
  const qr = h(`<div class="abs pop" style="left:1360px;top:300px;width:420px;text-align:center"><div style="width:380px;height:380px;margin:0 auto;border-radius:22px;background:#fff;padding:12px;box-shadow:0 0 70px hsl(188 57% 59% / .3)"><div class="qr" style="width:100%;height:100%">${qrSite}</div></div><div style="font:800 34px var(--sans);margin-top:22px"><span class="tx">Get it free</span></div><div style="font:500 22px var(--sans);color:var(--muted);margin-top:4px"><span class="tx">Scan with your phone's camera</span></div></div>`);
  qr.querySelectorAll(".qr svg").forEach((s) => {
    const n = s.getAttribute("width");
    s.setAttribute("viewBox", `0 0 ${n} ${n}`);
    s.setAttribute("width", "100%");
    s.setAttribute("height", "100%");
    s.style.shapeRendering = "crispEdges";
  });
  const black = h(`<div class="abs" style="inset:0;background:#000;opacity:0"></div>`);
  add("cta", [logo, line, domain, qr, fine, black], (t) => {
    pop(logo, t, 0.2, 0.8);
    logo.style.filter = `drop-shadow(0 0 ${28 + 14 * Math.sin(t * 2)}px hsl(188 57% 59% / .45))`;
    line.querySelectorAll(".w").forEach((w, i) => appear(w, t, 0.9 + i * 0.45, { dy: 26, dur: 0.6 }));
    appear(domain, t, 3.2);
    appear(qr, t, 3.6, { dx: 50, dy: 0 });
    appear(fine, t, 4.6);
    black.style.opacity = tw(t, 8.8, 10, (x) => x);
  });
}

// ── frame function: dissolve with the wave ──────────────────────────────────
stage.append(brand);
window.__render = (t) => {
  stage.style.setProperty("--g", (0.5 + 0.5 * Math.sin(t * 1.8)).toFixed(3));
  for (const sc of SCENES) {
    const b = built[sc.id];
    const lt = t - sc.start;
    const first = sc.id === "hook";
    const last = sc.id === "cta";
    // As in the full film: the outgoing scene softens as the wave swells, the next resolves as it recedes.
    const inK = first ? 1 : tw(t, sc.start - 0.1, sc.start + 0.9, ease.inOut);
    const outK = last ? 1 : 1 - tw(t, sc.end - DISSOLVE, sc.end - 0.15, ease.inOut);
    const k = t < sc.start - 0.1 || (!last && t >= sc.end - 0.15) || t >= sc.end ? 0 : Math.min(inK, outK);
    b.el.style.opacity = k;
    b.el.style.visibility = k > 0.001 ? "visible" : "hidden";
    const softness = Math.max(1 - inK, 1 - outK);
    b.el.style.filter = softness > 0.001 ? `blur(${(softness * 9).toFixed(2)}px)` : "none";
    b.el.style.transform = softness > 0.001 ? `scale(${(1 + (1 - outK) * 0.018 - (1 - inK) * 0.014).toFixed(4)})` : "none";
    if (k > 0.001) b.update(lt);
  }
  // The small brand mark joins after the hook and leaves with the end card.
  brand.style.opacity = tw(t, 8.6, 9.6) * (1 - tw(t, 61, 61.6));
};

// QA helpers (used by qa-cards.mjs --cut short)
window.__checkFit = () => {
  const bad = [];
  document.querySelectorAll(".pop .tx, .pcard .tx").forEach((n) => {
    const box = (n.closest(".pop, .pcard") ?? n).getBoundingClientRect();
    const r = n.getBoundingClientRect();
    if (r.width > 0 && r.right > box.right + 1) bad.push(n.textContent.trim().slice(0, 50));
  });
  return [...new Set(bad)];
};
window.__checkCaps = () => {
  const bad = [];
  document.querySelectorAll(".tx, .bigq, .chat-bar b, .chat-tag").forEach((el) => {
    let hidden = false;
    for (let n = el; n && n.id !== "stage"; n = n.parentElement) if (getComputedStyle(n).visibility === "hidden") hidden = true;
    if (hidden) return;
    const text = el.textContent.trim();
    const first = text.match(/[A-Za-z]/)?.[0];
    if (first && first === first.toLowerCase() && !/^(https?:|vaulted\.money)/.test(text)) bad.push(text.slice(0, 40));
  });
  return [...new Set(bad)];
};
window.__snapshot = () => [...document.querySelectorAll(".pop")].map((el) => {
  let o = 1;
  for (let n = el; n && n.id !== "stage"; n = n.parentElement) {
    if (n.tagName === "SECTION") break;
    o *= parseFloat(getComputedStyle(n).opacity || "1");
  }
  return { o, label: el.className + " | " + el.textContent.replace(/\s+/g, " ").trim().slice(0, 36) };
});

await document.fonts.ready;
await Promise.all([...document.images].map((i) => (i.complete ? 0 : i.decode().catch(() => {}))));
window.__render(0);
window.__ready = true;

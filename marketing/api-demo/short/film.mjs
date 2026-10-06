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
const brand = h(`<div class="brandmark"><img src="/repo/assets/brand/dark-icon.png"><span>Vaulted Money <span style="color:var(--muted);font-weight:600">· Local API</span></span></div>`);

// ── 1 · hook ────────────────────────────────────────────────────────────────
{
  const title = h(`<div class="bigq" style="left:96px;top:150px;font-size:122px">Another<br>budget<br>app?</div>`);
  const sub = h(`<div class="abs" style="left:100px;top:600px;font:500 46px var(--sans);color:var(--muted)"><span class="tx">You've tried the rest.</span></div>`);
  const scope = h(`<div class="abs pop" style="left:100px;top:700px;display:flex;align-items:center;gap:16px;padding:14px 26px;border-radius:999px;border:1.5px solid hsl(${CYAN} / .6);background:hsl(${CYAN} / .1);font:700 30px var(--sans)"><span style="display:inline-block;width:32px;height:32px;color:hsl(${CYAN})">${svg(ICON.code, 32, 2.4)}</span><span class="tx">A Local API explainer</span></div>`);
  const pains = [
    [ICON.cardSlash, "Monthly fees"],
    [ICON.bank, "Your bank login"],
    [ICON.cloudUp, "Your data in their cloud"],
  ].map(([ic, label], i) => h(`<div class="pcard pop" style="left:1080px;top:${150 + i * 280}px;width:744px;height:236px;border-color:hsl(${RED} / .5);display:flex;align-items:center;gap:36px;padding:0 44px">
      ${sticker(ic, 150, RED)}<div class="word" style="font-size:44px;white-space:nowrap"><span class="tx">${label}</span></div>
      <div class="xbadge" style="position:absolute;right:26px;top:24px;width:50px;height:50px;border-radius:50%;background:hsl(${RED});color:#1b0505;display:grid;place-items:center"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round">${ICON.x}</svg></div></div>`));
  add("hook", [title, sub, scope, ...pains], (t) => {
    appear(title, t, 0.3, { dur: 0.9 });
    appear(sub, t, 1.4);
    appear(scope, t, 1.9);
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

// ── a small chat window (words stream in, tool steps read as plain actions) ─
function makeChat({ x, y, w, hgt, title, tag, items }) {
  const el = h(`<div class="chat pop" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px"><div class="chat-bar"><span class="dot"></span><b>${title}</b><span class="chat-tag">${tag}</span></div><div class="chat-body"><div class="chat-col"></div></div></div>`);
  const col = el.querySelector(".chat-col");
  const bodyH = hgt - 56 - 30;
  const nodes = items.map((it) => {
    let node;
    if (it.user !== undefined) node = h(`<div class="msg user" style="font-size:29px"></div>`);
    else if (it.step !== undefined) node = h(`<div class="tool" style="margin-bottom:12px"><div class="tool-head" style="font-family:var(--sans);font-size:21px"><span>${svg(it.icon ?? ICON.chart, 20)}</span><b style="font-family:var(--sans)">${it.step}</b><span class="state"></span></div></div>`);
    else {
      node = h(`<div class="msg bot" style="font-size:29px"></div>`);
      // Split into words (never inside a tag) so the answer can stream.
      it.words = [];
      let word = "", inTag = false;
      for (const ch of it.bot) {
        word += ch;
        if (ch === "<") inTag = true;
        else if (ch === ">") inTag = false;
        else if (!inTag && /\s/.test(ch)) { it.words.push(word); word = ""; }
      }
      if (word) it.words.push(word);
    }
    col.append(node);
    return { it, node };
  });
  return {
    el,
    update(t) {
      for (const { it, node } of nodes) {
        node.style.display = t >= it.at ? "" : "none";
        node.style.opacity = t >= it.at ? tw(t, it.at, it.at + 0.25) : 0;
        if (t < it.at) continue;
        const dt = t - it.at;
        if (it.user !== undefined) node.textContent = it.user.slice(0, Math.floor(dt * 60) + 1);
        else if (it.step !== undefined) {
          const st = node.querySelector(".state");
          st.textContent = dt < 0.5 ? "Checking…" : "✓ Done";
          st.className = "state " + (dt < 0.5 ? "run" : "done");
        } else node.innerHTML = it.words.slice(0, Math.floor(dt * 17) + 1).join("");
      }
      col.style.transform = `translateY(${-Math.max(0, col.offsetHeight - bodyH)}px)`;
    },
  };
}
const note = (txt, x, y) => h(`<div class="abs pop" style="left:${x}px;top:${y}px;font:500 22px var(--sans);color:var(--muted)"><span class="tx">${txt}</span></div>`);

// ── 3 · "Have a chat with your finances." (the pitch, early) ────────────────
{
  const cs = rj("q-cs-this"), cl = rj("q-cs-last");
  const thisSum = Math.abs(cs.sum_of_shown), lastSum = Math.abs(cl.sum_of_shown);
  const cut = Math.round((1 - thisSum / lastSum) * 100);
  const hd = h(`<div class="bigq" style="left:96px;top:80px;font-size:92px">Have a chat with<br>your <em>finances.</em></div>`);
  const sub = h(`<div class="abs" style="left:100px;top:300px;font:500 36px var(--sans);color:var(--muted)"><span class="tx">Ask in plain words. It answers from your own numbers.</span></div>`);
  const chat = makeChat({
    x: 96, y: 400, w: 900, hgt: 590, title: "Your finances", tag: "Runs on your device",
    items: [
      { at: 1.8, user: "Have I cut back at the corner store compared with last month?" },
      { at: 3.2, step: "Checked this month", icon: ICON.chart },
      { at: 3.7, step: "Checked last month", icon: ICON.chart },
      { at: 4.5, bot: `Yes. At <b>Corner Market</b> you spent <b>${eur(thisSum)}</b> this month (${cs.total_matches} visits) against ${eur(lastSum)} last month (${cl.total_matches} visits): <b class="good">down ${cut}%</b>.` },
    ],
  });
  const screen = shot(S("tx-corner"), 1040, 380, 784, "The receipts, in the app", { hgt: 480, off: 235 });
  const badge = h(`<div class="pop" style="position:absolute;left:1360px;top:300px;padding:14px 28px;border-radius:20px;background:hsl(222 84% 5%);border:2px solid hsl(${GOLD} / .7);box-shadow:0 0 50px hsl(${GOLD} / .25)"><span class="gold" style="font:800 74px/1 var(--sans);letter-spacing:-.04em"><span class="tx">−${cut}%</span></span><span style="font:600 24px var(--sans);margin-left:14px"><span class="tx">Corner Market</span></span></div>`);
  const foot = note("Needs the desktop app running. Everything stays on your device.", 100, 1020);
  add("chat1", [hd, sub, chat.el, screen, badge, foot], (t) => {
    appear(hd, t, 0.3, { dur: 0.9 });
    appear(sub, t, 1.0);
    appear(chat.el, t, 1.3, { dy: 30 });
    chat.update(t);
    appear(screen, t, 4.7, { dx: 60, dy: 0 });
    pop(badge, t, 6.0, 0.6);
    appear(foot, t, 6.4);
  });
}

// ── 4 · "Ask things a menu can't." (advice) ─────────────────────────────────
{
  const a = rj("q-sum-last"), b = rj("q-sum-this"), bud = rj("q-budget").budgets[0];
  const val = (r, n) => r.by_category.find((c) => c.category === n)?.spent ?? 0;
  // Next month: Travel is planned at last month's trip cost; Food at its budget; Housing as it was.
  const rowsData = [
    { n: "Travel", aug: val(a, "Travel"), sep: val(b, "Travel"), next: Math.ceil(val(a, "Travel") / 10) * 10, hot: true },
    { n: "Food", aug: val(a, "Food"), sep: val(b, "Food"), next: bud.target },
    { n: "Housing", aug: val(a, "Housing"), sep: val(b, "Housing"), next: val(a, "Housing") },
  ];
  const travel = rowsData[0], food = rowsData[1];
  const hd = h(`<div class="bigq" style="left:96px;top:100px;font-size:96px">Ask things <em>a menu can't.</em></div>`);
  const sub = h(`<div class="abs" style="left:100px;top:245px;font:500 36px var(--sans);color:var(--muted)"><span class="tx">Even when you don't name a category.</span></div>`);
  const chat = makeChat({
    x: 96, y: 330, w: 860, hgt: 660, title: "Your finances", tag: "Runs on your device",
    items: [
      { at: 0.5, user: "I travelled last month and I'm off again next month. What should I watch?" },
      { at: 2.0, step: "Checked last month", icon: ICON.chart },
      { at: 2.5, step: "Checked your budgets", icon: ICON.chart },
      { at: 3.2, bot: `Last month's trip put <b class="bad">Travel</b> at ${eur(travel.aug, 0)}, and Food ran to ${eur(food.aug, 0)} against your ${eur(bud.target, 0)} budget. Plan about <b>${eur(travel.next, 0)}</b> for Travel and keep Food near ${eur(bud.target, 0)}.` },
    ],
  });
  const head = (txt, i) => `<span style="grid-column:${i}" class="hd"><span class="tx">${txt}</span></span>`;
  const table = h(`<div class="pcard pop" style="left:1000px;top:330px;width:824px;height:660px;padding:30px 36px">
    <div style="font:800 38px var(--sans);letter-spacing:-.02em"><span class="tx">Next month, watch these</span></div>
    <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;row-gap:12px;margin-top:26px;font:600 22px var(--sans);color:var(--muted);letter-spacing:.04em">${["Category", "Aug", "Sep", "Plan"].map((c, i) => `<span style="text-align:${i ? "right" : "left"}"><span class="tx">${c}</span></span>`).join("")}</div>
    ${rowsData.map((r) => `<div class="pop trow" style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;align-items:center;margin-top:14px;padding:16px 14px;border-radius:14px;${r.hot ? `background:hsl(${GOLD} / .12);border:1px solid hsl(${GOLD} / .5)` : "background:hsl(217 32% 11%);border:1px solid var(--border)"};font:700 32px var(--sans)"><span class="tx">${r.n}</span><span style="text-align:right;color:var(--muted)"><span class="tx">${eur(r.aug, 0)}</span></span><span style="text-align:right;color:var(--muted)"><span class="tx">${eur(r.sep, 0)}</span></span><span style="text-align:right" class="${r.hot ? "gold" : ""}"><span class="tx">${eur(r.next, 0)}</span></span></div>`).join("")}
    <div style="font:500 21px var(--sans);color:var(--muted);margin-top:26px"><span class="tx">Based on last month's trip and your budgets.</span></div></div>`);
  const trows = table.querySelectorAll(".trow");
  const foot = note("Assistant wording is illustrative. The numbers are your own.", 100, 1020);
  add("chat2", [hd, sub, chat.el, table, foot], (t) => {
    appear(hd, t, 0.2, { dur: 0.8 });
    appear(sub, t, 0.6);
    appear(chat.el, t, 0.3, { dy: 30 });
    chat.update(t);
    appear(table, t, 3.6, { dx: 50, dy: 0 });
    trows.forEach((r, i) => appear(r, t, 4.4 + i * 0.5, { dy: 16, dur: 0.5 }));
    appear(foot, t, 4.4);
  });
}

// ── 6 · build your own screens ──────────────────────────────────────────────
{
  const cs = rj("q-cs-this"), cl = rj("q-cs-last");
  const thisSum = Math.abs(cs.sum_of_shown), lastSum = Math.abs(cl.sum_of_shown);
  const cut = Math.round((1 - thisSum / lastSum) * 100);
  const sp = rj("q-spending"), bud = rj("q-budget").budgets[0];
  const top3 = sp.by_category.slice(0, 3);
  const food = sp.by_category.find((c) => c.category === "Food");
  const hd = h(`<div class="bigq" style="left:96px;top:100px;font-size:96px">Not stuck with <em>our layout.</em></div>`);
  const sub = h(`<div class="abs" style="left:100px;top:245px;font:500 36px var(--sans);color:var(--muted)"><span class="tx">Build the screen you wish your budget app had.</span></div>`);
  const app = shot(S("dashboard"), 96, 420, 640, "The app's own dashboard", { hgt: 460, off: 150 });
  const arrow = h(`<div class="abs" style="left:752px;top:610px;color:hsl(${GOLD});width:84px;height:84px">${svg(ICON.arrow, 84, 2)}</div>`);
  const mini = (label, inner, w, h2, x, y) => `<div class="pop gcard" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h2}px;border-radius:18px;background:hsl(222 84% 5% / .8);border:1px solid hsl(${GOLD} / .35);padding:18px 22px"><div style="font:700 18px var(--sans);letter-spacing:.08em;color:var(--muted)"><span class="tx">${label}</span></div>${inner}</div>`;
  const bar = (frac, tint) => `<div style="height:20px;border-radius:10px;background:hsl(217 32% 14%);overflow:hidden"><i style="display:block;height:100%;width:${Math.min(100, frac * 100).toFixed(1)}%;border-radius:10px;background:linear-gradient(90deg,hsl(${tint}),hsl(${tint} / .6))"></i></div>`;
  const windowEl = h(`<div class="pop" style="position:absolute;left:880px;top:380px;width:944px;height:600px;border-radius:26px;background:linear-gradient(160deg,hsl(222 45% 11%),hsl(236 40% 8%));border:2px solid hsl(${GOLD} / .55);box-shadow:0 0 90px hsl(${GOLD} / .14),0 40px 100px #000b">
    <div style="position:absolute;left:30px;top:22px;right:30px;display:flex;justify-content:space-between;align-items:baseline"><b style="font:800 34px var(--sans);letter-spacing:-.02em"><span class="tx">My money, my way</span></b><span style="font:600 18px var(--sans);color:var(--muted)"><span class="tx">Built on the API</span></span></div>
    ${mini("Corner Market", `<div class="gold" style="font:800 92px/1 var(--sans);letter-spacing:-.04em;margin-top:8px"><span class="tx">−${cut}%</span></div><div style="margin-top:12px;font:600 20px var(--sans);display:grid;gap:8px"><div><span class="tx">Last month ${eur(lastSum, 0)}</span>${bar(1, "32 83% 72%")}</div><div><span class="tx">This month ${eur(thisSum, 0)}</span>${bar(thisSum / lastSum, "188 57% 59%")}</div></div>`, 410, 270, 30, 90)}
    ${mini("Food budget", `<div style="font:800 56px/1 var(--sans);letter-spacing:-.03em;margin-top:12px"><span class="tx">${eur(food.spent, 0)}</span><span style="font:600 26px var(--sans);color:var(--muted)"> of ${eur(bud.target, 0)}</span></div><div style="margin-top:20px">${bar(1, "0 84% 66%")}</div><div style="margin-top:12px;font:600 22px var(--sans);color:hsl(0 84% 70%)"><span class="tx">Over by ${eur(food.spent - bud.target, 0)}. Time to adjust.</span></div>`, 410, 270, 504, 90)}
    ${mini("Biggest costs", `<div style="display:grid;gap:12px;margin-top:12px;font:600 22px var(--sans)">${top3.map((c) => `<div style="display:grid;grid-template-columns:130px 1fr 56px;align-items:center;gap:14px"><span class="tx">${c.category}</span>${bar(c.share_pct / top3[0].share_pct, "188 57% 59%")}<span style="text-align:right;color:var(--muted)"><span class="tx">${Math.round(c.share_pct)}%</span></span></div>`).join("")}</div>`, 884, 190, 30, 380)}
  </div>`);
  const gcards = windowEl.querySelectorAll(".gcard");
  const foot = note("Needs the desktop app running. Your screens, your rules.", 100, 1020);
  add("gui", [hd, sub, app, arrow, windowEl, foot], (t) => {
    appear(hd, t, 0.2, { dur: 0.8 });
    appear(sub, t, 0.6);
    appear(app, t, 1.0, { dx: -40, dy: 0 });
    appear(arrow, t, 1.9, { dx: -20, dy: 0 });
    appear(windowEl, t, 2.3, { dy: 36 });
    gcards.forEach((c, i) => appear(c, t, 2.9 + i * 0.6, { dy: 20, dur: 0.5 }));
    appear(foot, t, 4.4);
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
  // Both logo variants side by side, centred over the words below (block centre x = 396).
  const logo = h(`<div class="abs" style="left:96px;top:90px;width:600px;display:flex;justify-content:center;gap:36px"><div style="width:240px;height:240px;border-radius:44px;overflow:hidden;position:relative;background:hsl(222 47% 9%);border:1.5px solid hsl(188 57% 59% / .35)"><img src="/repo/assets/brand/dark-icon.png" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;height:520px;max-width:none;object-fit:contain"></div><div style="width:240px;height:240px;border-radius:44px;overflow:hidden;position:relative;background:#f4f1ea;"><img src="/repo/assets/brand/light-icon.png" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;height:520px;max-width:none;object-fit:contain"></div></div>`);
  const word = (txt, cls, tint) => `<span style="color:${tint ? `hsl(${tint})` : "inherit"}" class="${cls}"><span class="tx">${txt}</span></span>`;
  const line = h(`<div class="abs" style="left:96px;width:600px;text-align:center;top:380px;font:800 100px/1.05 var(--sans);letter-spacing:-.045em;white-space:nowrap">
    <span class="w" style="display:inline-block">${word("Free.", "gold")}</span> <span class="w" style="display:inline-block">${word("Private.", "", CYAN)}</span><br>
    <span class="w" style="display:inline-block">${word("Open.", "", GREEN)}</span> <span class="w" style="display:inline-block">${word("Yours.", "", INDIGO)}</span></div>`);
  const domain = h(`<div class="abs" style="left:96px;width:600px;text-align:center;top:700px;font:500 60px var(--mono);color:var(--fg)"><span class="tx">vaulted.money</span></div>`);
  const qr = h(`<div class="abs pop" style="left:1360px;top:300px;width:420px;text-align:center"><div style="width:380px;height:380px;margin:0 auto;border-radius:22px;background:#fff;padding:12px;box-shadow:0 0 70px hsl(188 57% 59% / .3)"><div class="qr" style="width:100%;height:100%">${qrSite}</div></div><div style="font:800 34px var(--sans);margin-top:22px"><span class="tx">Try it free</span></div><div style="font:500 22px var(--sans);color:var(--muted);margin-top:4px"><span class="tx">Scan with your phone's camera</span></div></div>`);
  qr.querySelectorAll(".qr svg").forEach((s) => {
    const n = s.getAttribute("width");
    s.setAttribute("viewBox", `0 0 ${n} ${n}`);
    s.setAttribute("width", "100%");
    s.setAttribute("height", "100%");
    s.style.shapeRendering = "crispEdges";
  });
  const black = h(`<div class="abs" style="inset:0;background:#000;opacity:0"></div>`);
  add("cta", [logo, line, domain, qr, black], (t) => {
    pop(logo, t, 0.2, 0.8);
    logo.style.filter = `drop-shadow(0 0 ${28 + 14 * Math.sin(t * 2)}px hsl(188 57% 59% / .45))`;
    line.querySelectorAll(".w").forEach((w, i) => appear(w, t, 0.9 + i * 0.45, { dy: 26, dur: 0.6 }));
    appear(domain, t, 3.2);
    appear(qr, t, 3.6, { dx: 50, dy: 0 });
    black.style.opacity = tw(t, 7.3, 8.5, (x) => x);
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
  brand.style.opacity = tw(t, 8.6, 9.6) * (1 - tw(t, 66.5, 67.1));
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

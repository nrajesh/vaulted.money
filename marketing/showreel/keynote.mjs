/**
 * The keynote cut, "from mess to clarity": money worries drift down in the
 * grey, other apps only look back (and sell what they see), then the logo
 * lands and the mess snaps into neat rows. Each chapter after that asks a
 * question a careful person asks and answers it: the idea moves first, the
 * real app is the proof. A finale cuts through the app's screens on the
 * beat. Every card lands on a note of the tune (timelines/keynote.mjs
 * MOMENTS), and every word comes from its COPY.
 *
 * Every frame is a pure function of time: `window.__render(seconds)` poses all
 * layers for that instant, so render.mjs (--cut keynote) can draw frames in
 * any order on any number of browsers. Screens are the store-screenshot
 * captures (marketing/store-screenshots/out/captures, copied to out/keynote)
 * and, for the finale, the social cut's captures (out/screens).
 * `?web` adds "Free & open source" to the end card (website version).
 */
import {
  BUDGETS,
  CHAPTERS,
  CHAT,
  COPY,
  DURATION,
  HANDOVER,
  MOMENTS,
  MONTAGE,
  UPCOMING,
  chapter,
} from "./timelines/keynote.mjs";
import { ease, lerp, progress, tween } from "./lib/motion.mjs";
import { logoSvg } from "./lib/logo.mjs";

const params = new URLSearchParams(location.search);
const WEB = params.has("web");
const stage = document.getElementById("stage");
const images = [];

// ── Building blocks ─────────────────────────────────────────────────────────
const el = (markup) => {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
};
const set = (node, props) => {
  for (const [k, v] of Object.entries(props)) {
    const text = String(v);
    if (node.style[k] !== text) node.style[k] = text;
  }
};
const src = (name) => `out/keynote/${name}.png`;

/**
 * The status bar, drawn at the size the real one has on that device: the
 * screenshot is shrunk to fit the frame, so the bar shrinks by the same
 * amount (iPhone: 17 pt text in a 54 pt bar on a 440 pt screen; iPad: 13 pt
 * text in a 24 pt bar on a 1032 pt screen).
 */
const STATUS_BARS = {
  phone: { screen: 440, text: 17 },
  tablet: { screen: 1032, text: 13 },
};
const statusBar = (theme, kind, frameWidth) => {
  const bar = STATUS_BARS[kind];
  const padding = kind === "tablet" ? 16 : 12;
  const scale = (frameWidth - 2 * padding) / bar.screen;
  return `<div class="sb ${theme} ${kind}" style="font-size:${(bar.text * scale).toFixed(2)}px"><span>9:41</span><span><b>5G</b><span class="bat"><i></i></span></span></div>`;
};

/** Capture notes (crop, spotlight box) by image name, loaded at boot. */
const NOTES = {};

/**
 * A device frame with a captured screen. kind: phone | tablet | duo | laptop.
 * `recorded`: the screen shows a simulator recording (the Duo always, the
 * big iPad), which carries the real status bar, so none is drawn.
 */
function device(
  name,
  theme,
  kind = "phone",
  width = 380,
  { recorded = kind === "duo" } = {},
) {
  const screen = `<div class="screen">${kind === "laptop" ? '<div class="titlebar"><i></i><i></i><i></i></div>' : recorded ? "" : statusBar(theme, kind, width)}<img src="${src(name)}" alt=""><div class="spot"></div></div>`;
  const node =
    kind === "laptop"
      ? el(
          `<div class="laptop window ${theme}"><div class="lid">${screen}</div><div class="base"></div></div>`,
        )
      : el(
          `<div class="device ${theme} ${kind === "tablet" ? "tablet" : ""}">${screen}</div>`,
        );
  node.dataset.name = name;
  set(node, { width: `${width}px` });
  images.push(node.querySelector("img"));
  return node;
}

/** Headline words as spans (accent words in *asterisks*), plus sub and body. */
function caption({ headline, sub, answer, body, theme, centre = false }) {
  const words = [];
  let accent = false;
  for (const raw of headline.split(" ")) {
    const opens = raw.startsWith("*");
    const word = raw.replace(/\*/g, "");
    if (opens) accent = true;
    words.push(
      `<span class="word">${accent ? `<em class="serif">${word}</em>` : word}</span>`,
    );
    if (raw.endsWith("*")) accent = false;
  }
  return el(`<div class="cap ${centre ? "centre" : ""} on-${theme}">
    <h1>${words.join(" ")}</h1>
    ${sub ? `<div class="sub">${sub}</div>` : ""}
    ${answer ? `<div class="sub answer"><em class="serif">${answer}</em></div>` : ""}
    ${body ? `<p>${body}</p>` : ""}
  </div>`);
}

/**
 * Springs from 0 to 1 with an overshoot, first reaching 1 at `at` (outBack
 * crosses 1 at 1 / (overshoot + 1) of its length), so a card lands on the
 * beat its sound plays on.
 */
function popIn(t, at, length = 0.4, overshoot = 2) {
  const start = at - length / (overshoot + 1);
  return ease.outBack(progress(t, start, start + length), overshoot);
}
/** Fades in over the short run-up to `at`. */
const appear = (t, at, lead = 0.18) => progress(t, at - lead, at - 0.02);

/**
 * Headline words spring up one after another from `at`, the sub and body pop
 * in at theirs, and the words lift away just before `end`.
 */
function poseCaption(node, t, { at, sub, body, end }) {
  [...node.querySelectorAll(".word")].forEach((w, i) => {
    const land = at + i * 0.05;
    const p = popIn(t, land, 0.5, 1.4);
    const gone = tween(
      t,
      end - 0.5 + i * 0.025,
      end - 0.2 + i * 0.025,
      ease.inCubic,
    );
    set(w, {
      opacity: appear(t, land) * (1 - gone),
      transform: `translateY(${(1 - p) * 70 - gone * 40}px) rotate(${(1 - p) * 6}deg)`,
    });
  });
  const out = 1 - tween(t, end - 0.5, end, ease.inCubic);
  for (const [part, when] of [
    [node.querySelector(".sub"), sub],
    [node.querySelector(".answer"), sub],
    [node.querySelector("p"), body],
  ]) {
    if (!part) continue;
    const p = popIn(t, when, 0.4, 1.6);
    set(part, {
      opacity: appear(t, when) * out,
      transform: `translateY(${(1 - p) * 28}px) scale(${0.94 + 0.06 * p})`,
    });
  }
  set(node, {
    visibility: t >= at - 0.3 && t <= end ? "visible" : "hidden",
  });
}

/** A device springs up into place, landing on `land`, and drops away by `end`. */
function poseDevice(
  node,
  t,
  land,
  end,
  { x, y, rotate = 0, rotateY = 0, still = false },
) {
  const p = popIn(t, land, 0.6, 1.2);
  const outP = tween(t, end - 0.5, end, ease.inBack);
  // Once landed, it keeps drifting gently towards you, so nothing sits still.
  // A device playing a recording holds still: duo/overlay.mjs pastes the
  // footage at a fixed place.
  const drift = still ? 0 : Math.max(0, t - land);
  set(node, {
    left: `${x}px`,
    top: `${y + (1 - p) * 160 + outP * 120 - drift * 6}px`,
    opacity: appear(t, land, 0.25) * (1 - Math.max(0, outP)),
    transform: `perspective(1600px) rotateY(${rotateY * (1 - 0.04 * drift)}deg) rotate(${rotate * (1 - p)}deg) scale(${(0.9 + 0.1 * p) * (1 + 0.008 * drift)})`,
    visibility: t >= land - 0.3 && t <= end ? "visible" : "hidden",
  });
}

/** A chip, label or badge pops in at `at`; `base` keeps its own transform. */
function popCard(node, t, at, until, base = "") {
  const p = popIn(t, at, 0.4, 2.2);
  set(node, {
    opacity: appear(t, at, 0.12) * (1 - tween(t, until - 0.5, until)),
    transform: `${base} translateY(${(1 - p) * 18}px) scale(${0.6 + 0.4 * p})`,
  });
}

/**
 * Spotlight: at `at`, dims the screen around the part to look at (the box
 * the capture recorded) and snaps a brand-teal ring onto it; gone by `until`.
 */
function spotlight(node, t, at, until) {
  const box = NOTES[node.dataset.name]?.highlight;
  const spot = node.querySelector(".spot");
  if (!box) return;
  const img = node.querySelector("img");
  const pad = 6;
  const p = popIn(t, at, 0.35, 2);
  set(spot, {
    left: `${img.offsetLeft + box.x * img.offsetWidth - pad}px`,
    top: `${img.offsetTop + box.y * img.offsetHeight - pad}px`,
    width: `${box.w * img.offsetWidth + pad * 2}px`,
    height: `${box.h * img.offsetHeight + pad * 2}px`,
    opacity: appear(t, at, 0.12) * (1 - tween(t, until - 0.5, until)),
    transform: `scale(${1.25 - 0.25 * p})`,
  });
}

// ── Layers ──────────────────────────────────────────────────────────────────
const bgDark = el('<div class="layer bg-dark"></div>');
const bgLight = el('<div class="layer bg-light"></div>');
const bgGrey = el('<div class="layer bg-grey"></div>');
const drizzle = el('<div class="layer drizzle"></div>');
stage.append(bgDark, bgLight, bgGrey, drizzle);

const C = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
const LIGHT = new Set(["search", "ahead", "bigScreens", "end"]);
const money = (value, sign = false) =>
  `${sign ? (value < 0 ? "−" : "+") : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pill = (text, extra = "") =>
  el(`<div class="pill ${extra}">${text}</div>`);

// ── Worry: the mess drifts in, one stray note at a time ──
const worryCap = caption({ ...COPY.worry, theme: "grey" });
/** [kind, markup, x, y, tilt]: invented, brand-free worries. */
const WORRY_ITEMS = [
  ["note", "<i></i>Payment due tomorrow", 720, 130, -3],
  ["number", "−42.18", 1380, 230, 4],
  [
    "statement",
    "<h6>STATEMENT · NOVEMBER</h6><div><span>Groceries</span><span>−86.40</span></div><div><span>Card payment</span><span>−23.40</span></div><div><span>Fuel</span><span>−61.75</span></div>",
    880,
    560,
    -4,
  ],
  ["note", "<i></i>Low balance", 1500, 600, 3],
  ["number", "−1,280.00", 210, 800, -2],
  ["csv", "03/11, CARD PAYMENT, −23.40", 150, 120, 0],
  ["note", "<i></i>Subscription renewed", 1240, 880, -4],
  ["sticky", "pay back Sam 40?<br>fuel 61.75??", 1620, 110, 7],
  ["number", "−9.99", 780, 380, 5],
  ["note", "<i></i>Where did 340 go?", 600, 910, 2],
  ["csv", "04/11, TRANSFER, −500.00", 1180, 420, 0],
  ["number", "−312.60", 1560, 790, -5],
  ["note", "<i></i>Fee charged", 300, 650, -3],
];
const worries = WORRY_ITEMS.map(([kind, html]) =>
  el(`<div class="worry ${kind}">${html}</div>`),
);
stage.append(...worries, worryCap);

// ── Rear-view: other apps only look back, and some sell what they see ──
const rearCap = caption({ ...COPY.rearview, theme: "grey" });
const PAST = [
  ["Last March", "−1,940.20"],
  ["February", "−2,115.75"],
  ["January", "−2,480.10"],
  ["December", "−3,002.45"],
  ["November", "−2,210.00"],
  ["October", "−1,875.60"],
  ["September", "−2,044.30"],
];
const mirror = el(
  `<div class="mirror"><div class="glass"><div class="past">${PAST.map(
    ([month, amount]) =>
      `<div><span>${month}</span><span>${amount}</span></div>`,
  ).join("")}</div></div></div>`,
);
const sold = el('<div class="sold">SOLD</div>');
stage.append(mirror, rearCap, sold);

// ── The turn: the logo lands and the mess snaps into neat rows ──
// Each logo on the theme it was drawn for: the silver mark on dark.
const turnLockup = el(
  `<div class="turn-lockup"><div class="marks"><span class="mark dark">${logoSvg("turn", "dark")}</span></div><h2>Vaulted <em>Money</em></h2><p class="serif">${COPY.turn.tagline}</p></div>`,
);
const ROWS = [
  ["Groceries", "#86efac", "Food", "−86.40"],
  ["Card payment", "#7dd3fc", "Bills", "−23.40"],
  ["Fuel", "#fcd34d", "Transport", "−61.75"],
  ["Subscription", "#c4b5fd", "Bills", "−9.99"],
  ["Transfer to savings", "#86efac", "Savings", "−500.00"],
  ["Rent", "#fda4af", "Home", "−1,280.00"],
  ["Insurance", "#7dd3fc", "Bills", "−42.18"],
  ["Salary", "#5eead4", "Income", "+3,200.00"],
];
const ledger = el('<div class="ledger"></div>');
const rows = ROWS.map(([name, colour, tag, amount]) =>
  el(
    `<div class="row"><span class="dot" style="background:${colour}"></span>${name}<span class="tag" style="background:${colour}">${tag}</span><span class="amt">${amount}</span></div>`,
  ),
);
ledger.append(...rows);
stage.append(ledger, turnLockup);

// ── Privacy: a shield closes round your devices ──
const privacyCap = caption({ ...COPY.privacy, theme: "dark" });
const privacyL = device("iphone-dark-1", "dark", "phone", 300);
const privacyR = device("iphone-light-1", "light", "phone", 300);
const SHIELD_POINTS = "1210,120 1560,300 1560,760 1210,960 860,760 860,300";
const shield = el(
  `<svg class="shield layer" viewBox="0 0 1920 1080"><polygon points="${SHIELD_POINTS}" pathLength="1"/></svg>`,
);
const privacyChips = COPY.privacy.chips.map((text) => pill(text, "on-dark"));
stage.append(shield, privacyL, privacyR, privacyCap, ...privacyChips);

// ── Search: ask in plain words, watch them become filters ──
const searchCap = caption({ ...COPY.search, theme: "light" });
const searchPhone = device("iphone-dark-2", "dark", "phone", 380);
const query = el(
  `<div class="query"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span class="typed"></span><i class="caret"></i></div>`,
);
const searchChips = COPY.search.chips.map((text) => pill(text, "filter"));
stage.append(searchPhone, query, ...searchChips, searchCap);

// ── Budgets: meters fill up, one tips over and warns you ──
const budgetsCap = caption({ ...COPY.budgets, theme: "dark" });
const meters = el(
  `<div class="meters">${BUDGETS.map(
    ({ name, target }) =>
      `<div class="meter"><div class="top"><b>${name}</b><span><i class="spent">0.00</i> of ${money(target)}</span></div><div class="track"><div class="fill"></div></div></div>`,
  ).join("")}</div>`,
);
const over = BUDGETS.find((b) => b.spent > b.target);
const warning = pill(
  `Heads-up: ${over.name} is ${money(over.spent - over.target)} over`,
  "warning",
);
const budgetsPhone = device("iphone-light-5", "light", "phone", 300);
stage.append(budgetsPhone, meters, warning, budgetsCap);

// ── What's coming up: the road ahead, with the next bills and payday ──
const aheadCap = caption({ ...COPY.ahead, theme: "light" });
const road = el(`<svg class="road" viewBox="0 0 800 640" fill="none">
  <path class="edge" d="M120 640 L372 40" />
  <path class="edge" d="M680 640 L428 40" />
  <path class="lane" d="M400 640 L400 40" />
</svg>`);
const upcoming = UPCOMING.map(({ name, days, amount }) =>
  el(
    `<div class="upcoming ${amount < 0 ? "out" : "in"}"><div><b>${name}</b><span>in ${days} days</span></div><span class="amt">${money(amount, true)}</span></div>`,
  ),
);
const net = UPCOMING.reduce((sum, u) => sum + u.amount, 0);
const forecast = el(
  `<div class="forecast"><span>After these three</span><b>+0.00</b></div>`,
);
stage.append(road, ...upcoming, forecast, aheadCap);

// ── Want a hand: one switch, then a local model reads your ledger ──
const aiCap = caption({ ...COPY.ai, theme: "dark" });
const aiSwitch = el(
  '<div class="switch"><span class="label-text">AI</span><span class="track"><i></i></span></div>',
);
// The month as the chat reads it: Housing from the demo's Charts screen, the
// rest from the budgets chapter.
const spend = [
  ["Housing", 1380],
  ...BUDGETS.map(({ name, spent }) => [name, spent]),
];
const flexible = BUDGETS.reduce((a, b) => (b.spent > a.spent ? b : a));
const chat = el(`<div class="chat">
  <div class="head"><span class="live"></span>${CHAT.model}<span class="tag">MCP · vaulted-money</span></div>
  <div class="bubble me">${CHAT.prompt}</div>
  ${CHAT.tools.map((tool) => `<div class="tool"><span class="gear">⚙</span>${tool}<span class="ok">✓</span></div>`).join("")}
  <div class="answer"><table>${spend.map(([name, value]) => `<tr><td>${name}</td><td>${money(value)}</td></tr>`).join("")}</table>
  <p>Most flexible: <b>${flexible.name}</b>, ${money(flexible.spent)}. Suggested budget: <b>${money(flexible.target).replace(".00", "")} a month</b>.</p></div>
</div>`);
stage.append(aiSwitch, chat, aiCap);

// ── Build it: the local API from a terminal, and a screen of your own ──
const openCap = caption({ ...COPY.open, theme: "dark" });
const COMMAND =
  'curl -H "Authorization: Bearer $VM_TOKEN" \\\n    "$VM/ledgers/$ID/search/interpret?q=groceries+over+20"';
const REPLY = [
  '{ "filters": {',
  '    "categories": ["Groceries"],',
  '    "min_amount": 20,',
  '    "combine": "all" } }',
];
const terminal = el(
  `<div class="terminal"><div class="bar"><i></i><i></i><i></i><span>zsh</span></div><pre><span class="ps">$</span> <span class="cmd"></span>${REPLY.map((line) => `\n<span class="out">${line}</span>`).join("")}</pre></div>`,
);
const budgeted = BUDGETS.reduce((sum, b) => sum + b.target, 0);
const used = BUDGETS.reduce((sum, b) => sum + b.spent, 0);
const widget = el(`<div class="widget">
  <div class="hint">Your own screen · on the local API</div>
  <h4>This month</h4>
  <div class="big"><span class="count">0.00</span> <small>of ${money(budgeted)} budgeted</small></div>
  <div class="bar"><i></i></div>
  <ul>${BUDGETS.map(({ name, spent }) => `<li><span>${name}</span><span>${money(spent)}</span></li>`).join("")}</ul>
</div>`);
stage.append(terminal, widget, openCap);

// ── Big screens: iPad, then iPhone Duo, each playing its recording ──
const bigCap = caption({ ...COPY.bigScreens, theme: "light" });
const ipad = device("ipad-dark-6", "dark", "tablet", 560, { recorded: true });
ipad.dataset.recording = "ipad";
const duo = device("duoInner-dark-6", "dark", "duo", 860);
duo.dataset.recording = "duo";
const ipadLabel = el('<div class="label on-light-label">iPad</div>');
const duoLabel = el('<div class="label on-light-label">iPhone Duo</div>');
stage.append(ipad, duo, bigCap, ipadLabel, duoLabel);

// ── Every device ──
const devicesCap = caption({ ...COPY.devices, theme: "dark", centre: true });
// Smallest screen to largest; the Apple devices sit together.
const row = [
  ["android-dark-3", "dark", "phone", 190, "Android", 30, 450],
  ["iphone-light-1", "light", "phone", 190, "iPhone", 250, 450],
  ["duoInner-dark-6", "dark", "duo", 340, "iPhone Duo", 470, 560],
  ["ipad-light-2", "light", "tablet", 330, "iPad", 850, 420],
  ["mac-dark-6", "dark", "laptop", 620, "Mac · Windows · Linux", 1220, 460],
].map(([name, theme, kind, width, label, x, y]) => ({
  node: device(name, theme, kind, width),
  label,
  x,
  y,
}));
row[2].node.dataset.recording = "duo";
const labels = row.map((r) => el(`<div class="label">${r.label}</div>`));
stage.append(...row.map((r) => r.node), ...labels, devicesCap);

// ── The finale: one screen after another, on the beat ──
const montage = el(
  `<div class="laptop window dark montage"><div class="lid"><div class="screen"><div class="titlebar"><i></i><i></i><i></i></div><div class="cuts">${MONTAGE.map(
    ([name]) => `<img src="out/screens/${name}.png" alt="">`,
  ).join(
    "",
  )}<div class="flash"></div></div></div></div><div class="base"></div></div>`,
);
const cuts = [...montage.querySelectorAll(".cuts img")];
images.push(...cuts);
const cutLabel = pill("", "cut");
stage.append(montage, cutLabel);

// ── End card: the navy-and-gold mark on the light page ──
const end = el(`<div class="lockup on-light-end">
  <div class="marks"><span class="mark light">${logoSvg("end", "light")}</span></div>
  <h2>Vaulted <em>Money</em></h2>
  <p>${COPY.end.tagline}</p>
  ${WEB ? `<div class="extra">${COPY.end.extra.replace("&", "&amp;")}</div>` : ""}
  <div class="badges">${COPY.end.badges.map((b) => `<span>${b}</span>`).join("")}</div>
</div>`);
const black = el('<div id="black"></div>');
stage.append(end, black);

// ── Render ──────────────────────────────────────────────────────────────────
function render(seconds) {
  const t = Math.min(Math.max(seconds, 0), DURATION - 1e-4);
  const M = Object.fromEntries(
    Object.entries(MOMENTS).map(([name, m]) => [name, m.t]),
  );

  // Page colour: grey for the worries, then dark or light per chapter, with
  // a soft crossfade.
  const lightness = CHAPTERS.reduce((acc, c) => {
    if (!LIGHT.has(c.id)) return acc;
    return Math.max(
      acc,
      tween(t, c.start - 0.4, c.start + 0.4) *
        (1 - tween(t, c.end - 0.4, c.end + 0.4)),
    );
  }, 0);
  set(bgLight, { opacity: lightness });
  {
    const grey =
      1 - tween(t, C.turn.start, C.turn.start + 1.4, ease.inOutCubic);
    set(bgGrey, { opacity: grey });
    set(drizzle, {
      opacity:
        grey * (1 - 0.5 * tween(t, C.rearview.start, C.rearview.start + 1)),
      backgroundPosition: `${-t * 40}px ${t * 520}px`,
    });
  }

  // Worries: each pops in on its stray note and drifts down; behind the
  // mirror they dim, and at the turn each one becomes a tidy row.
  {
    poseCaption(worryCap, t, { at: M.worryHeadline, end: C.worry.end - 0.1 });
    const dim = 1 - 0.75 * tween(t, C.rearview.start, C.rearview.start + 0.8);
    worries.forEach((node, i) => {
      const [, , x, y, tilt] = WORRY_ITEMS[i];
      const at0 = M[`worry${i}`];
      const p = popIn(t, at0, 0.5, 1.4);
      const drift = Math.max(0, t - at0);
      const rowAt = M[`turnRow${i}`];
      const handed =
        rowAt === undefined
          ? tween(t, C.turn.start, C.turn.start + 0.6)
          : progress(t, rowAt - 0.15, rowAt);
      set(node, {
        left: `${x}px`,
        top: `${y + drift * 14}px`,
        opacity: appear(t, at0, 0.15) * dim * (1 - handed),
        transform: `rotate(${tilt + drift * 0.6}deg) scale(${0.85 + 0.15 * p})`,
        filter: `blur(${(1 - dim) * 3}px)`,
        visibility:
          t >= at0 - 0.2 && t < C.turn.start + 3 ? "visible" : "hidden",
      });
    });
  }

  // Rear-view: the past scrolls away in the mirror; SOLD slams onto it.
  {
    const { start, end: stop } = C.rearview;
    poseCaption(rearCap, t, {
      at: M.rearviewHeadline,
      sub: M.rearviewSub,
      end: stop - 0.1,
    });
    const p = popIn(t, M.rearviewHeadline, 0.7, 1.1);
    const out = tween(t, stop - 0.4, stop, ease.inCubic);
    set(mirror, {
      opacity: appear(t, M.rearviewHeadline, 0.3) * (1 - out),
      transform: `perspective(1400px) rotateY(-10deg) translateY(${(1 - p) * 120}px) scale(${0.92 + 0.08 * p})`,
      visibility: t >= start - 0.3 && t <= stop ? "visible" : "hidden",
    });
    set(mirror.querySelector(".past"), { top: `${-20 - (t - start) * 40}px` });
    const s = popIn(t, M.rearviewSold, 0.35, 1.4);
    set(sold, {
      left: "1220px",
      top: "380px",
      opacity: appear(t, M.rearviewSold, 0.08) * (1 - out),
      transform: `rotate(-9deg) scale(${2.2 - 1.2 * s})`,
      visibility: t >= M.rearviewSold - 0.2 && t <= stop ? "visible" : "hidden",
    });
  }

  // The turn: the mark lands, each worry flies to its row on the beat, then
  // the name and the tagline.
  {
    const { start, end: stop } = C.turn;
    const out = tween(t, stop - 0.4, stop, ease.inCubic);
    set(turnLockup, {
      opacity: 1 - out,
      visibility: t >= start - 0.2 && t <= stop ? "visible" : "hidden",
    });
    const mark = turnLockup.querySelector(".mark");
    const logo = popIn(t, M.turnLogo, 0.7, 1.4);
    set(mark, {
      opacity: appear(t, M.turnLogo, 0.2),
      transform: `scale(${0.5 + 0.5 * logo}) rotate(${(1 - logo) * -20}deg)`,
    });
    popCard(turnLockup.querySelector("h2"), t, M.turnName, stop + 1);
    popCard(turnLockup.querySelector("p"), t, M.turnTagline, stop + 1);
    rows.forEach((row, i) => {
      const at0 = M[`turnRow${i}`];
      const [, , wx, wy] = WORRY_ITEMS[i];
      const p = tween(t, at0 - 0.25, at0, ease.outCubic);
      const settle = popIn(t, at0, 0.3, 2);
      const fromX = wx - 960;
      const fromY = wy + Math.max(0, at0 - M[`worry${i}`]) * 14 - 300;
      set(row, {
        top: "0px",
        opacity: progress(t, at0 - 0.25, at0 - 0.15) * (1 - out),
        transform: `translate(${lerp(fromX, 0, p)}px, ${lerp(fromY, i * 68, p)}px) scale(${0.96 + 0.04 * settle})`,
        visibility: t >= at0 - 0.25 && t <= stop ? "visible" : "hidden",
      });
    });
  }

  // Privacy: the answer, the phones, then a shield draws itself round them
  // and the three promises pop in.
  {
    const { end: stop } = C.privacy;
    poseCaption(privacyCap, t, {
      at: M.privacyHeadline,
      sub: M.privacyAnswer,
      body: M.privacyBody,
      end: stop,
    });
    poseDevice(privacyL, t, M.privacyLeft, stop, {
      x: 900,
      y: 250,
      rotateY: 22,
      rotate: -6,
    });
    poseDevice(privacyR, t, M.privacyRight, stop, {
      x: 1220,
      y: 250,
      rotateY: -22,
      rotate: 6,
    });
    const draw = tween(t, M.privacyShield - 0.45, M.privacyShield + 0.1);
    const out = tween(t, stop - 0.5, stop);
    set(shield, {
      opacity: (draw > 0 ? 1 : 0) * (1 - out),
      visibility:
        t >= M.privacyShield - 0.5 && t <= stop ? "visible" : "hidden",
    });
    set(shield.querySelector("polygon"), {
      strokeDashoffset: `${1 - draw}`,
      // A slow pulse once it has closed.
      strokeWidth: `${6 + 3 * Math.max(0, Math.sin((t - M.privacyShield) * 5)) * (draw >= 1 ? 1 : 0)}`,
    });
    placeChips(
      privacyChips,
      t,
      [0, 1, 2].map((i) => M[`privacyChip${i}`]),
      stop,
      privacyCap,
    );
  }

  // Search: the words type themselves into a search box, then fly out of it
  // as the three filters they were understood as; the phone proves it.
  {
    const { start, end: stop } = C.search;
    poseCaption(searchCap, t, {
      at: M.searchHeadline,
      body: M.searchBody,
      end: stop,
    });
    poseDevice(searchPhone, t, M.searchPhone, stop, { x: 1280, y: 160 });
    spotlight(searchPhone, t, M.searchSpot, stop - 0.3);
    const typedTo = Math.round(
      COPY.search.query.length *
        tween(t, M.searchQuery, M.searchQuery + 1.0, ease.linear),
    );
    const typed = query.querySelector(".typed");
    const text = COPY.search.query.slice(0, typedTo);
    if (typed.textContent !== text) typed.textContent = text;
    const qp = popIn(t, M.searchQuery - 0.1, 0.4, 1.8);
    set(query, {
      left: "640px",
      top: "640px",
      opacity:
        appear(t, M.searchQuery - 0.1, 0.15) * (1 - tween(t, stop - 0.5, stop)),
      transform: `scale(${0.85 + 0.15 * qp})`,
      visibility: t >= start && t <= stop ? "visible" : "hidden",
    });
    set(query.querySelector(".caret"), {
      opacity: Math.floor(t * 4) % 2 ? 0 : 1,
    });
    searchChips.forEach((chip, i) => {
      const at0 = M[`searchChip${i}`];
      const p = tween(t, at0 - 0.25, at0, ease.outCubic);
      const settle = popIn(t, at0, 0.35, 2);
      const target = { x: 190 + i * 260, y: 760 };
      const from = { x: 700 + i * 120, y: 660 };
      set(chip, {
        left: `${lerp(from.x, target.x, p)}px`,
        top: `${lerp(from.y, target.y, p) - Math.sin(Math.PI * p) * 120}px`,
        opacity:
          progress(t, at0 - 0.25, at0 - 0.15) *
          (1 - tween(t, stop - 0.5, stop)),
        transform: `scale(${0.8 + 0.2 * settle})`,
        visibility: t >= at0 - 0.3 && t <= stop ? "visible" : "hidden",
      });
    });
  }

  // Budgets: three meters fill and count up on the beat; Dining out tips
  // over the line and the heads-up pops.
  {
    const { start, end: stop } = C.budgets;
    poseCaption(budgetsCap, t, {
      at: M.budgetsHeadline,
      body: M.budgetsBody,
      end: stop,
    });
    poseDevice(budgetsPhone, t, M.budgetsPhone, stop, {
      x: 1560,
      y: 230,
      rotateY: -14,
    });
    const out = tween(t, stop - 0.5, stop);
    const mp = popIn(t, M.budgetsMeters, 0.5, 1.5);
    set(meters, {
      left: "940px",
      top: "300px",
      opacity: appear(t, M.budgetsMeters, 0.2) * (1 - out),
      transform: `translateY(${(1 - mp) * 60}px)`,
      visibility: t >= start && t <= stop ? "visible" : "hidden",
    });
    [...meters.querySelectorAll(".meter")].forEach((meter, i) => {
      const { spent, target } = BUDGETS[i];
      const fill = tween(
        t,
        M[`budgetsMeter${i}`] - 0.1,
        M[`budgetsMeter${i}`] + 0.7,
        ease.outCubic,
      );
      const share = (spent / target) * fill;
      set(meter.querySelector(".fill"), {
        width: `${Math.min(1, share) * 100}%`,
        background:
          share > 1
            ? "hsl(0 72% 55%)"
            : share > 0.8
              ? "hsl(38 90% 55%)"
              : "hsl(152 55% 45%)",
      });
      const label = meter.querySelector(".spent");
      const value = money(spent * fill);
      if (label.textContent !== value) label.textContent = value;
      meter.classList.toggle("over", share > 1);
    });
    const shake =
      Math.sin((t - M.budgetsWarning) * 40) *
      Math.exp(-(t - M.budgetsWarning) * 6) *
      (t > M.budgetsWarning ? 8 : 0);
    set(warning, {
      left: `${940 + shake}px`,
      top: "660px",
      visibility:
        t >= M.budgetsWarning - 0.2 && t <= stop ? "visible" : "hidden",
    });
    popCard(warning, t, M.budgetsWarning, stop);
  }

  // What's coming up: the road draws itself and the next three ride towards
  // you on it; what's left after them counts up.
  {
    const { start, end: stop } = C.ahead;
    poseCaption(aheadCap, t, {
      at: M.aheadHeadline,
      body: M.aheadBody,
      end: stop,
    });
    const out = tween(t, stop - 0.5, stop, ease.inCubic);
    const draw = tween(t, M.aheadRoad - 0.4, M.aheadRoad + 0.5, ease.outCubic);
    set(road, {
      opacity: appear(t, M.aheadRoad, 0.3) * (1 - out),
      visibility: t >= start && t <= stop ? "visible" : "hidden",
    });
    road
      .querySelectorAll("path")
      .forEach((path) =>
        set(path, { strokeDashoffset: `${(1 - draw) * 640}` }),
      );
    // The lane markings stream towards you.
    set(road.querySelector(".lane"), {
      strokeDashoffset: `${(1 - draw) * 640 - (t - start) * 120}`,
    });
    const SLOTS = [
      { x: 1000, y: 790, scale: 1 },
      { x: 1070, y: 600, scale: 0.86 },
      { x: 1120, y: 445, scale: 0.74 },
    ];
    upcoming.forEach((card, i) => {
      const at0 = M[`aheadItem${i}`];
      const p = popIn(t, at0, 0.45, 1.8);
      const travel = Math.max(0, t - at0) * 14;
      const { x, y, scale } = SLOTS[i];
      set(card, {
        left: `${x}px`,
        top: `${y + (1 - p) * 40 + travel}px`,
        opacity: appear(t, at0, 0.12) * (1 - out),
        transform: `scale(${(scale + travel / 900) * (0.7 + 0.3 * p)})`,
        visibility: t >= at0 - 0.2 && t <= stop ? "visible" : "hidden",
      });
    });
    const counted =
      net * tween(t, M.aheadForecast, M.aheadForecast + 0.8, ease.outCubic);
    const label = forecast.querySelector("b");
    const value = money(counted, true);
    if (label.textContent !== value) label.textContent = value;
    const glow = t >= M.aheadSettled ? Math.exp(-(t - M.aheadSettled) * 3) : 0;
    set(forecast, {
      left: "1420px",
      top: "230px",
      boxShadow: `0 0 0 ${4 * glow}px hsl(27 72% 62% / ${glow}), 0 24px 60px rgba(15, 23, 42, 0.3)`,
      visibility:
        t >= M.aheadForecast - 0.2 && t <= stop ? "visible" : "hidden",
    });
    popCard(forecast, t, M.aheadForecast, stop);
  }

  // Want a hand: the switch flips on; a local model takes the question,
  // calls the app's agent tools one by one and answers from your ledger.
  {
    const { start, end: stop } = C.ai;
    poseCaption(aiCap, t, { at: M.aiHeadline, body: M.aiBody, end: stop });
    const on = tween(t, M.aiSwitch - 0.15, M.aiSwitch + 0.05, ease.outCubic);
    set(aiSwitch, {
      left: "190px",
      top: "720px",
      visibility: t >= start && t <= stop ? "visible" : "hidden",
    });
    popCard(aiSwitch, t, M.aiSwitch - 0.3, stop);
    set(aiSwitch.querySelector(".track"), {
      background: on > 0.5 ? "hsl(183 51% 54%)" : "#3a4556",
    });
    set(aiSwitch.querySelector("i"), { transform: `translateX(${on * 56}px)` });
    poseDevice(chat, t, M.aiChat, stop, { x: 900, y: 110, rotateY: -6 });
    chat.querySelectorAll(".tool").forEach((tool, i) => {
      const at0 = M[`aiTool${i}`];
      set(tool, { display: t >= at0 - 0.3 ? "flex" : "none" });
      popCard(tool, t, at0, stop + 1);
      set(tool.querySelector(".ok"), { opacity: t >= at0 + 0.25 ? 1 : 0 });
    });
    const answer = chat.querySelector(".answer");
    set(answer, { display: t >= M.aiAnswer - 0.3 ? "block" : "none" });
    popCard(answer, t, M.aiAnswer, stop + 1);
  }

  // Build it: the command types, the reply prints line by line; then a
  // screen someone built on the API counts up the month.
  {
    const { end: stop } = C.open;
    poseCaption(openCap, t, {
      at: M.openHeadline,
      sub: M.openAnswer,
      body: M.openBody,
      end: stop,
    });
    poseDevice(terminal, t, M.openTerminal, stop, {
      x: 940,
      y: 150,
      rotateY: -8,
    });
    poseDevice(widget, t, M.openWidget, stop, {
      x: 1280,
      y: 520,
      rotateY: -8,
      rotate: 4,
    });
    const cmd = terminal.querySelector(".cmd");
    const shown = COMMAND.slice(
      0,
      Math.round(
        COMMAND.length *
          tween(t, M.openTerminal, M.openReply - 0.15, ease.linear),
      ),
    );
    if (cmd.textContent !== shown) cmd.textContent = shown;
    terminal
      .querySelectorAll(".out")
      .forEach((line, i) =>
        set(line, { opacity: t >= M.openReply + i * 0.08 ? 1 : 0 }),
      );
    const fill = tween(t, M.openWidget, M.openWidget + 0.9, ease.outCubic);
    const count = widget.querySelector(".count");
    const value = money(used * fill);
    if (count.textContent !== value) count.textContent = value;
    set(widget.querySelector(".bar i"), {
      width: `${(used / budgeted) * fill * 100}%`,
    });
  }

  // Big screens: iPad, then the iPhone Duo, each playing its simulator
  // recording once still (duo/overlay.mjs).
  {
    const { start, end: stop } = C.bigScreens;
    poseCaption(bigCap, t, { at: M.bigHeadline, body: M.bigBody, end: stop });
    const handover = start + HANDOVER;
    poseDevice(ipad, t, M.bigIpad, handover + 0.5, {
      x: 1100,
      y: 140,
      still: true,
    });
    showRecordingEnd(ipad, t >= handover);
    showRecordingEnd(duo, t >= stop - 0.7);
    poseDevice(duo, t, M.bigDuo, stop, { x: 960, y: 300, still: true });
    const labelFor = (label, node, at0, until) => {
      set(label, {
        left: `${node.offsetLeft + node.offsetWidth / 2}px`,
        top: `${node.offsetTop + node.offsetHeight + 22}px`,
      });
      popCard(label, t, at0, until, "translateX(-50%)");
    };
    labelFor(ipadLabel, ipad, M.bigIpad, handover + 0.3);
    labelFor(duoLabel, duo, M.bigDuoLabel, stop);
  }

  // Every device: five spring into a row on the eighths, each named.
  {
    const { end: stop } = C.devices;
    poseCaption(devicesCap, t, { at: M.devicesRow0, end: stop });
    row.forEach((r, i) => {
      poseDevice(r.node, t, M[`devicesRow${i}`], stop, { x: r.x, y: r.y });
      set(labels[i], {
        left: `${r.x + r.node.offsetWidth / 2}px`,
        top: `${Math.min(r.y + r.node.offsetHeight + 24, 1010)}px`,
      });
      popCard(labels[i], t, M[`devicesRow${i}`], stop, "translateX(-50%)");
    });
  }

  // The finale: a window swings in and cuts through the app's screens on
  // the beat, each punching in with a flash and its name.
  {
    const { start, end: stop } = C.montage;
    const times = MONTAGE.map((_, i) => M[`montageCut${i}`]);
    poseDevice(montage, t, times[0], stop + 0.2, {
      x: 300,
      y: 110,
      rotateY: 6 - 12 * progress(t, start, stop),
    });
    let current = 0;
    times.forEach((at0, i) => {
      if (t >= at0 - 0.05) current = i;
    });
    const frame = montage.querySelector(".cuts");
    cuts.forEach((img, i) => {
      const since = t - times[i];
      // Tall captures look further down, so the data under a chart shows.
      const overflow = Math.max(0, img.offsetHeight - frame.offsetHeight);
      set(img, { top: `${-overflow * MONTAGE[i][2]}px` });
      const punch =
        1 +
        0.12 * Math.exp(-Math.max(0, since) * 7) +
        0.02 * Math.max(0, since);
      set(img, {
        opacity: i === current ? 1 : 0,
        transform: `scale(${punch})`,
      });
    });
    set(montage.querySelector(".flash"), {
      opacity: 0.5 * Math.exp(-Math.max(0, t - times[current]) * 10),
    });
    const name = MONTAGE[current][1];
    if (cutLabel.textContent !== name) cutLabel.textContent = name;
    set(cutLabel, {
      left: "340px",
      top: "900px",
      visibility: t >= times[0] - 0.1 && t <= stop ? "visible" : "hidden",
    });
    popCard(cutLabel, t, times[current], stop);
  }

  // End card: the mark lands with the impact, then the name, the tagline and
  // the badges pop in one by one; then a fade to black.
  {
    const { start, end: stop } = C.end;
    set(end, { visibility: t >= start - 0.3 ? "visible" : "hidden" });
    const q = popIn(t, M.endLogo, 0.6, 1.6);
    set(end.querySelector(".mark"), {
      opacity: appear(t, M.endLogo, 0.3),
      transform: `scale(${0.6 + 0.4 * q})`,
    });
    popCard(end.querySelector("h2"), t, M.endName, stop + 1);
    popCard(end.querySelector("p"), t, M.endTagline, stop + 1);
    const extra = end.querySelector(".extra");
    if (extra) popCard(extra, t, M.endExtra, stop + 1);
    end
      .querySelectorAll(".badges span")
      .forEach((badge, i) => popCard(badge, t, M[`endBadge${i}`], stop + 1));
    set(black, { opacity: tween(t, stop - 1.0, stop, ease.inCubic) });
  }
}

/** Lays chips in a row under a caption, each popping in at its moment. */
function placeChips(chips, t, times, until, cap) {
  let x = cap.offsetLeft;
  const y = cap.offsetTop + cap.offsetHeight + 40;
  chips.forEach((chip, i) => {
    set(chip, {
      left: `${x}px`,
      top: `${y}px`,
      visibility: t >= times[i] - 0.2 && t <= until ? "visible" : "hidden",
    });
    popCard(chip, t, times[i], until);
    x += chip.offsetWidth + 16;
  });
}

/** Swaps a recorded screen between its recording's first and last frame. */
const RECORDING_FRAMES = {};
function showRecordingEnd(node, ended) {
  const frames = RECORDING_FRAMES[node.dataset.recording];
  if (!frames) return;
  const img = node.querySelector("img");
  const want = ended ? frames.last : frames.first;
  if (img.getAttribute("src") !== want) img.setAttribute("src", want);
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot() {
  // A recorded screen shows its recording's first frame (render.mjs extracts
  // it), so the hand-over to the footage does not jump.
  for (const name of ["ipad", "duo"]) {
    const first = `out/keynote/${name}-first.png`;
    if (!(await fetch(first, { method: "HEAD" })).ok) continue;
    const last = `out/keynote/${name}-last.png`;
    RECORDING_FRAMES[name] = {
      first,
      last: (await fetch(last, { method: "HEAD" })).ok ? last : first,
    };
    // Decoded now, so swapping to it mid-render shows at once.
    const preload = new Image();
    preload.src = RECORDING_FRAMES[name].last;
    await preload.decode();
    for (const node of document.querySelectorAll(
      `[data-recording="${name}"] img`,
    ))
      node.src = first;
  }
  await Promise.all(
    images.map(async (img) => {
      const name = img.getAttribute("src").replace(/^.*\/|\.png$/g, "");
      const res = await fetch(`out/keynote/${name}.json`);
      if (res.ok) NOTES[name] = await res.json();
    }),
  );
  await Promise.all(images.map((img) => img.decode()));
  await document.fonts.ready;
  window.__render = render;
  render(0);
  window.__showreelReady = true;
}

boot().catch((error) => {
  window.__showreelError = String(error?.stack ?? error);
  console.error(error);
});

export { chapter, progress };

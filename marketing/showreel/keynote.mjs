/**
 * The keynote cut: a calm, 76-second tour in the store screenshots' look.
 *
 * Every frame is a pure function of time: `window.__render(seconds)` poses all
 * layers for that instant, so render.mjs (--cut keynote) can draw frames in
 * any order on any number of browsers. Screens are the store-screenshot
 * captures (marketing/store-screenshots/out/captures, copied to out/keynote).
 * `?web` adds "Free & open source" to the end card (website version).
 */
import { CHAPTERS, DURATION, chapter } from "./timelines/keynote.mjs";
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

const statusBar = (theme) =>
  `<div class="sb ${theme}"><span>9:41</span><span><b>5G</b><span class="bat"><i></i></span></span></div>`;

/** A device frame with a captured screen. kind: phone | tablet | window | duo */
function device(name, theme, kind = "phone", width = 380) {
  const node = el(`<div class="device ${theme} ${kind === "phone" || kind === "duo" ? "" : kind}">
    ${kind === "window" ? '<div class="titlebar"><i></i><i></i><i></i></div>' : ""}
    <div class="screen">${kind === "window" ? "" : statusBar(theme)}<img src="${src(name)}" alt="">${kind === "duo" ? '<div class="hinge"></div>' : ""}<div class="over"></div></div>
  </div>`);
  set(node, { width: `${width}px` });
  images.push(node.querySelector("img"));
  return node;
}

/** Headline words as spans (accent words in *asterisks*), plus sub and body. */
function caption({ headline, sub, body, theme, centre = false }) {
  const words = [];
  let accent = false;
  for (const raw of headline.split(" ")) {
    const opens = raw.startsWith("*");
    const word = raw.replace(/\*/g, "");
    if (opens) accent = true;
    words.push(
      `<span class="word">${accent ? `<em>${word}</em>` : word}</span>`,
    );
    if (raw.endsWith("*")) accent = false;
  }
  return el(`<div class="cap ${centre ? "centre" : ""} on-${theme}">
    <h1>${words.join(" ")}</h1>
    ${sub ? `<div class="sub">${sub}</div>` : ""}
    ${body ? `<p>${body}</p>` : ""}
  </div>`);
}

/** Words rise in from `start`, sub and body follow; all fade by `end`. */
function poseCaption(node, t, start, end, { subAt = 1.6, bodyAt = 2.2 } = {}) {
  const out = 1 - tween(t, end - 0.6, end, ease.inCubic);
  [...node.querySelectorAll(".word")].forEach((w, i) => {
    const p = tween(t, start + i * 0.07, start + i * 0.07 + 0.7, ease.outCubic);
    set(w, { opacity: p * out, transform: `translateY(${(1 - p) * 46}px)` });
  });
  const sub = node.querySelector(".sub");
  if (sub) {
    const p = tween(t, start + subAt, start + subAt + 0.6);
    set(sub, { opacity: p * out, transform: `translateY(${(1 - p) * 24}px)` });
  }
  const body = node.querySelector("p");
  if (body) {
    const p = tween(t, start + bodyAt, start + bodyAt + 0.6);
    set(body, { opacity: p * out, transform: `translateY(${(1 - p) * 24}px)` });
  }
  set(node, { visibility: t >= start - 0.1 && t <= end ? "visible" : "hidden" });
}

/** A device glides up into place, holds, and sinks away. */
function poseDevice(node, t, start, end, { x, y, rotate = 0, rotateY = 0, delay = 0.3 }) {
  const inP = tween(t, start + delay, start + delay + 1.1, ease.outQuart);
  const outP = tween(t, end - 0.7, end, ease.inCubic);
  set(node, {
    left: `${x}px`,
    top: `${y + (1 - inP) * 140 + outP * 80}px`,
    opacity: inP * (1 - outP),
    transform: `perspective(1600px) rotateY(${rotateY}deg) rotate(${rotate * (1 - inP)}deg)`,
    visibility: t >= start && t <= end ? "visible" : "hidden",
  });
}

/** Slow push into a point of the screen (fractions of the image) from `at`. */
function zoom(node, t, at, length, { scale = 1.6, fx = 0.5, fy = 0.5 }) {
  const p = tween(t, at, at + length, ease.inOutCubic);
  const s = lerp(1, scale, p);
  set(node.querySelector("img"), {
    transformOrigin: `${fx * 100}% ${fy * 100}%`,
    transform: `scale(${s})`,
  });
}

// ── Layers ──────────────────────────────────────────────────────────────────
const bgDark = el('<div class="layer bg-dark"></div>');
const bgLight = el('<div class="layer bg-light"></div>');
stage.append(bgDark, bgLight);

const C = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
const LIGHT = new Set(["search", "ai", "bigScreens"]);

// Intro
const intro = el(`<div class="lockup">${logoSvg("intro", "dark")}<h2>Vaulted <em>Money</em></h2></div>`);
stage.append(intro);

// Privacy: face-off pair
const privacyCap = caption({
  headline: "Your money *never leaves* your device.",
  sub: "Unless you switch AI on.",
  body: "No sign-up. No cloud.",
  theme: "dark",
});
const privacyL = device("iphone-dark-1", "dark", "phone", 330);
const privacyR = device("iphone-light-1", "light", "phone", 330);
stage.append(privacyL, privacyR, privacyCap);

// Search
const searchCap = caption({
  headline: "Ask it like *you'd say it.*",
  body: "“Groceries over 20 last month”, understood right on your phone.",
  theme: "light",
});
const searchPhone = device("iphone-dark-2", "dark", "phone", 400);
stage.append(searchPhone, searchCap);

// Labels: dark then a light sweep
const labelsCap = caption({
  headline: "Your money. Your labels. *Your rules.*",
  body: "Own and manage every account, payee, budget & category.",
  theme: "dark",
});
const labelsDark = device("iphone-dark-3", "dark", "phone", 400);
const labelsLight = device("iphone-light-3", "light", "phone", 400);
stage.append(labelsDark, labelsLight, labelsCap);

// AI
const aiCap = caption({
  headline: "AI when you want it. *Silent* when you don't.",
  body: "Off by default, one switch away. Use AI the way you want.",
  theme: "light",
});
const aiPhone = device("iphone-dark-4", "dark", "phone", 400);
const ICON_MONITOR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>';
const ICON_SHIELD =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>';
const chip1 = el(`<div class="chip"><span class="ic">${ICON_MONITOR}</span>Agents may need a second device</div>`);
const chip2 = el(`<div class="chip"><span class="ic">${ICON_SHIELD}</span>Local AI keeps data off the cloud</div>`);
stage.append(aiPhone, aiCap, chip1, chip2);

// Budgets
const budgetsCap = caption({
  headline: "See where it *really* goes.",
  body: "Get warned before you overspend.",
  theme: "dark",
});
const budgetsPhone = device("iphone-light-5", "light", "phone", 400);
stage.append(budgetsPhone, budgetsCap);

// Big screens: iPad, then iPhone Duo unfolding
const bigCap = caption({
  headline: "Room to breathe on *big screens.*",
  body: "List and details side by side, on iPad and iPhone Duo.",
  theme: "light",
});
const ipad = device("ipad-dark-6", "dark", "tablet", 640);
const duo = device("duoInner-dark-6", "dark", "duo", 860);
stage.append(ipad, duo, bigCap);

// Every device
const devicesCap = caption({ headline: "Every *device.*", theme: "dark", centre: true });
const row = [
  { node: device("iphone-light-1", "light", "phone", 250), label: "iPhone", x: 125, y: 380 },
  { node: device("ipad-light-2", "light", "tablet", 430), label: "iPad", x: 435, y: 370 },
  { node: device("android-dark-3", "dark", "phone", 250), label: "Android", x: 925, y: 380 },
  { node: device("mac-dark-6", "dark", "window", 560), label: "Mac", x: 1235, y: 430 },
];
const labels = row.map((r) => el(`<div class="label">${r.label}</div>`));
stage.append(...row.map((r) => r.node), ...labels, devicesCap);

// End card
const end = el(`<div class="lockup">${logoSvg("end", "dark")}
  <h2>Vaulted <em>Money</em></h2>
  <p>Your money. Your device.</p>
  ${WEB ? '<div class="extra">Free &amp; open source · vaulted.money</div>' : ""}
  <div class="badges"><span>Privacy-first</span><span>Data-local</span><span>Open-sourced</span></div>
</div>`);
const black = el('<div id="black"></div>');
stage.append(end, black);

// ── Render ──────────────────────────────────────────────────────────────────
function render(seconds) {
  const t = Math.min(Math.max(seconds, 0), DURATION - 1e-4);

  // Page colour: light for the light chapters, with a soft 0.8 s crossfade.
  const lightness = CHAPTERS.reduce((acc, c) => {
    if (!LIGHT.has(c.id)) return acc;
    return Math.max(acc, tween(t, c.start - 0.4, c.start + 0.4) * (1 - tween(t, c.end - 0.4, c.end + 0.4)));
  }, 0);
  set(bgLight, { opacity: lightness });

  // Intro: the shield settles, the name follows.
  {
    const { start, end: stop } = C.intro;
    const p = tween(t, start + 0.2, start + 1.8, ease.outQuart);
    const out = 1 - tween(t, stop - 0.7, stop, ease.inCubic);
    set(intro, { opacity: p * out, transform: `scale(${lerp(0.88, 1, p)})`, visibility: t < stop ? "visible" : "hidden" });
    set(intro.querySelector("h2"), { opacity: tween(t, start + 1.4, start + 2.2) });
  }

  // Privacy face-off
  {
    const { start, end: stop } = C.privacy;
    poseCaption(privacyCap, t, start + 0.3, stop, { subAt: 2.6, bodyAt: 3.8 });
    poseDevice(privacyL, t, start, stop, { x: 1000, y: 210, rotateY: 26, rotate: -6, delay: 0.5 });
    poseDevice(privacyR, t, start, stop, { x: 1400, y: 210, rotateY: -26, rotate: 6, delay: 0.8 });
  }

  // Search: push into the "Understood as" panel
  {
    const { start, end: stop } = C.search;
    poseCaption(searchCap, t, start + 0.3, stop);
    poseDevice(searchPhone, t, start, stop, { x: 1150, y: 150 });
    zoom(searchPhone, t, start + 3, 3, { scale: 1.3, fx: 0.5, fy: 0.42 });
  }

  // Labels: a light sweep across the same screen
  {
    const { start, end: stop } = C.labels;
    poseCaption(labelsCap, t, start + 0.3, stop);
    poseDevice(labelsDark, t, start, stop, { x: 1150, y: 150 });
    poseDevice(labelsLight, t, start, stop, { x: 1150, y: 150 });
    const sweep = tween(t, start + 3.4, start + 4.6, ease.inOutCubic);
    set(labelsLight, { clipPath: `circle(${sweep * 140}% at 100% 0%)` });
  }

  // AI: the switch, then the two notes
  {
    const { start, end: stop } = C.ai;
    poseCaption(aiCap, t, start + 0.3, stop);
    // Low enough that the agent card's "Needs the Mac app" note stays below
    // the frame, as in the store images.
    poseDevice(aiPhone, t, start, stop, { x: 1180, y: 500 });
    [chip1, chip2].forEach((chip, i) => {
      const p = tween(t, start + 3.2 + i * 0.7, start + 4.0 + i * 0.7, ease.outBack);
      const out = 1 - tween(t, stop - 0.6, stop, ease.inCubic);
      set(chip, {
        left: `${150 + (1 - p) * -60}px`,
        top: `${720 + i * 100}px`,
        opacity: Math.min(1, p) * out,
        visibility: t >= start && t <= stop ? "visible" : "hidden",
      });
    });
  }

  // Budgets: push into the first over-budget card
  {
    const { start, end: stop } = C.budgets;
    poseCaption(budgetsCap, t, start + 0.3, stop);
    poseDevice(budgetsPhone, t, start, stop, { x: 1150, y: 150 });
    zoom(budgetsPhone, t, start + 2.5, 3, { scale: 1.3, fx: 0.5, fy: 0.3 });
  }

  // Big screens: iPad, then the Duo unfolds to two panels
  {
    const { start, end: stop } = C.bigScreens;
    poseCaption(bigCap, t, start + 0.3, stop);
    const handover = start + 4.4;
    poseDevice(ipad, t, start, handover + 0.7, { x: 1060, y: 170 });
    poseDevice(duo, t, handover, stop, { x: 960, y: 300, delay: 0.1 });
    const unfold = tween(t, handover + 0.2, handover + 1.6, ease.inOutCubic);
    set(duo, { transform: `perspective(1800px) rotateY(${(1 - unfold) * 70}deg)`, transformOrigin: "50% 50%" });
  }

  // Every device: four glide into a row, named
  {
    const { start, end: stop } = C.devices;
    poseCaption(devicesCap, t, start + 0.2, stop);
    row.forEach((r, i) => {
      poseDevice(r.node, t, start, stop, { x: r.x, y: r.y, delay: 0.6 + i * 0.35 });
      const h = r.node.offsetHeight;
      const p = tween(t, start + 1.4 + i * 0.35, start + 2.0 + i * 0.35);
      const out = 1 - tween(t, stop - 0.6, stop);
      set(labels[i], {
        left: `${r.x + r.node.offsetWidth / 2}px`,
        top: `${Math.min(r.y + h + 24, 1010)}px`,
        opacity: p * out,
      });
    });
  }

  // End card, then a fade to black
  {
    const { start, end: stop } = C.end;
    const p = tween(t, start + 0.2, start + 1.6, ease.outQuart);
    set(end, { opacity: p, transform: `scale(${lerp(0.94, 1, p)})`, visibility: t >= start ? "visible" : "hidden" });
    set(black, { opacity: tween(t, stop - 1.2, stop, ease.inCubic) });
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot() {
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

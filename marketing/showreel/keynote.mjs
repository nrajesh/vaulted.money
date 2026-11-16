/**
 * The keynote cut: a 78-second tour in the store screenshots' look, with
 * every card landing on the beat of its score (timelines/keynote.mjs MOMENTS).
 *
 * Every frame is a pure function of time: `window.__render(seconds)` poses all
 * layers for that instant, so render.mjs (--cut keynote) can draw frames in
 * any order on any number of browsers. Screens are the store-screenshot
 * captures (marketing/store-screenshots/out/captures, copied to out/keynote).
 * `?web` adds "Free & open source" to the end card (website version).
 */
import {
  CHAPTERS,
  DURATION,
  HANDOVER,
  MOMENTS,
  chapter,
} from "./timelines/keynote.mjs";
import { ease, progress, tween } from "./lib/motion.mjs";
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
function poseDevice(node, t, land, end, { x, y, rotate = 0, rotateY = 0 }) {
  const p = popIn(t, land, 0.6, 1.2);
  const outP = tween(t, end - 0.5, end, ease.inBack);
  set(node, {
    left: `${x}px`,
    top: `${y + (1 - p) * 160 + outP * 120}px`,
    opacity: appear(t, land, 0.25) * (1 - Math.max(0, outP)),
    transform: `perspective(1600px) rotateY(${rotateY}deg) rotate(${rotate * (1 - p)}deg) scale(${0.9 + 0.1 * p})`,
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
stage.append(bgDark, bgLight);

const C = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
const LIGHT = new Set(["search", "ai", "bigScreens"]);

// Intro
const intro = el(
  `<div class="lockup">${logoSvg("intro", "dark")}<h2>Vaulted <em>Money</em></h2></div>`,
);
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
const chip1 = el(
  `<div class="chip"><span class="ic">${ICON_MONITOR}</span>Agents may need a second device</div>`,
);
const chip2 = el(
  `<div class="chip"><span class="ic">${ICON_SHIELD}</span>Local AI keeps data off the cloud</div>`,
);
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
const ipad = device("ipad-dark-6", "dark", "tablet", 560, { recorded: true });
ipad.dataset.recording = "ipad";
const duo = device("duoInner-dark-6", "dark", "duo", 860);
duo.dataset.recording = "duo";
const ipadLabel = el('<div class="label on-light-label">iPad</div>');
const duoLabel = el('<div class="label on-light-label">iPhone Duo</div>');
stage.append(ipad, duo, bigCap, ipadLabel, duoLabel);

// Every device
const devicesCap = caption({
  headline: "Every *device.*",
  theme: "dark",
  centre: true,
});
// Smallest screen to largest; the Apple devices sit together.
const row = [
  {
    node: device("android-dark-3", "dark", "phone", 190),
    label: "Android",
    x: 30,
    y: 450,
  },
  {
    node: device("iphone-light-1", "light", "phone", 190),
    label: "iPhone",
    x: 250,
    y: 450,
  },
  {
    node: device("duoInner-dark-6", "dark", "duo", 340),
    label: "iPhone Duo",
    x: 470,
    y: 560,
  },
  {
    node: device("ipad-light-2", "light", "tablet", 330),
    label: "iPad",
    x: 850,
    y: 420,
  },
  {
    node: device("mac-dark-6", "dark", "laptop", 620),
    label: "Mac · Windows · Linux",
    x: 1220,
    y: 460,
  },
];
row[2].node.dataset.recording = "duo";
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
    return Math.max(
      acc,
      tween(t, c.start - 0.4, c.start + 0.4) *
        (1 - tween(t, c.end - 0.4, c.end + 0.4)),
    );
  }, 0);
  set(bgLight, { opacity: lightness });

  const M = Object.fromEntries(
    Object.entries(MOMENTS).map(([name, m]) => [name, m.t]),
  );

  // Intro: the shield pops in with a sparkle, the name follows.
  {
    const { end: stop } = C.intro;
    const out = 1 - tween(t, stop - 0.6, stop, ease.inCubic);
    set(intro, {
      opacity: out,
      visibility: t < stop ? "visible" : "hidden",
    });
    const p = popIn(t, M.introLogo, 0.6, 1.6);
    set(intro.querySelector("svg"), {
      opacity: appear(t, M.introLogo, 0.3),
      transform: `scale(${0.6 + 0.4 * p})`,
    });
    popCard(intro.querySelector("h2"), t, M.introName, stop + 1);
  }

  // Privacy face-off
  {
    const { end: stop } = C.privacy;
    poseCaption(privacyCap, t, {
      at: M.privacyHeadline,
      sub: M.privacySub,
      body: M.privacyBody,
      end: stop,
    });
    poseDevice(privacyL, t, M.privacyLeft, stop, {
      x: 1000,
      y: 210,
      rotateY: 26,
      rotate: -6,
    });
    poseDevice(privacyR, t, M.privacyRight, stop, {
      x: 1400,
      y: 210,
      rotateY: -26,
      rotate: 6,
    });
  }

  // Search: push into the "Understood as" panel
  {
    const { end: stop } = C.search;
    poseCaption(searchCap, t, {
      at: M.searchHeadline,
      body: M.searchBody,
      end: stop,
    });
    poseDevice(searchPhone, t, M.searchPhone, stop, { x: 1150, y: 150 });
    spotlight(searchPhone, t, M.searchSpot, stop - 0.7);
  }

  // Labels: a light sweep across the same screen
  {
    const { end: stop } = C.labels;
    poseCaption(labelsCap, t, {
      at: M.labelsHeadline,
      body: M.labelsBody,
      end: stop,
    });
    poseDevice(labelsDark, t, M.labelsPhone, stop, { x: 1150, y: 150 });
    poseDevice(labelsLight, t, M.labelsPhone, stop, { x: 1150, y: 150 });
    const sweep = tween(
      t,
      M.labelsSweep - 0.5,
      M.labelsSweep + 0.5,
      ease.inOutCubic,
    );
    set(labelsLight, { clipPath: `circle(${sweep * 140}% at 100% 0%)` });
  }

  // AI: the switch, then the two notes
  {
    const { start, end: stop } = C.ai;
    poseCaption(aiCap, t, { at: M.aiHeadline, body: M.aiBody, end: stop });
    // Low enough that the agent card's "Needs the Mac app" note stays below
    // the frame, as in the store images.
    poseDevice(aiPhone, t, M.aiPhone, stop, { x: 1180, y: 500 });
    spotlight(aiPhone, t, M.aiSpot, M.aiSpot + 1.4);
    [chip1, chip2].forEach((chip, i) => {
      const below = aiCap.offsetTop + aiCap.offsetHeight + 56;
      set(chip, {
        left: "150px",
        top: `${below + i * 104}px`,
        visibility: t >= start && t <= stop ? "visible" : "hidden",
      });
      popCard(chip, t, i ? M.aiChip2 : M.aiChip1, stop);
    });
  }

  // Budgets: push into the first over-budget card
  {
    const { end: stop } = C.budgets;
    poseCaption(budgetsCap, t, {
      at: M.budgetsHeadline,
      body: M.budgetsBody,
      end: stop,
    });
    poseDevice(budgetsPhone, t, M.budgetsPhone, stop, { x: 1150, y: 150 });
    spotlight(budgetsPhone, t, M.budgetsSpot, stop - 0.7);
  }

  // Big screens: iPad, then the iPhone Duo, each playing its simulator
  // recording once still.
  {
    const { start, end: stop } = C.bigScreens;
    poseCaption(bigCap, t, { at: M.bigHeadline, body: M.bigBody, end: stop });
    // The iPad's recording switches from the table to list and details, so
    // it needs no spotlight; the Duo's opens rows (duo/overlay.mjs plays the
    // recordings once each device has settled).
    const handover = start + HANDOVER;
    poseDevice(ipad, t, M.bigIpad, handover + 0.7, { x: 1100, y: 140 });
    // Once its footage has played, each leaves showing the footage's end.
    showRecordingEnd(ipad, t >= handover);
    showRecordingEnd(duo, t >= stop - 0.7);
    poseDevice(duo, t, M.bigDuo, stop, { x: 960, y: 300 });
    const labelFor = (label, node, at, until) => {
      set(label, {
        left: `${node.offsetLeft + node.offsetWidth / 2}px`,
        top: `${node.offsetTop + node.offsetHeight + 22}px`,
      });
      popCard(label, t, at, until, "translateX(-50%)");
    };
    labelFor(ipadLabel, ipad, M.bigIpadLabel, handover + 0.4);
    labelFor(duoLabel, duo, M.bigDuoLabel, stop);
  }

  // Every device: five spring into a row, one a beat, each named
  {
    const { end: stop } = C.devices;
    poseCaption(devicesCap, t, { at: M.devicesHeadline, end: stop });
    row.forEach((r, i) => {
      poseDevice(r.node, t, M[`devicesRow${i}`], stop, { x: r.x, y: r.y });
      const h = r.node.offsetHeight;
      set(labels[i], {
        left: `${r.x + r.node.offsetWidth / 2}px`,
        top: `${Math.min(r.y + h + 24, 1010)}px`,
      });
      popCard(labels[i], t, M[`devicesLabel${i}`], stop, "translateX(-50%)");
    });
  }

  // End card: the shield lands with a boom, then the name, the line and the
  // badges pop in one by one; then a fade to black.
  {
    const { start, end: stop } = C.end;
    set(end, { visibility: t >= start - 0.3 ? "visible" : "hidden" });
    const p = popIn(t, M.endLogo, 0.6, 1.6);
    set(end.querySelector("svg"), {
      opacity: appear(t, M.endLogo, 0.3),
      transform: `scale(${0.6 + 0.4 * p})`,
    });
    popCard(end.querySelector("h2"), t, M.endName, stop + 1);
    popCard(end.querySelector("p"), t, M.endTagline, stop + 1);
    const extra = end.querySelector(".extra");
    if (extra) popCard(extra, t, M.endExtra, stop + 1);
    end
      .querySelectorAll(".badges span")
      .forEach((badge, i) => popCard(badge, t, M[`endBadge${i}`], stop + 1));
    set(black, { opacity: tween(t, stop - 1.2, stop, ease.inCubic) });
  }
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

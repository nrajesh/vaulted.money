/**
 * The Vaulted Money film: the picture.
 *
 * Every frame is a pure function of time: `window.__render(seconds)` poses
 * the whole stage for that instant, so render.mjs can draw frames in any
 * order. The app pictures are the photographs capture.mjs took of the running
 * app on each device's own screen size (out/shots); the film only moves a
 * camera over them and plays the typing back one key at a time.
 *
 * One feature per device: the camera sits close on a device, then the device
 * flips over into the next one. At the end it pulls back once to show all
 * five, and they fold into the logo. What the film itself draws: the
 * opening's loose notes, the words, the device frames and status bars, and
 * the end card.
 */
import {
  BADGES,
  CHAPTERS as C,
  COPY,
  DURATION,
  DUO_OPEN_SECONDS,
  FEATURES,
  FLIP,
  TAGLINE,
  moments,
} from "./timeline.mjs";
import { ease, lerp, tween } from "../lib/motion.mjs";
import { logoSvg } from "../lib/logo.mjs";

const stage = document.getElementById("stage");
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

// ── Devices ─────────────────────────────────────────────────────────────────
// sw × sh: the screen the app was captured at. w: its width on the stage at
// scale 1. bar: a status bar or title bar the film draws above the screen.
const SPECS = {
  iphone: { sw: 440, sh: 956, w: 414, pad: 10, bar: 34, radius: 60 },
  android: { sw: 412, sh: 915, w: 414, pad: 9, bar: 30, radius: 44 },
  ipad: { sw: 1032, sh: 1376, w: 690, pad: 16, bar: 0, radius: 34 },
  // Folded, the Duo is its cover screen: as tall as the opened device and
  // about half as wide.
  duoFolded: { sw: 466, sh: 678, w: 600, pad: 12, bar: 0, radius: 44 },
  duo: { sw: 951, sh: 669, w: 1240, pad: 12, bar: 0, radius: 44 },
  desktop: { sw: 1440, sh: 900, w: 1280, pad: 8, bar: 30, radius: 14 },
};
for (const spec of Object.values(SPECS)) spec.h = (spec.w * spec.sh) / spec.sw;

const STATUS = {
  // The two phones are told apart the way the real ones are: a pill-shaped
  // island on the iPhone, a single punch-hole camera on the Android.
  iphone:
    '<div class="sb"><span>9:41</span><i class="island"></i><span><b>5G</b></span></div>',
  android:
    '<div class="sb android"><span>9:41</span><i class="cam"></i><span>▾ ▮</span></div>',
  desktop: '<div class="titlebar"><i></i><i></i><i></i></div>',
};

const devices = Object.fromEntries(
  Object.entries(SPECS).map(([id, spec]) => {
    const node =
      el(`<div class="device ${id}" style="width:${spec.w + spec.pad * 2}px;height:${spec.h + spec.bar + spec.pad * 2}px;padding:${spec.pad}px;border-radius:${spec.radius}px">
      <div class="glass" style="border-radius:${spec.radius - spec.pad}px">${STATUS[id] ?? ""}
      <canvas class="screen" style="top:${spec.bar}px;width:${spec.w}px;height:${spec.h}px"></canvas>
      ${id === "duo" ? '<div class="duo-panel"><div class="duo-panel-front"><canvas></canvas></div><div class="duo-panel-back"></div></div>' : ""}</div>
      ${id === "desktop" ? '<div class="deck"><div class="trackpad"></div></div>' : ""}</div>`);
    const canvas = node.querySelector(".screen");
    const panelCanvas = node.querySelector(".duo-panel canvas");
    return [
      id,
      {
        id,
        spec,
        node,
        canvas,
        ctx: null,
        panelCanvas,
        panelCtx: null,
        drawn: "",
      },
    ];
  }),
);

/** A device's own point (px) for a point of its screen (fractions). */
const local = (spec, fx, fy) => ({
  x: spec.pad + fx * spec.w,
  y: spec.pad + spec.bar + fy * spec.h,
});
/**
 * A pose: the screen point (fx, fy) sits at (cx, cy) at `scale`, and the
 * device is turned about that point by `ry` (left-right) and `rx` (up-down)
 * degrees.
 */
const look = (scale, fx, fy, ry, rx, cx, cy) => ({
  scale,
  fx,
  fy,
  ry,
  rx,
  cx,
  cy,
});
/** Where a screen point lands on the stage for a pose seen straight on. */
const place = (spec, pose, fx, fy) => {
  const o = local(spec, pose.fx, pose.fy);
  const p = local(spec, fx, fy);
  return {
    x: pose.cx + (p.x - o.x) * pose.scale,
    y: pose.cy + (p.y - o.y) * pose.scale,
  };
};

// Where the camera looks: tall devices sit right of the words, wide ones
// under them.
const TALL = [1300, 540];
const WIDE = [960, 630];
const tall = (scale, fx, fy, ry = 0, rx = 0) =>
  look(scale, fx, fy, ry, rx, ...TALL);
const wide = (scale, fx, fy, ry = 0, rx = 0) =>
  look(scale, fx, fy, ry, rx, ...WIDE);

// The line-up at the end: every device upright, side by side.
// Sizes follow the real devices (about 2.45 stage px per millimetre): a phone
// is the smallest thing here and the laptop the largest. They stand on one
// line, the Duo in front.
const SLOTS = {
  android: look(0.41, 0.5, 0.5, 10, 0, 200, 732),
  iphone: look(0.41, 0.5, 0.5, 6, 0, 430, 734),
  ipad: look(0.72, 0.5, 0.5, -4, 0, 770, 587),
  duo: look(0.41, 0.5, 0.5, 0, 0, 1100, 746),
  desktop: look(0.6, 0.5, 0.5, -8, 0, 1440, 610),
};
const MERGE = [960, 290]; // where the logo stands on the end card

let M; // moments, known once the query length is
let NOTES;
const bitmaps = {};
const CAMERAS = {}; // per device: [[time, pose], ...]
const WHOLE = tall(1.1, 0.5, 0.5);

// ── Layers ──────────────────────────────────────────────────────────────────
const bgGrey = el('<div class="layer bg-grey"></div>');
const bgDark = el('<div class="layer bg-dark"></div>');
stage.append(bgGrey, bgDark);

function caption(text, { label = "", note = "", cls = "" } = {}) {
  let accent = false;
  const words = text.split(" ").map((raw) => {
    if (raw.startsWith("*")) accent = true;
    const word = raw.replace(/\*/g, "");
    const html = `<span class="word">${accent ? `<em>${word}</em>` : word}</span>`;
    if (raw.endsWith("*")) accent = false;
    return html;
  });
  return el(
    `<div class="cap ${cls}">${label ? `<div class="label">${label}</div>` : ""}<h1>${words.join(" ")}</h1>${note ? `<div class="note">${note}</div>` : ""}</div>`,
  );
}
/** Words rise in from `start`; everything fades by `end`. */
function poseCaption(node, t, start, end) {
  const out = 1 - tween(t, end - 0.25, end, ease.inCubic);
  [...node.querySelectorAll(".word")].forEach((w, i) => {
    const p = tween(t, start + i * 0.05, start + i * 0.05 + 0.36);
    set(w, { opacity: p * out, transform: `translateY(${(1 - p) * 36}px)` });
  });
  for (const extra of node.querySelectorAll(".label")) {
    set(extra, { opacity: tween(t, start, start + 0.3) * out });
  }
  set(node, {
    visibility: t >= start - 0.05 && t < end ? "visible" : "hidden",
  });
  return out;
}
const fadeIn = (node, t, at, out = 1) => {
  const p = tween(t, at, at + 0.35);
  set(node, { opacity: p * out, transform: `translateY(${(1 - p) * 20}px)` });
};

const capWorry = caption(COPY.worry, { cls: "on-grey" });
const capBrand = el(
  '<div class="cap"><h1 style="font-size:92px">Vaulted <em style="font-family:inherit;font-style:normal;font-weight:800">Money</em></h1></div>',
);
const featureCaps = FEATURES.map((feature) =>
  caption(feature.headline, {
    label: feature.label,
    note: feature.note,
    cls: SPECS[feature.device].sw > SPECS[feature.device].sh ? "wide" : "",
  }),
);
const capEverywhere = caption(COPY.everywhere, { cls: "centre" });
const proof = el(
  `<div id="proof">${COPY.proof.map((p) => `<span>${p}</span>`).join("")}</div>`,
);

// Worries: the amounts are the ones on the list's first rows (filled at boot).
const worries = [];
const PILLS = [
  ["Payment due tomorrow", 1010, 150, -3],
  ["Low balance", 1500, 610, 4],
  ["Where did it all go?", 930, 850, -2],
  ["Subscription renewed", 1330, 930, 3],
];
const AMOUNT_SPOTS = [
  [1420, 300, 6],
  [940, 470, -5],
  [1560, 780, -4],
  [1130, 660, 5],
];

// In the line-up each device is named, so two phones read as two platforms.
const SLOT_NAMES = {
  android: "Android",
  iphone: "iPhone",
  ipad: "iPad",
  duo: "iPhone Duo",
  desktop: "Mac · Windows · Linux",
};
const slotLabels = Object.fromEntries(
  Object.entries(SLOT_NAMES).map(([id, name]) => [
    id,
    el(`<div class="slot-label">${name}</div>`),
  ]),
);

const [first, second] = TAGLINE.split(", ");
const end = el(`<div id="end">${logoSvg("end", "dark")}
  <h2>Vaulted <em>Money</em></h2>
  <div class="tag"><span class="a">${first},</span> <span class="b">${second}</span></div>
  <div class="badges">${BADGES.map((b) => `<span>${b}</span>`).join("")}</div>
  <div class="action">${COPY.action}</div></div>`);
const black = el('<div id="black"></div>');

stage.append(
  capWorry,
  ...Object.values(devices).map((d) => d.node),
  capBrand,
  ...featureCaps,
  capEverywhere,
  ...Object.values(slotLabels),
  proof,
  end,
  black,
);

// ── Cameras ─────────────────────────────────────────────────────────────────
function buildCameras() {
  const { ask, bills, month, flow, charts, ai, everywhere } = C;
  const inputY = NOTES.ask.input.y + 0.04;
  const chipsY = NOTES.ask.chips.y + 0.02;
  CAMERAS.iphone = [
    [C.turn.start, WHOLE],
    [ask.start - 0.2, WHOLE],
    [ask.start + 0.45, tall(1.3, 0.5, inputY, -12, 4)],
    [M.askUnderstood, tall(1.35, 0.5, inputY, -8, 3)],
    [M.askUnderstood + 0.5, tall(1.35, 0.5, chipsY - 0.02, 8, 3)],
    [M.askApply, tall(1.4, 0.5, chipsY - 0.02, 12, 2)],
    [M.askResult + 0.5, tall(1.15, 0.5, 0.42, -12, 3)],
    [ask.end, tall(1.2, 0.5, 0.46, -8, 3)],
  ];
  CAMERAS.android = [
    [bills.start, tall(1.2, 0.5, 0.36, 12, 3)],
    [bills.start + 1.6, tall(1.3, 0.5, 0.34, -8, 4)],
    [bills.end, tall(1.35, 0.5, 0.5, -12, 4)],
  ];
  const b = NOTES.month.budgets;
  const p = NOTES.month.payees;
  CAMERAS.ipad = [
    [month.start, look(1.05, 0.42, b.y + 0.14, -12, 3, 1480, 540)],
    [month.start + 1.3, look(1.2, 0.42, b.y + 0.1, 7, 4, 1480, 540)],
    [month.start + 2.4, look(1.25, 0.42, b.y + 0.1, 10, 4, 1480, 540)],
    [month.start + 3.1, look(1.2, 0.66, p.y + 0.08, -8, 3, 1640, 540)],
    [month.end, look(0.9, 0.66, p.y + 0.08, -12, 3, 1450, 540)],
  ];
  // The Duo's inner screen swings out from the hinge before the camera moves in.
  const closed = wide(1.05, 0.5, 0.5, 0, 0);
  CAMERAS.duoFolded = [
    [flow.start, wide(1.0, 0.5, 0.5, 16, 3)],
    [M.unfold - 0.35, closed],
    [flow.end, closed],
  ];
  CAMERAS.duo = [
    [M.unfold + DUO_OPEN_SECONDS, closed],
    [M.unfold + DUO_OPEN_SECONDS + 0.8, wide(1.05, 0.5, 0.5, -5, 2)],
    [flow.end, wide(1.1, 0.52, 0.55, 8, 2)],
  ];
  // The laptop camera moves between features without flipping the same screen.
  const aiView = (scale, ry, rx) => look(scale, 0.5, 0.5, ry, rx, 960, 540);
  CAMERAS.desktop = [
    // It arrives whole, screen and slim base visible, before the camera goes in.
    [charts.start, look(0.98, 0.5, 0.56, -12, 3, 960, 600)],
    [charts.start + 1.0, wide(1.0, 0.5, 0.55, 4, 2)],
    [charts.end, wide(1.05, 0.5, 0.55, 8, 2)],
    [ai.start + 0.35, aiView(0.95, -4, 2)],
    [M.aiOn, aiView(1.0, -2, 2)],
    [ai.end - 0.1, aiView(1.05, 4, 2)],
    // The one pull-back: the laptop goes to its place in the line-up.
    [everywhere.start + 0.9, SLOTS.desktop],
  ];
}
function poseAt(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, b] = keys[i];
    if (t > t1) continue;
    const [t0, a] = keys[i - 1];
    const p = tween(t, t0, t1, ease.inOutCubic);
    return Object.fromEntries(
      Object.keys(a).map((key) => [key, lerp(a[key], b[key], p)]),
    );
  }
  return keys.at(-1)[1];
}

// ── Which photograph is on each device ──────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const typedCount = (t) => M.askKeys.filter((k) => t >= k).length;
const fade = (t, from, to, at, len = 0.3) => {
  const mix = tween(t, at, at + len, ease.inOutCubic);
  return mix <= 0 ? [from] : mix >= 1 ? [to] : [from, to, mix];
};
const fadeThroughDark = (t, from, to, at, len = 0.2) => {
  const midpoint = at + len / 2;
  if (t <= at) return [from];
  if (t >= at + len) return [to];
  if (t < midpoint)
    return [
      from,
      undefined,
      1 - tween(t, at, midpoint, ease.inOutCubic),
      "dark",
    ];
  return [to, undefined, tween(t, midpoint, at + len, ease.inOutCubic), "dark"];
};
const SHOTS = {
  iphone: (t) => {
    if (t < M.askKeys[0])
      return fade(t, "iphone-list", "iphone-search-00", C.ask.start + 0.1);
    if (t < M.askUnderstood) return [`iphone-search-${pad(typedCount(t))}`];
    if (t < M.askResult) return ["iphone-understood"];
    return ["iphone-result"];
  },
  android: () => ["android-bills"],
  ipad: () => ["ipad-month"],
  duoFolded: () => ["duo-folded"],
  duo: () => ["duo-flow"],
  desktop: (t) => {
    if (t < M.chartRing)
      return fade(t, "desktop-line", "desktop-bar", M.chartBars, 0.25);
    if (t < C.ai.start)
      return fade(t, "desktop-bar", "desktop-pie", M.chartRing, 0.25);
    if (t < C.ai.start + 0.35)
      return fadeThroughDark(t, "desktop-pie", "desktop-ai-off", C.ai.start);
    return fade(t, "desktop-ai-off", "desktop-ai-on", M.aiOn, 0.25);
  },
};
function draw(device, [a, b, mix, transition]) {
  const key = `${a}|${b ?? ""}|${mix?.toFixed(3) ?? ""}|${transition ?? ""}`;
  if (key === device.drawn) return;
  device.drawn = key;
  const { ctx, canvas } = device;
  ctx.globalAlpha = 1;
  if (transition === "dark") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = mix;
    ctx.drawImage(bitmaps[a], 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(bitmaps[a], 0, 0, canvas.width, canvas.height);
  }
  if (b) {
    ctx.globalAlpha = mix;
    ctx.drawImage(bitmaps[b], 0, 0, canvas.width, canvas.height);
  }
  ctx.globalAlpha = 1;
  if (device.panelCtx) {
    const panel = device.panelCanvas;
    const half = bitmaps[a].width / 2;
    device.panelCtx.globalAlpha = 1;
    device.panelCtx.drawImage(
      bitmaps[a],
      half,
      0,
      half,
      bitmaps[a].height,
      0,
      0,
      panel.width,
      panel.height,
    );
    if (b) {
      device.panelCtx.globalAlpha = mix;
      device.panelCtx.drawImage(
        bitmaps[b],
        half,
        0,
        half,
        bitmaps[b].height,
        0,
        0,
        panel.width,
        panel.height,
      );
    }
  }
}

/** Puts a device on the stage in `pose`, turned a further `flip` degrees. */
function poseDevice(
  device,
  pose,
  { flip = 0, opacity = 1, dy = 0, clip = "none", open = 1 } = {},
) {
  const origin = local(device.spec, pose.fx, pose.fy);
  set(device.node, {
    left: `${pose.cx - origin.x}px`,
    top: `${pose.cy - origin.y + dy}px`,
    transformOrigin: `${origin.x}px ${origin.y}px`,
    transform: `perspective(1400px) rotateY(${pose.ry + flip}deg) rotateX(${pose.rx}deg) rotateZ(${pose.ry * -0.08}deg) scale(${pose.scale})`,
    clipPath: clip,
    opacity,
    visibility: opacity > 0.001 ? "visible" : "hidden",
  });
  if (device.id === "duo") {
    device.node.style.setProperty("--duo-open", String(open));
    device.node.style.setProperty(
      "--duo-hinge-shadow",
      String(0.15 + (1 - open) * 0.65),
    );
    set(device.node.querySelector(".duo-panel"), {
      transform: `rotateY(${-90 * (1 - open)}deg)`,
    });
  }
}

// ── Where each device is ────────────────────────────────────────────────────
const LINEUP = ["android", "iphone", "ipad", "duo", "desktop"];
const firstFeature = FEATURES[0];
const lastFeature = FEATURES.at(-1);

/**
 * A device's pose at time `t`, or null while it is off stage. During its
 * features a device follows its camera, flipping in from the edge-on device
 * before it and out into the next (the laptop flips once between its two
 * features, like turning a page). In the line-up every device goes to its
 * slot, and then all fold into the logo.
 */
function deviceState(id, t, mergeP) {
  const every = C.everywhere;
  const flow = C.flow;

  // The Duo, folded: on stage from its flip-in until it has opened.
  if (id === "duoFolded") {
    if (t < flow.start || t >= M.unfold + 0.2) return null;
    return {
      pose: poseAt(CAMERAS.duoFolded, t),
      flip: -84 * (1 - tween(t, flow.start, flow.start + FLIP, ease.outCubic)),
      opacity: 1 - tween(t, M.unfold + 0.05, M.unfold + 0.2),
    };
  }

  const mine = FEATURES.filter((f) => f.device === id);
  const from = mine[0] === firstFeature ? C.turn.start : C[mine[0].id].start;
  const until =
    mine.at(-1) === lastFeature ? every.start + 0.9 : C[mine.at(-1).id].end;

  if (t >= (id === "duo" ? M.unfold : from) && t < until) {
    const pose = { ...poseAt(CAMERAS[id], t) };
    let flip = 0;
    let opacity = 1;
    let dy = 0;
    let clip = "none";
    let open = 1;
    for (const feature of mine) {
      const { start, end } = C[feature.id];
      if (feature === firstFeature) {
        const inP = tween(t, from + 0.05, from + 0.8, ease.outQuart);
        dy = (1 - inP) * 260;
        opacity = inP;
      } else if (id !== "duo" && feature.flipIn !== false) {
        // Only while this feature's flip-in is under way.
        if (t >= start && t < start + FLIP)
          flip -= 84 * (1 - tween(t, start, start + FLIP, ease.outCubic));
      }
      if (
        feature.flipOut !== false &&
        feature !== lastFeature &&
        t >= end - FLIP &&
        t < end
      )
        flip += 84 * tween(t, end - FLIP, end, ease.inCubic);
    }
    if (id === "duo") {
      open = tween(t, M.unfold, M.unfold + DUO_OPEN_SECONDS, ease.outCubic);
      const { spec } = devices.duo;
      const folded = devices.duoFolded.spec;
      const outer = (s) => s.w + s.pad * 2;
      pose.cx += ((1 - open) * (outer(spec) - outer(folded)) * pose.scale) / 2;
      const hidden = (1 - open) * 50;
      clip = `inset(0 ${hidden.toFixed(2)}% 0 0 round ${spec.radius}px)`;
    }
    return { pose, flip, opacity, dy, clip, open };
  }

  if (t >= every.start && id !== "duoFolded") {
    // The line-up: slide up into the slot, one after another.
    const slot = SLOTS[id];
    const at = every.start + 0.25 + LINEUP.indexOf(id) * 0.12;
    const inP =
      mine.at(-1) === lastFeature ? 1 : tween(t, at, at + 0.6, ease.outQuart);
    return {
      pose: {
        ...slot,
        scale: slot.scale * lerp(1, 0.08, mergeP),
        cx: lerp(slot.cx, MERGE[0], mergeP),
        cy: lerp(slot.cy, MERGE[1], mergeP),
        ry: slot.ry * (1 - mergeP),
      },
      dy: (1 - inP) * 220,
      opacity: inP * (1 - tween(t, M.merge + 0.45, C.end.start)),
    };
  }
  return null;
}

// ── Render ──────────────────────────────────────────────────────────────────
function render(seconds) {
  const t = Math.min(Math.max(seconds, 0), DURATION - 1e-4);
  const every = C.everywhere;

  // The ground turns from the worry's grey to the film's dark as the mess
  // lands in the phone, opening out from it. It stays dark to the end.
  const darkP = tween(
    t,
    C.turn.start + 0.8,
    C.turn.start + 1.7,
    ease.inOutCubic,
  );
  const centre = place(SPECS.iphone, WHOLE, 0.5, 0.5);
  set(bgDark, {
    clipPath: `circle(${darkP * 2300}px at ${centre.x}px ${centre.y}px)`,
  });

  // Worries drift; from the turn, each amount flies to its row on the list.
  {
    const fly = tween(
      t,
      C.turn.start + 0.3,
      C.turn.start + 1.1,
      ease.inOutCubic,
    );
    const gone = tween(t, C.turn.start + 1.1, C.turn.start + 1.4);
    worries.forEach((w, i) => {
      const drift = Math.sin(t * 0.7 + i * 1.7) * 14;
      const inP = w.row
        ? 1
        : 1 - tween(t, C.turn.start + 0.1, C.turn.start + 0.6);
      let x = w.x + drift;
      let y = w.y + Math.cos(t * 0.6 + i) * 10 - t * 14;
      let size = 1;
      let rotate = w.rotate;
      if (w.row) {
        const to = place(SPECS.iphone, WHOLE, w.row.x, w.row.y);
        x = lerp(x, to.x, fly);
        y = lerp(y, to.y, fly);
        size = lerp(1, (w.row.h * SPECS.iphone.h * WHOLE.scale) / 54, fly);
        rotate = lerp(rotate, 0, fly);
      }
      set(w.node, {
        left: `${x}px`,
        top: `${y}px`,
        opacity: inP * (1 - gone),
        transform: `rotate(${rotate}deg) scale(${size})`,
        transformOrigin: "0 0",
        visibility: t < C.turn.start + 1.4 ? "visible" : "hidden",
      });
    });
  }

  // Devices. During its feature a device follows its camera; it flips in
  // from the edge-on device before it and flips out into the next. In the
  // line-up every device goes to its slot, then all fold into the logo.
  const mergeP = tween(t, M.merge, C.end.start, ease.inCubic);
  for (const device of Object.values(devices)) {
    const state = deviceState(device.id, t, mergeP);
    if (!state) {
      set(device.node, { visibility: "hidden" });
      continue;
    }
    draw(device, SHOTS[device.id](t));
    poseDevice(device, state.pose, state);
  }

  // Words
  poseCaption(capWorry, t, -1, C.turn.start + 0.4);
  {
    const out = 1 - tween(t, C.ask.start - 0.3, C.ask.start, ease.inCubic);
    const p = tween(t, C.turn.start + 1.2, C.turn.start + 1.6);
    set(capBrand, {
      opacity: p * out,
      transform: `translateY(${(1 - p) * 30}px)`,
      visibility:
        t >= C.turn.start + 1.1 && t < C.ask.start ? "visible" : "hidden",
    });
  }
  FEATURES.forEach((feature, index) => {
    const chapter = C[feature.id];
    const node = featureCaps[index];
    const out = poseCaption(node, t, chapter.start + 0.15, chapter.end);
    const note = node.querySelector(".note");
    if (note) fadeIn(note, t, M.askUnderstood + 0.4, out);
  });
  {
    const out = poseCaption(capEverywhere, t, every.start + 0.5, M.merge + 0.2);
    for (const [id, label] of Object.entries(slotLabels)) {
      const slot = SLOTS[id];
      const { spec } = devices[id];
      const top =
        slot.cy - ((spec.h + spec.bar) / 2 + spec.pad) * slot.scale - 52;
      const p = tween(t, every.start + 1.1, every.start + 1.5);
      set(label, {
        left: `${slot.cx}px`,
        top: `${top}px`,
        opacity: p * out,
        visibility:
          t >= every.start + 1 && t < M.merge + 0.2 ? "visible" : "hidden",
      });
    }
    proof.querySelectorAll("span").forEach((line, i) => {
      fadeIn(line, t, every.start + 1.8 + i * 0.45, out);
    });
    set(proof, {
      visibility: t >= every.start && t < M.merge + 0.2 ? "visible" : "hidden",
    });
  }

  // End card: the devices fold into the logo, then the name, the slogan in
  // two halves, the badges and one action. Then black.
  {
    const s = C.end.start;
    set(end, { visibility: t >= M.merge ? "visible" : "hidden" });
    const logoP = tween(t, M.merge + 0.45, s + 0.35, ease.outBack);
    set(end.querySelector(".logo-svg"), {
      opacity: Math.min(1, logoP * 1.4),
      transform: `scale(${lerp(0.3, 1, logoP)})`,
    });
    set(end.querySelector("h2"), { opacity: tween(t, s + 0.3, s + 0.7) });
    fadeIn(end.querySelector(".a"), t, s + 0.8);
    fadeIn(end.querySelector(".b"), t, s + 1.35);
    fadeIn(end.querySelector(".badges"), t, s + 2.0);
    fadeIn(end.querySelector(".action"), t, s + 2.6);
    set(black, { opacity: tween(t, DURATION - 0.5, DURATION, ease.inCubic) });
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot() {
  NOTES = await (await fetch("out/shots/notes.json")).json();
  M = moments(NOTES.query.length);
  buildCameras();

  const names = [
    "iphone-list",
    "iphone-understood",
    "iphone-result",
    "android-bills",
    "ipad-month",
    "duo-folded",
    "duo-flow",
    "desktop-line",
    "desktop-bar",
    "desktop-pie",
    "desktop-ai-off",
    "desktop-ai-on",
  ];
  for (let i = 0; i <= NOTES.query.length; i++)
    names.push(`iphone-search-${pad(i)}`);
  // Decoded up front and kept as bitmaps, so no frame is ever drawn blank.
  await Promise.all(
    names.map(async (name) => {
      const blob = await (await fetch(`out/shots/${name}.png`)).blob();
      bitmaps[name] = await createImageBitmap(blob);
    }),
  );
  // Each canvas is as sharp as its device's photographs.
  for (const [id, device] of Object.entries(devices)) {
    const sample = bitmaps[SHOTS[id](DURATION)[0]];
    device.canvas.width = sample.width;
    device.canvas.height = sample.height;
    device.ctx = device.canvas.getContext("2d");
    if (device.panelCanvas) {
      device.panelCanvas.width = sample.width / 2;
      device.panelCanvas.height = sample.height;
      device.panelCtx = device.panelCanvas.getContext("2d");
    }
  }

  NOTES.rows.slice(0, AMOUNT_SPOTS.length).forEach((row, i) => {
    const [x, y, rotate] = AMOUNT_SPOTS[i];
    const node = el(`<div class="worry">${row.text}</div>`);
    stage.insertBefore(node, capBrand);
    worries.push({ node, x, y, rotate, row });
  });
  PILLS.forEach(([text, x, y, rotate]) => {
    const node = el(`<div class="worry pill">${text}</div>`);
    stage.insertBefore(node, capBrand);
    worries.push({ node, x, y, rotate, row: null });
  });

  await document.fonts.ready;
  window.__render = render;
  render(0);
  window.__filmReady = true;
}
boot().catch((error) => {
  window.__filmError = String(error?.stack ?? error);
  console.error(error);
});

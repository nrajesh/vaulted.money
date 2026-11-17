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
  duo: { sw: 951, sh: 669, w: 1240, pad: 12, bar: 0, radius: 44 },
  desktop: { sw: 1440, sh: 900, w: 1280, pad: 8, bar: 30, radius: 14 },
};
for (const spec of Object.values(SPECS)) spec.h = (spec.w * spec.sh) / spec.sw;

const STATUS = {
  iphone: '<div class="sb"><span>9:41</span><span><b>5G</b></span></div>',
  android:
    '<div class="sb android"><span>9:41</span><i class="cam"></i><span>▾ ▮</span></div>',
  desktop: '<div class="titlebar"><i></i><i></i><i></i></div>',
};

const devices = Object.fromEntries(
  Object.entries(SPECS).map(([id, spec]) => {
    const node =
      el(`<div class="device ${id}" style="width:${spec.w + spec.pad * 2}px;height:${spec.h + spec.bar + spec.pad * 2}px;padding:${spec.pad}px;border-radius:${spec.radius}px">
      <div class="glass" style="border-radius:${spec.radius - spec.pad}px">${STATUS[id] ?? ""}
      <canvas style="top:${spec.bar}px;width:${spec.w}px;height:${spec.h}px"></canvas></div></div>`);
    const canvas = node.querySelector("canvas");
    return [id, { id, spec, node, canvas, ctx: null, drawn: "" }];
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
const SLOTS = {
  // Big enough to fill the frame edge to edge; the Duo sits in front.
  android: look(0.8, 0.5, 0.5, 12, 0, 170, 610),
  iphone: look(0.8, 0.5, 0.5, 7, 0, 480, 610),
  ipad: look(0.68, 0.5, 0.5, -4, 0, 860, 570),
  duo: look(0.5, 0.5, 0.5, 0, 0, 1170, 745),
  desktop: look(0.62, 0.5, 0.5, -10, 0, 1520, 520),
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

const [first, second] = TAGLINE.split(". ");
const end = el(`<div id="end">${logoSvg("end", "dark")}
  <h2>Vaulted <em>Money</em></h2>
  <div class="tag"><span class="a">${first}.</span> <span class="b">${second}</span></div>
  <div class="badges">${BADGES.map((b) => `<span>${b}</span>`).join("")}</div>
  <div class="action">${COPY.action}</div></div>`);
const black = el('<div id="black"></div>');

stage.append(
  capWorry,
  ...Object.values(devices).map((d) => d.node),
  capBrand,
  ...featureCaps,
  capEverywhere,
  proof,
  end,
  black,
);

// ── Cameras ─────────────────────────────────────────────────────────────────
function buildCameras() {
  const { ask, bills, month, flow, spent, everywhere } = C;
  const inputY = NOTES.ask.input.y + 0.04;
  const chipsY = NOTES.ask.chips.y + 0.02;
  CAMERAS.iphone = [
    [C.turn.start, WHOLE],
    [ask.start - 0.2, WHOLE],
    [ask.start + 0.45, tall(2.3, 0.5, inputY, -18, 6)],
    [M.askUnderstood, tall(2.35, 0.5, inputY, -10, 4)],
    [M.askUnderstood + 0.5, tall(2.35, 0.5, chipsY - 0.02, 12, 4)],
    [M.askApply, tall(2.4, 0.5, chipsY - 0.02, 16, 3)],
    [M.askResult + 0.5, tall(1.7, 0.5, 0.42, -20, 4)],
    [ask.end, tall(1.8, 0.5, 0.46, -12, 4)],
  ];
  CAMERAS.android = [
    [bills.start, tall(1.7, 0.5, 0.36, 20, 4)],
    [bills.start + 1.6, tall(2.15, 0.5, 0.34, -12, 6)],
    [bills.end, tall(2.2, 0.5, 0.5, -18, 5)],
  ];
  const b = NOTES.month.budgets;
  const p = NOTES.month.payees;
  CAMERAS.ipad = [
    [month.start, look(1.55, 0.42, b.y + 0.14, -18, 4, 1480, 540)],
    [month.start + 1.3, look(1.9, 0.42, b.y + 0.1, 10, 5, 1480, 540)],
    [month.start + 2.4, look(1.95, 0.42, b.y + 0.1, 14, 5, 1480, 540)],
    [month.start + 3.1, look(1.9, 0.66, p.y + 0.08, -12, 4, 1640, 540)],
    [month.end, look(1.95, 0.66, p.y + 0.08, -16, 4, 1640, 540)],
  ];
  CAMERAS.duo = [
    [flow.start, wide(1.15, 0.5, 0.5, 16, 4)],
    [flow.start + 1.4, wide(1.5, 0.52, 0.5, -8, 4)],
    [M.forecast - 0.2, wide(1.56, 0.52, 0.5, -12, 4)],
    [M.forecast + 0.6, wide(1.45, 0.5, 0.42, 10, 4)],
    [flow.end, wide(1.55, 0.55, 0.42, 14, 3)],
  ];
  CAMERAS.desktop = [
    [spent.start, wide(1.12, 0.5, 0.5, -16, 4)],
    [spent.start + 1.4, wide(1.6, 0.52, 0.56, 8, 4)],
    [spent.end - 0.1, wide(1.68, 0.52, 0.56, 12, 3)],
    // The one pull-back: the desktop goes to its place in the line-up.
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
  duo: (t) => fade(t, "duo-flow", "duo-forecast", M.forecast, 0.35),
  desktop: () => ["desktop-spent"],
};
function draw(device, [a, b, mix]) {
  const key = `${a}|${b ?? ""}|${mix?.toFixed(3) ?? ""}`;
  if (key === device.drawn) return;
  device.drawn = key;
  const { ctx, canvas } = device;
  ctx.globalAlpha = 1;
  ctx.drawImage(bitmaps[a], 0, 0, canvas.width, canvas.height);
  if (b) {
    ctx.globalAlpha = mix;
    ctx.drawImage(bitmaps[b], 0, 0, canvas.width, canvas.height);
  }
}

/** Puts a device on the stage in `pose`, turned a further `flip` degrees. */
function poseDevice(device, pose, { flip = 0, opacity = 1, dy = 0 } = {}) {
  const origin = local(device.spec, pose.fx, pose.fy);
  set(device.node, {
    left: `${pose.cx - origin.x}px`,
    top: `${pose.cy - origin.y + dy}px`,
    transformOrigin: `${origin.x}px ${origin.y}px`,
    transform: `perspective(1400px) rotateY(${pose.ry + flip}deg) rotateX(${pose.rx}deg) rotateZ(${pose.ry * -0.08}deg) scale(${pose.scale})`,
    opacity,
    visibility: opacity > 0.001 ? "visible" : "hidden",
  });
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
  FEATURES.forEach((feature, index) => {
    const device = devices[feature.device];
    const chapter = C[feature.id];
    const isFirst = index === 0;
    const isLast = index === FEATURES.length - 1;
    const from = isFirst ? C.turn.start : chapter.start;
    let pose;
    let flip = 0;
    let opacity = 0;
    let dy = 0;

    if (t >= from && (t < chapter.end || isLast) && t < every.start + 0.9) {
      pose = poseAt(CAMERAS[feature.device], t);
      opacity = 1;
      if (isFirst) {
        const inP = tween(t, from + 0.05, from + 0.8, ease.outQuart);
        dy = (1 - inP) * 260;
        opacity = inP;
      } else {
        flip = -84 * (1 - tween(t, from, from + FLIP, ease.outCubic));
      }
      if (!isLast)
        flip += 84 * tween(t, chapter.end - FLIP, chapter.end, ease.inCubic);
    } else if (t >= every.start) {
      // The line-up: slide up into the slot, one after another.
      const slot = SLOTS[feature.device];
      const at = every.start + 0.25 + index * 0.12;
      const inP = isLast ? 1 : tween(t, at, at + 0.6, ease.outQuart);
      pose = {
        ...slot,
        scale: slot.scale * lerp(1, 0.08, mergeP),
        cx: lerp(slot.cx, MERGE[0], mergeP),
        cy: lerp(slot.cy, MERGE[1], mergeP),
        ry: slot.ry * (1 - mergeP),
      };
      dy = (1 - inP) * 220;
      opacity = inP * (1 - tween(t, M.merge + 0.45, C.end.start));
    }
    if (!pose) {
      set(device.node, { visibility: "hidden" });
      return;
    }
    draw(device, SHOTS[feature.device](t));
    poseDevice(device, pose, { flip, opacity, dy });
  });

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
    "duo-flow",
    "duo-forecast",
    "desktop-spent",
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

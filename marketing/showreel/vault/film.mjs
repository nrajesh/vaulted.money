/**
 * "You see everything. We see nothing.": the picture.
 *
 * Every frame is a pure function of time: `window.__render(seconds)` poses
 * the whole stage for that instant, so render.mjs can draw frames in any
 * order. The app pictures are the photographs capture.mjs took of the running
 * app (out/shots); the film only moves a camera over them and plays the
 * typing back one key at a time. What the film itself draws: the opening's
 * loose notes, the headlines, the phone's frame and status bar, the hexagon
 * and the end card.
 */
import {
  CHAPTERS as C,
  COPY,
  DURATION,
  BADGES,
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

// ── Phone geometry ──────────────────────────────────────────────────────────
const SCREEN = { w: 414, h: 900, pad: 10, bar: 34 };
const VIEW = { cx: 1390, cy: 540 }; // where the camera looks, right of the words

/** The phone's own point (px) for a point of the screen (fractions). */
const local = (fx, fy) => ({
  x: SCREEN.pad + fx * SCREEN.w,
  y: SCREEN.pad + SCREEN.bar + fy * SCREEN.h,
});
/**
 * A pose: the screen point (fx, fy) sits at (cx, cy) at `scale`, and the
 * phone is turned about that point by `ry` (left-right) and `rx` (up-down)
 * degrees, so every beat shows it from a different angle.
 */
const look = (scale, fx, fy, ry = 0, rx = 0, cx = VIEW.cx, cy = VIEW.cy) => ({
  scale,
  fx,
  fy,
  ry,
  rx,
  cx,
  cy,
});
/** Where a screen point lands on the stage for a pose seen straight on. */
const place = (pose, fx, fy) => {
  const o = local(pose.fx, pose.fy);
  const p = local(fx, fy);
  return {
    x: pose.cx + (p.x - o.x) * pose.scale,
    y: pose.cy + (p.y - o.y) * pose.scale,
  };
};

const TURN = 2; // how far the phone turns for each degree in the camera list
const WHOLE = 1.1; // the whole phone, nearly the height of the frame
let M; // moments, known once the query length is
let NOTES;
const bitmaps = {};

// ── Layers ──────────────────────────────────────────────────────────────────
const bgGrey = el('<div class="layer bg-grey"></div>');
const bgLight = el('<div class="layer bg-light"></div>');
const bgDark = el('<div class="layer bg-dark"></div>');
stage.append(bgGrey, bgLight, bgDark);

function caption(text, theme, extra = "") {
  let accent = false;
  const words = text.split(" ").map((raw) => {
    if (raw.startsWith("*")) accent = true;
    const word = raw.replace(/\*/g, "");
    const html = `<span class="word">${accent ? `<em>${word}</em>` : word}</span>`;
    if (raw.endsWith("*")) accent = false;
    return html;
  });
  return el(
    `<div class="cap on-${theme}"><h1>${words.join(" ")}</h1>${extra}</div>`,
  );
}
/** Words rise in from `start`; everything fades by `end`. */
function poseCaption(node, t, start, end) {
  const out = 1 - tween(t, end - 0.3, end, ease.inCubic);
  [...node.querySelectorAll(".word")].forEach((w, i) => {
    const p = tween(t, start + i * 0.05, start + i * 0.05 + 0.38);
    set(w, { opacity: p * out, transform: `translateY(${(1 - p) * 40}px)` });
  });
  set(node, {
    visibility: t >= start - 0.05 && t < end ? "visible" : "hidden",
  });
  return out;
}
const fadeIn = (node, t, at, out = 1) => {
  const p = tween(t, at, at + 0.35);
  set(node, { opacity: p * out, transform: `translateY(${(1 - p) * 22}px)` });
};

const PLANE =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>';
const PLANE_ICON = PLANE.replace(
  "<svg",
  '<svg style="width:40px;height:40px;vertical-align:-6px"',
);
const capWorry = caption(COPY.worry, "grey");
const capBrand = el(
  '<div class="cap on-light"><h1 style="font-size:92px">Vaulted <em style="font-family:inherit;font-style:normal;font-weight:800;color:#d9793b">Money</em></h1></div>',
);
const capWhere = caption(COPY.where, "light");
const capTyped = el(
  '<div class="cap on-light"><div class="typed"></div></div>',
);
const capAsk = caption(
  COPY.ask,
  "light",
  `<div class="note">${COPY.askNote}</div>`,
);
const capTrack = caption(COPY.track, "light");
const capAhead = caption(COPY.ahead, "light");
const capWho = caption(
  COPY.who,
  "light",
  `<div class="note">${PLANE_ICON} ${COPY.offline}</div>`,
);
const capOnly = caption(
  COPY.only,
  "dark",
  `<div class="proof">${COPY.proof.map((p) => `<span>${p}</span>`).join("")}</div>`,
);
capOnly.querySelector("h1").style.fontSize = "150px";
const capDevices = caption(COPY.devices, "dark");
capDevices.classList.add("centre");

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

const hex = el(
  '<svg id="hex" viewBox="0 0 1040 1080"><polygon points="510,22 958,281 958,799 510,1058 62,799 62,281" pathLength="1"/></svg>',
);
const phone = el(`<div id="phone"><div class="glass">
  <div class="sb"><span>9:41</span><span class="net"></span></div>
  <canvas width="1320" height="2868"></canvas></div></div>`);
const canvas = phone.querySelector("canvas");
const ctx = canvas.getContext("2d");
const net = phone.querySelector(".net");

const tablet = el(
  '<div class="frame"><img src="out/shots/tablet-charts.png" alt=""></div>',
);
const desktop = el(
  '<div class="frame window"><img src="out/shots/desktop-charts.png" alt=""></div>',
);

const [first, second] = TAGLINE.split(". ");
const badges = BADGES.map((b) => `<span>${b}</span>`).join("");
const end = el(`<div id="end">${logoSvg("end", "dark")}
  <h2>Vaulted <em>Money</em></h2>
  <div class="tag"><span class="a">${first}.</span> <span class="b">${second}</span></div>
  <div class="badges">${badges}</div>
  <div class="action">${COPY.action}</div></div>`);
const black = el('<div id="black"></div>');

stage.append(
  capWorry,
  hex,
  phone,
  tablet,
  desktop,
  capBrand,
  capWhere,
  capTyped,
  capAsk,
  capTrack,
  capAhead,
  capWho,
  capOnly,
  capDevices,
  end,
  black,
);

// ── Camera: [time, pose]; eased between neighbours ──────────────────────────
let CAMERA = [];
function buildCamera() {
  const ring = NOTES.charts.ring;
  const su = NOTES["search-understood"];
  const b = NOTES.budgets;
  const whole = look(WHOLE, 0.5, 0.5);
  const ringY = ring.y + ring.h / 2;
  const budgetY = (b.over.y + b.left.y) / 2;
  CAMERA = [
    [C.turn.start, whole],
    [C.where.start - 0.3, whole],
    [C.where.start + 0.5, look(WHOLE, 0.5, 0.5, -16, 3)],
    [C.where.start + 1.3, look(2.05, 0.5, ringY, -12, 4)],
    [C.where.start + 2.3, look(2.1, 0.5, ringY, -4, 3)],
    [C.where.start + 3.0, look(2.05, 0.5, 0.36, 12, 2)],
    [C.ask.start - 0.2, look(2.05, 0.5, 0.36, 14, 2)],
    [C.ask.start + 0.35, look(2.05, 0.5, su.input.y + 0.04, -10, 4)],
    [M.askUnderstood, look(2.1, 0.5, su.input.y + 0.04, -6, 3)],
    [M.askUnderstood + 0.6, look(2.05, 0.5, su.apply.y + 0.04, 8, 2)],
    [M.askApply, look(2.1, 0.5, su.apply.y + 0.04, 10, 2)],
    [M.askResult + 0.6, look(1.3, 0.5, 0.47, -14, 3)],
    [C.track.start - 0.2, look(1.34, 0.5, 0.47, -10, 3)],
    [C.track.start + 0.7, look(1.75, 0.5, budgetY, 14, 5)],
    [C.ahead.start - 0.2, look(1.8, 0.5, budgetY, 9, 4)],
    [C.ahead.start + 0.6, look(1.2, 0.5, 0.46, -15, 2)],
    [C.ahead.start + 1.6, look(1.24, 0.5, 0.46, -11, 2)],
    [C.ahead.start + 2.4, look(1.95, 0.5, 0.44, 8, 5)],
    [C.only.start - 0.1, look(2.0, 0.5, 0.44, 5, 4)],
    [C.only.start + 0.8, whole],
    [M.dark + 0.2, whole],
    [M.offlineKeys[0], look(1.6, 0.5, 0.25, 11, 3)],
    [M.offlineApply, look(1.64, 0.5, 0.25, 6, 3)],
    [M.offlineResult + 0.6, whole],
    [C.devices.start - 0.1, whole],
    [C.devices.start + 0.8, look(0.8, 0.5, 0.5, 20, 0, 270, 660)],
    [DURATION, look(0.8, 0.5, 0.5, 14, 0, 270, 660)],
  ];
}
function cameraAt(t) {
  if (t <= CAMERA[0][0]) return CAMERA[0][1];
  for (let i = 1; i < CAMERA.length; i++) {
    const [t1, b] = CAMERA[i];
    if (t > t1) continue;
    const [t0, a] = CAMERA[i - 1];
    const p = tween(t, t0, t1, ease.inOutCubic);
    return Object.fromEntries(
      Object.keys(a).map((key) => [key, lerp(a[key], b[key], p)]),
    );
  }
  return CAMERA.at(-1)[1];
}

// ── Which photograph is on the phone ────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
/** Frames typed so far: one photograph per key. */
const typedCount = (t, keys) => keys.filter((k) => t >= k).length;

function shotAt(t) {
  const fade = (from, to, at, len = 0.3) => {
    const mix = tween(t, at, at + len, ease.inOutCubic);
    return mix <= 0 ? [from] : mix >= 1 ? [to] : [from, to, mix];
  };
  if (t < C.where.start + 0.25)
    return fade("list", "charts", C.where.start - 0.2);
  if (t < C.ask.start - 0.25)
    return fade("charts", "charts-categories", C.where.start + 2.55, 0.2);
  if (t < M.askKeys[0])
    return fade("charts-categories", "search-00", C.ask.start - 0.25);
  if (t < M.askUnderstood) return [`search-${pad(typedCount(t, M.askKeys))}`];
  if (t < M.askResult) return ["search-understood"];
  if (t < C.track.start + 0.3)
    return fade("search-result", "budgets", C.track.start - 0.2);
  if (t < C.ahead.start + 0.3)
    return fade("budgets", "calendar", C.ahead.start - 0.2);
  if (t < M.offlineKeys[0] - 0.3)
    return fade("calendar", "dark-list", M.dark, 0.4);
  if (t < M.offlineKeys[0]) return ["offline-00"];
  if (t < M.offlineUnderstood)
    return [`offline-${pad(typedCount(t, M.offlineKeys))}`];
  if (t < M.offlineResult) return ["offline-understood"];
  return fade("offline-result", "dark-charts", C.devices.start + 0.15);
}
let drawn = "";
function draw([a, b, mix]) {
  const key = `${a}|${b ?? ""}|${mix?.toFixed(3) ?? ""}`;
  if (key === drawn) return;
  drawn = key;
  ctx.globalAlpha = 1;
  ctx.drawImage(bitmaps[a], 0, 0, canvas.width, canvas.height);
  if (b) {
    ctx.globalAlpha = mix;
    ctx.drawImage(bitmaps[b], 0, 0, canvas.width, canvas.height);
  }
}

// ── Render ──────────────────────────────────────────────────────────────────
function render(seconds) {
  const t = Math.min(Math.max(seconds, 0), DURATION - 1e-4);
  const pose = cameraAt(t);
  const dark = t >= M.dark;

  // Grounds. Light opens from the phone as the mess lands in it; dark opens
  // from the status bar as the network goes off. Never a fade through grey.
  const lightP = tween(
    t,
    C.turn.start + 0.8,
    C.turn.start + 1.7,
    ease.inOutCubic,
  );
  const centre = place(look(WHOLE, 0.5, 0.5), 0.5, 0.5);
  set(bgLight, {
    clipPath: `circle(${lightP * 2300}px at ${centre.x}px ${centre.y}px)`,
    visibility: t < M.dark + 1.3 ? "visible" : "hidden",
  });
  const darkP = tween(t, M.dark, M.dark + 0.8, ease.inOutCubic);
  const bar = place(look(WHOLE, 0.5, 0.5), 0.86, -0.02);
  set(bgDark, {
    clipPath: `circle(${darkP * 2400}px at ${bar.x}px ${bar.y}px)`,
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
    const landing = look(WHOLE, 0.5, 0.5);
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
        const to = place(landing, w.row.x, w.row.y);
        x = lerp(x, to.x, fly);
        y = lerp(y, to.y, fly);
        size = lerp(1, (w.row.h * SCREEN.h * WHOLE) / 54, fly);
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

  // Phone
  {
    const inP = tween(
      t,
      C.turn.start + 0.05,
      C.turn.start + 0.8,
      ease.outQuart,
    );
    const outP = tween(t, C.end.start - 0.35, C.end.start, ease.inCubic);
    const origin = local(pose.fx, pose.fy);
    set(phone, {
      left: `${pose.cx - origin.x}px`,
      top: `${pose.cy - origin.y + (1 - inP) * 260}px`,
      transformOrigin: `${origin.x}px ${origin.y}px`,
      // Bold enough to read as a turn: a close lens, and a slight roll with it.
      transform: `perspective(1300px) rotateY(${pose.ry * TURN}deg) rotateX(${pose.rx * 1.5}deg) rotateZ(${pose.ry * -0.1}deg) scale(${pose.scale})`,
      opacity: inP * (1 - outP),
      visibility: t >= C.turn.start && t < C.end.start ? "visible" : "hidden",
    });
    draw(shotAt(t));
    const glass = phone.querySelector(".glass");
    set(glass, { background: dark ? "#1e222b" : "#ffffff" });
    set(phone.querySelector(".sb"), { color: dark ? "#fff" : "#111827" });
    const want = dark ? PLANE : "<b>5G</b>";
    if (net.innerHTML !== want) net.innerHTML = want;

    // The hexagon closes around the phone on "Only you."
    const drawP = tween(t, M.onlyYou, M.onlyYou + 0.9, ease.inOutCubic);
    const hexOut = tween(t, C.devices.start - 0.3, C.devices.start);
    set(hex.querySelector("polygon"), {
      strokeDasharray: "1",
      strokeDashoffset: 1 - drawP,
    });
    set(hex, { opacity: (drawP > 0 ? 1 : 0) * (1 - hexOut) });
  }

  // Words
  poseCaption(capWorry, t, -1, C.turn.start + 0.4);
  {
    const out = 1 - tween(t, C.where.start - 0.3, C.where.start, ease.inCubic);
    const p = tween(t, C.turn.start + 1.2, C.turn.start + 1.6);
    set(capBrand, {
      opacity: p * out,
      transform: `translateY(${(1 - p) * 30}px)`,
      visibility:
        t >= C.turn.start + 1.1 && t < C.where.start ? "visible" : "hidden",
    });
  }
  poseCaption(capWhere, t, C.where.start + 0.1, C.ask.start);
  {
    const typed = capTyped.querySelector(".typed");
    const n = typedCount(t, M.askKeys);
    const text = `${NOTES.query.slice(0, n)}<span class="caret"></span>`;
    if (typed.innerHTML !== text) typed.innerHTML = text;
    const out = 1 - tween(t, M.askUnderstood + 0.6, M.askUnderstood + 0.9);
    set(capTyped, {
      opacity: tween(t, C.ask.start + 0.1, C.ask.start + 0.4) * out,
      visibility:
        t >= C.ask.start && t < M.askUnderstood + 0.9 ? "visible" : "hidden",
    });
  }
  {
    const out = poseCaption(capAsk, t, M.askUnderstood + 0.9, C.track.start);
    fadeIn(capAsk.querySelector(".note"), t, M.askUnderstood + 1.6, out);
  }
  poseCaption(capTrack, t, C.track.start + 0.1, C.ahead.start);
  poseCaption(capAhead, t, C.ahead.start + 0.1, C.only.start);
  {
    // The question stays while the picture turns dark and the network goes off.
    const out = poseCaption(capWho, t, C.only.start + 0.1, M.onlyYou);
    capWho.className = `cap on-${dark ? "dark" : "light"}`;
    fadeIn(capWho.querySelector(".note"), t, M.dark + 0.3, out);
  }
  {
    const out = poseCaption(capOnly, t, M.onlyYou, C.devices.start);
    capOnly.querySelectorAll(".proof span").forEach((line, i) => {
      fadeIn(line, t, M.proof[i], out);
    });
  }
  poseCaption(capDevices, t, C.devices.start + 0.55, C.end.start);

  // Device family: the tablet and the desktop arrive beside the phone.
  {
    const out = 1 - tween(t, C.end.start - 0.35, C.end.start, ease.inCubic);
    [
      [tablet, 500, 290, 540, 0.3, 6],
      [desktop, 1080, 400, 800, 0.55, -14],
    ].forEach(([node, x, y, width, delay, turn]) => {
      const p = tween(
        t,
        C.devices.start + delay,
        C.devices.start + delay + 0.7,
        ease.outQuart,
      );
      set(node, {
        left: `${x}px`,
        top: `${y + (1 - p) * 200}px`,
        width: `${width}px`,
        transform: `perspective(1300px) rotateY(${turn * 1.6 + (1 - p) * 24}deg)`,
        opacity: p * out,
        visibility: t >= C.devices.start + delay ? "visible" : "hidden",
      });
    });
  }

  // End card: name, the line in two halves, one action. Then black.
  {
    const s = C.end.start;
    set(end, { visibility: t >= s ? "visible" : "hidden" });
    const logoP = tween(t, s + 0.05, s + 0.6, ease.outQuart);
    set(end.querySelector(".logo-svg"), {
      opacity: logoP,
      transform: `scale(${lerp(0.85, 1, logoP)})`,
    });
    set(end.querySelector("h2"), { opacity: tween(t, s + 0.3, s + 0.7) });
    fadeIn(end.querySelector(".a"), t, s + 0.8);
    fadeIn(end.querySelector(".b"), t, s + 1.35);
    fadeIn(end.querySelector(".badges"), t, s + 1.9);
    fadeIn(end.querySelector(".action"), t, s + 2.3);
    set(black, { opacity: tween(t, DURATION - 0.5, DURATION, ease.inCubic) });
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot() {
  NOTES = await (await fetch("out/shots/notes.json")).json();
  M = moments(NOTES.query.length);
  buildCamera();

  const names = [
    "list",
    "charts",
    "charts-categories",
    "search-understood",
    "search-result",
    "budgets",
    "calendar",
    "dark-list",
    "offline-understood",
    "offline-result",
    "dark-charts",
  ];
  for (let i = 0; i <= NOTES.query.length; i++)
    names.push(`search-${pad(i)}`, `offline-${pad(i)}`);
  // Decoded up front and kept as bitmaps, so no frame is ever drawn blank.
  await Promise.all(
    names.map(async (name) => {
      const blob = await (await fetch(`out/shots/${name}.png`)).blob();
      bitmaps[name] = await createImageBitmap(blob);
    }),
  );

  NOTES.list.rows.slice(0, AMOUNT_SPOTS.length).forEach((row, i) => {
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

  await Promise.all(
    [...document.images].map((img) => img.decode().catch(() => {})),
  );
  await document.fonts.ready;
  window.__render = render;
  render(0);
  window.__filmReady = true;
}
boot().catch((error) => {
  window.__filmError = String(error?.stack ?? error);
  console.error(error);
});

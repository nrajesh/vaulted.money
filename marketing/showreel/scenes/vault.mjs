/**
 * Scene 1 — "Forge the vault" (bar 1).
 *
 * Two sparks ignite at the crown of the shield and race around the outer
 * hexagon. Wherever they pass a vertex, struts fire inward, so the structure
 * builds itself with visible cause and effect. The wireframe is real 3D
 * geometry: it swings round while the gem hexagon stands proud of the frame,
 * then flattens into the exact 2D brand mark as the light cools into silver.
 * The keyhole clicks in, fills with light, and the camera dives through it.
 */
import { CUES, WIDTH, HEIGHT } from "../timeline.mjs";
import {
  clamp,
  ease,
  impulse,
  lerp,
  noise,
  progress,
  tween,
} from "../lib/motion.mjs";
import {
  COLORS,
  INNER,
  KEYHOLE,
  LOGO_HEIGHT,
  OUTER,
  STRUT_WIDTH,
  vertex,
} from "../lib/logo.mjs";

const SCALE = 640 / LOGO_HEIGHT;
const CENTER_X = 960;
const CENTER_Y = 540;
const FOCAL = 1500;

// Forge timings (seconds).
const OUTER_START = 0.1;
const OUTER_END = 0.8;
const INNER_START = 0.82;
const INNER_END = 1.12;
const COOL_START = 1.1;
const COOL_END = 1.4;
const GEM_START = 1.0;
const GEM_END = 1.3;
const KEYHOLE_START = CUES.gemLock - 0.1;
const SETTLE_END = 1.42;
const SHEEN_START = 1.4;
const SHEEN_END = 1.66;
const DIVE_END = CUES.diveImpact;

let canvas;
let context;
let backdropCanvas;
let sprite;

/** Every strut to draw, with its own start time, duration and easing. */
const strokes = [];
/** Moments a spark arrives at a vertex (for the little impact rings). */
const arrivals = [];

/** Depth of each vertex when the wireframe is fully 3D (logo units). */
function depthOf(name) {
  const index = Number(name.slice(1));
  if (name[0] === "O") return index % 2 === 0 ? 55 : -55;
  return -170 + (index % 2 === 0 ? 25 : -25);
}

const lengthOf = (a, b) => {
  const [x1, y1] = vertex(a);
  const [x2, y2] = vertex(b);
  return Math.hypot(x2 - x1, y2 - y1);
};

/**
 * A chain of vertices drawn as one continuous spark. Each edge gets a slice
 * of the eased progress proportional to its length, so the spark keeps a
 * constant speed along the path.
 */
function addChain(names, start, end, easing) {
  const lengths = names
    .slice(1)
    .map((name, index) => lengthOf(names[index], name));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let travelled = 0;
  names.slice(1).forEach((name, index) => {
    const from = travelled / total;
    travelled += lengths[index];
    const to = travelled / total;
    strokes.push({
      from: names[index],
      to: name,
      chain: { start, end, easing, from, to },
    });
    arrivals.push({
      vertex: name,
      time: timeAtFraction(start, end, easing, to),
    });
  });
}

/** Inverse of an eased chain: when does its progress reach `fraction`? */
function timeAtFraction(start, end, easing, fraction) {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 30; step++) {
    const middle = (low + high) / 2;
    if (easing(middle) < fraction) low = middle;
    else high = middle;
  }
  return lerp(start, end, (low + high) / 2);
}

function addStrut(from, to, start, duration, easing = ease.outCubic) {
  strokes.push({ from, to, single: { start, duration, easing } });
  arrivals.push({ vertex: to, time: start + duration * 0.92 });
}

function buildChoreography() {
  if (strokes.length) return;
  const ringEase = ease.inOutCubic;
  addChain(["O0", "O1", "O2", "O3"], OUTER_START, OUTER_END, ringEase);
  addChain(["O0", "O5", "O4", "O3"], OUTER_START, OUTER_END, ringEase);

  const passes = (name) =>
    arrivals.find((arrival) => arrival.vertex === name)?.time ?? OUTER_START;

  // Radials shoot inward the moment the spark passes each outer vertex.
  addStrut("O0", "I0", OUTER_START + 0.04, 0.26);
  for (const index of [1, 5, 2, 4]) {
    addStrut(`O${index}`, `I${index}`, passes(`O${index}`), 0.24);
  }
  addStrut("O3", "I3", OUTER_END - 0.02, 0.22);

  // Cross-bracing follows a beat behind, like reinforcement going in.
  addStrut("O0", "I1", OUTER_START + 0.14, 0.32, ease.inOutCubic);
  addStrut("O0", "I5", OUTER_START + 0.14, 0.32, ease.inOutCubic);
  addStrut("O1", "I2", passes("O1") + 0.06, 0.3, ease.inOutCubic);
  addStrut("O5", "I4", passes("O5") + 0.06, 0.3, ease.inOutCubic);
  addStrut("O2", "I1", passes("O2") + 0.04, 0.3, ease.inOutCubic);
  addStrut("O4", "I5", passes("O4") + 0.04, 0.3, ease.inOutCubic);
  addStrut("O2", "I3", passes("O2") + 0.1, 0.28, ease.inOutCubic);
  addStrut("O4", "I3", passes("O4") + 0.1, 0.28, ease.inOutCubic);
  addStrut("O3", "I2", OUTER_END - 0.04, 0.26, ease.inOutCubic);
  addStrut("O3", "I4", OUTER_END - 0.04, 0.26, ease.inOutCubic);

  addChain(["I0", "I1", "I2", "I3"], INNER_START, INNER_END, ease.inOutCubic);
  addChain(["I0", "I5", "I4", "I3"], INNER_START, INNER_END, ease.inOutCubic);
}

function strokeProgress(stroke, t) {
  if (stroke.chain) {
    const { start, end, easing, from, to } = stroke.chain;
    const travelled = easing(progress(t, start, end));
    return clamp((travelled - from) / (to - from));
  }
  const { start, duration, easing } = stroke.single;
  return easing(progress(t, start, start + duration));
}

/** A soft round light, pre-rendered once and stamped with additive blending. */
function makeSprite() {
  const size = 128;
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = spriteCanvas.height = size;
  const ctx = spriteCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(220,255,255,0.9)");
  gradient.addColorStop(0.35, "rgba(110,220,232,0.35)");
  gradient.addColorStop(1, "rgba(60,170,200,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return spriteCanvas;
}

/**
 * When each spark lands on a vertex. Pure data (no DOM), so the soundtrack
 * can put a tick exactly where the picture has a flash.
 */
export function forgeArrivals() {
  buildChoreography();
  return arrivals.map((arrival) => arrival.time).sort((a, b) => a - b);
}

export function mount() {
  canvas = document.getElementById("vault");
  context = canvas.getContext("2d");
  backdropCanvas = document.getElementById("backdrop");
  sprite = makeSprite();
  buildChoreography();
}

/** Camera and object pose for the 3D wireframe at time t. */
function pose(t) {
  const settle = ease.outCubic(progress(t, 0, SETTLE_END));
  const flatten = ease.inOutCubic(progress(t, 0.75, SETTLE_END));
  return {
    yaw: lerp(-0.72, 0, settle) + noise(t * 0.7, 11) * 0.02 * (1 - settle),
    pitch: lerp(0.42, 0, settle),
    roll: lerp(-0.1, 0, settle),
    depth: 1 - flatten,
    scale:
      lerp(0.8, 1, settle) +
      0.025 * ease.outSine(progress(t, SETTLE_END, DIVE_END)),
  };
}

function project(lx, ly, lz, p) {
  const x = lx * SCALE;
  const y = ly * SCALE;
  const z = lz * SCALE * p.depth;
  const cosYaw = Math.cos(p.yaw);
  const sinYaw = Math.sin(p.yaw);
  const x1 = x * cosYaw + z * sinYaw;
  const z1 = -x * sinYaw + z * cosYaw;
  const cosPitch = Math.cos(p.pitch);
  const sinPitch = Math.sin(p.pitch);
  const y1 = y * cosPitch - z1 * sinPitch;
  const z2 = y * sinPitch + z1 * cosPitch;
  const cosRoll = Math.cos(p.roll);
  const sinRoll = Math.sin(p.roll);
  const x2 = x1 * cosRoll - y1 * sinRoll;
  const y2 = x1 * sinRoll + y1 * cosRoll;
  const perspective = FOCAL / (FOCAL + z2);
  return [x2 * perspective * p.scale, y2 * perspective * p.scale, z2];
}

const projectVertex = (name, p) => {
  const [x, y] = vertex(name);
  return project(x, y, depthOf(name), p);
};

/** Head of a stroke (where its spark is) at time t, or null if idle. */
function headOf(stroke, t, p) {
  const amount = strokeProgress(stroke, t);
  if (amount <= 0 || amount >= 1) return null;
  const a = projectVertex(stroke.from, p);
  const b = projectVertex(stroke.to, p);
  return [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount)];
}

function traceGem(ctx, p) {
  ctx.beginPath();
  INNER.forEach(([x, y], index) => {
    const [px, py] = project(x, y, depthOf(`I${index}`), p);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

function traceKeyhole(ctx, p, grow = 1) {
  const gemDepth = depthOf("I0");
  const { circle, stem } = KEYHOLE;
  const pivotY = 20;
  const pt = (x, y) =>
    project(x * grow, pivotY + (y - pivotY) * grow, gemDepth, p);
  ctx.beginPath();
  const [cx, cy] = pt(circle.x, circle.y);
  const [ex] = pt(circle.x + circle.r, circle.y);
  // The arc starts and ends where the flared stem meets the circle.
  const join = Math.asin(stem[1][0] / circle.r);
  ctx.arc(cx, cy, Math.abs(ex - cx), Math.PI / 2 + join, Math.PI * 2.5 - join);
  ctx.lineTo(...pt(stem[2][0], stem[2][1]));
  ctx.lineTo(...pt(stem[3][0], stem[3][1]));
  ctx.closePath();
}

export function render(t) {
  if (t >= DIVE_END) {
    canvas.classList.add("hidden");
    return;
  }
  canvas.classList.remove("hidden");
  const ctx = context;
  const p = pose(t);

  // Dive: exponential zoom into the keyhole, with a little roll for energy.
  const diveAmount = progress(t, CUES.diveStart, DIVE_END);
  const zoom = Math.pow(110, ease.inQuart(diveAmount));
  const diveRoll = ease.inCubic(diveAmount) * 0.25;
  const focusY = 24 * SCALE * p.scale;
  const shake = impulse(t, CUES.gemLock, 16) * 7;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Everything below lives in "camera space" centred on the shield.
  ctx.translate(
    CENTER_X + noise(t * 30, 1) * shake,
    CENTER_Y + noise(t * 30, 2) * shake,
  );
  ctx.rotate(diveRoll);
  ctx.scale(zoom, zoom);
  ctx.translate(0, -focusY * (1 - 1 / zoom));

  // The backdrop zooms with us, so the whole world rushes past.
  ctx.drawImage(backdropCanvas, -CENTER_X, -CENTER_Y);

  // ── Gem: an iris of light opens across the inner hexagon ────────────────
  const gemAmount = tween(t, GEM_START, GEM_END, ease.outCubic);
  if (gemAmount > 0) {
    ctx.save();
    traceGem(ctx, p);
    ctx.clip();
    const [gx, gy] = project(0, -8, depthOf("I0"), p);
    const iris = gemAmount * 360 * SCALE * p.scale * 1.4;
    const fill = ctx.createLinearGradient(
      gx - 150,
      gy - 220,
      gx + 90,
      gy + 220,
    );
    fill.addColorStop(0, COLORS.gemLight);
    fill.addColorStop(0.55, COLORS.gem);
    fill.addColorStop(1, COLORS.gemDeep);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(gx, gy, iris, 0, Math.PI * 2);
    ctx.fill();
    // Facets: darker right half, lighter crown.
    const [topX, topY] = project(0, -265, depthOf("I0"), p);
    const [bottomX, bottomY] = project(0, 248, depthOf("I3"), p);
    const [rightTopX, rightTopY] = project(193, -180, depthOf("I1"), p);
    const [rightBottomX, rightBottomY] = project(193, 145, depthOf("I2"), p);
    ctx.fillStyle = "rgba(10, 60, 70, 0.12)";
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(rightTopX, rightTopY);
    ctx.lineTo(rightBottomX, rightBottomY);
    ctx.lineTo(bottomX, bottomY);
    ctx.closePath();
    ctx.fill();
    // Hot core that cools as the gem settles.
    const heat = 1 - progress(t, GEM_START + 0.1, COOL_END + 0.1);
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 170);
    glow.addColorStop(0, `rgba(230,255,255,${0.4 + heat * 0.6})`);
    glow.addColorStop(1, "rgba(230,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(gx - 200, gy - 200, 400, 400);
    ctx.restore();
  }

  // ── Struts: forged as light, cooled into silver ─────────────────────────
  const cool = ease.inOutCubic(progress(t, COOL_START, COOL_END));
  const drawn = [];
  for (const stroke of strokes) {
    const amount = strokeProgress(stroke, t);
    if (amount <= 0) continue;
    const a = projectVertex(stroke.from, p);
    const b = projectVertex(stroke.to, p);
    drawn.push([
      a[0],
      a[1],
      lerp(a[0], b[0], amount),
      lerp(a[1], b[1], amount),
    ]);
  }
  const tracePaths = () => {
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of drawn) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (cool > 0) {
    const silver = ctx.createLinearGradient(-300, -330, 300, 330);
    silver.addColorStop(0, COLORS.silverLight);
    silver.addColorStop(0.55, COLORS.silver);
    silver.addColorStop(1, COLORS.silverDark);
    ctx.globalAlpha = cool;
    ctx.strokeStyle = silver;
    ctx.lineWidth = lerp(3, STRUT_WIDTH * SCALE * p.scale, ease.outCubic(cool));
    tracePaths();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (cool < 1) {
    ctx.globalCompositeOperation = "lighter";
    const glowPasses = [
      [22, "rgba(60, 190, 215, 0.07)"],
      [9, "rgba(110, 225, 238, 0.22)"],
      [2.4, "rgba(230, 255, 255, 0.95)"],
    ];
    for (const [width, color] of glowPasses) {
      ctx.globalAlpha = 1 - cool;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      tracePaths();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Sparks, with a comet trail sampled from their own recent past.
    for (const stroke of strokes) {
      const head = headOf(stroke, t, p);
      if (!head) continue;
      for (let step = 6; step >= 1; step--) {
        const past = headOf(stroke, t - step * 0.01, p);
        if (!past) continue;
        const size = 26 - step * 3;
        ctx.globalAlpha = 0.5 - step * 0.07;
        ctx.drawImage(
          sprite,
          past[0] - size / 2,
          past[1] - size / 2,
          size,
          size,
        );
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite, head[0] - 34, head[1] - 34, 68, 68);
      // Anamorphic streak.
      const streak = ctx.createLinearGradient(
        head[0] - 110,
        0,
        head[0] + 110,
        0,
      );
      streak.addColorStop(0, "rgba(90,200,255,0)");
      streak.addColorStop(0.5, "rgba(170,235,255,0.55)");
      streak.addColorStop(1, "rgba(90,200,255,0)");
      ctx.fillStyle = streak;
      ctx.fillRect(head[0] - 110, head[1] - 1, 220, 2);
    }

    // Impact rings where sparks land on a vertex.
    for (const arrival of arrivals) {
      const age = t - arrival.time;
      if (age < 0 || age > 0.35) continue;
      const [x, y] = projectVertex(arrival.vertex, p);
      const ring = ease.outCubic(age / 0.35);
      ctx.globalAlpha = (1 - ring) * 0.8 * (1 - cool);
      ctx.strokeStyle = "rgba(170, 240, 248, 1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 6 + ring * 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - ring) * (1 - cool);
      ctx.drawImage(sprite, x - 20, y - 20, 40, 40);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // Ignition flash at the crown.
  const ignite = impulse(t, CUES.ignite, 5) * (t >= CUES.ignite ? 1 : 0);
  if (ignite > 0.01) {
    const [x, y] = projectVertex("O0", p);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = ignite;
    ctx.drawImage(sprite, x - 120, y - 120, 240, 240);
    const flare = ctx.createLinearGradient(x - 500, 0, x + 500, 0);
    flare.addColorStop(0, "rgba(80,190,255,0)");
    flare.addColorStop(0.5, "rgba(190,240,255,0.8)");
    flare.addColorStop(1, "rgba(80,190,255,0)");
    ctx.fillStyle = flare;
    ctx.fillRect(x - 500, y - 1.5, 1000, 3);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // ── Sheen: one clean pass of light across the finished metal ────────────
  const sheen = progress(t, SHEEN_START, SHEEN_END);
  if (sheen > 0 && sheen < 1) {
    const offset = lerp(-700, 700, ease.inOutSine(sheen));
    const band = ctx.createLinearGradient(
      offset - 160,
      -300,
      offset + 160,
      300,
    );
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.5, "rgba(255,255,255,0.75)");
    band.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = band;
    ctx.lineWidth = STRUT_WIDTH * SCALE * p.scale * 0.55;
    tracePaths();
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = band;
    traceGem(ctx, p);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // ── Keyhole: clicks in, then floods with light as we dive through it ────
  const keyGrow = ease.outBack(
    progress(t, KEYHOLE_START, KEYHOLE_START + 0.2),
    2.4,
  );
  if (keyGrow > 0.001) {
    const light = ease.inOutCubic(
      progress(t, CUES.diveStart, CUES.diveStart + 0.14),
    );
    const r = Math.round(lerp(28, 240, light));
    const g = Math.round(lerp(90, 255, light));
    const b = Math.round(lerp(100, 255, light));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    traceKeyhole(ctx, p, keyGrow);
    ctx.fill();
    if (light > 0) {
      // Light spilling out of the keyhole; by the downbeat it fills the
      // frame and the finishing flash hands over to scene 2.
      const [kx, ky] = project(0, 0, depthOf("I0"), p);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = light * 0.85;
      ctx.drawImage(sprite, kx - 150, ky - 170, 300, 340);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

/**
 * The world behind everything: a deep night gradient, the honeycomb grid
 * (the brand's hexagon, tiled) and drifting dust with depth of field.
 *
 * Shockwaves ripple through the grid on the big hits, so the background
 * "hears" the music too.
 */
import { CUES, WIDTH, HEIGHT } from "../timeline.mjs";
import { clamp, lerp, noise, progress, random, ease } from "../lib/motion.mjs";

let context;

const HEX_RADIUS = 44;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_ROW = HEX_RADIUS * 1.5;

/** Grid shockwaves: when, where, how fast (px/s). */
export const WAVES = [
  { time: CUES.ignite, x: 960, y: 245, speed: 1500, strength: 0.9 },
  { time: CUES.diveImpact, x: 960, y: 540, speed: 2600, strength: 1 },
  { time: CUES.noCloud, x: 1400, y: 540, speed: 2200, strength: 0.7 },
  { time: CUES.desktopIn, x: 1290, y: 560, speed: 2400, strength: 0.6 },
  { time: CUES.categorizeClick, x: 1100, y: 420, speed: 2200, strength: 0.5 },
  { time: CUES.budgets, x: 1290, y: 560, speed: 2600, strength: 0.5 },
  { time: CUES.reports, x: 1050, y: 640, speed: 2600, strength: 0.6 },
  { time: CUES.everywhere, x: 960, y: 560, speed: 2600, strength: 0.7 },
  { time: CUES.lockup, x: 960, y: 430, speed: 2000, strength: 1.2 },
];

const hexCenters = [];
const dust = [];

export function mount() {
  context = document.getElementById("backdrop").getContext("2d");

  for (let row = -1; row * HEX_ROW < HEIGHT + HEX_ROW; row++) {
    for (let column = -1; column * HEX_WIDTH < WIDTH + HEX_WIDTH; column++) {
      hexCenters.push({
        x: column * HEX_WIDTH + (row % 2 ? HEX_WIDTH / 2 : 0),
        y: row * HEX_ROW,
      });
    }
  }

  const rand = random(7);
  for (let index = 0; index < 90; index++) {
    const depth = rand();
    dust.push({
      x: rand() * WIDTH,
      y: rand() * HEIGHT,
      depth,
      // Near motes are big, soft and faint; far ones are crisp pinpoints.
      radius: depth > 0.88 ? lerp(18, 46, rand()) : lerp(0.6, 2.2, rand()),
      alpha:
        depth > 0.88 ? lerp(0.025, 0.06, rand()) : lerp(0.12, 0.45, rand()),
      drift: lerp(6, 26, rand()),
      phase: rand() * 100,
    });
  }
}

/** How visible the grid is overall. It grows out of the first spark. */
function gridBaseAlpha(t) {
  if (t < CUES.diveImpact) return 0.05 * ease.outCubic(progress(t, 0.1, 1.2));
  if (t > CUES.lockup - 0.3)
    return lerp(0.05, 0.03, progress(t, CUES.lockup - 0.3, CUES.lockup));
  return 0.05;
}

function waveBoost(x, y, t) {
  let boost = 0;
  for (const wave of WAVES) {
    const age = t - wave.time;
    if (age < 0 || age > 1.6) continue;
    const radius = age * wave.speed;
    const distance = Math.hypot(x - wave.x, y - wave.y);
    const band = Math.exp(-Math.pow((distance - radius) / 120, 2));
    boost += band * wave.strength * Math.exp(-age * 1.8);
  }
  return boost;
}

function traceHex(x, y, radius) {
  for (let corner = 0; corner < 6; corner++) {
    const angle = (Math.PI / 3) * corner - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (corner === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
}

export function render(t) {
  const ctx = context;

  // Base: a pool of cold light that breathes slowly.
  const glowX = 960 + noise(t * 0.25, 3) * 120;
  const glowY = 500 + noise(t * 0.2, 5) * 60;
  const base = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 1250);
  base.addColorStop(0, "#102330");
  base.addColorStop(0.45, "#0a141d");
  base.addColorStop(1, "#04070b");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Honeycomb grid, drifting slowly, reveal radiating from the first spark.
  const baseAlpha = gridBaseAlpha(t);
  const driftX = (t * 9) % HEX_WIDTH;
  const driftY = (t * 5) % (HEX_ROW * 2);
  const revealRadius =
    t < CUES.diveImpact ? ease.outCubic(progress(t, 0.05, 1.5)) * 1800 : 99999;
  const buckets = new Map();
  for (const center of hexCenters) {
    const x = center.x - driftX;
    const y = center.y - driftY;
    const reveal = clamp((revealRadius - Math.hypot(x - 960, y - 245)) / 300);
    const vignette = 1 - clamp(Math.hypot(x - 960, y - 540) / 1300) * 0.6;
    const alpha = (baseAlpha * vignette + waveBoost(x, y, t) * 0.32) * reveal;
    if (alpha < 0.004) continue;
    const key = Math.round(alpha * 200);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push([x, y]);
  }
  ctx.lineWidth = 1.2;
  for (const [key, centers] of buckets) {
    ctx.strokeStyle = `rgba(130, 225, 235, ${Math.min(key / 200, 0.9)})`;
    ctx.beginPath();
    for (const [x, y] of centers) traceHex(x, y, HEX_RADIUS - 3);
    ctx.stroke();
  }

  // Dust with parallax: near motes move faster than far ones.
  for (const mote of dust) {
    const speed = 0.3 + mote.depth * 1.4;
    const x =
      (mote.x + t * mote.drift * speed + noise(t * 0.4 + mote.phase) * 20) %
      (WIDTH + 100);
    const y =
      (mote.y - t * mote.drift * 0.6 * speed + HEIGHT * 4) % (HEIGHT + 100);
    const fadeIn = clamp(t / 0.8);
    ctx.fillStyle = `rgba(160, 235, 240, ${mote.alpha * fadeIn})`;
    ctx.beginPath();
    ctx.arc(x - 50, y - 50, mote.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

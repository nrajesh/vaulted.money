/**
 * Scene 3 — "No cloud. No trackers. No subscriptions." (bar 3).
 *
 * One line per beat, each with a Lucide icon that draws itself and is then
 * slashed through. Around the phone a hexagonal force field — the vault —
 * catches every data packet that tries to leave: packets fly out, strike
 * the field, light up the honeycomb where they hit and fall back home.
 */
import { CUES, beat } from "../timeline.mjs";
import {
  clamp,
  ease,
  impulse,
  lerp,
  progress,
  random,
} from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { fxContext } from "../lib/fx.mjs";

const SHIELD_X = 1400;
const SHIELD_Y = 540;
const SHIELD_RADIUS = 500;
const SHIELD_INRADIUS = SHIELD_RADIUS * Math.cos(Math.PI / 6);
const CELL = 30;
const START = CUES.noCloud - 0.15;
const EXIT = beat(15.1);
const END = beat(16.2);

const LINES = [
  { time: CUES.noCloud, icon: "cloud-off", noun: "cloud." },
  { time: CUES.noTrackers, icon: "eye-off", noun: "trackers." },
  {
    time: CUES.noSubscriptions,
    icon: "credit-card",
    noun: "subscriptions.",
    slash: true,
  },
];
const CAPTION = "EVERYTHING STAYS ON YOUR DEVICE";
const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>";

let root;
let lineElements;
let caption;
let captionText;
const packets = [];
const cells = [];

export function mount() {
  root = html(`
    <section class="privacy">
      ${LINES.map(
        (line) => `
        <div class="privacy-line">
          <span class="privacy-icon">
            ${icon(line.icon, 84)}
            ${line.slash ? `<svg class="icon slash" width="84" height="84" viewBox="0 0 24 24"><path d="m2 2 20 20" /></svg>` : ""}
          </span>
          <span class="privacy-text">${glyphs("No", "privacy-no")}&nbsp;${glyphs(line.noun)}</span>
        </div>`,
      ).join("")}
      <div class="privacy-caption">${icon("shield-check", 26)}<span></span></div>
    </section>`);
  document.getElementById("type-layer").append(root);
  lineElements = [...root.querySelectorAll(".privacy-line")];
  caption = root.querySelector(".privacy-caption");
  captionText = caption.querySelector("span");

  // Every icon stroke gets a normalised length so it can draw on.
  for (const path of root.querySelectorAll(
    ".privacy-icon path, .privacy-icon line, .privacy-icon rect",
  )) {
    path.setAttribute("pathLength", "1");
  }

  // Data packets: launched from the phone, caught by the field.
  const rand = random(42);
  for (let index = 0; index < 150; index++) {
    const angle = rand() * Math.PI * 2;
    packets.push({
      launch: lerp(CUES.noCloud - 0.05, beat(14.8), rand()),
      angle,
      speed: lerp(700, 1300, rand()),
      originX: SHIELD_X + lerp(-120, 120, rand()),
      originY: SHIELD_Y + lerp(-280, 280, rand()),
      size: lerp(2, 4.5, rand()),
    });
  }

  // Honeycomb cells inside the field, for hit flashes.
  const rowHeight = CELL * 1.5;
  const columnWidth = CELL * Math.sqrt(3);
  for (let row = -14; row <= 14; row++) {
    for (let column = -12; column <= 12; column++) {
      const x =
        SHIELD_X + column * columnWidth + (row % 2 ? columnWidth / 2 : 0);
      const y = SHIELD_Y + row * rowHeight;
      if (
        distanceToEdge(Math.atan2(y - SHIELD_Y, x - SHIELD_X)) -
          Math.hypot(x - SHIELD_X, y - SHIELD_Y) >
        CELL * 0.6
      ) {
        cells.push({ x, y });
      }
    }
  }
}

/** Distance from the field's centre to its edge in direction `angle`. */
function distanceToEdge(angle) {
  const sector = Math.PI / 3;
  const local =
    (((((angle % sector) + sector) % sector) + sector / 2) % sector) -
    sector / 2;
  return SHIELD_INRADIUS / Math.cos(local);
}

/** Where a packet is: outbound, then bounced back and fading. */
function packetState(packet, t) {
  const age = t - packet.launch;
  if (age < 0) return null;
  const edge = distanceToEdge(packet.angle) - 8;
  const startDistance =
    Math.hypot(packet.originX - SHIELD_X, packet.originY - SHIELD_Y) * 0.4;
  const travel = startDistance + age * packet.speed;
  const hitAge = (edge - startDistance) / packet.speed;
  let distance = travel;
  let alpha = 1;
  let bounced = false;
  if (travel > edge) {
    bounced = true;
    const after = age - hitAge;
    distance = edge - after * packet.speed * 0.45;
    alpha = Math.max(0, 1 - after / 0.5);
  }
  const ux = Math.cos(packet.angle);
  const uy = Math.sin(packet.angle);
  const blend = clamp(age * 3);
  return {
    x: lerp(packet.originX, SHIELD_X, blend) + ux * distance,
    y: lerp(packet.originY, SHIELD_Y, blend) + uy * distance,
    alpha,
    bounced,
    hitTime: packet.launch + hitAge,
    hitX: SHIELD_X + ux * edge,
    hitY: SHIELD_Y + uy * edge,
  };
}

function traceHex(ctx, x, y, radius) {
  for (let corner = 0; corner < 6; corner++) {
    const angle = (Math.PI / 3) * corner - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (corner === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawShield(t) {
  const ctx = fxContext();
  const appear = ease.outBack(
    progress(t, CUES.noCloud - 0.05, CUES.noCloud + 0.45),
    1.4,
  );
  const vanish = ease.inCubic(progress(t, EXIT - 0.05, EXIT + 0.3));
  const presence = clamp(appear) * (1 - vanish);
  if (presence <= 0) return;
  const pulse = Math.max(
    ...LINES.map((line) => impulse(t, line.time, 7)),
    impulse(t, CUES.onDevice, 6),
  );
  const scale =
    lerp(0.82, 1, appear) * (1 + 0.015 * pulse) * lerp(1, 1.25, vanish);

  ctx.save();
  ctx.translate(SHIELD_X, SHIELD_Y);
  ctx.scale(scale, scale);
  ctx.translate(-SHIELD_X, -SHIELD_Y);

  // Faint honeycomb body, brighter where packets strike.
  const hits = [];
  for (const packet of packets) {
    const state = packetState(packet, t);
    if (state?.bounced && t - state.hitTime < 0.55) hits.push(state);
  }
  ctx.lineWidth = 1.2;
  for (const cell of cells) {
    let glow = 0.035 + pulse * 0.05;
    for (const hit of hits) {
      const distance = Math.hypot(cell.x - hit.hitX, cell.y - hit.hitY);
      const age = t - hit.hitTime;
      glow += Math.exp(-Math.pow(distance / 70, 2)) * Math.exp(-age * 6) * 0.9;
    }
    ctx.strokeStyle = `rgba(120, 225, 238, ${Math.min(glow, 0.95) * presence})`;
    ctx.beginPath();
    traceHex(ctx, cell.x, cell.y, CELL - 3);
    ctx.stroke();
  }

  // The field's edge.
  for (const [width, alpha] of [
    [14, 0.06],
    [5, 0.2],
    [1.8, 0.85],
  ]) {
    ctx.lineWidth = width;
    ctx.strokeStyle = `rgba(150, 235, 245, ${alpha * presence * (0.7 + pulse * 0.6)})`;
    ctx.beginPath();
    traceHex(ctx, SHIELD_X, SHIELD_Y, SHIELD_RADIUS);
    ctx.stroke();
  }

  // Packets.
  for (const packet of packets) {
    const state = packetState(packet, t);
    if (!state || state.alpha <= 0) continue;
    // A short streak along the direction of travel.
    const direction = state.bounced ? -1 : 1;
    const tailX = state.x - Math.cos(packet.angle) * 22 * direction;
    const tailY = state.y - Math.sin(packet.angle) * 22 * direction;
    ctx.strokeStyle = `rgba(210, 250, 255, ${state.alpha * presence})`;
    ctx.lineWidth = packet.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(state.x, state.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(110, 220, 235, ${0.25 * state.alpha * presence})`;
    ctx.beginPath();
    ctx.arc(state.x, state.y, packet.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function scrambled(t, start) {
  let text = "";
  CAPTION.split("").forEach((character, index) => {
    const settle = start + index * 0.018;
    if (character === " ") text += " ";
    else if (t >= settle) text += character;
    else if (t >= settle - 0.2) {
      text += SCRAMBLE[(Math.floor(t * 40) * 7 + index * 13) % SCRAMBLE.length];
    }
  });
  return text;
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  drawShield(t);
  if (!visible) return;

  lineElements.forEach((element, index) => {
    const line = LINES[index];
    // Icon strokes draw on; the slash lands last, on the beat.
    const strokes = element.querySelectorAll(
      ".privacy-icon path, .privacy-icon line, .privacy-icon rect",
    );
    strokes.forEach((stroke, strokeIndex) => {
      const isSlash = stroke.getAttribute("d") === "m2 2 20 20";
      const start = isSlash
        ? line.time + 0.1
        : line.time - 0.12 + strokeIndex * 0.04;
      const amount = ease.outCubic(
        progress(t, start, start + (isSlash ? 0.16 : 0.32)),
      );
      style(stroke, { strokeDasharray: 1, strokeDashoffset: 1 - amount });
    });
    element.querySelectorAll(".glyph").forEach((glyph, glyphIndex) => {
      const amount = ease.outExpo(
        progress(
          t,
          line.time - 0.1 + glyphIndex * 0.014,
          line.time + 0.35 + glyphIndex * 0.014,
        ),
      );
      style(glyph, { transform: `translateY(${(1 - amount) * 110}%)` });
    });
    const dim = ease.inOutCubic(
      progress(t, CUES.onDevice - 0.05, CUES.onDevice + 0.25),
    );
    const exit = ease.inExpo(
      progress(t, EXIT - 0.1 + index * 0.04, EXIT + 0.28 + index * 0.04),
    );
    const kick = impulse(t, line.time + 0.1, 10);
    style(element, {
      opacity: (1 - dim * 0.55) * (1 - exit),
      transform: `translateX(${-exit * 700}px) scale(${1 + kick * 0.03})`,
    });
  });

  const captionIn = ease.outExpo(
    progress(t, CUES.onDevice - 0.05, CUES.onDevice + 0.4),
  );
  const captionExit = ease.inExpo(progress(t, EXIT + 0.05, EXIT + 0.4));
  style(caption, {
    opacity: captionIn * (1 - captionExit),
    transform: `translateY(${(1 - captionIn) * 20}px) translateX(${-captionExit * 700}px)`,
  });
  captionText.textContent = scrambled(t, CUES.onDevice);
}

/**
 * Bars 25–27 — the lockup.
 *
 * Everything that came before collapses into one point; on the downbeat the
 * shield assembles from its own struts, flung in from all directions and
 * caught by springs (the opening drew it; the ending builds it). The gem and
 * keyhole snap in, the wordmark rises and a single pass of light crosses the
 * metal. Then the tagline: the three badges from the vaulted.money hero
 * (Privacy-first, Data-local, Open-sourced) pop in one by one and hold, with
 * the address beneath. The last beat fades to black so the film loops
 * cleanly back into its first spark.
 */
import { CUES, DURATION, beat } from "../timeline.mjs";
import {
  clamp,
  ease,
  impulse,
  lerp,
  noise,
  progress,
  random,
  spring,
} from "../lib/motion.mjs";
import { glyphs, html, show, style } from "../lib/dom.mjs";
import { ALL_STRUTS, logoSvg, vertex } from "../lib/logo.mjs";
import { fxContext } from "../lib/fx.mjs";

const LOGO_HEIGHT_PX = 400;
const LOGO_CENTER_Y = 400;
const FADE_OUT = DURATION - 0.32;

let root;
let logo;
let struts;
let gem;
let keyhole;
let shineGradient;
let wordmark;
let wordGlyphs;
let badges;
let footer;
let fade;
const flights = [];
const rays = [];

export function mount() {
  root = html(`
    <section class="lockup">
      <div class="lockup-logo">${logoSvg("lockup")}</div>
      <div class="wordmark">${glyphs("Vaulted Money")}</div>
      <div class="lockup-badges">
        <span class="badge-private">Privacy-first</span>
        <span class="badge-local">Data-local</span>
        <span class="badge-open">Open-sourced</span>
      </div>
      <div class="lockup-footer"><i></i><span>VAULTED.MONEY · WEB · DESKTOP · MOBILE</span><i></i></div>
    </section>`);
  fade = html(`<div class="fade-to-black"></div>`);
  document.getElementById("lockup-layer").append(root, fade);
  logo = root.querySelector(".lockup-logo");
  struts = [...root.querySelectorAll("[data-strut]")];
  gem = root.querySelector(".logo-gem");
  keyhole = root.querySelector(".logo-keyhole");
  shineGradient = root.querySelector(".shine-gradient");
  wordmark = root.querySelector(".wordmark");
  wordGlyphs = [...wordmark.querySelectorAll(".glyph")];
  badges = [...root.querySelectorAll(".lockup-badges span")];
  footer = root.querySelector(".lockup-footer");

  // Each strut starts somewhere out in the dark, flung outward from its own
  // midpoint, spinning, and is caught by a spring on its way home.
  const rand = random(2026);
  ALL_STRUTS.forEach(([from, to], index) => {
    const [x1, y1] = vertex(from);
    const [x2, y2] = vertex(to);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const angle = Math.atan2(midY, midX) + (rand() - 0.5) * 1.2;
    const distance = lerp(700, 1500, rand());
    flights.push({
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      spin: (rand() - 0.5) * 540,
      delay: rand() * 0.16,
    });
  });

  const rayRand = random(99);
  for (let index = 0; index < 64; index++) {
    rays.push({
      angle: rayRand() * Math.PI * 2,
      speed: lerp(900, 2600, rayRand()),
      length: lerp(40, 180, rayRand()),
      width: lerp(1, 3, rayRand()),
    });
  }

  // Lay one continuous gradient across the whole wordmark, even though each
  // glyph is its own span: every glyph offsets the background by its x.
  const width = wordmark.getBoundingClientRect().width;
  const left = wordmark.getBoundingClientRect().left;
  wordGlyphs.forEach((glyph) => {
    const offset = glyph.getBoundingClientRect().left - left;
    glyph.dataset.offset = String(offset);
    glyph.style.backgroundSize = `${width}px 100%, ${width}px 100%`;
  });
  wordmark.dataset.width = String(width);
}

function drawBurst(t) {
  const age = t - CUES.lockup;
  if (age < 0 || age > 0.9) return;
  const ctx = fxContext();
  const x = 960;
  const y = LOGO_CENTER_Y;
  // Shockwave.
  const ring = ease.outCubic(clamp(age / 0.7));
  ctx.strokeStyle = `rgba(170, 240, 248, ${(1 - ring) * 0.8})`;
  ctx.lineWidth = 6 * (1 - ring) + 1;
  ctx.beginPath();
  ctx.arc(x, y, 40 + ring * 900, 0, Math.PI * 2);
  ctx.stroke();
  // Light rays.
  ctx.lineCap = "round";
  for (const ray of rays) {
    const head = 60 + age * ray.speed;
    const alpha = Math.max(0, 1 - age / 0.6);
    ctx.strokeStyle = `rgba(200, 248, 255, ${alpha * 0.8})`;
    ctx.lineWidth = ray.width;
    ctx.beginPath();
    ctx.moveTo(
      x + Math.cos(ray.angle) * (head - ray.length),
      y + Math.sin(ray.angle) * (head - ray.length),
    );
    ctx.lineTo(x + Math.cos(ray.angle) * head, y + Math.sin(ray.angle) * head);
    ctx.stroke();
  }
  // Core bloom.
  const core = impulse(t, CUES.lockup, 7);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 420);
  glow.addColorStop(0, `rgba(235, 255, 255, ${core})`);
  glow.addColorStop(0.3, `rgba(120, 220, 235, ${core * 0.45})`);
  glow.addColorStop(1, "rgba(60, 170, 200, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 420, y - 420, 840, 840);
}

export function render(t) {
  const visible = t >= CUES.lockup - 0.3;
  show(root, visible);
  style(fade, { opacity: ease.inOutSine(progress(t, FADE_OUT, DURATION)) });
  drawBurst(t);

  // A point of light gathers where everything is converging.
  if (t >= CUES.lockup - 0.35 && t < CUES.lockup) {
    const ctx = fxContext();
    const gather = ease.inExpo(progress(t, CUES.lockup - 0.35, CUES.lockup));
    const glow = ctx.createRadialGradient(
      960,
      LOGO_CENTER_Y,
      0,
      960,
      LOGO_CENTER_Y,
      60 + gather * 120,
    );
    glow.addColorStop(0, `rgba(235,255,255,${gather})`);
    glow.addColorStop(1, "rgba(80,200,230,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(760, LOGO_CENTER_Y - 200, 400, 400);
  }
  if (!visible) return;

  const age = t - CUES.lockup;
  // Slow, continuous push-in after the hit keeps the end card alive.
  const push = 1 + 0.035 * ease.outSine(progress(t, CUES.lockup, DURATION));
  style(root, {
    transform: `scale(${push}) translateY(${noise(t * 0.6, 8) * 3}px)`,
  });

  // ── Struts fly home ────────────────────────────────────────────────────
  struts.forEach((strut, index) => {
    const flight = flights[index];
    const caught =
      age < flight.delay
        ? 0
        : spring(age - flight.delay, { stiffness: 150, damping: 15 });
    const remaining = 1 - caught;
    style(strut, {
      opacity: age < flight.delay ? 0 : clamp((age - flight.delay) * 10),
      transform:
        `translate(${flight.dx * remaining}px, ${flight.dy * remaining}px) ` +
        `rotate(${flight.spin * remaining}deg)`,
    });
  });
  const gemIn = spring(age - 0.12, { stiffness: 200, damping: 13 });
  style(gem, {
    transform: `scale(${Math.max(0, gemIn)})`,
    opacity: clamp((age - 0.12) * 8),
  });
  const keyIn = spring(age - 0.3, { stiffness: 260, damping: 12 });
  style(keyhole, {
    transform: `scale(${Math.max(0, keyIn)})`,
    opacity: clamp((age - 0.3) * 10),
  });

  // One pass of light across the metal.
  const sweep = ease.inOutSine(
    progress(t, CUES.lockup + beat(2.4), CUES.lockup + beat(3.4)),
  );
  const shineX = lerp(-900, 900, sweep);
  shineGradient.setAttribute("x1", String(shineX - 220));
  shineGradient.setAttribute("x2", String(shineX + 220));

  // ── Wordmark, badges, footer ───────────────────────────────────────────
  const width = Number(wordmark.dataset.width);
  const wordSweep = lerp(
    -width * 0.6,
    width * 1.6,
    ease.inOutSine(
      progress(t, CUES.lockup + beat(2.6), CUES.lockup + beat(3.6)),
    ),
  );
  wordGlyphs.forEach((glyph, index) => {
    const start = CUES.lockup + beat(0.55) + index * 0.028;
    const amount = ease.outExpo(progress(t, start, start + 0.6));
    const offset = Number(glyph.dataset.offset);
    style(glyph, {
      transform: `translateY(${(1 - amount) * 105}%)`,
      backgroundPosition: `${wordSweep - offset - width / 2}px 0, ${-offset}px 0`,
    });
  });
  badges.forEach((badge, index) => {
    const at = CUES.tagline + index * beat(0.5);
    const pop = spring(t - at, { stiffness: 230, damping: 15 });
    style(badge, {
      opacity: clamp(pop * 2.5),
      transform: `translateY(${(1 - clamp(pop)) * 26}px) scale(${lerp(0.6, 1, pop)})`,
    });
  });
  const footerAt = CUES.tagline + beat(2.5);
  const footerIn = ease.outExpo(progress(t, footerAt, footerAt + 0.8));
  style(footer, { opacity: footerIn });
  footer
    .querySelectorAll("i")
    .forEach((rule) => style(rule, { transform: `scaleX(${footerIn})` }));
  style(logo, {
    transform: `translateY(${(1 - ease.outExpo(clamp(age * 2))) * 30}px)`,
  });
}

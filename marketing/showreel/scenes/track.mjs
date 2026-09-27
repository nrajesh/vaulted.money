/**
 * Scene 4 — "Track every euro." (bar 4).
 *
 * A bank export chases the phone across the frame during the whip pan and
 * dives into the screen; on impact the imported transactions cascade in
 * (see phone.mjs) while the headline and feature chips land on the right.
 */
import { CUES, beat } from "../timeline.mjs";
import { ease, lerp, progress } from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { fxContext } from "../lib/fx.mjs";

const START = beat(11.8);
const END = beat(15.9);
const CARD_START = beat(11.85);
const CARD_LAND = beat(12.6);
const SCREEN_X = 560;
const SCREEN_Y = 600;
const CHIPS = ["Ledgers", "Accounts", "Categories", "Multi-currency"];

let root;
let titleLines;
let subtitle;
let chips;
let card;

export function mount() {
  root = html(`
    <section class="track">
      <div class="track-title">
        <div class="track-line">${glyphs("Track")}</div>
        <div class="track-line serif-line">${glyphs("every euro.", "serif")}</div>
      </div>
      <p class="track-subtitle">Import bank CSVs. Every account, categorised.</p>
      <div class="track-chips">${CHIPS.map((chip) => `<span class="chip">${chip}</span>`).join("")}</div>
    </section>`);
  card = html(`
    <div class="csv-card">
      <div class="csv-fold"></div>
      <div class="csv-head">${icon("file-spreadsheet", 30)}<span>bank-export.csv</span></div>
      <div class="csv-grid">${Array.from({ length: 7 }, () => "<i></i><i></i><i></i>").join("")}</div>
      <div class="csv-foot">1,284 rows</div>
    </div>`);
  document.getElementById("type-layer").append(root, card);
  titleLines = [...root.querySelectorAll(".track-line")];
  subtitle = root.querySelector(".track-subtitle");
  chips = [...root.querySelectorAll(".chip")];
}

function quadratic(a, control, b, amount) {
  const inverse = 1 - amount;
  return (
    inverse * inverse * a + 2 * inverse * amount * control + amount * amount * b
  );
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(card, t >= CARD_START && t < CARD_LAND + 0.05);

  // ── Bank export flies into the phone ───────────────────────────────────
  if (t >= CARD_START && t < CARD_LAND + 0.05) {
    const flight = ease.inOutCubic(progress(t, CARD_START, CARD_LAND));
    const x = quadratic(1780, 1250, SCREEN_X, flight);
    const y = quadratic(120, -80, SCREEN_Y, flight);
    const scale = lerp(1.05, 0.22, ease.inCubic(flight));
    style(card, {
      opacity: 1 - ease.inCubic(progress(t, CARD_LAND - 0.1, CARD_LAND)),
      transform:
        `translate(${x - 125}px, ${y - 155}px) rotate(${lerp(16, -18, flight)}deg) ` +
        `rotateY(${lerp(-30, 20, flight)}deg) scale(${scale})`,
    });
  }

  // Impact ripple on the glass when the file lands.
  const ripple = progress(t, CARD_LAND - 0.02, CARD_LAND + 0.5);
  if (ripple > 0 && ripple < 1) {
    const ctx = fxContext();
    const radius = ease.outCubic(ripple) * 260;
    ctx.strokeStyle = `rgba(150, 235, 245, ${(1 - ripple) * 0.9})`;
    ctx.lineWidth = 3 * (1 - ripple) + 0.5;
    ctx.beginPath();
    ctx.ellipse(SCREEN_X, SCREEN_Y, radius * 0.8, radius, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (!visible) return;

  // ── Headline, subtitle, chips ──────────────────────────────────────────
  titleLines.forEach((line, lineIndex) => {
    line.querySelectorAll(".glyph").forEach((glyph, index) => {
      const start = CUES.track + lineIndex * 0.12 + index * 0.02 - 0.05;
      const amount = ease.outExpo(progress(t, start, start + 0.55));
      style(glyph, {
        transform: `translateY(${(1 - amount) * 112}%) rotate(${(1 - amount) * 8}deg)`,
      });
    });
  });
  const subtitleIn = ease.outExpo(progress(t, beat(13), beat(13) + 0.6));
  style(subtitle, {
    opacity: subtitleIn,
    transform: `translateY(${(1 - subtitleIn) * 24}px)`,
  });
  chips.forEach((chip, index) => {
    const start = beat(13.5) + index * beat(0.25);
    const amount = ease.outBack(progress(t, start, start + 0.35), 2.2);
    style(chip, {
      opacity: Math.min(1, amount * 1.5),
      transform: `translateY(${(1 - amount) * 30}px) scale(${0.7 + amount * 0.3})`,
    });
  });

  // Exit: the camera zooms through the phone, so the type rushes past.
  const exit = ease.inExpo(progress(t, beat(15.25), beat(15.85)));
  style(root, {
    opacity: 1 - exit,
    transform: `translateX(${exit * 500}px) scale(${1 + exit * 0.6})`,
  });
}

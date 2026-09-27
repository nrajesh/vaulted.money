/**
 * Bars 13–14 — "Day or night." (the musical breakdown).
 *
 * A cursor clicks the app's theme toggle and the whole world flips to the
 * light theme through a circular wipe from the button. The light brand
 * mark (navy struts, peach gem, gold keyhole) builds itself strut by strut
 * beside real light-mode screens. On beat 55.25 the toggle is clicked again
 * and the light world collapses back into the button, revealing bar 15.
 */
import { CUES, beat } from "../timeline.mjs";
import {
  clamp,
  ease,
  impulse,
  lerp,
  noise,
  progress,
  spring,
} from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { screenImage } from "../lib/screens.mjs";
import { logoSvg } from "../lib/logo.mjs";

const START = beat(47);
const END = beat(56.2);
const TOGGLE_X = 1620;
const TOGGLE_Y = 150;
const WIPE_IN_END = CUES.themeToggle + 0.6;
const WIPE_OUT_END = CUES.themeBack + 0.55;
const FULL_RADIUS = 2300;

let toggle;
let toggleSun;
let toggleMoon;
let cursor;
let ripple;
let world;
let struts;
let gem;
let keyhole;
let wordmark;
let copy;
let windowElement;
let windowPages;
let phone;

export function mount() {
  toggle = html(`
    <div class="theme-toggle">
      <span class="toggle-sun">${icon("sun", 34)}</span>
      <span class="toggle-moon">${icon("moon", 34)}</span>
    </div>`);
  cursor = html(`
    <div class="theme-cursor">
      <svg viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.9 L11.6 21.6 L14.6 20.3 L11.6 13.7 L17.8 13.7 Z" /></svg>
    </div>`);
  ripple = html(`<div class="theme-ripple"></div>`);
  world = html(`
    <section class="light-world">
      <div class="light-grid"></div>
      <div class="light-copy">
        <div class="desk-copy-line">${glyphs("Day")}</div>
        <div class="desk-copy-line serif-line light-serif">${glyphs("or night.", "serif")}</div>
        <p class="desk-copy-sub">Light and dark themes, each with its own mark.</p>
      </div>
      <div class="light-mark">${logoSvg("light-mark", "light")}</div>
      <div class="light-wordmark">Vaulted Money</div>
      <div class="light-window">
        <div class="desk-bar light-bar"><i></i><i></i><i></i><span>Vaulted Money</span></div>
        <div class="light-view">
          <div class="light-page">${screenImage("desktop-transactions-light")}</div>
          <div class="light-page">${screenImage("desktop-budgets-light")}</div>
        </div>
      </div>
      <div class="light-phone">
        <div class="light-phone-screen">${screenImage("mobile-ledgers-light")}</div>
        <div class="light-island"></div>
      </div>
    </section>`);
  const layer = document.getElementById("lockup-layer");
  layer.append(world, toggle, ripple, cursor);
  toggleSun = toggle.querySelector(".toggle-sun");
  toggleMoon = toggle.querySelector(".toggle-moon");
  struts = [...world.querySelectorAll(".light-mark [data-strut]")];
  for (const strut of struts) strut.setAttribute("pathLength", "1");
  gem = world.querySelector(".light-mark .logo-gem");
  keyhole = world.querySelector(".light-mark .logo-keyhole");
  wordmark = world.querySelector(".light-wordmark");
  copy = world.querySelector(".light-copy");
  windowElement = world.querySelector(".light-window");
  windowPages = [...world.querySelectorAll(".light-page")];
  phone = world.querySelector(".light-phone");
}

function renderCursor(t) {
  // Two visits: click to go light (beat 48), click to go dark (beat 55.25).
  const visits = [
    { from: beat(46.9), click: CUES.themeToggle, start: { x: 1260, y: 520 } },
    { from: beat(54.2), click: CUES.themeBack, start: { x: 1350, y: 560 } },
  ];
  const visit = visits.find(
    (entry) => t >= entry.from && t < entry.click + 0.55,
  );
  show(cursor, Boolean(visit));
  if (!visit) return;
  const travel = ease.inOutCubic(progress(t, visit.from, visit.click - 0.12));
  const press = t >= visit.click ? impulse(t, visit.click, 14) : 0;
  style(cursor, {
    opacity: 1 - progress(t, visit.click + 0.3, visit.click + 0.55),
    transform:
      `translate(${lerp(visit.start.x, TOGGLE_X + 6, travel)}px, ` +
      `${lerp(visit.start.y, TOGGLE_Y + 8, travel) - Math.sin(travel * Math.PI) * 60}px) ` +
      `scale(${1 - press * 0.2})`,
  });
}

export function render(t) {
  const visible = t >= START && t < END;
  for (const element of [toggle, world, ripple]) show(element, visible);
  renderCursor(t);
  if (!visible) return;

  // ── The toggle button ───────────────────────────────────────────────────
  const toggleIn = spring(t - START, { stiffness: 220, damping: 16 });
  const toggleOut = ease.inCubic(
    progress(t, CUES.themeBack + 0.35, CUES.themeBack + 0.7),
  );
  const isLight = t >= CUES.themeToggle + 0.1 && t < CUES.themeBack + 0.1;
  const clickPulse = Math.max(
    impulse(t, CUES.themeToggle, 10) * (t >= CUES.themeToggle ? 1 : 0),
    impulse(t, CUES.themeBack, 10) * (t >= CUES.themeBack ? 1 : 0),
  );
  toggle.classList.toggle("is-light", isLight);
  style(toggle, {
    opacity: clamp(toggleIn * 2) * (1 - toggleOut),
    transform: `translate(${TOGGLE_X - 42}px, ${TOGGLE_Y - 42}px) scale(${Math.max(0, toggleIn) * (1 - clickPulse * 0.12)})`,
  });
  // The icon turns over as the theme changes.
  const spin =
    ease.inOutCubic(progress(t, CUES.themeToggle, CUES.themeToggle + 0.4)) -
    ease.inOutCubic(progress(t, CUES.themeBack, CUES.themeBack + 0.4));
  style(toggleSun, {
    opacity: 1 - spin,
    transform: `rotate(${spin * 180}deg) scale(${1 - spin * 0.5})`,
  });
  style(toggleMoon, {
    opacity: spin,
    transform: `rotate(${(spin - 1) * 180}deg) scale(${0.5 + spin * 0.5})`,
  });

  const rippleAge = Math.min(
    t >= CUES.themeToggle ? t - CUES.themeToggle : 9,
    t >= CUES.themeBack ? t - CUES.themeBack : 9,
  );
  show(ripple, rippleAge < 0.5);
  if (rippleAge < 0.5) {
    const grow = ease.outCubic(rippleAge / 0.5);
    style(ripple, {
      opacity: 1 - grow,
      transform: `translate(${TOGGLE_X}px, ${TOGGLE_Y}px) translate(-50%, -50%) scale(${0.4 + grow * 2.4})`,
    });
  }

  // ── The light world, revealed and then withdrawn through the button ─────
  const opening = ease.inOutCubic(progress(t, CUES.themeToggle, WIPE_IN_END));
  const closing = ease.inOutCubic(progress(t, CUES.themeBack, WIPE_OUT_END));
  const radius = FULL_RADIUS * opening * (1 - closing);
  show(world, radius > 1);
  style(world, {
    clipPath: `circle(${radius}px at ${TOGGLE_X}px ${TOGGLE_Y}px)`,
  });

  // Copy.
  world.querySelectorAll(".light-copy .glyph").forEach((glyph, index) => {
    const amount = ease.outExpo(
      progress(
        t,
        CUES.themeToggle + 0.3 + index * 0.02,
        CUES.themeToggle + 0.8 + index * 0.02,
      ),
    );
    style(glyph, { transform: `translateY(${(1 - amount) * 110}%)` });
  });
  const sub = copy.querySelector(".desk-copy-sub");
  const subIn = ease.outExpo(
    progress(t, CUES.themeToggle + 0.7, CUES.themeToggle + 1.3),
  );
  style(sub, {
    opacity: subIn,
    transform: `translateY(${(1 - subIn) * 18}px)`,
  });

  // The light mark: struts draw on, gem fills, keyhole clicks in.
  struts.forEach((strut, index) => {
    const start = CUES.lightMark + index * 0.028;
    const draw = ease.outCubic(progress(t, start, start + 0.5));
    style(strut, { strokeDasharray: 1, strokeDashoffset: 1 - draw });
  });
  const gemIn = spring(t - (CUES.lightMark + 0.55), {
    stiffness: 190,
    damping: 14,
  });
  style(gem, {
    transform: `scale(${Math.max(0, gemIn)})`,
    opacity: clamp((t - CUES.lightMark - 0.55) * 6),
  });
  const keyIn = spring(t - (CUES.lightMark + 0.8), {
    stiffness: 260,
    damping: 12,
  });
  style(keyhole, {
    transform: `scale(${Math.max(0, keyIn)})`,
    opacity: clamp((t - CUES.lightMark - 0.8) * 8),
  });
  const wordIn = ease.outExpo(
    progress(t, CUES.lightMark + 0.9, CUES.lightMark + 1.5),
  );
  style(wordmark, {
    opacity: wordIn,
    transform: `translateY(${(1 - wordIn) * 20}px)`,
  });

  // Real light screens: a desktop window and the phone's ledger picker.
  const windowIn = spring(t - (CUES.themeToggle + 0.35), {
    stiffness: 120,
    damping: 15,
  });
  style(windowElement, {
    opacity: clamp(windowIn * 2),
    transform:
      `translate(${lerp(1300, 0, windowIn)}px, 0px) rotateY(${-8 + noise(t * 0.4, 5) * 2}deg) ` +
      `rotateX(${3 + noise(t * 0.35, 6)}deg) scale(0.62)`,
  });
  const secondPage = ease.outCubic(progress(t, beat(52), beat(52) + 0.3));
  style(windowPages[1], { opacity: secondPage });
  const phoneIn = spring(t - (CUES.themeToggle + 0.6), {
    stiffness: 140,
    damping: 14,
  });
  style(phone, {
    opacity: clamp(phoneIn * 2),
    transform:
      `translate(0px, ${lerp(700, 0, phoneIn) + Math.sin(t * 1.8) * 6}px) ` +
      `rotateY(${-14 + noise(t * 0.5, 8) * 2}deg) rotateZ(${lerp(8, 2, clamp(phoneIn))}deg)`,
  });
}

/**
 * Bars 15–17 — "Every device. Every currency. Fully offline. Free & open
 * source."
 *
 * A desktop window, a tablet (in the light theme) and a phone spring up in
 * layered depth, each showing a real capture of the app. The headline rolls
 * through four claims on the beat and each gets its proof on screen:
 * currency chips from the demo ledgers, offline badges, and a real
 * `git clone` typing itself. On beat 67.4 everything cuts to the montage.
 */
import { CUES, beat } from "../timeline.mjs";
import { clamp, ease, lerp, noise, progress, spring } from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { screen, screenImage } from "../lib/screens.mjs";

const START = beat(55.2);
const END = CUES.montage + 0.05;
const EXIT = beat(67.4);

const PHRASES = [
  {
    time: CUES.everywhere,
    plain: "Every",
    serif: "device.",
    sub: "WEB · MACOS · WINDOWS · LINUX · iOS · ANDROID",
  },
  {
    time: CUES.currency,
    plain: "Every",
    serif: "currency.",
    sub: "ACCOUNTS IN ANY CURRENCY, SIDE BY SIDE",
  },
  {
    time: CUES.offline,
    plain: "Fully",
    serif: "offline.",
    sub: "NO ACCOUNT · NO SERVER · NO SIGNAL NEEDED",
  },
  {
    time: CUES.openSource,
    plain: "Free &",
    serif: "open source.",
    sub: "MIT LICENSED · FORK IT · LOCALISE IT",
  },
];
const CLONE = "git clone https://github.com/nrajesh/vaulted.money";
/** The currencies the app's own demo ledgers use. */
const CURRENCIES = [
  ["€", "EUR"],
  ["$", "USD"],
  ["£", "GBP"],
  ["₹", "INR"],
];

/** Device layout: centre, outer size, depth, turn, and the capture shown. */
const DEVICES = [
  {
    kind: "tablet",
    x: 400,
    y: 700,
    width: 640,
    height: 460,
    z: 80,
    turn: 18,
    delay: 0.1,
    shot: "tablet-budgets-light",
  },
  {
    kind: "desktop",
    x: 960,
    y: 640,
    width: 1020,
    height: 680,
    z: 0,
    turn: 0,
    delay: 0,
    shot: "desktop-analytics-dark",
  },
  {
    kind: "phone",
    x: 1540,
    y: 720,
    width: 260,
    height: 540,
    z: 120,
    turn: -18,
    delay: 0.18,
    shot: "mobile-transactions-dark",
  },
];

let root;
let headline;
let phraseElements;
let subline;
let devices;
let badges;
let chips;
let terminal;
let terminalText;

function deviceMarkup(device) {
  const capture = screen(device.shot);
  const inset =
    device.kind === "desktop" ? 10 : device.kind === "tablet" ? 16 : 9;
  const bar = device.kind === "desktop" ? 30 : 0;
  const innerWidth = device.width - inset * 2;
  const scale = innerWidth / capture.width;
  return `
    <div class="device device-${device.kind}" style="width:${device.width}px;height:${device.height}px">
      ${bar ? `<div class="device-bar"><i></i><i></i><i></i></div>` : ""}
      <div class="device-screen" style="height:${device.height - inset * 2 - bar}px">
        <div class="device-shot" style="transform:scale(${scale})">${screenImage(device.shot)}</div>
      </div>
      <span class="offline-badge">${icon("wifi-off", 16)}Offline</span>
    </div>`;
}

export function mount() {
  root = html(`
    <section class="everywhere">
      <div class="devices">${DEVICES.map(deviceMarkup).join("")}</div>
      <div class="currency-chips">
        ${CURRENCIES.map(([symbol, code]) => `<span class="currency-chip"><b>${symbol}</b>${code}</span>`).join("")}
      </div>
      <div class="terminal"><span class="prompt">$</span><span class="typed"></span><span class="caret"></span><span class="mit">${icon("code-xml", 16)}MIT</span></div>
    </section>`);
  headline = html(`
    <div class="everywhere-headline">
      ${PHRASES.map((phrase) => `<div class="phrase">${glyphs(phrase.plain)}&nbsp;${glyphs(phrase.serif, "serif")}</div>`).join("")}
      <div class="everywhere-sub"></div>
    </div>`);
  document.getElementById("screen-layer").append(root);
  document.getElementById("type-layer").append(headline);
  phraseElements = [...headline.querySelectorAll(".phrase")];
  subline = headline.querySelector(".everywhere-sub");
  devices = [...root.querySelectorAll(".device")];
  badges = [...root.querySelectorAll(".offline-badge")];
  chips = [...root.querySelectorAll(".currency-chip")];
  terminal = root.querySelector(".terminal");
  terminalText = terminal.querySelector(".typed");
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(headline, visible);
  if (!visible) return;

  // Everything punches out towards the camera for the montage cut.
  const exit = ease.inExpo(progress(t, EXIT, CUES.montage));

  devices.forEach((element, index) => {
    const device = DEVICES[index];
    const rise = spring(t - (CUES.everywhere - beat(0.4) + device.delay), {
      stiffness: 140,
      damping: 15,
    });
    const bob = noise(t * 0.8, index + 3) * 8;
    const scroll =
      device.kind === "phone"
        ? ease.inOutSine(progress(t, CUES.everywhere, EXIT)) * 700
        : 0;
    style(element, {
      opacity: clamp(rise * 3) * (1 - exit),
      transform:
        `translate(${device.x - device.width / 2}px, ${device.y - device.height / 2 + (1 - rise) * 700 + bob}px) ` +
        `translateZ(${device.z + exit * 600}px) rotateY(${device.turn * (1 + (1 - rise))}deg) ` +
        `rotateX(${(1 - rise) * 30}deg)`,
    });
    if (scroll) {
      const shot = element.querySelector(".device-shot img");
      style(shot, { transform: `translateY(${-scroll}px)` });
    }
  });

  // Every currency: the chips the demo ledgers use float up over the devices.
  chips.forEach((chip, index) => {
    const at = CUES.currency + 0.1 + index * beat(0.5);
    const pop = spring(t - at, { stiffness: 200, damping: 14 });
    const leave = ease.inCubic(
      progress(t, CUES.offline - 0.2, CUES.offline + 0.15),
    );
    style(chip, {
      opacity: clamp(pop * 2) * (1 - leave),
      transform:
        `translate(${360 + index * 330}px, ${lerp(420, 330 + (index % 2) * 40, pop) - leave * 60}px) ` +
        `scale(${Math.max(0, pop)}) rotate(${(index % 2 ? 1 : -1) * 3}deg)`,
    });
  });

  // Fully offline: badges pop on every device.
  badges.forEach((badge, index) => {
    const pop = spring(t - (CUES.offline + 0.1 + index * 0.08), {
      stiffness: 260,
      damping: 16,
    });
    style(badge, {
      opacity: clamp(pop * 2),
      transform: `scale(${Math.max(0, pop)})`,
    });
  });

  // Free & open source: the real clone command types itself.
  const typing = progress(t, CUES.openSource + 0.1, CUES.openSource + 0.9);
  const terminalIn = spring(t - CUES.openSource, {
    stiffness: 220,
    damping: 18,
  });
  style(terminal, {
    opacity: clamp(terminalIn * 2) * (1 - exit),
    transform: `translate(-50%, ${(1 - terminalIn) * 40}px)`,
  });
  terminalText.textContent = CLONE.slice(0, Math.round(CLONE.length * typing));

  // ── Headline rolls through its four claims ─────────────────────────────
  phraseElements.forEach((element, index) => {
    const phrase = PHRASES[index];
    const next = PHRASES[index + 1];
    element.querySelectorAll(".glyph").forEach((glyph, glyphIndex) => {
      const enter = ease.outExpo(
        progress(
          t,
          phrase.time - 0.08 + glyphIndex * 0.016,
          phrase.time + 0.4 + glyphIndex * 0.016,
        ),
      );
      const leaveStart = next ? next.time - 0.2 : EXIT;
      const leave = ease.inCubic(
        progress(
          t,
          leaveStart + glyphIndex * 0.01,
          leaveStart + 0.2 + glyphIndex * 0.01,
        ),
      );
      style(glyph, {
        transform: `translateY(${(1 - enter) * 110 - leave * 115}%)`,
      });
    });
  });
  const current =
    [...PHRASES].reverse().find((phrase) => t >= phrase.time - 0.05) ??
    PHRASES[0];
  const characters = Math.round(
    clamp((t - current.time) / 0.4) * current.sub.length,
  );
  subline.textContent = current.sub.slice(0, characters);
  style(subline, { opacity: 1 - exit });
}

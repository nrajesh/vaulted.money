/**
 * Scene 7 — "Every device. Fully offline. Free & open source." (bar 7).
 *
 * Desktop, tablet and phone spring up in layered depth, each running the
 * same ledger. The headline rolls through three claims on the beat; each
 * claim gets its own proof on the devices (platform list, offline badges,
 * a `git clone` typing itself). On beat 27.4 everything is pulled into a
 * single point — where the logo is about to be born.
 */
import { CUES, beat } from "../timeline.mjs";
import { clamp, ease, lerp, noise, progress, spring } from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { logoSvg } from "../lib/logo.mjs";

const START = beat(23.6);
const END = CUES.lockup + 0.05;
const CONVERGE = beat(27.35);

const PHRASES = [
  {
    time: CUES.everywhere,
    plain: "Every",
    serif: "device.",
    sub: "WEB · MACOS · WINDOWS · LINUX · iOS · ANDROID",
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

/** Device layout: centre (x, y), size, depth and turn. */
const DEVICES = [
  {
    kind: "tablet",
    x: 430,
    y: 690,
    width: 430,
    height: 560,
    z: 70,
    turn: 20,
    delay: 0.1,
  },
  {
    kind: "desktop",
    x: 960,
    y: 660,
    width: 1000,
    height: 600,
    z: 0,
    turn: 0,
    delay: 0,
  },
  {
    kind: "phone",
    x: 1530,
    y: 720,
    width: 250,
    height: 520,
    z: 110,
    turn: -20,
    delay: 0.18,
  },
];

let root;
let headline;
let phraseElements;
let subline;
let devices;
let badges;
let terminal;
let terminalText;

const kpi = (label, value, tone = "") =>
  `<div class="mini-kpi ${tone}"><small>${label}</small><b>${value}</b></div>`;

const miniRows = (count) =>
  Array.from(
    { length: count },
    (_, index) =>
      `<div class="mini-row"><i class="tone-${["mint", "blue", "gold", "violet", "rose", "cyan"][index % 6]}"></i><span></span><em></em></div>`,
  ).join("");

function screenMarkup(kind) {
  const chart = `
    <svg class="mini-chart" viewBox="0 0 400 120" preserveAspectRatio="none">
      <path class="mini-area" d="M0 100 C50 92,70 70,120 76 S190 44,240 52 S320 20,400 16 L400 120 L0 120Z"/>
      <path class="mini-line" pathLength="1" d="M0 100 C50 92,70 70,120 76 S190 44,240 52 S320 20,400 16"/>
    </svg>`;
  if (kind === "desktop") {
    return `
      <div class="win-bar"><i></i><i></i><i></i><span>Vaulted Money</span></div>
      <div class="win-body">
        <aside>
          <div class="mini-brand">${logoSvg("desk-logo")}<span class="gradient-text">Vaulted Money</span></div>
          ${["house", "receipt", "wallet", "chart-pie", "calendar", "piggy-bank"].map((name, index) => `<div class="nav ${index === 0 ? "active" : ""}">${icon(name, 18)}<span></span></div>`).join("")}
        </aside>
        <main>
          <div class="mini-heading">Dashboard</div>
          <div class="mini-kpis">${kpi("Balance", "€24,812")}${kpi("Income", "+€3,840", "mint")}${kpi("Spent", "−€1,301")}</div>
          <div class="mini-panel">${chart}</div>
          <div class="mini-panel rows">${miniRows(4)}</div>
        </main>
      </div>`;
  }
  if (kind === "tablet") {
    return `
      <div class="tab-body">
        <div class="mini-heading">Budgets</div>
        <div class="mini-rings">${[72, 45, 91, 64].map((value, index) => `<div class="mini-ring ${index === 2 ? "warn" : ""}" style="--p:${value}"><b>${value}%</b></div>`).join("")}</div>
        <div class="mini-panel">${chart}</div>
        <div class="mini-panel rows">${miniRows(3)}</div>
      </div>`;
  }
  return `
    <div class="phone-mini">
      <div class="mini-island"></div>
      <div class="mini-balance"><small>Total balance</small><b>€24,812.40</b></div>
      <div class="mini-panel">${chart}</div>
      <div class="mini-panel rows">${miniRows(5)}</div>
    </div>`;
}

export function mount() {
  root = html(`
    <section class="everywhere">
      <div class="devices">
        ${DEVICES.map(
          (device) => `
          <div class="device device-${device.kind}" style="width:${device.width}px;height:${device.height}px">
            <div class="device-screen">${screenMarkup(device.kind)}</div>
            <span class="offline-badge">${icon("wifi-off", 16)}Offline</span>
          </div>`,
        ).join("")}
      </div>
      <div class="terminal"><span class="prompt">$</span><span class="typed"></span><span class="caret"></span><span class="mit">${icon("code-xml", 16)}MIT</span></div>
    </section>`);
  headline = html(`
    <div class="everywhere-headline">
      ${PHRASES.map(
        (phrase) => `
        <div class="phrase">${glyphs(phrase.plain)}&nbsp;${glyphs(phrase.serif, "serif")}</div>`,
      ).join("")}
      <div class="everywhere-sub"></div>
    </div>`);
  document.getElementById("screen-layer").append(root);
  document.getElementById("type-layer").append(headline);
  phraseElements = [...headline.querySelectorAll(".phrase")];
  subline = headline.querySelector(".everywhere-sub");
  devices = [...root.querySelectorAll(".device")];
  badges = [...root.querySelectorAll(".offline-badge")];
  terminal = root.querySelector(".terminal");
  terminalText = terminal.querySelector(".typed");
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(headline, visible);
  if (!visible) return;

  const converge = ease.inExpo(progress(t, CONVERGE, CUES.lockup));

  // ── Devices spring up, then everything collapses into the logo's centre ─
  devices.forEach((element, index) => {
    const device = DEVICES[index];
    const rise = spring(t - (beat(23.75) + device.delay), {
      stiffness: 140,
      damping: 15,
    });
    const bob = noise(t * 0.8, index + 3) * 8;
    const x = lerp(device.x, 960, converge);
    const y = lerp(device.y + (1 - rise) * 700, 430, converge) + bob;
    style(element, {
      opacity:
        clamp(rise * 3) * (1 - progress(t, CUES.lockup - 0.08, CUES.lockup)),
      transform:
        `translate(${x - device.width / 2}px, ${y - device.height / 2}px) translateZ(${device.z}px) ` +
        `rotateY(${device.turn * (1 - converge) + (1 - rise) * device.turn}deg) ` +
        `rotateX(${(1 - rise) * 30}deg) rotateZ(${converge * (index - 1) * 40}deg) ` +
        `scale(${lerp(1, 0.02, converge)})`,
    });
    element.querySelectorAll(".mini-line").forEach((line) => {
      style(line, {
        strokeDashoffset:
          1 - ease.inOutCubic(progress(t, beat(24.2), beat(26.2))),
      });
    });
  });

  // Offline badges pop on beat 25.5.
  badges.forEach((badge, index) => {
    const pop = spring(t - (PHRASES[1].time + index * 0.06), {
      stiffness: 260,
      damping: 16,
    });
    style(badge, {
      opacity: clamp(pop * 2),
      transform: `scale(${Math.max(0, pop)})`,
    });
  });

  // `git clone` types itself on beat 26.5.
  const typing = progress(t, PHRASES[2].time + 0.05, PHRASES[2].time + 0.62);
  const terminalIn = spring(t - PHRASES[2].time + 0.05, {
    stiffness: 220,
    damping: 18,
  });
  style(terminal, {
    opacity: clamp(terminalIn * 2) * (1 - converge),
    transform: `translate(-50%, ${(1 - terminalIn) * 40}px) scale(${lerp(1, 0.2, converge)})`,
  });
  terminalText.textContent = CLONE.slice(0, Math.round(CLONE.length * typing));

  // ── Headline rolls through its three claims ────────────────────────────
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
      const leaveStart = next ? next.time - 0.2 : CONVERGE;
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
  const age = t - current.time;
  const characters = Math.round(clamp(age / 0.4) * current.sub.length);
  subline.textContent = current.sub.slice(0, characters);
  style(subline, { opacity: 1 - converge });
}

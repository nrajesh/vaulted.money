/**
 * Bars 19–23 — "Every device. Every currency. Fully offline." then "Free &
 * open source. Install it today."
 *
 * A desktop window, a tablet (in the light theme) and a phone spring up in
 * layered depth, each showing a real screen the film has not shown yet. The
 * headline gives each claim a full bar and each gets its proof on screen:
 * the desktop turns to the real Accounts and Currencies pages while currency
 * chips from the demo ledgers float up; offline badges pop on every device.
 *
 * For open source the devices sink away and a terminal takes the stage,
 * typing the install commands from vaulted.money: clone, install, then one
 * command per platform. Nothing here needs an app store.
 *
 * Each device has its own perspective rather than sharing one 3D scene:
 * intersecting planes in a shared 3D context make Chromium drop pieces of
 * the screens.
 */
import { CUES, beat } from "../timeline.mjs";
import { clamp, ease, lerp, noise, progress, spring } from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { screen, screenImage } from "../lib/screens.mjs";

const START = CUES.everywhere - beat(0.8);
const END = CUES.montage + 0.05;
const EXIT = CUES.montage - beat(0.6);
const DEVICES_OUT = CUES.openSource;
const PERSPECTIVE = 1800;

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
  {
    time: CUES.install,
    plain: "Install it",
    serif: "today.",
    sub: "NO APP STORE NEEDED · ONE COMMAND PER PLATFORM",
  },
];
/** The currencies the app's own demo ledgers use. */
const CURRENCIES = [
  ["€", "EUR"],
  ["$", "USD"],
  ["£", "GBP"],
  ["₹", "INR"],
];
/** The install commands, as the vaulted.money homepage lists them. */
const SETUP = [
  "git clone https://github.com/nrajesh/vaulted.money.git",
  "cd vaulted.money && pnpm install",
];
const PLATFORMS = [
  ["globe", "Web", "pnpm dev"],
  ["monitor", "Desktop", "pnpm run electron:dev"],
  ["smartphone", "Android", "pnpm run android:build:apk"],
  ["tablet-smartphone", "iOS", "pnpm run ios:build:simulator"],
];
/** When each setup line starts and finishes typing. */
export const TYPING = [
  [CUES.openSource + beat(0.6), CUES.openSource + beat(2.1)],
  [CUES.openSource + beat(2.3), CUES.openSource + beat(3.3)],
];
/** The platform rows cascade in quickly, then hold together. */
export const platformAt = (index) => CUES.install + beat(0.2 + index * 0.4);

/**
 * Device layout: centre, outer size, depth, turn, and the captures shown.
 * The desktop turns from Accounts to Currencies for "every currency".
 */
const DEVICES = [
  {
    kind: "desktop",
    x: 960,
    y: 640,
    width: 1020,
    height: 680,
    z: 0,
    turn: 0,
    delay: 0,
    shots: ["desktop-accounts-dark", "desktop-currencies-dark"],
  },
  {
    kind: "tablet",
    x: 390,
    y: 700,
    width: 640,
    height: 460,
    z: 90,
    turn: 18,
    delay: 0.1,
    shots: ["tablet-scheduled-light"],
  },
  {
    kind: "phone",
    x: 1545,
    y: 720,
    width: 260,
    height: 540,
    z: 120,
    turn: -18,
    delay: 0.18,
    shots: ["mobile-calendar-dark"],
  },
];

let root;
let headline;
let phraseElements;
let subline;
let devices;
let badges;
let chips;
let panel;
let setupLines;
let platformList;
let platformRows;
let carets;

function deviceMarkup(device) {
  const capture = screen(device.shots[0]);
  const inset =
    device.kind === "desktop" ? 10 : device.kind === "tablet" ? 16 : 9;
  const bar = device.kind === "desktop" ? 30 : 0;
  const innerWidth = device.width - inset * 2;
  const scale = innerWidth / capture.width;
  return `
    <div class="device device-${device.kind}" style="width:${device.width}px;height:${device.height}px">
      ${bar ? `<div class="device-bar"><i></i><i></i><i></i></div>` : ""}
      <div class="device-screen" style="height:${device.height - inset * 2 - bar}px">
        <div class="device-shot" style="transform:scale(${scale})">
          ${device.shots.map((shot, index) => screenImage(shot, index ? "device-alt" : "")).join("")}
        </div>
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
      <div class="install-panel">
        <div class="install-bar"><i></i><i></i><i></i><span>vaulted.money — install</span><em>${icon("code-xml", 16)}MIT</em></div>
        <div class="install-body">
          ${SETUP.map(() => `<div class="install-line"><span class="prompt">$</span><span class="typed"></span><i class="install-caret"></i></div>`).join("")}
          <div class="install-platforms">
            ${PLATFORMS.map(
              ([iconName, label, command]) => `
              <div class="install-row">
                <b>${icon(iconName, 22)}${label}</b>
                <span class="prompt">$</span><span>${command}</span>
              </div>`,
            ).join("")}
          </div>
        </div>
      </div>
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
  panel = root.querySelector(".install-panel");
  setupLines = [...panel.querySelectorAll(".install-line .typed")];
  platformList = panel.querySelector(".install-platforms");
  platformRows = [...panel.querySelectorAll(".install-row")];
  carets = [...panel.querySelectorAll(".install-caret")];
}

function renderDevices(t) {
  // The devices sink back and fade as the install terminal takes the stage.
  const away = ease.inCubic(
    progress(t, DEVICES_OUT - beat(0.3), DEVICES_OUT + beat(0.7)),
  );
  devices.forEach((element, index) => {
    const device = DEVICES[index];
    const visible = away < 1;
    show(element, visible);
    if (!visible) return;
    const rise = spring(t - (CUES.everywhere - beat(0.4) + device.delay), {
      stiffness: 140,
      damping: 15,
    });
    const bob = noise(t * 0.8, index + 3) * 8;
    style(element, {
      opacity: clamp(rise * 3) * (1 - away),
      transform:
        `translate(${device.x - device.width / 2}px, ${device.y - device.height / 2 + (1 - rise) * 700 + bob + away * 120}px) ` +
        `perspective(${PERSPECTIVE}px) translateZ(${device.z - away * 500}px) ` +
        `rotateY(${device.turn * (1 + (1 - rise))}deg) rotateX(${(1 - rise) * 30 + away * 12}deg)`,
    });
    if (device.kind === "phone") {
      const scroll = ease.inOutSine(progress(t, CUES.everywhere, DEVICES_OUT));
      const shot = screen(device.shots[0]);
      const travel = Math.max(0, shot.height - 844) * 0.8;
      style(element.querySelector(".device-shot img"), {
        transform: `translateY(${-scroll * travel}px)`,
      });
    }
    if (device.shots.length > 1) {
      const turn = ease.inOutCubic(
        progress(t, CUES.currency - 0.05, CUES.currency + 0.3),
      );
      style(element.querySelector(".device-alt"), { opacity: turn });
    }
  });
  return away;
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(headline, visible);
  if (!visible) return;

  // Everything punches out towards the camera for the montage cut.
  const exit = ease.inExpo(progress(t, EXIT, CUES.montage));
  const away = renderDevices(t);

  // Every currency: the chips the demo ledgers use float up over the devices,
  // half a beat apart, and all stay until the bar ends.
  chips.forEach((chip, index) => {
    const at = CUES.currency + beat(0.25 + index * 0.5);
    const pop = spring(t - at, { stiffness: 200, damping: 14 });
    const leave = ease.inCubic(
      progress(t, CUES.offline - beat(0.3), CUES.offline + beat(0.1)),
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
    const pop = spring(t - (CUES.offline + 0.1 + index * 0.12), {
      stiffness: 260,
      damping: 16,
    });
    style(badge, {
      opacity: clamp(pop * 2) * (1 - away),
      transform: `scale(${Math.max(0, pop)})`,
    });
  });

  renderInstall(t, exit);
  renderHeadline(t, exit);
}

function renderInstall(t, exit) {
  const panelAt = CUES.openSource + beat(0.25);
  const panelIn = spring(t - panelAt, { stiffness: 150, damping: 17 });
  const visible = t >= panelAt;
  show(panel, visible);
  if (!visible) return;
  style(panel, {
    opacity: clamp(panelIn * 2) * (1 - exit),
    transform:
      `translate(-50%, ${(1 - panelIn) * 160}px) scale(${lerp(0.9, 1, clamp(panelIn)) * (1 + exit * 0.4)}) ` +
      `rotateX(${(1 - clamp(panelIn)) * 16}deg)`,
  });

  // Setup lines type themselves, one after the other, with a blinking
  // caret on whichever line is being typed.
  const blink = Math.floor(t / beat(0.5)) % 2 === 0;
  SETUP.forEach((text, index) => {
    const [from, to] = TYPING[index];
    const typed = progress(t, from, to);
    setupLines[index].textContent = text.slice(
      0,
      Math.round(text.length * typed),
    );
    const nextStart = TYPING[index + 1]?.[0] ?? CUES.install;
    const typing = t >= from - 0.3 && t < nextStart;
    show(carets[index], typing && (t < to || blink));
    // A line (and its prompt) appears only when its typing is about to start.
    style(setupLines[index].parentElement, {
      opacity: t >= from - 0.3 ? 1 : 0,
    });
  });
  const platformsOpen = ease.inOutCubic(
    progress(t, CUES.install - beat(0.2), CUES.install + beat(0.4)),
  );
  style(platformList, { height: `${platformsOpen * PLATFORM_LIST_HEIGHT}px` });
  platformRows.forEach((row, index) => {
    const at = platformAt(index);
    const rowIn = ease.outExpo(progress(t, at, at + 0.45));
    style(row, {
      opacity: rowIn,
      transform: `translateX(${(1 - rowIn) * 40}px)`,
    });
  });
}

/** Height of the four platform rows once open (four 58px rows + padding). */
const PLATFORM_LIST_HEIGHT = 4 * 58 + 26;

function renderHeadline(t, exit) {
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

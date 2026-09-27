/**
 * Scenes 2–4 share one hero prop: the phone, and the camera around it.
 *
 * Bar 2  "Your money. / Your device." is set inside the phone's screen while
 *        the camera is pushed in so far that the bezel is out of frame and
 *        the type reads as pure typography. On beat 7 the bezel draws itself
 *        around the words and the camera pulls out: the device was there
 *        all along.
 * Bar 3  The app boots on screen (privacy scene alongside).
 * Bar 4  The phone whips to the left; imported transactions cascade in and
 *        one of them lifts off the glass in 3D.
 * Beat 15.5 The camera zooms through the screen into the budget scene.
 */
import { CUES, beat } from "../timeline.mjs";
import {
  clamp,
  ease,
  euros,
  lerp,
  noise,
  progress,
  spring,
  tween,
} from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { logoSvg } from "../lib/logo.mjs";

export const PHONE_WIDTH = 420;
export const PHONE_HEIGHT = 880;
const SCREEN_INSET = 12;

export const TRANSACTIONS = [
  {
    name: "Salary",
    meta: "Income · Main account",
    amount: 3200,
    icon: "briefcase",
    tone: "mint",
  },
  {
    name: "Rent",
    meta: "Housing · Standing order",
    amount: -1150,
    icon: "house",
    tone: "blue",
  },
  {
    name: "Groceries",
    meta: "Food · Debit card",
    amount: -84.35,
    icon: "shopping-cart",
    tone: "gold",
  },
  {
    name: "Train pass",
    meta: "Transport · Monthly",
    amount: -62,
    icon: "train-front",
    tone: "violet",
  },
  {
    name: "Coffee",
    meta: "Dining · Cash",
    amount: -4.2,
    icon: "coffee",
    tone: "rose",
  },
  {
    name: "Freelance",
    meta: "Income · Invoice #42",
    amount: 640,
    icon: "landmark",
    tone: "mint",
  },
];

const BALANCE = 24812.4;
const ROWS_START = CUES.track + beat(0.6);
const ROW_STAGGER = beat(0.25);

let world;
let phone;
let outline;
let body;
let screen;
let manifesto;
let wordMoney;
let wordDevice;
let lineYour;
let app;
let appParts;
let balanceValue;
let rows;
let skeletons;
let popCard;
let sparkPath;

const phoneMarkup = () => `
<div class="phone">
  <div class="phone-body"></div>
  <div class="phone-screen">
    <div class="screen-bg"></div>
    <div class="manifesto">
      <div class="manifesto-line manifesto-your">${glyphs("Your")}</div>
      <div class="manifesto-line manifesto-swap">
        <span class="manifesto-word word-money">${glyphs("money.", "serif")}</span>
        <span class="manifesto-word word-device">${glyphs("device.", "serif")}</span>
      </div>
    </div>
    <div class="app">
      <div class="app-status app-part">
        <span>9:41</span>
        <span class="status-icons"><i></i><i></i><i></i><b></b></span>
      </div>
      <div class="app-header app-part">
        <span class="app-logo">${logoSvg("phone-logo")}</span>
        <span class="app-title gradient-text">Vaulted Money</span>
        <span class="app-ledger">Personal</span>
      </div>
      <div class="balance-card app-part">
        <div class="eyebrow">Total balance</div>
        <div class="balance-value">€0.00</div>
        <div class="balance-delta">${icon("trending-up", 16)} +€1,024.18 this month</div>
        <svg class="sparkline" viewBox="0 0 340 70" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#6fd3de" stop-opacity="0.45" />
              <stop offset="1" stop-color="#6fd3de" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path class="spark-area" d="M0 58 C 30 52, 45 60, 70 48 S 120 30, 150 38 S 200 22, 230 26 S 290 8, 340 10 L 340 70 L 0 70 Z" fill="url(#spark-fill)" />
          <path class="spark-line" pathLength="1" d="M0 58 C 30 52, 45 60, 70 48 S 120 30, 150 38 S 200 22, 230 26 S 290 8, 340 10" />
        </svg>
      </div>
      <div class="section-title app-part"><span>Recent transactions</span><span class="see-all">See all</span></div>
      <div class="rows app-part">
        ${TRANSACTIONS.map(
          (item) => `
          <div class="row">
            <span class="row-skeleton"><i></i><b></b><em></em></span>
            <span class="row-content">
              <span class="row-icon tone-${item.tone}">${icon(item.icon, 20)}</span>
              <span class="row-text"><strong>${item.name}</strong><small>${item.meta}</small></span>
              <span class="row-amount ${item.amount > 0 ? "positive" : ""}">${item.amount > 0 ? "+" : "−"}€${euros(Math.abs(item.amount))}</span>
            </span>
          </div>`,
        ).join("")}
      </div>
      <div class="tabbar app-part">
        <span class="active">${icon("house", 22)}</span>
        <span>${icon("receipt", 22)}</span>
        <span>${icon("chart-pie", 22)}</span>
        <span>${icon("wallet", 22)}</span>
      </div>
    </div>
  </div>
  <div class="phone-island"></div>
  <svg class="phone-outline" viewBox="0 0 ${PHONE_WIDTH} ${PHONE_HEIGHT}">
    <path pathLength="1" d="M210 1 H351 A68 68 0 0 1 419 69 V811 A68 68 0 0 1 351 879 H210" />
    <path pathLength="1" d="M210 1 H69 A68 68 0 0 0 1 69 V811 A68 68 0 0 0 69 879 H210" />
  </svg>
</div>`;

const popMarkup = () => `
<div class="pop-card">
  <span class="row-icon tone-mint">${icon("briefcase", 30)}</span>
  <span class="row-text"><strong>Salary</strong><small>Income · Main account</small></span>
  <span class="row-amount positive">+€3,200.00</span>
  <span class="pop-chip">${icon("sparkles", 16)} Auto-categorised</span>
</div>`;

export function mount() {
  world = document.getElementById("world");
  phone = html(phoneMarkup());
  popCard = html(popMarkup());
  world.append(phone, popCard);

  body = phone.querySelector(".phone-body");
  outline = phone.querySelector(".phone-outline");
  screen = phone.querySelector(".screen-bg");
  manifesto = phone.querySelector(".manifesto");
  lineYour = phone.querySelector(".manifesto-your");
  wordMoney = phone.querySelector(".word-money");
  wordDevice = phone.querySelector(".word-device");
  app = phone.querySelector(".app");
  appParts = [...phone.querySelectorAll(".app-part")];
  balanceValue = phone.querySelector(".balance-value");
  rows = [...phone.querySelectorAll(".row")];
  skeletons = [...phone.querySelectorAll(".row-skeleton")];
  sparkPath = phone.querySelector(".spark-line");
}

/** Where the phone sits in the world, and how it is turned. */
function phonePose(t) {
  const whip = ease.inOutExpo(progress(t, beat(11.7), beat(12.35)));
  const settleTurn = ease.outCubic(
    progress(t, CUES.noCloud - 0.1, CUES.noCloud + 0.6),
  );
  const float = Math.sin(t * 2.1) * 6;
  let x = lerp(1400, 560, whip);
  let y = lerp(540, 560, whip) + float * clamp((t - CUES.noCloud) * 2);
  let rotateY = lerp(0, -16, settleTurn);
  rotateY = lerp(rotateY, 16, whip) + noise(t * 0.6, 4) * 2 * whip;
  const rotateX = lerp(0, 4, settleTurn) + noise(t * 0.5, 9) * 1.5;
  // During the whip the phone banks into the turn, like a camera move.
  const bank = Math.sin(whip * Math.PI) * -7;
  return {
    x,
    y,
    rotateY,
    rotateX,
    rotateZ: bank,
    z: Math.sin(whip * Math.PI) * -220,
  };
}

/** Camera: scale `k` about `focus`, with a little roll. */
function cameraPose(t, pose) {
  const land = ease.outExpo(
    progress(t, CUES.diveImpact - 0.05, CUES.diveImpact + 0.7),
  );
  const pullOut = ease.inOutExpo(progress(t, CUES.phoneWrap, CUES.noCloud));
  const zoomThrough = ease.inExpo(progress(t, beat(15.4), beat(16.05)));
  let k =
    lerp(2.55, 2.2, land) -
    0.08 * progress(t, CUES.diveImpact + 0.7, CUES.phoneWrap);
  k = lerp(k, 1, pullOut);
  let focusX = lerp(1400, 960, pullOut);
  let focusY = 540;
  let roll = lerp(
    -2.5,
    0,
    ease.inOutCubic(progress(t, CUES.diveImpact, CUES.noCloud)),
  );
  if (zoomThrough > 0) {
    k = lerp(1, 9, zoomThrough);
    focusX = lerp(
      960,
      pose.x,
      ease.outCubic(progress(t, beat(15.4), beat(15.9))),
    );
    focusY = lerp(
      540,
      pose.y + 60,
      ease.outCubic(progress(t, beat(15.4), beat(15.9))),
    );
  }
  return { k, focusX, focusY, roll };
}

function animateGlyphs(
  container,
  t,
  start,
  {
    stagger = 0.022,
    duration = 0.42,
    from = 115,
    to = 0,
    easing = ease.outExpo,
    skew = 0,
  } = {},
) {
  const letters = container.querySelectorAll(".glyph");
  letters.forEach((letter, index) => {
    const amount = easing(
      progress(t, start + index * stagger, start + index * stagger + duration),
    );
    const y = lerp(from, to, amount);
    const skewAmount = skew * (1 - Math.abs(amount * 2 - 1));
    style(letter, { transform: `translateY(${y}%) skewY(${skewAmount}deg)` });
  });
}

export function render(t) {
  const visible = t >= CUES.diveStart && t < beat(16.1);
  show(phone, visible);
  show(popCard, visible && t >= CUES.trackPop - 0.1);
  if (!visible) {
    style(world, { transform: "none" });
    return;
  }

  const pose = phonePose(t);
  const camera = cameraPose(t, pose);
  style(world, {
    transform:
      `translate(960px, 540px) rotate(${camera.roll}deg) scale(${camera.k}) ` +
      `translate(${-camera.focusX}px, ${-camera.focusY}px)`,
  });

  // Fade out as we pass through the glass into the budget scene.
  const exit = progress(t, beat(15.85), beat(16.05));
  style(phone, {
    transform:
      `translate(${pose.x - PHONE_WIDTH / 2}px, ${pose.y - PHONE_HEIGHT / 2}px) translateZ(${pose.z}px) ` +
      `rotateY(${pose.rotateY}deg) rotateX(${pose.rotateX}deg) rotateZ(${pose.rotateZ}deg)`,
    opacity: 1 - exit,
  });

  // ── Manifesto type (bar 2) ─────────────────────────────────────────────
  const manifestoOut = ease.inOutCubic(progress(t, beat(7.55), beat(8.05)));
  style(manifesto, {
    opacity: 1 - manifestoOut,
    transform: `translateY(${-40 * manifestoOut}px) scale(${1 - 0.25 * manifestoOut})`,
  });
  show(manifesto, t < beat(8.1));
  animateGlyphs(lineYour, t, CUES.diveImpact - 0.1, {
    stagger: 0.03,
    duration: 0.5,
  });
  if (t < CUES.wordDevice) {
    animateGlyphs(wordMoney, t, CUES.diveImpact - 0.02, {
      stagger: 0.03,
      duration: 0.5,
    });
  }
  // "money." rolls up and away while "device." rolls up into its place.
  if (t >= beat(5.5)) {
    animateGlyphs(wordMoney, t, beat(5.5), {
      stagger: 0.014,
      duration: 0.22,
      from: 0,
      to: -118,
      easing: ease.inCubic,
    });
  }
  animateGlyphs(wordDevice, t, beat(5.85), {
    stagger: 0.024,
    duration: 0.45,
    skew: -6,
  });
  show(wordDevice, t >= beat(5.8));

  // ── Bezel draws itself around the words ────────────────────────────────
  const draw = ease.inOutCubic(
    progress(t, CUES.phoneWrap, CUES.phoneWrap + 0.34),
  );
  const glowFade = 1 - progress(t, CUES.noCloud, CUES.noCloud + 0.4);
  style(outline, { opacity: draw > 0 ? glowFade : 0 });
  for (const path of outline.querySelectorAll("path")) {
    style(path, { strokeDashoffset: 1 - draw });
  }
  const solid = ease.outCubic(progress(t, CUES.phoneWrap + 0.18, CUES.noCloud));
  style(body, { opacity: solid });
  style(phone.querySelector(".phone-island"), { opacity: solid });
  style(screen, {
    opacity: ease.inOutCubic(
      progress(t, CUES.phoneWrap + 0.25, CUES.noCloud + 0.1),
    ),
  });

  // ── App boots ──────────────────────────────────────────────────────────
  show(app, t >= beat(7.7));
  appParts.forEach((part, index) => {
    const amount = ease.outExpo(
      progress(t, beat(7.75) + index * 0.05, beat(7.75) + index * 0.05 + 0.5),
    );
    style(part, {
      opacity: amount,
      transform: `translateY(${(1 - amount) * 26}px)`,
    });
  });

  // Balance counts up as imported history lands.
  const counted = ease.outCubic(progress(t, ROWS_START, CUES.trackPop));
  balanceValue.textContent = `€${euros(lerp(18430.12, BALANCE, counted))}`;
  style(sparkPath, {
    strokeDashoffset: 1 - ease.inOutCubic(progress(t, beat(8), beat(10))),
  });

  // Skeleton rows shimmer until the CSV import fills them.
  rows.forEach((row, index) => {
    const land = progress(
      t,
      ROWS_START + index * ROW_STAGGER,
      ROWS_START + index * ROW_STAGGER + 0.45,
    );
    const eased = ease.outExpo(land);
    const content = row.querySelector(".row-content");
    style(content, {
      opacity: eased,
      transform: `translateX(${(1 - eased) * 80}px)`,
    });
    const shimmer = (Math.sin(t * 5 - index * 0.7) + 1) / 2;
    style(skeletons[index], { opacity: (1 - eased) * (0.35 + shimmer * 0.35) });
    // The salary row lights up as its copy lifts off the glass.
    const highlight =
      index === 0
        ? Math.max(
            0,
            spring(t - CUES.trackPop, { stiffness: 120, damping: 14 }),
          )
        : 0;
    style(row, {
      backgroundColor: `rgba(111, 211, 222, ${0.1 * clamp(highlight)})`,
    });
  });

  // ── Pop-out card: the salary row lifts out of the screen in 3D ─────────
  if (t >= CUES.trackPop - 0.1) {
    const lift = spring(t - CUES.trackPop, { stiffness: 150, damping: 15 });
    const fade = progress(t, CUES.trackPop - 0.05, CUES.trackPop + 0.12);
    const out = ease.inCubic(progress(t, beat(15.3), beat(15.7)));
    // Starts aligned with the first row on the phone, ends floating in front.
    const startX = pose.x - PHONE_WIDTH / 2 + 18;
    const startY = pose.y - PHONE_HEIGHT / 2 + 410;
    style(popCard, {
      opacity: fade * (1 - out),
      transform:
        `translate(${lerp(startX, pose.x - 150, lift)}px, ${lerp(startY, startY - 96, lift)}px) ` +
        `translateZ(${lerp(0, 180, lift)}px) rotateY(${lerp(pose.rotateY, -8, lift)}deg) ` +
        `rotateX(${lerp(0, 6, lift)}deg) scale(${lerp(0.93, 1.18, lift)})`,
    });
  }
}

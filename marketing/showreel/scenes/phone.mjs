/**
 * Bars 2–4 share one hero prop: the phone, and the camera around it.
 *
 * Bar 2    "Your money. / Your device." is set inside the phone's screen while
 *          the camera is pushed in so far that the bezel is out of frame and
 *          the type reads as pure typography. On beat 7 the bezel draws
 *          itself around the words and the camera pulls out: the device was
 *          there all along.
 * Bars 3–4 The real app is on screen (a captured mobile Transactions page,
 *          scrolling gently) while the privacy lines land alongside.
 * Beat 15.5 The phone whips out of frame and the desktop app whips in.
 */
import { CUES, beat } from "../timeline.mjs";
import { clamp, ease, lerp, noise, progress } from "../lib/motion.mjs";
import { glyphs, html, show, style } from "../lib/dom.mjs";
import { screenImage } from "../lib/screens.mjs";

export const PHONE_WIDTH = 420;
export const PHONE_HEIGHT = 880;
const SCREEN_WIDTH = PHONE_WIDTH - 24;
const WHIP_START = beat(15.35);
const WHIP_END = beat(16.1);

let world;
let phone;
let outline;
let body;
let island;
let screenBackground;
let manifesto;
let wordMoney;
let wordDevice;
let lineYour;
let app;
let appShot;

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
    <div class="phone-status">
      <span>9:41</span>
      <span class="status-icons"><i></i><i></i><i></i><b></b></span>
    </div>
    <div class="phone-app">${screenImage("mobile-transactions-dark", "phone-app-shot")}</div>
  </div>
  <div class="phone-island"></div>
  <svg class="phone-outline" viewBox="0 0 ${PHONE_WIDTH} ${PHONE_HEIGHT}">
    <path pathLength="1" d="M210 1 H351 A68 68 0 0 1 419 69 V811 A68 68 0 0 1 351 879 H210" />
    <path pathLength="1" d="M210 1 H69 A68 68 0 0 0 1 69 V811 A68 68 0 0 0 69 879 H210" />
  </svg>
</div>`;

export function mount() {
  world = document.getElementById("world");
  phone = html(phoneMarkup());
  world.append(phone);
  body = phone.querySelector(".phone-body");
  island = phone.querySelector(".phone-island");
  outline = phone.querySelector(".phone-outline");
  screenBackground = phone.querySelector(".screen-bg");
  manifesto = phone.querySelector(".manifesto");
  lineYour = phone.querySelector(".manifesto-your");
  wordMoney = phone.querySelector(".word-money");
  wordDevice = phone.querySelector(".word-device");
  app = phone.querySelector(".phone-app");
  appShot = phone.querySelector(".phone-app-shot");
}

/** Where the phone sits in the world, and how it is turned. */
function phonePose(t) {
  const settleTurn = ease.outCubic(
    progress(t, CUES.noCloud - 0.1, CUES.noCloud + 0.8),
  );
  const whip = ease.inExpo(progress(t, WHIP_START, WHIP_END));
  const float = Math.sin(t * 1.9) * 7 * clamp((t - CUES.noCloud) * 2);
  return {
    x: 1400 - whip * 1900,
    y: 540 + float,
    rotateY: lerp(0, -16, settleTurn) + noise(t * 0.5, 4) * 1.5 + whip * 25,
    rotateX: lerp(0, 4, settleTurn) + noise(t * 0.45, 9) * 1.2,
    rotateZ: whip * -6,
  };
}

/** Camera: scale `k` about `focus`, with a little roll. */
function cameraPose(t) {
  const land = ease.outExpo(
    progress(t, CUES.diveImpact - 0.05, CUES.diveImpact + 0.7),
  );
  const pullOut = ease.inOutExpo(progress(t, CUES.phoneWrap, CUES.noCloud));
  let k =
    lerp(2.55, 2.2, land) -
    0.08 * progress(t, CUES.diveImpact + 0.7, CUES.phoneWrap);
  k = lerp(k, 1, pullOut);
  return {
    k,
    focusX: lerp(1400, 960, pullOut),
    focusY: 540,
    roll: lerp(
      -2.5,
      0,
      ease.inOutCubic(progress(t, CUES.diveImpact, CUES.noCloud)),
    ),
  };
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
  container.querySelectorAll(".glyph").forEach((letter, index) => {
    const amount = easing(
      progress(t, start + index * stagger, start + index * stagger + duration),
    );
    const skewAmount = skew * (1 - Math.abs(amount * 2 - 1));
    style(letter, {
      transform: `translateY(${lerp(from, to, amount)}%) skewY(${skewAmount}deg)`,
    });
  });
}

export function render(t) {
  const visible = t >= CUES.diveStart && t < WHIP_END;
  show(phone, visible);
  if (!visible) {
    style(world, { transform: "none" });
    return;
  }

  const pose = phonePose(t);
  const camera = cameraPose(t);
  style(world, {
    transform:
      `translate(960px, 540px) rotate(${camera.roll}deg) scale(${camera.k}) ` +
      `translate(${-camera.focusX}px, ${-camera.focusY}px)`,
  });
  style(phone, {
    transform:
      `translate(${pose.x - PHONE_WIDTH / 2}px, ${pose.y - PHONE_HEIGHT / 2}px) ` +
      `rotateY(${pose.rotateY}deg) rotateX(${pose.rotateX}deg) rotateZ(${pose.rotateZ}deg)`,
  });

  // ── Manifesto type (bar 2) ─────────────────────────────────────────────
  const manifestoOut = ease.inOutCubic(progress(t, beat(7.55), beat(8.05)));
  show(manifesto, t < beat(8.1));
  style(manifesto, {
    opacity: 1 - manifestoOut,
    transform: `translateY(${-40 * manifestoOut}px) scale(${1 - 0.25 * manifestoOut})`,
  });
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
  if (t >= beat(5.5)) {
    animateGlyphs(wordMoney, t, beat(5.5), {
      stagger: 0.014,
      duration: 0.22,
      from: 0,
      to: -118,
      easing: ease.inCubic,
    });
  }
  show(wordDevice, t >= beat(5.8));
  animateGlyphs(wordDevice, t, beat(5.85), {
    stagger: 0.024,
    duration: 0.45,
    skew: -6,
  });

  // ── Bezel draws itself around the words ────────────────────────────────
  const draw = ease.inOutCubic(
    progress(t, CUES.phoneWrap, CUES.phoneWrap + 0.34),
  );
  style(outline, {
    opacity: draw > 0 ? 1 - progress(t, CUES.noCloud, CUES.noCloud + 0.4) : 0,
  });
  for (const path of outline.querySelectorAll("path")) {
    style(path, { strokeDashoffset: 1 - draw });
  }
  const solid = ease.outCubic(progress(t, CUES.phoneWrap + 0.18, CUES.noCloud));
  style(body, { opacity: solid });
  style(island, { opacity: solid });
  style(screenBackground, {
    opacity: ease.inOutCubic(
      progress(t, CUES.phoneWrap + 0.25, CUES.noCloud + 0.1),
    ),
  });

  // ── The real app, scrolling as if someone were browsing ────────────────
  const appIn = ease.outExpo(progress(t, beat(7.75), beat(7.75) + 0.6));
  show(app, t >= beat(7.7));
  style(phone.querySelector(".phone-status"), { opacity: appIn });
  const scroll = ease.inOutSine(progress(t, beat(9), beat(15.3))) * 520;
  style(app, {
    opacity: appIn,
    transform: `translateY(${(1 - appIn) * 30}px)`,
  });
  style(appShot, {
    transform: `scale(${SCREEN_WIDTH / 390}) translateY(${-scroll}px)`,
  });
}

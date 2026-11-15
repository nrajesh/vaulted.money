/**
 * Entry point for the composition.
 *
 * `window.__render(seconds)` poses every layer for one instant; render.mjs
 * calls it once per (sub-)frame. Opening index.html through any static
 * server without `?render` gives a real-time preview with a scrubber.
 */
import { DURATION } from "./timeline.mjs";
import { clearFx } from "./lib/fx.mjs";
import { decodeAllImages, loadScreens } from "./lib/screens.mjs";
import * as backdrop from "./scenes/backdrop.mjs";
import * as vault from "./scenes/vault.mjs";
import * as phone from "./scenes/phone.mjs";
import * as privacy from "./scenes/privacy.mjs";
import * as desktop from "./scenes/desktop.mjs";
import * as reports from "./scenes/reports.mjs";
import * as themes from "./scenes/themes.mjs";
import * as everywhere from "./scenes/everywhere.mjs";
import * as montage from "./scenes/montage.mjs";
import * as lockup from "./scenes/lockup.mjs";
import * as hud from "./scenes/hud.mjs";
import * as finishing from "./scenes/finishing.mjs";

// Order matters only for shared state: the backdrop is drawn first, and
// finishing (flash, shake) runs last.
const scenes = [
  backdrop,
  vault,
  phone,
  privacy,
  desktop,
  reports,
  themes,
  everywhere,
  montage,
  lockup,
  hud,
  finishing,
];

const FONT_FACES = [
  '400 40px "Inter Tight"',
  '500 40px "Inter Tight"',
  '600 40px "Inter Tight"',
  '700 40px "Inter Tight"',
  '800 40px "Inter Tight"',
  '900 40px "Inter Tight"',
  'italic 400 40px "Instrument Serif"',
  '400 40px "Instrument Serif"',
  '400 40px "JetBrains Mono"',
  '500 40px "JetBrains Mono"',
  '600 40px "JetBrains Mono"',
];

function render(seconds) {
  const t = Math.min(Math.max(seconds, 0), DURATION - 1e-4);
  clearFx();
  for (const scene of scenes) scene.render(t);
}

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400..900" +
  "&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400..600&display=block";

/** Resolve once a stylesheet has loaded (or failed). */
function stylesheetSettled(link) {
  if (link.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
  });
}

async function loadFonts() {
  const localFonts = document.querySelector('link[href="out/fonts.css"]');
  await stylesheetSettled(localFonts);
  let hasLocalFonts = false;
  try {
    hasLocalFonts = localFonts.sheet?.cssRules.length > 0;
  } catch {
    hasLocalFonts = false;
  }
  if (!hasLocalFonts) {
    const link = Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: GOOGLE_FONTS,
    });
    document.head.append(link);
    await stylesheetSettled(link);
  }
  // Fonts load lazily; request every face up front so frame 0 is final.
  const sample = "Vaulted Money €0123456789 .,:;/—%+-";
  const loaded = await Promise.all(
    FONT_FACES.map((face) => document.fonts.load(face, sample)),
  );
  if (loaded.some((faces) => faces.length === 0)) {
    throw new Error(
      "A font face failed to load; delete out/fonts.css and re-run render.mjs",
    );
  }
  await document.fonts.ready;
}

async function boot() {
  await Promise.all([loadFonts(), loadScreens()]);
  const stage = document.getElementById("stage");
  for (const scene of scenes) scene.mount?.(stage);
  // Real app screenshots must be decoded before frame 0 is captured.
  await decodeAllImages();

  window.__render = render;
  render(0);
  window.__showreelReady = true;

  if (!new URLSearchParams(location.search).has("render")) startPreview();
}

/** Real-time preview: scales the stage to the window and plays the soundtrack. */
function startPreview() {
  const stage = document.getElementById("stage");
  const player = document.getElementById("player");
  const playButton = document.getElementById("play");
  const scrub = document.getElementById("scrub");
  const clock = document.getElementById("clock");
  player.hidden = false;

  const fit = () => {
    const scale = Math.min(innerWidth / 1920, (innerHeight - 48) / 1080);
    stage.style.transformOrigin = "0 0";
    stage.style.transform = `scale(${scale})`;
  };
  fit();
  addEventListener("resize", fit);

  const audio = new Audio("out/soundtrack.wav");
  let playing = false;
  let startedAt = 0;
  let offset = 0;

  const show = (seconds) => {
    render(seconds);
    scrub.value = String(seconds);
    clock.textContent = `${seconds.toFixed(2)}s`;
  };

  const tick = () => {
    if (!playing) return;
    const seconds = offset + (performance.now() - startedAt) / 1000;
    if (seconds >= DURATION) {
      playing = false;
      playButton.textContent = "Play";
      show(DURATION);
      return;
    }
    show(seconds);
    requestAnimationFrame(tick);
  };

  playButton.addEventListener("click", () => {
    playing = !playing;
    playButton.textContent = playing ? "Pause" : "Play";
    if (playing) {
      if (offset >= DURATION - 0.01) offset = 0;
      startedAt = performance.now();
      audio.currentTime = offset;
      audio.play().catch(() => {});
      requestAnimationFrame(tick);
    } else {
      offset += (performance.now() - startedAt) / 1000;
      audio.pause();
    }
  });

  scrub.addEventListener("input", () => {
    playing = false;
    playButton.textContent = "Play";
    audio.pause();
    offset = Number(scrub.value);
    show(offset);
  });
}

boot().catch((error) => {
  window.__showreelError = String(error?.stack ?? error);
  console.error(error);
});

/**
 * A quiet reel HUD between the opening and the lockup: crop marks, a running
 * timecode, the chapter name (which scrambles as it changes) and an 8-step
 * progress bar, one step per bar of music.
 */
import { BAR, CUES, SCENES } from "../timeline.mjs";
import { clamp, ease, progress } from "../lib/motion.mjs";
import { html, show, style } from "../lib/dom.mjs";

const CHAPTERS = [
  "Vault",
  "Ownership",
  "Privacy",
  "Track",
  "Budget",
  "Insight",
  "Everywhere",
  "Vaulted Money",
];
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/";
const FPS = 60;

let root;
let timecode;
let chapter;
let segments;

export function mount() {
  root = html(`
    <div class="hud-frame">
      <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
      <div class="hud-label hud-tl">VAULTED MONEY <b>/</b> SHOWREEL</div>
      <div class="hud-label hud-tr"></div>
      <div class="hud-label hud-bl"></div>
      <div class="hud-progress">${SCENES.map(() => "<span><i></i></span>").join("")}</div>
    </div>`);
  document.getElementById("hud").append(root);
  timecode = root.querySelector(".hud-tr");
  chapter = root.querySelector(".hud-bl");
  segments = [...root.querySelectorAll(".hud-progress i")];
}

function scramble(text, age, index) {
  return text
    .toUpperCase()
    .split("")
    .map((character, position) => {
      if (character === " " || age > position * 0.02 + 0.12) return character;
      return GLYPHS[
        (Math.floor(age * 50) + position * 5 + index * 3) % GLYPHS.length
      ];
    })
    .join("");
}

export function render(t) {
  const enter = ease.outExpo(
    progress(t, CUES.diveImpact + 0.1, CUES.diveImpact + 0.8),
  );
  const exit = ease.inCubic(progress(t, CUES.lockup - 0.4, CUES.lockup - 0.05));
  const presence = enter * (1 - exit);
  show(root, presence > 0);
  if (presence <= 0) return;
  style(root, {
    opacity: presence,
    transform: `scale(${1.04 - 0.04 * enter})`,
  });

  const frame = Math.floor(t * FPS);
  const seconds = Math.floor(frame / FPS);
  const pad = (value) => String(value).padStart(2, "0");
  timecode.textContent = `TC 00:00:${pad(seconds)}:${pad(frame % FPS)}`;

  const index = Math.min(SCENES.length - 1, Math.floor(t / BAR));
  const age = t - index * BAR;
  chapter.textContent = `${pad(index + 1)} — ${scramble(CHAPTERS[index], age, index)}`;

  segments.forEach((segment, segmentIndex) => {
    style(segment, {
      transform: `scaleX(${clamp((t - segmentIndex * BAR) / BAR)})`,
    });
  });
}

/**
 * A quiet reel HUD between the opening and the lockup: crop marks, a running
 * timecode, the chapter name (which scrambles as it changes) and a progress
 * bar with one segment per chapter, sized by the chapter's length in bars.
 * It inverts over the light theme and steps aside for the montage.
 */
import { CHAPTERS, CUES } from "../timeline.mjs";
import { clamp, ease, progress } from "../lib/motion.mjs";
import { html, show, style } from "../lib/dom.mjs";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/";
const FPS = 60;

let root;
let timecode;
let chapterLabel;
let segments;

export function mount() {
  root = html(`
    <div class="hud-frame">
      <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
      <div class="hud-label hud-tl">VAULTED MONEY <b>/</b> SHOWREEL</div>
      <div class="hud-label hud-tr"></div>
      <div class="hud-label hud-bl"></div>
      <div class="hud-progress">${CHAPTERS.map(
        (chapter) =>
          `<span style="width:${(chapter.bars[1] - chapter.bars[0] + 1) * 14}px"><i></i></span>`,
      ).join("")}</div>
    </div>`);
  document.getElementById("hud").append(root);
  timecode = root.querySelector(".hud-tr");
  chapterLabel = root.querySelector(".hud-bl");
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
  const montage = ease.inOutCubic(
    progress(t, CUES.montage - 0.1, CUES.montage + 0.05),
  );
  const exit = Math.max(
    montage,
    ease.inCubic(progress(t, CUES.lockup - 0.4, CUES.lockup - 0.05)),
  );
  const presence = enter * (1 - exit);
  show(root, presence > 0);
  if (presence <= 0) return;
  style(root, {
    opacity: presence,
    transform: `scale(${1.04 - 0.04 * enter})`,
  });
  // Dark ink while the light theme fills the frame.
  const light = t > CUES.themeToggle + 0.35 && t < CUES.themeBack + 0.35;
  root.classList.toggle("on-light", light);

  const frame = Math.floor(t * FPS);
  const pad = (value) => String(value).padStart(2, "0");
  timecode.textContent = `TC 00:00:${pad(Math.floor(frame / FPS))}:${pad(frame % FPS)}`;

  const index = Math.max(
    0,
    CHAPTERS.findIndex((chapter) => t < chapter.end),
  );
  const chapter = CHAPTERS[index];
  chapterLabel.textContent = `${pad(index + 1)} — ${scramble(chapter.label, t - chapter.start, index)}`;

  segments.forEach((segment, segmentIndex) => {
    const { start, end } = CHAPTERS[segmentIndex];
    style(segment, {
      transform: `scaleX(${clamp((t - start) / (end - start))})`,
    });
  });
}

/**
 * Bar 24 — highlights.
 *
 * Seven hard cuts on the eighth notes, each a busy, colourful real screen
 * with a mono label naming the feature, punching in slightly: fast on
 * purpose, to leave the impression of how much is in the app. On the last
 * half-beat the frame collapses into the point the logo is born from.
 */
import { CUES, beat } from "../timeline.mjs";
import { ease, impulse, lerp, progress } from "../lib/motion.mjs";
import { html, show, style } from "../lib/dom.mjs";
import { rect, screen, screenCrop } from "../lib/screens.mjs";

const CUT_LENGTH = beat(0.5);
const COLLAPSE_START = CUES.montage + beat(3.5);

/** A 16:9 region around two boxes, padded, centred on them. */
function around(first, second, padding = 60) {
  const left = Math.min(first.x, second.x) - padding;
  const top = Math.min(first.y, second.y) - padding;
  const right =
    Math.max(first.x + first.width, second.x + second.width) + padding;
  const bottom =
    Math.max(first.y + first.height, second.y + second.height) + padding;
  const width = Math.max(right - left, ((bottom - top) * 16) / 9);
  const height = (width * 9) / 16;
  return {
    x: (left + right - width) / 2,
    y: (top + bottom - height) / 2,
    width,
    height,
  };
}

function cuts() {
  const sankey = screen("desktop-reports-sankey-dark");
  const budgets = around(
    rect("desktop-budgets-dark", "overBudget"),
    rect("desktop-budgets-dark", "onTrack"),
  );
  const providerDialog = rect("desktop-ai-provider-dark", "dialog");
  return [
    {
      shot: "desktop-transactions-categorized-dark",
      region: { x: 60, y: 400, width: 880, height: 495 },
      label: "Auto-categorise",
    },
    {
      shot: "desktop-ai-provider-dark",
      region: {
        x: providerDialog.x - 170,
        y: providerDialog.y - 20,
        width: providerDialog.width + 340,
        height: ((providerDialog.width + 340) * 9) / 16,
      },
      label: "Local AI",
    },
    {
      shot: "desktop-budgets-dark",
      region: budgets,
      label: "Budgets & goals",
    },
    {
      shot: "desktop-reports-sankey-dark",
      region: {
        x: 0,
        y: 0,
        width: sankey.width,
        height: (sankey.width * 9) / 16,
      },
      label: "Cash flow",
    },
    {
      shot: "desktop-calendar-dark",
      region: { x: 0, y: 100, width: 1280, height: 720 },
      label: "Calendar",
    },
    {
      shot: "desktop-scheduled-dark",
      region: { x: 60, y: 60, width: 1380, height: 776.25 },
      label: "Recurring",
    },
    {
      shot: "desktop-ledgers-light",
      region: { x: 360, y: 40, width: 720, height: 405 },
      label: "Multi-ledger",
    },
  ];
}

let root;
let frames;
let labels;

export function mount() {
  const list = cuts();
  root = html(`
    <section class="montage">
      ${list
        .map(
          (cut) => `
          <div class="montage-frame">
            ${screenCrop(cut.shot, cut.region, 1920)}
            <span class="montage-label">${cut.label}</span>
          </div>`,
        )
        .join("")}
    </section>`);
  document.getElementById("lockup-layer").append(root);
  frames = [...root.querySelectorAll(".montage-frame")];
  labels = [...root.querySelectorAll(".montage-label")];
}

export function render(t) {
  const visible = t >= CUES.montage && t < CUES.lockup;
  show(root, visible);
  if (!visible) return;

  const index = Math.min(
    frames.length - 1,
    Math.floor((t - CUES.montage) / CUT_LENGTH),
  );
  const collapse = ease.inExpo(progress(t, COLLAPSE_START, CUES.lockup));
  frames.forEach((frame, frameIndex) => {
    const active = frameIndex === index;
    show(frame, active);
    if (!active) return;
    const cutAt = CUES.montage + frameIndex * CUT_LENGTH;
    const punch = ease.outExpo(progress(t, cutAt, cutAt + 0.22));
    const flash = impulse(t, cutAt, 16);
    style(frame, {
      opacity: 1 - collapse,
      filter: `brightness(${1 + flash * 0.6 + collapse * 2})`,
      transform:
        `scale(${lerp(1.14, 1.04, punch) * lerp(1, 0.02, collapse)}) ` +
        `rotate(${(frameIndex % 2 ? 1 : -1) * (1 - punch) * 1.2}deg)`,
    });
    const label = labels[frameIndex];
    style(label, {
      opacity: punch,
      transform: `translateY(${(1 - punch) * 16}px)`,
    });
  });
}

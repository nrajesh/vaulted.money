/**
 * Bars 11–12 — "See where it goes."
 *
 * The desktop window has tipped back into an isometric plane (a nod to the
 * isometric shield), and six real report screens rise out of it on springs:
 * the cash-flow Sankey first, then its neighbours. Shadows stay on the
 * floor so height reads as real. The camera ends pushing into the Sankey.
 */
import { CUES, beat } from "../timeline.mjs";
import { clamp, ease, lerp, noise, progress, spring } from "../lib/motion.mjs";
import { glyphs, html, show, style } from "../lib/dom.mjs";
import { screen, screenCrop } from "../lib/screens.mjs";

const START = beat(39.6);
const END = beat(48.4);
const CARD_WIDTH = 640;
const CARD_HEIGHT = 400;
const GAP = 48;

/** Which real screen, and which part of it, each card shows. */
function cards() {
  const sankey = screen("desktop-reports-sankey-dark");
  return [
    {
      name: "desktop-analytics-dark",
      region: { x: 0, y: 0, width: 1440, height: 900 },
      lift: 70,
    },
    {
      name: "desktop-reports-sankey-dark",
      region: { x: 0, y: 0, width: sankey.width, height: sankey.width / 1.6 },
      lift: 170,
    },
    {
      name: "desktop-reports-essential-dark",
      region: { x: 0, y: 0, width: 1440, height: 900 },
      lift: 100,
    },
    {
      name: "desktop-calendar-dark",
      region: { x: 0, y: 0, width: 1440, height: 900 },
      lift: 90,
    },
    {
      name: "desktop-insights-dark",
      region: { x: 0, y: 0, width: 1440, height: 900 },
      lift: 120,
    },
    {
      name: "desktop-reports-essential-dark",
      region: { x: 0, y: 560, width: 1440, height: 900 },
      lift: 60,
    },
  ];
}
/** Rise order: the Sankey first, then outwards. */
const RING = [1, 0, 1, 2, 1, 2];

let root;
let plane;
let cardElements;
let shadows;
let title;
let chips;
let layout;

export function mount() {
  layout = cards();
  const position = (index) =>
    `left:${(index % 3) * (CARD_WIDTH + GAP)}px;top:${Math.floor(index / 3) * (CARD_HEIGHT + GAP)}px`;
  root = html(`
    <section class="reports">
      <div class="reports-plane">
        ${layout.map((_, index) => `<div class="reports-shadow" style="${position(index)}"></div>`).join("")}
        ${layout
          .map(
            (card, index) =>
              `<div class="reports-card" style="${position(index)}">${screenCrop(card.name, card.region, CARD_WIDTH)}</div>`,
          )
          .join("")}
      </div>
    </section>`);
  title = html(`
    <div class="reports-title">
      <div class="desk-copy-line">${glyphs("See where")}</div>
      <div class="desk-copy-line serif-line">${glyphs("it goes.", "serif")}</div>
      <p class="desk-copy-sub">Net worth, cash flow, trends and a calendar of every day.</p>
      <div class="reports-chips"><span>Export</span><b>PDF</b><b>Excel</b><b>CSV</b></div>
    </div>`);
  document.getElementById("screen-layer").append(root);
  document.getElementById("type-layer").append(title);
  plane = root.querySelector(".reports-plane");
  cardElements = [...root.querySelectorAll(".reports-card")];
  shadows = [...root.querySelectorAll(".reports-shadow")];
  chips = [...title.querySelectorAll(".reports-chips > *")];
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(title, visible);
  if (!visible) return;

  const enter = ease.outCubic(progress(t, START, CUES.reportsRise + 0.4));
  const drift = progress(t, CUES.reports, END);
  const push = ease.inOutCubic(progress(t, CUES.reportsFocus, beat(47.6)));
  const exit = ease.inCubic(progress(t, beat(47.2), END));
  // Pushing in slides the plane so the Sankey card comes to the centre.
  const sankeyOffset = CARD_HEIGHT / 2 + GAP / 2;
  style(plane, {
    opacity: clamp(enter * 2) * (1 - exit),
    transform:
      `translate(-50%, -50%) rotateX(${lerp(56, 50, drift) - push * 14}deg) ` +
      `rotateZ(${lerp(-36, -28, ease.inOutSine(drift)) + push * 14}deg) ` +
      `scale(${lerp(0.7, 0.8, ease.outCubic(drift)) * lerp(1, 1.9, push)}) ` +
      `translate(0px, ${push * sankeyOffset}px) translateZ(${noise(t * 0.5, 2) * 8}px)`,
  });

  cardElements.forEach((card, index) => {
    const start = CUES.reportsRise + RING[index] * 0.09;
    const rise = spring(t - start, { stiffness: 150, damping: 13 });
    const lift = layout[index].lift * rise;
    style(card, {
      opacity: clamp((t - start) * 6),
      transform: `translateZ(${lift}px) rotateX(${(1 - clamp(rise)) * -12}deg)`,
    });
    style(shadows[index], {
      opacity: clamp(rise) * 0.8,
      transform: `translate(${lift * 0.35}px, ${lift * 0.5}px) scale(${1 + lift / 900})`,
    });
  });

  // Title, then the export formats one by one.
  title.querySelectorAll(".glyph").forEach((glyph, index) => {
    const amount = ease.outExpo(
      progress(
        t,
        CUES.reports + index * 0.018,
        CUES.reports + 0.5 + index * 0.018,
      ),
    );
    style(glyph, { transform: `translateY(${(1 - amount) * 110}%)` });
  });
  const sub = title.querySelector(".desk-copy-sub");
  const subIn = ease.outExpo(
    progress(t, CUES.reports + 0.35, CUES.reports + 0.95),
  );
  style(sub, {
    opacity: subIn,
    transform: `translateY(${(1 - subIn) * 18}px)`,
  });
  chips.forEach((chip, index) => {
    const pop = ease.outBack(
      progress(
        t,
        beat(42) + index * beat(0.5),
        beat(42) + index * beat(0.5) + 0.35,
      ),
      2,
    );
    style(chip, {
      opacity: clamp(pop * 1.5),
      transform: `translateY(${(1 - pop) * 24}px) scale(${0.7 + pop * 0.3})`,
    });
  });
  style(title, {
    opacity: 1 - exit,
    transform: `translateY(${-exit * 60}px)`,
  });
}

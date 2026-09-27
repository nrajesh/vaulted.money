/**
 * Bars 14–16 — "See where it goes."
 *
 * The desktop window has tipped back into an isometric plane (a nod to the
 * isometric shield), and six real report screens rise out of it on springs:
 * the cash-flow Sankey top-left, Analytics top-middle, then their
 * neighbours. Shadows stay on the floor so height reads as real.
 *
 * The camera then leans into the Analytics card and a cursor puts the real
 * chart through its paces: hovering the line for a day's total, switching to
 * bars and hovering the biggest week, then to a pie and clicking the largest
 * slice, which drills the breakdown below into its sub-categories. Every
 * state is a capture of the app in that state.
 */
import { CUES, beat } from "../timeline.mjs";
import {
  clamp,
  ease,
  impulse,
  lerp,
  noise,
  progress,
  spring,
} from "../lib/motion.mjs";
import { glyphs, html, show, style } from "../lib/dom.mjs";
import { rect, screen, screenCrop } from "../lib/screens.mjs";

const START = beat(51.6);
const END = beat(64.4);
const EXIT = beat(63.3);
/** The chart's cursor bows out just before the theme cursor appears. */
const CURSOR_OUT = CUES.themeToggle - beat(1.2);
const CARD_WIDTH = 640;
const CARD_HEIGHT = 400;
const GAP = 48;
const COLUMNS = 3;
const PLANE_WIDTH = COLUMNS * CARD_WIDTH + (COLUMNS - 1) * GAP;
const PLANE_HEIGHT = 2 * CARD_HEIGHT + GAP;
/** The Analytics card: top row, middle column. */
const FOCUS_INDEX = 1;

/** The analytics chart in each state, in the order the cursor visits them. */
const CHART_STATES = [
  { shot: "desktop-analytics-line-dark", at: -Infinity },
  { shot: "desktop-analytics-line-hover-dark", at: CUES.chartHover },
  { shot: "desktop-analytics-bar-dark", at: CUES.chartBar },
  { shot: "desktop-analytics-bar-hover-dark", at: CUES.chartBarHover },
  { shot: "desktop-analytics-pie-dark", at: CUES.chartPie },
  { shot: "desktop-analytics-pie-active-dark", at: CUES.chartPieSlice },
];
/**
 * The part of the analytics page each card shows: the total, the chart card
 * and the top of the breakdown under it, at the wall's 16:10.
 */
function chartRegion() {
  const total = rect("desktop-analytics-line-dark", "total");
  const x = total.x - 10;
  const width = 1440 - 12 - x;
  return { x, y: total.y - 18, width, height: width / 1.6 };
}

/** Which real screen, and which part of it, each card shows. */
function cards() {
  const sankey = screen("desktop-reports-sankey-dark");
  return [
    {
      name: "desktop-reports-sankey-dark",
      region: { x: 0, y: 0, width: sankey.width, height: sankey.width / 1.6 },
      lift: 110,
    },
    { chart: true, lift: 170 },
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
/** Rise order: Analytics first, then outwards. */
const RING = [1, 0, 1, 2, 1, 2];

let root;
let plane;
let cardElements;
let shadows;
let chartLayers;
let chartCursor;
let chartRipple;
let title;
let chips;
let layout;
let region;
let path;
let clicks;

/** A point on the analytics page (capture CSS px) → the card's own px. */
function toCard(point) {
  const scale = CARD_WIDTH / region.width;
  return {
    x: (point.x - region.x) * scale,
    y: (point.y - region.y) * scale,
  };
}

const centre = (box) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/** Where the cursor goes, and when: hover, click a toggle, hover, click… */
function cursorPath() {
  const line = "desktop-analytics-line-hover-dark";
  const bar = "desktop-analytics-bar-hover-dark";
  const pie = "desktop-analytics-pie-active-dark";
  const points = {
    enter: { x: 1330, y: 1150 },
    lineHover: rect(line, "pointer"),
    barToggle: centre(rect(line, "bar")),
    barHover: rect(bar, "pointer"),
    pieToggle: centre(rect(line, "pie")),
    pieSlice: rect(pie, "pointer"),
  };
  const card = Object.fromEntries(
    Object.entries(points).map(([key, point]) => [key, toCard(point)]),
  );
  // Arrive just before each change, hold on it, then move on.
  const arrive = (cue) => cue - 0.06;
  const leave = (cue) => cue + beat(0.3);
  return [
    { t: beat(54.3), ...card.enter },
    { t: arrive(CUES.chartHover), ...card.lineHover },
    { t: CUES.chartBar - beat(0.9), ...card.lineHover },
    { t: arrive(CUES.chartBar), ...card.barToggle },
    { t: leave(CUES.chartBar), ...card.barToggle },
    { t: arrive(CUES.chartBarHover), ...card.barHover },
    { t: CUES.chartPie - beat(0.9), ...card.barHover },
    { t: arrive(CUES.chartPie), ...card.pieToggle },
    { t: leave(CUES.chartPie), ...card.pieToggle },
    { t: arrive(CUES.chartPieSlice), ...card.pieSlice },
  ];
}

function cursorAt(t) {
  if (t <= path[0].t) return path[0];
  for (let index = 1; index < path.length; index++) {
    const next = path[index];
    if (t <= next.t) {
      const previous = path[index - 1];
      const amount = ease.inOutCubic(progress(t, previous.t, next.t));
      // A slight arc, like a hand moving a mouse.
      const arc = Math.sin(amount * Math.PI) * -12;
      return {
        x: lerp(previous.x, next.x, amount),
        y: lerp(previous.y, next.y, amount) + arc,
      };
    }
  }
  return path[path.length - 1];
}

export function mount() {
  layout = cards();
  region = chartRegion();
  path = cursorPath();
  clicks = [
    {
      t: CUES.chartBar,
      point: toCard(centre(rect("desktop-analytics-line-dark", "bar"))),
    },
    {
      t: CUES.chartPie,
      point: toCard(centre(rect("desktop-analytics-line-dark", "pie"))),
    },
    {
      t: CUES.chartPieSlice,
      point: toCard(rect("desktop-analytics-pie-active-dark", "pointer")),
    },
  ];
  const position = (index) =>
    `left:${(index % COLUMNS) * (CARD_WIDTH + GAP)}px;top:${Math.floor(index / COLUMNS) * (CARD_HEIGHT + GAP)}px`;
  const cardContent = (card) =>
    card.chart
      ? `${CHART_STATES.map(
          (state) =>
            `<div class="chart-state">${screenCrop(state.shot, region, CARD_WIDTH)}</div>`,
        ).join("")}
        <div class="chart-ripple"></div>
        <div class="chart-cursor">
          <svg viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.9 L11.6 21.6 L14.6 20.3 L11.6 13.7 L17.8 13.7 Z" /></svg>
        </div>`
      : screenCrop(card.name, card.region, CARD_WIDTH);
  root = html(`
    <section class="reports">
      <div class="reports-plane" style="width:${PLANE_WIDTH}px;height:${PLANE_HEIGHT}px">
        ${layout.map((_, index) => `<div class="reports-shadow" style="${position(index)}"></div>`).join("")}
        ${layout
          .map(
            (card, index) =>
              `<div class="reports-card" style="${position(index)}">${cardContent(card)}</div>`,
          )
          .join("")}
      </div>
    </section>`);
  title = html(`
    <div class="reports-title">
      <div class="desk-copy-line">${glyphs("See where")}</div>
      <div class="desk-copy-line serif-line">${glyphs("it goes.", "serif")}</div>
      <p class="desk-copy-sub">Cash flow, net worth and trends. Line, bar or pie, with the detail on hover.</p>
      <div class="reports-chips"><span>Export</span><b>PDF</b><b>Excel</b><b>CSV</b></div>
    </div>`);
  document.getElementById("screen-layer").append(root);
  document.getElementById("type-layer").append(title);
  plane = root.querySelector(".reports-plane");
  cardElements = [...root.querySelectorAll(".reports-card")];
  shadows = [...root.querySelectorAll(".reports-shadow")];
  chartLayers = [...root.querySelectorAll(".chart-state")];
  chartCursor = root.querySelector(".chart-cursor");
  chartRipple = root.querySelector(".chart-ripple");
  chips = [...title.querySelectorAll(".reports-chips > *")];
}

function renderChart(t) {
  // Each state cuts in quickly, like the app re-rendering its chart.
  chartLayers.forEach((layer, index) => {
    const state = CHART_STATES[index];
    const next = CHART_STATES[index + 1];
    const visible = t >= state.at && (!next || t < next.at + 0.15);
    show(layer, visible);
    if (visible) {
      style(layer, {
        opacity:
          index === 0
            ? 1
            : ease.outCubic(progress(t, state.at, state.at + 0.12)),
      });
    }
  });

  const cursorVisible = t >= path[0].t && t < CURSOR_OUT;
  show(chartCursor, cursorVisible);
  if (cursorVisible) {
    const point = cursorAt(t);
    const press = Math.max(
      ...clicks.map((click) => (t >= click.t ? impulse(t, click.t, 14) : 0)),
    );
    style(chartCursor, {
      opacity:
        clamp((t - path[0].t) * 5) *
        (1 - progress(t, CURSOR_OUT - 0.1, CURSOR_OUT)),
      transform: `translate(${point.x}px, ${point.y}px) scale(${1 - press * 0.2})`,
    });
  }
  const click = clicks.find((entry) => t >= entry.t && t < entry.t + 0.5);
  show(chartRipple, Boolean(click));
  if (click) {
    const grow = ease.outCubic((t - click.t) / 0.5);
    style(chartRipple, {
      opacity: 1 - grow,
      transform: `translate(${click.point.x}px, ${click.point.y}px) translate(-50%, -50%) scale(${0.3 + grow * 1.4})`,
    });
  }
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(title, visible);
  if (!visible) return;

  const enter = ease.outCubic(progress(t, START, CUES.reportsRise + 0.4));
  const drift = progress(t, CUES.reports, END);
  // Lean in until the Analytics card fills the right of the frame, nearly
  // face-on, then keep drifting so the frame never freezes.
  const focus = ease.inOutCubic(
    progress(t, CUES.reportsFocus, CUES.reportsFocus + beat(2.2)),
  );
  const hold = progress(t, CUES.reportsFocus, EXIT);
  const exit = ease.inCubic(progress(t, EXIT, END));
  // Bring the focused card to the plane's pivot, then place it on stage.
  const focusRow = Math.floor(FOCUS_INDEX / COLUMNS);
  const focusColumn = FOCUS_INDEX % COLUMNS;
  const toPivotX =
    PLANE_WIDTH / 2 - (focusColumn * (CARD_WIDTH + GAP) + CARD_WIDTH / 2);
  const toPivotY =
    PLANE_HEIGHT / 2 - (focusRow * (CARD_HEIGHT + GAP) + CARD_HEIGHT / 2);
  const tiltX = lerp(lerp(56, 50, drift), 14 - hold * 3, focus);
  const tiltZ = lerp(
    lerp(-36, -28, ease.inOutSine(drift)),
    -6 + hold * 3,
    focus,
  );
  const zoom =
    lerp(lerp(0.7, 0.8, ease.outCubic(drift)), 1.62 + hold * 0.08, focus) *
    lerp(1, 1.6, exit);
  style(plane, {
    opacity: clamp(enter * 2) * (1 - exit),
    transform:
      `translate(-50%, -50%) translate(${focus * 150}px, ${focus * -90}px) ` +
      `rotateX(${tiltX}deg) rotateZ(${tiltZ}deg) scale(${zoom}) ` +
      `translate(${focus * toPivotX}px, ${focus * toPivotY}px) ` +
      `translateZ(${noise(t * 0.5, 2) * 8}px)`,
  });

  cardElements.forEach((card, index) => {
    const start = CUES.reportsRise + RING[index] * 0.09;
    const rise = spring(t - start, { stiffness: 150, damping: 13 });
    const lift = layout[index].lift * rise;
    // Neighbours dim while the camera leans into Analytics.
    const dim = index === FOCUS_INDEX ? 0 : focus * 0.55;
    style(card, {
      opacity: clamp((t - start) * 6),
      filter: dim > 0 ? `brightness(${1 - dim})` : "none",
      transform: `translateZ(${lift}px) rotateX(${(1 - clamp(rise)) * -12}deg)`,
    });
    style(shadows[index], {
      opacity: clamp(rise) * 0.8 * (1 - focus * 0.5),
      transform: `translate(${lift * 0.35}px, ${lift * 0.5}px) scale(${1 + lift / 900})`,
    });
  });
  renderChart(t);

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
    const at = beat(53) + index * beat(0.5);
    const pop = ease.outBack(progress(t, at, at + 0.35), 2);
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

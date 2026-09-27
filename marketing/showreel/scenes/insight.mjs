/**
 * Scene 6 — "See where it goes." (bar 6).
 *
 * The budget layout has tipped back into an isometric plane — a nod to the
 * isometric shield — and nine report cards rise out of it on springs, the
 * centre card first, then each ring outwards. Shadows stay on the floor, so
 * height reads as real. Every card's chart animates as it arrives.
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
} from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";

const START = beat(19.6);
const END = beat(24.4);
const RISE = CUES.insightRise;
const EXIT = beat(23.1);

const CARD_WIDTH = 460;
const CARD_HEIGHT = 290;
const GAP = 44;

const bars = [38, 52, 44, 61, 48, 70, 56, 64, 42, 58, 74, 50];
const donut = [
  { value: 34, color: "#6fd3de" },
  { value: 22, color: "#3f9fc0" },
  { value: 18, color: "#7fe0b8" },
  { value: 14, color: "#f3bc7c" },
  { value: 12, color: "#b9a4ff" },
];
const vendors = [
  { name: "Supermarket", value: 0.92 },
  { name: "Rail & bus", value: 0.64 },
  { name: "Cafés", value: 0.48 },
  { name: "Streaming", value: 0.3 },
];

const CARDS = [
  {
    kind: "networth",
    body: () => `
      <header><span>Net worth</span><em>+12.4%</em></header>
      <strong data-count="48210" data-prefix="€">€0</strong>
      <svg viewBox="0 0 400 110" class="chart-line" preserveAspectRatio="none">
        <defs><linearGradient id="iso-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6fd3de" stop-opacity="0.4"/><stop offset="1" stop-color="#6fd3de" stop-opacity="0"/></linearGradient></defs>
        <path class="area" d="M0 96 C40 90,60 70,100 74 S160 50,200 56 S270 30,300 34 S360 10,400 8 L400 110 L0 110Z" fill="url(#iso-area)"/>
        <path class="line" pathLength="1" d="M0 96 C40 90,60 70,100 74 S160 50,200 56 S270 30,300 34 S360 10,400 8"/>
      </svg>`,
  },
  {
    kind: "bars",
    body: () => `
      <header><span>Monthly spending</span><em>12 mo</em></header>
      <svg viewBox="0 0 400 150" class="chart-bars">
        ${bars.map((value, index) => `<rect x="${index * 34 + 4}" y="${150 - value * 2}" width="22" height="${value * 2}" rx="5" />`).join("")}
      </svg>`,
  },
  {
    kind: "donut",
    body: () => {
      let offset = 0;
      const circumference = 2 * Math.PI * 62;
      const segments = donut
        .map((segment) => {
          const length = (segment.value / 100) * circumference;
          const markup = `<circle r="62" cx="80" cy="80" stroke="${segment.color}" data-length="${length - 4}" data-offset="${-offset}" stroke-dasharray="0 ${circumference}" />`;
          offset += length;
          return markup;
        })
        .join("");
      return `
      <header><span>By category</span><em>This month</em></header>
      <div class="donut-row">
        <svg viewBox="0 0 160 160" class="chart-donut">${segments}</svg>
        <ul>${["Housing", "Food", "Transport", "Leisure", "Other"].map((label, index) => `<li><i style="background:${donut[index].color}"></i>${label}</li>`).join("")}</ul>
      </div>`;
    },
  },
  {
    kind: "savings",
    body: () => `
      <header><span>Savings rate</span><em>Goal 20%</em></header>
      <strong data-count="23" data-suffix="%">0%</strong>
      <div class="meter"><i></i><b></b></div>`,
  },
  {
    kind: "runway",
    body: () => `
      <header><span>Runway</span>${icon("shield-check", 22)}</header>
      <strong class="huge" data-count="14.2" data-decimals="1">0.0</strong>
      <p>months covered by your savings</p>`,
  },
  {
    kind: "flow",
    body: () => `
      <header><span>Income vs expenses</span><em>6 mo</em></header>
      <svg viewBox="0 0 400 150" class="chart-flow">
        ${[70, 64, 78, 72, 80, 76]
          .map(
            (income, index) =>
              `<rect class="income" x="${index * 66 + 8}" y="${150 - income * 1.8}" width="20" height="${income * 1.8}" rx="5"/>` +
              `<rect class="expense" x="${index * 66 + 32}" y="${150 - (income - 18 + (index % 3) * 4) * 1.8}" width="20" height="${(income - 18 + (index % 3) * 4) * 1.8}" rx="5"/>`,
          )
          .join("")}
      </svg>`,
  },
  {
    kind: "calendar",
    body: () => `
      <header><span>Spending calendar</span><em>September</em></header>
      <div class="heatmap">${Array.from({ length: 35 }, (_, index) => `<i data-level="${(index * 7 + 3) % 5}"></i>`).join("")}</div>`,
  },
  {
    kind: "gauge",
    body: () => `
      <header><span>Wealth-o-meter</span><em>Healthy</em></header>
      <svg viewBox="0 0 240 130" class="chart-gauge">
        <defs><linearGradient id="gauge-grad"><stop offset="0" stop-color="#f3bc7c"/><stop offset="0.5" stop-color="#6fd3de"/><stop offset="1" stop-color="#7fe0b8"/></linearGradient></defs>
        <path class="gauge-track" d="M20 120 A100 100 0 0 1 220 120" />
        <path class="gauge-value" pathLength="1" d="M20 120 A100 100 0 0 1 220 120" />
        <line class="needle" x1="120" y1="120" x2="120" y2="38" />
        <circle cx="120" cy="120" r="8" fill="#eaf6f7" />
      </svg>`,
  },
  {
    kind: "vendors",
    body: () => `
      <header><span>Top vendors</span><em>30 days</em></header>
      <div class="vendors">${vendors.map((vendor) => `<div><span>${vendor.name}</span><b style="--w:${vendor.value}"></b></div>`).join("")}</div>`,
  },
];

/** Rise order: centre first, then edge neighbours, then corners. */
const RING = [2, 1, 2, 1, 0, 1, 2, 1, 2];
const HEIGHTS = [70, 110, 60, 95, 170, 80, 55, 120, 75];

let root;
let plane;
let cards;
let shadows;
let title;

export function mount() {
  root = html(`
    <section class="insight">
      <div class="iso-plane">
        ${CARDS.map((_, index) => `<div class="iso-shadow" style="left:${(index % 3) * (CARD_WIDTH + GAP)}px;top:${Math.floor(index / 3) * (CARD_HEIGHT + GAP)}px"></div>`).join("")}
        ${CARDS.map(
          (card, index) => `
          <article class="iso-card kind-${card.kind}" style="left:${(index % 3) * (CARD_WIDTH + GAP)}px;top:${Math.floor(index / 3) * (CARD_HEIGHT + GAP)}px">
            ${card.body()}
          </article>`,
        ).join("")}
      </div>
    </section>`);
  title = html(`
    <div class="insight-title">
      <span class="insight-word">${glyphs("See")}</span>
      <span class="insight-serif">${glyphs("where it goes.", "serif")}</span>
    </div>`);
  document.getElementById("screen-layer").append(root);
  document.getElementById("type-layer").append(title);
  plane = root.querySelector(".iso-plane");
  cards = [...root.querySelectorAll(".iso-card")];
  shadows = [...root.querySelectorAll(".iso-shadow")];
}

function animateCard(card, t, start) {
  const amount = ease.outExpo(progress(t, start, start + 1));
  card.querySelectorAll("[data-count]").forEach((element) => {
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals ?? 0);
    element.textContent = `${element.dataset.prefix ?? ""}${euros(target * amount, decimals)}${element.dataset.suffix ?? ""}`;
  });
  const line = card.querySelector(".line");
  if (line) {
    style(line, { strokeDashoffset: 1 - amount });
    style(card.querySelector(".area"), { opacity: amount });
  }
  card
    .querySelectorAll(".chart-bars rect, .chart-flow rect")
    .forEach((bar, index) => {
      const grow = ease.outBack(
        progress(t, start + index * 0.025, start + index * 0.025 + 0.5),
        1.6,
      );
      style(bar, { transform: `scaleY(${Math.max(grow, 0)})` });
    });
  card.querySelectorAll(".chart-donut circle").forEach((segment) => {
    const circumference = 2 * Math.PI * 62;
    const length = Number(segment.dataset.length) * amount;
    segment.setAttribute(
      "stroke-dasharray",
      `${Math.max(length, 0)} ${circumference}`,
    );
    segment.setAttribute(
      "stroke-dashoffset",
      String(Number(segment.dataset.offset) * amount),
    );
  });
  const meter = card.querySelector(".meter i");
  if (meter) style(meter, { transform: `scaleX(${(0.23 / 0.4) * amount})` });
  card.querySelectorAll(".heatmap i").forEach((cell, index) => {
    const wave = clamp(
      (t - start) * 3.2 - (index % 7) * 0.12 - Math.floor(index / 7) * 0.12,
    );
    const level = Number(cell.dataset.level);
    style(cell, { opacity: 0.08 + wave * (0.15 + level * 0.2) });
  });
  const gauge = card.querySelector(".gauge-value");
  if (gauge) {
    style(gauge, { strokeDashoffset: 1 - 0.74 * amount });
    const swing = spring(t - start - 0.1, { stiffness: 90, damping: 7 });
    style(card.querySelector(".needle"), {
      transform: `rotate(${lerp(-90, 44, swing)}deg)`,
    });
  }
  card.querySelectorAll(".vendors b").forEach((bar, index) => {
    const grow = ease.outExpo(
      progress(t, start + index * 0.06, start + index * 0.06 + 0.7),
    );
    style(bar, { transform: `scaleX(${grow})` });
  });
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  show(title, visible);
  if (!visible) return;

  // The plane itself: matches the budget's tip, then drifts like a crane shot.
  const enter = ease.outCubic(progress(t, beat(19.6), beat(20.6)));
  const drift = progress(t, beat(20), END);
  const exit = ease.inExpo(progress(t, EXIT, EXIT + beat(1.4)));
  style(plane, {
    transform:
      `translate(-50%, -50%) rotateX(${lerp(58, 52, drift)}deg) rotateZ(${lerp(-36, -28, ease.inOutSine(drift))}deg) ` +
      `scale(${lerp(0.78, 0.9, ease.outCubic(drift))}) translateZ(${noise(t * 0.5, 2) * 10}px)`,
    opacity: clamp(enter * 2),
  });

  cards.forEach((card, index) => {
    const start = RISE + RING[index] * 0.08;
    const rise = spring(t - start, { stiffness: 150, damping: 13 });
    const lift = HEIGHTS[index] * rise;
    const flyAway = ease.inExpo(
      progress(t, EXIT + RING[index] * 0.05, EXIT + 0.45 + RING[index] * 0.05),
    );
    style(card, {
      opacity: clamp((t - start) * 6) * (1 - flyAway),
      transform: `translateZ(${lift + flyAway * 1400}px) rotateX(${(1 - clamp(rise)) * -12}deg)`,
    });
    style(shadows[index], {
      opacity: clamp(rise) * 0.8 * (1 - flyAway),
      transform: `translate(${lift * 0.35}px, ${lift * 0.5}px) scale(${1 + lift / 900})`,
    });
    animateCard(card, t, start + 0.08);
  });

  // Title.
  title.querySelectorAll(".glyph").forEach((glyph, index) => {
    const start = CUES.insight + index * 0.018;
    const amount = ease.outExpo(progress(t, start, start + 0.5));
    style(glyph, { transform: `translateY(${(1 - amount) * 110}%)` });
  });
  const titleExit = ease.inExpo(progress(t, EXIT, EXIT + 0.4));
  style(title, {
    opacity: 1 - titleExit,
    transform: `translateY(${-titleExit * 120}px)`,
  });
}

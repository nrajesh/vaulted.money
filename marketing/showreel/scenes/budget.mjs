/**
 * Scene 5 — "Budget with intent." (bar 5).
 *
 * We come out of the phone's glass into a full-frame budget view. Cards
 * flip up on a spring, rings sweep to their values while the numbers count,
 * and on beat 18 "Dining out" crosses 90%: the ring turns amber, the card
 * shudders and a heads-up toast drops in. On beat 19.6 the whole layout
 * tips backwards into the isometric plane of the next scene.
 */
import { CUES, beat } from "../timeline.mjs";
import {
  clamp,
  ease,
  euros,
  impulse,
  lerp,
  noise,
  progress,
  spring,
} from "../lib/motion.mjs";
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";

const START = beat(15.8);
const END = beat(20.6);
const RING_RADIUS = 104;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const BUDGETS = [
  {
    name: "Groceries",
    icon: "shopping-cart",
    percent: 72,
    spent: 432,
    limit: 600,
  },
  {
    name: "Transport",
    icon: "train-front",
    percent: 45,
    spent: 90,
    limit: 200,
  },
  {
    name: "Dining out",
    icon: "utensils",
    percent: 91,
    spent: 273,
    limit: 300,
    warn: true,
  },
  {
    name: "Savings goal",
    icon: "piggy-bank",
    percent: 64,
    spent: 3200,
    limit: 5000,
    goal: true,
  },
];
const PERIODS = ["Monthly", "Quarterly", "Yearly", "One-time"];

let root;
let title;
let control;
let pill;
let cards;
let toast;

export function mount() {
  root = html(`
    <section class="budget">
      <div class="budget-title">
        <span class="budget-word">${glyphs("Budget")}</span>
        <span class="budget-serif">${glyphs("with intent.", "serif")}</span>
      </div>
      <div class="period-control">
        <span class="period-pill"></span>
        ${PERIODS.map((period, index) => `<span class="period ${index === 0 ? "active" : ""}">${period}</span>`).join("")}
      </div>
      <div class="budget-cards">
        ${BUDGETS.map(
          (budget) => `
          <article class="budget-card ${budget.warn ? "warn" : ""} ${budget.goal ? "goal" : ""}">
            <svg class="ring" viewBox="0 0 260 260">
              <circle class="ring-track" cx="130" cy="130" r="${RING_RADIUS}" />
              <circle class="ring-value" cx="130" cy="130" r="${RING_RADIUS}"
                stroke-dasharray="${RING_LENGTH}" stroke-dashoffset="${RING_LENGTH}" />
            </svg>
            <div class="ring-label"><strong>0%</strong><small>${budget.goal ? "saved" : "spent"}</small></div>
            <div class="budget-name">${icon(budget.icon, 26)}<span>${budget.name}</span></div>
            <div class="budget-amount">€0 of €${euros(budget.limit, 0)}</div>
          </article>`,
        ).join("")}
      </div>
      <div class="budget-toast"><i></i>Heads up — Dining out is at 91% of this month’s budget</div>
    </section>`);
  document.getElementById("screen-layer").append(root);
  title = root.querySelector(".budget-title");
  control = root.querySelector(".period-control");
  pill = root.querySelector(".period-pill");
  cards = [...root.querySelectorAll(".budget-card")];
  toast = root.querySelector(".budget-toast");
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  if (!visible) return;

  // Arrive out of the zoom-through; leave by tipping into the plane.
  const arrive = ease.outExpo(progress(t, beat(15.85), beat(16.7)));
  const fadeIn = progress(t, beat(15.85), beat(16.05));
  const tip = ease.inOutCubic(progress(t, beat(19.55), beat(20.35)));
  style(root, {
    opacity: fadeIn * (1 - ease.inCubic(progress(t, beat(20.1), beat(20.6)))),
    transform:
      `perspective(2200px) translateY(${tip * 140}px) rotateX(${tip * 58}deg) ` +
      `rotateZ(${tip * -36}deg) scale(${lerp(0.62, 1, arrive) * lerp(1, 0.52, tip)})`,
  });

  // Title glyphs.
  title.querySelectorAll(".glyph").forEach((glyph, index) => {
    const start = beat(16) + index * 0.018 - 0.1;
    const amount = ease.outExpo(progress(t, start, start + 0.5));
    style(glyph, { transform: `translateY(${(1 - amount) * 110}%)` });
  });

  // Period control and its pill.
  const controlIn = ease.outExpo(progress(t, beat(16.4), beat(16.4) + 0.5));
  style(control, {
    opacity: controlIn,
    transform: `translateX(${(1 - controlIn) * -40}px)`,
  });
  style(pill, {
    transform: `scaleX(${ease.outBack(progress(t, beat(16.6), beat(16.6) + 0.4))})`,
  });

  // Cards: flip up, fill rings, count numbers.
  const warnAt = CUES.budgetWarn;
  cards.forEach((card, index) => {
    const budget = BUDGETS[index];
    const enter = spring(t - (beat(16.15) + index * 0.07), {
      stiffness: 190,
      damping: 17,
    });
    const shake = budget.warn
      ? impulse(t, warnAt, 7) * noise(t * 60, index) * 16
      : 0;
    const warnPulse = budget.warn ? impulse(t, warnAt, 5) : 0;
    style(card, {
      opacity: clamp(enter * 1.4),
      transform:
        `translateY(${(1 - enter) * 120}px) translateX(${shake}px) ` +
        `rotateX(${(1 - enter) * 35}deg) scale(${1 + warnPulse * 0.04})`,
    });

    const fillStart = beat(16.6) + index * 0.07;
    const fill = ease.outExpo(progress(t, fillStart, fillStart + 0.9));
    const percent = budget.percent * fill;
    const ring = card.querySelector(".ring-value");
    style(ring, { strokeDashoffset: RING_LENGTH * (1 - percent / 100) });
    card.querySelector(".ring-label strong").textContent =
      `${Math.round(percent)}%`;
    card.querySelector(".budget-amount").textContent =
      `€${euros(budget.spent * fill, 0)} of €${euros(budget.limit, 0)}`;
    if (budget.warn) card.classList.toggle("alert", t >= warnAt);
  });

  const toastIn = spring(t - warnAt - 0.05, { stiffness: 220, damping: 18 });
  style(toast, {
    opacity: clamp(toastIn * 1.5),
    transform: `translateY(${(1 - toastIn) * -40}px) scale(${0.9 + 0.1 * clamp(toastIn)})`,
  });
}

/**
 * Bars 5–10 — the desktop app, on real screens.
 *
 * One window stays on stage while the story moves through it, like a screen
 * recording directed by a camera:
 *   bars 5–6   a bank export drops onto "Import CSV"; the real import dialog,
 *              its column mapping, and the new (uncategorised) rows;
 *   bars 7–8   the cursor clicks "Categorize Missing" and a scan line sweeps
 *              the table as categories appear; then the AI provider page
 *              (a local model) and the "keys stay local" settings card;
 *   bars 9–10  budgets, with the real overspend alerts popping out, before
 *              the window tips back into the isometric reports wall.
 * All images are captures of the running app (capture.mjs); callouts are
 * placed from the element boxes recorded at capture time.
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
import { glyphs, html, icon, show, style } from "../lib/dom.mjs";
import { rect, screenCrop, screenImage } from "../lib/screens.mjs";

const START = beat(15.4);
const END = beat(40.6);
const VIEW_WIDTH = 1440;
const VIEW_HEIGHT = 900;
const BAR_HEIGHT = 44;
const WINDOW_SCALE = 0.78;
const WINDOW_HEIGHT = VIEW_HEIGHT + BAR_HEIGHT;
// Stage position of the window's centre (it scales and turns about it).
const CENTER_X = 1920 - 70 - (VIEW_WIDTH * WINDOW_SCALE) / 2;
const CENTER_Y = 178 + (WINDOW_HEIGHT * WINDOW_SCALE) / 2;
const TIP_START = CUES.budgetsTip;
const TIP_END = beat(40.3);

const PAGES = [
  { name: "desktop-transactions-dark", at: START },
  { name: "desktop-import-settings-dark", at: CUES.importSettings },
  { name: "desktop-import-map-dark", at: CUES.importMap },
  { name: "desktop-transactions-imported-dark", at: CUES.imported },
  {
    name: "desktop-transactions-categorized-dark",
    at: CUES.categorized,
    wipe: true,
  },
  { name: "desktop-ai-providers-dark", at: CUES.aiProviders },
  { name: "desktop-budgets-dark", at: CUES.budgets },
];

const COPY = [
  {
    from: CUES.desktopIn,
    to: beat(23.7),
    plain: "Import any",
    serif: "bank's CSV.",
    sub: "Columns are matched for you, and the file never leaves this device.",
  },
  {
    from: beat(24),
    to: beat(27.7),
    plain: "Sorted in",
    serif: "one tap.",
    sub: "Categories come from your own history first.",
  },
  {
    from: CUES.aiProviders,
    to: beat(31.7),
    plain: "AI, only if",
    serif: "you want it.",
    sub: "Bring your own key, or point it at a model running on your machine.",
  },
  {
    from: CUES.budgets,
    to: TIP_START + 0.1,
    plain: "Budget",
    serif: "with intent.",
    sub: "Limits and goals, with a heads-up before you overspend.",
  },
];

let root;
let windowElement;
let content;
let pages;
let copyBlocks;
let csvCard;
let cursor;
let ripple;
let scanline;
let callouts;
let keyCard;
let alertCards;
let geometry;
let cameraKeys;

// ── Geometry, read from the capture manifest ────────────────────────────────
function measure() {
  const importCsv = rect("desktop-transactions-dark", "importCsv");
  const categorize = rect("desktop-transactions-imported-dark", "categorize");
  const firstRow = rect("desktop-transactions-imported-dark", "firstRow");
  const categoryHeader = rect(
    "desktop-transactions-imported-dark",
    "categoryHeader",
  );
  const subHeader = rect(
    "desktop-transactions-imported-dark",
    "subCategoryHeader",
  );
  const preview = rect("desktop-import-settings-dark", "preview");
  const mapDialog = safeRect("desktop-import-map-dark", "dialog", {
    x: 338,
    y: 10,
    width: 764,
    height: 880,
  });
  const toast = safeRect("desktop-transactions-categorized-dark", "toast", {
    x: 1036,
    y: 790,
    width: 388,
    height: 94,
  });
  const providerRow = rect("desktop-ai-providers-dark", "row");
  // Whichever real budgets the demo produced: one on track, one over.
  const dining = rect("desktop-budgets-dark", "onTrack");
  const entertainment = rect("desktop-budgets-dark", "overBudget");
  const rows = {
    x: categoryHeader.x - 8,
    y: firstRow.y - 4,
    width: subHeader.x + subHeader.width - categoryHeader.x + 16,
    height: firstRow.height * 6 + 8,
  };
  return {
    importCsv,
    categorize,
    firstRow,
    preview,
    mapDialog,
    toast,
    providerRow,
    dining,
    entertainment,
    rows,
  };
}

function safeRect(name, key, fallback) {
  try {
    return rect(name, key);
  } catch {
    return fallback;
  }
}

const centre = (box) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/** Camera keyframes inside the window: zoom and focus in page CSS px. */
function buildCamera(g) {
  const home = { z: 1, x: 720, y: 450 };
  const rowsFocus = { x: g.rows.x + 360, y: g.rows.y + g.rows.height / 2 };
  const budgetsFocus = {
    x: (centre(g.dining).x + centre(g.entertainment).x) / 2,
    y: centre(g.dining).y - 20,
  };
  const toastFocus = centre(g.toast);
  const providerFocus = centre(g.providerRow);
  const previewFocus = centre(g.preview);
  return [
    { t: START, ...home },
    { t: beat(16.4), ...home },
    { t: beat(16.9), z: 1.18, x: centre(g.importCsv).x - 120, y: 330 },
    { t: beat(17.45), ...home },
    { t: beat(18.4), z: 1.55, ...previewFocus },
    { t: beat(19.4), z: 1.58, x: previewFocus.x + 24, y: previewFocus.y },
    { t: beat(19.8), z: 1.22, x: 720, y: g.mapDialog.y + 300 },
    {
      t: beat(21.3),
      z: 1.22,
      x: 720,
      y: g.mapDialog.y + g.mapDialog.height - 300,
    },
    { t: beat(21.65), ...home },
    { t: beat(22.5), z: 1.42, ...rowsFocus },
    { t: beat(23.9), z: 1.44, ...rowsFocus },
    { t: beat(24.35), z: 1.1, x: 720, y: 400 },
    { t: beat(25.3), z: 1.1, x: 720, y: 400 },
    { t: beat(25.9), z: 1.42, ...rowsFocus },
    { t: beat(26.9), z: 1.44, ...rowsFocus },
    { t: beat(27.5), z: 1.32, ...toastFocus },
    { t: beat(27.95), z: 1.32, ...toastFocus },
    { t: beat(28.15), ...home },
    { t: beat(28.8), z: 1.36, ...providerFocus },
    { t: beat(31.7), z: 1.4, ...providerFocus },
    { t: beat(32.15), ...home },
    { t: beat(33.1), z: 1.3, ...budgetsFocus },
    { t: beat(37.6), z: 1.34, x: budgetsFocus.x + 20, y: budgetsFocus.y },
    { t: TIP_START + 0.2, ...home },
  ];
}

function cameraAt(t) {
  const keys = cameraKeys;
  if (t <= keys[0].t) return keys[0];
  for (let index = 1; index < keys.length; index++) {
    const next = keys[index];
    if (t <= next.t) {
      const previous = keys[index - 1];
      const amount = ease.inOutCubic(progress(t, previous.t, next.t));
      return {
        z: lerp(previous.z, next.z, amount),
        x: lerp(previous.x, next.x, amount),
        y: lerp(previous.y, next.y, amount),
      };
    }
  }
  return keys[keys.length - 1];
}

// ── Markup ──────────────────────────────────────────────────────────────────
const callout = (id, box, label = "", tone = "cyan", labelAt = 0) => `
  <div class="callout tone-${tone}" data-callout="${id}"
       style="left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px;--label-at:${labelAt * 100}%">
    <svg viewBox="0 0 ${box.width} ${box.height}" preserveAspectRatio="none">
      <rect x="1.5" y="1.5" width="${box.width - 3}" height="${box.height - 3}" rx="12" pathLength="1" />
    </svg>
    ${label ? `<span class="callout-label">${label}</span>` : ""}
  </div>`;

function windowMarkup(g) {
  return `
  <div class="desk-window">
    <div class="desk-bar"><i></i><i></i><i></i><span>Vaulted Money</span></div>
    <div class="desk-view">
      <div class="desk-content">
        ${PAGES.map((page) => `<div class="desk-page" data-page="${page.name}">${screenImage(page.name)}</div>`).join("")}
        <div class="desk-scanline"><i></i></div>
        ${callout("import", pad(g.importCsv, 6))}
        ${callout("rows", g.rows, "6 new · uncategorised", "gold")}
        ${callout("categorize", pad(g.categorize, 6))}
        ${callout("sorted", g.rows, "Matched from your history", "mint")}
        ${callout("toast", pad(g.toast, 4))}
        ${callout("provider", pad(g.providerRow, 4), "A local model on this machine", "cyan", 0.42)}
        ${callout("dining", pad(g.dining, 6), "On track", "mint")}
        ${callout("entertainment", pad(g.entertainment, 6), "Over budget", "rose")}
        <div class="desk-ripple"></div>
        <div class="desk-cursor">
          <svg viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.9 L11.6 21.6 L14.6 20.3 L11.6 13.7 L17.8 13.7 Z" /></svg>
        </div>
      </div>
    </div>
  </div>`;
}

const pad = (box, amount) => ({
  x: box.x - amount,
  y: box.y - amount,
  width: box.width + amount * 2,
  height: box.height + amount * 2,
});

export function mount() {
  geometry = measure();
  cameraKeys = buildCamera(geometry);
  root = html(`<section class="desk">${windowMarkup(geometry)}</section>`);
  document.getElementById("screen-layer").append(root);
  windowElement = root.querySelector(".desk-window");
  content = root.querySelector(".desk-content");
  pages = [...root.querySelectorAll(".desk-page")];
  scanline = root.querySelector(".desk-scanline");
  cursor = root.querySelector(".desk-cursor");
  ripple = root.querySelector(".desk-ripple");
  callouts = Object.fromEntries(
    [...root.querySelectorAll("[data-callout]")].map((element) => [
      element.dataset.callout,
      element,
    ]),
  );

  // Copy column and floating pieces live in the type layer, above the window.
  const typeLayer = document.getElementById("type-layer");
  copyBlocks = COPY.map((block) => {
    const element = html(`
      <div class="desk-copy">
        <div class="desk-copy-line">${glyphs(block.plain)}</div>
        <div class="desk-copy-line serif-line">${glyphs(block.serif, "serif")}</div>
        <p class="desk-copy-sub">${block.sub}</p>
      </div>`);
    typeLayer.append(element);
    return element;
  });
  csvCard = html(`
    <div class="csv-card">
      <div class="csv-fold"></div>
      <div class="csv-head">${icon("file-spreadsheet", 30)}<span>bank-export.csv</span></div>
      <div class="csv-grid">${Array.from({ length: 7 }, () => "<i></i><i></i><i></i>").join("")}</div>
      <div class="csv-foot">6 rows</div>
    </div>`);
  // Header, default provider and the masked key field of the real card.
  keyCard = html(
    `<div class="pop-shot">${screenCrop("desktop-settings-ai-dark", { x: 0, y: 0, width: 720, height: 290 }, 760)}</div>`,
  );
  alertCards = ["alertA", "alertB"].map((key) =>
    html(
      `<div class="pop-shot">${screenCrop("desktop-insights-dark", rect("desktop-insights-dark", key), 400)}</div>`,
    ),
  );
  typeLayer.append(csvCard, keyCard, ...alertCards);
}

/** Where a point on the page (CSS px) lands on the stage right now. */
function pageToStage(point, camera) {
  const viewX = (point.x - camera.x) * camera.z + VIEW_WIDTH / 2;
  const viewY = (point.y - camera.y) * camera.z + VIEW_HEIGHT / 2;
  return {
    x: CENTER_X + (viewX - VIEW_WIDTH / 2) * WINDOW_SCALE,
    y: CENTER_Y + (BAR_HEIGHT + viewY - WINDOW_HEIGHT / 2) * WINDOW_SCALE,
  };
}

function renderCallout(name, t, from, to, pulseAt) {
  const element = callouts[name];
  const draw = ease.outCubic(progress(t, from, from + 0.35));
  const fade = 1 - progress(t, to - 0.2, to);
  const visible = t >= from && t < to;
  show(element, visible);
  if (!visible) return;
  const pulse = pulseAt ? impulse(t, pulseAt, 6) : 0;
  style(element, { opacity: fade, transform: `scale(${1 + pulse * 0.04})` });
  style(element.querySelector("rect"), { strokeDashoffset: 1 - draw });
  const label = element.querySelector(".callout-label");
  if (label) {
    const labelIn = ease.outBack(progress(t, from + 0.2, from + 0.5), 1.8);
    style(label, {
      opacity: clamp(labelIn),
      transform: `translateY(${(1 - labelIn) * 10}px)`,
    });
  }
}

function renderCopy(t) {
  COPY.forEach((block, index) => {
    const element = copyBlocks[index];
    const visible = t >= block.from - 0.1 && t < block.to + 0.3;
    show(element, visible);
    if (!visible) return;
    element.querySelectorAll(".glyph").forEach((glyph, glyphIndex) => {
      const enter = ease.outExpo(
        progress(
          t,
          block.from + glyphIndex * 0.018,
          block.from + 0.5 + glyphIndex * 0.018,
        ),
      );
      const leave = ease.inCubic(
        progress(
          t,
          block.to + glyphIndex * 0.008,
          block.to + 0.22 + glyphIndex * 0.008,
        ),
      );
      style(glyph, {
        transform: `translateY(${(1 - enter) * 110 - leave * 115}%)`,
      });
    });
    const sub = element.querySelector(".desk-copy-sub");
    const subIn = ease.outExpo(
      progress(t, block.from + 0.35, block.from + 0.95),
    );
    const subOut = progress(t, block.to - 0.05, block.to + 0.15);
    style(sub, {
      opacity: subIn * (1 - subOut),
      transform: `translateY(${(1 - subIn) * 18}px)`,
    });
  });
}

export function render(t) {
  const visible = t >= START && t < END;
  show(root, visible);
  for (const element of [csvCard, keyCard, ...alertCards, ...copyBlocks]) {
    if (!visible) show(element, false);
  }
  if (!visible) return;

  // ── The window: whips in, floats, then tips back into the plane ────────
  const enter = ease.outExpo(progress(t, beat(15.7), beat(16.45)));
  const tip = ease.inOutCubic(progress(t, TIP_START, TIP_END));
  const float = (1 - tip) * noise(t * 0.4, 12) * 3;
  style(windowElement, {
    opacity: 1 - ease.inCubic(progress(t, beat(39.4), END)),
    transform:
      `translate(${CENTER_X - VIEW_WIDTH / 2 + (1 - enter) * 1500 - tip * 330}px, ` +
      `${CENTER_Y - WINDOW_HEIGHT / 2 + tip * 70}px) ` +
      `scale(${WINDOW_SCALE * lerp(1, 0.62, tip)}) ` +
      `rotateX(${tip * 56 + float * 0.3}deg) rotateY(${(1 - enter) * -24 + float}deg) rotateZ(${tip * -34}deg)`,
  });

  // ── Camera inside the window ────────────────────────────────────────────
  const camera = cameraAt(t);
  style(content, {
    transform:
      `translate(${VIEW_WIDTH / 2}px, ${VIEW_HEIGHT / 2}px) scale(${camera.z}) ` +
      `translate(${-camera.x}px, ${-camera.y}px)`,
  });

  // ── Pages: quick cross-dissolves like in-app navigation ─────────────────
  PAGES.forEach((page, index) => {
    const element = pages[index];
    const next = PAGES[index + 1];
    const visiblePage = t >= page.at - 0.05 && (!next || t < next.at + 0.8);
    show(element, visiblePage);
    if (!visiblePage) return;
    if (page.wipe) {
      const wipe = ease.inOutCubic(progress(t, page.at, page.at + 0.55));
      style(element, {
        opacity: 1,
        clipPath: `inset(0 0 ${(1 - wipe) * 100}% 0)`,
      });
    } else {
      const fade =
        index === 0
          ? 1
          : ease.outCubic(progress(t, page.at - 0.05, page.at + 0.16));
      style(element, { opacity: fade, clipPath: "none" });
    }
  });

  // Scan line riding the wipe edge as categories land.
  const wipe = progress(t, CUES.categorized, CUES.categorized + 0.55);
  show(scanline, wipe > 0 && wipe < 1);
  style(scanline, {
    transform: `translateY(${ease.inOutCubic(wipe) * VIEW_HEIGHT}px)`,
  });

  // ── Callouts ────────────────────────────────────────────────────────────
  renderCallout("import", t, beat(16.6), beat(17.5), CUES.csvDrop);
  renderCallout("rows", t, beat(22.5), beat(24.4));
  renderCallout("categorize", t, beat(24.5), beat(26), CUES.categorizeClick);
  renderCallout("sorted", t, beat(25.9), beat(27.3));
  renderCallout("toast", t, beat(27.3), beat(28.05));
  renderCallout("provider", t, beat(28.8), beat(31.8));
  renderCallout("dining", t, beat(33.2), beat(38.3));
  renderCallout("entertainment", t, beat(33.6), beat(38.3));

  // ── Cursor clicks "Categorize Missing" on beat 25 ───────────────────────
  const target = centre(geometry.categorize);
  const travel = ease.inOutCubic(progress(t, beat(24.1), beat(24.85)));
  const cursorVisible = t >= beat(24.05) && t < beat(26.2);
  show(cursor, cursorVisible);
  if (cursorVisible) {
    const press =
      impulse(t, CUES.categorizeClick, 14) *
      (t >= CUES.categorizeClick ? 1 : 0);
    style(cursor, {
      opacity: 1 - progress(t, beat(25.8), beat(26.2)),
      transform: `translate(${lerp(target.x + 380, target.x, travel)}px, ${
        lerp(target.y + 330, target.y, travel) +
        Math.sin(travel * Math.PI) * -40
      }px) scale(${1 - press * 0.18})`,
    });
  }
  const rippleAge = t - CUES.categorizeClick;
  const csvRippleAge = t - CUES.csvDrop;
  const rippleAt =
    rippleAge >= 0 && rippleAge < 0.5
      ? { age: rippleAge, point: target }
      : csvRippleAge >= 0 && csvRippleAge < 0.5
        ? { age: csvRippleAge, point: centre(geometry.importCsv) }
        : null;
  show(ripple, Boolean(rippleAt));
  if (rippleAt) {
    const grow = ease.outCubic(rippleAt.age / 0.5);
    style(ripple, {
      opacity: 1 - grow,
      transform: `translate(${rippleAt.point.x}px, ${rippleAt.point.y}px) translate(-50%, -50%) scale(${0.3 + grow * 1.6})`,
    });
  }

  // ── A bank export flies onto "Import CSV" ───────────────────────────────
  const flight = progress(t, beat(16.2), CUES.csvDrop);
  show(csvCard, flight > 0 && flight < 1);
  if (flight > 0 && flight < 1) {
    const eased = ease.inOutCubic(flight);
    const destination = pageToStage(centre(geometry.importCsv), camera);
    const x = lerp(330, destination.x, eased);
    const y = lerp(880, destination.y, eased) - Math.sin(eased * Math.PI) * 220;
    style(csvCard, {
      opacity: 1 - ease.inCubic(progress(flight, 0.8, 1)),
      transform:
        `translate(${x - 125}px, ${y - 155}px) rotate(${lerp(-14, 10, eased)}deg) ` +
        `scale(${lerp(0.95, 0.2, ease.inCubic(eased))})`,
    });
  }

  // ── "Keys are stored locally": the real settings card pops out ──────────
  const keyIn = spring(t - CUES.aiKeyCard, { stiffness: 170, damping: 16 });
  const keyOut = ease.inCubic(progress(t, beat(31.55), beat(31.95)));
  show(keyCard, t >= CUES.aiKeyCard && t < beat(32));
  style(keyCard, {
    opacity: clamp(keyIn * 2) * (1 - keyOut),
    transform:
      `translate(${lerp(700, 112, keyIn)}px, ${lerp(760, 640, keyIn) + keyOut * 60}px) ` +
      `scale(${lerp(0.4, 1, keyIn)}) rotateX(${(1 - clamp(keyIn)) * 30}deg)`,
  });

  // ── Overspend alerts from Insights pop out as notifications ─────────────
  alertCards.forEach((card, index) => {
    const at = CUES.budgetAlerts + index * beat(0.5);
    const pop = spring(t - at, { stiffness: 190, damping: 15 });
    const out = ease.inCubic(
      progress(
        t,
        TIP_START - 0.1 + index * 0.05,
        TIP_START + 0.3 + index * 0.05,
      ),
    );
    show(card, t >= at && t < TIP_START + 0.4);
    style(card, {
      opacity: clamp(pop * 2) * (1 - out),
      transform:
        `translate(${lerp(900, 112 + index * 70, pop) - out * 300}px, ${lerp(600, 600 + index * 160, pop)}px) ` +
        `rotate(${(index ? 2 : -2) * clamp(pop)}deg) scale(${lerp(0.5, 1, pop)})`,
    });
  });

  renderCopy(t);
}

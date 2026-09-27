/**
 * The shared clock for the showreel. Picture and sound both read from here,
 * so every cut, hit and whoosh lands on the same beat.
 *
 * 27 bars of 4/4 at 128 BPM is 50.625 seconds. The product tour is paced so
 * every new graphic holds for at least a second before the next one arrives;
 * only the highlights montage cuts faster, on purpose.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 128;
export const BEAT = 60 / BPM; // 0.46875 s
export const BAR = BEAT * 4; // 1.875 s
export const BARS = 27;
export const DURATION = BAR * BARS; // 50.625 s

/** Time in seconds of beat `n` (fractions allowed: beat(4.5) is an off-beat). */
export const beat = (n) => n * BEAT;

/** Chapters, by bar (1-based, inclusive). Used by the HUD and the music. */
export const CHAPTERS = [
  { id: "vault", label: "Vault", bars: [1, 1] },
  { id: "ownership", label: "Ownership", bars: [2, 2] },
  { id: "privacy", label: "Privacy", bars: [3, 4] },
  { id: "import", label: "Import", bars: [5, 7] },
  { id: "categorise", label: "Categorise", bars: [8, 9] },
  { id: "ai", label: "Local AI", bars: [10, 11] },
  { id: "budgets", label: "Budgets", bars: [12, 13] },
  { id: "reports", label: "Reports", bars: [14, 16] },
  { id: "themes", label: "Themes", bars: [17, 18] },
  { id: "everywhere", label: "Everywhere", bars: [19, 21] },
  { id: "install", label: "Open source", bars: [22, 23] },
  { id: "highlights", label: "Highlights", bars: [24, 24] },
  { id: "lockup", label: "Vaulted Money", bars: [25, 27] },
].map((chapter) => ({
  ...chapter,
  start: (chapter.bars[0] - 1) * BAR,
  end: chapter.bars[1] * BAR,
}));

/** A chapter by id. */
export const chapter = (id) => CHAPTERS.find((entry) => entry.id === id);

/**
 * Named moments that both the animation and the sound design hang off.
 * Kept in beats so a tempo change keeps everything in sync.
 */
export const CUES = {
  // Bar 1 — forge the vault.
  ignite: 0.05,
  gemLock: beat(3),
  diveStart: beat(3.25),
  diveImpact: beat(4),
  // Bar 2 — manifesto.
  wordDevice: beat(6),
  phoneWrap: beat(7),
  // Bars 3–4 — privacy.
  noCloud: beat(8),
  noTrackers: beat(10),
  noSubscriptions: beat(12),
  onDevice: beat(14),
  // Bars 5–7 — CSV import on the desktop app.
  desktopIn: beat(16),
  csvDrop: beat(18.5),
  importSettings: beat(19),
  imported: beat(23.5),
  // Bars 8–9 — categorise from history.
  categorizeClick: beat(30),
  categorized: beat(30.25),
  // Bars 10–11 — optional AI.
  aiProviders: beat(36),
  aiProviderList: beat(39.5),
  aiKeyCard: beat(41),
  // Bars 12–13 — budgets.
  budgets: beat(44),
  budgetAlerts: beat(48),
  budgetsTip: beat(51),
  // Bars 14–16 — reports, and the analytics chart put through its paces.
  reports: beat(52),
  reportsRise: beat(52.3),
  reportsFocus: beat(54),
  chartHover: beat(55.25),
  chartBar: beat(57.25),
  chartBarHover: beat(58.5),
  chartPie: beat(60.25),
  chartPieSlice: beat(61.25),
  // Bars 17–18 — light and dark (the breakdown).
  themeToggle: beat(64),
  lightMark: beat(65),
  themeBack: beat(71.25),
  // Bars 19–21 — everywhere.
  everywhere: beat(72),
  currency: beat(76),
  offline: beat(80),
  // Bars 22–23 — open source, and how to install it today.
  openSource: beat(84),
  install: beat(88),
  // Bar 24 — highlights montage.
  montage: beat(92),
  // Bars 25–27 — the lockup.
  lockup: beat(96),
  tagline: beat(98),
};

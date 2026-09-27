/**
 * The shared clock for the showreel. Picture and sound both read from here,
 * so every cut, hit and whoosh lands on the same beat.
 *
 * 20 bars of 4/4 at 128 BPM is exactly 37.5 seconds.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 128;
export const BEAT = 60 / BPM; // 0.46875 s
export const BAR = BEAT * 4; // 1.875 s
export const BARS = 20;
export const DURATION = BAR * BARS; // 37.5 s

/** Time in seconds of beat `n` (fractions allowed: beat(4.5) is an off-beat). */
export const beat = (n) => n * BEAT;

/** Chapters, by bar (1-based, inclusive). Used by the HUD and for pacing. */
export const CHAPTERS = [
  { id: "vault", label: "Vault", bars: [1, 1] },
  { id: "ownership", label: "Ownership", bars: [2, 2] },
  { id: "privacy", label: "Privacy", bars: [3, 4] },
  { id: "import", label: "Import", bars: [5, 6] },
  { id: "ai", label: "Categorise", bars: [7, 8] },
  { id: "budgets", label: "Budgets", bars: [9, 10] },
  { id: "reports", label: "Reports", bars: [11, 12] },
  { id: "themes", label: "Themes", bars: [13, 14] },
  { id: "everywhere", label: "Everywhere", bars: [15, 17] },
  { id: "highlights", label: "Highlights", bars: [18, 18] },
  { id: "lockup", label: "Vaulted Money", bars: [19, 20] },
].map((chapter) => ({
  ...chapter,
  start: (chapter.bars[0] - 1) * BAR,
  end: chapter.bars[1] * BAR,
}));

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
  // Bars 5–6 — CSV import on the desktop app.
  desktopIn: beat(16),
  csvDrop: beat(17),
  importSettings: beat(17.5),
  importMap: beat(19.5),
  imported: beat(21.5),
  // Bars 7–8 — categorise, optional AI.
  categorizeClick: beat(25),
  categorized: beat(25.25),
  aiProviders: beat(28),
  aiKeyCard: beat(30),
  // Bars 9–10 — budgets.
  budgets: beat(32),
  budgetAlerts: beat(35),
  budgetsTip: beat(38.5),
  // Bars 11–12 — reports.
  reports: beat(40),
  reportsRise: beat(40.3),
  reportsFocus: beat(45),
  // Bars 13–14 — light and dark (the breakdown).
  themeToggle: beat(48),
  lightMark: beat(49),
  themeBack: beat(55.25),
  // Bars 15–17 — everywhere.
  everywhere: beat(56),
  currency: beat(58.5),
  offline: beat(61),
  openSource: beat(64),
  // Bar 18 — highlights montage.
  montage: beat(68),
  // Bars 19–20 — the lockup.
  lockup: beat(72),
  tagline: beat(73.5),
};

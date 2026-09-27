/**
 * The shared clock for the showreel. Picture and sound both read from here,
 * so every cut, hit and whoosh lands on the same beat.
 *
 * 15 seconds at 128 BPM is exactly 8 bars of 4/4 — one bar per scene.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 128;
export const BEAT = 60 / BPM; // 0.46875 s
export const BAR = BEAT * 4; // 1.875 s
export const DURATION = BAR * 8; // 15 s

/** Time in seconds of beat `n` (fractions allowed: beat(4.5) is an off-beat). */
export const beat = (n) => n * BEAT;

/** One scene per bar. `start`/`end` are in seconds. */
export const SCENES = [
  { id: "vault", label: "Forge the vault" },
  { id: "manifesto", label: "Your money. Your device." },
  { id: "privacy", label: "No cloud. No trackers. No subscriptions." },
  { id: "track", label: "Track" },
  { id: "budget", label: "Budget" },
  { id: "insight", label: "Understand" },
  { id: "everywhere", label: "Everywhere, offline, open source" },
  { id: "lockup", label: "Vaulted Money" },
].map((scene, index) => ({
  ...scene,
  start: index * BAR,
  end: (index + 1) * BAR,
}));

/**
 * Named moments that both the animation and the sound design hang off.
 * Keep these in beats so tempo changes stay in sync automatically.
 */
export const CUES = {
  ignite: 0.05,
  gemLock: beat(3),
  diveStart: beat(3.25),
  diveImpact: beat(4),
  wordDevice: beat(6),
  phoneWrap: beat(7),
  noCloud: beat(8),
  noTrackers: beat(9),
  noSubscriptions: beat(10),
  onDevice: beat(11),
  track: beat(12),
  trackPop: beat(14),
  budget: beat(16),
  budgetWarn: beat(18),
  insight: beat(20),
  insightRise: beat(20.15),
  everywhere: beat(24),
  offline: beat(25.5),
  openSource: beat(26.5),
  lockup: beat(28),
  tagline: beat(29.5),
};

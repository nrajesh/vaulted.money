/**
 * The clock and the words of the Vaulted Money film.
 *
 * 20 bars at 108 BPM = 44 s. One feature per device: the camera sits close on
 * a device while it shows one thing, then the device flips over into the next
 * one. Five features, five devices. At the end the camera pulls back once to
 * show them all, and they fold into the logo.
 * Picture (film.mjs) and sound (score.mjs) both read from here.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const BPM = 108;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;

/** The slogan, the same wherever the name appears, and the badges under it. */
export const TAGLINE = "Private Vault. Open Code.";
export const BADGES = ["Private vault", "Local data", "Auditable code"];

/**
 * The feature beats, in order: which device shows what, under which words.
 * `*accent*` marks the serif words. Headlines are short enough to sit on one
 * or two even lines; none leaves a single word alone on a line.
 */
export const FEATURES = [
  {
    id: "ask",
    device: "iphone",
    label: "iPhone",
    bars: 3,
    headline: "Ask it like *you'd say it.*",
    note: "No AI. No cloud.",
  },
  {
    id: "bills",
    device: "android",
    label: "Android",
    bars: 2,
    headline: "Every subscription, *before it bills.*",
  },
  {
    id: "month",
    device: "ipad",
    label: "iPad",
    bars: 2,
    headline: "Your month, *at a glance.*",
  },
  {
    id: "flow",
    device: "duo",
    label: "iPhone Duo",
    bars: 3,
    headline: "Follow the flow. *See what's ahead.*",
  },
  {
    id: "spent",
    device: "desktop",
    label: "Mac · Windows · Linux",
    bars: 2,
    headline: "Every cent, *accounted for.*",
  },
];

export const COPY = {
  worry: "Money on your *mind?*",
  everywhere: "Yours alone, on *every device.*",
  proof: ["No sign-up", "No cloud", "AI off until you switch it on"],
  action: "Try the demo at vaulted.money",
};

// No three beats of the same length in a row.
const LENGTHS = [
  ["worry", 1],
  ["turn", 1],
  ...FEATURES.map((f) => [f.id, f.bars]),
  ["everywhere", 3],
  ["end", 3],
];
let at = 0;
export const CHAPTERS = Object.fromEntries(
  LENGTHS.map(([id, bars]) => {
    const c = { id, start: at, end: at + bars * BAR };
    at += bars * BAR;
    return [id, c];
  }),
);
export const DURATION = at;

/** How long a device takes to flip away, and the next to flip in. */
export const FLIP = 0.28;

/** Typing: when each key of a query of `length` lands, and what follows. */
export function moments(queryLength) {
  const ask = CHAPTERS.ask.start;
  const from = ask + 0.45;
  const to = ask + 2.3;
  return {
    askKeys: Array.from(
      { length: queryLength },
      (_, i) => from + ((to - from) * i) / (queryLength - 1),
    ),
    askUnderstood: ask + 2.45,
    askApply: ask + 3.9,
    askResult: ask + 4.1,
    // The flow beat shows two charts on the Duo: the flow, then the forecast.
    forecast: CHAPTERS.flow.start + 3.4,
    // The devices fold into the logo this long before the end card.
    merge: CHAPTERS.end.start - 0.9,
  };
}

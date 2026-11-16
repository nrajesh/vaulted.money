/**
 * The clock and the words of "You see everything. We see nothing.".
 *
 * 19 bars at 108 BPM = 42 s, cut fast: no beat lasts longer than nine
 * seconds and the phone turns to a new angle on every one. The film proves its tagline in order: three
 * questions answered by the real app (you see everything), then the same
 * search answering with the network off (we see nothing), then the name.
 * Picture (film.mjs) and sound (score.mjs) both read from here.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const BPM = 108;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;

// Short beats, none the same length three times running.
const LENGTHS = [
  ["worry", 1],
  ["turn", 1],
  ["where", 2],
  ["ask", 3],
  ["track", 2],
  ["ahead", 2],
  ["only", 4],
  ["devices", 2],
  ["end", 2],
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

export const TAGLINE = "Private Vault. Open Code.";
/** The three badges under it. */
export const BADGES = ["Private vault", "Local data", "Auditable code"];

/** Headlines: the word in *asterisks* is the accent. */
export const COPY = {
  worry: "Money on your *mind?*",
  where: "Where did it all *go?*",
  ask: "Ask it like *you'd say it.*",
  askNote: "No AI. No cloud.",
  track: "Am I on *track?*",
  ahead: "What's coming *up?*",
  who: "Who else can see *this?*",
  only: "*Only you.*",
  proof: [
    "No sign-up. No cloud.",
    "AI off until you switch it on.",
    "Open code. Audit it.",
  ],
  offline: "Network off",
  devices: "Every *device.*",
  action: "Try the demo at vaulted.money",
};

/** Typing: when each key of a query of `length` lands. */
const keys = (from, to, length) =>
  Array.from({ length }, (_, i) => from + ((to - from) * i) / (length - 1));

export function moments(queryLength) {
  const ask = CHAPTERS.ask.start;
  const only = CHAPTERS.only.start;
  return {
    askKeys: keys(ask + 0.3, ask + 2.1, queryLength),
    askUnderstood: ask + 2.25,
    askApply: ask + 3.7,
    askResult: ask + 3.9,
    // The private half: the picture turns dark as the network goes off.
    dark: only + 1.2,
    offlineKeys: keys(only + 1.9, only + 3.0, queryLength),
    offlineUnderstood: only + 3.1,
    offlineApply: only + 3.9,
    offlineResult: only + 4.1,
    onlyYou: only + 4.9,
    proof: [only + 5.7, only + 6.3, only + 6.9],
  };
}

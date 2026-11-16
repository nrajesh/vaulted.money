/**
 * The clock and the words of "You see everything. We see nothing.".
 *
 * 27 bars at 108 BPM = 60 s. The film proves its tagline in order: three
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

// No three beats of the same length in a row.
const LENGTHS = [
  ["worry", 2],
  ["turn", 2],
  ["where", 3],
  ["ask", 4],
  ["track", 3],
  ["ahead", 3],
  ["only", 5],
  ["devices", 2],
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

export const TAGLINE = "You see everything. We see nothing.";

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
  proof: ["No sign-up.", "No cloud.", "AI off until you switch it on."],
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
    askKeys: keys(ask + 0.5, ask + 3.3, queryLength),
    askUnderstood: ask + 3.55,
    askApply: ask + 5.7,
    askResult: ask + 5.95,
    // "We see nothing": the picture turns dark as the network goes off.
    dark: only + 2.0,
    offlineKeys: keys(only + 3.0, only + 4.7, queryLength),
    offlineUnderstood: only + 4.85,
    offlineApply: only + 6.0,
    offlineResult: only + 6.25,
    onlyYou: only + 7.2,
    proof: [only + 8.3, only + 8.9, only + 9.5],
  };
}

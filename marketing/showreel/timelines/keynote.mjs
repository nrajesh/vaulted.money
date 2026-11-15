/**
 * The keynote cut's clock: calmer than the social cut, each scene held long
 * enough to read its headline twice. Picture (scenes/keynote.mjs) and the
 * calm score (calmScore.mjs, via SCORE_CUES) both read from here.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;

const LENGTHS = [
  ["intro", "Vaulted Money", 5],
  ["privacy", "Privacy", 9],
  ["search", "Search", 9],
  ["labels", "Your rules", 8],
  ["ai", "Optional AI", 9],
  ["budgets", "Budgets", 8],
  ["bigScreens", "Big screens", 9],
  ["devices", "Every device", 10],
  ["end", "Vaulted Money", 9],
];

let at = 0;
export const CHAPTERS = LENGTHS.map(([id, label, seconds]) => {
  const chapter = { id, label, start: at, end: at + seconds };
  at += seconds;
  return chapter;
});

export const DURATION = at; // 76 s

export const chapter = (id) => CHAPTERS.find((c) => c.id === id);

/** Sound cues for the calm score: lifts at the big moments, quiet UI sounds. */
export const SCORE_CUES = [
  { t: chapter("intro").start + 1.2, kind: "chime" },
  { t: chapter("privacy").start, kind: "lift" },
  { t: chapter("search").start + 1.6, kind: "tick" },
  { t: chapter("labels").start + 3.5, kind: "whoosh" },
  { t: chapter("ai").start + 2.0, kind: "tick" },
  { t: chapter("budgets").start + 2.5, kind: "chime" },
  { t: chapter("bigScreens").start + 3.0, kind: "whoosh" },
  { t: chapter("devices").start, kind: "lift" },
  { t: chapter("end").start, kind: "lift" },
  { t: chapter("end").start + 1.0, kind: "chime" },
];

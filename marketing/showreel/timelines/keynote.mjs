/**
 * The keynote cut's clock: each scene held long enough to read its headline
 * twice, with something landing on the beat every second or so. Picture
 * (keynote.mjs) and the score (keynoteScore.mjs, via scoreCues) both read
 * from here, so every card that lands has its sound.
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
  ["bigScreens", "Big screens", 11],
  ["devices", "Every device", 10],
  ["end", "Vaulted Money", 9],
];

let at = 0;
export const CHAPTERS = LENGTHS.map(([id, label, seconds]) => {
  const chapter = { id, label, start: at, end: at + seconds };
  at += seconds;
  return chapter;
});

export const DURATION = at; // 78 s

export const chapter = (id) => CHAPTERS.find((c) => c.id === id);

/** The score's tempo: 120 BPM, so every chapter starts on a beat. */
export const BPM = 120;
export const BEAT = 60 / BPM;

/** How far into "Big screens" the iPad hands over to the Duo (duo/overlay.mjs). */
export const HANDOVER = 5.0;

/**
 * Every moment something lands on screen, on the half-beat grid: the time
 * it arrives (keynote.mjs starts its motion a little before) and the sound
 * the score plays there. `i` steps a sequence of pops up the scale; `web`
 * marks what only the website ending shows.
 */
const RAW = {
  intro: { logo: [0.5, "shimmer"], name: [1.5, "pop"] },
  privacy: {
    Headline: [0.5, "swish"],
    Left: [1.0, "thud"],
    Right: [1.5, "thud"],
    Sub: [3.0, "tick"],
    Body: [4.0, "tick"],
  },
  search: {
    Headline: [0.5, "swish"],
    Phone: [1.0, "thud"],
    Body: [2.5, "tick"],
    Spot: [3.5, "ding"],
  },
  labels: {
    Headline: [0.5, "swish"],
    Phone: [1.0, "thud"],
    Body: [2.5, "tick"],
    Sweep: [4.0, "sweep"],
  },
  ai: {
    Headline: [0.5, "swish"],
    Phone: [1.0, "thud"],
    Spot: [2.0, "ding"],
    Body: [2.5, "tick"],
    Chip1: [3.5, "pop", 0],
    Chip2: [4.0, "pop", 2],
  },
  budgets: {
    Headline: [0.5, "swish"],
    Phone: [1.0, "thud"],
    Body: [2.5, "tick"],
    Spot: [3.0, "ding"],
  },
  bigScreens: {
    Headline: [0.5, "swish"],
    Ipad: [1.0, "thud"],
    IpadLabel: [1.5, "pop", 1],
    Body: [2.5, "tick"],
    Duo: [HANDOVER + 0.5, "thud"],
    DuoLabel: [HANDOVER + 1.5, "pop", 3],
  },
  devices: {
    Headline: [0.5, "swish"],
    ...Object.fromEntries(
      [0, 1, 2, 3, 4].flatMap((n) => [
        [`Row${n}`, [1.0 + n * 0.5, "thud"]],
        [`Label${n}`, [1.25 + n * 0.5, "pop", n]],
      ]),
    ),
  },
  end: {
    Logo: [0, "boom"],
    Name: [0.5, "pop", 0],
    Tagline: [1.0, "tick"],
    Extra: [1.5, "tick", undefined, true],
    Badge0: [2.0, "pop", 2],
    Badge1: [2.25, "pop", 3],
    Badge2: [2.5, "pop", 4],
  },
};

export const MOMENTS = Object.fromEntries(
  Object.entries(RAW).flatMap(([id, list]) =>
    Object.entries(list).map(([key, [offset, sound, i, web]]) => [
      id === "intro"
        ? `intro${key[0].toUpperCase()}${key.slice(1)}`
        : `${id === "bigScreens" ? "big" : id}${key}`,
      {
        t: chapter(id).start + offset,
        sound,
        chapter: id,
        ...(i === undefined ? {} : { i }),
        ...(web ? { web: true } : {}),
      },
    ]),
  ),
);

/**
 * The score's cues: a sound on every moment, plus the arrangement. `drop`
 * brings in the full groove (with a riser into it), `break` thins it out
 * while the big-screen recordings play, `fill` marks the other chapter
 * changes with a short whoosh and drum fill, and `outro` lets the last chord
 * ring under the end card.
 */
export function scoreCues(web = false) {
  const effects = Object.values(MOMENTS)
    .filter((m) => !m.web || web)
    .map(({ t, sound, i }) => ({
      t,
      kind: sound,
      ...(i === undefined ? {} : { i }),
    }));
  const drops = ["privacy", "devices", "end"];
  const sections = CHAPTERS.slice(1).map((c) => ({
    t: c.start,
    kind: drops.includes(c.id)
      ? "drop"
      : c.id === "bigScreens"
        ? "break"
        : "fill",
  }));
  // The groove stops two bars into the end card and the last chord rings.
  const outro = { t: chapter("end").start + 4 * BEAT * 2, kind: "outro" };
  return [...sections, outro, ...effects].sort((a, b) => a.t - b.t);
}

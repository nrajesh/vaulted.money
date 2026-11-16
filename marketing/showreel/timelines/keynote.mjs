/**
 * The keynote cut's clock, its words and its tune: "from mess to clarity"
 * at 108 BPM, the tempo of the relaxed social cut.
 *
 * The film opens on money worries (grey, scattered notes off the beat), looks
 * at what other apps do (only look back, sell what they see), then turns: the
 * logo lands and the mess snaps into neat rows on the beat, and the groove
 * drops. Each chapter after that asks a question a careful person asks and
 * answers it, showing the idea moving first and the real app as proof. A
 * quick finale cuts through the app's screens into the end card.
 *
 * The tune is written first (SONG, PHRASE) and the cards are hung on it:
 * `land()` puts each card on the next note of the melody that belongs to the
 * chord playing then, so the cards rhyme with the music by construction.
 * Picture (keynote.mjs) and score (keynoteScore.mjs, via scoreCues) both read
 * from here, and so does every word on screen (COPY).
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const BPM = 108;
export const BEAT = 60 / BPM; // 0.556 s
export const BAR = BEAT * 4; // 2.222 s
const EIGHTH = BEAT / 2;

/** Chapters, in bars. */
const LENGTHS = [
  ["worry", "Money on your mind", 2],
  ["rearview", "Only looking back", 2],
  ["turn", "Vaulted Money", 2],
  ["privacy", "Who can see this", 3],
  ["search", "Where did it go", 3],
  ["budgets", "Am I on track", 3],
  ["ahead", "What's coming up", 3],
  ["ai", "Want a hand", 3],
  ["open", "Build it", 3],
  ["bigScreens", "Big screens", 4],
  ["devices", "Every device", 2],
  ["montage", "Everything else", 4],
  ["end", "Vaulted Money", 3],
];

let at = 0;
export const CHAPTERS = LENGTHS.map(([id, label, bars]) => {
  const chapter = { id, label, start: at, end: at + bars * BAR };
  at += bars * BAR;
  return chapter;
});

export const DURATION = at; // 82 s

export const chapter = (id) => CHAPTERS.find((c) => c.id === id);

/**
 * How far into "Big screens" the iPad hands over to the Duo (duo/overlay.mjs):
 * six beats, enough for the iPad's short clip; the Duo's is longer.
 */
export const HANDOVER = 6 * BEAT;

// ── Words ───────────────────────────────────────────────────────────────────

/**
 * Every line on screen. Short on purpose: people watch and read at once.
 * `*accent*` marks the serif accent words. The slogan is the same everywhere.
 */
export const COPY = {
  worry: { headline: "Money on your *mind?*" },
  rearview: {
    headline: "Most apps only look *back.*",
    sub: "Some sell what they see.",
  },
  turn: { name: "Vaulted Money", tagline: "Private Vault. Open Code." },
  privacy: {
    headline: "Who else can see *this?*",
    answer: "Only you.",
    body: "AI only when you want it.",
    chips: ["Privacy-first", "Data-local", "Works offline"],
  },
  search: {
    headline: "Where did it all *go?*",
    body: "Just ask, in plain English.",
    query: "groceries over 20 last month",
    chips: ["Last month", "Over 20", "Groceries"],
  },
  budgets: {
    headline: "Am I on *track?*",
    body: "A heads-up before you overspend.",
  },
  ahead: {
    headline: "What's coming *up?*",
    body: "Bills and paydays, ahead of time.",
  },
  ai: {
    headline: "Want a *hand?*",
    body: "Your model, on your machine.",
  },
  open: {
    headline: "Have a better UX in *mind?*",
    answer: "Build it.",
    body: "Local API and MCP, on desktop.",
  },
  bigScreens: {
    headline: "Made for *big screens.*",
    body: "iPad and iPhone Duo.",
  },
  devices: { headline: "Every *device.*" },
  end: {
    name: "Vaulted Money",
    tagline: "Private Vault. Open Code.",
    extra: "Free & open source · vaulted.money",
    badges: ["Privacy-first", "Data-local", "Open-sourced"],
  },
};

/** The slogan, the same wherever the name appears. */
export const TAGLINES = [COPY.turn.tagline, COPY.end.tagline];

/** Budgets the film shows (and the agent quotes): spent of target. */
export const BUDGETS = [
  { name: "Groceries", spent: 212.4, target: 250 },
  { name: "Dining out", spent: 268, target: 250 },
  { name: "Transport", spent: 54, target: 120 },
];
/**
 * The local-model chat in "Want a hand": what you ask, the agent tools it
 * calls (the MCP server's real tool names) and what it answers, from the
 * budgets above.
 */
export const CHAT = {
  model: "Local model · on this computer",
  prompt:
    "Where did my money go this month? Suggest a budget for my most flexible spend.",
  tools: ["list_ledgers", "spending_summary", "budgets_and_insights"],
};
/** The next three on the road ahead: what, in how many days, amount. */
export const UPCOMING = [
  { name: "Rent", days: 3, amount: -1200 },
  { name: "Salary", days: 9, amount: 3600 },
  { name: "Gym", days: 12, amount: -30 },
];
/**
 * What the finale cuts through: a screen capture, its name, and how far down
 * a tall capture to look (0 top, 1 bottom), so the data under a chart shows.
 */
export const MONTAGE = [
  ["desktop-dashboard-dark", "Dashboard", 0],
  ["desktop-analytics-pie-dark", "Spending", 0.75],
  ["desktop-calendar-dark", "Calendar", 0],
  ["desktop-insights-dark", "Insights", 0],
  ["desktop-accounts-dark", "Accounts", 0],
  ["desktop-currencies-dark", "Currencies", 0],
  ["desktop-reports-essential-dark", "Reports", 0],
  ["desktop-budgets-dark", "Budgets", 0],
];

// ── The tune ────────────────────────────────────────────────────────────────

/**
 * The relaxed social cut's chords: Am9 – Fmaj9 – Cadd9 – G6, landing on
 * Cmaj9 for the logo. Tones as MIDI notes (the pad voices them; the tests
 * check cards against their pitch classes).
 */
const CHORD = {
  Am: { name: "Am(add9)", root: 33, tones: [57, 60, 64, 71] },
  Am9: { name: "Am9", root: 33, tones: [57, 60, 64, 67, 71] },
  Fmaj9: { name: "Fmaj9", root: 29, tones: [53, 57, 60, 64, 67] },
  Cadd9: { name: "Cadd9", root: 36, tones: [55, 60, 62, 64, 67] },
  G6: { name: "G6", root: 31, tones: [55, 59, 62, 64, 71] },
  Cmaj9: { name: "Cmaj9", root: 36, tones: [52, 55, 59, 62, 64, 67, 72] },
};

/**
 * The melody, per slot: the chord under it and [eighth, note, length in
 * eighths]. 0–3 is the first phrase, 4–7 the second (higher, for the finale),
 * 8–9 the resolution on the logo.
 */
const PHRASE = [
  [
    "Am9",
    [
      [0, 76, 2],
      [2, 72, 2],
      [4, 69, 2],
      [6, 72, 2],
    ],
  ],
  [
    "Fmaj9",
    [
      [0, 77, 3],
      [3, 76, 1],
      [4, 72, 2],
      [6, 69, 2],
    ],
  ],
  [
    "Cadd9",
    [
      [0, 72, 2],
      [2, 76, 2],
      [4, 79, 3],
      [7, 77, 1],
    ],
  ],
  [
    "G6",
    [
      [0, 79, 2],
      [2, 74, 2],
      [4, 71, 2],
      [6, 74, 2],
    ],
  ],
  [
    "Am9",
    [
      [0, 81, 2],
      [2, 79, 2],
      [4, 76, 2],
      [6, 72, 2],
    ],
  ],
  [
    "Fmaj9",
    [
      [0, 77, 2],
      [2, 81, 2],
      [4, 84, 3],
      [7, 83, 1],
    ],
  ],
  [
    "Cadd9",
    [
      [0, 84, 2],
      [2, 79, 2],
      [4, 76, 2],
      [6, 79, 2],
    ],
  ],
  [
    "G6",
    [
      [0, 79, 2],
      [2, 81, 2],
      [4, 83, 2],
      [6, 86, 2],
    ],
  ],
  [
    "Cmaj9",
    [
      [0, 84, 2],
      [2, 79, 2],
      [4, 76, 2],
      [6, 79, 2],
    ],
  ],
  [
    "Cmaj9",
    [
      [0, 83, 2],
      [2, 79, 2],
      [4, 84, 4],
    ],
  ],
];

/**
 * The song, one entry a bar: which slot of the tune plays there. The
 * opening has no tune (A minor, uneasy); the turn plays F then G into the
 * drop at "privacy"; the loop runs through the questions; the big screens
 * rest on Fmaj9 – G6; the devices slam back in; the finale takes the high
 * phrase; the end card resolves on Cmaj9 and rings.
 */
const SONG = [
  ...[null, null], // worry
  ...[null, null], // rearview
  ...["turnF", "turnG"], // turn
  ...Array.from({ length: 18 }, (_, i) => i % 8), // privacy … open
  ...[1, 3, 1, 3], // big screens (the breakdown)
  ...[0, 1], // devices
  ...[4, 5, 6, 7], // finale
  ...[8, 9, "ring"], // end
];

const chordOfBar = (bar) => {
  const slot = SONG[Math.max(0, Math.min(SONG.length - 1, bar))];
  if (slot === null || slot === undefined) return CHORD.Am;
  if (slot === "turnF") return CHORD.Fmaj9;
  if (slot === "turnG") return CHORD.G6;
  if (slot === "ring") return CHORD.Cmaj9;
  return CHORD[PHRASE[slot][0]];
};
const barAt = (t) => Math.floor(t / BAR + 1e-9);

/** The chord playing at `t`: its MIDI tones. */
export const chordAt = (t) => chordOfBar(barAt(t)).tones;
/** The full chord (name, root, tones) for a bar: the score uses it. */
export const chordOf = (bar) => chordOfBar(bar);
export const SONG_BARS = SONG.length;
/** Which chapter a bar is in, for the arrangement. */
export const sectionOf = (bar) => {
  const t = bar * BAR + 1e-6;
  return CHAPTERS.find((c) => t >= c.start && t < c.end).id;
};

/** Every note of the tune, in order: { t, note, len, bar }. */
export function melody() {
  const notes = [];
  SONG.forEach((slot, bar) => {
    if (typeof slot !== "number") return;
    for (const [eighth, note, len] of PHRASE[slot][1])
      notes.push({
        t: bar * BAR + eighth * EIGHTH,
        note,
        len: len * EIGHTH,
        bar,
      });
  });
  return notes;
}
const MELODY = melody();

// ── Cards ───────────────────────────────────────────────────────────────────

const used = new Set();
/**
 * The first note of the tune at or after `beats` into the chapter that
 * belongs to the chord under it and has no card yet. Cards land there.
 */
function land(id, beats) {
  const c = chapter(id);
  const from = c.start + beats * BEAT - 1e-9;
  const n = MELODY.find(
    (m) =>
      m.t >= from &&
      m.t < c.end - 0.5 &&
      !used.has(m) &&
      chordAt(m.t).some((tone) => (tone - m.note) % 12 === 0),
  );
  if (!n) throw new Error(`No note left for a card in ${id} at beat ${beats}`);
  used.add(n);
  return { t: n.t, note: n.note };
}

/**
 * The scattered worries: off the beat on purpose, each a stray note that
 * doesn't sit in a key (seconds into the film, MIDI note).
 */
const WORRIES = [
  [0.25, 69],
  [0.6, 76],
  [0.95, 70],
  [1.3, 72],
  [1.65, 81],
  [1.95, 75],
  [2.15, 64],
  [2.5, 77],
  [2.85, 71],
  [3.05, 74],
  [3.4, 68],
  [3.7, 79],
  [3.85, 65],
];

const turn = chapter("turn").start;
const rear = chapter("rearview").start;

const RAW = {
  // The opening: worries drift down, each with its stray note.
  ...Object.fromEntries(
    WORRIES.map(([t, note], i) => [
      `worry${i}`,
      { t, note, kind: "mess", chapter: "worry" },
    ]),
  ),
  worryHeadline: { t: 0.8, note: 57, kind: "mess", chapter: "worry" },

  // Looking back: dull low notes, then the SOLD stamp.
  rearviewHeadline: {
    t: rear + EIGHTH,
    note: 45,
    kind: "stamp",
    chapter: "rearview",
  },
  rearviewSub: {
    t: rear + 3 * BEAT + EIGHTH,
    note: 48,
    kind: "stamp",
    chapter: "rearview",
  },
  rearviewSold: {
    t: rear + 5 * BEAT,
    note: 40,
    kind: "stamp",
    chapter: "rearview",
  },

  // The turn: the logo lands on the downbeat, eight rows snap into place on
  // the eighths climbing the chord, then the name and the tagline.
  turnLogo: { t: turn, note: 65, kind: "logo", chapter: "turn" },
  ...Object.fromEntries(
    [65, 69, 72, 76, 77, 81, 79, 83].map((note, i) => [
      `turnRow${i}`,
      { t: turn + BEAT + i * EIGHTH, note, kind: "snap", chapter: "turn" },
    ]),
  ),
  turnName: { t: turn + 5 * BEAT, note: 74, kind: "snap", chapter: "turn" },
  turnTagline: {
    t: turn + 6 * BEAT,
    note: 79,
    kind: "snap",
    chapter: "turn",
  },
};

/** Cards on the tune: [chapter, card, beats into the chapter it aims for]. */
const ON_TUNE = [
  ["privacy", "Headline", 0],
  ["privacy", "Answer", 1],
  ["privacy", "Left", 2],
  ["privacy", "Right", 3],
  ["privacy", "Shield", 4],
  ["privacy", "Chip0", 6],
  ["privacy", "Chip1", 7],
  ["privacy", "Chip2", 8],
  ["privacy", "Body", 9],
  ["search", "Headline", 0],
  ["search", "Phone", 1],
  ["search", "Query", 2],
  ["search", "Chip0", 5],
  ["search", "Chip1", 6],
  ["search", "Chip2", 7],
  ["search", "Body", 8],
  ["search", "Spot", 9],
  ["budgets", "Headline", 0],
  ["budgets", "Meters", 1],
  ["budgets", "Meter0", 2],
  ["budgets", "Meter1", 3],
  ["budgets", "Meter2", 4],
  ["budgets", "Warning", 6],
  ["budgets", "Body", 7],
  ["budgets", "Phone", 9],
  ["ahead", "Headline", 0],
  ["ahead", "Road", 1],
  ["ahead", "Item0", 2],
  ["ahead", "Item1", 3],
  ["ahead", "Item2", 4],
  ["ahead", "Body", 6],
  ["ahead", "Forecast", 8],
  ["ahead", "Settled", 10],
  ["ai", "Headline", 0],
  ["ai", "Switch", 1],
  ["ai", "Chat", 2],
  ["ai", "Tool0", 4],
  ["ai", "Tool1", 5],
  ["ai", "Tool2", 6],
  ["ai", "Answer", 7.5],
  ["ai", "Body", 9.5],
  ["open", "Headline", 0],
  ["open", "Answer", 1.5],
  ["open", "Terminal", 3],
  ["open", "Reply", 5],
  ["open", "Widget", 7],
  ["open", "Body", 9],
  ["bigScreens", "Headline", 0],
  ["bigScreens", "Ipad", 0.5],
  ["bigScreens", "Body", 2],
  // After the hand-over, so the iPad's footage has finished.
  ["bigScreens", "Duo", 7],
  ["bigScreens", "DuoLabel", 8],
  // The headline arrives with the first device.
  ["devices", "Row0", 0],
  ["devices", "Row1", 0.5],
  ["devices", "Row2", 1],
  ["devices", "Row3", 1.5],
  ["devices", "Row4", 2],
  ...Array.from({ length: 8 }, (_, i) => ["montage", `Cut${i}`, i * 2]),
  ["end", "Logo", 0],
  ["end", "Name", 1],
  ["end", "Tagline", 2],
  ["end", "Extra", 3, true],
  ["end", "Badge0", 4],
  ["end", "Badge1", 5],
  ["end", "Badge2", 6],
];
const prefix = (id) => (id === "bigScreens" ? "big" : id);
for (const [id, key, beats, web] of ON_TUNE) {
  RAW[`${prefix(id)}${key}`] = {
    ...land(id, beats),
    kind: "card",
    chapter: id,
    ...(web ? { web: true } : {}),
  };
}

/**
 * Every moment something lands on screen: when it arrives (keynote.mjs
 * starts its motion a little before), the note the score plays there, and
 * what kind of sound that note is. `web` marks what only the website shows.
 */
export const MOMENTS = RAW;

/**
 * The score's cues: one per card, plus the arrangement's section marks:
 * `drop` where the groove comes in, `break` where it rests for the big
 * screens, `finale` where the last build starts, `outro` where the logo
 * lands and the last chord rings.
 */
export function scoreCues(web = false) {
  const cards = Object.values(MOMENTS)
    .filter((m) => !m.web || web)
    .map(({ t, note, kind }) => ({ t, note, kind }));
  const sections = [
    { t: chapter("privacy").start, kind: "drop" },
    { t: chapter("bigScreens").start, kind: "break" },
    { t: chapter("devices").start, kind: "drop" },
    { t: chapter("montage").start, kind: "finale" },
    { t: chapter("end").start, kind: "outro" },
  ];
  return [...sections, ...cards].sort((a, b) => a.t - b.t);
}

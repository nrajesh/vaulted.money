/**
 * The keynote cut's score, synthesised from scratch (no samples, nothing to
 * license): an upbeat 120 BPM pop groove with a plucked hook, and a short,
 * snappy sound on every card that lands.
 *
 * C – G – Am – F, one chord a bar. A soft intro (pads and a rising arpeggio)
 * builds into the first `drop`, where the kick, claps, hats, a bouncing bass
 * and the hook come in. A `break` drops the kick and bass while the big-screen
 * recordings play; the next `drop` brings them back, and `outro` lets the last
 * chord ring under the end card. `fill` marks the other chapter changes.
 * Each section restarts the chord loop and the hook, so every drop opens on C.
 *
 * Effects (from timelines/keynote.mjs `scoreCues`): swish (a headline flies
 * in), thud (a device lands), tick (a line of text), pop (a chip or label;
 * `i` steps it up the scale), ding (a spotlight), sweep (the light-mode wipe),
 * whoosh, shimmer (the opening logo) and boom (the end card).
 *
 *   renderScore({ seconds, cues }) → [left, right] Float32Array at 48 kHz
 */
const TAU = Math.PI * 2;
const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const STEP = BEAT / 4; // a sixteenth
const hz = (note) => 440 * Math.pow(2, (note - 69) / 12);

// One chord a bar, voiced around middle C; the bass plays the first note.
const PROGRESSION = [
  { bass: 36, tones: [55, 60, 64, 67] }, // C
  { bass: 43, tones: [55, 59, 62, 67] }, // G
  { bass: 45, tones: [57, 60, 64, 69] }, // Am
  { bass: 41, tones: [57, 60, 65, 69] }, // F
];

// The hook: [sixteenth, note, length in sixteenths] per bar, A then B.
const HOOK_A = [
  [
    [0, 76, 2],
    [2, 79, 2],
    [4, 84, 2],
    [6, 79, 2],
    [8, 81, 2],
    [10, 79, 1],
    [11, 76, 3],
    [14, 74, 2],
  ],
  [
    [0, 74, 2],
    [2, 79, 2],
    [4, 83, 2],
    [6, 79, 2],
    [8, 81, 1],
    [9, 79, 1],
    [10, 74, 4],
    [14, 71, 2],
  ],
  [
    [0, 72, 2],
    [2, 76, 2],
    [4, 81, 2],
    [6, 76, 2],
    [8, 79, 2],
    [10, 76, 1],
    [11, 72, 3],
    [14, 74, 2],
  ],
  [
    [0, 77, 2],
    [2, 76, 2],
    [4, 74, 2],
    [6, 72, 2],
    [8, 74, 3],
    [11, 76, 1],
    [12, 79, 4],
  ],
];
const HOOK_B = [
  [
    [0, 84, 3],
    [3, 83, 1],
    [4, 79, 2],
    [6, 76, 2],
    [8, 79, 3],
    [11, 81, 1],
    [12, 79, 4],
  ],
  [
    [0, 83, 3],
    [3, 81, 1],
    [4, 79, 2],
    [6, 74, 2],
    [8, 79, 3],
    [11, 81, 1],
    [12, 83, 4],
  ],
  [
    [0, 84, 3],
    [3, 83, 1],
    [4, 81, 2],
    [6, 76, 2],
    [8, 81, 3],
    [11, 83, 1],
    [12, 84, 4],
  ],
  [
    [0, 81, 2],
    [2, 79, 2],
    [4, 77, 2],
    [6, 76, 2],
    [8, 74, 4],
    [12, 79, 4],
  ],
];
// A bouncing bass line: [sixteenth, semitones above the root, length].
const BASS = [
  [0, 0, 2],
  [2, 0, 1],
  [3, 12, 1],
  [4, 0, 2],
  [6, 0, 1],
  [7, 12, 1],
  [8, 0, 2],
  [10, 0, 1],
  [11, 7, 1],
  [12, 0, 2],
  [14, 12, 1],
  [15, 7, 1],
];
// Pops climb a major pentatonic from G5.
const POP_NOTES = [79, 81, 84, 86, 88, 91];

// Deterministic noise (mulberry32), seeded per sound so the score is the
// same every render and one sound never changes another.
function noise(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}
const seedAt = (t, salt) => Math.round(t * 1000) * 31 + salt;

/** A state-variable filter step: returns { low, band, high } per sample. */
function svf() {
  let low = 0;
  let band = 0;
  return (x, freq, q, rate) => {
    const f = 2 * Math.sin((Math.PI * Math.min(freq, rate * 0.2)) / rate);
    low += f * band;
    const high = x - low - band / q;
    band += f * high;
    return { low, band, high };
  };
}

function bus(length) {
  return [new Float32Array(length), new Float32Array(length)];
}

/** Adds a mono voice `fn(localTime)` for `duration` s at `start`, panned. */
function add([left, right], rate, start, duration, pan, fn) {
  const from = Math.max(0, Math.floor(start * rate));
  const to = Math.min(left.length, Math.floor((start + duration) * rate));
  const l = Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const r = Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = from; i < to; i++) {
    const v = fn(i / rate - start);
    left[i] += v * l;
    right[i] += v * r;
  }
}

// ── Arrangement ─────────────────────────────────────────────────────────────

/**
 * Sections from the cues: [{ kind, start, end }]. The intro runs from 0 to
 * the first section cue; its bars are counted back from there so the drop
 * lands on a downbeat.
 */
function sections(cues, seconds) {
  const marks = cues
    .filter((c) => ["drop", "break", "outro"].includes(c.kind))
    .sort((a, b) => a.t - b.t);
  const list = [];
  const firstAt = marks.length ? marks[0].t : seconds;
  list.push({ kind: "intro", start: 0, end: firstAt, anchor: firstAt });
  marks.forEach((m, i) =>
    list.push({
      kind: m.kind === "drop" ? "groove" : m.kind,
      start: m.t,
      end: i + 1 < marks.length ? marks[i + 1].t : seconds,
      anchor: m.t,
    }),
  );
  return list;
}

/** Every sixteenth in a section: { t, bar, step } (bar 0 starts at its anchor). */
function* steps(section) {
  const first = Math.ceil((section.start - section.anchor) / STEP - 1e-9);
  for (let n = first; ; n++) {
    const t = section.anchor + n * STEP;
    if (t >= section.end - 1e-9) return;
    yield { t, bar: Math.floor(n / 16), step: ((n % 16) + 16) % 16 };
  }
}
const chordOf = (bar) => PROGRESSION[((bar % 4) + 4) % 4];

// ── Instruments ─────────────────────────────────────────────────────────────

/** A bright pluck: additive, higher partials die faster (no aliasing). */
function pluck(out, rate, t0, note, length, gain, pan) {
  const f = hz(note);
  const dur = length + 0.35;
  add(out, rate, t0, dur, pan, (t) => {
    const env =
      Math.min(1, t / 0.003) *
      Math.exp(-t * 3.2) *
      (t > length ? Math.exp(-(t - length) * 14) : 1);
    let v = 0;
    for (let k = 1; k <= 7; k++)
      v += (Math.sin(TAU * f * k * t) / k) * Math.exp(-t * k * 4);
    return gain * env * v;
  });
}

function pad(out, rate, t0, length, chord, gain) {
  chord.tones.forEach((note, i) => {
    const f = hz(note);
    const pan = (i / (chord.tones.length - 1)) * 1.2 - 0.6;
    add(out, rate, t0, length + 0.3, pan, (t) => {
      const env = Math.min(1, t / 0.08) * Math.min(1, (length + 0.3 - t) / 0.3);
      return (
        gain *
        env *
        (Math.sin(TAU * f * t) +
          0.6 * Math.sin(TAU * f * 1.006 * t + 1) +
          0.3 * Math.sin(TAU * f * 2.003 * t))
      );
    });
  });
}

function bassNote(out, rate, t0, note, length, gain) {
  const f = hz(note);
  add(out, rate, t0, length + 0.05, 0, (t) => {
    const env =
      Math.min(1, t / 0.004) *
      (0.55 + 0.45 * Math.exp(-t * 10)) *
      Math.min(1, (length + 0.05 - t) / 0.04);
    let v = 0;
    for (let k = 1; k <= 6; k++)
      v += (Math.sin(TAU * f * k * t) / k) * Math.exp(-t * (k - 1) * 9);
    return gain * env * v;
  });
}

function kick(out, rate, t0, gain) {
  let phase = 0;
  add(out, rate, t0, 0.4, 0, (t) => {
    phase += (TAU * (48 + 110 * Math.exp(-t * 32))) / rate;
    return gain * Math.exp(-t * 7) * Math.sin(phase);
  });
}

function clap(out, rate, t0, gain) {
  const rand = noise(seedAt(t0, 2));
  const filter = svf();
  add(out, rate, t0, 0.25, -0.1, (t) => {
    const bursts = [0, 0.011, 0.022].reduce(
      (acc, o) => acc + (t >= o ? Math.exp(-(t - o) * 180) : 0),
      0,
    );
    const env = bursts * 0.5 + Math.exp(-t * 18) * 0.6;
    return gain * env * filter(rand(), 1300, 1.2, rate).band * 2.2;
  });
}

function hat(out, rate, t0, gain, open = false) {
  const rand = noise(seedAt(t0, 3));
  const filter = svf();
  add(out, rate, t0, open ? 0.3 : 0.06, 0.3, (t) => {
    const env = Math.exp(-t * (open ? 14 : 80));
    return gain * env * filter(rand(), 7500, 0.9, rate).high;
  });
}

function snare(out, rate, t0, gain) {
  const rand = noise(seedAt(t0, 4));
  const filter = svf();
  add(out, rate, t0, 0.18, -0.15, (t) => {
    const body = Math.sin(TAU * 190 * t) * Math.exp(-t * 30);
    const hiss = filter(rand(), 3500, 0.8, rate).high * Math.exp(-t * 22);
    return gain * (0.5 * body + hiss);
  });
}

function crash(out, rate, t0, gain) {
  const rand = noise(seedAt(t0, 5));
  const filter = svf();
  add(out, rate, t0, 2.2, 0.2, (t) => {
    const env = Math.min(1, t / 0.002) * Math.exp(-t * 2.2);
    return gain * env * filter(rand(), 5000, 0.7, rate).high;
  });
}

/** Filtered noise rising into `t1`, with a climbing tone underneath. */
function riser(out, rate, t1, length, gain) {
  const rand = noise(seedAt(t1, 6));
  const filter = svf();
  let phase = 0;
  add(out, rate, t1 - length, length, 0, (t) => {
    const p = t / length;
    phase += (TAU * (200 + 900 * p * p)) / rate;
    const swish = filter(rand(), 300 + 7000 * p * p, 2, rate).band;
    return gain * p * p * (swish * 1.2 + 0.15 * Math.sin(phase));
  });
}

function bell(out, rate, t0, note, gain, pan, decay = 2.2) {
  const f = hz(note);
  add(out, rate, t0, 3 / decay + 0.2, pan, (t) => {
    const env = Math.min(1, t / 0.002) * Math.exp(-t * decay);
    return (
      gain *
      env *
      (Math.sin(TAU * f * t) +
        0.45 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 3) +
        0.2 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 6))
    );
  });
}

// ── Effects ─────────────────────────────────────────────────────────────────

const EFFECTS = {
  /** A headline flies in: a quick airy swish up. */
  swish(out, rate, { t }) {
    const rand = noise(seedAt(t, 10));
    const filter = svf();
    add(out, rate, t - 0.12, 0.4, 0, (x) => {
      const env = Math.sin(Math.PI * Math.min(1, x / 0.4)) ** 2;
      return 0.5 * env * filter(rand(), 1200 + 6000 * (x / 0.4), 3, rate).band;
    });
  },
  /**
   * A device lands: a low thump, with a knock and a snap on top so phone
   * speakers (which drop everything under ~200 Hz) still hear it.
   */
  thud(out, rate, { t }) {
    let phase = 0;
    const rand = noise(seedAt(t, 11));
    const filter = svf();
    add(out, rate, t, 0.3, 0, (x) => {
      phase += (TAU * (70 + 90 * Math.exp(-x * 40))) / rate;
      return (
        0.45 * Math.exp(-x * 14) * Math.sin(phase) +
        0.3 * Math.exp(-x * 28) * Math.sin(TAU * 230 * x) +
        0.35 * Math.exp(-x * 120) * filter(rand(), 2600, 1.2, rate).band
      );
    });
  },
  /** A line of text: a woody tick. */
  tick(out, rate, { t }) {
    add(out, rate, t, 0.08, 0.25, (x) => {
      const env = Math.exp(-x * 70);
      return (
        0.4 * env * (Math.sin(TAU * 1750 * x) + 0.5 * Math.sin(TAU * 2900 * x))
      );
    });
  },
  /** A chip or label: a bubbly pop, `i` steps up the scale. */
  pop(out, rate, { t, i = 0 }) {
    const f = hz(POP_NOTES[i % POP_NOTES.length]);
    let phase = 0;
    add(out, rate, t, 0.16, i % 2 ? 0.2 : -0.2, (x) => {
      phase += (TAU * f * (1 - 0.45 * Math.exp(-x * 120))) / rate;
      return (
        0.32 * Math.min(1, x / 0.002) * Math.exp(-x * 26) * Math.sin(phase)
      );
    });
  },
  /** A spotlight: a bright two-note bell. */
  ding(out, rate, { t }) {
    bell(out, rate, t, 88, 0.16, 0.2);
    bell(out, rate, t + 0.06, 95, 0.1, 0.35);
  },
  /** A transition: noise swelling into `t`. */
  whoosh(out, rate, { t }) {
    const rand = noise(seedAt(t, 12));
    const filter = svf();
    const length = 0.5;
    add(out, rate, t - length, length + 0.15, 0, (x) => {
      const p = Math.min(1, x / length);
      const env = x < length ? p * p : Math.exp(-(x - length) * 30);
      return 0.45 * env * filter(rand(), 600 + 4000 * p, 1.5, rate).band;
    });
  },
  /** The light-mode wipe: a swell across the stereo field, centred on `t`. */
  sweep(out, rate, { t }) {
    const rand = noise(seedAt(t, 13));
    const filter = svf();
    for (const [side, pan] of [
      [0, -0.6],
      [1, 0.6],
    ]) {
      add(out, rate, t - 0.5, 1.0, pan, (x) => {
        const env = Math.sin(Math.PI * x) ** 2;
        const freq = 500 + 5000 * Math.sin((Math.PI * x) / 2);
        return (side ? 0.3 : 0.25) * env * filter(rand(), freq, 2, rate).band;
      });
    }
  },
  /** The opening logo: a quick sparkle up a C major chord. */
  shimmer(out, rate, { t }) {
    [84, 88, 91, 96].forEach((note, i) =>
      bell(out, rate, t + i * 0.07, note, 0.1, -0.45 + i * 0.3, 1.6),
    );
  },
  /** The end card: a deep boom with a punchy hit on top, under the crash. */
  boom(out, rate, { t }) {
    let phase = 0;
    let hit = 0;
    const rand = noise(seedAt(t, 14));
    const filter = svf();
    add(out, rate, t, 1.6, 0, (x) => {
      phase += (TAU * (38 + 50 * Math.exp(-x * 9))) / rate;
      hit += (TAU * (110 + 160 * Math.exp(-x * 25))) / rate;
      return (
        0.6 * Math.exp(-x * 2.6) * Math.sin(phase) +
        0.4 * Math.exp(-x * 9) * Math.sin(hit) +
        0.3 * Math.exp(-x * 30) * filter(rand(), 1800, 0.9, rate).band
      );
    });
  },
};

// ── Mix ─────────────────────────────────────────────────────────────────────

/** A small stereo room: a few feedback delays per side. */
function room([left, right], rate, amount) {
  const taps = [
    [0.0297, 0.0371, 0.0533],
    [0.0411, 0.0437, 0.0611],
  ];
  const out = [new Float32Array(left.length), new Float32Array(left.length)];
  [left, right].forEach((src, side) => {
    for (const seconds of taps[side]) {
      const delay = Math.round(seconds * rate);
      const line = new Float32Array(src.length);
      for (let i = delay; i < src.length; i++)
        line[i] = src[i - delay] * 0.5 + line[i - delay] * 0.66;
      for (let i = 0; i < src.length; i++) out[side][i] += amount * line[i];
    }
  });
  return out;
}

/** A dotted-eighth ping-pong echo, the classic lift for a plucked hook. */
function echo([left, right], rate, amount) {
  const delay = Math.round(BEAT * 0.75 * rate);
  const out = [new Float32Array(left.length), new Float32Array(left.length)];
  for (let i = delay; i < left.length; i++) {
    out[0][i] = (right[i - delay] + out[1][i - delay]) * 0.5;
    out[1][i] = (left[i - delay] + out[0][i - delay]) * 0.5;
  }
  for (let i = 0; i < left.length; i++) {
    out[0][i] *= amount;
    out[1][i] *= amount;
  }
  return out;
}

export function renderScore({ seconds, cues = [], sampleRate = 48000 }) {
  const rate = sampleRate;
  const length = Math.round(seconds * rate);
  const music = bus(length); // pads, arpeggio, bass (ducked by the kick)
  const lead = bus(length); // the hook (echoed)
  const drums = bus(length);
  const sfx = bus(length);
  const kicks = [];

  const list = sections(cues, seconds);
  const drops = cues.filter((c) => c.kind === "drop").map((c) => c.t);

  for (const s of list) {
    // Pads: one chord a bar.
    for (const { t, bar, step } of steps(s)) {
      if (step !== 0 && t > s.start + 1e-9) continue;
      const barEnd = Math.min(s.anchor + (bar + 1) * BAR, s.end);
      const level = { intro: 0.012, groove: 0.014, break: 0.02, outro: 0.022 };
      pad(music, rate, t, barEnd - t, chordOf(bar), level[s.kind]);
    }
    if (s.kind === "outro") {
      bassNote(
        music,
        rate,
        s.start,
        PROGRESSION[0].bass,
        s.end - s.start,
        0.12,
      );
      [72, 79, 84].forEach((note, i) =>
        bell(lead, rate, s.start + i * 0.09, note, 0.09, -0.3 + i * 0.3, 0.9),
      );
      continue;
    }

    for (const { t, bar, step } of steps(s)) {
      const chord = chordOf(bar);
      const beatStep = step % 4 === 0;
      const intoIntro = s.kind === "intro" ? Math.min(1, t / s.end + 0.3) : 1;

      // Arpeggio: sixteenths up and down the chord, quiet under the hook.
      const arp = [0, 1, 2, 3, 2, 1, 2, 3][step % 8];
      const arpGain = { intro: 0.05, groove: 0.022, break: 0.04 }[s.kind];
      pluck(
        music,
        rate,
        t,
        chord.tones[arp] + 12,
        STEP,
        arpGain * intoIntro,
        arp % 2 ? 0.35 : -0.35,
      );

      if (s.kind === "intro") continue;

      // Hook: A then B, every four bars.
      const hook = Math.floor(bar / 4) % 2 ? HOOK_B : HOOK_A;
      for (const [at, note, len] of hook[((bar % 4) + 4) % 4])
        if (at === step)
          pluck(
            lead,
            rate,
            t,
            note,
            len * STEP,
            s.kind === "break" ? 0.05 : 0.075,
            0.08,
          );

      // Hats: off-beat eighths, quiet sixteenths in between.
      if (step % 4 === 2)
        hat(
          drums,
          rate,
          t,
          s.kind === "break" ? 0.16 : 0.24,
          s.kind === "groove" && step === 14,
        );
      else if (step % 2 === 1) hat(drums, rate, t, 0.07);

      if (s.kind !== "groove") continue;

      if (beatStep) {
        kick(drums, rate, t, 0.85);
        kicks.push(t);
      }
      if (step === 4 || step === 12) clap(drums, rate, t, 0.5);
      for (const [at, interval, len] of BASS)
        if (at === step)
          bassNote(
            music,
            rate,
            t,
            chord.bass + interval,
            len * STEP * 0.92,
            0.13,
          );
    }
  }

  // Into each drop: a riser (and a snare roll out of a break), then a crash.
  drops.forEach((t, n) => {
    const before = list.find((s) => s.end === t);
    const length = !before || before.kind !== "groove" ? Math.min(4, t) : 2;
    if (length > 0.5) riser(sfx, rate, t, length, 0.3);
    if (before?.kind === "break")
      for (let k = 0; k < 16; k++)
        snare(drums, rate, t - BAR + k * STEP, 0.08 + 0.2 * (k / 15));
    crash(drums, rate, t, n === 0 ? 0.3 : 0.38);
  });
  // Other chapter changes: a quick snare pickup and a light crash.
  for (const { t } of cues.filter((c) => c.kind === "fill")) {
    for (let k = 0; k < 4; k++)
      snare(drums, rate, t - BEAT + k * (BEAT / 4), 0.1 + 0.05 * k);
    crash(drums, rate, t, 0.18);
    EFFECTS.whoosh(sfx, rate, { t });
  }
  for (const c of cues) EFFECTS[c.kind]?.(sfx, rate, c);

  // Duck the pads and bass under each kick, so the groove breathes.
  const duck = new Float32Array(length).fill(1);
  for (const t of kicks) {
    const from = Math.floor(t * rate);
    const to = Math.min(length, from + Math.floor(BEAT * rate));
    for (let i = from; i < to; i++) {
      const x = (i - from) / rate;
      duck[i] = Math.min(duck[i], 1 - 0.55 * Math.exp(-x * 9));
    }
  }

  const echoes = echo(lead, rate, 0.32);
  const wet = room(
    [0, 1].map((side) => {
      const mix = new Float32Array(length);
      for (let i = 0; i < length; i++)
        mix[i] = music[side][i] * 0.6 + lead[side][i] + sfx[side][i] * 0.5;
      return mix;
    }),
    rate,
    0.1,
  );

  // Sum, fade, soft-limit and normalise. The groove is denser than the social
  // cut, so it peaks at -4 dBFS to land near its loudness (about -15 LUFS).
  const fadeIn = 0.05 * rate;
  const fadeOut = Math.min(1.5 * rate, length / 3);
  const out = bus(length);
  let peak = 0;
  for (let side = 0; side < 2; side++)
    for (let i = 0; i < length; i++) {
      const g = Math.min(1, i / fadeIn, (length - i) / fadeOut);
      const v =
        music[side][i] * duck[i] +
        lead[side][i] +
        echoes[side][i] +
        drums[side][i] +
        sfx[side][i] +
        wet[side][i];
      out[side][i] = Math.tanh(v * g * 1.1);
      peak = Math.max(peak, Math.abs(out[side][i]));
    }
  const gain = peak > 0 ? 0.63 / peak : 1;
  for (const side of out) for (let i = 0; i < length; i++) side[i] *= gain;
  return out;
}

export { writeWav } from "./calmScore.mjs";

/**
 * The film's sound, synthesised from scratch (no samples, nothing to
 * license), on the picture's own clock (timeline.mjs). A house groove at the
 * film's tempo, in the spirit of the relaxed social cut:
 *
 * - worry: a low drone and stray, slightly out-of-tune pings.
 * - turn: the pings stop on one note and a riser leads into the drop.
 * - the five features: four-on-the-floor kick, off-beat hats and bass, a
 *   plucked arpeggio over one chord a bar; a clap joins from the second
 *   device. Each flip to the next device has a whoosh and a melody note;
 *   every key of the typed search ticks and "Apply all" clicks.
 * - every device: the fullest bars, then the drums rest for one bar as the
 *   devices fold into the logo.
 * - end: an impact and a bell chord.
 *
 *   renderScore({ seconds }) → [left, right] Float32Array at 48 kHz
 */
import {
  BAR,
  BEAT,
  CHAPTERS as C,
  FEATURES,
  FLIP,
  moments,
} from "./timeline.mjs";

const RATE = 48000;
const TAU = Math.PI * 2;
const hz = (note) => 440 * 2 ** ((note - 69) / 12);

// Cmaj9 – Am9 – Fmaj7 – G6, two bars each.
const CHORDS = [
  [48, 55, 59, 62, 64],
  [45, 52, 55, 59, 60],
  [41, 48, 52, 57, 60],
  [43, 50, 55, 59, 64],
];

/** Deterministic noise, so every render is the same. */
function noise(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

export function renderScore({ seconds, queryLength = 28 }) {
  const n = Math.round(seconds * RATE);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const M = moments(queryLength);
  const rand = noise(20261120);

  /** Adds a voice: `wave(time since start)` shaped by `env`, panned. */
  const voice = (start, length, gain, pan, sample) => {
    const from = Math.max(0, Math.round(start * RATE));
    const to = Math.min(n, Math.round((start + length) * RATE));
    const l = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const r = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = from; i < to; i++) {
      const v = sample((i - from) / RATE);
      L[i] += v * l;
      R[i] += v * r;
    }
  };
  const bell = (t, note, gain = 0.1, pan = 0, detune = 0) =>
    voice(t, 2.4, gain, pan, (s) => {
      const f = hz(note) * (1 + detune);
      return (
        Math.exp(-s * 2.6) *
        (Math.sin(TAU * f * s) +
          0.35 * Math.sin(TAU * f * 2.01 * s) * Math.exp(-s * 5))
      );
    });
  const pad = (t, length, notes, gain) =>
    notes.forEach((note, i) =>
      voice(
        t,
        length + 0.6,
        gain,
        (i / (notes.length - 1)) * 1.2 - 0.6,
        (s) => {
          const env =
            Math.min(1, s / 0.5) * Math.min(1, (length + 0.6 - s) / 0.6);
          const f = hz(note);
          return (
            env *
            (Math.sin(TAU * f * s) +
              0.3 * Math.sin(TAU * f * 1.003 * s) +
              0.12 * Math.sin(TAU * f * 2 * s))
          );
        },
      ),
    );
  const kick = (t, gain) =>
    voice(
      t,
      0.3,
      gain,
      0,
      (s) =>
        Math.exp(-s * 16) *
        Math.sin(
          TAU * (48 * s + ((34 * (1 - Math.exp(-s * 30))) / 30) * 30 * 0.1),
        ),
    );
  const tick = (t, gain = 0.07, pan = 0.2) =>
    voice(t, 0.05, gain, pan, (s) => Math.exp(-s * 160) * rand());
  const click = (t) =>
    voice(
      t,
      0.12,
      0.16,
      0.1,
      (s) => Math.exp(-s * 55) * Math.sin(TAU * 1250 * s),
    );
  const swell = (t, length, gain) =>
    voice(t, length, gain, 0, (s) => (s / length) ** 2.5 * rand() * 0.6);

  // Worry: a drone and stray pings, a little out of tune, off the beat.
  voice(0, C.turn.start + 1.2, 0.09, 0, (s) => {
    const env =
      Math.min(1, s / 0.4) * Math.min(1, (C.turn.start + 1.2 - s) / 1.0);
    return (
      env * (Math.sin(TAU * hz(33) * s) + 0.5 * Math.sin(TAU * hz(40.2) * s))
    );
  });
  [
    [0.1, 79, 0.012],
    [0.4, 86, -0.02],
    [0.75, 74, 0.018],
    [1.05, 83, -0.014],
    [1.4, 77, 0.02],
    [1.7, 88, -0.01],
    [2.0, 81, 0.016],
  ].forEach(([t, note, detune], i) =>
    bell(t, note, 0.07, i % 2 ? 0.6 : -0.6, detune),
  );

  // The turn: everything lands on one clear note.
  bell(C.turn.start + 1.1, 72, 0.16);
  bell(C.turn.start + 1.1, 60, 0.12);

  // The groove: one chord a bar from the drop (the first feature) to the
  // end card. The drums rest for the last bar before the devices fold into
  // the logo, so the end card lands.
  const drop = C.ask.start;
  const resting = (t) => t >= M.merge - BAR && t < C.end.start - 0.01;
  const hat = (t, gain) =>
    voice(t, 0.04, gain, 0.35, (s) => Math.exp(-s * 190) * rand());
  const clap = (t) =>
    voice(t, 0.16, 0.12, -0.1, (s) => Math.exp(-s * 38) * rand());
  const pluck = (t, note, gain, pan) =>
    voice(t, 0.32, gain, pan, (s) => {
      const f = hz(note);
      const saw = 2 * ((f * s) % 1) - 1;
      return Math.exp(-s * 11) * (0.6 * saw + Math.sin(TAU * f * s));
    });
  const bass = (t, note) =>
    voice(t, BEAT * 0.45, 0.2, 0, (s) => {
      const f = hz(note);
      const env = Math.min(1, s / 0.01) * Math.exp(-s * 5);
      return env * (Math.sin(TAU * f * s) + 0.3 * Math.sin(TAU * f * 2 * s));
    });
  swell(drop - BEAT * 2, BEAT * 2, 0.12);
  for (let bar = 0, t = drop; t < C.end.start - 0.01; bar++, t += BAR) {
    const chord = CHORDS[bar % CHORDS.length];
    const quiet = resting(t + BAR / 2);
    pad(t, BAR, chord, quiet ? 0.004 : 0.02);
    const full = t >= C.flow.start - 0.01;
    for (let step = 0; step < 8; step++) {
      const at = t + (step * BEAT) / 2;
      if (resting(at)) continue;
      if (step % 2 === 0) kick(at, full ? 0.34 : 0.28);
      else {
        hat(at, 0.05);
        bass(at, chord[0] - 12);
      }
      if (at >= C.bills.start - 0.01 && (step === 2 || step === 6)) clap(at);
      // Arpeggio: up the chord, an octave above, panned side to side.
      pluck(
        at,
        chord[1 + (step % 4)] + 12,
        full ? 0.07 : 0.05,
        step % 2 ? 0.5 : -0.5,
      );
    }
  }
  // Each device flips into the next with a soft whoosh and a melody note.
  FEATURES.forEach((feature, index) => {
    const at = C[feature.id].start;
    if (index > 0) swell(at - FLIP, FLIP * 2, 0.09);
    bell(at, [76, 79, 81, 84, 88][index], 0.1, index % 2 ? 0.3 : -0.3);
  });
  bell(M.forecast, 86, 0.07, 0.3);
  // The pull-back to every device.
  swell(C.everywhere.start - 0.5, 0.9, 0.1);
  [60, 67, 76].forEach((note, i) =>
    bell(C.everywhere.start + 0.5, note, 0.11, i - 1),
  );

  // Typing and "Apply all": what the hand does on screen.
  M.askKeys.forEach((t) => tick(t));
  click(M.askApply);
  bell(M.askResult, 88, 0.07, 0.3);

  // End card: an impact and a bell chord for each half of the line.
  swell(M.merge, C.end.start - M.merge, 0.14);
  voice(
    C.end.start,
    2.5,
    0.4,
    0,
    (s) => Math.exp(-s * 3) * Math.sin(TAU * 41 * s),
  );
  pad(C.end.start, 5.5, CHORDS[0], 0.035);
  [72, 76, 79].forEach((note, i) =>
    bell(C.end.start + 0.8 + i * 0.07, note, 0.1, i - 1),
  );
  [79, 83, 86].forEach((note, i) =>
    bell(C.end.start + 1.35 + i * 0.07, note, 0.1, 1 - i),
  );

  // Fade out with the picture, then keep peaks in range.
  const fade = Math.round(0.6 * RATE);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    L[n - 1 - i] *= g;
    R[n - 1 - i] *= g;
  }
  let peak = 0;
  for (let i = 0; i < n; i++)
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = 0.85 / (peak || 1);
  for (let i = 0; i < n; i++) {
    L[i] *= norm;
    R[i] *= norm;
  }
  return [L, R];
}

/**
 * The film's sound, synthesised from scratch (no samples, nothing to
 * license), on the picture's own clock (timeline.mjs).
 *
 * An arc, not a loop:
 * - worry: a low drone and stray, slightly out-of-tune pings.
 * - turn: the pings stop on one held note as the list settles.
 * - where … ahead: warm chords, a soft pulse that grows a little each beat;
 *   every key of the typed search ticks and "Apply all" clicks.
 * - only: almost nothing while the network is off (keys only), then a swell
 *   into "Only you."
 * - devices: the pulse returns, fuller.
 * - end: a low impact and a bell chord that rings out.
 *
 *   renderScore({ seconds }) → [left, right] Float32Array at 48 kHz
 */
import { BAR, BEAT, CHAPTERS as C, moments } from "./timeline.mjs";

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
    [0.15, 79, 0.012],
    [0.7, 86, -0.02],
    [1.25, 74, 0.018],
    [1.7, 83, -0.014],
    [2.3, 77, 0.02],
    [2.75, 88, -0.01],
    [3.3, 81, 0.016],
    [3.8, 75, -0.018],
  ].forEach(([t, note, detune], i) =>
    bell(t, note, 0.07, i % 2 ? 0.6 : -0.6, detune),
  );

  // The turn: everything lands on one clear note.
  bell(C.turn.start + 1.7, 72, 0.16);
  bell(C.turn.start + 1.7, 60, 0.12);

  // Chords from the turn to the end, thinner while the network is off.
  const first = C.turn.start + 2 * BEAT;
  for (let bar = 0, t = first; t < C.end.start; bar++, t += BAR * 2) {
    const quiet = t >= M.dark - BAR && t < M.onlyYou - 0.5;
    pad(t, BAR * 2, CHORDS[bar % CHORDS.length], quiet ? 0.004 : 0.03);
  }
  // Pulse: grows through the questions, rests for the offline search.
  for (let t = C.where.start; t < C.end.start - 0.01; t += BEAT) {
    if (t >= C.only.start && t < C.devices.start) continue;
    const grow =
      t < C.ask.start
        ? 0.1
        : t < C.track.start
          ? 0.14
          : t < C.only.start
            ? 0.18
            : 0.24;
    kick(t, grow);
    if (t >= C.ask.start) tick(t + BEAT / 2, 0.035, -0.3);
  }
  // A melody note at the start of each question.
  [
    [C.where.start, 76],
    [C.ask.start, 79],
    [C.track.start, 81],
    [C.ahead.start, 84],
  ].forEach(([t, note]) => bell(t, note, 0.11, 0.2));

  // Typing and "Apply all": what the hand does on screen.
  M.askKeys.forEach((t) => tick(t));
  click(M.askApply);
  bell(M.askResult, 88, 0.07, 0.3);
  M.offlineKeys.forEach((t) => tick(t, 0.05));
  click(M.offlineApply);
  bell(M.offlineResult, 88, 0.07, 0.3);

  // "Only you.": a swell, then a warm chord.
  swell(M.onlyYou - 1.2, 1.2, 0.1);
  [60, 67, 76].forEach((note, i) => bell(M.onlyYou, note, 0.12, i - 1));
  M.proof.forEach((t, i) => bell(t, [79, 81, 84][i], 0.06, 0.3));

  // End card: an impact and a bell chord for each half of the line.
  swell(C.end.start - 1.0, 1.0, 0.1);
  voice(
    C.end.start,
    2.5,
    0.4,
    0,
    (s) => Math.exp(-s * 3) * Math.sin(TAU * 41 * s),
  );
  pad(C.end.start, 5.5, CHORDS[0], 0.035);
  [72, 76, 79].forEach((note, i) =>
    bell(C.end.start + 1.3 + i * 0.08, note, 0.1, i - 1),
  );
  [79, 83, 86].forEach((note, i) =>
    bell(C.end.start + 2.2 + i * 0.08, note, 0.1, 1 - i),
  );

  // Fade out with the picture, then keep peaks in range.
  const fade = Math.round(0.9 * RATE);
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

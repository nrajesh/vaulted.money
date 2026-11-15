/**
 * A calm score, synthesised from scratch (no samples, nothing to license),
 * for the App Store preview and the keynote cut of the showreel.
 *
 * 84 BPM, Cmaj9 – Am9 – Fmaj7 – G6, two bars each: soft pads, a sparse
 * piano and a warm bass. At the first `lift` cue a gentle pulse, a soft
 * groove and a short piano motif join; each later lift adds a little. Other cues add quiet UI sounds on the picture: `tick`
 * (a tap), `chime` (a reveal) and `whoosh` (a transition).
 *
 *   renderScore({ seconds, cues }) → [left, right] Float32Array at 48 kHz
 *   writeWav(path, channels, sampleRate)
 */
import { writeFileSync } from "node:fs";

const TAU = Math.PI * 2;
const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);

// Chord tones (MIDI), voiced around middle C.
const CHORDS = [
  [48, 55, 59, 62, 64], // Cmaj9
  [45, 52, 55, 59, 60], // Am9
  [41, 48, 52, 57, 60], // Fmaj7
  [43, 50, 55, 59, 64], // G6
];
const chordAt = (t) => CHORDS[Math.floor(t / (BAR * 2)) % CHORDS.length];

// Deterministic noise (mulberry32), so the score is the same every render.
function noise(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/** Adds a mono voice `fn(localTime)` for `duration` seconds at `start`, panned. */
function add(left, right, rate, start, duration, pan, fn) {
  const from = Math.max(0, Math.floor(start * rate));
  const to = Math.min(left.length, Math.floor((start + duration) * rate));
  const l = Math.cos(((pan + 1) * Math.PI) / 4);
  const r = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = from; i < to; i++) {
    const v = fn(i / rate - start);
    left[i] += v * l;
    right[i] += v * r;
  }
}

function pads(left, right, rate, seconds) {
  for (let start = 0; start < seconds; start += BAR * 2) {
    const chord = chordAt(start);
    const length = BAR * 2 + 1.5; // overlap the next chord a little
    chord.forEach((note, i) => {
      const f = midi(note + 12);
      const pan = (i / (chord.length - 1)) * 1.2 - 0.6;
      add(left, right, rate, start, length, pan, (t) => {
        const env = Math.min(1, t / 1.6) * Math.min(1, (length - t) / 1.4);
        const tone =
          Math.sin(TAU * f * t) +
          0.5 * Math.sin(TAU * f * 1.003 * t) +
          0.25 * Math.sin(TAU * f * 2 * t);
        return 0.018 * env * tone;
      });
    });
  }
}

function piano(left, right, rate, seconds) {
  // One note every two beats, walking up the chord.
  for (let n = 0, t0 = BEAT; t0 < seconds; n++, t0 += BEAT * 2) {
    const chord = chordAt(t0);
    const note = chord[(n % 3) + 2] + 12;
    const f = midi(note);
    add(left, right, rate, t0, 2.4, n % 2 ? 0.25 : -0.25, (t) => {
      const env = Math.min(1, t / 0.005) * Math.exp(-t * 2.2);
      return (
        0.07 *
        env *
        (Math.sin(TAU * f * t) +
          0.35 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 3) +
          0.12 * Math.sin(TAU * f * 3 * t) * Math.exp(-t * 5))
      );
    });
  }
}

function pulse(left, right, rate, seconds, lifts) {
  if (!lifts.length) return;
  const first = lifts[0];
  for (let t0 = Math.ceil(first / BEAT) * BEAT; t0 < seconds; t0 += BEAT) {
    const level =
      0.6 + 0.2 * Math.min(2, lifts.filter((l) => l <= t0).length - 1);
    add(left, right, rate, t0, 0.35, 0, (t) => {
      const f = 52 + 60 * Math.exp(-t * 28);
      return 0.16 * level * Math.exp(-t * 9) * Math.sin(TAU * f * t);
    });
  }
}

/** Root notes on the half bar, a warm sine with a little second harmonic. */
function bass(left, right, rate, seconds) {
  for (let t0 = 0; t0 < seconds; t0 += BEAT * 2) {
    const root = chordAt(t0)[0] - 12;
    const f = midi(root);
    add(left, right, rate, t0, BEAT * 2, 0, (t) => {
      const env = Math.min(1, t / 0.02) * Math.exp(-t * 0.9);
      return (
        0.08 * env * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t))
      );
    });
  }
}

/** A soft groove from the first lift: hats on the off-beats, a rim on 2 and 4. */
function groove(left, right, rate, seconds, lifts, rand) {
  if (!lifts.length) return;
  for (let t0 = Math.ceil(lifts[0] / BEAT) * BEAT; t0 < seconds; t0 += BEAT) {
    const beatInBar = Math.round(t0 / BEAT) % 4;
    let hp = 0;
    add(left, right, rate, t0 + BEAT / 2, 0.08, 0.3, (t) => {
      const n = rand();
      const v = n - hp;
      hp = n;
      return 0.035 * Math.exp(-t * 60) * v;
    });
    if (beatInBar === 1 || beatInBar === 3)
      add(left, right, rate, t0, 0.12, -0.2, (t) => {
        const env = Math.exp(-t * 35);
        return 0.05 * env * (Math.sin(TAU * 820 * t) * 0.6 + rand() * 0.4);
      });
  }
}

/** A short piano motif over each chord: the hook the score returns to. */
function melody(left, right, rate, seconds, lifts) {
  if (!lifts.length) return;
  const MOTIF = [4, 3, 2, 4, 3, 1]; // chord-tone indexes
  const RHYTHM = [0, 1, 1.5, 3, 4, 5.5]; // beats into the two bars
  for (
    let start = Math.floor(lifts[0] / (BAR * 2)) * BAR * 2;
    start < seconds;
    start += BAR * 2
  ) {
    const chord = chordAt(start);
    MOTIF.forEach((tone, i) => {
      const t0 = start + RHYTHM[i] * BEAT;
      if (t0 < lifts[0] || t0 >= seconds) return;
      const f = midi(chord[tone] + 24);
      add(left, right, rate, t0, 1.8, 0.1, (t) => {
        const env = Math.min(1, t / 0.004) * Math.exp(-t * 2.6);
        return (
          0.045 *
          env *
          (Math.sin(TAU * f * t) +
            0.3 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 4))
        );
      });
    });
  }
}

function cue(left, right, rate, { t, kind }, rand) {
  if (kind === "tick")
    add(left, right, rate, t, 0.06, 0.2, (x) => {
      const env = Math.exp(-x * 90);
      return 0.4 * env * (0.6 * Math.sin(TAU * 3800 * x) + 0.4 * rand());
    });
  if (kind === "chime")
    add(left, right, rate, t, 2.5, -0.15, (x) => {
      const f = midi(84);
      const env = Math.min(1, x / 0.004) * Math.exp(-x * 1.6);
      return (
        0.07 *
        env *
        (Math.sin(TAU * f * x) + 0.4 * Math.sin(TAU * f * 2.76 * x))
      );
    });
  if (kind === "whoosh" || kind === "lift") {
    const length = kind === "lift" ? 1.2 : 0.6;
    let low = 0;
    add(left, right, rate, t - length, length + 0.25, 0, (x) => {
      const rise = Math.min(1, x / length);
      const env = x < length ? rise * rise : Math.exp(-(x - length) * 12);
      low += (rand() - low) * (0.04 + 0.2 * rise); // opening filter
      return 0.05 * env * low;
    });
  }
}

/** Two short feedback delays per side: a soft room. */
function reverb(left, right, rate) {
  const taps = [
    [Math.round(0.0297 * rate), Math.round(0.0371 * rate)],
    [Math.round(0.0411 * rate), Math.round(0.0437 * rate)],
  ];
  const out = [Float32Array.from(left), Float32Array.from(right)];
  [left, right].forEach((src, side) => {
    for (const delay of taps[side]) {
      const line = new Float32Array(src.length);
      for (let i = delay; i < src.length; i++)
        line[i] = src[i - delay] * 0.5 + line[i - delay] * 0.62;
      for (let i = 0; i < src.length; i++) out[side][i] += 0.14 * line[i];
    }
  });
  return out;
}

export function renderScore({ seconds, cues = [], sampleRate = 48000 }) {
  const length = Math.round(seconds * sampleRate);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const rand = noise(84);
  pads(left, right, sampleRate, seconds);
  piano(left, right, sampleRate, seconds);
  const lifts = cues
    .filter((c) => c.kind === "lift")
    .map((c) => c.t)
    .sort((a, b) => a - b);
  pulse(left, right, sampleRate, seconds, lifts);
  bass(left, right, sampleRate, seconds);
  groove(left, right, sampleRate, seconds, lifts, rand);
  melody(left, right, sampleRate, seconds, lifts);
  for (const c of cues) cue(left, right, sampleRate, c, rand);
  const [l, r] = reverb(left, right, sampleRate);

  // Fades, then a soft limit and normalise to -1 dBFS.
  const fadeIn = 0.4 * sampleRate;
  const fadeOut = Math.min(1.5 * sampleRate, length / 3);
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const g = Math.min(1, i / fadeIn, (length - i) / fadeOut);
    l[i] = Math.tanh(l[i] * g * 1.2);
    r[i] = Math.tanh(r[i] * g * 1.2);
    peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  }
  const gain = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < length; i++) {
    l[i] *= gain;
    r[i] *= gain;
  }
  return [l, r];
}

/** 16-bit PCM WAV. */
export function writeWav(path, [left, right], sampleRate = 48000) {
  const frames = left.length;
  const buf = Buffer.alloc(44 + frames * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + frames * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) {
    buf.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, left[i])) * 32767),
      44 + i * 4,
    );
    buf.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, right[i])) * 32767),
      46 + i * 4,
    );
  }
  writeFileSync(path, buf);
}

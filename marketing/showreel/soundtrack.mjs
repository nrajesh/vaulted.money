#!/usr/bin/env node
/**
 * The soundtrack, synthesised from scratch: no samples, no dependencies.
 *
 * Music: 27 bars at 128 BPM. Bar 1 is a riser while the vault is forged;
 * bars 2–16 are a four-on-the-floor groove cycling Am9 – Fmaj9 – Cadd9 – G6
 * with a sidechained pad and bass; bars 17–18 drop the drums for the light
 * theme (a breakdown with a bell arpeggio and a riser); the drums slam back
 * on bar 19, bar 24 builds with a snare roll under the montage, and bars
 * 25–27 resolve to Cmaj9 on the logo and ring out as the picture fades.
 * The bar layout comes from the chapters in timeline.mjs.
 *
 * Sound design hangs off the same cue sheet as the animation (timeline.mjs),
 * and the forge ticks use the vault scene's own spark arrival times, so every
 * flash on screen has its sound.
 *
 *   node marketing/showreel/soundtrack.mjs   # writes out/soundtrack.wav
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BAR, CUES, DURATION, beat, chapter } from "./timeline.mjs";
import { forgeArrivals } from "./scenes/vault.mjs";
import { TYPING, platformAt } from "./scenes/everywhere.mjs";
import { random } from "./lib/motion.mjs";

const SAMPLE_RATE = 48000;
const LENGTH = Math.ceil(DURATION * SAMPLE_RATE);
const TAU = Math.PI * 2;

const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);

// ── Buses ───────────────────────────────────────────────────────────────────
function makeBus() {
  return { left: new Float32Array(LENGTH), right: new Float32Array(LENGTH) };
}

/**
 * Render a mono voice `generate(localTime, index)` into the dry bus (and the
 * reverb send), with equal-power panning.
 */
function place(
  buses,
  start,
  duration,
  generate,
  { gain = 1, pan = 0, send = 0, duck = 0 } = {},
) {
  const first = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const last = Math.min(LENGTH, Math.ceil((start + duration) * SAMPLE_RATE));
  const angle = ((pan + 1) / 2) * (Math.PI / 2);
  const leftGain = Math.cos(angle) * gain;
  const rightGain = Math.sin(angle) * gain;
  for (let index = first; index < last; index++) {
    const localTime = index / SAMPLE_RATE - start;
    let value = generate(localTime, index);
    if (duck) value *= 1 - duck * duckCurve[index];
    buses.dry.left[index] += value * leftGain;
    buses.dry.right[index] += value * rightGain;
    if (send) {
      buses.wet.left[index] += value * leftGain * send;
      buses.wet.right[index] += value * rightGain * send;
    }
  }
}

// ── DSP building blocks ─────────────────────────────────────────────────────
/** RBJ biquad; coefficients can be retuned per sample for sweeps. */
class Biquad {
  constructor(type, frequency, q = 0.707) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(frequency, q);
  }

  set(frequency, q = this.q) {
    this.q = q;
    const omega = (TAU * Math.min(frequency, SAMPLE_RATE * 0.45)) / SAMPLE_RATE;
    const alpha = Math.sin(omega) / (2 * q);
    const cos = Math.cos(omega);
    let b0;
    let b1;
    let b2;
    if (this.type === "lowpass") {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
    } else if (this.type === "highpass") {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(input) {
    const output =
      this.b0 * input +
      this.b1 * this.x1 +
      this.b2 * this.x2 -
      this.a1 * this.y1 -
      this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;
    return output;
  }
}

const noiseSource = (seed) => {
  const next = random(seed);
  return () => next() * 2 - 1;
};

// Seeded so the soundtrack is bit-identical on every render.
const phaseSource = random(128);

/** Band-limited-enough sawtooth via polyBLEP. */
function sawVoice(frequency) {
  let phase = phaseSource();
  const increment = frequency / SAMPLE_RATE;
  return () => {
    phase += increment;
    if (phase >= 1) phase -= 1;
    let value = 2 * phase - 1;
    if (phase < increment) {
      const t = phase / increment;
      value -= t + t - t * t - 1;
    } else if (phase > 1 - increment) {
      const t = (phase - 1) / increment;
      value -= t * t + t + t + 1;
    }
    return value;
  };
}

const envelope = (time, attack, decay) =>
  time < attack ? time / attack : Math.exp(-(time - attack) / decay);

// ── Groove ──────────────────────────────────────────────────────────────────
/** The light theme is the breakdown; the lockup rings out without drums. */
const BREAKDOWN = chapter("themes").bars;
const TOUR_START_BAR = chapter("import").bars[0];
const LAST_GROOVE_BAR = chapter("lockup").bars[0] - 1;
const isBreakdown = (bar) => bar >= BREAKDOWN[0] && bar <= BREAKDOWN[1];
/** Bars (1-based) where the full groove plays. */
const GROOVE_BARS = Array.from(
  { length: LAST_GROOVE_BAR - 1 },
  (_, index) => index + 2,
).filter((bar) => !isBreakdown(bar));
const barStart = (bar) => (bar - 1) * BAR;
const kicks = [];
for (const bar of GROOVE_BARS) {
  for (let step = 0; step < 4; step++) kicks.push(barStart(bar) + beat(step));
}

/** 0..1 ducking amount per sample from the most recent kick (the "pump"). */
const duckCurve = (() => {
  const curve = new Float32Array(LENGTH);
  const hits = [...kicks, CUES.lockup];
  let next = 0;
  let latest = -1;
  for (let index = 0; index < LENGTH; index++) {
    const time = index / SAMPLE_RATE;
    while (next < hits.length && hits[next] <= time) latest = hits[next++];
    curve[index] = latest < 0 ? 0 : Math.exp(-(time - latest) / 0.11);
  }
  return curve;
})();

function kick(buses, time, { gain = 0.95, sub = false } = {}) {
  const click = noiseSource(Math.floor(time * 1000));
  const length = sub ? 1.6 : 0.42;
  let phase = 0;
  place(
    buses,
    time,
    length,
    (t) => {
      const frequency = (sub ? 34 : 46) + 120 * Math.exp(-t * 32);
      phase += (TAU * frequency) / SAMPLE_RATE;
      const body = Math.sin(phase) * envelope(t, 0.002, sub ? 0.5 : 0.16);
      const transient = t < 0.004 ? click() * (1 - t / 0.004) * 0.5 : 0;
      return Math.tanh((body + transient) * 1.6);
    },
    { gain },
  );
}

function clap(buses, time, gain = 0.42) {
  const noise = noiseSource(Math.floor(time * 997));
  const band = new Biquad("bandpass", 1500, 1.1);
  const high = new Biquad("highpass", 700);
  place(
    buses,
    time - 0.012,
    0.35,
    (t) => {
      // Three quick bursts, then a tail: how a real clap sounds.
      const bursts = [0, 0.009, 0.019].reduce(
        (sum, offset) =>
          sum + (t >= offset ? Math.exp(-(t - offset) / 0.006) : 0),
        0,
      );
      const tail = t >= 0.019 ? Math.exp(-(t - 0.019) / 0.09) : 0;
      return high.process(band.process(noise())) * (bursts * 0.6 + tail) * 2.2;
    },
    { gain, send: 0.35, pan: 0.05 },
  );
}

function hat(buses, time, { gain = 0.1, open = false, pan = 0.25 } = {}) {
  const noise = noiseSource(Math.floor(time * 1231));
  const high = new Biquad("highpass", 7500, 0.9);
  place(
    buses,
    time,
    open ? 0.25 : 0.06,
    (t) => high.process(noise()) * envelope(t, 0.001, open ? 0.08 : 0.018),
    {
      gain,
      pan,
    },
  );
}

// ── Harmony ─────────────────────────────────────────────────────────────────
const CHORD = {
  Am9: { root: 33, notes: [57, 60, 64, 67, 71] },
  Fmaj9: { root: 29, notes: [53, 57, 60, 64, 67] },
  Cadd9: { root: 36, notes: [55, 60, 62, 64, 67] },
  G6: { root: 31, notes: [55, 59, 62, 64, 71] },
  Cmaj9: { root: 36, notes: [52, 55, 59, 62, 64, 67, 72] },
};
/**
 * The chord for a bar: the loop through the tour, Fmaj9 – G6 under the
 * breakdown, a finale that lifts through Fmaj9 – G6 into the logo's Cmaj9.
 * Bar 1 is the drone.
 */
function chordName(bar) {
  if (bar === 1) return null;
  if (bar > LAST_GROOVE_BAR) return "Cmaj9";
  if (isBreakdown(bar)) return ["Fmaj9", "G6"][(bar - BREAKDOWN[0]) % 2];
  if (bar > BREAKDOWN[1]) {
    const finale = ["Am9", "Fmaj9", "Cadd9", "G6", "Fmaj9", "G6"];
    const fromEnd = LAST_GROOVE_BAR - bar;
    return finale[Math.max(0, finale.length - 1 - fromEnd)];
  }
  return ["Am9", "Fmaj9", "Cadd9", "G6"][(bar - 2) % 4];
}
const chordFor = (bar) => CHORD[chordName(bar)];

function pad(
  buses,
  start,
  duration,
  notes,
  { gain = 0.05, cutoff = 2400, attack = 0.08, release = 0.5 } = {},
) {
  notes.forEach((note, noteIndex) => {
    for (const detune of [-0.11, 0, 0.12]) {
      const voice = sawVoice(midi(note + detune));
      const filter = new Biquad("lowpass", cutoff, 0.8);
      const pan = (noteIndex % 2 ? 1 : -1) * (0.25 + detune) * 1.6;
      place(
        buses,
        start,
        duration + release,
        (t) => {
          const level =
            t < attack
              ? t / attack
              : t > duration
                ? Math.exp(-(t - duration) / (release / 3))
                : 1;
          return filter.process(voice()) * level;
        },
        {
          gain,
          pan: Math.max(-0.9, Math.min(0.9, pan)),
          send: 0.45,
          duck: 0.65,
        },
      );
    }
  });
}

function bass(buses, start, duration, root, gain = 0.3) {
  const voice = sawVoice(midi(root));
  const filter = new Biquad("lowpass", 320, 1.1);
  let phase = 0;
  place(
    buses,
    start,
    duration + 0.08,
    (t) => {
      phase += (TAU * midi(root)) / SAMPLE_RATE;
      const level =
        Math.min(1, t / 0.01) *
        (t > duration ? Math.exp(-(t - duration) / 0.03) : 1);
      return (filter.process(voice()) * 0.7 + Math.sin(phase) * 0.6) * level;
    },
    { gain, duck: 0.85 },
  );
}

function pluck(buses, time, note, { gain = 0.06, pan = 0 } = {}) {
  const voice = sawVoice(midi(note));
  const filter = new Biquad("lowpass", 4000, 1.4);
  place(
    buses,
    time,
    0.3,
    (t, index) => {
      if (index % 16 === 0) filter.set(400 + 3600 * Math.exp(-t / 0.05), 1.4);
      return filter.process(voice()) * envelope(t, 0.002, 0.09);
    },
    { gain, pan, send: 0.3 },
  );
}

/** FM bell: bright, glassy, a little inharmonic. */
function bell(
  buses,
  time,
  frequency,
  {
    gain = 0.12,
    pan = 0,
    decay = 0.6,
    ratio = 3.5,
    index = 3,
    send = 0.5,
  } = {},
) {
  let carrier = 0;
  let modulator = 0;
  place(
    buses,
    time,
    decay * 5,
    (t) => {
      modulator += (TAU * frequency * ratio) / SAMPLE_RATE;
      const depth = index * Math.exp(-t / (decay * 0.4));
      carrier += (TAU * frequency) / SAMPLE_RATE;
      return (
        Math.sin(carrier + depth * Math.sin(modulator)) *
        envelope(t, 0.001, decay)
      );
    },
    { gain, pan, send },
  );
}

// ── Sound design ────────────────────────────────────────────────────────────
/** Filtered-noise sweep: whooshes, risers, swishes. */
function sweep(
  buses,
  start,
  duration,
  {
    from = 300,
    to = 5000,
    gain = 0.2,
    q = 1.2,
    shape = "swell",
    pan = 0,
    panTo = pan,
    send = 0.3,
    seed = 1,
  } = {},
) {
  const noise = noiseSource(seed);
  const filter = new Biquad("bandpass", from, q);
  const angleFrom = ((pan + 1) / 2) * (Math.PI / 2);
  const angleTo = ((panTo + 1) / 2) * (Math.PI / 2);
  const first = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const last = Math.min(LENGTH, Math.ceil((start + duration) * SAMPLE_RATE));
  for (let index = first; index < last; index++) {
    const progress = (index / SAMPLE_RATE - start) / duration;
    if (index % 16 === 0) filter.set(from * Math.pow(to / from, progress), q);
    const level =
      shape === "swell"
        ? Math.pow(progress, 2.2) *
          (progress > 0.97 ? (1 - progress) / 0.03 : 1)
        : shape === "whoosh"
          ? Math.sin(Math.PI * progress) ** 2
          : Math.exp(-progress * 5);
    const value = filter.process(noise()) * level * gain * 3;
    const angle = angleFrom + (angleTo - angleFrom) * progress;
    const left = value * Math.cos(angle);
    const right = value * Math.sin(angle);
    buses.dry.left[index] += left;
    buses.dry.right[index] += right;
    buses.wet.left[index] += left * send;
    buses.wet.right[index] += right * send;
  }
}

function tick(buses, time, { frequency = 4200, gain = 0.06, pan = 0 } = {}) {
  let phase = 0;
  place(
    buses,
    time,
    0.05,
    (t) => {
      phase += (TAU * frequency) / SAMPLE_RATE;
      return Math.sin(phase) * envelope(t, 0.0005, 0.008);
    },
    { gain, pan, send: 0.25 },
  );
}

function blip(buses, time, note, { gain = 0.07, pan = 0, decay = 0.08 } = {}) {
  let phase = 0;
  place(
    buses,
    time,
    decay * 5,
    (t) => {
      phase +=
        (TAU * midi(note) * (1 + 0.5 * Math.exp(-t / 0.01))) / SAMPLE_RATE;
      return (
        (Math.sin(phase) + 0.25 * Math.sin(phase * 2)) *
        envelope(t, 0.001, decay)
      );
    },
    { gain, pan, send: 0.3 },
  );
}

/** Deep cinematic hit: sub drop, kick, crash-like noise and a reverb bloom. */
function impact(buses, time, { gain = 1, crash = 0.35 } = {}) {
  kick(buses, time, { gain: 1.05 * gain, sub: true });
  const noise = noiseSource(Math.floor(time * 77));
  const high = new Biquad("highpass", 3500, 0.7);
  place(
    buses,
    time,
    2.2,
    (t) => high.process(noise()) * envelope(t, 0.002, 0.5),
    {
      gain: crash * gain,
      send: 0.7,
      pan: -0.1,
    },
  );
  const noise2 = noiseSource(Math.floor(time * 79));
  const high2 = new Biquad("highpass", 3200, 0.7);
  place(
    buses,
    time,
    2.2,
    (t) => high2.process(noise2()) * envelope(t, 0.002, 0.45),
    {
      gain: crash * gain,
      send: 0.7,
      pan: 0.1,
    },
  );
}

/** A metallic lock "clunk": low thump plus inharmonic ring. */
function clunk(buses, time, gain = 0.5) {
  let phase = 0;
  place(
    buses,
    time,
    0.4,
    (t) => {
      phase += (TAU * (70 + 60 * Math.exp(-t * 40))) / SAMPLE_RATE;
      return Math.sin(phase) * envelope(t, 0.001, 0.07);
    },
    { gain },
  );
  for (const [frequency, level] of [
    [612, 0.5],
    [1473, 0.35],
    [2318, 0.25],
    [3710, 0.15],
  ]) {
    let ring = 0;
    place(
      buses,
      time,
      0.9,
      (t) => {
        ring += (TAU * frequency) / SAMPLE_RATE;
        return Math.sin(ring) * envelope(t, 0.0008, 0.12) * level;
      },
      { gain: gain * 0.35, send: 0.5 },
    );
  }
  const noise = noiseSource(3);
  const band = new Biquad("bandpass", 2800, 2);
  place(
    buses,
    time,
    0.05,
    (t) => band.process(noise()) * envelope(t, 0.0005, 0.01),
    { gain: gain * 1.5 },
  );
}

// ── Reverb (Freeverb-style) ─────────────────────────────────────────────────
function reverb(wet) {
  const scale = SAMPLE_RATE / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpasses = [556, 441, 341, 225];
  const output = makeBus();
  for (const [channel, spread] of [
    ["left", 0],
    ["right", 23],
  ]) {
    const input = wet[channel];
    const result = output[channel];
    for (const length of combs) {
      const size = Math.round((length + spread) * scale);
      const buffer = new Float32Array(size);
      let position = 0;
      let store = 0;
      for (let index = 0; index < LENGTH; index++) {
        const delayed = buffer[position];
        store = delayed * 0.78 + store * 0.22;
        buffer[position] = input[index] * 0.015 + store * 0.86;
        result[index] += delayed;
        if (++position >= size) position = 0;
      }
    }
    for (const length of allpasses) {
      const size = Math.round((length + spread) * scale);
      const buffer = new Float32Array(size);
      let position = 0;
      for (let index = 0; index < LENGTH; index++) {
        const delayed = buffer[position];
        const value = result[index];
        buffer[position] = value + delayed * 0.5;
        result[index] = delayed - value;
        if (++position >= size) position = 0;
      }
    }
  }
  return output;
}

// ── Arrangement ─────────────────────────────────────────────────────────────
function arrange(buses) {
  // ── Bar 1: forge — drone, ignition, spark ticks, lock, dive ─────────────
  bell(buses, CUES.ignite, midi(93), {
    gain: 0.22,
    decay: 0.9,
    ratio: 2.76,
    index: 4,
    send: 0.8,
  });
  bell(buses, CUES.ignite, midi(81), {
    gain: 0.12,
    decay: 1.2,
    ratio: 1.5,
    index: 2,
    send: 0.8,
  });
  let dronePhase = 0;
  place(
    buses,
    0,
    beat(4) + 0.3,
    (t) => {
      dronePhase += (TAU * midi(33)) / SAMPLE_RATE;
      const level =
        Math.min(1, t / 0.6) *
        (t > beat(4) ? Math.exp(-(t - beat(4)) / 0.05) : 1);
      return (Math.sin(dronePhase) + 0.3 * Math.sin(dronePhase * 2)) * level;
    },
    { gain: 0.2 },
  );
  sweep(buses, 0.2, CUES.diveImpact - 0.2, {
    from: 250,
    to: 7000,
    gain: 0.3,
    q: 2,
    shape: "swell",
    send: 0.4,
    seed: 11,
  });
  forgeArrivals().forEach((time, index) => {
    tick(buses, time, {
      frequency: 3200 + (index % 5) * 380,
      gain: 0.1,
      pan: ((index % 7) - 3) / 4,
    });
  });
  clunk(buses, CUES.gemLock, 0.75);
  bell(buses, CUES.gemLock + 0.02, midi(81), {
    gain: 0.07,
    decay: 0.5,
    ratio: 1.41,
    index: 1.5,
  });
  sweep(buses, CUES.diveStart - 0.1, CUES.diveImpact - CUES.diveStart + 0.1, {
    from: 400,
    to: 9000,
    gain: 0.4,
    q: 0.9,
    shape: "swell",
    send: 0.2,
    seed: 12,
  });
  impact(buses, CUES.diveImpact, { gain: 1, crash: 0.3 });

  // ── The groove ──────────────────────────────────────────────────────────
  for (const time of kicks) kick(buses, time, { gain: 0.55 });
  for (const bar of GROOVE_BARS) {
    const start = barStart(bar);
    clap(buses, start + beat(1));
    clap(buses, start + beat(3));
    for (let step = 0; step < 4; step++) {
      hat(buses, start + beat(step + 0.5), { gain: 0.12, pan: 0.3 });
      // Busier sixteenths once the product tour starts.
      if (bar >= TOUR_START_BAR) {
        hat(buses, start + beat(step + 0.25), { gain: 0.05, pan: -0.35 });
        hat(buses, start + beat(step + 0.75), { gain: 0.05, pan: -0.35 });
      }
    }
    // An open hat into every other bar lifts the longer tour a little.
    if (bar >= TOUR_START_BAR && bar % 2 === 0) {
      hat(buses, start + beat(3.5), { gain: 0.07, open: true, pan: 0.15 });
    }
  }
  for (let bar = 2; bar <= LAST_GROOVE_BAR; bar++) {
    const { root, notes } = chordFor(bar);
    const start = barStart(bar);
    const breakdown = isBreakdown(bar);
    pad(buses, start, BAR - 0.02, notes, {
      gain: breakdown ? 0.075 : 0.065,
      cutoff: breakdown
        ? 1800 + (bar - BREAKDOWN[0]) * 1400
        : 2200 + ((bar - 2) % 6) * 400,
      attack: breakdown ? 0.25 : 0.03,
    });
    if (breakdown) {
      // Sustained sub under the breakdown, no pumping bass.
      bass(buses, start, BAR - 0.05, root, 0.07);
      continue;
    }
    // Bass pumps on the off-beats, house-style.
    for (let step = 0; step < 4; step++) {
      bass(buses, start + beat(step + 0.5), beat(0.42), root + 12, 0.14);
    }
    bass(buses, start, BAR - 0.05, root, 0.08);
  }

  // Arpeggio through the product tour and the finale.
  const pattern = [0, 2, 4, 1, 3, 2, 4, 3];
  for (let bar = TOUR_START_BAR; bar <= LAST_GROOVE_BAR; bar++) {
    if (isBreakdown(bar)) continue;
    const { notes } = chordFor(bar);
    for (let step = 0; step < 16; step++) {
      const note = notes[pattern[step % pattern.length] % notes.length] + 12;
      pluck(buses, barStart(bar) + beat(step / 4), note, {
        gain: 0.085 + (step % 4 === 0 ? 0.02 : 0),
        pan: step % 2 ? 0.45 : -0.45,
      });
    }
  }
  // Breakdown: a glassy bell arpeggio in eighths, rising into the drums.
  for (let bar = BREAKDOWN[0]; bar <= BREAKDOWN[1]; bar++) {
    const { notes } = chordFor(bar);
    for (let step = 0; step < 8; step++) {
      bell(
        buses,
        barStart(bar) + beat(step / 2),
        midi(notes[(step * 2) % notes.length] + 24),
        {
          gain: 0.04 + step * 0.002,
          decay: 0.45,
          ratio: 2,
          index: 0.9,
          pan: step % 2 ? 0.4 : -0.4,
          send: 0.7,
        },
      );
    }
  }

  // ── Bars 2–4: manifesto and privacy ─────────────────────────────────────
  sweep(buses, beat(5.4), 0.32, {
    from: 1500,
    to: 6000,
    gain: 0.09,
    shape: "whoosh",
    pan: 0.3,
    seed: 21,
  });
  sweep(buses, CUES.phoneWrap - 0.05, CUES.noCloud - CUES.phoneWrap + 0.05, {
    from: 300,
    to: 5000,
    gain: 0.16,
    shape: "swell",
    seed: 22,
  });
  bell(buses, CUES.noCloud, midi(84), {
    gain: 0.07,
    decay: 0.7,
    ratio: 2,
    index: 1.2,
    pan: 0.4,
  });
  [CUES.noCloud, CUES.noTrackers, CUES.noSubscriptions].forEach(
    (time, index) => {
      sweep(buses, time + 0.06, 0.2, {
        from: 6000,
        to: 900,
        gain: 0.12,
        shape: "whoosh",
        q: 1.5,
        pan: -0.5,
        seed: 30 + index,
      });
      blip(buses, time, [69, 72, 76][index], {
        gain: 0.07,
        pan: -0.4,
        decay: 0.12,
      });
    },
  );
  const scatter = random(5);
  for (let index = 0; index < 36; index++) {
    const time = CUES.noCloud + 0.15 + scatter() * (beat(14.8) - CUES.noCloud);
    tick(buses, time, {
      frequency: 2600 + scatter() * 3000,
      gain: 0.022,
      pan: 0.3 + scatter() * 0.6,
    });
  }
  for (let index = 0; index < 22; index++) {
    tick(buses, CUES.onDevice + index * 0.022, {
      frequency: 1800 + ((index * 7) % 5) * 420,
      gain: 0.03,
      pan: -0.5,
    });
  }

  // ── Bars 5–7: the desktop app and the CSV import ────────────────────────
  // Whip pan: the phone leaves left while the window arrives from the right.
  sweep(buses, beat(15.2), beat(16.3) - beat(15.2), {
    from: 500,
    to: 3500,
    gain: 0.3,
    shape: "whoosh",
    pan: 0.8,
    panTo: -0.6,
    seed: 40,
  });
  sweep(buses, beat(17.2), CUES.csvDrop - beat(17.2), {
    from: 900,
    to: 4200,
    gain: 0.08,
    shape: "whoosh",
    pan: -0.5,
    panTo: 0.3,
    seed: 41,
  });
  clunk(buses, CUES.csvDrop, 0.28);
  sweep(buses, CUES.importSettings - 0.05, 0.3, {
    from: 2000,
    to: 6000,
    gain: 0.06,
    shape: "whoosh",
    seed: 42,
  });
  // The preview callout draws on.
  [0, 0.12, 0.24].forEach((offset, index) =>
    blip(buses, beat(20.4) + offset, [67, 71, 74][index], {
      gain: 0.05,
      pan: 0.3,
      decay: 0.08,
    }),
  );
  for (let index = 0; index < 6; index++) {
    blip(
      buses,
      CUES.imported + 0.1 + index * beat(0.25),
      [72, 76, 79, 83, 84, 88][index],
      { gain: 0.05, pan: 0.3, decay: 0.07 },
    );
  }

  // ── Bars 8–9: one tap ───────────────────────────────────────────────────
  mouseClick(buses, CUES.categorizeClick);
  sweep(buses, CUES.categorized, 0.9, {
    from: 1200,
    to: 9000,
    gain: 0.08,
    shape: "swell",
    q: 3,
    pan: 0.2,
    seed: 50,
  });
  [0, 0.15, 0.3, 0.45, 0.6, 0.75].forEach((offset, index) => {
    bell(
      buses,
      CUES.categorized + offset,
      midi([76, 79, 83, 86, 88, 91][index]),
      { gain: 0.035, decay: 0.5, ratio: 2, index: 0.7, pan: 0.2, send: 0.6 },
    );
  });
  // The "categorised" toast.
  bell(buses, beat(34.2), midi(88), {
    gain: 0.07,
    decay: 0.3,
    ratio: 1,
    index: 0.5,
    pan: 0.5,
  });
  bell(buses, beat(34.2) + 0.11, midi(91), {
    gain: 0.07,
    decay: 0.5,
    ratio: 1,
    index: 0.5,
    pan: 0.5,
  });
  // ── Bars 10–11: optional AI ─────────────────────────────────────────────
  sweep(buses, CUES.aiProviders - 0.1, 0.35, {
    from: 1500,
    to: 5000,
    gain: 0.07,
    shape: "whoosh",
    seed: 51,
  });
  [0, 0.12].forEach((offset, index) =>
    blip(buses, beat(37.1) + offset, [72, 79][index], {
      gain: 0.05,
      pan: 0.3,
      decay: 0.1,
    }),
  );
  sweep(buses, CUES.aiProviderList - 0.1, 0.3, {
    from: 2000,
    to: 6000,
    gain: 0.05,
    shape: "whoosh",
    seed: 53,
  });
  blip(buses, CUES.aiKeyCard, 76, { gain: 0.07, decay: 0.15 });
  bell(buses, CUES.aiKeyCard, midi(88), {
    gain: 0.05,
    decay: 0.4,
    ratio: 3,
    index: 1.2,
  });

  // ── Bars 12–13: budgets and their alerts ────────────────────────────────
  sweep(buses, CUES.budgets - 0.1, 0.35, {
    from: 1500,
    to: 5000,
    gain: 0.07,
    shape: "whoosh",
    seed: 52,
  });
  [0, beat(0.75)].forEach((offset) => {
    bell(buses, CUES.budgetAlerts + offset, midi(88), {
      gain: 0.08,
      decay: 0.3,
      ratio: 1,
      index: 0.6,
      pan: -0.4,
    });
    bell(buses, CUES.budgetAlerts + offset + 0.12, midi(84), {
      gain: 0.08,
      decay: 0.45,
      ratio: 1,
      index: 0.6,
      pan: -0.4,
    });
  });
  sweep(buses, CUES.budgetsTip, beat(52.3) - CUES.budgetsTip, {
    from: 180,
    to: 1400,
    gain: 0.25,
    shape: "whoosh",
    q: 0.8,
    seed: 60,
  });

  // ── Bars 14–16: reports rise, then the chart is put through its paces ───
  [0, 0.09, 0.18].forEach((offset, ring) =>
    blip(buses, CUES.reportsRise + offset, [57, 64, 69][ring], {
      gain: 0.08,
      decay: 0.18,
    }),
  );
  for (let index = 0; index < 4; index++) {
    blip(buses, beat(53) + index * beat(0.5), [79, 83, 86, 91][index], {
      gain: 0.05,
      decay: 0.1,
      pan: -0.5,
    });
  }
  // The camera leans into Analytics.
  sweep(buses, CUES.reportsFocus, beat(2.2), {
    from: 300,
    to: 3000,
    gain: 0.09,
    shape: "swell",
    seed: 61,
  });
  // Tooltips appear with a soft blip; each toggle and the slice is a click.
  for (const time of [CUES.chartHover, CUES.chartBarHover]) {
    blip(buses, time, 84, { gain: 0.05, decay: 0.12, pan: 0.35 });
    blip(buses, time + 0.07, 88, { gain: 0.04, decay: 0.16, pan: 0.35 });
  }
  for (const time of [CUES.chartBar, CUES.chartPie, CUES.chartPieSlice]) {
    mouseClick(buses, time);
  }
  bell(buses, CUES.chartPieSlice + 0.05, midi(86), {
    gain: 0.05,
    decay: 0.5,
    ratio: 2,
    index: 0.8,
    pan: 0.3,
    send: 0.5,
  });
  // The wall pushes past the camera into the theme switch.
  sweep(buses, beat(63.3), CUES.themeToggle - beat(63.3), {
    from: 300,
    to: 5000,
    gain: 0.12,
    shape: "swell",
    seed: 62,
  });

  // ── Bars 17–18: the theme switch ────────────────────────────────────────
  mouseClick(buses, CUES.themeToggle);
  sweep(buses, CUES.themeToggle, 0.7, {
    from: 2500,
    to: 12000,
    gain: 0.1,
    shape: "whoosh",
    q: 2,
    pan: 0.6,
    panTo: -0.4,
    seed: 70,
  });
  const draws = random(49);
  for (let index = 0; index < 28; index++) {
    tick(buses, CUES.lightMark + index * 0.028, {
      frequency: 2400 + draws() * 1600,
      gain: 0.03,
      pan: -0.5,
    });
  }
  clunk(buses, CUES.lightMark + 0.8, 0.3);
  sweep(buses, CUES.themeToggle + beat(4) - 0.05, 0.3, {
    from: 2000,
    to: 6000,
    gain: 0.05,
    shape: "whoosh",
    seed: 71,
  });
  const riseFrom = CUES.themeToggle + beat(6);
  sweep(buses, riseFrom, CUES.themeBack - riseFrom, {
    from: 300,
    to: 7000,
    gain: 0.22,
    shape: "swell",
    q: 0.9,
    seed: 72,
  });
  mouseClick(buses, CUES.themeBack);
  let suckPhase = 0;
  place(
    buses,
    CUES.themeBack,
    CUES.everywhere - CUES.themeBack,
    (t) => {
      const amount = t / (CUES.everywhere - CUES.themeBack);
      suckPhase += (TAU * (300 + 1500 * amount * amount)) / SAMPLE_RATE;
      return Math.sin(suckPhase) * amount ** 3 * 0.5;
    },
    { gain: 0.08, send: 0.4 },
  );

  // ── Bars 19–21: everywhere (the drums slam back) ────────────────────────
  impact(buses, CUES.everywhere, { gain: 0.8, crash: 0.26 });
  [0, 0.1, 0.18].forEach((offset, index) =>
    blip(buses, CUES.everywhere - beat(0.4) + offset, [60, 64, 67][index], {
      gain: 0.06,
      decay: 0.2,
      pan: index - 1,
    }),
  );
  for (let index = 0; index < 4; index++) {
    bell(
      buses,
      CUES.currency + beat(0.25 + index * 0.5),
      midi([79, 83, 86, 91][index]),
      {
        gain: 0.05,
        decay: 0.3,
        ratio: 3.5,
        index: 1.4,
        pan: -0.6 + index * 0.4,
      },
    );
  }
  [0, 0.12, 0.24].forEach((offset, index) =>
    bell(buses, CUES.offline + 0.1 + offset, midi(84 + index * 3), {
      gain: 0.045,
      decay: 0.3,
      ratio: 2,
      index: 1,
      pan: index - 1,
    }),
  );
  // ── Bars 22–23: open source, and the install commands ───────────────────
  sweep(buses, CUES.openSource - beat(0.2), beat(1.2), {
    from: 2400,
    to: 300,
    gain: 0.12,
    shape: "whoosh",
    q: 0.9,
    seed: 75,
  });
  // Keystrokes for each line the terminal types.
  const keys = random(8);
  TYPING.forEach(([from, to]) => {
    const count = Math.round((to - from) / 0.028);
    for (let index = 0; index < count; index++) {
      const time = from + (index / count) * (to - from) + keys() * 0.01;
      tick(buses, time, {
        frequency: 1200 + keys() * 900,
        gain: 0.045,
        pan: 0.1,
      });
    }
  });
  for (let index = 0; index < 4; index++) {
    blip(buses, platformAt(index), [72, 76, 79, 84][index], {
      gain: 0.06,
      decay: 0.14,
      pan: -0.3 + index * 0.2,
    });
  }

  // ── Bar 24: montage — a hit on every cut and a snare roll building ──────
  sweep(buses, CUES.montage - beat(0.8), beat(0.8), {
    from: 400,
    to: 6000,
    gain: 0.16,
    shape: "swell",
    seed: 80,
  });
  for (let cut = 0; cut < 7; cut++) {
    const time = CUES.montage + cut * beat(0.5);
    snap(buses, time, cut);
  }
  for (let step = 0; step < 16; step++) {
    const time = CUES.montage + beat(step / 4);
    snare(buses, time, 0.08 + step * 0.012);
  }
  const riseStart = CUES.montage + beat(2);
  let risePhase = 0;
  place(
    buses,
    riseStart,
    CUES.lockup - riseStart,
    (t) => {
      const amount = t / (CUES.lockup - riseStart);
      risePhase += (TAU * (200 + 1800 * amount * amount)) / SAMPLE_RATE;
      return Math.sin(risePhase) * amount ** 3 * 0.5;
    },
    { gain: 0.1, send: 0.4 },
  );
  sweep(buses, riseStart, CUES.lockup - riseStart, {
    from: 200,
    to: 9000,
    gain: 0.32,
    shape: "swell",
    q: 0.8,
    seed: 81,
  });

  // ── Bars 25–27: the logo lands on Cmaj9 ─────────────────────────────────
  impact(buses, CUES.lockup, { gain: 1.1, crash: 0.34 });
  pad(buses, CUES.lockup, DURATION - CUES.lockup - 0.3, CHORD.Cmaj9.notes, {
    gain: 0.05,
    cutoff: 3200,
    attack: 0.01,
    release: 0.9,
  });
  bass(buses, CUES.lockup, DURATION - CUES.lockup - 0.4, 24, 0.12);
  const clinks = random(28);
  for (let index = 0; index < 28; index++) {
    tick(buses, CUES.lockup + 0.16 + clinks() * 0.3, {
      frequency: 3000 + clinks() * 2500,
      gain: 0.035,
      pan: (clinks() - 0.5) * 1.4,
    });
  }
  clunk(buses, CUES.lockup + 0.3, 0.35);
  [72, 76, 79, 83, 86, 91].forEach((note, index) => {
    bell(buses, CUES.lockup + beat(0.55) + index * 0.06, midi(note), {
      gain: 0.045,
      decay: 0.9,
      ratio: 2,
      index: 0.8,
      pan: -0.6 + index * 0.24,
      send: 0.7,
    });
  });
  sweep(buses, CUES.lockup + beat(2.3), 1.1, {
    from: 3000,
    to: 12000,
    gain: 0.05,
    shape: "whoosh",
    q: 3,
    pan: -0.6,
    panTo: 0.6,
    seed: 90,
  });
  bell(buses, CUES.lockup + beat(2.9), midi(96), {
    gain: 0.035,
    decay: 1.4,
    ratio: 2,
    index: 0.6,
    send: 0.9,
  });
  // The three badges, one chime each, then the address.
  [84, 88, 91].forEach((note, index) => {
    bell(buses, CUES.tagline + index * beat(0.5), midi(note), {
      gain: 0.05,
      decay: 0.8,
      ratio: 2,
      index: 0.7,
      pan: -0.4 + index * 0.4,
      send: 0.6,
    });
  });
  bell(buses, CUES.tagline + beat(2.5), midi(79), {
    gain: 0.035,
    decay: 1.6,
    ratio: 2,
    index: 0.5,
    send: 0.9,
  });
}

/** A mouse click: a tiny plastic tick with a low thump. */
function mouseClick(buses, time) {
  tick(buses, time, { frequency: 2200, gain: 0.08 });
  let phase = 0;
  place(
    buses,
    time,
    0.06,
    (t) => {
      phase += (TAU * 180) / SAMPLE_RATE;
      return Math.sin(phase) * envelope(t, 0.0005, 0.012);
    },
    { gain: 0.12 },
  );
}

/** A tight noise snap with a pitched body, for the montage cuts. */
function snap(buses, time, index) {
  const noise = noiseSource(Math.floor(time * 313));
  const band = new Biquad("bandpass", 2600 + index * 300, 1.4);
  place(
    buses,
    time,
    0.12,
    (t) => band.process(noise()) * envelope(t, 0.001, 0.025),
    { gain: 0.3, pan: index % 2 ? 0.3 : -0.3, send: 0.2 },
  );
  blip(buses, time, [72, 74, 76, 79, 81, 83, 84][index], {
    gain: 0.05,
    decay: 0.06,
  });
}

/** Snare hit (noise plus a short tone), used for the roll into the logo. */
function snare(buses, time, gain) {
  const noise = noiseSource(Math.floor(time * 911));
  const band = new Biquad("bandpass", 1900, 0.8);
  let phase = 0;
  place(
    buses,
    time,
    0.18,
    (t) => {
      phase += (TAU * 190) / SAMPLE_RATE;
      return (
        band.process(noise()) * envelope(t, 0.001, 0.05) * 1.6 +
        Math.sin(phase) * envelope(t, 0.001, 0.03) * 0.4
      );
    },
    { gain, send: 0.25 },
  );
}

// ── Mixdown ─────────────────────────────────────────────────────────────────
export function renderSoundtrack() {
  const buses = { dry: makeBus(), wet: makeBus() };
  arrange(buses);
  const tail = reverb(buses.wet);

  const left = new Float32Array(LENGTH);
  const right = new Float32Array(LENGTH);
  const highLeft = new Biquad("highpass", 36);
  const highRight = new Biquad("highpass", 36);
  let peak = 0;
  for (let index = 0; index < LENGTH; index++) {
    const time = index / SAMPLE_RATE;
    // Follow the picture's fade to black.
    const fade =
      time > DURATION - 0.32 ? Math.max(0, (DURATION - time) / 0.32) ** 1.5 : 1;
    const l =
      highLeft.process(buses.dry.left[index] + tail.left[index] * 0.9) * fade;
    const r =
      highRight.process(buses.dry.right[index] + tail.right[index] * 0.9) *
      fade;
    // Gentle saturation glues the mix.
    left[index] = Math.tanh(l * 1.15);
    right[index] = Math.tanh(r * 1.15);
    peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
  }

  // Leave headroom for inter-sample peaks so the AAC encode never clips.
  const normalise = peak > 0 ? 0.78 / peak : 1;
  const dither = noiseSource(16);
  const wav = Buffer.alloc(44 + LENGTH * 4);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + LENGTH * 4, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(LENGTH * 4, 40);
  for (let index = 0; index < LENGTH; index++) {
    // TPDF dither on the way to 16-bit.
    const leftDither = (dither() + dither()) / 65536;
    const rightDither = (dither() + dither()) / 65536;
    wav.writeInt16LE(
      Math.round(
        Math.max(-1, Math.min(1, left[index] * normalise + leftDither)) * 32767,
      ),
      44 + index * 4,
    );
    wav.writeInt16LE(
      Math.round(
        Math.max(-1, Math.min(1, right[index] * normalise + rightDither)) *
          32767,
      ),
      46 + index * 4,
    );
  }
  return wav;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), "out");
  mkdirSync(outDir, { recursive: true });
  const started = Date.now();
  writeFileSync(join(outDir, "soundtrack.wav"), renderSoundtrack());
  console.log(
    `✓ Wrote out/soundtrack.wav in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

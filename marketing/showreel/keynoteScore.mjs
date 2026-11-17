/**
 * The keynote cut's score, synthesised from scratch (no samples, nothing to
 * license). Its instruments and arc are the relaxed social cut's
 * (soundtrack.mjs), copied rather than shared so the committed social cuts
 * never change: a four-on-the-floor house groove at 108 BPM, a sidechained
 * saw pad, an off-beat bass, a plucked arpeggio, risers, a breakdown, a snare
 * roll into the finale and an impact on the logo.
 *
 * The song (chords, melody, chapters) lives in timelines/keynote.mjs, and
 * every card that lands from the turn on is a note of the melody, played out
 * loud on the lead pluck with a bell above it, so the cards play the tune:
 *
 * - worry / rearview: a low drone, each worry a stray, slightly out-of-tune
 *   glass note (`mess`); the lines and the SOLD stamp a dull clunk (`stamp`).
 * - turn: the logo lands with an impact (`logo`), the rows snap into place
 *   on the eighths (`snap`), a riser and a snare roll lead into the drop.
 * - privacy … open (`drop`): the full groove, busier from "search" on.
 * - bigScreens (`break`): the drums rest; a bell arpeggio rises into the
 *   devices, where the drums slam back (`drop`).
 * - montage (`finale`): the densest part, a crash every bar, a snare roll and
 *   a riser into the end card.
 * - end (`outro`): an impact on Cmaj9, a bell cascade, and the chord rings.
 *
 *   renderScore({ seconds, cues }) → [left, right] Float32Array at 48 kHz
 */
import { random } from "./lib/motion.mjs";
import {
  BAR,
  BEAT,
  CHAPTERS,
  SONG_BARS,
  chordOf,
  melody,
  sectionOf,
} from "./timelines/keynote.mjs";

const SAMPLE_RATE = 48000;
const TAU = Math.PI * 2;
const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);
const beat = (n) => n * BEAT;

/** Samples in the render; set by renderScore before anything is placed. */
let LENGTH = 0;
/** 0..1 ducking per sample from the latest kick (the "pump"). */
let duckCurve = new Float32Array(0);

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
  const first = Math.max(0, Math.ceil(start * SAMPLE_RATE));
  const last = Math.min(LENGTH, Math.ceil((start + duration) * SAMPLE_RATE));
  const angle = ((pan + 1) / 2) * (Math.PI / 2);
  const leftGain = Math.cos(angle) * gain;
  const rightGain = Math.sin(angle) * gain;
  for (let index = first; index < last; index++) {
    const localTime = Math.max(0, index / SAMPLE_RATE - start);
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

/** Band-limited-enough sawtooth via polyBLEP; phase seeded per voice. */
function sawVoice(frequency, seed) {
  let phase = random(seed)();
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
const seedOf = (time, salt) => Math.floor(time * 1000) * 31 + salt;

const envelope = (time, attack, decay) =>
  time < attack ? time / attack : Math.exp(-(time - attack) / decay);

// ── Drums ───────────────────────────────────────────────────────────────────
function kick(buses, time, { gain = 0.95, sub = false } = {}) {
  const click = noiseSource(seedOf(time, 1));
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
  const noise = noiseSource(seedOf(time, 2));
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
  const noise = noiseSource(seedOf(time, 3));
  const high = new Biquad("highpass", 7500, 0.9);
  place(
    buses,
    time,
    open ? 0.25 : 0.06,
    (t) => high.process(noise()) * envelope(t, 0.001, open ? 0.08 : 0.018),
    { gain, pan },
  );
}

/** Snare hit (noise plus a short tone), for rolls into a drop. */
function snare(buses, time, gain) {
  const noise = noiseSource(seedOf(time, 4));
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

/** A crash: two bright noise tails. */
function crash(buses, time, gain = 0.3) {
  for (const [salt, pan] of [
    [5, -0.1],
    [6, 0.1],
  ]) {
    const noise = noiseSource(seedOf(time, salt));
    const high = new Biquad("highpass", 3400, 0.7);
    place(
      buses,
      time,
      2.2,
      (t) => high.process(noise()) * envelope(t, 0.002, 0.48),
      { gain, send: 0.7, pan },
    );
  }
}

/** Deep cinematic hit: sub drop, kick and a crash. */
function impact(buses, time, { gain = 1, crash: amount = 0.35 } = {}) {
  kick(buses, time, { gain: 1.05 * gain, sub: true });
  crash(buses, time, amount * gain);
}

// ── Harmony ─────────────────────────────────────────────────────────────────
function pad(
  buses,
  start,
  duration,
  notes,
  {
    gain = 0.05,
    cutoff = 2400,
    attack = 0.08,
    release = 0.5,
    duck = 0.65,
  } = {},
) {
  notes.forEach((note, noteIndex) => {
    for (const detune of [-0.11, 0, 0.12]) {
      const voice = sawVoice(
        midi(note + detune),
        seedOf(start, noteIndex * 7 + 40),
      );
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
          duck,
        },
      );
    }
  });
}

function bass(buses, start, duration, root, gain = 0.3) {
  const voice = sawVoice(midi(root), seedOf(start, 50));
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

function pluck(buses, time, note, { gain = 0.06, pan = 0, decay = 0.09 } = {}) {
  const voice = sawVoice(midi(note), seedOf(time, 60 + note));
  const filter = new Biquad("lowpass", 4000, 1.4);
  place(
    buses,
    time,
    decay * 4,
    (t, index) => {
      if (index % 16 === 0) filter.set(400 + 3600 * Math.exp(-t / 0.05), 1.4);
      return filter.process(voice()) * envelope(t, 0.002, decay);
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
/** Filtered-noise sweep: whooshes and risers. */
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
    seed = 1,
  } = {},
) {
  const noise = noiseSource(seed);
  const filter = new Biquad("bandpass", from, q);
  const first = Math.max(0, Math.ceil(start * SAMPLE_RATE));
  const last = Math.min(LENGTH, Math.ceil((start + duration) * SAMPLE_RATE));
  for (let index = first; index < last; index++) {
    const progress = Math.min(
      1,
      Math.max(0, (index / SAMPLE_RATE - start) / duration),
    );
    if (index % 16 === 0) filter.set(from * Math.pow(to / from, progress), q);
    const level =
      shape === "swell"
        ? Math.pow(progress, 2.2) *
          (progress > 0.97 ? (1 - progress) / 0.03 : 1)
        : Math.sin(Math.PI * progress) ** 2;
    const value = filter.process(noise()) * level * gain * 3;
    buses.dry.left[index] += value * 0.7;
    buses.dry.right[index] += value * 0.7;
    buses.wet.left[index] += value * 0.2;
    buses.wet.right[index] += value * 0.2;
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
}

/** A snare roll of sixteenths over `beats`, swelling into `end`. */
function roll(buses, end, beats, from = 0.06, to = 0.22) {
  const steps = beats * 4;
  for (let step = 0; step < steps; step++)
    snare(
      buses,
      end - beat(beats) + beat(step / 4),
      from + (to - from) * (step / (steps - 1)),
    );
}

/** A rising tone and a noise riser into `end`. */
function riser(buses, end, length, seed, gain = 0.3) {
  sweep(buses, end - length, length, {
    from: 200,
    to: 9000,
    gain,
    shape: "swell",
    q: 0.8,
    seed,
  });
  let phase = 0;
  place(
    buses,
    end - length,
    length,
    (t) => {
      const amount = t / length;
      phase += (TAU * (200 + 1800 * amount * amount)) / SAMPLE_RATE;
      return Math.sin(phase) * amount ** 3 * 0.5;
    },
    { gain: 0.08, send: 0.4 },
  );
}

// ── Card sounds ─────────────────────────────────────────────────────────────
const SOUNDS = {
  /** A card on the tune: its melody note on the lead, a bell an octave up. */
  card(buses, { t, note }) {
    pluck(buses, t, note, { gain: 0.15, decay: 0.16 });
    bell(buses, t, midi(note + 12), {
      gain: 0.035,
      decay: 0.35,
      ratio: 2,
      index: 1,
      send: 0.4,
    });
  },
  /** A worry: a stray glass note, a little out of tune. */
  mess(buses, { t, note }) {
    const cents = ((Math.round(t * 100) % 7) - 3) * 6;
    bell(buses, t, midi(note) * Math.pow(2, cents / 1200), {
      gain: 0.09,
      decay: 0.7,
      ratio: 3.5,
      index: 1.6,
      pan: ((note % 5) - 2) * 0.3,
      send: 0.7,
    });
  },
  /** A row snapping into place: a bright blip and a tick. */
  snap(buses, { t, note }) {
    blip(buses, t, note, { gain: 0.09, decay: 0.12, pan: (note % 3) - 1 });
    tick(buses, t, { frequency: 3600, gain: 0.04 });
  },
  /** A dull clunk with a low bell. */
  stamp(buses, { t, note }) {
    clunk(buses, t, 0.45);
    bell(buses, t, midi(note + 12), {
      gain: 0.08,
      decay: 0.8,
      ratio: 1.41,
      index: 1.2,
    });
  },
  /** The logo: an impact with a bell cascade up the chord. */
  logo(buses, { t, note }) {
    impact(buses, t, { gain: 0.75, crash: 0.25 });
    [0, 4, 7, 11, 14].forEach((step, i) =>
      bell(buses, t + 0.05 + i * 0.06, midi(note + 12 + step), {
        gain: 0.05,
        decay: 0.9,
        ratio: 2,
        index: 0.8,
        pan: -0.5 + i * 0.25,
        send: 0.7,
      }),
    );
  },
};

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

/** The section each moment is in, from the cues. */
function sectionAt(cues, t) {
  let kind = "intro";
  for (const c of cues)
    if (
      ["drop", "break", "finale", "outro"].includes(c.kind) &&
      c.t <= t + 1e-9
    )
      kind = c.kind === "drop" ? "groove" : c.kind;
  return kind;
}

function arrange(buses, cues, seconds) {
  const bars = Math.min(SONG_BARS, Math.ceil(seconds / BAR));
  const first = (kind) => cues.find((c) => c.kind === kind)?.t;
  const turn = CHAPTERS.find((c) => c.id === "turn").start;
  const search = CHAPTERS.find((c) => c.id === "search").start;
  const budgets = CHAPTERS.find((c) => c.id === "budgets").start;

  // The opening: a low drone that holds until the turn.
  let dronePhase = 0;
  place(
    buses,
    0,
    turn + 0.3,
    (t) => {
      dronePhase += (TAU * midi(33)) / SAMPLE_RATE;
      const level =
        Math.min(1, t / 0.8) * (t > turn ? Math.exp(-(t - turn) / 0.08) : 1);
      return (Math.sin(dronePhase) + 0.3 * Math.sin(dronePhase * 2)) * level;
    },
    { gain: 0.12 },
  );

  for (let bar = 0; bar < bars; bar++) {
    const start = bar * BAR;
    const chord = chordOf(bar);
    const part = sectionOf(bar);
    const kind = sectionAt(cues, start + 1e-6);

    if (part === "worry" || part === "rearview") {
      pad(buses, start, BAR - 0.02, chord.tones, {
        gain: 0.022,
        cutoff: 900,
        attack: 0.6,
        duck: 0,
      });
      continue;
    }
    if (part === "turn") {
      // The lift: a brighter pad each bar and a sustained bass.
      pad(buses, start, BAR - 0.02, chord.tones, {
        gain: 0.05,
        cutoff: 1800 + (bar - turn / BAR) * 1600,
        attack: 0.05,
        duck: 0,
      });
      bass(buses, start, BAR - 0.05, chord.root, 0.08);
      continue;
    }
    if (kind === "outro") continue;

    // Pads every bar; open, wider filter in the finale.
    pad(buses, start, BAR - 0.02, chord.tones, {
      gain: kind === "break" ? 0.07 : kind === "finale" ? 0.08 : 0.06,
      cutoff:
        kind === "break"
          ? 1600 + (bar % 4) * 900
          : kind === "finale"
            ? 3400
            : 2200 + (bar % 6) * 300,
      attack: kind === "break" ? 0.25 : 0.03,
    });

    if (kind === "break") {
      // Sustained sub, no pumping bass; a glassy bell arpeggio in eighths.
      bass(buses, start, BAR - 0.05, chord.root, 0.07);
      for (let step = 0; step < 8; step++)
        bell(
          buses,
          start + beat(step / 2),
          midi(chord.tones[(step * 2) % chord.tones.length] + 24),
          {
            gain: 0.04 + step * 0.002,
            decay: 0.45,
            ratio: 2,
            index: 0.9,
            pan: step % 2 ? 0.4 : -0.4,
            send: 0.7,
          },
        );
      continue;
    }

    // The groove: four on the floor, claps on two and four, off-beat hats.
    for (let step = 0; step < 4; step++)
      kick(buses, start + beat(step), {
        gain: kind === "finale" ? 0.64 : 0.55,
      });
    clap(buses, start + beat(1));
    clap(buses, start + beat(3));
    for (let step = 0; step < 4; step++) {
      hat(buses, start + beat(step + 0.5), { gain: 0.12, pan: 0.3 });
      // Busier sixteenths once the questions get going.
      if (start >= search - 1e-6) {
        hat(buses, start + beat(step + 0.25), { gain: 0.05, pan: -0.35 });
        hat(buses, start + beat(step + 0.75), { gain: 0.05, pan: -0.35 });
      }
    }
    if ((start >= budgets - 1e-6 && bar % 2 === 0) || kind === "finale")
      hat(buses, start + beat(3.5), { gain: 0.07, open: true, pan: 0.15 });
    if (kind === "finale") crash(buses, start, 0.2);

    // Bass pumps on the off-beats, house-style, over a held root.
    for (let step = 0; step < 4; step++)
      bass(buses, start + beat(step + 0.5), beat(0.42), chord.root + 12, 0.14);
    bass(buses, start, BAR - 0.05, chord.root, 0.08);

    // A plucked arpeggio under the tune from "search" on, louder at the end.
    if (start >= search - 1e-6) {
      const pattern = [0, 2, 4, 1, 3, 2, 4, 3];
      for (let step = 0; step < 16; step++)
        pluck(
          buses,
          start + beat(step / 4),
          chord.tones[pattern[step % 8] % chord.tones.length] + 12,
          {
            gain: (kind === "finale" ? 0.07 : 0.05) + (step % 4 ? 0 : 0.012),
            pan: step % 2 ? 0.45 : -0.45,
          },
        );
    }
  }

  // The tune underneath: quiet, so the cards carry it. Card notes are played
  // by their card.
  const carded = new Set(
    cues.filter((c) => c.kind === "card").map((c) => c.t.toFixed(4)),
  );
  for (const n of melody()) {
    if (n.t >= seconds || carded.has(n.t.toFixed(4))) continue;
    pluck(buses, n.t, n.note, { gain: 0.05, decay: 0.14, pan: -0.05 });
  }

  // Into the first drop: a riser and a snare roll; every drop hits.
  const drops = cues.filter((c) => c.kind === "drop").map((c) => c.t);
  if (drops[0] !== undefined) {
    riser(buses, drops[0], BAR, 81);
    roll(buses, drops[0], 2);
  }
  for (const t of drops) impact(buses, t, { gain: 0.8, crash: 0.28 });
  // Out of the break: a riser and a roll back into the drums.
  if (drops[1] !== undefined) {
    riser(buses, drops[1], BAR, 82, 0.25);
    roll(buses, drops[1], 1);
  }
  // The finale builds into the end card: a full-bar roll and a long riser,
  // then the logo lands on Cmaj9 and rings.
  const outro = first("outro");
  if (outro !== undefined && outro < seconds) {
    roll(buses, outro, 4, 0.05, 0.26);
    riser(buses, outro, 2 * BAR, 83, 0.32);
    impact(buses, outro, { gain: 1.1, crash: 0.34 });
    const ring = seconds - outro;
    const { tones, root } = chordOf(Math.floor(outro / BAR + 1e-6));
    pad(buses, outro, ring - 0.3, tones, {
      gain: 0.05,
      cutoff: 3200,
      attack: 0.01,
      release: 0.9,
      duck: 0,
    });
    bass(buses, outro, ring - 0.4, root - 12, 0.12);
    [72, 76, 79, 83, 86, 91].forEach((note, index) =>
      bell(buses, outro + beat(0.55) + index * 0.06, midi(note), {
        gain: 0.045,
        decay: 0.9,
        ratio: 2,
        index: 0.8,
        pan: -0.6 + index * 0.24,
        send: 0.7,
      }),
    );
  }

  for (const c of cues) SOUNDS[c.kind]?.(buses, c);
}

// ── Mixdown ─────────────────────────────────────────────────────────────────
export function renderScore({ seconds, cues = [] }) {
  LENGTH = Math.round(seconds * SAMPLE_RATE);
  // The pump follows every kick of the groove.
  const kicks = [];
  const bars = Math.min(SONG_BARS, Math.ceil(seconds / BAR));
  for (let bar = 0; bar < bars; bar++) {
    const kind = sectionAt(cues, bar * BAR + 1e-6);
    if (["worry", "rearview", "turn"].includes(sectionOf(bar))) continue;
    if (kind === "groove" || kind === "finale")
      for (let step = 0; step < 4; step++) kicks.push(bar * BAR + beat(step));
  }
  duckCurve = new Float32Array(LENGTH);
  let next = 0;
  let latest = -1;
  for (let index = 0; index < LENGTH; index++) {
    const time = index / SAMPLE_RATE;
    while (next < kicks.length && kicks[next] <= time) latest = kicks[next++];
    duckCurve[index] = latest < 0 ? 0 : Math.exp(-(time - latest) / 0.11);
  }

  const buses = { dry: makeBus(), wet: makeBus() };
  arrange(buses, cues, seconds);
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
      time > seconds - 0.4 ? Math.max(0, (seconds - time) / 0.4) ** 1.5 : 1;
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
  const normalise = peak > 0 ? 0.7 / peak : 1;
  for (let index = 0; index < LENGTH; index++) {
    left[index] *= normalise;
    right[index] *= normalise;
  }
  return [left, right];
}

export { writeWav } from "./calmScore.mjs";

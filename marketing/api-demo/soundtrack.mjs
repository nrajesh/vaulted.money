#!/usr/bin/env node
/**
 * The soundtrack, synthesised from scratch (no samples, no dependencies):
 * a calm 92 BPM bed (pad + bass + sparse plucks in Am9 – Fmaj9 – Cmaj7 – Gsus2)
 * with a soft swoosh at every scene change, so picture and sound share
 * the cue sheet in timeline.mjs. Medium energy: it builds slightly through
 * the demo, thins out for the privacy scene, and resolves on the logo.
 *
 *   node marketing/api-demo/soundtrack.mjs   # writes out/soundtrack.wav
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION, SCENES, scene } from "./timeline.mjs";

const SR = 48000;
const N = Math.ceil(DURATION * SR);
const TAU = Math.PI * 2;
const BPM = 92;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

const L = new Float32Array(N);
const R = new Float32Array(N);
const wetL = new Float32Array(N);
const wetR = new Float32Array(N);

let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

/** Add a mono voice with a pan and reverb send. */
function voice(start, dur, fn, { gain = 1, pan = 0, send = 0.3 } = {}) {
  const a = Math.max(0, Math.floor(start * SR));
  const b = Math.min(N, Math.ceil((start + dur) * SR));
  const lg = Math.cos(((pan + 1) / 4) * Math.PI) * gain;
  const rg = Math.sin(((pan + 1) / 4) * Math.PI) * gain;
  for (let i = a; i < b; i++) {
    const v = fn((i - a) / SR, i);
    L[i] += v * lg; R[i] += v * rg;
    wetL[i] += v * lg * send; wetR[i] += v * rg * send;
  }
}
const env = (t, dur, atk, rel) => Math.min(1, t / atk) * Math.min(1, Math.max(0, (dur - t) / rel));

const CHORDS = [
  [57, 60, 64, 67, 71], // Am9
  [53, 57, 60, 64, 67], // Fmaj9
  [48, 55, 59, 64, 67], // Cmaj7 (open)
  [55, 59, 62, 64, 69], // Gsus2/6-ish
];
const T = { enable: scene("enable").start, create: scene("create").start, privacy: scene("privacy"), unique: scene("unique").start };
// Quieter for the title and the privacy scene; fullest through the chat chapter.
const section = (t) => (t < T.enable ? 0.7 : t >= T.privacy.start && t < T.privacy.end ? 0.6 : t < T.unique ? 1 : 0.8);

// Pad + bass, one chord per bar
for (let bar = 0; bar * BAR < DURATION; bar++) {
  const t0 = bar * BAR;
  const chord = CHORDS[bar % 4];
  const lvl = section(t0 + 1) * Math.min(1, t0 / 3) * (t0 > DURATION - 8 ? Math.max(0, (DURATION - t0) / 8) : 1);
  chord.forEach((note, k) => {
    for (const detune of [-0.07, 0.07]) {
      const f = midi(note + 12) * (1 + detune * 0.01 * 10 * 0.1);
      voice(t0, BAR + 1.2, (t) => {
        const e = env(t, BAR + 1.2, 1.1, 1.4);
        const x = Math.sin(TAU * f * t * (1 + detune * 0.002)) + 0.4 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 0.8);
        return x * e * 0.030 * lvl;
      }, { pan: (k - 2) * 0.28, send: 0.5 });
    }
  });
  const root = midi(chord[0] - 12);
  voice(t0, BAR, (t) => Math.sin(TAU * root * t) * env(t, BAR, 0.05, 0.8) * 0.11 * lvl, { send: 0.05 });
}

// Sparse plucks: 8th-note pattern drawn from the chord, from 7 s on
const PATTERN = [0, 2, 3, 2, 4, 3, 2, 1];
for (let bar = 0; bar * BAR < DURATION; bar++) {
  const chord = CHORDS[bar % 4];
  for (let step = 0; step < 8; step++) {
    const t0 = bar * BAR + step * (BEAT / 2);
    if (t0 < T.enable || t0 > DURATION - 6) continue;
    if ((step + bar) % 3 === 2) continue; // leave room to breathe
    const lvl = section(t0) * (t0 >= T.privacy.start && t0 < T.privacy.end ? 0.5 : 1);
    const f = midi(chord[PATTERN[step]] + 24);
    voice(t0, 1.4, (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 3 * t) * Math.exp(-t * 9)) * Math.exp(-t * 4.5) * 0.045 * lvl, { pan: Math.sin(step) * 0.5, send: 0.55 });
  }
}

// Soft heartbeat pulse that lifts the middle of the film
for (let b = 0; b * BEAT < DURATION; b++) {
  const t0 = b * BEAT;
  if (t0 < T.create || t0 > T.unique || (t0 >= T.privacy.start && t0 < T.privacy.end)) continue;
  voice(t0, 0.35, (t) => Math.sin(TAU * (48 + 60 * Math.exp(-t * 28)) * t) * Math.exp(-t * 11) * 0.16, { send: 0.04 });
}

// Swoosh at each scene change (band-passed noise rising in pitch)
for (const sc of SCENES.slice(1)) {
  const t0 = sc.start - 0.45;
  let lp = 0;
  voice(t0, 1.3, (t) => {
    const e = Math.sin(Math.PI * Math.min(1, t / 1.3)) ** 2;
    const k = 0.04 + 0.5 * (t / 1.3) ** 2;
    lp += (rnd() - lp) * k;
    return lp * e * 0.35;
  }, { send: 0.4, pan: 0 });
  // tiny landing tone
  const f = midi(CHORDS[Math.floor(sc.start / BAR) % 4][2] + 36);
  voice(sc.start, 1.6, (t) => Math.sin(TAU * f * t) * Math.exp(-t * 3.2) * 0.05, { send: 0.6 });
}

// Title sparkle and final resolve
voice(0.2, 5, (t) => Math.sin(TAU * midi(81) * t) * Math.exp(-t * 1.2) * 0.05 * Math.min(1, t / 0.3), { send: 0.7 });
voice(DURATION - 6, 6, (t) => [57, 64, 69, 76].reduce((s, n) => s + Math.sin(TAU * midi(n) * t), 0) * env(t, 6, 0.6, 3) * 0.03, { send: 0.7 });

// Reverb: two comb-ish feedback delays per side
function reverb(wet, out, delays) {
  const buf = delays.map((d) => new Float32Array(Math.floor(d * SR)));
  const idx = delays.map(() => 0);
  for (let i = 0; i < N; i++) {
    let acc = 0;
    for (let j = 0; j < buf.length; j++) {
      const y = buf[j][idx[j]];
      buf[j][idx[j]] = wet[i] + y * 0.62;
      idx[j] = (idx[j] + 1) % buf[j].length;
      acc += y;
    }
    out[i] += acc * 0.28;
  }
}
reverb(wetL, L, [0.0297, 0.0371, 0.0411, 0.0437]);
reverb(wetR, R, [0.0313, 0.0361, 0.0427, 0.0451]);

// Master: gentle low-pass, fades, normalise to -3 dBFS
let pl = 0, pr = 0;
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 1.5) * Math.min(1, (DURATION - t) / 2.5);
  pl += (L[i] - pl) * 0.55; pr += (R[i] - pr) * 0.55;
  L[i] = pl * fade; R[i] = pr * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.708 / peak;

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
header.write("data", 36); header.writeUInt32LE(data.length, 40);
const out = join(dirname(fileURLToPath(import.meta.url)), "out");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "soundtrack.wav"), Buffer.concat([header, data]));
console.log("• soundtrack.wav", DURATION.toFixed(1) + "s");

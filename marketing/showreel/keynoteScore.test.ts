import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { renderScore } from "./keynoteScore.mjs";

type Cue = { t: number; kind: string; i?: number };
const render = renderScore as (opts: {
  seconds: number;
  cues: Cue[];
  sampleRate?: number;
}) => Float32Array[];

const rms = (ch: Float32Array, from: number, to: number, rate = 48000) => {
  let sum = 0;
  const a = Math.floor(from * rate);
  const b = Math.floor(to * rate);
  for (let i = a; i < b; i++) sum += ch[i] * ch[i];
  return Math.sqrt(sum / (b - a));
};

const EFFECTS = [
  "swish",
  "pop",
  "tick",
  "thud",
  "ding",
  "whoosh",
  "sweep",
  "shimmer",
  "boom",
];

describe("keynote score", () => {
  it("renders stereo at 48 kHz for the requested length", () => {
    const [left, right] = render({ seconds: 2, cues: [] });
    expect(left).toHaveLength(96_000);
    expect(right).toHaveLength(96_000);
  });

  it("never clips, with every effect and section cue", () => {
    const cues: Cue[] = [
      { t: 1, kind: "drop" },
      { t: 4, kind: "break" },
      { t: 6, kind: "drop" },
      ...EFFECTS.map((kind, i) => ({ t: 1.5 + i * 0.5, kind })),
    ];
    for (const ch of render({ seconds: 8, cues }))
      for (const v of ch) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  // Phone and laptop speakers play little below 200 Hz, so every effect
  // must still be heard with the lows taken out.
  const highPass = (ch: Float32Array) => {
    const out = new Float32Array(ch.length);
    const k = Math.exp((-2 * Math.PI * 200) / 48000);
    let x1 = 0;
    let y = 0;
    for (let i = 0; i < ch.length; i++) {
      y = k * (y + ch[i] - x1);
      x1 = ch[i];
      out[i] = y;
    }
    return out;
  };
  // Four poles: 24 dB an octave, roughly a phone speaker's roll-off.
  const smallSpeaker = (ch: Float32Array) =>
    highPass(highPass(highPass(highPass(ch))));

  it.each(EFFECTS)("makes a %s audible on a phone where it is cued", (kind) => {
    const quiet = smallSpeaker(render({ seconds: 3, cues: [] })[0]);
    const cued = smallSpeaker(
      render({ seconds: 3, cues: [{ t: 2, kind }] })[0],
    );
    // Sweeps and whooshes rise into their mark; the rest start on it.
    const from = ["whoosh", "sweep"].includes(kind) ? 1.6 : 2;
    // Both are normalised, so compare how much louder the cue's moment is
    // than an earlier stretch, with and without the cue.
    const span = 2.3 - from;
    const lift = (ch: Float32Array) =>
      rms(ch, from, 2.3) / rms(ch, 0.6, 0.6 + span);
    expect(lift(cued), kind).toBeGreaterThan(lift(quiet) * 1.25);
  });

  it("is quiet before the first drop and grooves after it", () => {
    const [left] = render({ seconds: 12, cues: [{ t: 5, kind: "drop" }] });
    expect(rms(left, 6, 10)).toBeGreaterThan(rms(left, 1, 4) * 1.5);
  });

  it("drops the kick in a break, and brings it back at the next drop", () => {
    const cues = [
      { t: 1, kind: "drop" },
      { t: 5, kind: "break" },
      { t: 9, kind: "drop" },
    ];
    const [left] = render({ seconds: 13, cues });
    // Low end only: the kick lives under 120 Hz.
    const low = (from: number, to: number) => {
      let y = 0;
      const out = new Float32Array(left.length);
      const k = 1 - Math.exp((-2 * Math.PI * 120) / 48000);
      for (let i = 0; i < left.length; i++) out[i] = y += k * (left[i] - y);
      return rms(out, from, to);
    };
    expect(low(5.5, 8.5)).toBeLessThan(low(1.5, 4.5) * 0.6);
    expect(low(9.5, 12.5)).toBeGreaterThan(low(5.5, 8.5) * 1.5);
  });

  it("is the same every time", () => {
    const cues = [{ t: 0.5, kind: "drop" }];
    const a = render({ seconds: 1, cues })[0];
    const b = render({ seconds: 1, cues })[0];
    expect(Array.from(a.slice(0, 4000))).toEqual(Array.from(b.slice(0, 4000)));
  });
});

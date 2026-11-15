import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { renderScore } from "./calmScore.mjs";

type Cue = { t: number; kind: "lift" | "tick" | "whoosh" | "chime" };
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

describe("renderScore", () => {
  it("renders stereo at 48 kHz for the requested length", () => {
    const [left, right] = render({ seconds: 2, cues: [] });
    expect(left).toHaveLength(96_000);
    expect(right).toHaveLength(96_000);
  });

  it("never clips", () => {
    const channels = render({
      seconds: 4,
      cues: [
        { t: 1, kind: "lift" },
        { t: 1, kind: "tick" },
        { t: 2, kind: "chime" },
        { t: 3, kind: "whoosh" },
      ],
    });
    for (const ch of channels)
      for (const v of ch) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  it("makes a tick audible where it is cued", () => {
    const [left] = render({ seconds: 2, cues: [{ t: 1, kind: "tick" }] });
    expect(rms(left, 0.98, 1.05)).toBeGreaterThan(rms(left, 0.5, 0.57));
  });

  it("is the same every time", () => {
    const a = render({ seconds: 1, cues: [] })[0];
    const b = render({ seconds: 1, cues: [] })[0];
    expect(Array.from(a.slice(0, 2000))).toEqual(Array.from(b.slice(0, 2000)));
  });
});

import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { renderScore } from "./keynoteScore.mjs";
// @ts-expect-error plain ES module without type declarations
import { DURATION, chapter, scoreCues } from "./timelines/keynote.mjs";

type Cue = { t: number; kind: string; note?: number };
const at = (id: string) => chapter(id) as { start: number; end: number };
const cues = (scoreCues as (web: boolean) => Cue[])(true);
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

// Every kind of card sound, each at a note it really plays.
const SOUNDS: Cue[] = [
  { t: 0, kind: "card", note: 72 },
  { t: 0, kind: "mess", note: 70 },
  { t: 0, kind: "snap", note: 76 },
  { t: 0, kind: "stamp", note: 40 },
  { t: 0, kind: "logo", note: 65 },
];

describe("keynote score", () => {
  it("renders stereo at 48 kHz for the requested length", () => {
    const [left, right] = render({ seconds: 2, cues: [] });
    expect(left).toHaveLength(96_000);
    expect(right).toHaveLength(96_000);
  });

  it("never clips over the whole film", () => {
    for (const ch of render({ seconds: DURATION, cues }))
      for (let i = 0; i < ch.length; i += 7)
        expect(Math.abs(ch[i])).toBeLessThanOrEqual(1);
  }, 60_000);

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

  it.each(SOUNDS)(
    "makes a $kind audible on a phone where it is cued",
    ({ kind, note }) => {
      const quiet = smallSpeaker(render({ seconds: 3, cues: [] })[0]);
      const cued = smallSpeaker(
        render({ seconds: 3, cues: [{ t: 2, kind, note }] })[0],
      );
      // Both are normalised, so compare how much louder the cue's moment is
      // than an earlier stretch, with and without the cue.
      const lift = (ch: Float32Array) => rms(ch, 2, 2.3) / rms(ch, 0.6, 0.9);
      expect(lift(cued), kind).toBeGreaterThan(lift(quiet) * 1.25);
    },
  );

  it("stays quiet through the worries and grooves from the first chorus", () => {
    const [left] = render({ seconds: 22, cues });
    const privacy = at("privacy").start;
    expect(rms(left, privacy + 1, privacy + 6)).toBeGreaterThan(
      rms(left, 1, 6) * 1.5,
    );
  }, 30_000);

  it("drops the kick for the big screens, and brings it back for the devices", () => {
    const [left] = render({ seconds: DURATION, cues });
    // Low end only: the kick lives under 120 Hz.
    let y = 0;
    const low = new Float32Array(left.length);
    const k = 1 - Math.exp((-2 * Math.PI * 120) / 48000);
    for (let i = 0; i < left.length; i++) low[i] = y += k * (left[i] - y);
    const big = at("bigScreens");
    const before = at("ai");
    const after = at("devices");
    const inBreak = rms(low, big.start + 1, big.end - 1);
    expect(inBreak).toBeLessThan(rms(low, before.start, before.end) * 0.6);
    expect(rms(low, after.start + 0.5, after.end)).toBeGreaterThan(
      inBreak * 1.5,
    );
  }, 60_000);

  it("builds to the finale: its busiest and loudest stretch", () => {
    const [left] = render({ seconds: DURATION, cues });
    // Above ~5 kHz: hats, claps, crashes and rolls, the sound of "busy".
    let x1 = 0;
    let y = 0;
    const k = Math.exp((-2 * Math.PI * 5000) / 48000);
    const high = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      y = k * (y + left[i] - x1);
      x1 = left[i];
      high[i] = y;
    }
    const finale = at("montage");
    for (const id of ["privacy", "search", "budgets", "open"]) {
      const c = at(id);
      expect(rms(left, finale.start, finale.end), id).toBeGreaterThan(
        rms(left, c.start, c.end),
      );
      expect(rms(high, finale.start, finale.end), id).toBeGreaterThan(
        rms(high, c.start, c.end),
      );
    }
  }, 60_000);

  it("is the same every time", () => {
    const a = render({ seconds: 1, cues: SOUNDS })[0];
    const b = render({ seconds: 1, cues: SOUNDS })[0];
    expect(Array.from(a.slice(0, 4000))).toEqual(Array.from(b.slice(0, 4000)));
  });
});

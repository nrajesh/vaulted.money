import { describe, expect, it } from "vitest";
import {
  CHAPTERS,
  COPY,
  DURATION,
  TAGLINE,
  moments,
  // @ts-expect-error plain ES module without type declarations
} from "./timeline.mjs";
// @ts-expect-error plain ES module without type declarations
import { findAntiGoals } from "../../shared/antiGoals.mjs";

type Chapter = { id: string; start: number; end: number };
const chapters = Object.values(CHAPTERS) as Chapter[];
const M = moments(28);

describe("vault film timeline", () => {
  it("is sixty seconds, with chapters back to back", () => {
    expect(DURATION).toBeCloseTo(60, 6);
    expect(chapters[0].start).toBe(0);
    for (let i = 1; i < chapters.length; i++)
      expect(chapters[i].start).toBeCloseTo(chapters[i - 1].end, 6);
  });

  it("never runs three beats of the same length in a row", () => {
    const lengths = chapters.map((c) => +(c.end - c.start).toFixed(3));
    for (let i = 2; i < lengths.length; i++)
      expect(new Set(lengths.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
  });

  it("answers after it asks: keys, then what was understood, then the result", () => {
    expect(M.askKeys[0]).toBeGreaterThan(CHAPTERS.ask.start);
    expect(M.askKeys.at(-1)).toBeLessThan(M.askUnderstood);
    expect(M.askUnderstood).toBeLessThan(M.askApply);
    expect(M.askApply).toBeLessThan(M.askResult);
    // The result stays up for at least two seconds.
    expect(CHAPTERS.ask.end - M.askResult).toBeGreaterThan(2);
  });

  it("types the offline search only after the network is shown off", () => {
    expect(M.offlineKeys[0]).toBeGreaterThan(M.dark + 0.5);
    expect(M.offlineResult).toBeLessThan(M.onlyYou);
    expect(M.proof.at(-1)).toBeLessThan(CHAPTERS.only.end - 1);
  });

  it("keeps headlines to six words and the claims honest", () => {
    for (const line of [
      COPY.worry,
      COPY.where,
      COPY.ask,
      COPY.track,
      COPY.ahead,
      COPY.who,
      COPY.only,
      COPY.devices,
    ])
      expect(line.split(" ").length).toBeLessThanOrEqual(6);
    const words = [...Object.values(COPY).flat(), TAGLINE].join(" ");
    // No "never leaves your device" without the AI line beside it.
    expect(words).not.toMatch(/never leaves/i);
    expect(COPY.proof.join(" ")).toMatch(/AI off until you switch it on/);
    expect(findAntiGoals(words, "mac")).toEqual([]);
  });

  it("signs off with the one tagline", () => {
    expect(TAGLINE).toBe("You see everything. We see nothing.");
  });
});

import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { CHAPTERS, DURATION } from "./timeline.mjs";

type Chapter = { id: string; start: number; end: number };
const chapters = CHAPTERS as Chapter[];

describe("social cut timeline", () => {
  it("runs its chapters back to back, in order, to the end of the film", () => {
    expect(chapters[0].start).toBe(0);
    for (let i = 1; i < chapters.length; i++)
      expect(chapters[i].start).toBeCloseTo(chapters[i - 1].end, 6);
    expect(chapters.at(-1)?.end).toBeCloseTo(DURATION, 6);
  });

  it("stays about fifty seconds long", () => {
    expect(DURATION).toBeGreaterThan(45);
    expect(DURATION).toBeLessThan(55);
  });
});

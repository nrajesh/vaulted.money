import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { CARD_SECONDS, CHAPTERS, chapterTimeline } from "./captions.mjs";

type Card = { start: number; end: number; headline: string; sub?: string };
const timeline = chapterTimeline as (scenes: number[], story: number) => Card[];
const scenes = [0, 4.7, 13.4, 18.6, 21.9];

describe("chapterTimeline", () => {
  const cards = timeline(scenes, 25);

  it("puts one card on each cut, but none on the opening scene", () => {
    expect(cards).toHaveLength(CHAPTERS.filter(Boolean).length);
    expect(cards[0].start).toBe(4.7);
    expect(cards.map((c) => c.headline)).not.toContain(undefined);
  });

  it("keeps each card short and inside the story", () => {
    for (const c of cards) {
      expect(c.end - c.start).toBeLessThanOrEqual(CARD_SECONDS + 0.001);
      expect(c.end).toBeLessThanOrEqual(25);
    }
  });

  it("skips chapters the recording never reached", () => {
    expect(timeline([0, 4.7], 10)).toHaveLength(1);
  });
});

describe("calmScoreCues", () => {
  it("lifts the music at the search and taps on each chapter", async () => {
    // @ts-expect-error plain ES module without type declarations
    const { calmScoreCues } = await import("./cues.mjs");
    const cues = calmScoreCues(scenes, 25) as { t: number; kind: string }[];
    expect(cues.filter((c) => c.kind === "lift").map((c) => c.t)).toEqual([
      4.7,
    ]);
    expect(cues.filter((c) => c.kind === "tick")).toHaveLength(4);
    for (const c of cues) {
      expect(c.t).toBeGreaterThanOrEqual(0);
      expect(c.t).toBeLessThanOrEqual(25);
    }
  });
});

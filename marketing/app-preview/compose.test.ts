import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { SEGMENTS, captionTimeline } from "./captions.mjs";
import en from "../shared/strings/en.json";

type Caption = { start: number; end: number; headline: string; sub?: string };
const timeline = captionTimeline as (
  strings: object,
  segments: typeof SEGMENTS,
  storySeconds: number,
) => Caption[];

describe("captionTimeline", () => {
  const captions = timeline(en, SEGMENTS, 23.7);

  it("has one caption per screen of the story, in order, without overlaps", () => {
    expect(captions).toHaveLength(5);
    for (let i = 1; i < captions.length; i++)
      expect(captions[i].start).toBeGreaterThanOrEqual(captions[i - 1].end);
  });

  it("fits inside the story and Apple's 30 seconds", () => {
    expect(captions[0].start).toBeGreaterThanOrEqual(0);
    expect(captions.at(-1)!.end).toBeLessThanOrEqual(23.7);
    expect(captions.at(-1)!.end).toBeLessThanOrEqual(30);
  });

  it("shows plain headline text (no accent markers)", () => {
    expect(captions[1].headline).toBe("Ask it like you'd say it.");
  });

  it("stretches to the measured length of the story", () => {
    const longer = timeline(en, SEGMENTS, 28);
    expect(longer.at(-1)!.end).toBeGreaterThan(captions.at(-1)!.end);
  });
});

describe("calmScoreCues", () => {
  it("lifts the music at the search and taps on each touch", async () => {
    // @ts-expect-error plain ES module without type declarations
    const { calmScoreCues } = await import("./cues.mjs");
    const cues = calmScoreCues(SEGMENTS, 23.7) as { t: number; kind: string }[];
    const search = timeline(en, SEGMENTS, 23.7)[1].start;
    expect(cues.filter((c) => c.kind === "lift").map((c) => c.t)).toEqual([
      search,
    ]);
    expect(cues.filter((c) => c.kind === "tick")).toHaveLength(3);
    for (const c of cues) {
      expect(c.t).toBeGreaterThanOrEqual(0);
      expect(c.t).toBeLessThanOrEqual(23.7);
    }
  });
});

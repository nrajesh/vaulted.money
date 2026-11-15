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

describe("keynote cut timeline", () => {
  it("runs 70–80 s with chapters back to back, each at least 5 s", async () => {
    // @ts-expect-error plain ES module without type declarations
    const keynote = await import("./timelines/keynote.mjs");
    const list = keynote.CHAPTERS as Chapter[];
    expect(keynote.DURATION).toBeGreaterThanOrEqual(70);
    expect(keynote.DURATION).toBeLessThanOrEqual(80);
    expect(list[0].start).toBe(0);
    for (let i = 1; i < list.length; i++)
      expect(list[i].start).toBeCloseTo(list[i - 1].end, 6);
    expect(list.at(-1)?.end).toBeCloseTo(keynote.DURATION, 6);
    for (const c of list) expect(c.end - c.start).toBeGreaterThanOrEqual(5);
  });

  it("gives the music a lift at privacy, the device reveal and the end", async () => {
    // @ts-expect-error plain ES module without type declarations
    const keynote = await import("./timelines/keynote.mjs");
    const lifts = (keynote.SCORE_CUES as { t: number; kind: string }[])
      .filter((c) => c.kind === "lift")
      .map((c) => c.t);
    const at = (id: string) =>
      (keynote.CHAPTERS as Chapter[]).find((c) => c.id === id)!.start;
    expect(lifts).toEqual([at("privacy"), at("devices"), at("end")]);
  });
});

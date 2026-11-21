import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { SETS } from "./sets.mjs";

type Set = {
  width: number;
  height: number;
  shots: number[];
  store: "apple" | "play" | "mac";
};
const sets = SETS as Record<string, Set>;

describe("store screenshot sets", () => {
  it("uses the exact pixel sizes each store asks for", () => {
    const sizes = Object.fromEntries(
      Object.entries(sets).map(([id, s]) => [id, [s.width, s.height]]),
    );
    expect(sizes).toEqual({
      iphone69: [1320, 2868],
      ipad13: [2064, 2752],
      duoInner: [2007, 2853],
      duoOuter: [1398, 2034],
      playPhone: [1080, 1920],
      playTablet7: [1200, 1920],
      playTablet10: [1600, 2560],
      playFeature: [1024, 500],
      mac: [2880, 1800],
    });
  });

  it("shows the big-screen shot only where there is a big screen", () => {
    // Shot 7 (Calendar) follows on every phone and tablet.
    expect(sets.iphone69.shots).toEqual([1, 2, 3, 4, 5, 7]);
    expect(sets.duoOuter.shots).toEqual([1, 2, 3, 4, 5, 7]);
    expect(sets.playPhone.shots).toEqual([1, 2, 3, 4, 5, 7]);
    expect(sets.ipad13.shots).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sets.duoInner.shots).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sets.mac.shots).toEqual([1, 2, 6]);
  });

  it("labels each set with its store", () => {
    for (const id of [
      "playPhone",
      "playTablet7",
      "playTablet10",
      "playFeature",
    ])
      expect(sets[id].store).toBe("play");
    for (const id of ["iphone69", "ipad13", "duoInner", "duoOuter"])
      expect(sets[id].store).toBe("apple");
    expect(sets.mac.store).toBe("mac");
  });

  it("keeps Play screenshots within a 2:1 aspect ratio", () => {
    for (const id of ["playPhone", "playTablet7", "playTablet10"]) {
      const { width, height } = sets[id];
      expect(
        Math.max(width, height) / Math.min(width, height),
      ).toBeLessThanOrEqual(2);
    }
  });
});

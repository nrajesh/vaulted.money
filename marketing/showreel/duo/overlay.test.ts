import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { duoWindow } from "./overlay.mjs";

describe("duoWindow", () => {
  it("covers the Duo's screen once it has unfolded, until it leaves", () => {
    const w = duoWindow(1);
    // keynote.mjs: Duo at x 960, y 300, 860 wide, 12 px bezel.
    expect(w).toMatchObject({ x: 972, y: 312, width: 836, height: 614 });
    // bigScreens starts at 48 s; the Duo comes in at 51 s and is still by
    // 52.2 s (no flip), leaving from 56.3 s: about four seconds of footage.
    expect(w.from).toBeCloseTo(52.2, 3);
    expect(w.to).toBeCloseTo(56.3, 3);
  });

  it("rounds the footage to the screen's corners", () => {
    expect(duoWindow(1).radius).toBe(40);
    expect(duoWindow(2).radius).toBe(80);
  });

  it("scales with the 4K render", () => {
    expect(duoWindow(2)).toMatchObject({
      x: 1944,
      y: 624,
      width: 1672,
      height: 1228,
    });
  });
});

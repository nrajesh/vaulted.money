import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { screenWindows } from "./overlay.mjs";
// @ts-expect-error plain ES module without type declarations
import { HANDOVER, chapter } from "../timelines/keynote.mjs";

const big = chapter("bigScreens") as { start: number; end: number };

describe("screenWindows", () => {
  it("covers the iPad's screen while it is still, until the hand-over", () => {
    const { ipad } = screenWindows(1);
    // keynote.mjs: iPad at x 1100, y 140, 560 wide, 16 px bezel.
    expect(ipad).toMatchObject({ x: 1116, y: 156, width: 528, height: 704 });
    // The iPad is still 1.4 s into "Big screens" and hands over to the Duo
    // six beats in: about two seconds of its short clip.
    expect(ipad.from).toBeCloseTo(big.start + 1.4, 3);
    expect(ipad.to).toBeCloseTo(big.start + HANDOVER, 3);
  });

  it("covers the Duo's screen once it is still, until it leaves", () => {
    const { duo } = screenWindows(1);
    expect(duo).toMatchObject({ x: 972, y: 312, width: 836, height: 614 });
    // Still 1.2 s after the hand-over, until it leaves.
    expect(duo.from).toBeCloseTo(big.start + HANDOVER + 1.2, 3);
    expect(duo.to).toBeCloseTo(big.end - 0.7, 3);
    expect(duo.to - duo.from).toBeGreaterThanOrEqual(3.5);
  });

  it("rounds the footage to each screen's corners", () => {
    expect(screenWindows(1).ipad.radius).toBe(26);
    expect(screenWindows(1).duo.radius).toBe(40);
    expect(screenWindows(2).duo.radius).toBe(80);
  });

  it("scales with the 4K render", () => {
    expect(screenWindows(2).duo).toMatchObject({
      x: 1944,
      y: 624,
      width: 1672,
      height: 1228,
    });
  });
});

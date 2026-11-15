import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { screenWindows } from "./overlay.mjs";

describe("screenWindows", () => {
  it("covers the iPad's screen while it is still, until the hand-over", () => {
    const { ipad } = screenWindows(1);
    // keynote.mjs: iPad at x 1100, y 140, 560 wide, 16 px bezel.
    expect(ipad).toMatchObject({ x: 1116, y: 156, width: 528, height: 704 });
    // bigScreens runs 48–59 s; the iPad is still from 49.4 s and hands over
    // to the Duo at 53 s: about three and a half seconds of footage.
    expect(ipad.from).toBeCloseTo(49.4, 3);
    expect(ipad.to).toBeCloseTo(53, 3);
  });

  it("covers the Duo's screen once it is still, until it leaves", () => {
    const { duo } = screenWindows(1);
    expect(duo).toMatchObject({ x: 972, y: 312, width: 836, height: 614 });
    expect(duo.from).toBeCloseTo(54.2, 3);
    expect(duo.to).toBeCloseTo(58.3, 3);
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

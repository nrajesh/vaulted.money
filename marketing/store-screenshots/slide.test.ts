import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { buildSlide, fitHeadline, headlineToHtml } from "./slide.mjs";
import en from "../shared/strings/en.json";

type Device = {
  image: string;
  theme: "dark" | "light";
  transform: "straight" | "faceLeft" | "faceRight" | "sideways";
  visibleFraction: number;
};
type Slide = {
  width: number;
  height: number;
  page: "dark" | "light";
  headlineHtml: string;
  sub?: string;
  body: string;
  callouts: string[];
  devices: Device[];
  statusBar: { time: string; network: string };
};
const slide = buildSlide as (
  set: string,
  id: number,
  strings: object,
  crops?: Record<string, number>,
) => Slide;

describe("buildSlide", () => {
  it("makes shot 1 a face-off of a dark and a light phone", () => {
    const { devices, page } = slide("iphone69", 1, en);
    expect(page).toBe("dark");
    expect(devices.map((d) => [d.transform, d.theme])).toEqual([
      ["faceLeft", "dark"],
      ["faceRight", "light"],
    ]);
  });

  it("puts the dark app on a light page and the other way round", () => {
    const two = slide("iphone69", 2, en);
    expect(two.page).toBe("light");
    expect(two.devices[0].theme).toBe("dark");
    const three = slide("iphone69", 3, en);
    expect(three.page).toBe("dark");
    expect(three.devices[0].theme).toBe("light");
  });

  it("uses the set's exact size", () => {
    expect(slide("ipad13", 6, en).width).toBe(2064);
    expect(slide("ipad13", 6, en).height).toBe(2752);
  });

  it("gives shot 4 its callouts and crops its screen above the agent card", () => {
    const four = slide("iphone69", 4, en);
    expect(four.callouts).toEqual([
      "Agents may need a second device",
      "Local AI keeps data off the cloud",
    ]);
    expect(four.devices[0].visibleFraction).toBe(0.7);
    // The capture measures where the agent card's title ends on each device.
    const measured = slide("iphone69", 4, en, { "iphone-dark-4.png": 0.62 });
    expect(measured.devices[0].visibleFraction).toBe(0.62);
    expect(slide("iphone69", 3, en).devices[0].visibleFraction).toBe(1);
  });

  it("turns small tablets sideways for the two-panel shot", () => {
    expect(slide("duoInner", 6, en).devices[0].transform).toBe("sideways");
    expect(slide("ipad13", 6, en).devices[0].transform).toBe("straight");
  });

  it("points each device at its capture file", () => {
    expect(slide("playPhone", 2, en).devices[0].image).toBe(
      "android-dark-2.png",
    );
  });

  it("draws a 9:41 / 5G status bar", () => {
    expect(slide("iphone69", 2, en).statusBar).toEqual({
      time: "9:41",
      network: "5G",
    });
  });
});

describe("headlineToHtml", () => {
  it("marks accent words and escapes HTML", () => {
    expect(headlineToHtml("See where it *really* goes.")).toBe(
      "See where it <em>really</em> goes.",
    );
    expect(headlineToHtml("A <b> & *c*")).toBe("A &lt;b&gt; &amp; <em>c</em>");
  });
});

describe("fitHeadline", () => {
  const measure = (text: string, px: number) => text.length * px * 0.5;
  it("shrinks a long headline to fit, never above the start size", () => {
    const short = fitHeadline("Ask it like you'd say it.", 400, 60, measure);
    const long = fitHeadline(
      "Verwacht een melding voordat je je budget overschrijdt deze maand.",
      400,
      60,
      measure,
    );
    expect(short).toBeLessThanOrEqual(60);
    expect(long).toBeLessThan(short);
  });

  it("fits every line it produces within the width", () => {
    const px = fitHeadline(
      "Supercalifragilistic words everywhere",
      300,
      80,
      measure,
    );
    expect(measure("Supercalifragilistic", px)).toBeLessThanOrEqual(300);
  });
});

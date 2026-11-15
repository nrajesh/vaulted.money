import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { findAntiGoals } from "./antiGoals.mjs";

const check = findAntiGoals as (
  text: string,
  store: "apple" | "play" | "mac",
) => string[];

describe("findAntiGoals", () => {
  it("rejects an unbounded runway", () => {
    expect(check("Runway Infinite", "apple").join()).toContain("Infinite");
  });

  it("rejects a minus sign after the currency symbol", () => {
    expect(check("Spent €-1,380.00", "apple").join()).toContain("€-");
  });

  it("rejects the empty selection bar", () => {
    expect(check("0 selected", "apple")).not.toHaveLength(0);
  });

  it("rejects Apple names in Google Play images only", () => {
    expect(check("Needs the Mac app.", "play")).not.toHaveLength(0);
    expect(check("Needs the Mac app.", "apple")).toHaveLength(0);
  });

  it("rejects other platforms in Apple images", () => {
    expect(check("Works on Android", "apple")).not.toHaveLength(0);
    expect(check("Get it on Google Play", "apple")).not.toHaveLength(0);
  });

  it("rejects a screen without demo data", () => {
    expect(check("No ledgers yet", "apple")).not.toHaveLength(0);
  });

  it("rejects free or price wording in store images", () => {
    expect(check("Free & open source", "apple")).not.toHaveLength(0);
    expect(check("Free & open source", "play")).not.toHaveLength(0);
  });

  it("accepts a normal screen", () => {
    expect(check("Groceries €52.10", "apple")).toHaveLength(0);
    expect(check("Spent -€1,380.00", "play")).toHaveLength(0);
  });
});

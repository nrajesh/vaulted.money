import { describe, expect, it } from "vitest";
import {
  BADGES,
  CHAPTERS,
  COPY,
  DURATION,
  FEATURES,
  TAGLINE,
  moments,
  // @ts-expect-error plain ES module without type declarations
} from "./timeline.mjs";
// @ts-expect-error plain ES module without type declarations
import { DEVICES } from "./capture.devices.mjs";
// @ts-expect-error plain ES module without type declarations
import { findAntiGoals } from "../../shared/antiGoals.mjs";

type Chapter = { id: string; start: number; end: number };
type Feature = { id: string; device: string; label: string; headline: string };
const chapters = Object.values(CHAPTERS) as Chapter[];
const features = FEATURES as Feature[];
const M = moments(28);

describe("vault film timeline", () => {
  it("is under fifty seconds, with chapters back to back", () => {
    expect(DURATION).toBeGreaterThan(40);
    expect(DURATION).toBeLessThan(50);
    expect(chapters[0].start).toBe(0);
    for (let i = 1; i < chapters.length; i++)
      expect(chapters[i].start).toBeCloseTo(chapters[i - 1].end, 6);
  });

  it("never runs three beats of the same length in a row, and none drags", () => {
    const lengths = chapters.map((c) => +(c.end - c.start).toFixed(3));
    for (let i = 2; i < lengths.length; i++)
      expect(new Set(lengths.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    for (const length of lengths) expect(length).toBeLessThan(9);
  });

  it("gives every device a feature, and every feature a device", () => {
    const used = new Set(features.map((f) => f.device));
    for (const feature of features) {
      expect(DEVICES[feature.device], feature.device).toBeDefined();
      expect(CHAPTERS[feature.id], feature.id).toBeDefined();
    }
    // The folded Duo is the same device as the Duo, before it opens.
    for (const device of Object.keys(DEVICES))
      if (device !== "duoFolded") expect(used.has(device), device).toBe(true);
    // An AI feature is among them, and says it is the user's choice.
    expect(features.some((f) => /AI/.test(f.headline))).toBe(true);
  });

  it("opens the Duo and flips the charts inside their own beats", () => {
    expect(M.unfold).toBeGreaterThan(CHAPTERS.flow.start + 1);
    expect(CHAPTERS.flow.end - M.unfold).toBeGreaterThan(3);
    expect(M.chartBars).toBeGreaterThan(CHAPTERS.charts.start);
    expect(M.chartRing).toBeGreaterThan(M.chartBars + 1);
    expect(M.chartRing).toBeLessThan(CHAPTERS.charts.end - 1);
    expect(M.aiOn).toBeGreaterThan(CHAPTERS.ai.start + 1);
  });

  it("types the search once: keys, then what was understood, then the result", () => {
    expect(M.askKeys[0]).toBeGreaterThan(CHAPTERS.ask.start);
    expect(M.askKeys.at(-1)).toBeLessThan(M.askUnderstood);
    expect(M.askUnderstood).toBeLessThan(M.askApply);
    expect(M.askApply).toBeLessThan(M.askResult);
    // The result stays up for at least two seconds.
    expect(CHAPTERS.ask.end - M.askResult).toBeGreaterThan(2);
  });

  it("keeps headlines short and the claims honest", () => {
    const headlines = [
      COPY.worry,
      COPY.everywhere,
      ...features.map((f) => f.headline),
    ];
    for (const line of headlines)
      expect(line.split(" ").length, line).toBeLessThanOrEqual(6);
    const words = [...headlines, ...COPY.proof, TAGLINE, ...BADGES].join(" ");
    // No "never leaves your device" without the AI line beside it.
    expect(words).not.toMatch(/never leaves/i);
    expect(COPY.proof.join(" ")).toMatch(/AI off until you switch it on/);
    // The line-up names every platform, so only the website rules apply.
    expect(findAntiGoals(words, "mac")).toEqual([]);
  });

  it("signs off with the one slogan", () => {
    expect(TAGLINE).toBe("Private Vault. Open Code.");
  });
});

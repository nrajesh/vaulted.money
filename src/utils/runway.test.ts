import { describe, expect, it } from "vitest";
import {
  isDiscretionary,
  isScheduleActive,
  monthlyOccurrences,
} from "./runway";

describe("monthlyOccurrences", () => {
  it("does not count one-time schedules as recurring", () => {
    expect(monthlyOccurrences("One-time")).toBe(0);
  });

  it("normalises the named frequencies", () => {
    expect(monthlyOccurrences("Monthly")).toBe(1);
    expect(monthlyOccurrences("Yearly")).toBeCloseTo(1 / 12);
    expect(monthlyOccurrences("Weekly")).toBeCloseTo(4.333, 2);
    expect(monthlyOccurrences("Daily")).toBeCloseTo(30.42, 1);
  });

  it("honours custom intervals instead of treating them as monthly", () => {
    expect(monthlyOccurrences("2w")).toBeCloseTo(2.167, 2);
    expect(monthlyOccurrences("3m")).toBeCloseTo(1 / 3);
    expect(monthlyOccurrences("2y")).toBeCloseTo(1 / 24);
    expect(monthlyOccurrences("10d")).toBeCloseTo(3.04, 1);
  });

  it("falls back to monthly for unknown values and never divides by zero", () => {
    expect(monthlyOccurrences("fortnightly")).toBe(1);
    expect(monthlyOccurrences(undefined)).toBe(1);
    expect(Number.isFinite(monthlyOccurrences("0w"))).toBe(true);
  });
});

describe("isScheduleActive", () => {
  const today = new Date("2026-06-15T00:00:00Z");
  it("drops schedules that have ended", () => {
    expect(isScheduleActive("2026-01-01", today)).toBe(false);
    expect(isScheduleActive("2026-12-31", today)).toBe(true);
    expect(isScheduleActive(null, today)).toBe(true);
  });
});

describe("isDiscretionary", () => {
  it("excludes transfers and schedule-generated transactions", () => {
    expect(isDiscretionary({ category: "Transfer" })).toBe(false);
    expect(isDiscretionary({ category: " transfer " })).toBe(false);
    expect(isDiscretionary({ category: "Food", transfer_id: "t1" })).toBe(
      false,
    );
    expect(
      isDiscretionary({ category: "Food", is_scheduled_origin: true }),
    ).toBe(false);
    expect(isDiscretionary({ category: "Food" })).toBe(true);
  });
});

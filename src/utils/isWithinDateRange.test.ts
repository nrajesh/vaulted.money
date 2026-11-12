import { describe, expect, it } from "vitest";
import { isWithinDateRange } from "./searchFilters";

// The search box gives dates at noon; transactions are stored at day start.
const noon = (y: number, m: number, d: number) => new Date(y, m, d, 12);
const dayStart = (y: number, m: number, d: number) =>
  new Date(y, m, d, 0, 30).toISOString();

describe("isWithinDateRange", () => {
  it('shows a transaction saved today when the filter is "today"', () => {
    const today = noon(2026, 10, 12);
    expect(
      isWithinDateRange(dayStart(2026, 10, 12), { from: today, to: today }),
    ).toBe(true);
  });

  it("counts whole days at both ends", () => {
    const range = { from: noon(2026, 10, 10), to: noon(2026, 10, 12) };
    expect(isWithinDateRange(dayStart(2026, 10, 10), range)).toBe(true);
    expect(
      isWithinDateRange(new Date(2026, 10, 12, 23, 30).toISOString(), range),
    ).toBe(true);
    expect(isWithinDateRange(dayStart(2026, 10, 9), range)).toBe(false);
    expect(isWithinDateRange(dayStart(2026, 10, 13), range)).toBe(false);
  });

  it("runs an open-ended range to the end of today, and does not change the range it is given", () => {
    const from = noon(2026, 10, 1);
    const now = new Date(2026, 10, 12, 9);
    expect(isWithinDateRange(dayStart(2026, 10, 12), { from }, now)).toBe(true);
    expect(isWithinDateRange(dayStart(2026, 10, 13), { from }, now)).toBe(
      false,
    );
    expect(from.getHours()).toBe(12);
  });

  it("lets everything through when no start is set", () => {
    expect(isWithinDateRange(dayStart(2020, 0, 1), {})).toBe(true);
  });
});

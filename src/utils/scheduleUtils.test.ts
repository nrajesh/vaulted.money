import { describe, expect, it } from "vitest";
import { hasScheduleEnded } from "./scheduleUtils";

describe("hasScheduleEnded", () => {
  it("never ends without an end date", () => {
    expect(hasScheduleEnded(null, new Date(2030, 0, 1))).toBe(false);
    expect(hasScheduleEnded(undefined, new Date(2030, 0, 1))).toBe(false);
  });

  it("still runs on the end date itself", () => {
    const end = new Date(2026, 5, 10, 12).toISOString();
    expect(hasScheduleEnded(end, new Date(2026, 5, 10, 0, 0, 0))).toBe(false);
  });

  it("stops after the end date", () => {
    const end = new Date(2026, 5, 10, 12).toISOString();
    expect(hasScheduleEnded(end, new Date(2026, 5, 11, 0, 0, 0))).toBe(true);
  });

  it("ignores an unreadable end date rather than blocking the schedule", () => {
    expect(hasScheduleEnded("not a date", new Date())).toBe(false);
  });
});

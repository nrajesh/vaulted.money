import { describe, expect, it } from "vitest";
import { formatDisplayDate } from "./dateFormat";

describe("formatDisplayDate", () => {
  const date = new Date(2026, 9, 28, 12);

  it("names the month in the app language", () => {
    expect(formatDisplayDate(date, "en")).toBe("Oct 28, 2026");
    expect(formatDisplayDate(date, "es")).toMatch(/28.*oct.*2026/i);
    expect(formatDisplayDate(date, "nl")).toMatch(/28.*okt.*2026/i);
  });

  it("accepts ISO strings and survives bad input", () => {
    expect(formatDisplayDate(date.toISOString(), "en")).toBe("Oct 28, 2026");
    expect(formatDisplayDate("not a date", "en")).toBe("");
  });

  it("falls back for a custom language code the browser does not know", () => {
    expect(formatDisplayDate(date, "zz-invalid-code-!!")).toMatch(/2026/);
  });
});

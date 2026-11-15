import { beforeEach, describe, expect, it } from "vitest";
import {
  SPLIT_MIN_WIDTH,
  TABLE_DEFAULT_WIDTH,
  pickTransactionLayout,
  readLayoutPreference,
  storeLayoutPreference,
} from "./transactionLayout";

describe("pickTransactionLayout", () => {
  it("keeps the responsive table before the area is measured", () => {
    expect(pickTransactionLayout(0, null)).toBe("table");
  });

  it("stacks cards on phone widths, whatever the preference", () => {
    // iPhone Duo folded: 466pt minus the 84pt status bar.
    expect(pickTransactionLayout(382, null)).toBe("stacked");
    expect(pickTransactionLayout(SPLIT_MIN_WIDTH - 1, "table")).toBe("stacked");
  });

  it("splits by default when two phone-width columns fit", () => {
    // iPhone Duo unfolded, landscape: roughly 770px for the list area.
    expect(pickTransactionLayout(770, null)).toBe("split");
    expect(pickTransactionLayout(SPLIT_MIN_WIDTH, null)).toBe("split");
  });

  it("shows the full table by default on wide screens", () => {
    expect(pickTransactionLayout(TABLE_DEFAULT_WIDTH, null)).toBe("table");
    expect(pickTransactionLayout(1400, null)).toBe("table");
  });

  it("follows the person's choice whenever both layouts fit", () => {
    expect(pickTransactionLayout(1400, "split")).toBe("split");
    expect(pickTransactionLayout(800, "table")).toBe("table");
  });
});

describe("layout preference", () => {
  beforeEach(() => localStorage.clear());

  it("is remembered, and ignores unknown values", () => {
    expect(readLayoutPreference()).toBeNull();
    storeLayoutPreference("split");
    expect(readLayoutPreference()).toBe("split");
    localStorage.setItem("transactions.layout", "grid");
    expect(readLayoutPreference()).toBeNull();
  });
});

describe("firstListedTransaction", () => {
  it("picks the first card the list shows: the latest date, upcoming ones included", async () => {
    const { firstListedTransaction } = await import("./transactionLayout");
    const pick = firstListedTransaction([
      { id: "past", date: "2026-11-20T00:00:00.000Z" },
      { id: "upcoming", date: "2026-11-29T00:00:00.000Z", is_projected: true },
      { id: "older", date: "2026-11-02T00:00:00.000Z" },
    ]);
    expect(pick?.id).toBe("upcoming");
  });

  it("is empty for an empty list", async () => {
    const { firstListedTransaction } = await import("./transactionLayout");
    expect(firstListedTransaction([])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { duplicateTransactionPayload } from "./duplicateTransaction";
import type { Transaction } from "@/types/dataProvider";

const base: Transaction = {
  id: "t1",
  user_id: "ledger-1",
  date: "2026-11-01T00:00:00.000Z",
  amount: -42.5,
  currency: "EUR",
  account: "Checking",
  vendor: "Albert Heijn",
  category: "Groceries",
  created_at: "2026-11-01T00:00:00.000Z",
  recurrence_id: "r1",
  recurrence_frequency: "monthly",
  is_projected: true,
};

describe("duplicateTransactionPayload", () => {
  it("drops the id, schedule link and projection flags", () => {
    const copy = duplicateTransactionPayload({ ...base, remarks: "Weekly" });
    expect(copy).not.toHaveProperty("id");
    expect(copy).not.toHaveProperty("created_at");
    expect(copy.recurrence_id).toBeUndefined();
    expect(copy.recurrence_frequency).toBeUndefined();
    expect(copy.is_projected).toBeUndefined();
    expect(copy.amount).toBe(-42.5);
    expect(copy.remarks).toBe("Weekly (Copy)");
  });

  it("does not write 'null (Copy)' when there are no notes", () => {
    expect(duplicateTransactionPayload(base).remarks).toBe("(Copy)");
    expect(
      duplicateTransactionPayload({ ...base, remarks: null }).remarks,
    ).toBe("(Copy)");
  });
});

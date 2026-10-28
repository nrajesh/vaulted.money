import { describe, it, expect } from "vitest";
import { calculateGoalProgress } from "./useGoalProgress";
import type { Budget } from "@/types/dataProvider";
import type { Transaction } from "@/data/finance-data";

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "b1",
    user_id: "u1",
    category_id: "cat1",
    category_name: "Savings",
    target_amount: 1000,
    spent_amount: 0,
    currency: "USD",
    start_date: "2026-01-01T00:00:00.000Z",
    end_date: null,
    frequency: "Monthly",
    is_goal: true,
    ...overrides,
  };
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    user_id: "u1",
    date: "2026-01-15T00:00:00.000Z",
    amount: 100,
    currency: "USD",
    account: "Savings Account",
    vendor: "Self",
    category: "Savings",
    created_at: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("calculateGoalProgress", () => {
  it("returns defaults for non-goal budgets", () => {
    const budget = makeBudget({ is_goal: false });
    const result = calculateGoalProgress(budget, [], []);
    expect(result.accumulatedAmount).toBe(0);
    expect(result.progressPercentage).toBe(0);
    expect(result.isOnTrack).toBe(true);
    expect(result.monthlyContribution).toBeNull();
  });

  it("returns zero progress with no matching transactions", () => {
    const budget = makeBudget();
    const result = calculateGoalProgress(budget, [], []);
    expect(result.accumulatedAmount).toBe(0);
    expect(result.progressPercentage).toBe(0);
  });

  it("sums matching transactions after start date", () => {
    const budget = makeBudget({
      category_name: "Savings",
      budget_scope: "category",
    });
    const txs = [
      makeTx({
        id: "t1",
        amount: 200,
        category: "Savings",
        date: "2026-01-10T00:00:00.000Z",
      }),
      makeTx({
        id: "t2",
        amount: 300,
        category: "Savings",
        date: "2026-01-20T00:00:00.000Z",
      }),
    ];
    const result = calculateGoalProgress(budget, txs, []);
    expect(result.accumulatedAmount).toBe(500);
    expect(result.progressPercentage).toBe(50);
  });

  it("ignores transactions before start date", () => {
    const budget = makeBudget({
      category_name: "Savings",
      start_date: "2026-02-01T00:00:00.000Z",
    });
    const txs = [
      makeTx({
        id: "t1",
        amount: 500,
        category: "Savings",
        date: "2026-01-15T00:00:00.000Z",
      }),
    ];
    const result = calculateGoalProgress(budget, txs, []);
    expect(result.accumulatedAmount).toBe(0);
  });

  it("filters by account scope", () => {
    const budget = makeBudget({
      budget_scope: "account",
      budget_scope_name: "My Savings",
    });
    const txs = [
      makeTx({
        id: "t1",
        amount: 100,
        account: "My Savings",
        category: "Other",
      }),
      makeTx({ id: "t2", amount: 200, account: "Checking", category: "Other" }),
    ];
    const result = calculateGoalProgress(budget, txs, []);
    expect(result.accumulatedAmount).toBe(100);
  });

  it("filters by sub-category scope", () => {
    const budget = makeBudget({
      budget_scope: "sub_category",
      budget_scope_name: "Vacation Fund",
    });
    const txs = [
      makeTx({
        id: "t1",
        amount: 150,
        category: "Other",
        sub_category: "Vacation Fund",
      }),
      makeTx({
        id: "t2",
        amount: 200,
        category: "Other",
        sub_category: "Emergency",
      }),
    ];
    const result = calculateGoalProgress(budget, txs, []);
    expect(result.accumulatedAmount).toBe(150);
  });

  it("calculates expected progress with target_date", () => {
    const budget = makeBudget({
      start_date: "2026-01-01T00:00:00.000Z",
      target_date: "2026-03-01T00:00:00.000Z",
    });
    // 59 total days (Jan 1 -> Mar 1), now = Jan 31 = 30 days elapsed
    const now = new Date("2026-01-31T00:00:00.000Z");
    const result = calculateGoalProgress(budget, [], [], now);
    const expected = (30 / 59) * 100;
    expect(result.expectedProgress).toBeCloseTo(expected, 1);
  });

  it("calculates expected progress without target_date (current month)", () => {
    const budget = makeBudget({ target_date: null });
    // Feb 11, 2026: 28 days in Feb, day 11
    const now = new Date("2026-02-11T12:00:00.000Z");
    const result = calculateGoalProgress(budget, [], [], now);
    const expected = (11 / 28) * 100;
    expect(result.expectedProgress).toBeCloseTo(expected, 1);
  });

  it("determines on-track vs off-track correctly", () => {
    const budget = makeBudget({
      target_amount: 1000,
      start_date: "2026-01-01T00:00:00.000Z",
      target_date: "2026-03-01T00:00:00.000Z",
      category_name: "Savings",
      budget_scope: "category",
    });
    const now = new Date("2026-02-01T00:00:00.000Z");
    // Expected ~52.5%. With 600 saved (60%), should be on track.
    const onTrack = calculateGoalProgress(
      budget,
      [makeTx({ amount: 600, category: "Savings" })],
      [],
      now,
    );
    expect(onTrack.isOnTrack).toBe(true);

    // With 100 saved (10%), should be off track.
    const offTrack = calculateGoalProgress(
      budget,
      [makeTx({ amount: 100, category: "Savings" })],
      [],
      now,
    );
    expect(offTrack.isOnTrack).toBe(false);
  });

  it("caps progress at 100%", () => {
    const budget = makeBudget({ target_amount: 100 });
    const txs = [makeTx({ amount: 200 })];
    const result = calculateGoalProgress(budget, txs, []);
    expect(result.progressPercentage).toBe(100);
  });

  it("computes monthly contribution when target_date is set", () => {
    const budget = makeBudget({
      target_amount: 1000,
      start_date: "2026-01-01T00:00:00.000Z",
      target_date: "2026-04-01T00:00:00.000Z",
    });
    const now = new Date("2026-01-01T00:00:00.000Z");
    const result = calculateGoalProgress(budget, [], [], now);
    expect(result.monthlyContribution).not.toBeNull();
    expect(result.monthlyContribution!).toBeGreaterThan(0);
    // 90 days / 30.44 ≈ 2.957 months → 1000 / 2.957 ≈ 338
    expect(result.monthlyContribution!).toBeCloseTo(338, -1);
  });

  it("matches case-insensitively", () => {
    const budget = makeBudget({ goal_context: "savings" });
    const txs = [makeTx({ amount: 100, category: "SAVINGS" })];
    const result = calculateGoalProgress(budget, txs);
    expect(result.accumulatedAmount).toBe(100);
  });

  describe("withdrawals", () => {
    const accountGoal = makeBudget({
      budget_scope: "account",
      budget_scope_name: "Savings Account",
      target_amount: 1000,
    });
    const deposit = (id: string, amount: number) =>
      makeTx({ id, amount, date: "2026-02-01T00:00:00.000Z" });

    it("reduce the progress made", () => {
      const result = calculateGoalProgress(
        accountGoal,
        [deposit("d1", 600), deposit("d2", 200), deposit("w1", -300)],
        [],
      );
      expect(result.accumulatedAmount).toBe(500);
      expect(result.progressPercentage).toBe(50);
    });

    it("never push progress below zero", () => {
      const result = calculateGoalProgress(
        accountGoal,
        [deposit("d1", 100), deposit("w1", -450)],
        [],
      );
      expect(result.accumulatedAmount).toBe(0);
      expect(result.progressPercentage).toBe(0);
    });

    it("can put a goal that was on track behind schedule", () => {
      const goal = makeBudget({
        ...accountGoal,
        start_date: "2026-01-01T00:00:00.000Z",
        target_date: "2026-12-31T00:00:00.000Z",
      });
      const now = new Date("2026-07-01T00:00:00.000Z"); // ~50% of the way
      const saved = [deposit("d1", 700)];
      expect(calculateGoalProgress(goal, saved, [], now).isOnTrack).toBe(true);
      const withdrawn = [...saved, deposit("w1", -500)];
      expect(calculateGoalProgress(goal, withdrawn, [], now).isOnTrack).toBe(
        false,
      );
    });
  });
});

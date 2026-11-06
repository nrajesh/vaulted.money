import { useMemo } from "react";
import { Budget } from "@/types/dataProvider";
import { Transaction } from "@/data/finance-data";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import {
  differenceInCalendarDays,
  startOfMonth,
  parseISO,
  isValid,
  parse,
  getDaysInMonth,
} from "date-fns";

export interface GoalProgress {
  accumulatedAmount: number;
  progressPercentage: number;
  expectedProgress: number;
  isOnTrack: boolean;
  monthlyContribution: number | null;
}

/**
 * Calculates goal progress for a budget marked as a goal.
 * Filters transactions matching the goal_context (account, category, or sub_category)
 * and nets their amounts since the budget's start_date (deposits add,
 * withdrawals subtract).
 */
export function calculateGoalProgress(
  budget: Budget,
  transactions: Transaction[],
  accounts: Payee[] = [],
  now: Date = new Date(),
): GoalProgress {
  if (!budget.is_goal) {
    return {
      accumulatedAmount: 0,
      progressPercentage: 0,
      expectedProgress: 0,
      isOnTrack: true,
      monthlyContribution: null,
    };
  }

  const startDate = parseISO(budget.start_date);
  // Base currency for conversion (if needed, but for now we assume same currency or handle conversion outside)
  // Actually, calculateBudgetSpent handles conversion. Here we might need it too.
  // For now, let's assume raw amounts if no converter is passed.
  // Ideally useGoalProgress should accept a converter, but let's stick to matching logic first.

  const budgetScopeType = budget.budget_scope || "category";
  const budgetScopeName = (budget.budget_scope_name || "").trim().toLowerCase();

  // Account Scope Setup
  let allowedAccountTypes: Set<string> | null = null;
  if (budget.account_scope === "GROUP" && budget.account_scope_values?.length) {
    allowedAccountTypes = new Set(
      budget.account_scope_values.map((v) => v.toLowerCase()),
    );
  }

  // Account Name -> Type Map for lookup
  const accountTypeMap = new Map<string, string>();
  accounts.forEach((acc) => {
    if (acc.name && acc.type) {
      accountTypeMap.set(acc.name.toLowerCase(), acc.type.toLowerCase());
    }
  });

  // Filter transactions matching scope and after start_date
  const matchingTransactions = transactions.filter((t) => {
    // Date check: transaction.date >= budget.start_date
    let txDate = new Date(t.date);
    if (!isValid(txDate)) {
      const parsed = parse(t.date, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) txDate = parsed;
      else return false;
    }

    if (txDate < startDate) return false;

    // Scope-based matching
    if (budgetScopeType === "account") {
      if ((t.account || "").trim().toLowerCase() !== budgetScopeName)
        return false;
    } else if (budgetScopeType === "vendor") {
      if ((t.vendor || "").trim().toLowerCase() !== budgetScopeName)
        return false;
    } else if (budgetScopeType === "sub_category") {
      if ((t.sub_category || "").trim().toLowerCase() !== budgetScopeName)
        return false;
    } else {
      // Category Check
      if (
        t.category.trim().toLowerCase() !==
        budget.category_name.trim().toLowerCase()
      )
        return false;

      // Sub-category Check
      if (
        budget.sub_category_name &&
        (!t.sub_category ||
          t.sub_category.trim().toLowerCase() !==
            budget.sub_category_name.trim().toLowerCase())
      )
        return false;
    }

    // Account Scope Check
    if (allowedAccountTypes) {
      const accountName = (t.account || "").trim().toLowerCase();
      const type = accountTypeMap.get(accountName);

      if (!type || !allowedAccountTypes.has(type)) {
        return false;
      }
    }

    return true;
  });

  // Net amount set aside: deposits (positive) add to the goal and withdrawals
  // (negative) take away from it. Using absolute values would let spending
  // money out of a savings account push the goal forward. It never goes below
  // zero, so overdrawing cannot make progress negative.
  const accumulatedAmount = Math.max(
    0,
    matchingTransactions.reduce((sum, t) => sum + t.amount, 0),
  );

  const targetAmount = budget.target_amount || 1;
  const progressPercentage = Math.min(
    (accumulatedAmount / targetAmount) * 100,
    100,
  );

  // Calculate expected progress
  let expectedProgress = 0;

  if (budget.target_date) {
    const targetDate = parseISO(budget.target_date);
    if (isValid(targetDate)) {
      const totalDays = differenceInCalendarDays(targetDate, startDate);
      const daysElapsed = differenceInCalendarDays(now, startDate);

      if (totalDays > 0) {
        expectedProgress = Math.min(
          Math.max((daysElapsed / totalDays) * 100, 0),
          100,
        );
      }
    }
  } else {
    // No target_date: calculate based on current month progress
    const monthStart = startOfMonth(now);
    const daysInMonth = getDaysInMonth(now);
    const dayOfMonth = differenceInCalendarDays(now, monthStart) + 1;
    expectedProgress = Math.min((dayOfMonth / daysInMonth) * 100, 100);
  }

  // Calculate monthly contribution (remaining amount / remaining months)
  let monthlyContribution: number | null = null;
  if (budget.target_date) {
    const targetDate = parseISO(budget.target_date);
    if (isValid(targetDate)) {
      const remainingAmount = Math.max(0, targetAmount - accumulatedAmount);
      const remainingDays = differenceInCalendarDays(targetDate, now);
      const remainingMonths = Math.max(1, remainingDays / 30.44);
      monthlyContribution = remainingAmount / remainingMonths;
    }
  }

  return {
    accumulatedAmount,
    progressPercentage,
    expectedProgress,
    isOnTrack: progressPercentage >= expectedProgress,
    monthlyContribution,
  };
}

/**
 * React hook wrapping calculateGoalProgress with memoization.
 */
export function useGoalProgress(
  budget: Budget,
  transactions: Transaction[],
  accounts: Payee[] = [],
): GoalProgress {
  return useMemo(
    () => calculateGoalProgress(budget, transactions, accounts),
    [budget, transactions, accounts],
  );
}

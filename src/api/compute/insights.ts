import { isWithinInterval, subDays } from "date-fns";
import { calculateBudgetSpent } from "@/utils/budgetUtils";
import type {
  Account,
  Budget,
  Transaction,
  Vendor,
} from "@/types/dataProvider";
import { round2, type Convert } from "./shared";

export interface BudgetInsight {
  budgetId: string;
  name: string;
  currency: string;
  target: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: "good" | "warning" | "critical";
  message: string;
}

export interface TrendInsight {
  entity: string;
  type: "Vendor" | "Account";
  metric: "Frequency" | "Spending";
  currentValue: number;
  previousValue: number;
  difference: number;
  percentChange: number | null; // null = new activity (no previous value)
  direction: "increasing" | "decreasing";
  currency?: string;
}

export interface InsightsInput {
  transactions: Transaction[];
  accounts: Account[];
  vendors: Vendor[];
  budgets: Budget[];
  convert: Convert;
  now: Date;
}

const budgetName = (b: Budget) =>
  b.budget_scope === "account" || b.budget_scope === "vendor"
    ? (b.budget_scope_name ?? b.category_name)
    : b.sub_category_name
      ? `${b.category_name} / ${b.sub_category_name}`
      : b.category_name;

/** Budget consumption, worst offenders first. Matches the Insights page. */
export function computeBudgetInsights(input: InsightsInput): BudgetInsight[] {
  const priority = { critical: 3, warning: 2, good: 1 };
  return input.budgets
    .filter((b) => b.is_active !== false)
    .map((budget): BudgetInsight => {
      const spent = calculateBudgetSpent(
        budget,
        input.transactions,
        input.accounts,
        input.vendors,
        input.convert,
        budget.currency,
      );
      const target = budget.target_amount;
      const percentUsed = target > 0 ? (spent / target) * 100 : 0;
      const status =
        spent > target ? "critical" : percentUsed > 85 ? "warning" : "good";
      const message =
        status === "critical"
          ? `Exceeded the planned ${budget.currency} ${round2(target)} by ${round2(spent - target)}.`
          : status === "warning"
            ? `${Math.round(percentUsed)}% of the budget is used.`
            : `Spent ${budget.currency} ${round2(spent)} of ${round2(target)}.`;
      return {
        budgetId: budget.id,
        name: budgetName(budget),
        currency: budget.currency,
        target: round2(target),
        spent: round2(spent),
        remaining: round2(target - spent),
        percentUsed: round2(percentUsed),
        status,
        message,
      };
    })
    .sort((a, b) => priority[b.status] - priority[a.status]);
}

/**
 * Compares the latest 30-day window with the 30 days before it. The anchor is
 * today, or the latest transaction when nothing happened recently — the same
 * rule the Insights page uses so both agree.
 */
export function computeTrendInsights(input: InsightsInput) {
  const { transactions, vendors, now } = input;
  let anchor = now;
  const recentStart = subDays(now, 30);
  const hasRecent = transactions.some((t) => {
    const d = new Date(t.date);
    return d >= recentStart && d <= now;
  });
  if (!hasRecent && transactions.length > 0) {
    const latest = transactions.reduce((a, t) =>
      new Date(t.date) > new Date(a.date) ? t : a,
    );
    anchor = new Date(latest.date);
  }

  const currentStart = subDays(anchor, 30);
  const previousEnd = subDays(currentStart, 1);
  const previousStart = subDays(previousEnd, 30);

  const inWindow = (t: Transaction, start: Date, end: Date) =>
    !t.is_scheduled_origin &&
    isWithinInterval(new Date(t.date), { start, end });
  const current = transactions.filter((t) => inWindow(t, currentStart, anchor));
  const previous = transactions.filter((t) =>
    inWindow(t, previousStart, previousEnd),
  );

  const accountNames = new Set(
    vendors.filter((v) => v.is_account).map((v) => v.name),
  );
  const entities = new Set<string>();
  [...current, ...previous].forEach((t) => {
    if (t.vendor) entities.add(t.vendor);
    if (t.account) entities.add(t.account);
  });

  const analyse = (
    entity: string,
    type: "Vendor" | "Account",
  ): TrendInsight | null => {
    const pick = (txs: Transaction[]) =>
      txs.filter((t) => (type === "Vendor" ? t.vendor : t.account) === entity);
    const cur = pick(current);
    const prev = pick(previous);
    if (cur.length === 0 && prev.length === 0) return null;

    const sum = (txs: Transaction[]) =>
      txs.reduce((s, t) => s + Math.abs(t.amount), 0);
    const currentValue = type === "Account" ? cur.length : sum(cur);
    const previousValue = type === "Account" ? prev.length : sum(prev);
    const difference = currentValue - previousValue;
    // Ignore noise: fewer than 2 transactions / under 10 currency units.
    if (Math.abs(difference) < (type === "Account" ? 2 : 10)) return null;

    return {
      entity,
      type,
      metric: type === "Account" ? "Frequency" : "Spending",
      currentValue: round2(currentValue),
      previousValue: round2(previousValue),
      difference: round2(difference),
      percentChange:
        previousValue > 0 ? round2((difference / previousValue) * 100) : null,
      direction: difference > 0 ? "increasing" : "decreasing",
      currency:
        type === "Vendor"
          ? (cur[0]?.currency ?? prev[0]?.currency ?? "USD")
          : undefined,
    };
  };

  // New activity (null percent) ranks first, then by size of change.
  const rank = (a: TrendInsight, b: TrendInsight) => {
    if (a.percentChange === null && b.percentChange === null)
      return Math.abs(b.difference) - Math.abs(a.difference);
    if (a.percentChange === null) return -1;
    if (b.percentChange === null) return 1;
    const diff = Math.abs(b.percentChange) - Math.abs(a.percentChange);
    if (Math.abs(diff) > 1) return diff;
    const abs = Math.abs(b.difference) - Math.abs(a.difference);
    return Math.abs(abs) > 0.01 ? abs : a.entity.localeCompare(b.entity);
  };

  const accountTrends: TrendInsight[] = [];
  const vendorTrends: TrendInsight[] = [];
  for (const entity of entities) {
    const isAccount = accountNames.has(entity);
    const trend = analyse(entity, isAccount ? "Account" : "Vendor");
    if (trend) (isAccount ? accountTrends : vendorTrends).push(trend);
  }

  return {
    currentPeriod: {
      from: currentStart.toISOString().slice(0, 10),
      to: anchor.toISOString().slice(0, 10),
    },
    previousPeriod: {
      from: previousStart.toISOString().slice(0, 10),
      to: previousEnd.toISOString().slice(0, 10),
    },
    hasInsufficientData: previous.length === 0,
    accounts: accountTrends.sort(rank).slice(0, 5),
    vendors: vendorTrends.sort(rank).slice(0, 5),
  };
}

export function computeInsights(input: InsightsInput) {
  return {
    generatedAt: input.now.toISOString(),
    budgets: computeBudgetInsights(input),
    trends: computeTrendInsights(input),
  };
}

export type InsightsResult = ReturnType<typeof computeInsights>;

export function insightsToRows(result: InsightsResult) {
  return [
    ...result.budgets.map((b) => ({
      kind: "budget",
      name: b.name,
      status: b.status,
      current: b.spent,
      reference: b.target,
      change_percent: b.percentUsed,
      currency: b.currency,
      message: b.message,
    })),
    ...[...result.trends.accounts, ...result.trends.vendors].map((t) => ({
      kind: `trend-${t.type.toLowerCase()}`,
      name: t.entity,
      status: t.direction,
      current: t.currentValue,
      reference: t.previousValue,
      change_percent: t.percentChange,
      currency: t.currency,
      message: `${t.metric} ${t.direction}`,
    })),
  ];
}

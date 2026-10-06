import type { Transaction } from "@/types/dataProvider";
import {
  dayOf,
  round2,
  todayKey,
  TRANSFER_CATEGORY,
  type Convert,
} from "./shared";

export const REPORT_TYPES = ["income-expense", "net-worth", "trends"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export interface ReportOptions {
  from?: string;
  to?: string;
  currency: string;
  now: Date;
}

export interface AccountView {
  name: string;
  currency: string;
  starting_balance: number;
  type: string;
}

const inPeriod = (t: Transaction, from?: string, to?: string) => {
  const day = dayOf(t.date);
  return (!from || day >= from) && (!to || day <= to);
};

/** Income and expenses by category for a period (transfers excluded). */
export function incomeExpenseReport(
  transactions: Transaction[],
  convert: Convert,
  options: ReportOptions,
) {
  const income: Record<string, number> = {};
  const expenses: Record<string, number> = {};
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    if (
      t.category === TRANSFER_CATEGORY ||
      !inPeriod(t, options.from, options.to)
    )
      continue;
    const amount = convert(t.amount, t.currency, options.currency);
    const category = t.category || "Uncategorized";
    if (amount > 0) {
      totalIncome += amount;
      income[category] = (income[category] ?? 0) + amount;
    } else {
      totalExpenses += Math.abs(amount);
      expenses[category] = (expenses[category] ?? 0) + Math.abs(amount);
    }
  }

  const toList = (map: Record<string, number>) =>
    Object.entries(map)
      .map(([category, amount]) => ({ category, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount);

  return {
    report: "income-expense" as const,
    currency: options.currency,
    period: { from: options.from ?? null, to: options.to ?? null },
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    net: round2(totalIncome - totalExpenses),
    incomeByCategory: toList(income),
    expensesByCategory: toList(expenses),
  };
}

/**
 * Net worth at `to` (default: today). Balance = starting balance plus every
 * transaction up to the cutoff, transfers included. Positive balances are
 * assets, negative ones liabilities — same rule as the Net Worth report page.
 */
export function netWorthReport(
  accounts: AccountView[],
  transactions: Transaction[],
  convert: Convert,
  options: ReportOptions,
) {
  const cutoff = options.to ?? todayKey(options.now);
  const balances = new Map<string, number>();
  for (const a of accounts) {
    balances.set(
      a.name,
      convert(a.starting_balance || 0, a.currency || "USD", options.currency),
    );
  }
  for (const t of transactions) {
    if (!balances.has(t.account) || dayOf(t.date) > cutoff) continue;
    balances.set(
      t.account,
      (balances.get(t.account) ?? 0) +
        convert(t.amount, t.currency, options.currency),
    );
  }

  let assets = 0;
  let liabilities = 0;
  const rows = accounts.map((a) => {
    const balance = balances.get(a.name) ?? 0;
    if (balance >= 0) assets += balance;
    else liabilities += Math.abs(balance);
    return { account: a.name, type: a.type, balance: round2(balance) };
  });

  return {
    report: "net-worth" as const,
    currency: options.currency,
    asOf: cutoff,
    assets: round2(assets),
    liabilities: round2(liabilities),
    netWorth: round2(assets - liabilities),
    accounts: rows,
  };
}

/** Month-by-month income, expenses and savings rate with simple averages. */
export function trendsReport(
  transactions: Transaction[],
  convert: Convert,
  options: ReportOptions,
) {
  const today = todayKey(options.now);
  const months = new Map<string, { income: number; expenses: number }>();
  for (const t of transactions) {
    const day = dayOf(t.date);
    if (
      day > today ||
      t.category === TRANSFER_CATEGORY ||
      !inPeriod(t, options.from, options.to)
    )
      continue;
    const amount = convert(t.amount, t.currency, options.currency);
    const bucket = months.get(day.slice(0, 7)) ?? { income: 0, expenses: 0 };
    if (amount > 0) bucket.income += amount;
    else bucket.expenses += Math.abs(amount);
    months.set(day.slice(0, 7), bucket);
  }

  const series = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, b]) => ({
      month,
      income: round2(b.income),
      expenses: round2(b.expenses),
      net: round2(b.income - b.expenses),
      savingsRate:
        b.income > 0
          ? round2(((b.income - b.expenses) / b.income) * 100)
          : null,
    }));

  const count = series.length || 1;
  return {
    report: "trends" as const,
    currency: options.currency,
    period: { from: options.from ?? null, to: options.to ?? null },
    averages: {
      monthlyIncome: round2(series.reduce((s, m) => s + m.income, 0) / count),
      monthlyExpenses: round2(
        series.reduce((s, m) => s + m.expenses, 0) / count,
      ),
    },
    series,
  };
}

export type ReportResult =
  | ReturnType<typeof incomeExpenseReport>
  | ReturnType<typeof netWorthReport>
  | ReturnType<typeof trendsReport>;

export function reportToRows(report: ReportResult) {
  switch (report.report) {
    case "income-expense":
      return [
        ...report.incomeByCategory.map((r) => ({ type: "income", ...r })),
        ...report.expensesByCategory.map((r) => ({ type: "expense", ...r })),
      ];
    case "net-worth":
      return report.accounts;
    case "trends":
      return report.series;
  }
}

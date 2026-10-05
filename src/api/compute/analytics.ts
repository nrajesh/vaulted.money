import { format, parseISO, startOfWeek } from "date-fns";
import type { Transaction } from "@/types/dataProvider";
import {
  dayOf,
  round2,
  todayKey,
  TRANSFER_CATEGORY,
  type Convert,
} from "./shared";

export type GroupBy = "day" | "week" | "month";

export interface AnalyticsOptions {
  from?: string;
  to?: string;
  groupBy: GroupBy;
  currency: string;
  includeTransfers: boolean;
  now: Date;
}

interface Bucket {
  income: number;
  expenses: number;
  count: number;
}

const periodKey = (date: string, groupBy: GroupBy): string => {
  const day = dayOf(date);
  if (groupBy === "day") return day;
  if (groupBy === "month") return day.slice(0, 7);
  return format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), "yyyy-MM-dd");
};

const bump = (map: Map<string, Bucket>, key: string, amount: number) => {
  const bucket = map.get(key) ?? { income: 0, expenses: 0, count: 0 };
  if (amount >= 0) bucket.income += amount;
  else bucket.expenses += Math.abs(amount);
  bucket.count += 1;
  map.set(key, bucket);
};

/**
 * Spending analytics for a period, expressed in `options.currency`.
 *
 * Mirrors the Analytics page: future-dated transactions are excluded and
 * transfers are left out unless requested, since they move money rather than
 * earn or spend it.
 */
export function computeAnalytics(
  transactions: Transaction[],
  convert: Convert,
  options: AnalyticsOptions,
) {
  const today = todayKey(options.now);
  const selected = transactions.filter((t) => {
    const day = dayOf(t.date);
    if (day > today) return false;
    if (options.from && day < options.from) return false;
    if (options.to && day > options.to) return false;
    if (!options.includeTransfers && t.category === TRANSFER_CATEGORY)
      return false;
    return true;
  });

  const series = new Map<string, Bucket>();
  const byCategory = new Map<string, Bucket>();
  const byVendor = new Map<string, Bucket>();
  const byAccount = new Map<string, Bucket>();
  let income = 0;
  let expenses = 0;

  for (const t of selected) {
    const amount = convert(t.amount, t.currency, options.currency);
    if (amount >= 0) income += amount;
    else expenses += Math.abs(amount);
    bump(series, periodKey(t.date, options.groupBy), amount);
    bump(byCategory, t.category || "Uncategorized", amount);
    bump(byVendor, t.vendor || "Unknown", amount);
    bump(byAccount, t.account || "Unknown", amount);
  }

  const ranked = <K extends string>(
    map: Map<string, Bucket>,
    key: K,
    limit?: number,
  ) => {
    type Row = { [P in K]: string } & {
      income: number;
      expenses: number;
      net: number;
      count: number;
      share: number;
    };
    const rows = [...map.entries()]
      .map(
        ([name, b]) =>
          ({
            [key]: name,
            income: round2(b.income),
            expenses: round2(b.expenses),
            net: round2(b.income - b.expenses),
            count: b.count,
            share: expenses > 0 ? round2((b.expenses / expenses) * 100) : 0,
          }) as Row,
      )
      .sort((a, b) => b.expenses - a.expenses);
    return limit ? rows.slice(0, limit) : rows;
  };

  return {
    currency: options.currency,
    period: { from: options.from ?? null, to: options.to ?? null },
    groupBy: options.groupBy,
    totals: {
      income: round2(income),
      expenses: round2(expenses),
      net: round2(income - expenses),
      transactionCount: selected.length,
    },
    /** `share` is the percentage of total expenses. */
    byCategory: ranked(byCategory, "category"),
    byVendor: ranked(byVendor, "vendor", 25),
    byAccount: ranked(byAccount, "account"),
    series: [...series.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, b]) => ({
        period,
        income: round2(b.income),
        expenses: round2(b.expenses),
        net: round2(b.income - b.expenses),
        count: b.count,
      })),
  };
}

export type AnalyticsResult = ReturnType<typeof computeAnalytics>;

/** Flattens analytics into one CSV table (`type` says which section a row is from). */
export function analyticsToRows(result: AnalyticsResult) {
  const row = (
    type: string,
    key: string,
    r: { income: number; expenses: number; net: number; count: number },
  ) => ({
    type,
    key,
    income: r.income,
    expenses: r.expenses,
    net: r.net,
    count: r.count,
    currency: result.currency,
  });
  return [
    ...result.series.map((r) => row("period", r.period, r)),
    ...result.byCategory.map((r) => row("category", r.category, r)),
    ...result.byVendor.map((r) => row("vendor", r.vendor, r)),
    ...result.byAccount.map((r) => row("account", r.account, r)),
  ];
}

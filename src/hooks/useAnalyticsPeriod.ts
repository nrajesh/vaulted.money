"use client";

import { useState, useMemo, useCallback } from "react";
import type { TFunction } from "i18next";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  subYears,
  format,
  differenceInDays,
  subDays,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";
import { type Transaction } from "@/data/finance-data";
import { useTranslation } from "react-i18next";

export type PeriodType = "1W" | "1M" | "6M" | "1Y" | "custom";

export interface AnalyticsPeriodState {
  period: PeriodType;
  periodOffset: number; // 0 = current, -1 = previous, -2 = two periods back, etc.
  customRange: { from: Date; to: Date } | null;
}

export interface PeriodRange {
  from: Date;
  to: Date;
}

export interface UseAnalyticsPeriodReturn {
  period: PeriodType;
  periodOffset: number;
  currentRange: PeriodRange;
  previousRange: PeriodRange | null;
  periodLabel: string;
  currentPeriodTransactions: Transaction[];
  previousPeriodTransactions: Transaction[];
  totalSpent: number;
  previousTotalSpent: number;
  spentDelta: number;
  setPeriod: (period: PeriodType) => void;
  navigateForward: () => void;
  navigateBack: () => void;
  setCustomRange: (from: Date, to: Date) => void;
  canNavigateForward: boolean;
  canNavigateBack: boolean;
}

function computeRange(
  period: PeriodType,
  offset: number,
  customRange: { from: Date; to: Date } | null,
): PeriodRange {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (period === "custom" && customRange) {
    if (offset === 0) {
      return {
        from: startOfDay(customRange.from),
        to: endOfDay(customRange.to),
      };
    }
    const rangeDays = differenceInDays(customRange.to, customRange.from) + 1;
    const shiftedFrom = subDays(customRange.from, rangeDays * Math.abs(offset));
    const shiftedTo = subDays(customRange.to, rangeDays * Math.abs(offset));
    return { from: startOfDay(shiftedFrom), to: endOfDay(shiftedTo) };
  }

  switch (period) {
    case "1W": {
      const base = offset === 0 ? now : subWeeks(now, Math.abs(offset));
      return {
        from: startOfWeek(base, { weekStartsOn: 1 }),
        to: endOfWeek(base, { weekStartsOn: 1 }),
      };
    }
    case "1M": {
      const base = offset === 0 ? now : subMonths(now, Math.abs(offset));
      return {
        from: startOfMonth(base),
        to: endOfMonth(base),
      };
    }
    case "6M": {
      const endBase = offset === 0 ? now : subMonths(now, 6 * Math.abs(offset));
      const startBase = subMonths(endBase, 5);
      return {
        from: startOfMonth(startBase),
        to: endOfMonth(endBase),
      };
    }
    case "1Y": {
      const endBase = offset === 0 ? now : subYears(now, Math.abs(offset));
      const startBase = subMonths(endBase, 11);
      return {
        from: startOfMonth(startBase),
        to: endOfMonth(endBase),
      };
    }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

function computePreviousRange(
  period: PeriodType,
  currentRange: PeriodRange,
): PeriodRange | null {
  const rangeDays = differenceInDays(currentRange.to, currentRange.from) + 1;

  switch (period) {
    case "1W":
      return {
        from: subWeeks(currentRange.from, 1),
        to: subWeeks(currentRange.to, 1),
      };
    case "1M":
      return {
        from: subMonths(currentRange.from, 1),
        to: subMonths(currentRange.to, 1),
      };
    case "6M":
      return {
        from: subMonths(currentRange.from, 6),
        to: subMonths(currentRange.to, 6),
      };
    case "1Y":
      return {
        from: subYears(currentRange.from, 1),
        to: subYears(currentRange.to, 1),
      };
    case "custom":
      return {
        from: subDays(currentRange.from, rangeDays),
        to: subDays(currentRange.to, rangeDays),
      };
    default:
      return null;
  }
}

function formatPeriodLabel(
  period: PeriodType,
  currentRange: PeriodRange,
  t: TFunction,
): string {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(now);

  switch (period) {
    case "1W": {
      if (currentRange.from.getTime() === thisWeekStart.getTime()) {
        return t("analytics.period.thisWeek", { defaultValue: "This week" });
      }
      return `${format(currentRange.from, "d MMM")} – ${format(currentRange.to, "d MMM")}`;
    }
    case "1M": {
      if (currentRange.from.getTime() === thisMonthStart.getTime()) {
        return t("analytics.period.thisMonth", { defaultValue: "This month" });
      }
      return format(currentRange.from, "MMMM yyyy");
    }
    case "6M":
    case "1Y":
      return `${format(currentRange.from, "MMM")} – ${format(currentRange.to, "MMM yyyy")}`;
    case "custom":
      return `${format(currentRange.from, "d MMM yyyy")} – ${format(currentRange.to, "d MMM yyyy")}`;
    default:
      return "";
  }
}

function filterTransactionsByRange(
  transactions: Transaction[],
  range: PeriodRange,
): Transaction[] {
  return transactions.filter((t) => {
    const txDate = new Date(t.date);
    txDate.setHours(0, 0, 0, 0);
    return (
      !isBefore(txDate, startOfDay(range.from)) &&
      !isAfter(txDate, endOfDay(range.to))
    );
  });
}

function computeTotalSpent(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.amount < 0 && t.category !== "Transfer")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function useAnalyticsPeriod(
  transactions: Transaction[],
): UseAnalyticsPeriodReturn {
  const { t } = useTranslation();
  const [state, setState] = useState<AnalyticsPeriodState>({
    period: "1M",
    periodOffset: 0,
    customRange: null,
  });

  const currentRange = useMemo(
    () => computeRange(state.period, state.periodOffset, state.customRange),
    [state.period, state.periodOffset, state.customRange],
  );

  const previousRange = useMemo(
    () => computePreviousRange(state.period, currentRange),
    [state.period, currentRange],
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(state.period, currentRange, t),
    [state.period, currentRange, t],
  );

  const currentPeriodTransactions = useMemo(
    () => filterTransactionsByRange(transactions, currentRange),
    [transactions, currentRange],
  );

  const previousPeriodTransactions = useMemo(
    () =>
      previousRange
        ? filterTransactionsByRange(transactions, previousRange)
        : [],
    [transactions, previousRange],
  );

  const totalSpent = useMemo(
    () => computeTotalSpent(currentPeriodTransactions),
    [currentPeriodTransactions],
  );

  const previousTotalSpent = useMemo(
    () => computeTotalSpent(previousPeriodTransactions),
    [previousPeriodTransactions],
  );

  const spentDelta = totalSpent - previousTotalSpent;

  // Check if navigating forward would go past today
  const canNavigateForward = useMemo(() => {
    if (state.periodOffset < 0) return true;
    return false;
  }, [state.periodOffset]);

  // Check if there's data in earlier periods
  const canNavigateBack = useMemo(() => {
    if (transactions.length === 0) return false;
    const earliest = transactions.reduce((min, t) => {
      const d = new Date(t.date);
      return d < min ? d : min;
    }, new Date());
    return previousRange ? !isBefore(previousRange.to, earliest) : false;
  }, [transactions, previousRange]);

  const setPeriod = useCallback((period: PeriodType) => {
    setState((prev) => ({ ...prev, period, periodOffset: 0 }));
  }, []);

  const navigateForward = useCallback(() => {
    setState((prev) => {
      if (prev.periodOffset >= 0) return prev;
      return { ...prev, periodOffset: prev.periodOffset + 1 };
    });
  }, []);

  const navigateBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      periodOffset: prev.periodOffset - 1,
    }));
  }, []);

  const setCustomRange = useCallback((from: Date, to: Date) => {
    setState({
      period: "custom",
      periodOffset: 0,
      customRange: { from, to },
    });
  }, []);

  return {
    period: state.period,
    periodOffset: state.periodOffset,
    currentRange,
    previousRange,
    periodLabel,
    currentPeriodTransactions,
    previousPeriodTransactions,
    totalSpent,
    previousTotalSpent,
    spentDelta,
    setPeriod,
    navigateForward,
    navigateBack,
    setCustomRange,
    canNavigateForward,
    canNavigateBack,
  };
}

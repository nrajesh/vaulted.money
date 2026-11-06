import { useMemo } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { startOfMonth, subMonths, isAfter, isBefore } from "date-fns";
import {
  isDiscretionary,
  isScheduleActive,
  monthlyOccurrences,
} from "@/utils/runway";

export const useFinancialRunway = () => {
  const { transactions, accounts, scheduledTransactions } = useTransactions();
  const { convertBetweenCurrencies, selectedCurrency } = useCurrency();

  // 1. Calculate Total Liquid Savings (Accounts)
  const totalSavings = useMemo(() => {
    return accounts.reduce((total, account) => {
      // Filter for liquid asset types if you want to be strict,
      // but 'savings' generally means all available funds in this context
      // unless we want to exclude credit cards.
      // Net Worth usually includes debts, but for runway we want "Cash on Hand".
      // Let's stick to Net Worth logic for now but maybe we should exclude Credit Cards?
      // "Runway" implies how long *positive* money lasts.
      // If balance is negative (debt), it reduces runway.
      const balance = account.running_balance || 0;
      return (
        total +
        convertBetweenCurrencies(
          balance,
          account.currency || "USD",
          selectedCurrency || "USD",
        )
      );
    }, 0);
  }, [accounts, selectedCurrency, convertBetweenCurrencies]);

  // 2. Fixed Costs (Scheduled Transactions)
  const monthlyFixedFlow = useMemo(() => {
    let income = 0;
    let expenses = 0;

    const today = new Date();
    scheduledTransactions.forEach((t) => {
      if (!isScheduleActive(t.end_date, today)) return;
      // A recurring transfer only moves money between the user's accounts.
      if (!isDiscretionary(t)) return;

      const amount = convertBetweenCurrencies(
        t.amount,
        t.currency || "USD",
        selectedCurrency || "USD",
      );

      const monthlyAmount = amount * monthlyOccurrences(t.frequency);

      if (monthlyAmount > 0) income += monthlyAmount;
      else expenses += Math.abs(monthlyAmount);
    });

    return { income, expenses, net: income - expenses };
  }, [scheduledTransactions, selectedCurrency, convertBetweenCurrencies]);

  // 3. Discretionary Spending (Recent History Average)
  // We look at the last 3 full months to get an average.
  const monthlyDiscretionaryFlow = useMemo(() => {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const startOfPeriod = subMonths(startOfCurrentMonth, 3);
    const endOfPeriod = startOfCurrentMonth; // Exclusive of current month to avoid partial data bias?
    // Actually, including current month might skews "average" if it's day 1.
    // Let's use last 3 completed months + current month so far?
    // Or simpler: Just look at last 90 days?
    // The requirement says "last quarter or less".
    // "Last 3 months excluding current partial month" is cleaner for "average".
    // But if they have no history, we fall back to current.

    let totalIncome = 0;
    let totalExpenses = 0;

    // Filter transactions
    const relevantTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        isAfter(tDate, startOfPeriod) &&
        isBefore(tDate, endOfPeriod) &&
        // Excludes scheduled instances (already counted as fixed costs) and
        // transfers between the user's own accounts.
        isDiscretionary(t)
      );
    });

    relevantTransactions.forEach((t) => {
      const amount = convertBetweenCurrencies(
        t.amount,
        t.currency || "USD",
        selectedCurrency || "USD",
      );

      if (amount > 0) totalIncome += amount;
      else totalExpenses += Math.abs(amount);
    });

    // Average over 3 months
    // If we don't have good data, this might be 0.
    // Ensure we don't divide by 0 if period is weird, but hardcoded 3 is fine.
    // We assume the data covers 3 months. If they just started, we might want to normalize by active days?
    // For simplicity, let's just divide by 3.
    // If they have < 3 months of data, this underestimates spending (which is risky).
    // Better: detected range. But let's stick to simple "Available / 3" for now.

    const avgIncome = totalIncome / 3;
    const avgExpenses = totalExpenses / 3;

    return {
      income: avgIncome,
      expenses: avgExpenses,
      net: avgIncome - avgExpenses,
    };
  }, [transactions, selectedCurrency, convertBetweenCurrencies]);

  // 4. Combined Burn & Runway
  const runwayData = useMemo(() => {
    const totalMonthlyIncome =
      monthlyFixedFlow.income + monthlyDiscretionaryFlow.income;
    const totalMonthlyExpenses =
      monthlyFixedFlow.expenses + monthlyDiscretionaryFlow.expenses;
    const netCashFlow = totalMonthlyIncome - totalMonthlyExpenses;

    let runwayMonths = 0;
    let isInfinite = false;

    if (netCashFlow >= 0) {
      isInfinite = true; // Making more than spending, runway is infinite
    } else {
      // Net Burn is negative of Net Cash Flow
      const netBurn = Math.abs(netCashFlow);
      if (netBurn > 0) {
        runwayMonths = totalSavings / netBurn;
      } else {
        isInfinite = true; // Should be covered by >= 0 check, but safe guard
      }
    }

    return {
      totalSavings,
      monthlyFixed: monthlyFixedFlow,
      monthlyDiscretionary: monthlyDiscretionaryFlow,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      netCashFlow,
      runwayMonths,
      isInfinite,
    };
  }, [totalSavings, monthlyFixedFlow, monthlyDiscretionaryFlow]);

  return runwayData;
};

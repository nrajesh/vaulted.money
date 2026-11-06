import { useMemo } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { calculateBudgetSpent } from "@/utils/budgetUtils";
import { Account } from "@/types/dataProvider";
import { useEffect, useState } from "react";
import { Budget } from "@/types/budgets";

import {
  subDays,
  format,
  isAfter,
  isBefore,
  endOfDay,
  addMonths,
  addYears,
  parse,
} from "date-fns";

export const useBudgetStatus = () => {
  const { transactions, accounts, vendors } = useTransactions();
  const { convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { activeLedger } = useLedger();
  const dataProvider = useDataProvider();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch budgets
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!activeLedger?.id) return;
      setIsLoading(true);
      try {
        const data = await dataProvider.getBudgetsWithSpending(activeLedger.id);
        setBudgets(data || []);
      } catch (e) {
        console.error("Failed to fetch budgets for status", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBudgets();
  }, [activeLedger?.id, dataProvider]);

  const budgetStats = useMemo(() => {
    if (!budgets.length)
      return {
        totalBudget: 0,
        totalSpent: 0,
        percentage: 0,
        hasBudgets: false,
        dailyTrends: [],
      };

    // Filter active and spending budgets (ignore goals for now?)
    // Usually "Budget Status" implies spending limits.
    const spendingBudgets = budgets.filter(
      (b) => !b.is_goal && b.is_active !== false,
    );

    if (!spendingBudgets.length)
      return {
        totalBudget: 0,
        totalSpent: 0,
        percentage: 0,
        hasBudgets: false,
        dailyTrends: [],
      };

    const adaptedAccounts = accounts.map((a) => ({
      ...a,
      currency: a.currency || "USD",
      type: a.type || "Other",
      starting_balance: a.starting_balance || 0,
      user_id: "",
      remarks: a.remarks || "",
      created_at: a.created_at || new Date().toISOString(),
    })) as unknown as Account[];

    let totalBudget = 0;
    let totalSpent = 0;

    // Identify budgeted categories to filter daily trends approximately
    // Validating against all budget rules for every transaction is expensive.
    // We will use a simplified check: if transaction category matches any budget category.
    const budgetedCategories = new Set<string>();
    spendingBudgets.forEach((b) => {
      if (b.category_name)
        budgetedCategories.add(b.category_name.toLowerCase());
    });

    spendingBudgets.forEach((budget) => {
      // Calculate spent for this budget
      const spentNative = calculateBudgetSpent(
        budget,
        transactions,
        adaptedAccounts,
        vendors,
        convertBetweenCurrencies,
        budget.currency,
      );

      // Convert both target and spent to selected currency
      const budgetAmount = convertBetweenCurrencies(
        budget.target_amount,
        budget.currency,
        selectedCurrency || "USD",
      );
      const spentAmount = convertBetweenCurrencies(
        spentNative,
        budget.currency,
        selectedCurrency || "USD",
      );

      totalBudget += budgetAmount;
      // A budget in net credit (refunds or income in its category) must not
      // cancel out another budget's real overspending in this total.
      totalSpent += Math.max(0, spentAmount);
    });

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate Daily Trends (Last 30 Days) with Replenishment
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const dailyMap = new Map<
      string,
      { spending: number; replenishment: number }
    >();

    // Initialize map
    for (let i = 0; i < 30; i++) {
      const d = subDays(today, 29 - i); // Order from past to present
      dailyMap.set(format(d, "yyyy-MM-dd"), { spending: 0, replenishment: 0 });
    }

    // 1. Calculate Spending
    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (isAfter(tDate, thirtyDaysAgo) && isBefore(tDate, endOfDay(today))) {
        if (
          t.amount < 0 &&
          t.category &&
          budgetedCategories.has(t.category.trim().toLowerCase())
        ) {
          const dateKey = format(tDate, "yyyy-MM-dd");
          if (dailyMap.has(dateKey)) {
            const entry = dailyMap.get(dateKey)!;
            const amount = convertBetweenCurrencies(
              Math.abs(t.amount),
              t.currency || "USD",
              selectedCurrency || "USD",
            );
            entry.spending += amount;
          }
        }
      }
    });

    // 2. Calculate Replenishments
    // Iterate active budgets and see if they reset in this window
    spendingBudgets.forEach((budget) => {
      // Safe local date parsing: extract YYYY-MM-DD to avoid UTC shifting
      const rawDate = budget.start_date.substring(0, 10); // "2026-02-13"
      const startDate = parse(rawDate, "yyyy-MM-dd", new Date());

      // We need to find occurrence dates of this budget between thirtyDaysAgo and today
      let currentDate = startDate;

      // Fast forward to window start if needed (optimization)
      // For now simple loop since 30 days is short

      let loopLimit = 0;
      while (isBefore(currentDate, endOfDay(today)) && loopLimit < 1000) {
        if (isAfter(currentDate, thirtyDaysAgo)) {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          if (dailyMap.has(dateKey)) {
            const entry = dailyMap.get(dateKey)!;
            const amount = convertBetweenCurrencies(
              budget.target_amount,
              budget.currency,
              selectedCurrency || "USD",
            );
            entry.replenishment += amount;
          }
        }

        // Next occurrence
        // Next occurrence
        switch (budget.frequency) {
          // Daily/Weekly not supported in Budget type yet
          case "Monthly":
            currentDate = addMonths(currentDate, 1);
            break;
          case "Quarterly":
            currentDate = addMonths(currentDate, 3);
            break;
          case "Yearly":
            currentDate = addYears(currentDate, 1);
            break;
          default:
            loopLimit = 1001;
            break; // One-time or unknown
        }
        loopLimit++;
      }
    });

    const dailyTrends = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: format(new Date(date), "dd"),
      fullDate: date,
      spending: data.spending,
      replenishment: data.replenishment,
    }));

    return {
      totalBudget,
      totalSpent,
      percentage,
      hasBudgets: true,
      dailyTrends,
    };
  }, [
    budgets,
    transactions,
    accounts,
    vendors,
    convertBetweenCurrencies,
    selectedCurrency,
  ]);

  return { ...budgetStats, isLoading };
};

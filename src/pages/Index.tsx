import { useMemo } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { applyTransactionFilters } from "@/utils/transactionFilters";
import { useTranslation } from "react-i18next";

import { SearchFilterBar } from "@/components/filters/SearchFilterBar";

// New Components
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { StackedCategoryChart } from "@/components/dashboard/StackedCategoryChart";
import { RunwayCard } from "@/components/dashboard/RunwayCard";
import { BudgetStatusCard } from "@/components/dashboard/BudgetStatusCard";
import { ConsolidatedMetricsCard } from "@/components/dashboard/ConsolidatedMetricsCard";

const Index = () => {
  const { t } = useTranslation();
  const { transactions } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();

  const {
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    excludeTransfers,
    minAmount,
    maxAmount,
    transactionType,
  } = useTransactionFilters();
  const filteredTransactions = useMemo(
    () =>
      applyTransactionFilters(transactions, {
        searchTerm,
        selectedAccounts,
        selectedCategories,
        selectedSubCategories,
        selectedVendors,
        dateRange,
        excludeTransfers,
        minAmount,
        maxAmount,
        transactionType,
      }),
    [
      transactions,
      searchTerm,
      selectedAccounts,
      selectedCategories,
      selectedSubCategories,
      selectedVendors,
      dateRange,
      excludeTransfers,
      minAmount,
      maxAmount,
      transactionType,
    ],
  );

  // Calculate Metrics
  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let balance = 0;

    filteredTransactions.forEach((t) => {
      // For balance, we sum everything (unless filtered out by logic above)
      // Note: "Total Balance" usually implies current state of accounts,
      // but here it seems to represent "Net Change" in the selected period if filters are active.
      // However, if no date filter, it's net worth.
      const amount = convertBetweenCurrencies(
        t.amount,
        t.currency || "USD",
        selectedCurrency || "USD",
      );

      // Handle Income/Expense calculation
      if (t.amount > 0) {
        if (t.category !== "Transfer" || !excludeTransfers) {
          income += amount;
        }
      } else {
        if (t.category !== "Transfer" || !excludeTransfers) {
          expenses += Math.abs(amount);
        }
      }

      // Handle Balance
      // If excludes transfers is on, balance calc might be weird if we just sum?
      // Usually transfers net to 0, so excluding them shouldn't change total balance unless inter-account.
      if (t.category !== "Transfer" || !excludeTransfers) {
        balance += amount;
      }
    });

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalBalance: balance,
    };
  }, [
    filteredTransactions,
    selectedCurrency,
    convertBetweenCurrencies,
    excludeTransfers,
  ]);

  // Calculate Percentage Changes (Simplified for now - comparing to "previous period" ideally, but reused 0% logic if unknown)
  // To do this properly we'd need to fetch previous period data.
  // For this iteration, I'll simulate or just show the static styles if actual comparison is complex to add right now.
  // Let's stick to the existing logic 'calculatePercentageChange' if we can preserve it, or simplify for the UI update focus.
  // I will reuse the monthly logic from before to get at least some comparison if possible, or just mock it for "UI likeness" if acceptable.
  // Let's bring back the monthly data calculation for the change percentages.

  return (
    <div className="page-container">
      <div className="flex flex-col gap-6">
        <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h1 className="app-gradient-title app-page-title">
              {t("nav.items.overview", { defaultValue: "Overview" })}
            </h1>
            <p className="app-page-subtitle">
              {t("pages.overview.subtitle", {
                defaultValue: "Where your money stands, and what's next.",
              })}
            </p>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <SearchFilterBar />

        {/* Metric Cards Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          <RunwayCard />
          <BudgetStatusCard />
        </div>

        {/* Metric Cards Row 2 - Consolidated */}
        <div className="tour-dashboard-summary">
          <ConsolidatedMetricsCard
            netWorth={formatCurrency(totalBalance)}
            income={formatCurrency(totalIncome)}
            expenses={formatCurrency(totalExpenses)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-12 h-[350px] sm:h-[500px]">
          {/* Chart Section - Takes up 8 columns (approx 2/3) */}
          <div className="tour-dashboard-charts md:col-span-8 h-full">
            <StackedCategoryChart
              transactions={filteredTransactions}
              className="h-full shadow-sm"
            />
          </div>

          {/* Activity Feed - Takes up 4 columns (approx 1/3) */}
          <div className="tour-recent-transactions md:col-span-4 h-full">
            <RecentActivityFeed
              transactions={filteredTransactions}
              className="h-full shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

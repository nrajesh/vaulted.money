import * as React from "react";
import { AnalyticsChartView } from "@/components/charts/AnalyticsChartView";
import { useTransactions } from "@/contexts/TransactionsContext";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { applyTransactionFilters } from "@/utils/transactionFilters";
import { useTranslation } from "react-i18next";

const Analytics = () => {
  const { t } = useTranslation();
  const { transactions } = useTransactions();
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

  // Filter out future transactions for the analytics view
  const currentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate <= today;
    });
  }, [transactions]);

  const filteredTransactions = React.useMemo(
    () =>
      applyTransactionFilters(currentTransactions, {
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
      currentTransactions,
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

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("nav.items.charts", { defaultValue: "Charts" })}
          </h1>
          <p className="app-page-subtitle">
            {t("pages.charts.subtitle", {
              defaultValue: "Spending and trends for any period.",
            })}
          </p>
        </div>
      </div>
      <div className="tour-analytics-filters">
        <SearchFilterBar />
      </div>
      <div className="tour-analytics-chart">
        <AnalyticsChartView
          transactions={filteredTransactions}
          filterDateRange={dateRange}
        />
      </div>
    </div>
  );
};

export default Analytics;

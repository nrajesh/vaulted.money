import React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import {
  AlertTriangle,
  BarChart2,
  ShoppingCart,
  Banknote,
  Calendar,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { differenceInDays } from "date-fns";
import { Budget, Transaction } from "@/data/finance-data";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import { useNavigate } from "react-router-dom";

import { calculateBudgetSpent } from "@/utils/budgetUtils";
import { useTransactions } from "@/contexts/TransactionsContext";

interface AlertsAndInsightsProps {
  historicalTransactions: Transaction[];
  futureTransactions: Transaction[];
  accounts: Payee[];
  budgets: Budget[];
}

const AlertsAndInsights: React.FC<AlertsAndInsightsProps> = ({
  historicalTransactions,
  futureTransactions,
  accounts,
  budgets,
}) => {
  const { convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { vendors } = useTransactions();
  const navigate = useNavigate();

  const handleAccountClick = (accountName: string) => {
    navigate("/transactions", { state: { filterAccount: accountName } });
  };

  const handleVendorClick = (vendorName: string) => {
    const isAccount = accounts.some((acc) => acc.name === vendorName);
    const filterKey = isAccount ? "filterAccount" : "filterVendor";
    navigate("/transactions", { state: { [filterKey]: vendorName } });
  };

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "Transfer") return;
    navigate("/transactions", { state: { filterCategory: categoryName } });
  };

  const handleSubCategoryClick = (subCategoryName: string) => {
    navigate("/transactions", {
      state: { filterSubCategory: subCategoryName },
    });
  };

  // 1. Calculate Low Balance Alerts
  const lowBalanceAlerts = React.useMemo(() => {
    const alerts: {
      accountName: string;
      daysUntilNegative: number;
      finalBalance: number;
      isCreditLimitBreach?: boolean;
      threshold?: number;
    }[] = [];

    if (accounts.length === 0) return [];

    const currentBalances: Record<string, number> = {};
    accounts.forEach((acc) => {
      const startingBalance = acc.starting_balance || 0;
      const accountCurrency = acc.currency || "USD";
      currentBalances[acc.name] = convertBetweenCurrencies(
        startingBalance,
        accountCurrency,
        selectedCurrency,
      );
    });

    historicalTransactions.forEach((t) => {
      const convertedAmount = convertBetweenCurrencies(
        t.amount,
        t.currency,
        selectedCurrency,
      );
      currentBalances[t.account] =
        (currentBalances[t.account] || 0) + convertedAmount;
    });

    const sortedFutureTx = [...futureTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const projectedBalances = { ...currentBalances };
    const negativeDateMap: Record<string, Date> = {};

    // Check if currently negative (or exceeding limit)
    Object.keys(currentBalances).forEach((accountName) => {
      const account = accounts.find((a) => a.name === accountName);
      const threshold =
        account?.type === "Credit Card" && account.credit_limit
          ? -account.credit_limit
          : 0;

      if (currentBalances[accountName] < threshold) {
        negativeDateMap[accountName] = new Date(); // Already breached
      }
    });

    for (const tx of sortedFutureTx) {
      const convertedAmount = convertBetweenCurrencies(
        tx.amount,
        tx.currency,
        selectedCurrency,
      );
      projectedBalances[tx.account] =
        (projectedBalances[tx.account] || 0) + convertedAmount;

      const account = accounts.find((a) => a.name === tx.account);
      const threshold =
        account?.type === "Credit Card" && account.credit_limit
          ? -account.credit_limit
          : 0;

      if (
        projectedBalances[tx.account] < threshold &&
        !negativeDateMap[tx.account]
      ) {
        negativeDateMap[tx.account] = new Date(tx.date);
      }
    }

    Object.keys(negativeDateMap).forEach((accountName) => {
      const daysUntilNegative = differenceInDays(
        negativeDateMap[accountName],
        new Date(),
      );
      const account = accounts.find((a) => a.name === accountName);
      const isCreditCard =
        account?.type === "Credit Card" && account.credit_limit;

      alerts.push({
        accountName,
        daysUntilNegative: daysUntilNegative >= 0 ? daysUntilNegative : 0,
        finalBalance: projectedBalances[accountName],
        isCreditLimitBreach: !!isCreditCard,
        threshold: isCreditCard ? -account!.credit_limit! : 0,
      });
    });

    return alerts;
  }, [
    historicalTransactions,
    futureTransactions,
    accounts,
    selectedCurrency,
    convertBetweenCurrencies,
  ]);

  // 2. Calculate Budget Overrun Alerts
  const budgetOverrunAlerts = React.useMemo(() => {
    const alerts: { displayName: string; percentage: number; scope: string }[] =
      [];

    // Filter budgets to active ones
    const activeBudgets = budgets.filter((b) => b.is_active !== false);

    activeBudgets.forEach((budget) => {
      const targetAmount = convertBetweenCurrencies(
        budget.target_amount,
        budget.currency,
        selectedCurrency,
      );

      // Calculate spent in selected currency
      const spentInSelectedCurrency = calculateBudgetSpent(
        budget as unknown as import("@/types/dataProvider").Budget, // Cast to avoid type mismatch
        historicalTransactions,
        accounts as unknown as import("@/types/dataProvider").Account[],
        vendors as unknown as import("@/types/dataProvider").Vendor[],
        convertBetweenCurrencies,
        selectedCurrency,
      );

      const percentage =
        targetAmount > 0 ? (spentInSelectedCurrency / targetAmount) * 100 : 0;

      if (percentage >= 90) {
        const scope = budget.budget_scope || "category";
        const displayName =
          scope !== "category" && budget.budget_scope_name
            ? budget.budget_scope_name
            : budget.category_name!;
        alerts.push({
          displayName,
          percentage: Math.round(percentage),
          scope,
        });
      }
    });

    return alerts.sort((a, b) => b.percentage - a.percentage);
  }, [
    historicalTransactions,
    budgets,
    selectedCurrency,
    convertBetweenCurrencies,
    accounts,
    vendors,
  ]); // Added vendors

  // 3. Calculate Key Insights from historical data
  const keyInsights = React.useMemo(() => {
    const expenseCategoryCounts: Record<string, number> = {};
    const expenseVendorCounts: Record<string, number> = {};
    const accountActivityCounts: Record<string, number> = {};

    historicalTransactions.forEach((t) => {
      if (t.category !== "Transfer") {
        accountActivityCounts[t.account] =
          (accountActivityCounts[t.account] || 0) + 1;
      }
      if (t.amount < 0 && t.category !== "Transfer") {
        expenseCategoryCounts[t.category] =
          (expenseCategoryCounts[t.category] || 0) + 1;
        expenseVendorCounts[t.vendor] =
          (expenseVendorCounts[t.vendor] || 0) + 1;
      }
    });

    const getTopThree = (counts: Record<string, number>) =>
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return {
      topCategories: getTopThree(expenseCategoryCounts),
      topVendors: getTopThree(expenseVendorCounts),
      topAccounts: getTopThree(accountActivityCounts),
    };
  }, [historicalTransactions]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle className="app-gradient-title">
          Alerts and Insights
        </ThemedCardTitle>
        <ThemedCardDescription>
          Automated analysis of your financial data based on the selected
          filters.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="app-section-title flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive-text" />
            Financial Alerts
          </h3>
          {lowBalanceAlerts.length === 0 && budgetOverrunAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No financial alerts to show. Great job!
            </p>
          ) : (
            <>
              {lowBalanceAlerts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Low Balance Warnings:
                  </h4>
                  <ul className="space-y-2 list-disc pl-5 text-sm">
                    {lowBalanceAlerts.map((alert, index: number) => (
                      <li key={`${alert.accountName}-${index}`}>
                        <span
                          onClick={() => handleAccountClick(alert.accountName)}
                          className="font-semibold cursor-pointer hover:text-primary hover:underline"
                        >
                          {alert.accountName}
                        </span>{" "}
                        {alert.daysUntilNegative === 0 ? (
                          <>
                            {alert.isCreditLimitBreach
                              ? "has exceeded its credit limit"
                              : "now has a negative balance"}
                            .
                          </>
                        ) : (
                          <>
                            is projected{" "}
                            <Calendar
                              className="h-3 w-3 inline text-muted-foreground mr-1"
                              aria-label="Based on scheduled transactions"
                            />{" "}
                            to{" "}
                            {alert.isCreditLimitBreach
                              ? "exceed its credit limit"
                              : "have a negative balance"}{" "}
                            in{" "}
                            <span className="font-bold text-destructive-text">
                              {alert.daysUntilNegative} days
                            </span>
                            .
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {budgetOverrunAlerts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">
                    Budget Overrun Warnings:
                  </h4>
                  <ul className="space-y-2 list-disc pl-5 text-sm">
                    {budgetOverrunAlerts.map((alert, index) => (
                      <li key={`${alert.displayName}-${index}`}>
                        <span
                          onClick={() => {
                            if (alert.scope === "account") {
                              handleAccountClick(alert.displayName);
                            } else if (alert.scope === "vendor") {
                              handleVendorClick(alert.displayName);
                            } else if (alert.scope === "sub_category") {
                              handleSubCategoryClick(alert.displayName);
                            } else {
                              handleCategoryClick(alert.displayName);
                            }
                          }}
                          className="font-semibold cursor-pointer hover:text-primary hover:underline"
                        >
                          {alert.displayName}
                        </span>{" "}
                        budget is at{" "}
                        <span
                          className={`font-bold ${alert.percentage >= 100 ? "text-destructive-text" : "text-amber-700 dark:text-amber-400"}`}
                        >
                          {alert.percentage}%
                        </span>{" "}
                        of its monthly limit.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="app-section-title">Key Insights</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <BarChart2 className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Top Spending Categories</p>
                {keyInsights.topCategories.length > 0 ? (
                  <p className="text-muted-foreground">
                    {keyInsights.topCategories.map(([name], index) => (
                      <React.Fragment key={name}>
                        <span
                          onClick={() => handleCategoryClick(name)}
                          className="cursor-pointer hover:text-primary hover:underline"
                        >
                          {name}
                        </span>
                        {index < keyInsights.topCategories.length - 1
                          ? ", "
                          : ""}
                      </React.Fragment>
                    ))}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No spending data.</p>
                )}
              </div>
            </div>
            <div className="flex items-start">
              <ShoppingCart className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Most Frequented Vendors</p>
                {keyInsights.topVendors.length > 0 ? (
                  <p className="text-muted-foreground">
                    {keyInsights.topVendors.map(([name], index) => (
                      <React.Fragment key={name}>
                        <span
                          onClick={() => handleVendorClick(name)}
                          className="cursor-pointer hover:text-primary hover:underline"
                        >
                          {name}
                        </span>
                        {index < keyInsights.topVendors.length - 1 ? ", " : ""}
                      </React.Fragment>
                    ))}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No spending data.</p>
                )}
              </div>
            </div>
            <div className="flex items-start">
              <Banknote className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Most Active Accounts</p>
                {keyInsights.topAccounts.length > 0 ? (
                  <p className="text-muted-foreground">
                    {keyInsights.topAccounts.map(([name], index) => (
                      <React.Fragment key={name}>
                        <span
                          onClick={() => handleAccountClick(name)}
                          className="cursor-pointer hover:text-primary hover:underline"
                        >
                          {name}
                        </span>
                        {index < keyInsights.topAccounts.length - 1 ? ", " : ""}
                      </React.Fragment>
                    ))}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No transaction data.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default AlertsAndInsights;

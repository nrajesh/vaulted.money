import React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { Transaction } from "@/types/dataProvider";

import { Payee } from "@/components/dialogs/AddEditPayeeDialog";

interface NetWorthStatementProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  accounts: Payee[];
}

const NetWorthStatement: React.FC<NetWorthStatementProps> = ({
  transactions: _filteredTransactions,
  allTransactions,
  accounts,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { dateRange } = useTransactionFilters();

  const { assets, liabilities, netWorth, isProjected } = React.useMemo(() => {
    const accountBalances: Record<string, number> = {};
    const cutoffDate = dateRange?.to ? new Date(dateRange.to) : new Date();
    // Ensure cutoff includes the whole day
    cutoffDate.setHours(23, 59, 59, 999);

    // Initialize balances by converting each account's starting balance to the selected currency
    accounts.forEach((account) => {
      const startingBalance = account.starting_balance || 0;
      const accountCurrency = account.currency || "USD"; // Assume USD if currency is not specified
      accountBalances[account.name] = convertBetweenCurrencies(
        startingBalance,
        accountCurrency,
        selectedCurrency,
      );
    });

    // Valid accounts set for fast lookup
    const validAccountNames = new Set(accounts.map((a) => a.name));

    // Adjust balances with allTransactions, but ONLY for selected accounts and UP TO the cutoff date.
    // We ignore Category/Vendor filters from the "Filtered Views" effectively by using allTransactions
    // but we MUST respect the Account Filter which is implicitly handled by `props.accounts` being the filtered list.
    // However, we must ensure we only process transactions belonging to these accounts.
    allTransactions.forEach((transaction) => {
      // 1. Must be for one of our effective accounts
      if (!validAccountNames.has(transaction.account)) return;

      // 2. Must be on or before cutoff date
      const tDate = new Date(transaction.date);
      if (tDate > cutoffDate) return;

      // 3. Exclude Transfers?
      // Net Worth usually includes transfers as they are just movements.
      // However, if we filter to ONE account, a transfer OUT reduces its balance.
      // A transfer IN increases it.
      // If we exclude transfers globally, we might drift from reality if we don't sum all accounts.
      // But typically "Assets" sum = Sum of Account Balances.
      // Account Balance = Start + All In/Out (including transfers).
      // So we should NOT filter transfers out for Balance Calculation, unless the user explicitly wants "Net Worth excluding transfers" which is weird.
      // Usually "Exclude Transfers" in filters applies to Income/Expense reports, NOT Balance sheets.
      // So we generally INCLUDE transfers here.

      const convertedAmount = convertBetweenCurrencies(
        transaction.amount,
        transaction.currency,
        selectedCurrency,
      );
      accountBalances[transaction.account] =
        (accountBalances[transaction.account] || 0) + convertedAmount;
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    // Sum up the final balances of the filtered accounts
    Object.values(accountBalances).forEach((balance) => {
      if (balance >= 0) {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    });

    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      isProjected: allTransactions.some(
        (t) =>
          t.is_scheduled_origin &&
          validAccountNames.has(t.account) &&
          new Date(t.date) <= cutoffDate,
      ),
    };
  }, [
    allTransactions,
    accounts,
    selectedCurrency,
    convertBetweenCurrencies,
    dateRange,
  ]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle className="app-gradient-title">
          Net Worth Statement
        </ThemedCardTitle>
        <ThemedCardDescription>
          A summary of your assets and liabilities.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <ThemedCard>
            <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ThemedCardTitle className="text-sm font-medium">
                Total Assets
              </ThemedCardTitle>
              <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(assets)}
              </div>
            </ThemedCardContent>
          </ThemedCard>
          <ThemedCard>
            <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ThemedCardTitle className="text-sm font-medium">
                Total Liabilities
              </ThemedCardTitle>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(liabilities)}
              </div>
            </ThemedCardContent>
          </ThemedCard>
          <ThemedCard>
            <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ThemedCardTitle className="text-sm font-medium">
                Net Worth{" "}
                {isProjected && (
                  <span className="text-muted-foreground text-xs font-normal">
                    (Projected)
                  </span>
                )}
              </ThemedCardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(netWorth)}
              </div>
            </ThemedCardContent>
          </ThemedCard>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default NetWorthStatement;

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

import { Transaction } from "@/types/dataProvider";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";

interface NetWorthStatementProps {
  transactions: Transaction[];
  accounts: Payee[];
}

const NetWorthStatement: React.FC<NetWorthStatementProps> = ({
  transactions,
  accounts,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();

  const { assets, liabilities, netWorth } = React.useMemo(() => {
    const accountBalances: Record<string, number> = {};

    accounts.forEach((account) => {
      const startingBalance = account.starting_balance || 0;
      const accountCurrency = account.currency || selectedCurrency;
      accountBalances[account.name] = convertBetweenCurrencies(
        startingBalance,
        accountCurrency,
        selectedCurrency,
      );
    });

    transactions.forEach((transaction) => {
      const convertedAmount = convertBetweenCurrencies(
        transaction.amount,
        transaction.currency,
        selectedCurrency,
      );
      if (transaction.category !== "Transfer") {
        accountBalances[transaction.account] =
          (accountBalances[transaction.account] || 0) + convertedAmount;
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

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
    };
  }, [transactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Statement</CardTitle>
        <CardDescription>
          A summary of your assets and liabilities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(assets)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Liabilities
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(liabilities)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(netWorth)}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetWorthStatement;

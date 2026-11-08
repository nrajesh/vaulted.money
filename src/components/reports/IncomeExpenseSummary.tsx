import React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Budget, Transaction } from "@/data/finance-data";
import { useNavigate } from "react-router-dom";

interface IncomeExpenseSummaryProps {
  transactions: Transaction[];
  budgets: Budget[];
}

import { Calendar } from "lucide-react";

// ... imports

const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({
  transactions,
  budgets,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "Transfer") return;
    navigate("/transactions", { state: { filterCategory: categoryName } });
  };

  const summary = React.useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    const incomeHasScheduled: Record<string, boolean> = {}; // Track if category has scheduled tx
    const expenseHasScheduled: Record<string, boolean> = {}; // Track if category has scheduled tx

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((t) => {
      if (t.category !== "Transfer") {
        const convertedAmount = convertBetweenCurrencies(
          t.amount,
          t.currency,
          selectedCurrency,
        );
        if (convertedAmount > 0) {
          totalIncome += convertedAmount;
          incomeByCategory[t.category] =
            (incomeByCategory[t.category] || 0) + convertedAmount;
          if (t.is_scheduled_origin) incomeHasScheduled[t.category] = true;
        } else {
          totalExpenses += Math.abs(convertedAmount);
          expensesByCategory[t.category] =
            (expensesByCategory[t.category] || 0) + Math.abs(convertedAmount);
          if (t.is_scheduled_origin) expenseHasScheduled[t.category] = true;
        }
      }
    });

    const expensesWithBudget = Object.entries(expensesByCategory).map(
      ([category, amount]) => {
        const budget = budgets.find(
          (b) =>
            b.category_name === category &&
            (b.is_active ?? true) &&
            (b.frequency === "1m" || b.frequency === "Monthly"),
        );
        const target = budget
          ? convertBetweenCurrencies(
              budget.target_amount,
              budget.currency,
              selectedCurrency,
            )
          : null;
        const variance = target !== null ? target - amount : null;
        const percentSpent =
          target !== null && target > 0 ? (amount / target) * 100 : null;
        const hasScheduled = expenseHasScheduled[category];
        return {
          category,
          amount,
          target,
          variance,
          percentSpent,
          hasScheduled,
        };
      },
    );

    return {
      incomeByCategory,
      expensesByCategory,
      totalIncome,
      totalExpenses,
      expensesWithBudget,
      incomeHasScheduled,
    };
  }, [transactions, budgets, selectedCurrency, convertBetweenCurrencies]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle className="app-gradient-title">
          Income and Expense Summary
        </ThemedCardTitle>
        <ThemedCardDescription>
          A breakdown of your income and expenses by category.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="app-section-title mb-2">Income</h3>
          {/* Mobile View */}
          <div className="md:hidden space-y-2 mt-2">
            {Object.entries(summary.incomeByCategory).map(
              ([category, amount]) => {
                const hasScheduled = summary.incomeHasScheduled[category];
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between border-b border-border/50 pb-2"
                  >
                    <span
                      onClick={() => handleCategoryClick(category)}
                      className="cursor-pointer hover:text-primary flex items-center gap-2 font-medium text-sm"
                    >
                      {category}
                      {hasScheduled && (
                        <Calendar
                          className="h-3 w-3 text-muted-foreground"
                          aria-label="Includes scheduled transactions"
                        />
                      )}
                    </span>
                    <span
                      className={`text-sm font-semibold text-green-700 dark:text-green-400 ${hasScheduled ? "opacity-70" : ""}`}
                    >
                      {formatCurrency(amount)}
                    </span>
                  </div>
                );
              },
            )}
            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-sm">Total Income</span>
              <span className="font-bold text-green-700 dark:text-green-400">
                {formatCurrency(summary.totalIncome)}
              </span>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(summary.incomeByCategory).map(
                  ([category, amount]) => {
                    const hasScheduled = summary.incomeHasScheduled[category];
                    return (
                      <TableRow key={category}>
                        <TableCell>
                          <span
                            onClick={() => handleCategoryClick(category)}
                            className="cursor-pointer hover:text-primary hover:underline flex items-center gap-2"
                          >
                            {category}
                            {hasScheduled && (
                              <Calendar
                                className="h-3 w-3 text-muted-foreground"
                                aria-label="Includes scheduled transactions"
                              />
                            )}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right ${hasScheduled ? "text-muted-foreground" : ""}`}
                        >
                          {formatCurrency(amount)}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
                <TableRow className="font-bold">
                  <TableCell>Total Income</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalIncome)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <h3 className="app-section-title mb-2">Expenses</h3>
          {/* Mobile View */}
          <div className="md:hidden space-y-3 mt-2">
            {summary.expensesWithBudget.map(
              ({
                category,
                amount,
                target,
                variance,
                percentSpent,
                hasScheduled,
              }) => (
                <div
                  key={category}
                  className="flex flex-col border-b border-border/50 pb-3 gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => handleCategoryClick(category)}
                      className="cursor-pointer hover:text-primary flex items-center gap-2 font-medium text-sm"
                    >
                      {category}
                      {hasScheduled && (
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                    <span
                      className={`text-sm font-semibold text-red-600 dark:text-red-400 ${hasScheduled ? "opacity-70" : ""}`}
                    >
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Target: {target !== null ? formatCurrency(target) : "-"}
                    </span>
                    <span
                      className={`${variance !== null && variance < 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}`}
                    >
                      {variance !== null
                        ? `${variance < 0 ? "Over: " : "Left: "}${formatCurrency(Math.abs(variance))}`
                        : "-"}
                    </span>
                  </div>
                  {percentSpent !== null && (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${percentSpent > 100 ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ),
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-sm">Total Expenses</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalExpenses)}
              </span>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">% Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.expensesWithBudget.map(
                  ({
                    category,
                    amount,
                    target,
                    variance,
                    percentSpent,
                    hasScheduled,
                  }) => (
                    <TableRow key={category}>
                      <TableCell>
                        <span
                          onClick={() => handleCategoryClick(category)}
                          className="cursor-pointer hover:text-primary hover:underline flex items-center gap-2"
                        >
                          {category}
                          {hasScheduled && (
                            <Calendar
                              className="h-3 w-3 text-muted-foreground"
                              aria-label="Includes scheduled transactions"
                            />
                          )}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right ${hasScheduled ? "text-muted-foreground" : ""}`}
                      >
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {target !== null ? formatCurrency(target) : "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right ${variance !== null && variance < 0 ? "text-red-600 dark:text-red-400" : ""}`}
                      >
                        {variance !== null ? formatCurrency(variance) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {percentSpent !== null
                          ? `${percentSpent.toFixed(0)}%`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ),
                )}
                <TableRow className="font-bold">
                  <TableCell>Total Expenses</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalExpenses)}
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default IncomeExpenseSummary;

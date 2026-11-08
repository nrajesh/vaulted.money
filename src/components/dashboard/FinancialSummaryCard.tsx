import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryCardProps {
  totalBalance: number;
  balanceChange: { value: string; isPositive: boolean | null };
  totalIncome: number;
  incomeChange: { value: string; isPositive: boolean | null };
  totalExpenses: number;
  expensesChange: { value: string; isPositive: boolean | null };
  formatCurrency: (value: number) => string;
}

export const FinancialSummaryCard = ({
  totalBalance,
  balanceChange,
  totalIncome,
  incomeChange,
  totalExpenses,
  expensesChange,
  formatCurrency,
}: FinancialSummaryCardProps) => {
  const getChangeColorClass = (
    isPositive: boolean | null,
    type: "income" | "expenses" | "balance",
  ) => {
    if (isPositive === null) return "text-muted-foreground";
    if (type === "expenses") {
      return isPositive
        ? "text-red-600 dark:text-red-400"
        : "text-green-700 dark:text-green-400";
    }
    return isPositive
      ? "text-green-700 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col justify-between h-full gap-6">
        {/* Total Balance */}
        <div className="space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <span className="text-sm font-medium">Total Balance</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p
              className={cn(
                "text-xs",
                getChangeColorClass(balanceChange.isPositive, "balance"),
              )}
            >
              {balanceChange.value} from last month
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Total Income */}
        <div className="space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <span className="text-sm font-medium">Total Income</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome)}
            </div>
            <p
              className={cn(
                "text-xs",
                getChangeColorClass(incomeChange.isPositive, "income"),
              )}
            >
              {incomeChange.value} from last month
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Total Expenses */}
        <div className="space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <span className="text-sm font-medium">Total Expenses</span>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <p
              className={cn(
                "text-xs",
                getChangeColorClass(expensesChange.isPositive, "expenses"),
              )}
            >
              {expensesChange.value} from last month
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { useTranslation } from "react-i18next";
import { Budget } from "../../types/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { differenceInDays, differenceInMonths } from "date-fns";

interface BudgetSummaryProps {
  budgets: Budget[];
  isLoading: boolean;
}

export function BudgetSummary({ budgets, isLoading }: BudgetSummaryProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return null;
  }

  const now = new Date();

  const normalizedValues = budgets.map((budget) => {
    let normalizedTarget = 0;
    let normalizedSpent = 0;
    const startDate = new Date(budget.start_date);

    // Normalize Target Amount to a monthly value
    switch (budget.frequency) {
      case "Monthly":
        normalizedTarget = budget.target_amount;
        break;
      case "Quarterly":
        normalizedTarget = budget.target_amount / 3;
        break;
      case "Yearly":
        normalizedTarget = budget.target_amount / 12;
        break;
      case "One-time": {
        const endDate = budget.end_date ? new Date(budget.end_date) : now;
        const durationInDays = differenceInDays(endDate, startDate) + 1;
        const durationInMonths = Math.max(1, durationInDays / 30.44); // Avg days in a month
        normalizedTarget = budget.target_amount / durationInMonths;
        break;
      }
    }

    // Normalize Spent Amount to a monthly average based on elapsed time
    if (budget.spent_amount > 0 && now >= startDate) {
      const monthsElapsed = differenceInMonths(now, startDate) + 1;
      normalizedSpent = budget.spent_amount / Math.max(1, monthsElapsed);
    }

    return { normalizedTarget, normalizedSpent };
  });

  const totalTarget = normalizedValues.reduce(
    (sum, b) => sum + b.normalizedTarget,
    0,
  );
  const totalSpent = normalizedValues.reduce(
    (sum, b) => sum + b.normalizedSpent,
    0,
  );
  const currency = budgets[0]?.currency || "USD";

  const remaining = totalTarget - totalSpent;
  const remainingColor = remaining >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="tour-budget-summary-cards grid gap-4 md:grid-cols-3">
      <Card className="bg-indigo-50/40 dark:bg-slate-900/40 border-indigo-100 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("budgets.summary.avgBudget", {
              defaultValue: "Avg. Monthly Budget",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalTarget, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("budgets.summary.avgBudgetHint", {
              defaultValue: "Normalized across all budgets",
            })}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-indigo-50/40 dark:bg-slate-900/40 border-indigo-100 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("budgets.summary.avgSpent", {
              defaultValue: "Avg. Monthly Spent",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalSpent, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("budgets.summary.avgSpentHint", {
              defaultValue: "Based on spending to date",
            })}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-indigo-50/40 dark:bg-slate-900/40 border-indigo-100 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("budgets.summary.avgRemaining", {
              defaultValue: "Avg. Monthly Remaining",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${remainingColor}`}>
            {formatCurrency(remaining, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {remaining >= 0
              ? t("budgets.summary.under", {
                  defaultValue: "Under monthly average",
                })
              : t("budgets.summary.over", {
                  defaultValue: "Over monthly average",
                })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

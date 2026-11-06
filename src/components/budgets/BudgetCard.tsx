import { useTranslation } from "react-i18next";
import { formatDisplayDate } from "@/utils/dateFormat";
import { Budget } from "../../types/budgets";
import { Transaction } from "@/data/finance-data";
import { Wallet, Store, Tag, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  Target,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth, endOfDay, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { Checkbox } from "@/components/ui/checkbox";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (budgetId: string) => void;
  transactions?: Transaction[];
}

function frequencyLabel(
  frequency: string,
  t: (key: string, options: { defaultValue: string }) => string,
) {
  const known = ["Monthly", "Quarterly", "Yearly", "One-time"];
  return known.includes(frequency)
    ? t(`budgets.frequency.${frequency}`, { defaultValue: frequency })
    : frequency;
}

export function BudgetCard({
  budget,
  onEdit,
  onDelete,
  isSelected = false,
  onToggleSelection,
  transactions = [],
}: BudgetCardProps) {
  const { accounts } = useTransactions();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Goal progress (only computed when is_goal)
  const goalProgress = useGoalProgress(budget, transactions, accounts);

  // Scope-aware display name
  const budgetScope = budget.budget_scope || "category";
  const displayName =
    budgetScope !== "category" && budget.budget_scope_name
      ? budget.budget_scope_name
      : budget.category_name;

  const handleTitleClick = () => {
    // 1. Determine Date Range
    let startDate: Date;
    let endDate: Date;

    const now = new Date();
    const freq = budget.frequency as string;

    if (freq === "Monthly" || freq === "1m" || !freq) {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (freq === "Yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else if (freq === "Quarterly") {
      const currentMonth = now.getMonth();
      const startMonth = currentMonth - (currentMonth % 3);
      startDate = new Date(now.getFullYear(), startMonth, 1);
      endDate = new Date(now.getFullYear(), startMonth + 3, 0);
    } else {
      startDate = parseISO(budget.start_date);
      endDate = budget.end_date ? parseISO(budget.end_date) : endOfDay(now);
    }

    // 2. Determine Account Scope
    let filterAccounts: string[] | undefined = undefined;
    if (
      budget.account_scope === "GROUP" &&
      budget.account_scope_values &&
      budget.account_scope_values.length > 0
    ) {
      const allowedTypes = new Set(budget.account_scope_values);
      filterAccounts = accounts
        .filter((a) => a.type && allowedTypes.has(a.type))
        .map((a) => a.name);
    }

    const navState: Record<string, unknown> = {
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      filterAccounts: filterAccounts,
    };

    if (budgetScope === "account") {
      navState.filterAccount = budget.budget_scope_name || displayName;
    } else if (budgetScope === "vendor") {
      navState.filterVendor = budget.budget_scope_name || displayName;
    } else if (budgetScope === "sub_category") {
      navState.filterSubCategory = budget.budget_scope_name || displayName;
    } else {
      navState.filterCategory = budget.category_name;
      navState.filterSubCategory = budget.sub_category_name;
    }

    navigate("/transactions", { state: navState });
  };

  // Render Goal Card
  if (budget.is_goal) {
    return (
      <GoalCard
        budget={budget}
        goalProgress={goalProgress}
        onEdit={onEdit}
        onDelete={onDelete}
        onTitleClick={handleTitleClick}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
      />
    );
  }

  // Render standard Spending Budget Card
  const rawPercentage =
    budget.target_amount > 0
      ? (budget.spent_amount / budget.target_amount) * 100
      : 0;
  const isOverBudget = rawPercentage > 100;
  const percentage = Math.min(100, rawPercentage);
  const remaining = budget.target_amount - budget.spent_amount;

  const formattedStartDate = formatDisplayDate(
    budget.start_date,
    i18n.language,
  );
  const formattedEndDate = budget.end_date
    ? formatDisplayDate(budget.end_date, i18n.language)
    : t("budgets.card.ongoing", { defaultValue: "Ongoing" });

  return (
    <Card
      className={
        isOverBudget
          ? "border-red-500 shadow-lg bg-red-50/30 dark:bg-red-950/20 relative"
          : "bg-indigo-50/40 dark:bg-slate-900/40 border-indigo-100 dark:border-slate-800 relative"
      }
    >
      {onToggleSelection && (
        <div className="absolute top-4 right-4 z-50">
          <Checkbox
            checked={isSelected}
            aria-label={t("budgets.card.select", {
              name: budget.category_name,
              defaultValue: "Select budget {{name}}",
            })}
            onCheckedChange={() =>
              onToggleSelection && onToggleSelection(budget.id)
            }
            className="h-5 w-5 border-2 border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle
          className="flex items-baseline gap-2 cursor-pointer hover:underline hover:text-primary transition-colors text-slate-900 dark:text-slate-50"
          onClick={handleTitleClick}
        >
          {budgetScope === "account" && (
            <Wallet className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          )}
          {budgetScope === "vendor" && (
            <Store className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          )}
          {budgetScope === "sub_category" && (
            <Layers className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          )}
          {budgetScope === "category" && !budget.sub_category_name && (
            <Tag className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          )}
          {displayName}
          {budgetScope === "category" && budget.sub_category_name && (
            <span className="text-xl font-normal text-slate-500 dark:text-slate-400">
              {">"} {budget.sub_category_name}
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {frequencyLabel(budget.frequency, t)}
          <br />
          {formattedStartDate} - {formattedEndDate}
          <br />
          <span className="text-xs text-slate-500 dark:text-slate-500">
            {t("budgets.card.scope", {
              scope:
                budget.account_scope === "GROUP"
                  ? budget.account_scope_values?.join(", ") ||
                    t("budgets.card.specificAccounts", {
                      defaultValue: "Specific Accounts",
                    })
                  : t("budgets.card.allAccounts", {
                      defaultValue: "All Accounts",
                    }),
              defaultValue: "Scope: {{scope}}",
            })}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
          <span>
            {t("budgets.card.spent", {
              amount: formatCurrency(budget.spent_amount, budget.currency),
              defaultValue: "Spent: {{amount}}",
            })}
          </span>
          <span>
            {t("budgets.card.target", {
              amount: formatCurrency(budget.target_amount, budget.currency),
              defaultValue: "Target: {{amount}}",
            })}
          </span>
        </div>
        <Progress
          value={percentage}
          className="bg-slate-300/50 dark:bg-slate-700 h-3"
          indicatorClassName={isOverBudget ? "bg-red-500" : "bg-budget-bar"}
        />
        <div className="text-sm">
          {remaining >= 0 ? (
            <span className="text-green-600 font-medium">
              {t("budgets.card.remaining", {
                amount: formatCurrency(remaining, budget.currency),
                defaultValue: "{{amount}} remaining",
              })}
            </span>
          ) : (
            <span className="text-red-600 font-medium">
              {t("budgets.card.over", {
                amount: formatCurrency(Math.abs(remaining), budget.currency),
                defaultValue: "{{amount}} over budget",
              })}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(budget)}
              aria-label={t("budgets.card.edit", {
                defaultValue: "Edit budget",
              })}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("budgets.card.edit", { defaultValue: "Edit budget" })}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(budget.id)}
              aria-label={t("budgets.card.delete", {
                defaultValue: "Delete budget",
              })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("budgets.card.delete", { defaultValue: "Delete budget" })}
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}

// ─── Goal Card Sub-component ─────────────────────────────────────

interface GoalCardProps {
  budget: Budget;
  goalProgress: ReturnType<typeof useGoalProgress>;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (budgetId: string) => void;
  onTitleClick: () => void;
}

function GoalCard({
  budget,
  goalProgress,
  onEdit,
  onDelete,
  isSelected = false,
  onToggleSelection,
  onTitleClick,
}: GoalCardProps) {
  const { t, i18n } = useTranslation();
  const {
    accumulatedAmount,
    progressPercentage,
    expectedProgress,
    isOnTrack,
    monthlyContribution,
  } = goalProgress;

  const formattedStartDate = formatDisplayDate(
    budget.start_date,
    i18n.language,
  );
  const formattedTargetDate = budget.target_date
    ? formatDisplayDate(budget.target_date, i18n.language)
    : t("budgets.card.endOfMonth", { defaultValue: "End of month" });

  return (
    <Card className="border-emerald-300 dark:border-emerald-700 shadow-lg bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/10 relative">
      {onToggleSelection && (
        <div className="absolute top-4 right-4 z-50">
          <Checkbox
            checked={isSelected}
            aria-label={t("budgets.card.select", {
              name: budget.category_name,
              defaultValue: "Select budget {{name}}",
            })}
            onCheckedChange={() =>
              onToggleSelection && onToggleSelection(budget.id)
            }
            className="h-5 w-5 border-2 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle
            className="flex items-center gap-2 cursor-pointer hover:underline hover:text-emerald-600 transition-colors text-emerald-900 dark:text-emerald-100"
            onClick={onTitleClick}
          >
            <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {(budget.budget_scope || "category") !== "category" &&
            budget.budget_scope_name
              ? budget.budget_scope_name
              : budget.category_name}
            {(budget.budget_scope || "category") === "category" &&
              budget.sub_category_name && (
                <span className="text-lg font-normal text-emerald-600/70 dark:text-emerald-400/70">
                  {">"} {budget.sub_category_name}
                </span>
              )}
          </CardTitle>
          {/* On-track / Off-track badge */}
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isOnTrack
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {isOnTrack ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                {t("budgets.card.onTrack", { defaultValue: "On track" })}
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                {t("budgets.card.offTrack", { defaultValue: "Off track" })}
              </>
            )}
          </div>
        </div>
        <CardDescription className="text-emerald-700/60 dark:text-emerald-400/60">
          {t("budgets.card.goal", {
            start: formattedStartDate,
            end: formattedTargetDate,
            defaultValue: "🎯 Goal • {{start}} → {{end}}",
          })}
          {budget.goal_context && (
            <>
              <br />
              <span className="text-xs">
                {t("budgets.card.context", {
                  context: budget.goal_context,
                  defaultValue: "Context: {{context}}",
                })}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm font-medium text-emerald-800 dark:text-emerald-200">
          <span>
            {t("budgets.card.saved", {
              amount: formatCurrency(accumulatedAmount, budget.currency),
              defaultValue: "Saved: {{amount}}",
            })}
          </span>
          <span>
            {t("budgets.card.target", {
              amount: formatCurrency(budget.target_amount, budget.currency),
              defaultValue: "Target: {{amount}}",
            })}
          </span>
        </div>

        {/* Progress bar with pacing marker */}
        <div className="relative">
          <Progress
            value={progressPercentage}
            className="bg-emerald-200/50 dark:bg-emerald-900/50 h-4"
            indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500"
          />
          {/* Pacing marker – vertical line showing expected progress */}
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-800 dark:bg-white rounded-full opacity-70 transition-all duration-500"
            style={{ left: `${Math.min(expectedProgress, 100)}%` }}
            title={t("budgets.card.paceTitle", {
              percent: expectedProgress.toFixed(0),
              defaultValue: "Expected pace: {{percent}}% by today",
            })}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {t("budgets.card.pace", {
                percent: expectedProgress.toFixed(0),
                defaultValue: "Pace {{percent}}%",
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
            {t("budgets.card.complete", {
              percent: progressPercentage.toFixed(1),
              defaultValue: "{{percent}}% complete",
            })}
          </span>
          {monthlyContribution !== null && monthlyContribution > 0 && (
            <span className="text-emerald-600/70 dark:text-emerald-400/70 text-xs">
              {t("budgets.card.perMonthNeeded", {
                amount: formatCurrency(monthlyContribution, budget.currency),
                defaultValue: "~{{amount}}/mo needed",
              })}
            </span>
          )}
        </div>

        {/* Off track warning */}
        {!isOnTrack && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {t("budgets.card.behind", {
                expected: expectedProgress.toFixed(0),
                actual: progressPercentage.toFixed(0),
                defaultValue:
                  "You're behind schedule. Expected {{expected}}% but at {{actual}}%.",
              })}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              onClick={() => onEdit(budget)}
              aria-label={t("budgets.card.edit", {
                defaultValue: "Edit budget",
              })}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("budgets.card.edit", { defaultValue: "Edit budget" })}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(budget.id)}
              aria-label={t("budgets.card.delete", {
                defaultValue: "Delete budget",
              })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("budgets.card.delete", { defaultValue: "Delete budget" })}
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}

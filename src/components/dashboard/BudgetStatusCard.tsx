import { useBudgetStatus } from "@/hooks/dashboard/useBudgetStatus";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const BudgetStatusCard = () => {
  const {
    totalBudget,
    totalSpent,
    percentage,
    hasBudgets,
    isLoading,
    dailyTrends,
  } = useBudgetStatus();
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();

  const isOverBudget = percentage > 100;
  const remaining = totalBudget - totalSpent;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!hasBudgets) {
    return (
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300 h-full flex flex-col justify-center items-center text-center">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-3">
          <PlusCircle className="w-6 h-6 text-indigo-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("dashboard.budgetStatus.none", { defaultValue: "No Budgets Set" })}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4 max-w-[200px]">
          {t("dashboard.budgetStatus.noneHint", {
            defaultValue:
              "Set up spending limits to track your financial goals.",
          })}
        </p>
        <Link to="/budgets">
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
          >
            {t("dashboard.budgetStatus.create", {
              defaultValue: "Create Budget",
            })}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
      {/* Background Indicator */}
      <div className={`absolute top-0 right-0 p-2 opacity-50`}>
        {isOverBudget ? (
          <AlertTriangle className="w-12 h-12 text-rose-500/10" />
        ) : (
          <CheckCircle2 className="w-12 h-12 text-emerald-500/10" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("dashboard.budgetStatus.title", {
                defaultValue: "Budget Status",
              })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t("dashboard.budgetStatus.subtitle", {
                defaultValue: "Monthly spending vs limits",
              })}
            </p>
          </div>
          <div
            className={`text-xs font-bold px-2 py-1 rounded-full ${isOverBudget ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}
          >
            {t("dashboard.budgetStatus.used", {
              percent: percentage.toFixed(0),
              defaultValue: "{{percent}}% Used",
            })}
          </div>
        </div>

        <div className="mt-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(totalSpent)}
            </span>
            <span className="text-sm text-slate-400 font-medium">
              / {formatCurrency(totalBudget)}
            </span>
          </div>
          <p
            className={`text-xs font-medium mt-1 ${remaining < 0 ? "text-rose-500" : "text-emerald-500"}`}
          >
            {remaining < 0
              ? t("dashboard.budgetStatus.over", {
                  amount: formatCurrency(Math.abs(remaining)),
                  defaultValue: "{{amount}} over budget",
                })
              : t("dashboard.budgetStatus.remaining", {
                  amount: formatCurrency(remaining),
                  defaultValue: "{{amount}} remaining",
                })}
          </p>
        </div>

        {/* Mini Bar Chart */}
        {dailyTrends && dailyTrends.length > 0 && (
          <div className="h-32 w-full mt-4 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-slate-900 text-white text-xs p-2 shadow-xl border border-slate-700 z-50">
                          <div className="font-bold mb-1">{data.fullDate}</div>
                          {data.replenishment > 0 && (
                            <div className="text-emerald-400">
                              {t("dashboard.budgetStatus.added", {
                                amount: formatCurrency(data.replenishment),
                                defaultValue: "+{{amount}} Added",
                              })}
                            </div>
                          )}
                          {data.spending > 0 && (
                            <div className="text-rose-400">
                              {t("dashboard.budgetStatus.spent", {
                                amount: formatCurrency(data.spending),
                                defaultValue: "-{{amount}} Spent",
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="replenishment"
                  stackId="a"
                  fill="#10b981"
                  radius={[2, 2, 2, 2]}
                />
                <Bar
                  dataKey="spending"
                  stackId="b"
                  fill={isOverBudget ? "#fb7185" : "#60a5fa"}
                  radius={[2, 2, 2, 2]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-2">
        <Progress
          value={Math.min(percentage, 100)}
          className={`h-2 ${isOverBudget ? "bg-rose-100" : "bg-slate-100"}`}
          indicatorClassName={
            isOverBudget
              ? "bg-rose-500"
              : percentage > 85
                ? "bg-amber-500"
                : "bg-blue-500"
          }
        />
      </div>
    </div>
  );
};

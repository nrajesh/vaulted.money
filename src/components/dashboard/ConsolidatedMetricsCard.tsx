import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConsolidatedMetricsCardProps {
  netWorth: string;
  income: string;
  expenses: string;
}

export const ConsolidatedMetricsCard = ({
  netWorth,
  income,
  expenses,
}: ConsolidatedMetricsCardProps) => {
  const { t, i18n } = useTranslation();
  // Intl follows the app language; date-fns would always print English.
  const month = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    year: "numeric",
  }).format(new Date());
  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
        {t("dashboard.overview.title", {
          month,
          defaultValue: "Overview • {{month}}",
        })}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Net Worth */}
        <div className="flex flex-col gap-2 pt-4 md:pt-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            {t("dashboard.overview.netWorth", { defaultValue: "Net Worth" })}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {netWorth}
          </div>
        </div>

        {/* Income */}
        <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-8">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            {t("dashboard.overview.income", { defaultValue: "Income" })}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {income}
          </div>
        </div>

        {/* Expenses */}
        <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-8">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            {t("dashboard.overview.expenses", { defaultValue: "Expenses" })}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {expenses}
          </div>
        </div>
      </div>
    </div>
  );
};

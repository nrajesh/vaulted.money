import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { TransactionSearchBox } from "@/components/filters/TransactionSearchBox";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

/**
 * Common component for Search and Filtering across the app.
 * Persists state via useTransactionFilters hook.
 */
export const SearchFilterBar = () => {
  const { t } = useTranslation();
  const filters = useTransactionFilters();
  const { excludeTransfers, setExcludeTransfers, setRawSearchQuery } = filters;
  const { isFinancialPulse } = useTheme();

  const handleReset = () => {
    setRawSearchQuery("");
    filters.handleResetFilters();
  };

  return (
    <div className="w-full space-y-2">
      <TransactionSearchBox filters={filters} />

      {/* One compact row: the switch on the left, reset as an icon. */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <Switch
            id="exclude-transfers"
            checked={excludeTransfers}
            onCheckedChange={setExcludeTransfers}
            className={
              isFinancialPulse ? "data-[state=checked]:bg-indigo-500" : ""
            }
          />
          <label
            htmlFor="exclude-transfers"
            className="min-w-0 text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-300"
          >
            {t("filters.searchBar.excludeTransfers", {
              defaultValue: "Exclude Transfers",
            })}
          </label>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-9 shrink-0 px-2 text-muted-foreground sm:h-8"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t("filters.searchBar.reset", { defaultValue: "Reset" })}
        </Button>
      </div>
    </div>
  );
};

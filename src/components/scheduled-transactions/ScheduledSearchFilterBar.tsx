import * as React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { TransactionSearchBox } from "@/components/filters/TransactionSearchBox";
import { LocalFilterState } from "@/hooks/transactions/useLocalTransactionFilters";
import { useTranslation } from "react-i18next";

interface Props {
  filterState: LocalFilterState;
  targetId?: string | null;
  onClearId?: () => void;
}

/** The shared transaction search box, on the page's own filter state. */
export const ScheduledSearchFilterBar: React.FC<Props> = ({
  filterState,
  targetId,
  onClearId,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-4">
      <TransactionSearchBox
        filters={filterState}
        placeholder={t("filters.scheduled.placeholder", {
          defaultValue:
            "Search future transactions (e.g. 'Rent next month', 'Netflix')...",
        })}
      />

      <div className="flex items-center justify-end px-1 gap-2 flex-wrap">
        {targetId && (
          <div className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium animate-in fade-in zoom-in-95">
            <span>
              {t("filters.scheduled.filteredByReference", {
                defaultValue: "Filtered by Reference",
              })}
            </span>
            <button
              onClick={onClearId}
              className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">
                {t("filters.scheduled.clearReferenceFilter", {
                  defaultValue: "Clear reference filter",
                })}
              </span>
            </button>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={filterState.handleResetFilters}
          className="h-8"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          {t("filters.scheduled.reset", { defaultValue: "Reset" })}
        </Button>
      </div>
    </div>
  );
};

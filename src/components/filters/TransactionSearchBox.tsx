import * as React from "react";
import {
  ConversationalSearchInput,
  type SearchUpdateOptions,
} from "@/components/ui/ConversationalSearchInput";
import {
  ActiveFilterChips,
  type ActiveFilters,
} from "@/components/filters/ActiveFiltersDisplay";
import { useTransactions } from "@/contexts/TransactionsContext";
import { buildSearchEntities } from "@/utils/searchInterpretation";
import type { ParsedFilterState } from "@/utils/searchParser";

/** The filter state this box writes to: the global one or a page's own. */
export interface TransactionSearchFilters extends ActiveFilters {
  setExcludeTransfers: (exclude: boolean) => void;
  setRawSearchQuery: (query: string) => void;
}

interface Props {
  filters: TransactionSearchFilters;
  placeholder?: string;
}

/**
 * The one search box for transactions, used by every screen that filters them
 * (transactions, analytics, dashboard, reports, scheduled): the same parser,
 * the same "Understood as" suggestions and the same chips for what is applied.
 */
export const TransactionSearchBox = ({ filters, placeholder }: Props) => {
  const { categories, subCategories, accounts, vendors, transactions } =
    useTransactions();

  const handleUpdate = (
    update: Partial<ParsedFilterState>,
    options: SearchUpdateOptions = {},
  ) => {
    if (update.isAllTime) {
      filters.setDateRange(undefined);
    } else if (update.dateRange !== undefined) {
      filters.setDateRange(update.dateRange);
    }

    // Picking an entity adds to what is already selected.
    const merge = (current: string[] | undefined, added: string[]) =>
      Array.from(new Set([...(current ?? []), ...added]));

    if (update.selectedCategories) {
      const next = merge(filters.selectedCategories, update.selectedCategories);
      filters.setSelectedCategories(next);
      // Asking for transfers means the "exclude transfers" switch must not hide them.
      if (next.some((slug) => slug.toLowerCase().includes("transfer"))) {
        filters.setExcludeTransfers(false);
      }
    }
    if (update.selectedSubCategories) {
      filters.setSelectedSubCategories(
        merge(filters.selectedSubCategories, update.selectedSubCategories),
      );
    }
    if (update.selectedAccounts !== undefined) {
      filters.setSelectedAccounts(
        options.replaceAccounts
          ? Array.from(new Set(update.selectedAccounts))
          : merge(filters.selectedAccounts, update.selectedAccounts),
      );
    }
    if (update.selectedVendors) {
      filters.setSelectedVendors(
        merge(filters.selectedVendors, update.selectedVendors),
      );
    }

    if (update.minAmount !== undefined) filters.setMinAmount(update.minAmount);
    if (update.maxAmount !== undefined) filters.setMaxAmount(update.maxAmount);
    if (update.limit !== undefined) filters.setLimit(update.limit);
    if (update.sortOrder !== undefined) filters.setSortOrder(update.sortOrder);
    if (update.transactionType) {
      filters.setTransactionType(update.transactionType);
    }

    if (update.searchTerm !== undefined) {
      if (update.searchTerm.toLowerCase().includes("all time")) {
        filters.setDateRange(undefined);
      }
      filters.setSearchTerm(update.searchTerm);
      filters.setRawSearchQuery(update.searchTerm);
    }
  };

  // One list of names, built the way the API builds it, and stable between
  // renders because the search box memoises its parse on it. Vendors seen on
  // transactions make a payee typed a moment ago findable before it is saved.
  const entities = React.useMemo(
    () =>
      buildSearchEntities({
        accounts,
        categories,
        subCategories: subCategories ?? [],
        vendors,
        extraVendorNames: transactions.map((t) => t.vendor).filter(Boolean),
      }),
    [accounts, categories, subCategories, vendors, transactions],
  );

  return (
    <div className="w-full space-y-4">
      {/* Above the box, so what was picked shows where the eyes are, and the
          suggestion list opening below never covers it. */}
      <ActiveFilterChips filters={filters} />
      <ConversationalSearchInput
        onUpdate={handleUpdate}
        placeholder={placeholder}
        categories={entities.categories}
        subCategories={entities.subCategories}
        accounts={entities.accounts}
        vendors={entities.vendors}
      />
    </div>
  );
};

import * as React from "react";
import { ConversationalSearchInput } from "@/components/ui/ConversationalSearchInput";
import {
  ActiveFilterChips,
  type ActiveFilters,
} from "@/components/filters/ActiveFiltersDisplay";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
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

  const handleUpdate = (update: Partial<ParsedFilterState>) => {
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
        merge(filters.selectedAccounts, update.selectedAccounts),
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

  // Stable references: the search box memoises its parse on these lists.
  const categoryOptions = React.useMemo(
    () => categories.map((c) => ({ name: c.name, slug: slugify(c.name) })),
    [categories],
  );
  const subCategoryOptions = React.useMemo(() => {
    const unique = new Map<string, { name: string; slug: string }>();
    subCategories?.forEach((s) => {
      const slug = slugify(s.name);
      if (!unique.has(slug)) unique.set(slug, { name: s.name, slug });
    });
    return Array.from(unique.values());
  }, [subCategories]);
  const accountOptions = React.useMemo(
    () =>
      accounts.map((a) => ({
        name: a.name,
        slug: slugify(a.name),
        type: a.type,
      })),
    [accounts],
  );
  const vendorOptions = React.useMemo(() => {
    const unique = new Map<string, { name: string; slug: string }>();

    // Payees from the database are the reliable source.
    vendors.forEach((v) => {
      const slug = slugify(v.name);
      if (!unique.has(slug)) unique.set(slug, { name: v.name, slug });
    });

    // Vendors seen on transactions make a payee typed a moment ago findable
    // before the background sync catches up, except names that are accounts.
    const accountSlugs = new Set(accounts.map((a) => slugify(a.name)));
    transactions.forEach((t) => {
      if (!t.vendor) return;
      const slug = slugify(t.vendor);
      if (!unique.has(slug) && !accountSlugs.has(slug)) {
        unique.set(slug, { name: t.vendor, slug });
      }
    });

    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [vendors, transactions, accounts]);

  return (
    <div className="w-full space-y-4">
      <ConversationalSearchInput
        onUpdate={handleUpdate}
        placeholder={placeholder}
        categories={categoryOptions}
        subCategories={subCategoryOptions}
        accounts={accountOptions}
        vendors={vendorOptions}
      />
      <ActiveFilterChips filters={filters} />
    </div>
  );
};

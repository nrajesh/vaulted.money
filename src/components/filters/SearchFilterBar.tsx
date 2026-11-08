import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
// import { parseSearchQuery } from "@/utils/searchParser"; // No longer directly used here
import { useTransactions } from "@/contexts/TransactionsContext";
// import { NLPSearchInput } from "@/components/ui/NLPSearchInput";
import { ConversationalSearchInput } from "@/components/ui/ConversationalSearchInput";
import { ActiveFiltersDisplay } from "@/components/filters/ActiveFiltersDisplay";
import { useTheme } from "@/contexts/ThemeContext";
import { ParsedFilterState } from "@/utils/searchParser";
import { slugify } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * Common component for Search and Filtering across the app.
 * Persists state via useTransactionFilters hook.
 */
export const SearchFilterBar = () => {
  const { t } = useTranslation();
  const {
    setSearchTerm,
    setDateRange,
    setSelectedAccounts,
    selectedAccounts,
    setSelectedCategories,
    selectedCategories,
    setSelectedSubCategories,
    selectedSubCategories,
    setSelectedVendors,
    selectedVendors,
    handleResetFilters,
    excludeTransfers,
    setExcludeTransfers,
    setMinAmount,
    setMaxAmount,
    setLimit,
    setSortOrder,
    setRawSearchQuery,
    setTransactionType,
  } = useTransactionFilters();

  const { categories, subCategories, accounts, vendors, transactions } =
    useTransactions();
  const { isFinancialPulse } = useTheme();

  const handleConversationalUpdate = (update: Partial<ParsedFilterState>) => {
    // Apply updates
    if (update.isAllTime) {
      setDateRange(undefined);
    } else if (update.dateRange !== undefined) {
      setDateRange(update.dateRange);
    }

    if (update.selectedCategories) {
      // Merge unique
      const next = Array.from(
        new Set([...selectedCategories, ...update.selectedCategories]),
      );
      setSelectedCategories(next);

      // If "Transfer" category is selected (likely slug 'transfer' or 'transfers'), ensure we don't exclude them
      const hasTransfer = next.some((s) =>
        s.toLowerCase().includes("transfer"),
      );
      if (hasTransfer) {
        setExcludeTransfers(false);
      }
    }

    if (update.selectedSubCategories) {
      const next = Array.from(
        new Set([...selectedSubCategories, ...update.selectedSubCategories]),
      );
      setSelectedSubCategories(next);
    }

    if (update.selectedAccounts !== undefined) {
      // For accounts, often we want to switch context (e.g. "In Spending Account"),
      // but here "Filter by Account" implies adding logic.
      // If update.selectedAccounts is empty, it might mean "All Accounts"?
      // But the component sends specifics.
      // Let's merge for now.
      const next = Array.from(
        new Set([...(selectedAccounts || []), ...update.selectedAccounts]),
      );
      setSelectedAccounts(next);
    }

    if (update.selectedVendors) {
      const next = Array.from(
        new Set([...selectedVendors, ...update.selectedVendors]),
      );
      setSelectedVendors(next);
    }

    // Amount
    if (update.minAmount !== undefined) setMinAmount(update.minAmount);
    if (update.maxAmount !== undefined) setMaxAmount(update.maxAmount);
    if (update.limit !== undefined) setLimit(update.limit);
    if (update.sortOrder !== undefined) setSortOrder(update.sortOrder);

    // Transaction Type
    if (update.transactionType) setTransactionType(update.transactionType);

    // Search Term (Generic)
    if (update.searchTerm !== undefined) {
      const lower = update.searchTerm.toLowerCase();
      // If "all time" is requested, explicitly clear the date range filter in the context
      if (lower.includes("all time")) {
        setDateRange(undefined);
      }
      setSearchTerm(update.searchTerm);
      setRawSearchQuery(update.searchTerm); // Update raw query to match? Or generic search doesn't assume raw query history?
    }
  };

  const handleReset = () => {
    setRawSearchQuery("");
    handleResetFilters();
  };

  const aggregatedVendors = React.useMemo(() => {
    const unique = new Map();

    // 1. Add Payees from DB (usually reliable)
    vendors.forEach((v) => {
      const slug = slugify(v.name);
      if (!unique.has(slug)) {
        unique.set(slug, { name: v.name, slug });
      }
    });

    // 2. Scrape from Transactions (immediate availability strategy)
    // This ensures that even if the background DB sync is pending,
    // a user can find a vendor they just typed into a new transaction.
    transactions.forEach((t) => {
      if (t.vendor) {
        const slug = slugify(t.vendor);
        if (!unique.has(slug)) {
          // Heuristic: Exclude names that match known Accounts to prevent duplication across sections
          const isAccount = accounts.some((a) => slugify(a.name) === slug);
          if (!isAccount) {
            unique.set(slug, { name: t.vendor, slug });
          }
        }
      }
    });

    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [vendors, transactions, accounts]);

  // Stable references: the search box memoises its parse on these lists.
  const categoryOptions = React.useMemo(
    () => categories.map((c) => ({ name: c.name, slug: slugify(c.name) })),
    [categories],
  );
  const subCategoryOptions = React.useMemo(() => {
    const unique = new Map();
    subCategories?.forEach((s) => {
      const slug = slugify(s.name);
      if (!unique.has(slug)) {
        unique.set(slug, { name: s.name, slug });
      }
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

  return (
    <div className="w-full space-y-4">
      {/* Conversational / Structured Search Input */}
      <ConversationalSearchInput
        onUpdate={handleConversationalUpdate}
        categories={categoryOptions}
        subCategories={subCategoryOptions}
        accounts={accountOptions}
        vendors={aggregatedVendors}
      />

      {/* Active Filters Summary (Chips) */}
      <ActiveFiltersDisplay />

      {/* Additional Controls */}
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
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
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-9 w-full justify-center sm:h-8 sm:w-auto"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          {t("filters.searchBar.reset", { defaultValue: "Reset" })}
        </Button>
      </div>
    </div>
  );
};

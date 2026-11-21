import { slugify } from "@/lib/utils";

/** What a budget card sends to Transactions when it is tapped. */
export interface BudgetNavigationState {
  filterCategory?: string;
  filterSubCategory?: string;
  filterVendor?: string;
  filterAccount?: string;
  dateRange?: { from: string | Date; to: string | Date };
}

/** The transaction filter setters the budget navigation touches. */
export interface BudgetFilterSetters {
  setSearchTerm: (value: string) => void;
  setRawSearchQuery: (value: string) => void;
  setMinAmount: (value: number | undefined) => void;
  setMaxAmount: (value: number | undefined) => void;
  setLimit: (value: number | undefined) => void;
  setTransactionType: (value: undefined) => void;
  setSelectedCategories: (value: string[]) => void;
  setSelectedSubCategories: (value: string[]) => void;
  setSelectedVendors: (value: string[]) => void;
  setSelectedAccounts: (value: string[]) => void;
  setDateRange: (value: { from: Date; to: Date }) => void;
}

/**
 * Applies a tapped budget's scope to the transaction filters.
 *
 * The budget's transactions must start from clean filters: a search left
 * over from earlier (its text, amount limits, type or count) would otherwise
 * hide some of the budget's transactions, e.g. "over 25" hiding small ones.
 * Then exactly one scope is set (category with an optional sub-category,
 * vendor or account) and the others are cleared.
 */
export function applyBudgetNavigation(
  state: BudgetNavigationState,
  set: BudgetFilterSetters,
): void {
  const scoped =
    state.filterCategory ||
    state.filterSubCategory ||
    state.filterVendor ||
    state.filterAccount;

  if (scoped) {
    set.setSearchTerm("");
    set.setRawSearchQuery("");
    set.setMinAmount(undefined);
    set.setMaxAmount(undefined);
    set.setLimit(undefined);
    set.setTransactionType(undefined);

    if (state.filterCategory) {
      set.setSelectedCategories([slugify(state.filterCategory)]);
      set.setSelectedVendors([]);
      if (!state.filterSubCategory) set.setSelectedSubCategories([]);
      set.setSelectedAccounts([]);
    }
    if (state.filterSubCategory) {
      set.setSelectedSubCategories([slugify(state.filterSubCategory)]);
    }
    if (state.filterVendor) {
      set.setSelectedVendors([slugify(state.filterVendor)]);
      set.setSelectedCategories([]);
      set.setSelectedSubCategories([]);
      set.setSelectedAccounts([]);
    }
    if (state.filterAccount) {
      set.setSelectedAccounts([slugify(state.filterAccount)]);
      set.setSelectedCategories([]);
      set.setSelectedSubCategories([]);
      set.setSelectedVendors([]);
    }
  }

  if (state.dateRange) {
    set.setDateRange({
      from: new Date(state.dateRange.from),
      to: new Date(state.dateRange.to),
    });
  }
}

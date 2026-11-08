import { DateRange } from "react-day-picker";
import { Transaction } from "@/types/dataProvider";
import { matchesTransactionText } from "@/utils/searchFilters";
import { slugify } from "@/lib/utils";

export interface TransactionFilterState {
  searchTerm: string;
  selectedAccounts: string[];
  selectedCategories: string[];
  selectedSubCategories: string[];
  selectedVendors: string[];
  dateRange: DateRange | undefined;
  excludeTransfers?: boolean;
  minAmount?: number;
  maxAmount?: number;
  transactionType?: "income" | "expense" | undefined;
}

export const applyTransactionFilters = (
  transactions: Transaction[],
  filters: TransactionFilterState,
) => {
  let filtered = [...transactions];

  if (filters.searchTerm.trim()) {
    filtered = filtered.filter((transaction) =>
      matchesTransactionText(transaction, filters.searchTerm),
    );
  }

  if (filters.dateRange?.from) {
    const fromDate = new Date(filters.dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate < fromDate) {
        return false;
      }

      if (filters.dateRange?.to) {
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return transactionDate <= toDate;
      }

      return true;
    });
  }

  if (filters.selectedAccounts.length > 0) {
    filtered = filtered.filter((transaction) =>
      filters.selectedAccounts.includes(slugify(transaction.account)),
    );
  }

  if (filters.selectedCategories.length > 0) {
    filtered = filtered.filter((transaction) =>
      filters.selectedCategories.includes(slugify(transaction.category)),
    );
  }

  if (filters.selectedSubCategories.length > 0) {
    filtered = filtered.filter((transaction) =>
      filters.selectedSubCategories.includes(
        slugify(transaction.sub_category || ""),
      ),
    );
  }

  if (filters.selectedVendors.length > 0) {
    filtered = filtered.filter((transaction) =>
      filters.selectedVendors.includes(slugify(transaction.vendor)),
    );
  }

  if (filters.excludeTransfers) {
    filtered = filtered.filter((transaction) => {
      const category = (transaction.category || "").trim().toLowerCase();
      return category !== "transfer" && category !== "";
    });
  }

  if (filters.minAmount !== undefined) {
    filtered = filtered.filter(
      (transaction) => Math.abs(transaction.amount) >= filters.minAmount!,
    );
  }

  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter(
      (transaction) => Math.abs(transaction.amount) <= filters.maxAmount!,
    );
  }

  if (filters.transactionType === "income") {
    filtered = filtered.filter((transaction) => transaction.amount > 0);
  } else if (filters.transactionType === "expense") {
    filtered = filtered.filter((transaction) => transaction.amount < 0);
  }

  return filtered;
};

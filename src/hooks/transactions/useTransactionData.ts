import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import {
  isWithinDateRange,
  matchesTransactionText,
} from "@/utils/searchFilters";
import { projectScheduledTransactions } from "@/utils/forecasting";

import { Transaction } from "@/types/dataProvider";

interface Option {
  value: string;
  label: string;
}

interface UseTransactionDataProps {
  searchTerm: string;
  selectedAccounts: string[];
  selectedCategories: string[];
  selectedSubCategories: string[];
  selectedVendors: string[];
  dateRange: DateRange | undefined;
  availableAccountOptions: Option[];
  availableCategoryOptions: Option[];
  availableVendorOptions: Option[];
  excludeTransfers?: boolean;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  sortOrder?: "largest" | "smallest";
}

export const useTransactionData = ({
  searchTerm,
  selectedAccounts,
  selectedCategories,
  selectedSubCategories,
  selectedVendors,
  dateRange,
  availableAccountOptions,
  availableCategoryOptions,
  availableVendorOptions,
  excludeTransfers = false,
  minAmount,
  maxAmount,
  limit,
  sortOrder,
}: UseTransactionDataProps) => {
  const { transactions, scheduledTransactions } = useTransactions();

  const combinedTransactions = React.useMemo(() => {
    const projectionHorizon = new Date();
    projectionHorizon.setFullYear(projectionHorizon.getFullYear() + 1); // 1 year projection

    const projectedTransactions = projectScheduledTransactions(
      scheduledTransactions,
      new Date(),
      projectionHorizon,
    );

    // Dedup: Filter out projected transactions that have a matching REAL transaction
    // Match criteria: Same Day, Same Amount, Same Vendor (or Account if transfer)
    const validProjected = projectedTransactions.filter((p) => {
      const pDate = new Date(p.date).toISOString().split("T")[0];
      const pVendor = (p.vendor || "").toLowerCase().trim();
      const pAmount = p.amount;

      // Check if ANY real transaction matches
      const hasMatch = transactions.some((t) => {
        const tDate = new Date(t.date).toISOString().split("T")[0];
        const tVendor = (t.vendor || "").toLowerCase().trim();
        return (
          tDate === pDate &&
          Math.abs(t.amount - pAmount) < 0.01 &&
          tVendor === pVendor
        );
      });

      return !hasMatch;
    });

    return [...transactions, ...validProjected].sort(
      (a: Transaction, b: Transaction) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions, scheduledTransactions]);

  const filteredTransactions = React.useMemo(() => {
    let filtered = combinedTransactions;

    if (searchTerm) {
      filtered = filtered.filter((t) => matchesTransactionText(t, searchTerm));
    }

    if (
      selectedAccounts.length > 0 &&
      selectedAccounts.length !== availableAccountOptions.length
    ) {
      filtered = filtered.filter((t) =>
        selectedAccounts.includes(slugify(t.account)),
      );
    }

    if (
      selectedCategories.length > 0 &&
      selectedCategories.length !== availableCategoryOptions.length
    ) {
      filtered = filtered.filter((t) =>
        selectedCategories.includes(slugify(t.category)),
      );
    }

    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter((t) => {
        const subCat = t.sub_category || "uncategorized";
        const subCatSlug = slugify(subCat);
        return selectedSubCategories.includes(subCatSlug);
      });
    }

    if (
      selectedVendors.length > 0 &&
      selectedVendors.length !== availableVendorOptions.length
    ) {
      filtered = filtered.filter((t) =>
        selectedVendors.includes(slugify(t.vendor)),
      );
    }

    if (dateRange?.from) {
      filtered = filtered.filter((t) => isWithinDateRange(t.date, dateRange));
    }

    if (excludeTransfers) {
      filtered = filtered.filter((t) => {
        const isTransfer = t.category?.toLowerCase() === "transfer";
        const isBlank = !t.category || t.category.trim() === "";
        return !isTransfer && !isBlank;
      });
    }

    if (minAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) >= minAmount);
    }
    if (maxAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) <= maxAmount);
    }

    // Sorting
    if (sortOrder === "largest") {
      filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortOrder === "smallest") {
      filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    }
    // Default sort is date desc (already applied in combinedTransactions), but if filtered, order is preserved.

    // Limiting
    // IMPORTANT: sorting must happen before limiting to get the correct "top N"
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [
    combinedTransactions,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions.length,
    availableCategoryOptions.length,
    availableVendorOptions.length,
    excludeTransfers,
    minAmount,
    maxAmount,
    limit,
    sortOrder,
  ]);

  return {
    filteredTransactions,
    combinedTransactions,
    scheduledTransactions,
  };
};

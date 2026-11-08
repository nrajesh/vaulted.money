import React from "react";
import { DateRange } from "react-day-picker";

// Duplicate of the context interface but for local use
export interface LocalFilterState {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedAccounts: string[];
  setSelectedAccounts: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSubCategories: string[];
  setSelectedSubCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedVendors: string[];
  setSelectedVendors: React.Dispatch<React.SetStateAction<string[]>>;
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  excludeTransfers: boolean;
  setExcludeTransfers: React.Dispatch<React.SetStateAction<boolean>>;
  minAmount: number | undefined;
  setMinAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  maxAmount: number | undefined;
  setMaxAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  limit: number | undefined;
  setLimit: React.Dispatch<React.SetStateAction<number | undefined>>;
  sortOrder: "largest" | "smallest" | undefined;
  setSortOrder: React.Dispatch<
    React.SetStateAction<"largest" | "smallest" | undefined>
  >;
  transactionType: "income" | "expense" | undefined;
  setTransactionType: React.Dispatch<
    React.SetStateAction<"income" | "expense" | undefined>
  >;
  rawSearchQuery: string;
  setRawSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleResetFilters: () => void;
}

export const useLocalTransactionFilters = (): LocalFilterState => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [rawSearchQuery, setRawSearchQuery] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    [],
  );
  const [selectedSubCategories, setSelectedSubCategories] = React.useState<
    string[]
  >([]);
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    // from: new Date(), (Removed duplicate)
    // Actually for filters, usually we filter whatever "view" we have.
    // But for Scheduled, we probably want to see *Forward* looking.
    // User request: "Reuse the number of look ahead months setup in settings (by default 2 months)"
    // This hook just holds state. The page will set the default.
    // Let's just default to undefined here or generic.
    from: undefined,
    to: undefined,
  });
  const [excludeTransfers, setExcludeTransfers] = React.useState(false);
  const [minAmount, setMinAmount] = React.useState<number | undefined>(
    undefined,
  );
  const [maxAmount, setMaxAmount] = React.useState<number | undefined>(
    undefined,
  );
  const [limit, setLimit] = React.useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = React.useState<
    "largest" | "smallest" | undefined
  >(undefined);

  const [transactionType, setTransactionType] = React.useState<
    "income" | "expense" | undefined
  >(undefined);

  const handleResetFilters = React.useCallback(() => {
    setSearchTerm("");
    setRawSearchQuery("");
    setSelectedAccounts([]);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedVendors([]);
    setDateRange(undefined);
    setExcludeTransfers(false);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setLimit(undefined);
    setSortOrder(undefined);
    setTransactionType(undefined);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    selectedAccounts,
    setSelectedAccounts,
    selectedCategories,
    setSelectedCategories,
    selectedSubCategories,
    setSelectedSubCategories,
    selectedVendors,
    setSelectedVendors,
    dateRange,
    setDateRange,
    excludeTransfers,
    setExcludeTransfers,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    limit,
    setLimit,
    sortOrder,
    setSortOrder,
    transactionType,
    setTransactionType,
    rawSearchQuery,
    setRawSearchQuery,
    handleResetFilters,
  };
};

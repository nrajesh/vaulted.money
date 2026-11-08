import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { isOpenRangeStart } from "@/utils/searchParser";

/** The filter state the chips read and clear, shared by every search screen. */
export interface ActiveFilters {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  selectedAccounts: string[];
  setSelectedAccounts: (slugs: string[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (slugs: string[]) => void;
  selectedSubCategories: string[];
  setSelectedSubCategories: (slugs: string[]) => void;
  selectedVendors: string[];
  setSelectedVendors: (slugs: string[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  minAmount: number | undefined;
  setMinAmount: (amount: number | undefined) => void;
  maxAmount: number | undefined;
  setMaxAmount: (amount: number | undefined) => void;
  transactionType: "income" | "expense" | undefined;
  setTransactionType: (type: "income" | "expense" | undefined) => void;
  limit: number | undefined;
  setLimit: (limit: number | undefined) => void;
  sortOrder: "largest" | "smallest" | undefined;
  setSortOrder: (order: "largest" | "smallest" | undefined) => void;
}

export const ActiveFiltersDisplay = () => (
  <ActiveFilterChips filters={useTransactionFilters()} />
);

export const ActiveFilterChips = ({ filters }: { filters: ActiveFilters }) => {
  const { t, i18n } = useTranslation();
  const {
    dateRange,
    setDateRange,
    selectedAccounts,
    setSelectedAccounts,
    selectedCategories,
    setSelectedCategories,
    selectedSubCategories,
    setSelectedSubCategories,
    selectedVendors,
    setSelectedVendors,
    searchTerm,
    setSearchTerm,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    transactionType,
    setTransactionType,
    limit,
    setLimit,
    sortOrder,
    setSortOrder,
  } = filters;
  const { accounts, categories, vendors } = useTransactions();

  const chips: React.ReactNode[] = [];

  // Helper for consistency
  const renderChip = (label: string, onRemove: () => void, key: string) => (
    <Badge
      variant="secondary"
      className="flex max-w-full min-w-0 cursor-pointer items-center gap-1 hover:bg-secondary/80"
      onClick={onRemove}
      key={key}
    >
      <span className="min-w-0 truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" />
    </Badge>
  );

  // Date Range
  if (dateRange?.from) {
    const toDate = dateRange.to || dateRange.from;
    const sameYear = dateRange.from.getFullYear() === toDate.getFullYear();
    const fromStr = format(dateRange.from, sameYear ? "MMM d" : "MMM d, yyyy");
    const toStr = format(toDate, "MMM d, yyyy"); // Fallback to from if to is undefined
    const label = isOpenRangeStart(dateRange.from)
      ? t("filters.active.dateUntil", {
          date: toStr,
          defaultValue: `Date: until ${toStr}`,
        })
      : fromStr === toStr
        ? t("filters.active.dateSingle", {
            date: fromStr,
            defaultValue: `Date: ${fromStr}`,
          })
        : t("filters.active.dateRange", {
            from: fromStr,
            to: toStr,
            defaultValue: `Date: ${fromStr} - ${toStr}`,
          });
    chips.push(renderChip(label, () => setDateRange(undefined), "date-chip"));
  }

  // Accounts
  selectedAccounts.forEach((slug) => {
    const acc = accounts.find((a) => slugify(a.name) === slug);
    const name = acc
      ? acc.name
      : slug === "__no_match__"
        ? t("filters.active.noMatch", { defaultValue: "No Match" })
        : slug;
    chips.push(
      renderChip(
        t("filters.active.account", {
          name,
          defaultValue: `Account: ${name}`,
        }),
        () => {
          setSelectedAccounts(selectedAccounts.filter((s) => s !== slug));
        },
        `acc-${slug}`,
      ),
    );
  });

  // Categories
  selectedCategories.forEach((slug) => {
    const cat = categories.find((c) => slugify(c.name) === slug);
    const name = cat ? cat.name : slug;
    chips.push(
      renderChip(
        t("filters.active.category", {
          name,
          defaultValue: `Category: ${name}`,
        }),
        () => {
          setSelectedCategories(selectedCategories.filter((s) => s !== slug));
        },
        `cat-${slug}`,
      ),
    );
  });

  // Sub-Categories
  selectedSubCategories.forEach((slug) => {
    const name = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    chips.push(
      renderChip(
        t("filters.active.subCategory", {
          name,
          defaultValue: `Sub: ${name}`,
        }),
        () => {
          setSelectedSubCategories(
            selectedSubCategories.filter((s) => s !== slug),
          );
        },
        `sub-${slug}`,
      ),
    );
  });

  // Vendors
  selectedVendors.forEach((slug) => {
    const vendor = vendors.find((v) => slugify(v.name) === slug);
    const name = vendor ? vendor.name : slug;
    chips.push(
      renderChip(
        t("filters.active.vendor", {
          name,
          defaultValue: `Payee: ${name}`,
        }),
        () => {
          setSelectedVendors(selectedVendors.filter((s) => s !== slug));
        },
        `vendor-${slug}`,
      ),
    );
  });

  // Amount, income/expense and top-N: what "over 50", "expenses" and
  // "top 5" turn into, shown so they can be seen and removed like the rest.
  const formatAmount = (value: number) =>
    new Intl.NumberFormat(i18n.language).format(value);
  if (minAmount !== undefined || maxAmount !== undefined) {
    const label =
      minAmount !== undefined && minAmount === maxAmount
        ? t("filters.active.amountExact", {
            amount: formatAmount(minAmount),
            defaultValue: "Amount: {{amount}}",
          })
        : minAmount !== undefined && maxAmount !== undefined
          ? t("filters.active.amountBetween", {
              min: formatAmount(minAmount),
              max: formatAmount(maxAmount),
              defaultValue: "Amount: {{min}} to {{max}}",
            })
          : minAmount !== undefined
            ? t("filters.active.amountOver", {
                amount: formatAmount(minAmount),
                defaultValue: "Over {{amount}}",
              })
            : t("filters.active.amountUnder", {
                amount: formatAmount(maxAmount!),
                defaultValue: "Under {{amount}}",
              });
    chips.push(
      renderChip(
        label,
        () => {
          setMinAmount(undefined);
          setMaxAmount(undefined);
        },
        "amount-chip",
      ),
    );
  }
  if (transactionType) {
    chips.push(
      renderChip(
        transactionType === "income"
          ? t("filters.active.income", { defaultValue: "Income" })
          : t("filters.active.expenses", { defaultValue: "Expenses" }),
        () => setTransactionType(undefined),
        "type-chip",
      ),
    );
  }
  if (limit !== undefined) {
    chips.push(
      renderChip(
        sortOrder === "smallest"
          ? t("filters.active.smallest", {
              count: limit,
              defaultValue: "Smallest {{count}}",
            })
          : t("filters.active.largest", {
              count: limit,
              defaultValue: "Largest {{count}}",
            }),
        () => {
          setLimit(undefined);
          setSortOrder(undefined);
        },
        "limit-chip",
      ),
    );
  }

  // Search Term
  if (searchTerm) {
    chips.push(
      renderChip(
        t("filters.active.search", {
          query: searchTerm,
          defaultValue: `Search: "${searchTerm}"`,
        }),
        () => setSearchTerm(""),
        "search-term",
      ),
    );
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 text-sm px-1 items-center min-h-[32px]">
      {chips}
    </div>
  );
};

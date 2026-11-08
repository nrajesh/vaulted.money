import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { isOpenRangeStart } from "@/utils/searchParser";

export const ActiveFiltersDisplay = () => {
  const { t } = useTranslation();
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
  } = useTransactionFilters();
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

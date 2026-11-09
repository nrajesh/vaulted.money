import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilterChips, type ActiveFilters } from "./ActiveFiltersDisplay";
import { TransactionSearchBox } from "./TransactionSearchBox";

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    accounts: [{ name: "Joint Checking", type: "Checking" }],
    categories: [{ name: "Groceries" }],
    subCategories: [],
    vendors: [{ name: "Starbucks" }],
    transactions: [],
  }),
}));

afterEach(cleanup);

const filters = (over: Partial<ActiveFilters> = {}) => {
  const base = {
    dateRange: undefined,
    selectedAccounts: [] as string[],
    selectedCategories: [] as string[],
    selectedSubCategories: [] as string[],
    selectedVendors: [] as string[],
    searchTerm: "",
    minAmount: undefined,
    maxAmount: undefined,
    transactionType: undefined,
    limit: undefined,
    sortOrder: undefined,
    setDateRange: vi.fn(),
    setSelectedAccounts: vi.fn(),
    setSelectedCategories: vi.fn(),
    setSelectedSubCategories: vi.fn(),
    setSelectedVendors: vi.fn(),
    setSearchTerm: vi.fn(),
    setMinAmount: vi.fn(),
    setMaxAmount: vi.fn(),
    setTransactionType: vi.fn(),
    setLimit: vi.fn(),
    setSortOrder: vi.fn(),
    setExcludeTransfers: vi.fn(),
    setRawSearchQuery: vi.fn(),
  };
  return { ...base, ...over } as ActiveFilters & typeof base;
};

describe("applied filters row", () => {
  it("says so when nothing is applied, instead of disappearing", () => {
    render(<ActiveFilterChips filters={filters()} />);
    expect(screen.getByText("No filters applied")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Applied filters" }),
    ).toBeInTheDocument();
  });

  it("shows each filter as a chip that removes it, and drops the message", async () => {
    const f = filters({
      selectedCategories: ["groceries"],
      minAmount: 20,
      transactionType: "expense",
    });
    render(<ActiveFilterChips filters={f} />);

    expect(screen.queryByText("No filters applied")).not.toBeInTheDocument();
    expect(screen.getByText("Category: Groceries")).toBeInTheDocument();
    expect(screen.getByText("Over 20")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Category: Groceries"));
    expect(f.setSelectedCategories).toHaveBeenCalledWith([]);
  });

  it("sits above the search box, so a pick shows where the eyes are", () => {
    render(<TransactionSearchBox filters={filters()} />);
    const row = screen.getByRole("group", { name: "Applied filters" });
    const box = screen.getByRole("combobox");
    // DOCUMENT_POSITION_FOLLOWING: the search box comes after the row.
    expect(
      row.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  applyBudgetNavigation,
  type BudgetFilterSetters,
} from "./budgetNavigation";

const setters = () =>
  ({
    setSearchTerm: vi.fn(),
    setRawSearchQuery: vi.fn(),
    setMinAmount: vi.fn(),
    setMaxAmount: vi.fn(),
    setLimit: vi.fn(),
    setTransactionType: vi.fn(),
    setSelectedCategories: vi.fn(),
    setSelectedSubCategories: vi.fn(),
    setSelectedVendors: vi.fn(),
    setSelectedAccounts: vi.fn(),
    setDateRange: vi.fn(),
  }) satisfies BudgetFilterSetters;

describe("applyBudgetNavigation", () => {
  it("clears a leftover search so it cannot hide the budget's transactions", () => {
    const set = setters();
    applyBudgetNavigation({ filterCategory: "Groceries" }, set);
    expect(set.setSearchTerm).toHaveBeenCalledWith("");
    expect(set.setRawSearchQuery).toHaveBeenCalledWith("");
    expect(set.setMinAmount).toHaveBeenCalledWith(undefined);
    expect(set.setMaxAmount).toHaveBeenCalledWith(undefined);
    expect(set.setLimit).toHaveBeenCalledWith(undefined);
    expect(set.setTransactionType).toHaveBeenCalledWith(undefined);
  });

  it("scopes to a category and sub-category and clears the other scopes", () => {
    const set = setters();
    applyBudgetNavigation(
      { filterCategory: "Housing", filterSubCategory: "Mortgage" },
      set,
    );
    expect(set.setSelectedCategories).toHaveBeenCalledWith(["housing"]);
    expect(set.setSelectedSubCategories).toHaveBeenLastCalledWith(["mortgage"]);
    expect(set.setSelectedVendors).toHaveBeenCalledWith([]);
    expect(set.setSelectedAccounts).toHaveBeenCalledWith([]);
  });

  it("scopes to an account or a vendor alone", () => {
    const account = setters();
    applyBudgetNavigation({ filterAccount: "Cash Wallet" }, account);
    expect(account.setSelectedAccounts).toHaveBeenCalledWith(["cash-wallet"]);
    expect(account.setSelectedCategories).toHaveBeenCalledWith([]);

    const vendor = setters();
    applyBudgetNavigation({ filterVendor: "Amberline" }, vendor);
    expect(vendor.setSelectedVendors).toHaveBeenCalledWith(["amberline"]);
    expect(vendor.setSelectedAccounts).toHaveBeenCalledWith([]);
  });

  it("applies the budget's period", () => {
    const set = setters();
    applyBudgetNavigation(
      {
        filterCategory: "Travel",
        dateRange: { from: "2026-07-21", to: "2027-07-21" },
      },
      set,
    );
    const range = set.setDateRange.mock.calls[0][0];
    expect(range.from).toEqual(new Date("2026-07-21"));
    expect(range.to).toEqual(new Date("2027-07-21"));
  });

  it("leaves the filters alone when nothing is scoped", () => {
    const set = setters();
    applyBudgetNavigation({}, set);
    expect(set.setSearchTerm).not.toHaveBeenCalled();
    expect(set.setDateRange).not.toHaveBeenCalled();
  });
});

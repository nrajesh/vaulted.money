import { describe, expect, it } from "vitest";
import {
  filterAccounts,
  matchesSearchText,
  matchesTransactionText,
} from "../utils/searchFilters";
import { parseSearchQuery } from "../utils/searchParser";
import type { Payee } from "../components/dialogs/AddEditPayeeDialog";

const account = (over: Partial<Payee>): Payee => ({
  id: over.name ?? "x",
  name: "Account",
  is_account: true,
  created_at: "",
  account_id: null,
  currency: "EUR",
  starting_balance: 0,
  remarks: null,
  running_balance: 0,
  ...over,
});

const accounts = [
  account({ name: "Main Checking", type: "Checking", running_balance: 1500 }),
  account({
    name: "Rainy Day Savings",
    type: "Savings",
    running_balance: 8000,
  }),
  account({
    name: "Visa Card",
    type: "Credit Card",
    running_balance: -320,
    remarks: "travel",
  }),
  account({ name: "Old USD", currency: "USD", running_balance: 20 }),
];
const names = (list: Payee[]) => list.map((a) => a.name);

describe("text matching", () => {
  it("needs every word, in any order, ignoring case and accents", () => {
    expect(matchesSearchText(["Café Nero", "Dining"], "dining CAFE")).toBe(
      true,
    );
    expect(matchesSearchText(["Café Nero"], "nero tea")).toBe(false);
    expect(matchesSearchText(["anything"], "  ")).toBe(true);
  });

  it("searches vendor, category, sub-category, account and remarks", () => {
    const transaction = {
      vendor: "Starbucks",
      category: "Dining",
      sub_category: "Coffee",
      account: "Main Checking",
      remarks: "morning latte",
    };
    for (const text of ["starbucks", "coffee", "checking latte", "dining"]) {
      expect(matchesTransactionText(transaction, text)).toBe(true);
    }
    expect(matchesTransactionText(transaction, "tea")).toBe(false);
  });
});

describe("account search uses the shared parser", () => {
  it("returns everything for an empty query", () => {
    expect(filterAccounts(accounts, "  ")).toHaveLength(4);
  });

  it("filters by the sign of the balance", () => {
    expect(names(filterAccounts(accounts, "negative"))).toEqual(["Visa Card"]);
    expect(names(filterAccounts(accounts, "positive"))).toHaveLength(3);
  });

  it("filters by the size of the balance", () => {
    expect(names(filterAccounts(accounts, "> 1000"))).toEqual([
      "Main Checking",
      "Rainy Day Savings",
    ]);
    expect(names(filterAccounts(accounts, "under 100"))).toEqual(["Old USD"]);
    expect(names(filterAccounts(accounts, "between 1000 and 2000"))).toEqual([
      "Main Checking",
    ]);
    expect(names(filterAccounts(accounts, "negative over 100"))).toEqual([
      "Visa Card",
    ]);
  });

  it("understands account types, plurals and typos in names", () => {
    expect(names(filterAccounts(accounts, "savings"))).toEqual([
      "Rainy Day Savings",
    ]);
    expect(names(filterAccounts(accounts, "credit card"))).toEqual([
      "Visa Card",
    ]);
  });

  it("falls back to name, currency and remarks", () => {
    expect(names(filterAccounts(accounts, "usd"))).toEqual(["Old USD"]);
    expect(names(filterAccounts(accounts, "travel"))).toEqual(["Visa Card"]);
    expect(filterAccounts(accounts, "zzz")).toEqual([]);
  });
});

describe("what the old search handled", () => {
  it("still takes 'all time' as no date limit and keeps the other words", () => {
    const parsed = parseSearchQuery("groceries all time", {
      accounts: [],
      categories: [],
      subCategories: [],
      vendors: [],
    });
    expect(parsed.isAllTime).toBe(true);
    expect(parsed.dateRange).toBeUndefined();
    expect(parsed.searchTerm).toBe("groceries");
  });
});

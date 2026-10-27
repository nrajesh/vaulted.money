import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { TransactionsProvider, useTransactions } from "./TransactionsContext";

/*
 * Deleting a category from the Categories page goes through
 * TransactionsContext.deleteEntity: the row is hidden at once (so it can be
 * undone) and deleted for real after a delay. These tests run that path
 * against a real LocalDataProvider and check what ends up stored.
 */

const UNDO_DELAY_MS = 7000;

const provider = new LocalDataProvider();

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => provider,
}));

vi.mock("./CurrencyContext", () => ({
  useCurrency: () => ({
    convertBetweenCurrencies: (amount: number) => amount,
    selectedCurrency: "EUR",
    setCurrency: vi.fn(),
  }),
}));

vi.mock("./LedgerContext", () => ({
  useLedger: () => ({
    activeLedger: { id: "home", name: "Home", currency: "EUR" },
    refreshLedgers: vi.fn(),
  }),
}));

vi.mock("@/hooks/useContinuitySync", () => ({
  useContinuitySync: () => ({ triggerExport: vi.fn() }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <TransactionsProvider>{children}</TransactionsProvider>
  </QueryClientProvider>
);

/** Gives a ledger Food/Bread records of every kind that stores the names. */
const seed = async (ledgerId: string) => {
  await provider.addTransaction({
    user_id: ledgerId,
    date: "2026-01-15",
    amount: -4,
    currency: "EUR",
    account: "Checking",
    vendor: "Bakery",
    category: "Food",
    sub_category: "Bread",
  });
  // Far in the future, so the provider does not post it on mount.
  await provider.addScheduledTransaction({
    user_id: ledgerId,
    date: "2099-01-01",
    amount: -4,
    currency: "EUR",
    account: "Checking",
    vendor: "Bakery",
    category: "Food",
    sub_category: "Bread",
    frequency: "Monthly",
  });
  const [category] = await provider.getUserCategories(ledgerId);
  for (const budget of [
    {
      budget_scope: "category" as const,
      category_id: category.id,
      category_name: "Food",
    },
    {
      budget_scope: "sub_category" as const,
      category_id: "",
      category_name: "Bread",
      budget_scope_name: "Bread",
    },
  ]) {
    await provider.addBudget({
      user_id: ledgerId,
      target_amount: 40,
      currency: "EUR",
      start_date: "2026-01-01T00:00:00.000Z",
      end_date: null,
      frequency: "Monthly",
      ...budget,
    });
  }
  return category;
};

const ledgerContents = async (ledgerId: string) => ({
  categories: (await provider.getUserCategories(ledgerId)).length,
  subCategories: (await provider.getSubCategories(ledgerId)).length,
  scheduled: (await provider.getScheduledTransactions(ledgerId)).length,
  budgets: (await provider.getBudgetsWithSpending(ledgerId)).length,
  transactions: (await provider.getTransactions(ledgerId)).length,
});

describe("TransactionsContext deleteEntity for categories", () => {
  beforeEach(async () => {
    await db.open();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
    // Fake only the undo timer; time still advances so IndexedDB keeps working.
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout"],
      shouldAdvanceTime: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("removes the category's sub-categories, recurring transactions and budgets in the active ledger only", async () => {
    const food = await seed("home");
    await seed("other");
    const { result } = renderHook(() => useTransactions(), { wrapper });

    act(() => {
      result.current.deleteEntity("category", [food.id]);
    });
    await act(() => vi.advanceTimersByTimeAsync(UNDO_DELAY_MS));

    await waitFor(async () =>
      expect(await ledgerContents("home")).toEqual({
        categories: 0,
        subCategories: 0,
        scheduled: 0,
        budgets: 0,
        transactions: 1,
      }),
    );
    expect(await ledgerContents("other")).toEqual({
      categories: 1,
      subCategories: 1,
      scheduled: 1,
      budgets: 2,
      transactions: 1,
    });
  });
});

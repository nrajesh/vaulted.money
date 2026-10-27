import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { showError } from "@/utils/toast";
import { useCategoryManagement } from "./useCategoryManagement";

/*
 * The sub-category dialog's rename and delete, run against a real
 * LocalDataProvider so the tests check what ends up stored.
 */

const provider = new LocalDataProvider();

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => provider,
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    categories: [],
    subCategories: [],
    isLoadingCategories: false,
    refetchCategories: vi.fn(),
    invalidateAllData: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn(),
  }),
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ activeLedger: { id: "home", name: "Home" } }),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));

vi.mock("@/utils/toast", () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

/** Gives a ledger a Food/Bread transaction, recurring transaction and budget. */
const seed = async (ledgerId: string) => {
  const transaction = await provider.addTransaction({
    user_id: ledgerId,
    date: "2026-01-15",
    amount: -4,
    currency: "EUR",
    account: "Checking",
    vendor: "Bakery",
    category: "Food",
    sub_category: "Bread",
  });
  const scheduled = await provider.addScheduledTransaction({
    user_id: ledgerId,
    date: "2026-02-01",
    amount: -4,
    currency: "EUR",
    account: "Checking",
    vendor: "Bakery",
    category: "Food",
    sub_category: "Bread",
    frequency: "Monthly",
  });
  await provider.addBudget({
    user_id: ledgerId,
    category_id: "",
    category_name: "Bread",
    budget_scope: "sub_category",
    budget_scope_name: "Bread",
    target_amount: 40,
    currency: "EUR",
    start_date: "2026-01-01T00:00:00.000Z",
    end_date: null,
    frequency: "Monthly",
  });
  const [category] = await provider.getUserCategories(ledgerId);
  return { transaction, scheduled, category };
};

const storedNames = async (
  ledgerId: string,
  ids: { transaction: { id: string }; scheduled: { id: string } },
) => ({
  transaction: (await provider.getTransactionById(ids.transaction.id))
    ?.sub_category,
  scheduled: (await provider.getScheduledTransactionById(ids.scheduled.id))
    ?.sub_category,
  budgets: (await provider.getBudgetsWithSpending(ledgerId)).map(
    (budget) => budget.budget_scope_name,
  ),
  subCategories: (await provider.getSubCategories(ledgerId)).map(
    (sub) => sub.name,
  ),
});

describe("useCategoryManagement sub-category rename and delete", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.open();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
  });

  it("renames a sub-category in the active ledger's records only", async () => {
    const home = await seed("home");
    const other = await seed("other");
    const { result } = renderHook(() => useCategoryManagement(), { wrapper });

    await result.current.renameSubCategoryMutation.mutateAsync({
      categoryId: home.category.id,
      categoryName: "Food",
      oldSubCategoryName: "Bread",
      newSubCategoryName: "Pastry",
    });

    expect(await storedNames("home", home)).toEqual({
      transaction: "Pastry",
      scheduled: "Pastry",
      budgets: ["Pastry"],
      subCategories: ["Pastry"],
    });
    expect(await storedNames("other", other)).toEqual({
      transaction: "Bread",
      scheduled: "Bread",
      budgets: ["Bread"],
      subCategories: ["Bread"],
    });
  });

  it("deletes a sub-category from the active ledger's records only", async () => {
    const home = await seed("home");
    const other = await seed("other");
    const { result } = renderHook(() => useCategoryManagement(), { wrapper });

    await result.current.deleteSubCategoryMutation.mutateAsync({
      categoryId: home.category.id,
      categoryName: "Food",
      subCategoryName: "Bread",
    });

    expect(await storedNames("home", home)).toEqual({
      transaction: null,
      scheduled: null,
      budgets: [],
      subCategories: [],
    });
    expect(await storedNames("other", other)).toEqual({
      transaction: "Bread",
      scheduled: "Bread",
      budgets: ["Bread"],
      subCategories: ["Bread"],
    });
  });

  it("reports a name the category already has instead of creating a duplicate", async () => {
    const home = await seed("home");
    await provider.addTransaction({
      user_id: "home",
      date: "2026-01-16",
      amount: -6,
      currency: "EUR",
      account: "Checking",
      vendor: "Deli",
      category: "Food",
      sub_category: "Cheese",
    });
    const { result } = renderHook(() => useCategoryManagement(), { wrapper });

    await expect(
      result.current.renameSubCategoryMutation.mutateAsync({
        categoryId: home.category.id,
        categoryName: "Food",
        oldSubCategoryName: "Bread",
        newSubCategoryName: "Cheese",
      }),
    ).rejects.toThrow(
      'Category "Food" already has a sub-category named "Cheese"',
    );

    expect(showError).toHaveBeenCalledWith(
      expect.stringContaining('already has a sub-category named "Cheese"'),
    );
    expect((await storedNames("home", home)).subCategories.sort()).toEqual([
      "Bread",
      "Cheese",
    ]);
  });
});

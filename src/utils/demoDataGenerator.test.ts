import { describe, it, expect, vi } from "vitest";
import { generateDiverseDemoData } from "./demoDataGenerator";
import { DataProvider } from "@/types/dataProvider";

function createMockProvider(): DataProvider {
  let ledgerCounter = 0;
  let scheduleCounter = 0;
  const ledgers: { id: string; name: string }[] = [];

  return {
    getLedgers: vi.fn().mockResolvedValue([]),
    addLedger: vi.fn().mockImplementation(async (ledger) => {
      const id = `ledger-${++ledgerCounter}`;
      ledgers.push({ id, name: ledger.name });
      return {
        ...ledger,
        id,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      };
    }),
    updateLedger: vi.fn().mockResolvedValue(undefined),
    deleteLedger: vi.fn().mockResolvedValue(undefined),
    getTransactions: vi.fn().mockResolvedValue([]),
    addTransaction: vi.fn().mockResolvedValue({}),
    addMultipleTransactions: vi.fn().mockResolvedValue([]),
    updateTransaction: vi.fn().mockResolvedValue(undefined),
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    deleteMultipleTransactions: vi.fn().mockResolvedValue(undefined),
    deleteTransactionByTransferId: vi.fn().mockResolvedValue(undefined),
    clearTransactions: vi.fn().mockResolvedValue(undefined),
    clearBudgets: vi.fn().mockResolvedValue(undefined),
    clearScheduledTransactions: vi.fn().mockResolvedValue(undefined),
    getScheduledTransactions: vi.fn().mockResolvedValue([]),
    addScheduledTransaction: vi.fn().mockImplementation(async () => ({
      id: `schedule-${++scheduleCounter}`,
    })),
    updateScheduledTransaction: vi.fn().mockResolvedValue(undefined),
    deleteScheduledTransaction: vi.fn().mockResolvedValue(undefined),
    deleteMultipleScheduledTransactions: vi.fn().mockResolvedValue(undefined),
    ensurePayeeExists: vi.fn().mockResolvedValue("payee-id"),
    checkIfPayeeIsAccount: vi.fn().mockResolvedValue(false),
    getAccountCurrency: vi.fn().mockResolvedValue("USD"),
    getAllVendors: vi.fn().mockResolvedValue([]),
    getVendorByName: vi.fn().mockResolvedValue(undefined),
    mergePayees: vi.fn().mockResolvedValue(undefined),
    deletePayee: vi.fn().mockResolvedValue(undefined),
    getAllAccounts: vi.fn().mockResolvedValue([]),
    ensureCategoryExists: vi.fn().mockResolvedValue("cat-id"),
    ensureSubCategoryExists: vi.fn().mockResolvedValue("sub-cat-id"),
    getUserCategories: vi.fn().mockResolvedValue([]),
    getSubCategories: vi.fn().mockResolvedValue([]),
    mergeCategories: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    getBudgetsWithSpending: vi.fn().mockResolvedValue([]),
    addBudget: vi.fn().mockResolvedValue(undefined),
    updateBudget: vi.fn().mockResolvedValue(undefined),
    deleteBudget: vi.fn().mockResolvedValue(undefined),
    linkTransactionsAsTransfer: vi.fn().mockResolvedValue(undefined),
    unlinkTransactions: vi.fn().mockResolvedValue(undefined),
    clearAllData: vi.fn().mockResolvedValue(undefined),
    exportData: vi.fn().mockResolvedValue({}),
    importData: vi.fn().mockResolvedValue(undefined),
    getAIProviders: vi.fn().mockResolvedValue([]),
    addAIProvider: vi.fn().mockResolvedValue({}),
    updateAIProvider: vi.fn().mockResolvedValue(undefined),
    deleteAIProvider: vi.fn().mockResolvedValue(undefined),
    setDefaultAIProvider: vi.fn().mockResolvedValue(undefined),
  } as unknown as DataProvider;
}

describe("generateDiverseDemoData", () => {
  const NOW = new Date(2029, 2, 14, 18, 0);
  const run = async () => {
    const provider = createMockProvider();
    const progress: number[] = [];
    await generateDiverseDemoData(provider, (p) => progress.push(p.progress), {
      now: NOW,
      seed: 3,
    });
    const transactions = vi
      .mocked(provider.addMultipleTransactions)
      .mock.calls.flatMap(([batch]) => batch);
    return { provider, progress, transactions };
  };

  it("clears everything first, then creates the four ledgers", async () => {
    const { provider } = await run();
    expect(provider.clearAllData).toHaveBeenCalledOnce();
    const order = [
      vi.mocked(provider.clearAllData).mock.invocationCallOrder[0],
      vi.mocked(provider.addLedger).mock.invocationCallOrder[0],
    ];
    expect(order[0]).toBeLessThan(order[1]);
    expect(
      vi.mocked(provider.addLedger).mock.calls.map(([l]) => l.name),
    ).toEqual(["Home Budget", "Child Budget", "Offshore", "Freelance Studio"]);
  });

  it("measures history back from the given date, not from fixed years", async () => {
    const { transactions } = await run();
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const years = (NOW.getTime() - Math.min(...dates)) / (365.25 * 86_400_000);
    expect(years).toBeGreaterThan(4.5);
    expect(Math.max(...dates)).toBeLessThanOrEqual(NOW.getTime());
    expect(new Date(Math.min(...dates)).getFullYear()).toBeLessThanOrEqual(
      2024,
    );
  });

  it("saves transactions in batches, each tied to its ledger", async () => {
    const { provider, transactions } = await run();
    const batches = vi.mocked(provider.addMultipleTransactions).mock.calls;
    expect(batches.length).toBeGreaterThan(20);
    for (const [batch] of batches)
      expect(batch.length).toBeLessThanOrEqual(250);
    for (const t of transactions) {
      expect(t.user_id).toMatch(/^ledger-\d$/);
      expect("scheduleKey" in t).toBe(false);
    }
  });

  it("points schedule-generated transactions at the schedule that made them", async () => {
    const { provider, transactions } = await run();
    const scheduleIds = new Set(
      vi
        .mocked(provider.addScheduledTransaction)
        .mock.results.map((_, i) => `schedule-${i + 1}`),
    );
    const origins = transactions.filter((t) => t.is_scheduled_origin);
    expect(origins.length).toBeGreaterThan(500);
    for (const t of origins)
      expect(scheduleIds.has(t.recurrence_id!)).toBe(true);
  });

  it("stores budgets the way the Budgets dialog does", async () => {
    const { provider } = await run();
    const budgets = vi.mocked(provider.addBudget).mock.calls.map(([b]) => b);
    expect(budgets.length).toBeGreaterThan(20);
    const account = budgets.find((b) => b.budget_scope === "account")!;
    expect(account.category_id).toBe("");
    const category = budgets.find(
      (b) => (b.budget_scope ?? "category") === "category",
    )!;
    expect(category.category_id).toBe("cat-id");
  });

  it("reports steadily increasing progress that only reaches 100 at the end", async () => {
    const { progress } = await run();
    for (let i = 1; i < progress.length; i++) {
      expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1]);
    }
    expect(progress[progress.length - 1]).toBe(100);
    expect(progress.filter((p) => p === 100)).toHaveLength(1);
  });
});

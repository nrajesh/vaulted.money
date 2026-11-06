import type {
  Budget,
  DataProvider,
  ScheduledTransaction,
  Transaction,
} from "@/types/dataProvider";
import { buildDemoPlan, type DemoLedgerPlan } from "./demoDataPlan";

export interface ProgressCallback {
  (progress: { stage: string; progress: number; totalStages: number }): void;
}

export interface DemoDataOptions {
  /** The moment history is measured back from. Defaults to the current time. */
  now?: Date;
  /** Fixes the random variation; defaults to a fresh one on every run. */
  seed?: number;
}

/** Batches DB writes so IndexedDB work is visible in the UI progress bar. */
const TRANSACTION_INSERT_BATCH_SIZE = 250;

/**
 * Wipes the app and writes four demo ledgers (personal, family, cross-border
 * and freelance). What the ledgers contain is decided by `buildDemoPlan`; this
 * function only saves it. Every date is relative to `options.now`, so the
 * history always ends today no matter when the button is clicked.
 */
export const generateDiverseDemoData = async (
  dataProvider: DataProvider,
  onProgress: ProgressCallback,
  options: DemoDataOptions = {},
) => {
  const now = options.now ?? new Date();
  const seed = options.seed ?? Date.now() ^ Math.floor(Math.random() * 1e9);
  const plans = buildDemoPlan(now, seed);

  // Progress is counted in saved records, so the bar moves with real work.
  const totalWork =
    1 +
    plans.reduce(
      (sum, plan) =>
        sum +
        1 +
        plan.accounts.length +
        Object.keys(plan.categories).length +
        plan.scheduled.length +
        plan.budgets.length +
        Math.ceil(plan.transactions.length / TRANSACTION_INSERT_BATCH_SIZE),
      0,
    );
  let done = 0;
  const step = (stage: string, units = 1) => {
    done += units;
    onProgress({
      stage,
      progress: Math.min(99, Math.floor((done / totalWork) * 99)),
      totalStages: 100,
    });
  };

  onProgress({
    stage: "Clearing existing data...",
    progress: 0,
    totalStages: 100,
  });
  await dataProvider.clearAllData();
  step("Existing data cleared");

  for (const plan of plans) {
    await saveLedger(dataProvider, plan, step);
  }

  onProgress({
    stage: "Demo data ready — reloading…",
    progress: 100,
    totalStages: 100,
  });
};

async function saveLedger(
  dataProvider: DataProvider,
  plan: DemoLedgerPlan,
  step: (stage: string, units?: number) => void,
) {
  const name = plan.ledger.name;
  const ledger = await dataProvider.addLedger({ ...plan.ledger });
  const ledgerId = ledger.id;
  step(`Created ledger: ${name}`);

  for (const account of plan.accounts) {
    await dataProvider.ensurePayeeExists(account.name, true, ledgerId, {
      currency: account.currency,
      startingBalance: account.startingBalance,
      type: account.type,
      creditLimit: account.creditLimit,
      remarks: account.remarks,
    });
    step(`${name}: account ${account.name}`);
  }

  const categoryIds = new Map<string, string>();
  for (const [category, subCategories] of Object.entries(plan.categories)) {
    const categoryId = await dataProvider.ensureCategoryExists(
      category,
      ledgerId,
    );
    if (categoryId) {
      categoryIds.set(category, categoryId);
      for (const sub of subCategories) {
        await dataProvider.ensureSubCategoryExists(sub, categoryId, ledgerId);
      }
    }
    step(`${name}: category ${category}`);
  }

  // Vendors are created from the names the transactions actually use, plus a
  // few with no activity so "Cleanup Unused" has something to find.
  const accountNames = new Set(plan.accounts.map((a) => a.name));
  const vendorNames = new Set<string>(plan.unusedVendors);
  for (const t of plan.transactions) vendorNames.add(t.vendor);
  for (const s of plan.scheduled) vendorNames.add(s.vendor);
  for (const vendor of vendorNames) {
    if (!accountNames.has(vendor)) {
      await dataProvider.ensurePayeeExists(vendor, false, ledgerId);
    }
  }

  // Schedules first, so transactions they produced can point back at them.
  const scheduleIds = new Map<string, string>();
  for (const { key, ...schedule } of plan.scheduled) {
    const created = await dataProvider.addScheduledTransaction({
      ...schedule,
      user_id: ledgerId,
    } as Omit<ScheduledTransaction, "id" | "created_at">);
    if (created?.id) scheduleIds.set(key, created.id);
    step(`${name}: scheduled ${schedule.remarks ?? schedule.vendor}`);
  }

  for (
    let offset = 0;
    offset < plan.transactions.length;
    offset += TRANSACTION_INSERT_BATCH_SIZE
  ) {
    const batch = plan.transactions
      .slice(offset, offset + TRANSACTION_INSERT_BATCH_SIZE)
      .map(({ scheduleKey, ...t }) => ({
        ...t,
        user_id: ledgerId,
        recurrence_id: scheduleKey
          ? (scheduleIds.get(scheduleKey) ?? null)
          : null,
      }));
    await dataProvider.addMultipleTransactions(
      batch as Omit<Transaction, "id" | "created_at">[],
    );
    step(
      `${name}: saving transactions (${Math.min(
        offset + TRANSACTION_INSERT_BATCH_SIZE,
        plan.transactions.length,
      )}/${plan.transactions.length})`,
    );
  }

  for (const budget of plan.budgets) {
    // Non-category scopes keep the entity name as the display name and carry no
    // category id, exactly as the Budgets dialog stores them.
    const scope = budget.budget_scope ?? "category";
    const categoryId =
      scope === "category" ? (categoryIds.get(budget.category_name) ?? "") : "";
    await dataProvider.addBudget({
      ...budget,
      user_id: ledgerId,
      category_id: categoryId,
    } as Omit<Budget, "id" | "spent_amount">);
    step(`${name}: budget ${budget.category_name}`);
  }
}

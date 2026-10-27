import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/dexieDB";
import {
  NameConflictError,
  type BackupConfig,
  type Budget,
  type DataProvider,
  type Transaction,
} from "@/types/dataProvider";
import { LocalDataProvider } from "./LocalDataProvider";

/*
 * Behaviour that production code relies on from a DataProvider.
 *
 * These tests only call the DataProvider interface and never inspect Dexie
 * directly, so they can run against another storage backend by swapping
 * `createProvider` and `resetStorage`. Dexie is used here only to empty the
 * database between tests.
 */
const createProvider = (): DataProvider => new LocalDataProvider();

const resetStorage = async () => {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
};

const LEDGER = "ledger-1";

const newTransaction = (
  overrides: Partial<Omit<Transaction, "id" | "created_at">> = {},
): Omit<Transaction, "id" | "created_at"> => ({
  user_id: LEDGER,
  date: "2026-01-15",
  amount: -10,
  currency: "EUR",
  account: "Checking",
  vendor: "Bakery",
  category: "Food",
  ...overrides,
});

const OTHER_LEDGER = "ledger-2";

/**
 * Seeds a ledger with one of every record that stores a name: a transaction
 * and a recurring transaction for Checking / Bakery / Food / Bread, and a
 * budget for each scope. Budgets follow the app's storage convention: only
 * category budgets carry a category id, while vendor, account and
 * sub-category budgets keep the name in `budget_scope_name` and
 * `category_name`. Seeding two ledgers gives them identical names, so tests
 * can check that a change in one leaves the other untouched.
 */
const seedLedger = async (provider: DataProvider, ledgerId: string) => {
  const transaction = await provider.addTransaction(
    newTransaction({ user_id: ledgerId, sub_category: "Bread" }),
  );
  const scheduled = await provider.addScheduledTransaction({
    user_id: ledgerId,
    date: "2026-02-01",
    amount: -10,
    currency: "EUR",
    account: "Checking",
    vendor: "Bakery",
    category: "Food",
    sub_category: "Bread",
    frequency: "Monthly",
  });
  const vendor = (await provider.getVendorByName("Bakery", ledgerId))!;
  const account = (await provider.getVendorByName("Checking", ledgerId))!;
  const [category] = await provider.getUserCategories(ledgerId);
  const [subCategory] = await provider.getSubCategories(ledgerId);

  const addBudget = (fields: Partial<Omit<Budget, "id" | "spent_amount">>) =>
    provider.addBudget({
      user_id: ledgerId,
      category_id: "",
      category_name: "",
      target_amount: 100,
      currency: "EUR",
      start_date: "2026-01-01T00:00:00.000Z",
      end_date: null,
      frequency: "Monthly",
      ...fields,
    });
  await addBudget({
    budget_scope: "category",
    category_id: category.id,
    category_name: "Food",
  });
  await addBudget({
    budget_scope: "category",
    category_id: category.id,
    category_name: "Food",
    sub_category_id: subCategory.id,
    sub_category_name: "Bread",
  });
  for (const [scope, name] of [
    ["sub_category", "Bread"],
    ["vendor", "Bakery"],
    ["account", "Checking"],
  ] as const) {
    await addBudget({
      budget_scope: scope,
      budget_scope_name: name,
      category_name: name,
    });
  }

  return { transaction, scheduled, vendor, account, category, subCategory };
};

/**
 * Adds near-duplicates of the seeded names to a ledger, as a merge would find
 * them: account "Current", vendor "Bakery Ltd" and category "Groceries" (with
 * sub-categories Bread, which Food also has, and Fruit), each with a
 * transaction, a recurring transaction and budgets.
 */
const seedDuplicates = async (provider: DataProvider, ledgerId: string) => {
  const duplicateNames = {
    user_id: ledgerId,
    account: "Current",
    vendor: "Bakery Ltd",
    category: "Groceries",
  };
  const transaction = await provider.addTransaction(
    newTransaction({ ...duplicateNames, sub_category: "Bread" }),
  );
  const fruitTransaction = await provider.addTransaction(
    newTransaction({ ...duplicateNames, sub_category: "Fruit" }),
  );
  const scheduled = await provider.addScheduledTransaction({
    ...duplicateNames,
    date: "2026-02-01",
    amount: -10,
    currency: "EUR",
    frequency: "Monthly",
  });
  const groceries = (await provider.getUserCategories(ledgerId)).find(
    ({ name }) => name === "Groceries",
  )!;
  const fruit = (await provider.getSubCategories(ledgerId)).find(
    ({ name }) => name === "Fruit",
  )!;

  const budget = {
    user_id: ledgerId,
    target_amount: 100,
    currency: "EUR",
    start_date: "2026-01-01T00:00:00.000Z",
    end_date: null,
    frequency: "Monthly" as const,
  };
  await provider.addBudget({
    ...budget,
    budget_scope: "category",
    category_id: groceries.id,
    category_name: "Groceries",
  });
  await provider.addBudget({
    ...budget,
    budget_scope: "category",
    category_id: groceries.id,
    category_name: "Groceries",
    sub_category_id: fruit.id,
    sub_category_name: "Fruit",
  });
  for (const [scope, name] of [
    ["vendor", "Bakery Ltd"],
    ["account", "Current"],
  ] as const) {
    await provider.addBudget({
      ...budget,
      budget_scope: scope,
      budget_scope_name: name,
      category_id: "",
      category_name: name,
    });
  }

  return { transaction, fruitTransaction, scheduled };
};

/** Display names of a ledger's budgets of one scope, sorted. */
const budgetNames = async (
  provider: DataProvider,
  ledgerId: string,
  scope: NonNullable<Budget["budget_scope"]>,
) =>
  (await provider.getBudgetsWithSpending(ledgerId))
    .filter((budget) => budget.budget_scope === scope)
    .map((budget) => budget.category_name)
    .sort();

/** Everything a ledger holds, for "this ledger did not change" checks. */
const snapshotLedger = async (provider: DataProvider, ledgerId: string) => ({
  transactions: await provider.getTransactions(ledgerId),
  scheduled: await provider.getScheduledTransactions(ledgerId),
  budgets: await provider.getBudgetsWithSpending(ledgerId),
  vendors: await provider.getAllVendors(ledgerId),
  accounts: await provider.getAllAccounts(ledgerId),
  categories: await provider.getUserCategories(ledgerId),
  subCategories: await provider.getSubCategories(ledgerId),
});

type BudgetKind =
  "category" | "category+sub_category" | "sub_category" | "vendor" | "account";

const budgetFor = async (
  provider: DataProvider,
  ledgerId: string,
  kind: BudgetKind,
) =>
  (await provider.getBudgetsWithSpending(ledgerId)).find((budget) => {
    if (kind === "category") {
      return budget.budget_scope === "category" && !budget.sub_category_id;
    }
    if (kind === "category+sub_category") {
      return budget.budget_scope === "category" && !!budget.sub_category_id;
    }
    return budget.budget_scope === kind;
  });

const budgetScopes = async (provider: DataProvider, ledgerId: string) =>
  (await provider.getBudgetsWithSpending(ledgerId))
    .map((budget) => budget.budget_scope)
    .sort();

const newBackupConfig = (
  overrides: Partial<BackupConfig> = {},
): BackupConfig => ({
  id: "backup-1",
  frequency: 86_400_000,
  isActive: true,
  nextBackup: "2026-01-02T00:00:00.000Z",
  ...overrides,
});

describe("DataProvider contract", () => {
  let provider: DataProvider;

  beforeEach(async () => {
    await resetStorage();
    provider = createProvider();
  });

  describe("lookups by id", () => {
    it("returns a transaction by id, or undefined when it does not exist", async () => {
      const created = await provider.addTransaction(newTransaction());

      expect(await provider.getTransactionById(created.id)).toMatchObject({
        id: created.id,
        vendor: "Bakery",
        user_id: LEDGER,
      });
      expect(await provider.getTransactionById("missing")).toBeUndefined();
    });

    it("returns a scheduled transaction by id, or undefined when it does not exist", async () => {
      const created = await provider.addScheduledTransaction({
        user_id: LEDGER,
        date: "2026-02-01",
        amount: -50,
        currency: "EUR",
        account: "Checking",
        vendor: "Landlord",
        category: "Housing",
        frequency: "Monthly",
      });

      expect(
        await provider.getScheduledTransactionById(created.id),
      ).toMatchObject({ id: created.id, vendor: "Landlord" });
      expect(
        await provider.getScheduledTransactionById("missing"),
      ).toBeUndefined();
    });
  });

  describe("transfers", () => {
    it("links both legs with the transfer id the caller supplies", async () => {
      const outgoing = await provider.addTransaction(
        newTransaction({ amount: -25, account: "Checking", vendor: "Savings" }),
      );
      const incoming = await provider.addTransaction(
        newTransaction({ amount: 25, account: "Savings", vendor: "Checking" }),
      );

      await provider.linkTransactionsAsTransfer(
        outgoing.id,
        incoming.id,
        "transfer-1",
      );

      expect(
        (await provider.getTransactionById(outgoing.id))?.transfer_id,
      ).toBe("transfer-1");
      expect(
        (await provider.getTransactionById(incoming.id))?.transfer_id,
      ).toBe("transfer-1");
    });

    it("generates a shared transfer id when the caller supplies none", async () => {
      const outgoing = await provider.addTransaction(newTransaction());
      const incoming = await provider.addTransaction(
        newTransaction({ amount: 10 }),
      );

      await provider.linkTransactionsAsTransfer(outgoing.id, incoming.id);

      const outgoingTransferId = (
        await provider.getTransactionById(outgoing.id)
      )?.transfer_id;
      expect(outgoingTransferId).toEqual(expect.any(String));
      expect(
        (await provider.getTransactionById(incoming.id))?.transfer_id,
      ).toBe(outgoingTransferId);
    });

    it("lists every leg of a transfer, and nothing for an unknown transfer", async () => {
      const outgoing = await provider.addTransaction(newTransaction());
      const incoming = await provider.addTransaction(
        newTransaction({ amount: 10 }),
      );
      await provider.addTransaction(newTransaction({ vendor: "Unrelated" }));
      await provider.linkTransactionsAsTransfer(
        outgoing.id,
        incoming.id,
        "transfer-1",
      );

      const legs = await provider.getTransactionsByTransferId("transfer-1");

      expect(legs.map((leg) => leg.id).sort()).toEqual(
        [outgoing.id, incoming.id].sort(),
      );
      expect(await provider.getTransactionsByTransferId("missing")).toEqual([]);
    });
  });

  describe("renaming vendors and accounts", () => {
    it("renames a vendor everywhere the ledger stores its name", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.renamePayee(home.vendor.id, "Boulangerie");

      expect(await provider.getVendorByName("Bakery", LEDGER)).toBeUndefined();
      expect(
        await provider.getVendorByName("Boulangerie", LEDGER),
      ).toMatchObject({ id: home.vendor.id });
      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ vendor: "Boulangerie" });
      expect(
        await provider.getScheduledTransactionById(home.scheduled.id),
      ).toMatchObject({ vendor: "Boulangerie" });
      expect(await budgetFor(provider, LEDGER, "vendor")).toMatchObject({
        budget_scope_name: "Boulangerie",
        category_name: "Boulangerie",
      });
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("renames an account in the transactions, schedules and budgets that use it", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.renamePayee(home.account.id, "Current");

      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ account: "Current" });
      expect(
        await provider.getScheduledTransactionById(home.scheduled.id),
      ).toMatchObject({ account: "Current" });
      expect(await budgetFor(provider, LEDGER, "account")).toMatchObject({
        budget_scope_name: "Current",
        category_name: "Current",
      });
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("refuses a name another vendor or account in the ledger already has, and changes nothing", async () => {
      const home = await seedLedger(provider, LEDGER);
      const before = await snapshotLedger(provider, LEDGER);

      await expect(
        provider.renamePayee(home.vendor.id, "Checking"),
      ).rejects.toBeInstanceOf(NameConflictError);
      expect(await snapshotLedger(provider, LEDGER)).toEqual(before);
    });

    it("allows a name that is only used in another ledger", async () => {
      const home = await seedLedger(provider, LEDGER);
      await provider.addTransaction(
        newTransaction({ user_id: OTHER_LEDGER, vendor: "Patisserie" }),
      );

      await provider.renamePayee(home.vendor.id, "Patisserie");

      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ vendor: "Patisserie" });
    });

    it("rejects a blank name and a vendor that does not exist", async () => {
      const home = await seedLedger(provider, LEDGER);

      await expect(provider.renamePayee(home.vendor.id, "  ")).rejects.toThrow(
        "Name is required",
      );
      await expect(provider.renamePayee("missing", "New")).rejects.toThrow(
        'Vendor "missing" was not found',
      );
    });
  });

  describe("updating account details", () => {
    it("updates the account and copies a new name and currency to its records in the ledger", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.updateAccountDetails(home.account.id, {
        name: "Current",
        currency: "USD",
        starting_balance: 250,
        type: "Savings",
        remarks: "Main account",
      });

      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ account: "Current", currency: "USD" });
      expect(
        await provider.getScheduledTransactionById(home.scheduled.id),
      ).toMatchObject({ account: "Current", currency: "USD" });
      expect(await provider.getAllAccounts(LEDGER)).toEqual([
        expect.objectContaining({
          id: home.account.account_id,
          currency: "USD",
          starting_balance: 250,
          type: "Savings",
          remarks: "Main account",
        }),
      ]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("leaves fields it is not given unchanged", async () => {
      const home = await seedLedger(provider, LEDGER);
      const [accountBefore] = await provider.getAllAccounts(LEDGER);

      await provider.updateAccountDetails(home.account.id, {
        remarks: "Joint",
      });

      expect(await provider.getAllAccounts(LEDGER)).toEqual([
        { ...accountBefore, remarks: "Joint" },
      ]);
      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ account: "Checking", currency: "EUR" });
    });

    it("refuses a vendor that is not an account, and a name already in use", async () => {
      const home = await seedLedger(provider, LEDGER);
      const before = await snapshotLedger(provider, LEDGER);

      await expect(
        provider.updateAccountDetails(home.vendor.id, { remarks: "x" }),
      ).rejects.toThrow('"Bakery" is not an account');
      await expect(
        provider.updateAccountDetails(home.account.id, {
          name: "Bakery",
          currency: "USD",
        }),
      ).rejects.toBeInstanceOf(NameConflictError);
      expect(await snapshotLedger(provider, LEDGER)).toEqual(before);
    });
  });

  describe("renaming categories and sub-categories", () => {
    it("renames a category everywhere the ledger stores its name", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.renameCategory(home.category.id, "Groceries");

      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ category: "Groceries" });
      expect(
        await provider.getScheduledTransactionById(home.scheduled.id),
      ).toMatchObject({ category: "Groceries" });
      expect(await budgetFor(provider, LEDGER, "category")).toMatchObject({
        category_name: "Groceries",
      });
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("refuses a category name the ledger already has, and changes nothing", async () => {
      const home = await seedLedger(provider, LEDGER);
      await provider.addTransaction(newTransaction({ category: "Rent" }));
      const before = await snapshotLedger(provider, LEDGER);

      await expect(
        provider.renameCategory(home.category.id, "Rent"),
      ).rejects.toBeInstanceOf(NameConflictError);
      expect(await snapshotLedger(provider, LEDGER)).toEqual(before);
    });

    it("renames a sub-category everywhere the ledger stores its name", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.renameSubCategory(home.subCategory.id, "Pastry");

      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ sub_category: "Pastry" });
      expect(
        await provider.getScheduledTransactionById(home.scheduled.id),
      ).toMatchObject({ sub_category: "Pastry" });
      expect(
        await budgetFor(provider, LEDGER, "category+sub_category"),
      ).toMatchObject({ sub_category_name: "Pastry" });
      expect(await budgetFor(provider, LEDGER, "sub_category")).toMatchObject({
        budget_scope_name: "Pastry",
        category_name: "Pastry",
      });
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("keeps a sub-category budget on the old name while another category still uses it", async () => {
      const home = await seedLedger(provider, LEDGER);
      await provider.addTransaction(
        newTransaction({ category: "Travel", sub_category: "Bread" }),
      );

      await provider.renameSubCategory(home.subCategory.id, "Pastry");

      expect(await budgetFor(provider, LEDGER, "sub_category")).toMatchObject({
        budget_scope_name: "Bread",
      });
    });

    it("refuses a sub-category name its category already has, but allows one from another category", async () => {
      const home = await seedLedger(provider, LEDGER);
      await provider.addTransaction(newTransaction({ sub_category: "Cheese" }));
      await provider.addTransaction(
        newTransaction({ category: "Travel", sub_category: "Snacks" }),
      );

      await expect(
        provider.renameSubCategory(home.subCategory.id, "Cheese"),
      ).rejects.toBeInstanceOf(NameConflictError);
      await provider.renameSubCategory(home.subCategory.id, "Snacks");

      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ sub_category: "Snacks" });
    });
  });

  describe("deleting", () => {
    it("deletes a sub-category and clears it from the ledger's records", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.deleteSubCategory(home.subCategory.id);

      expect(await provider.getSubCategories(LEDGER)).toEqual([]);
      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ category: "Food", sub_category: null });
      expect(
        await provider.getScheduledTransactionById(home.scheduled.id),
      ).toMatchObject({ category: "Food", sub_category: null });
      expect(await budgetScopes(provider, LEDGER)).toEqual([
        "account",
        "category",
        "vendor",
      ]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("deletes a vendor with its recurring transactions and budgets, in that ledger only", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.deletePayee(home.vendor.id);

      expect(await provider.getVendorByName("Bakery", LEDGER)).toBeUndefined();
      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ vendor: "Bakery" });
      expect(await provider.getScheduledTransactions(LEDGER)).toEqual([]);
      expect(await budgetScopes(provider, LEDGER)).toEqual([
        "account",
        "category",
        "category",
        "sub_category",
      ]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("deletes a category with its sub-categories, recurring transactions and budgets, in that ledger only", async () => {
      const home = await seedLedger(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.deleteCategory(home.category.id);

      expect(await provider.getUserCategories(LEDGER)).toEqual([]);
      expect(await provider.getSubCategories(LEDGER)).toEqual([]);
      expect(
        await provider.getTransactionById(home.transaction.id),
      ).toMatchObject({ category: "Food" });
      expect(await provider.getScheduledTransactions(LEDGER)).toEqual([]);
      expect(await budgetScopes(provider, LEDGER)).toEqual([
        "account",
        "vendor",
      ]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });
  });

  describe("merging", () => {
    /*
     * A merge keeps the target and moves past transactions onto it. The
     * merged-away names' recurring transactions and budgets are deleted:
     * there is no telling which of two duplicates' schedules or budgets the
     * user still wants.
     */
    it("merges vendors, deleting the merged-away ones with their recurring transactions and budgets, in that ledger only", async () => {
      await seedLedger(provider, LEDGER);
      const duplicate = await seedDuplicates(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      await seedDuplicates(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.mergePayees("Bakery", ["Bakery Ltd"], LEDGER);

      expect(
        await provider.getVendorByName("Bakery Ltd", LEDGER),
      ).toBeUndefined();
      expect(
        await provider.getTransactionById(duplicate.transaction.id),
      ).toMatchObject({ vendor: "Bakery" });
      expect(
        await provider.getScheduledTransactionById(duplicate.scheduled.id),
      ).toBeUndefined();
      expect(await provider.getScheduledTransactions(LEDGER)).toHaveLength(1);
      expect(await budgetNames(provider, LEDGER, "vendor")).toEqual(["Bakery"]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("merges accounts the same way", async () => {
      await seedLedger(provider, LEDGER);
      const duplicate = await seedDuplicates(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      await seedDuplicates(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.mergePayees("Checking", ["Current"], LEDGER);

      expect(await provider.getVendorByName("Current", LEDGER)).toBeUndefined();
      expect(await provider.getAllAccounts(LEDGER)).toHaveLength(1);
      expect(
        await provider.getTransactionById(duplicate.transaction.id),
      ).toMatchObject({ account: "Checking" });
      expect(
        await provider.getScheduledTransactionById(duplicate.scheduled.id),
      ).toBeUndefined();
      expect(await budgetNames(provider, LEDGER, "account")).toEqual([
        "Checking",
      ]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("merges categories, moving their sub-categories and deleting their recurring transactions and budgets, in that ledger only", async () => {
      const home = await seedLedger(provider, LEDGER);
      const duplicate = await seedDuplicates(provider, LEDGER);
      await seedLedger(provider, OTHER_LEDGER);
      await seedDuplicates(provider, OTHER_LEDGER);
      const otherBefore = await snapshotLedger(provider, OTHER_LEDGER);

      await provider.mergeCategories("Food", ["Groceries"], LEDGER);

      expect(
        (await provider.getUserCategories(LEDGER)).map(({ name }) => name),
      ).toEqual(["Food"]);
      expect(
        await provider.getTransactionById(duplicate.transaction.id),
      ).toMatchObject({ category: "Food", sub_category: "Bread" });
      expect(
        await provider.getTransactionById(duplicate.fruitTransaction.id),
      ).toMatchObject({ category: "Food", sub_category: "Fruit" });
      // Food already had Bread, so the merged-in Bread is folded into it.
      expect(
        (await provider.getSubCategories(LEDGER))
          .map(({ name, category_id }) => ({ name, category_id }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      ).toEqual([
        { name: "Bread", category_id: home.category.id },
        { name: "Fruit", category_id: home.category.id },
      ]);
      expect(
        await provider.getScheduledTransactionById(duplicate.scheduled.id),
      ).toBeUndefined();
      expect(await provider.getScheduledTransactions(LEDGER)).toHaveLength(1);
      expect(await budgetNames(provider, LEDGER, "category")).toEqual([
        "Food",
        "Food",
      ]);
      expect(await snapshotLedger(provider, OTHER_LEDGER)).toEqual(otherBefore);
    });

    it("leaves everything alone when the target is also listed as a source", async () => {
      await seedLedger(provider, LEDGER);
      const before = await snapshotLedger(provider, LEDGER);

      await provider.mergePayees("Bakery", ["Bakery"], LEDGER);
      await provider.mergeCategories("Food", ["Food"], LEDGER);

      expect(await snapshotLedger(provider, LEDGER)).toEqual(before);
    });

    it("refuses to merge into a vendor or category the ledger does not have, and changes nothing", async () => {
      await seedLedger(provider, LEDGER);
      await seedDuplicates(provider, LEDGER);
      const before = await snapshotLedger(provider, LEDGER);

      await expect(
        provider.mergePayees("Nobody", ["Bakery Ltd"], LEDGER),
      ).rejects.toThrow('Vendor "Nobody" was not found');
      await expect(
        provider.mergeCategories("Nothing", ["Groceries"], LEDGER),
      ).rejects.toThrow('Category "Nothing" was not found');
      expect(await snapshotLedger(provider, LEDGER)).toEqual(before);
    });
  });

  describe("ledger names", () => {
    it("refuses a name another ledger already has, ignoring case and spaces", async () => {
      await provider.addLedger({ name: "Home", currency: "EUR" });
      const holiday = await provider.addLedger({
        name: "Holiday",
        currency: "EUR",
      });

      await expect(
        provider.addLedger({ name: "  home ", currency: "USD" }),
      ).rejects.toBeInstanceOf(NameConflictError);
      await expect(
        provider.updateLedger({ ...holiday, name: "HOME" }),
      ).rejects.toBeInstanceOf(NameConflictError);
      expect(
        (await provider.getLedgers()).map(({ name }) => name).sort(),
      ).toEqual(["Holiday", "Home"]);
    });

    it("lets a ledger keep or re-case its own name while other details change", async () => {
      const home = await provider.addLedger({ name: "Home", currency: "EUR" });

      await provider.updateLedger({ ...home, name: "home", currency: "USD" });

      expect(await provider.getLedgers()).toEqual([
        expect.objectContaining({ id: home.id, name: "home", currency: "USD" }),
      ]);
    });

    it("trims ledger names and rejects blank ones", async () => {
      const home = await provider.addLedger({
        name: "  Home  ",
        currency: "EUR",
      });

      expect(home.name).toBe("Home");
      await expect(
        provider.addLedger({ name: "   ", currency: "EUR" }),
      ).rejects.toThrow("Name is required");
    });
  });

  describe("backup schedules", () => {
    it("stores, lists and reads backup schedules", async () => {
      const first = newBackupConfig({ id: "backup-1" });
      const second = newBackupConfig({ id: "backup-2", encrypted: true });

      await provider.addBackupConfig(first);
      await provider.addBackupConfig(second);

      expect(
        (await provider.getBackupConfigs()).map((config) => config.id).sort(),
      ).toEqual(["backup-1", "backup-2"]);
      expect(await provider.getBackupConfig("backup-2")).toEqual(second);
      expect(await provider.getBackupConfig("missing")).toBeUndefined();
    });

    it("lists only schedules due at or before the given time", async () => {
      await provider.addBackupConfig(
        newBackupConfig({
          id: "overdue",
          nextBackup: "2026-01-01T00:00:00.000Z",
        }),
      );
      await provider.addBackupConfig(
        newBackupConfig({
          id: "due-now",
          nextBackup: "2026-01-02T00:00:00.000Z",
        }),
      );
      await provider.addBackupConfig(
        newBackupConfig({
          id: "later",
          nextBackup: "2026-01-03T00:00:00.000Z",
        }),
      );

      const due = await provider.getDueBackupConfigs(
        "2026-01-02T00:00:00.000Z",
      );

      expect(due.map((config) => config.id).sort()).toEqual([
        "due-now",
        "overdue",
      ]);
    });

    it("updates only the schedule fields it is given", async () => {
      await provider.addBackupConfig(newBackupConfig({ path: "/backups" }));

      await provider.updateBackupConfig("backup-1", { isActive: false });

      expect(await provider.getBackupConfig("backup-1")).toMatchObject({
        isActive: false,
        path: "/backups",
        frequency: 86_400_000,
      });
    });

    it("deletes a backup schedule", async () => {
      await provider.addBackupConfig(newBackupConfig());

      await provider.deleteBackupConfig("backup-1");

      expect(await provider.getBackupConfig("backup-1")).toBeUndefined();
      expect(await provider.getBackupConfigs()).toEqual([]);
    });
  });
});

import {
  DataProvider,
  Transaction,
  Budget,
  Vendor,
  Category,
  Account,
  ScheduledTransaction,
  SubCategory,
  Ledger,
  BackupConfig,
  AIProvider,
  AccountDetailsChanges,
  NameConflictError,
} from "../types/dataProvider";
import { db } from "@/lib/dexieDB";
import { v4 as uuidv4 } from "uuid";

/** Matches rows whose `user_id` (the ledger id) is `ledgerId`. */
const isInLedger =
  (ledgerId: string | undefined) => (row: { user_id?: string }) =>
    row.user_id === ledgerId;

/** Budgets that track a vendor or account by name. */
const isPayeeBudget = (budget: Budget) =>
  budget.budget_scope === "account" || budget.budget_scope === "vendor";

const requireName = (rawName: string): string => {
  const name = rawName.trim();
  if (!name) throw new Error("Name is required");
  return name;
};

export class LocalDataProvider implements DataProvider {
  // Ledgers
  async getLedgers(): Promise<Ledger[]> {
    return await db.ledgers.orderBy("last_accessed").reverse().toArray();
  }

  async addLedger(
    ledger: Omit<Ledger, "id" | "created_at" | "last_accessed">,
  ): Promise<Ledger> {
    const name = requireName(ledger.name);
    return await db.transaction("rw", db.ledgers, async () => {
      await this.assertLedgerNameFree(name);
      const newLedger: Ledger = {
        ...ledger,
        name,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      };
      await db.ledgers.add(newLedger);
      return newLedger;
    });
  }

  async updateLedger(ledger: Ledger): Promise<void> {
    await db.transaction("rw", db.ledgers, async () => {
      const existing = await db.ledgers.get(ledger.id);
      // Only a rename is checked, so ledgers that already shared a name
      // before names had to be unique can still be opened and edited.
      if (existing?.name === ledger.name) {
        await db.ledgers.put(ledger);
        return;
      }
      const name = requireName(ledger.name);
      await this.assertLedgerNameFree(name, ledger.id);
      await db.ledgers.put({ ...ledger, name });
    });
  }

  /**
   * Ledgers are separate books to the user, so two may not share a name.
   * Like the ledger dialog, this ignores case and surrounding spaces.
   */
  private async assertLedgerNameFree(
    name: string,
    ledgerIdToIgnore?: string,
  ): Promise<void> {
    const wanted = name.toLowerCase();
    const clash = await db.ledgers
      .filter(
        (other) =>
          other.id !== ledgerIdToIgnore &&
          other.name.trim().toLowerCase() === wanted,
      )
      .first();
    if (clash) {
      throw new NameConflictError(
        `A ledger named "${clash.name}" already exists`,
      );
    }
  }

  async deleteLedger(id: string): Promise<void> {
    // Avoid large transaction block to prevent deadlocks with other active queries (e.g. live queries).
    // Delete data sequentially.

    // 1. Delete all related data first
    await db.transactions.where("user_id").equals(id).delete();
    await db.scheduled_transactions.where("user_id").equals(id).delete();
    await db.budgets.where("user_id").equals(id).delete();
    await db.vendors.where("user_id").equals(id).delete();
    await db.accounts.where("user_id").equals(id).delete();
    await db.categories.where("user_id").equals(id).delete();
    await db.sub_categories.where("user_id").equals(id).delete();

    // 2. Delete the ledger itself last
    await db.ledgers.delete(id);
  }

  // Transactions
  async getTransactions(ledgerId: string): Promise<Transaction[]> {
    if (ledgerId) {
      return await db.transactions
        .where("user_id")
        .equals(ledgerId)
        .reverse()
        .sortBy("date");
    }
    // Fallback for migration/empty state
    return await db.transactions.orderBy("date").reverse().toArray();
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  }

  async getTransactionsByTransferId(
    transferId: string,
  ): Promise<Transaction[]> {
    return await db.transactions
      .where("transfer_id")
      .equals(transferId)
      .toArray();
  }

  async addTransaction(
    transaction: Omit<Transaction, "id" | "created_at">,
  ): Promise<Transaction> {
    const ledgerId = transaction.user_id || "local-user";

    // Ensure category exists
    if (transaction.category) {
      const catId = await this.ensureCategoryExists(
        transaction.category,
        ledgerId,
      );

      // Ensure sub-category exists if provided
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(
          transaction.sub_category,
          catId,
          ledgerId,
        );
      }
    }

    // Ensure Vendor/Payee exists
    if (transaction.vendor) {
      await this.ensurePayeeExists(transaction.vendor, false, ledgerId, {
        currency: transaction.currency,
      });
    }

    // Ensure Account exists
    if (transaction.account) {
      await this.ensurePayeeExists(transaction.account, true, ledgerId, {
        currency: transaction.currency,
      });
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    await db.transactions.add(newTransaction);
    return newTransaction;
  }

  async addMultipleTransactions(
    transactions: Omit<Transaction, "id" | "created_at">[],
  ): Promise<Transaction[]> {
    const newTransactions: Transaction[] = transactions.map((t) => ({
      ...t,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    }));

    await db.transactions.bulkAdd(newTransactions);
    return newTransactions;
  }

  async updateTransaction(transaction: Transaction): Promise<void> {
    const ledgerId = transaction.user_id || "local-user";

    // Ensure category/sub-category exist
    if (transaction.category) {
      const catId = await this.ensureCategoryExists(
        transaction.category,
        ledgerId,
      );
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(
          transaction.sub_category,
          catId,
          ledgerId,
        );
      }
    }

    await db.transactions.put(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.transactions.delete(id);
  }

  async deleteMultipleTransactions(ids: string[]): Promise<void> {
    await db.transactions.bulkDelete(ids);
  }

  async deleteTransactionByTransferId(transferId: string): Promise<void> {
    const transactionsToDelete = await db.transactions
      .where("transfer_id")
      .equals(transferId)
      .toArray();
    await db.transactions.bulkDelete(transactionsToDelete.map((t) => t.id));
  }

  async clearTransactions(ledgerId: string): Promise<void> {
    await db.transactions.where("user_id").equals(ledgerId).delete();
  }

  async clearBudgets(ledgerId: string): Promise<void> {
    await db.budgets.where("user_id").equals(ledgerId).delete();
  }

  async clearScheduledTransactions(ledgerId: string): Promise<void> {
    await db.scheduled_transactions.where("user_id").equals(ledgerId).delete();
  }

  // Scheduled Transactions
  async getScheduledTransactions(
    ledgerId: string,
  ): Promise<ScheduledTransaction[]> {
    return await db.scheduled_transactions
      .where("user_id")
      .equals(ledgerId)
      .reverse()
      .sortBy("date");
  }

  async getScheduledTransactionById(
    id: string,
  ): Promise<ScheduledTransaction | undefined> {
    return await db.scheduled_transactions.get(id);
  }

  async addScheduledTransaction(
    transaction: Omit<ScheduledTransaction, "id" | "created_at">,
  ): Promise<ScheduledTransaction> {
    const ledgerId = transaction.user_id || "local-user";

    // Ensure category/sub-category exist
    if (transaction.category) {
      const catId = await this.ensureCategoryExists(
        transaction.category,
        ledgerId,
      );
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(
          transaction.sub_category,
          catId,
          ledgerId,
        );
      }
    }

    const newTransaction: ScheduledTransaction = {
      ...transaction,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    await db.scheduled_transactions.add(newTransaction);
    return newTransaction;
  }

  async updateScheduledTransaction(
    transaction: ScheduledTransaction,
  ): Promise<void> {
    const ledgerId = transaction.user_id || "local-user";

    // Ensure category/sub-category exist
    if (transaction.category) {
      const catId = await this.ensureCategoryExists(
        transaction.category,
        ledgerId,
      );
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(
          transaction.sub_category,
          catId,
          ledgerId,
        );
      }
    }

    await db.scheduled_transactions.put(transaction);
  }

  async deleteScheduledTransaction(id: string): Promise<void> {
    await db.scheduled_transactions.delete(id);
  }

  async deleteMultipleScheduledTransactions(ids: string[]): Promise<void> {
    await db.scheduled_transactions.bulkDelete(ids);
  }

  // Payees/Vendors/Accounts
  async ensurePayeeExists(
    name: string,
    isAccount: boolean,
    ledgerId: string,
    options?: {
      currency?: string;
      startingBalance?: number;
      remarks?: string;
      type?: Account["type"];
      creditLimit?: number;
    },
  ): Promise<string | null> {
    if (!name) return null;
    const trimmedName = name.trim();

    const vendor = await db.vendors
      .where("[user_id+name]")
      .equals([ledgerId, trimmedName])
      .first();

    if (vendor) {
      if (isAccount) {
        let accountId = vendor.account_id;
        if (!accountId) {
          accountId = uuidv4();
          await db.accounts.add({
            id: accountId,
            user_id: ledgerId,
            currency: options?.currency || "USD",
            starting_balance: options?.startingBalance || 0,
            remarks:
              options?.remarks ||
              `Auto-created account for vendor: ${trimmedName}`,
            created_at: new Date().toISOString(),
            type: options?.type || "Checking",
            credit_limit: options?.creditLimit,
          });
          await db.vendors.update(vendor.id, {
            is_account: true,
            account_id: accountId,
          });
        }
      }
      return vendor.id;
    } else {
      let accountId: string | null = null;
      if (isAccount) {
        accountId = uuidv4();
        await db.accounts.add({
          id: accountId,
          user_id: ledgerId,
          currency: options?.currency || "USD",
          starting_balance: options?.startingBalance || 0,
          remarks:
            options?.remarks ||
            `Auto-created account for vendor: ${trimmedName}`,
          created_at: new Date().toISOString(),
          type: options?.type || "Checking",
          credit_limit: options?.creditLimit,
        });
      }

      const newVendorId = uuidv4();
      await db.vendors.add({
        id: newVendorId,
        user_id: ledgerId,
        name: trimmedName,
        is_account: isAccount,
        account_id: accountId,
      });
      return newVendorId;
    }
  }

  async checkIfPayeeIsAccount(
    name: string,
    ledgerId: string,
  ): Promise<boolean> {
    const vendor = await db.vendors
      .where({ user_id: ledgerId, name: name })
      .first();
    return !!vendor?.is_account;
  }

  async getAccountCurrency(
    accountName: string,
    ledgerId: string,
  ): Promise<string> {
    const account = await db.accounts
      .where({ user_id: ledgerId, remarks: accountName })
      .first();
    return account?.currency || "USD";
  }

  async getAllVendors(ledgerId: string): Promise<Vendor[]> {
    return await db.vendors.where("user_id").equals(ledgerId).toArray();
  }

  async getVendorByName(
    name: string,
    ledgerId: string,
  ): Promise<Vendor | undefined> {
    return await db.vendors.where({ user_id: ledgerId, name: name }).first();
  }

  /*
   * Merges keep the target and move past transactions onto it. The
   * merged-away names' recurring transactions and budgets are deleted rather
   * than moved: with duplicates there is no telling which schedule or budget
   * the user still wants, and moving them could double-count.
   */
  async mergePayees(
    targetName: string,
    sourceNames: string[],
    ledgerId: string,
  ): Promise<void> {
    // Listing the target as a source would otherwise delete it.
    const sources = sourceNames.filter((name) => name !== targetName);
    if (sources.length === 0) return;
    const isSource = (name: string | null | undefined) =>
      !!name && sources.includes(name);
    const inLedger = isInLedger(ledgerId);

    await db.transaction(
      "rw",
      [
        db.transactions,
        db.vendors,
        db.accounts,
        db.scheduled_transactions,
        db.budgets,
      ],
      async () => {
        const target = await db.vendors
          .where("[user_id+name]")
          .equals([ledgerId, targetName])
          .first();
        if (!target) throw new Error(`Vendor "${targetName}" was not found`);

        await db.transactions
          .where("user_id")
          .equals(ledgerId)
          .and((t) => isSource(t.account))
          .modify({ account: targetName });
        await db.transactions
          .where("user_id")
          .equals(ledgerId)
          .and((t) => isSource(t.vendor))
          .modify({ vendor: targetName });

        await db.scheduled_transactions
          .filter(
            (scheduled) =>
              inLedger(scheduled) &&
              (isSource(scheduled.account) || isSource(scheduled.vendor)),
          )
          .delete();
        await db.budgets
          .filter(
            (budget) =>
              inLedger(budget) &&
              isPayeeBudget(budget) &&
              isSource(budget.budget_scope_name),
          )
          .delete();

        const sourceVendors = await db.vendors
          .where("[user_id+name]")
          .anyOf(sources.map((name) => [ledgerId, name]))
          .toArray();
        const accountIdsToDelete = sourceVendors
          .map((v) => v.account_id)
          .filter((id): id is string => !!id);
        await db.vendors.bulkDelete(sourceVendors.map((v) => v.id));
        if (accountIdsToDelete.length > 0) {
          await db.accounts.bulkDelete(accountIdsToDelete);
        }
      },
    );
  }

  async renamePayee(vendorId: string, newName: string): Promise<void> {
    const name = requireName(newName);
    await db.transaction(
      "rw",
      [db.vendors, db.transactions, db.scheduled_transactions, db.budgets],
      async () => {
        await this.renamePayeeRecords(await this.requireVendor(vendorId), name);
      },
    );
  }

  async deletePayee(id: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.vendors, db.accounts, db.scheduled_transactions, db.budgets],
      async () => {
        const vendor = await db.vendors.get(id);
        if (!vendor) return;
        const { name } = vendor;
        const inLedger = isInLedger(vendor.user_id);

        await db.vendors.delete(id);
        if (vendor.account_id) {
          await db.accounts.delete(vendor.account_id);
        }

        // A recurring transaction would recreate the vendor on its next run,
        // and a budget for it could never match again. Past transactions
        // keep the name.
        await db.scheduled_transactions
          .filter(
            (scheduled) =>
              inLedger(scheduled) &&
              (scheduled.account === name || scheduled.vendor === name),
          )
          .delete();
        await db.budgets
          .filter(
            (budget) =>
              inLedger(budget) &&
              isPayeeBudget(budget) &&
              budget.budget_scope_name === name,
          )
          .delete();
      },
    );
  }

  private async requireVendor(vendorId: string): Promise<Vendor> {
    const vendor = await db.vendors.get(vendorId);
    if (!vendor) throw new Error(`Vendor "${vendorId}" was not found`);
    return vendor;
  }

  /**
   * Renames a vendor or account and every record in its ledger that stores
   * the old name. Vendors and accounts share one set of names per ledger, and
   * a transfer stores the other account in its `vendor` field, so both the
   * `vendor` and `account` fields are updated. Callers run this inside a
   * transaction over vendors, transactions, scheduled_transactions and
   * budgets.
   */
  private async renamePayeeRecords(
    vendor: Vendor,
    newName: string,
  ): Promise<void> {
    const oldName = vendor.name;
    if (newName === oldName) return;
    const inLedger = isInLedger(vendor.user_id);

    const clash = await db.vendors
      .where("name")
      .equals(newName)
      .filter((other) => inLedger(other) && other.id !== vendor.id)
      .first();
    if (clash) {
      throw new NameConflictError(
        `A vendor or account named "${newName}" already exists`,
      );
    }

    await db.vendors.update(vendor.id, { name: newName });
    await db.transactions
      .where("vendor")
      .equals(oldName)
      .filter(inLedger)
      .modify({ vendor: newName });
    await db.transactions
      .where("account")
      .equals(oldName)
      .filter(inLedger)
      .modify({ account: newName });
    await db.scheduled_transactions
      .where("vendor")
      .equals(oldName)
      .filter(inLedger)
      .modify({ vendor: newName });
    await db.scheduled_transactions
      .where("account")
      .equals(oldName)
      .filter(inLedger)
      .modify({ account: newName });
    // Vendor and account budgets hold the name twice: `budget_scope_name`
    // for matching and `category_name` for display.
    await db.budgets
      .filter(
        (budget) =>
          inLedger(budget) &&
          isPayeeBudget(budget) &&
          budget.budget_scope_name === oldName,
      )
      .modify((budget) => {
        budget.budget_scope_name = newName;
        if (budget.category_name === oldName) budget.category_name = newName;
      });
  }

  async getAllAccounts(ledgerId: string): Promise<Account[]> {
    return await db.accounts.where("user_id").equals(ledgerId).toArray();
  }

  async updateAccountDetails(
    vendorId: string,
    changes: AccountDetailsChanges,
  ): Promise<void> {
    const newName =
      changes.name === undefined ? undefined : requireName(changes.name);
    await db.transaction(
      "rw",
      [
        db.vendors,
        db.accounts,
        db.transactions,
        db.scheduled_transactions,
        db.budgets,
      ],
      async () => {
        const vendor = await this.requireVendor(vendorId);
        if (!vendor.is_account) {
          throw new Error(`"${vendor.name}" is not an account`);
        }
        if (newName !== undefined) {
          await this.renamePayeeRecords(vendor, newName);
        }
        const accountName = newName ?? vendor.name;
        const inLedger = isInLedger(vendor.user_id);

        if (changes.currency !== undefined) {
          // Each transaction stores its account's currency, so a currency
          // change is copied to them.
          await db.transactions
            .where("account")
            .equals(accountName)
            .filter(inLedger)
            .modify({ currency: changes.currency });
          await db.scheduled_transactions
            .where("account")
            .equals(accountName)
            .filter(inLedger)
            .modify({ currency: changes.currency });
        }

        const { name: _name, ...accountFields } = changes;
        if (vendor.account_id && Object.keys(accountFields).length > 0) {
          await db.accounts.update(vendor.account_id, accountFields);
        }
      },
    );
  }

  // Categories
  async ensureCategoryExists(
    rawName: string,
    ledgerId: string,
  ): Promise<string | null> {
    if (!rawName) return null;
    const name = rawName.trim();
    const category = await db.categories
      .where("[user_id+name]")
      .equals([ledgerId, name])
      .first();

    if (category) return category.id;

    const newId = uuidv4();
    await db.categories.add({
      id: newId,
      user_id: ledgerId,
      name: name,
      created_at: new Date().toISOString(),
    });
    return newId;
  }

  async ensureSubCategoryExists(
    rawName: string,
    categoryId: string,
    ledgerId: string,
  ): Promise<string | null> {
    if (!rawName || !categoryId) return null;
    const name = rawName.trim();

    const sub = await db.sub_categories
      .where("category_id")
      .equals(categoryId)
      .and((s) => s.name === name)
      .first();

    if (sub) return sub.id;

    const newId = uuidv4();
    await db.sub_categories.add({
      id: newId,
      user_id: ledgerId,
      category_id: categoryId,
      name: name,
      created_at: new Date().toISOString(),
    });
    return newId;
  }

  async getUserCategories(ledgerId: string): Promise<Category[]> {
    return await db.categories.where("user_id").equals(ledgerId).sortBy("name");
  }

  async getSubCategories(ledgerId: string): Promise<SubCategory[]> {
    return await db.sub_categories
      .where("user_id")
      .equals(ledgerId)
      .sortBy("name");
  }

  /** See mergePayees for why recurring transactions and budgets are deleted. */
  async mergeCategories(
    targetName: string,
    sourceNames: string[],
    ledgerId: string,
  ): Promise<void> {
    // Listing the target as a source would otherwise delete it.
    const sources = sourceNames.filter((name) => name !== targetName);
    if (sources.length === 0) return;
    const inLedger = isInLedger(ledgerId);

    await db.transaction(
      "rw",
      [
        db.transactions,
        db.categories,
        db.sub_categories,
        db.scheduled_transactions,
        db.budgets,
      ],
      async () => {
        const target = await db.categories
          .where("[user_id+name]")
          .equals([ledgerId, targetName])
          .first();
        if (!target) {
          throw new Error(`Category "${targetName}" was not found`);
        }
        const sourceIds = (
          await db.categories
            .where("[user_id+name]")
            .anyOf(sources.map((name) => [ledgerId, name]))
            .toArray()
        ).map((category) => category.id);

        // Transactions keep their sub-category name, which the target gets
        // below.
        await db.transactions
          .where("user_id")
          .equals(ledgerId)
          .and((t) => sources.includes(t.category))
          .modify({ category: targetName });

        await db.scheduled_transactions
          .filter(
            (scheduled) =>
              inLedger(scheduled) && sources.includes(scheduled.category),
          )
          .delete();
        // Budgets without a scope predate scopes and are category budgets.
        await db.budgets
          .filter(
            (budget) =>
              inLedger(budget) &&
              (!budget.budget_scope || budget.budget_scope === "category") &&
              (sourceIds.includes(budget.category_id) ||
                sources.includes(budget.category_name)),
          )
          .delete();

        // Move the sub-categories over. One whose name the target already
        // has is folded into the target's: transactions store the name, so
        // nothing else needs changing.
        const targetSubNames = new Set(
          (
            await db.sub_categories
              .where("category_id")
              .equals(target.id)
              .toArray()
          ).map((sub) => sub.name),
        );
        const movingSubs = await db.sub_categories
          .where("category_id")
          .anyOf(sourceIds)
          .toArray();
        for (const sub of movingSubs) {
          if (targetSubNames.has(sub.name)) {
            await db.sub_categories.delete(sub.id);
          } else {
            await db.sub_categories.update(sub.id, { category_id: target.id });
            targetSubNames.add(sub.name);
          }
        }

        await db.categories.bulkDelete(sourceIds);
      },
    );
  }

  async renameCategory(categoryId: string, newName: string): Promise<void> {
    const name = requireName(newName);
    await db.transaction(
      "rw",
      [db.categories, db.transactions, db.scheduled_transactions, db.budgets],
      async () => {
        const category = await db.categories.get(categoryId);
        if (!category) {
          throw new Error(`Category "${categoryId}" was not found`);
        }
        const oldName = category.name;
        if (name === oldName) return;
        const inLedger = isInLedger(category.user_id);

        const clash = await db.categories
          .where("name")
          .equals(name)
          .filter((other) => inLedger(other) && other.id !== categoryId)
          .first();
        if (clash) {
          throw new NameConflictError(
            `A category named "${name}" already exists`,
          );
        }

        await db.categories.update(categoryId, { name });
        await db.transactions
          .where("category")
          .equals(oldName)
          .filter(inLedger)
          .modify({ category: name });
        await db.scheduled_transactions
          .filter(
            (scheduled) =>
              inLedger(scheduled) && scheduled.category === oldName,
          )
          .modify({ category: name });
        await db.budgets
          .filter(
            (budget) => inLedger(budget) && budget.category_id === categoryId,
          )
          .modify({ category_name: name });
      },
    );
  }

  async deleteCategory(id: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.categories, db.sub_categories, db.scheduled_transactions, db.budgets],
      async () => {
        const category = await db.categories.get(id);
        if (!category) return;
        const { name } = category;
        const inLedger = isInLedger(category.user_id);
        const subCategories = await db.sub_categories
          .where("category_id")
          .equals(id)
          .toArray();

        await db.categories.delete(id);
        await db.sub_categories.where("category_id").equals(id).delete();
        // A recurring transaction would recreate the category on its next
        // run. Past transactions keep the name.
        await db.scheduled_transactions
          .filter(
            (scheduled) => inLedger(scheduled) && scheduled.category === name,
          )
          .delete();
        await db.budgets
          .filter(
            (budget) =>
              inLedger(budget) &&
              (budget.category_id === id ||
                (budget.budget_scope === "category" &&
                  budget.budget_scope_name === name)),
          )
          .delete();
        for (const subCategory of subCategories) {
          await this.deleteSubCategoryBudgets(subCategory);
        }
      },
    );
  }

  async renameSubCategory(
    subCategoryId: string,
    newName: string,
  ): Promise<void> {
    const name = requireName(newName);
    await db.transaction(
      "rw",
      [
        db.sub_categories,
        db.categories,
        db.transactions,
        db.scheduled_transactions,
        db.budgets,
      ],
      async () => {
        const subCategory = await db.sub_categories.get(subCategoryId);
        const category =
          subCategory && (await db.categories.get(subCategory.category_id));
        if (!subCategory || !category) {
          throw new Error(`Sub-category "${subCategoryId}" was not found`);
        }
        const oldName = subCategory.name;
        if (name === oldName) return;
        const inLedger = isInLedger(subCategory.user_id);

        const clash = await db.sub_categories
          .where("category_id")
          .equals(category.id)
          .filter((other) => other.name === name && other.id !== subCategoryId)
          .first();
        if (clash) {
          throw new NameConflictError(
            `Category "${category.name}" already has a sub-category named "${name}"`,
          );
        }

        await db.sub_categories.update(subCategoryId, { name });
        const isTagged = (row: Transaction | ScheduledTransaction) =>
          inLedger(row) &&
          row.category === category.name &&
          row.sub_category === oldName;
        await db.transactions
          .where("category")
          .equals(category.name)
          .filter(isTagged)
          .modify({ sub_category: name });
        await db.scheduled_transactions
          .filter(isTagged)
          .modify({ sub_category: name });
        await db.budgets
          .filter(
            (budget) =>
              inLedger(budget) && budget.sub_category_id === subCategoryId,
          )
          .modify({ sub_category_name: name });

        // Sub-category budgets match transactions by sub-category name in
        // any category. They follow the rename only if no other
        // sub-category in the ledger still has the old name.
        if (
          !(await this.isSubCategoryNameInUse(oldName, subCategory.user_id))
        ) {
          await db.budgets
            .filter(
              (budget) =>
                inLedger(budget) &&
                budget.budget_scope === "sub_category" &&
                budget.budget_scope_name === oldName,
            )
            .modify((budget) => {
              budget.budget_scope_name = name;
              if (budget.category_name === oldName) budget.category_name = name;
            });
        }
      },
    );
  }

  async deleteSubCategory(subCategoryId: string): Promise<void> {
    await db.transaction(
      "rw",
      [
        db.sub_categories,
        db.categories,
        db.transactions,
        db.scheduled_transactions,
        db.budgets,
      ],
      async () => {
        const subCategory = await db.sub_categories.get(subCategoryId);
        if (!subCategory) return;
        const category = await db.categories.get(subCategory.category_id);
        const inLedger = isInLedger(subCategory.user_id);

        await db.sub_categories.delete(subCategoryId);
        if (category) {
          // Transactions keep their category and lose only the tag.
          const isTagged = (row: Transaction | ScheduledTransaction) =>
            inLedger(row) &&
            row.category === category.name &&
            row.sub_category === subCategory.name;
          await db.transactions
            .where("category")
            .equals(category.name)
            .filter(isTagged)
            .modify({ sub_category: null });
          await db.scheduled_transactions
            .filter(isTagged)
            .modify({ sub_category: null });
        }
        await this.deleteSubCategoryBudgets(subCategory);
      },
    );
  }

  private async isSubCategoryNameInUse(
    name: string,
    ledgerId: string,
  ): Promise<boolean> {
    const matches = await db.sub_categories
      .where("name")
      .equals(name)
      .filter(isInLedger(ledgerId))
      .count();
    return matches > 0;
  }

  /**
   * Removes budgets for a sub-category that no longer exists: category
   * budgets narrowed to it by id, and sub-category budgets for its name
   * unless another sub-category in the ledger still has that name. Callers
   * run this inside a transaction over sub_categories and budgets.
   */
  private async deleteSubCategoryBudgets(
    subCategory: SubCategory,
  ): Promise<void> {
    const inLedger = isInLedger(subCategory.user_id);
    await db.budgets
      .filter(
        (budget) =>
          inLedger(budget) && budget.sub_category_id === subCategory.id,
      )
      .delete();
    const nameStillUsed = await this.isSubCategoryNameInUse(
      subCategory.name,
      subCategory.user_id,
    );
    if (!nameStillUsed) {
      await db.budgets
        .filter(
          (budget) =>
            inLedger(budget) &&
            budget.budget_scope === "sub_category" &&
            budget.budget_scope_name === subCategory.name,
        )
        .delete();
    }
  }

  // Budgets
  async getBudgetsWithSpending(ledgerId: string): Promise<Budget[]> {
    const budgets = await db.budgets
      .where("user_id")
      .equals(ledgerId)
      .toArray();
    return budgets.map((budget) => ({
      ...budget,
      spent_amount: 0,
    }));
  }

  async addBudget(budget: Omit<Budget, "id" | "spent_amount">): Promise<void> {
    await db.budgets.add({
      ...budget,
      id: uuidv4(),
      spent_amount: 0,
      is_active: budget.is_active ?? true,
      is_goal: budget.is_goal ?? false,
      created_at: budget.created_at || new Date().toISOString(),
    });
  }

  async updateBudget(budget: Budget): Promise<void> {
    await db.budgets.put(budget);
  }

  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id);
  }

  // Maintenance
  async linkTransactionsAsTransfer(
    id1: string,
    id2: string,
    requestedTransferId?: string,
  ): Promise<void> {
    const transferId = requestedTransferId ?? uuidv4();
    await db.transaction("rw", [db.transactions, db.categories], async () => {
      const t1 = await db.transactions.get(id1);
      const t2 = await db.transactions.get(id2);

      if (!t1 || !t2) return;

      const ledgerId = t1.user_id || t2.user_id || "local-user";
      await this.ensureCategoryExists("Transfer", ledgerId);

      await db.transactions.update(id1, {
        transfer_id: transferId,
        category: "Transfer",
      });
      await db.transactions.update(id2, {
        transfer_id: transferId,
        category: "Transfer",
      });
    });
  }

  async unlinkTransactions(transferId: string): Promise<void> {
    await db.transactions
      .where("transfer_id")
      .equals(transferId)
      .modify({ transfer_id: null });
  }

  async clearAllData(): Promise<void> {
    try {
      // Full reset can deadlock when large RW transactions contend with live queries.
      // Recreating the IndexedDB database is more reliable than clearing all tables in one transaction.
      db.close();
      await db.delete();
      await db.open();
    } catch (error) {
      console.error("[LocalDataProvider] clearAllData FAILED:", error);
      throw error;
    }
  }

  // Migration Utils
  async exportData(ledgerId?: string): Promise<unknown> {
    const mapToLedgerId = <T extends { user_id?: string }>(items: T[]) =>
      items.map((item) => {
        const { user_id, ...rest } = item;
        return { ...rest, ledger_id: user_id };
      });

    if (ledgerId) {
      return {
        transactions: mapToLedgerId(
          await db.transactions.where("user_id").equals(ledgerId).toArray(),
        ),
        scheduled_transactions: mapToLedgerId(
          await db.scheduled_transactions
            .where("user_id")
            .equals(ledgerId)
            .toArray(),
        ),
        budgets: mapToLedgerId(
          await db.budgets.where("user_id").equals(ledgerId).toArray(),
        ),
        vendors: mapToLedgerId(
          await db.vendors.where("user_id").equals(ledgerId).toArray(),
        ),
        accounts: mapToLedgerId(
          await db.accounts.where("user_id").equals(ledgerId).toArray(),
        ),
        categories: mapToLedgerId(
          await db.categories.where("user_id").equals(ledgerId).toArray(),
        ),
        sub_categories: mapToLedgerId(
          await db.sub_categories.where("user_id").equals(ledgerId).toArray(),
        ),
        version: 2,
        exportedAt: new Date().toISOString(),
      };
    }

    const backupConfigs = await db.backup_configs.toArray();
    const cleanBackupConfigs = backupConfigs.map((config) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { directoryHandle, ...rest } = config;
      return rest;
    });

    let parsedActiveCurrencies = [];
    try {
      const activeCurrencies = localStorage.getItem("active_currencies");
      parsedActiveCurrencies = activeCurrencies
        ? JSON.parse(activeCurrencies)
        : [];
    } catch (e) {
      console.error("Failed to parse active_currencies", e);
    }

    let parsedExchangeRates = {};
    try {
      const rates = localStorage.getItem("currency_exchange_rates");
      parsedExchangeRates = rates ? JSON.parse(rates) : {};
    } catch (e) {
      console.error("Failed to parse currency_exchange_rates", e);
    }

    return {
      transactions: mapToLedgerId(await db.transactions.toArray()),
      scheduled_transactions: mapToLedgerId(
        await db.scheduled_transactions.toArray(),
      ),
      budgets: mapToLedgerId(await db.budgets.toArray()),
      vendors: mapToLedgerId(await db.vendors.toArray()),
      accounts: mapToLedgerId(await db.accounts.toArray()),
      categories: mapToLedgerId(await db.categories.toArray()),
      sub_categories: mapToLedgerId(await db.sub_categories.toArray()),
      ledgers: await db.ledgers.toArray(),
      backup_configs: cleanBackupConfigs,
      active_currencies: parsedActiveCurrencies,
      currency_exchange_rates: parsedExchangeRates,
      ai_providers: await db.ai_providers.toArray(),
      theme: localStorage.getItem("theme") || "system",
      version: 2,
      exportedAt: new Date().toISOString(),
    };
  }

  async importData(data: unknown, ledgerId?: string): Promise<void> {
    const importData = data as Record<string, unknown>;
    if (!importData || !importData.transactions)
      throw new Error("Invalid data format");

    const mapToUserId = (
      items: Record<string, unknown>[],
      overrideUserId?: string,
    ) =>
      items.map((item) => {
        const typedItem = item as Record<string, unknown>;
        if (overrideUserId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ledger_id, user_id, ...rest } = typedItem;
          return { ...rest, user_id: overrideUserId };
        }
        const { ledger_id, user_id, ...rest } = typedItem;
        const finalId = ledger_id || user_id;
        return { ...rest, user_id: finalId };
      });

    await db.transaction(
      "rw",
      [
        db.transactions,
        db.scheduled_transactions,
        db.budgets,
        db.vendors,
        db.accounts,
        db.categories,
        db.sub_categories,
        db.ledgers,
        db.backup_configs,
        db.ai_providers,
      ],
      async () => {
        if (ledgerId) {
          const transactions = mapToUserId(
            (importData.transactions as Record<string, unknown>[]) || [],
            ledgerId,
          ) as Transaction[];
          const scheduled = mapToUserId(
            (importData.scheduled_transactions as Record<string, unknown>[]) ||
              [],
            ledgerId,
          ) as ScheduledTransaction[];
          const budgets = mapToUserId(
            (importData.budgets as Record<string, unknown>[]) || [],
            ledgerId,
          ) as Budget[];
          const vendors = mapToUserId(
            (importData.vendors as Record<string, unknown>[]) || [],
            ledgerId,
          ) as Vendor[];
          const accounts = mapToUserId(
            (importData.accounts as Record<string, unknown>[]) || [],
            ledgerId,
          ) as Account[];
          const categories = mapToUserId(
            (importData.categories as Record<string, unknown>[]) || [],
            ledgerId,
          ) as Category[];
          const subCategories = mapToUserId(
            (importData.sub_categories as Record<string, unknown>[]) || [],
            ledgerId,
          ) as SubCategory[];

          await this.clearTransactions(ledgerId);
          await this.clearScheduledTransactions(ledgerId);
          await this.clearBudgets(ledgerId);

          await db.vendors.where("user_id").equals(ledgerId).delete();
          await db.accounts.where("user_id").equals(ledgerId).delete();
          await db.categories.where("user_id").equals(ledgerId).delete();
          await db.sub_categories.where("user_id").equals(ledgerId).delete();

          await db.transactions.bulkPut(transactions);
          await db.scheduled_transactions.bulkPut(scheduled);
          await db.budgets.bulkPut(budgets);
          await db.vendors.bulkPut(vendors);
          await db.accounts.bulkPut(accounts);
          await db.categories.bulkPut(categories);
          await db.sub_categories.bulkPut(subCategories);
        } else {
          await db.transactions.clear();
          await db.scheduled_transactions.clear();
          await db.budgets.clear();
          await db.vendors.clear();
          await db.accounts.clear();
          await db.categories.clear();
          await db.sub_categories.clear();
          await db.ledgers.clear();
          await db.backup_configs.clear();
          await db.ai_providers.clear();

          if (importData.ledgers)
            await db.ledgers.bulkAdd(importData.ledgers as Ledger[]);
          if (importData.backup_configs)
            await db.backup_configs.bulkAdd(
              importData.backup_configs as BackupConfig[],
            );
          if (importData.ai_providers)
            await db.ai_providers.bulkAdd(
              importData.ai_providers as AIProvider[],
            );

          if (importData.transactions)
            await db.transactions.bulkAdd(
              mapToUserId(
                importData.transactions as Record<string, unknown>[],
              ) as Transaction[],
            );
          if (importData.scheduled_transactions)
            await db.scheduled_transactions.bulkAdd(
              mapToUserId(
                importData.scheduled_transactions as Record<string, unknown>[],
              ) as ScheduledTransaction[],
            );
          if (importData.budgets)
            await db.budgets.bulkAdd(
              mapToUserId(
                importData.budgets as Record<string, unknown>[],
              ) as Budget[],
            );
          if (importData.vendors)
            await db.vendors.bulkAdd(
              mapToUserId(
                importData.vendors as Record<string, unknown>[],
              ) as Vendor[],
            );
          if (importData.accounts)
            await db.accounts.bulkAdd(
              mapToUserId(
                importData.accounts as Record<string, unknown>[],
              ) as Account[],
            );
          if (importData.categories)
            await db.categories.bulkAdd(
              mapToUserId(
                importData.categories as Record<string, unknown>[],
              ) as Category[],
            );
          if (importData.sub_categories)
            await db.sub_categories.bulkAdd(
              mapToUserId(
                importData.sub_categories as Record<string, unknown>[],
              ) as SubCategory[],
            );

          if (
            importData.active_currencies &&
            Array.isArray(importData.active_currencies)
          ) {
            try {
              localStorage.setItem(
                "active_currencies",
                JSON.stringify(importData.active_currencies),
              );
            } catch (e) {
              console.error("Failed to import active currencies", e);
            }
          }
          if (importData.currency_exchange_rates) {
            try {
              const existingRates = JSON.parse(
                localStorage.getItem("currency_exchange_rates") || "{}",
              );
              const newRates = {
                ...existingRates,
                ...(importData.currency_exchange_rates as Record<
                  string,
                  number
                >),
              };
              localStorage.setItem(
                "currency_exchange_rates",
                JSON.stringify(newRates),
              );
            } catch (e) {
              console.error("Failed to import exchange rates", e);
            }
          }
          if (importData.theme && typeof importData.theme === "string") {
            try {
              localStorage.setItem("theme", importData.theme);
            } catch (e) {
              console.error("Failed to import theme preference", e);
            }
          }
        }
      },
    );
  }

  // AI Provider Management
  async getAIProviders() {
    return db.ai_providers.toArray();
  }

  async addAIProvider(provider: Omit<AIProvider, "id">) {
    const id = crypto.randomUUID();
    const newProvider = { ...provider, id };
    await db.ai_providers.add(newProvider);
    return newProvider;
  }

  async updateAIProvider(provider: AIProvider) {
    await db.ai_providers.put(provider);
  }

  async deleteAIProvider(id: string) {
    await db.ai_providers.delete(id);
  }

  async setDefaultAIProvider(id: string) {
    await db.transaction("rw", db.ai_providers, async () => {
      const providers = await db.ai_providers.toArray();
      for (const p of providers) {
        await db.ai_providers.put({ ...p, isDefault: p.id === id });
      }
    });
  }

  // Scheduled backups
  async getBackupConfigs(): Promise<BackupConfig[]> {
    return await db.backup_configs.toArray();
  }

  async getDueBackupConfigs(nowIso: string): Promise<BackupConfig[]> {
    // ISO 8601 strings in UTC sort chronologically, so a string range query
    // on the indexed `nextBackup` field finds every schedule that is due.
    return await db.backup_configs
      .where("nextBackup")
      .belowOrEqual(nowIso)
      .toArray();
  }

  async getBackupConfig(id: string): Promise<BackupConfig | undefined> {
    return await db.backup_configs.get(id);
  }

  async addBackupConfig(config: BackupConfig): Promise<void> {
    await db.backup_configs.add(config);
  }

  async updateBackupConfig(
    id: string,
    changes: Partial<Omit<BackupConfig, "id">>,
  ): Promise<void> {
    await db.backup_configs.update(id, changes);
  }

  async deleteBackupConfig(id: string): Promise<void> {
    await db.backup_configs.delete(id);
  }
}

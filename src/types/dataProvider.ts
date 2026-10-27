export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  account: string;
  vendor: string;
  category: string;
  sub_category?: string | null;
  remarks?: string | null;
  is_scheduled_origin?: boolean;
  transfer_id?: string | null;
  recurrence_id?: string | null;
  recurrence_frequency?: string | null;
  recurrence_end_date?: string | null;
  is_projected?: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  sub_category_id?: string | null;
  sub_category_name?: string | null;
  target_amount: number;
  spent_amount: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  frequency: "Monthly" | "Quarterly" | "Yearly" | "One-time";
  is_active?: boolean;
  created_at?: string;
  account_scope?: "ALL" | "GROUP";
  account_scope_values?: string[] | null;
  is_goal?: boolean;
  target_date?: string | null;
  monthly_contribution?: number | null;
  goal_context?: string | null;
  budget_scope?: "category" | "account" | "vendor" | "sub_category";
  budget_scope_name?: string | null;
}

export interface Vendor {
  id: string;
  user_id?: string; // Ledger ID
  name: string;
  is_account: boolean;
  account_id?: string | null;
}

export type AccountType =
  "Checking" | "Savings" | "Credit Card" | "Investment" | "Other";

export interface Account {
  id: string;
  user_id?: string; // Ledger ID
  currency: string;
  starting_balance: number;
  remarks: string;
  created_at: string;
  type: AccountType;
  credit_limit?: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface SubCategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface ScheduledTransaction {
  id: string;
  user_id: string;
  account: string; // account name
  vendor: string; // vendor/payee name
  category: string;
  sub_category?: string | null;
  amount: number;
  currency: string;
  date: string; // Next scheduled date
  frequency: string; // 'Daily' | 'Weekly' ... OR '1d', '2w', '3m', '1y'
  end_date?: string | null;

  remarks?: string | null;
  created_at: string;
  last_processed?: string | null;
  ignored_dates?: string[]; // Array of ISO date strings to skip
  transfer_id?: string | null;
}

export interface Ledger {
  id: string;
  name: string;
  short_name?: string;
  icon?: string;
  currency: string;
  created_at: string;
  last_accessed: string;
}

export interface BackupConfig {
  id: string;
  frequency: number; // in milliseconds
  isActive: boolean;
  nextBackup: string; // ISO string
  lastBackup?: string; // ISO string
  directoryHandle?: unknown;
  path?: string; // Electron: Full file path
  encrypted?: boolean;
  passwordHash?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  type: "OPENAI" | "GEMINI" | "ANTHROPIC" | "MISTRAL" | "PERPLEXITY" | "CUSTOM";
  baseUrl: string;
  model?: string;
  description?: string;
  isDefault?: boolean;
}

/**
 * Thrown when a name is already taken: two ledgers, or within a ledger two
 * vendors/accounts, two categories, or two sub-categories of one category.
 * The Local API reports it as 409 Conflict.
 */
export class NameConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NameConflictError";
  }
}

/** Account fields that `updateAccountDetails` can change. */
export interface AccountDetailsChanges {
  name?: string;
  currency?: string;
  starting_balance?: number;
  type?: AccountType;
  remarks?: string;
  credit_limit?: number;
}

/*
 * Renames and deletes
 *
 * Transactions, recurring transactions and budgets store vendor, account,
 * category and sub-category *names*, not ids. So renaming or deleting one of
 * those entities must update every record in its ledger that holds the name,
 * and must never touch another ledger, where the same name can belong to a
 * different entity. The rename and delete methods below do this in one
 * database transaction each, so a failure leaves nothing half-changed.
 */
export interface DataProvider {
  // Ledgers
  getLedgers(): Promise<Ledger[]>;
  /**
   * Ledger names are unique, ignoring case and surrounding spaces. Adding or
   * renaming to a taken name throws NameConflictError.
   */
  addLedger(
    ledger: Omit<Ledger, "id" | "created_at" | "last_accessed">,
  ): Promise<Ledger>;
  updateLedger(ledger: Ledger): Promise<void>;
  deleteLedger(id: string): Promise<void>;

  // Transactions
  getTransactions(ledgerId: string): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  /** Both legs of a transfer, from any ledger. Callers filter by ledger. */
  getTransactionsByTransferId(transferId: string): Promise<Transaction[]>;
  addTransaction(
    transaction: Omit<Transaction, "id" | "created_at">,
  ): Promise<Transaction>;
  addMultipleTransactions(
    transactions: Omit<Transaction, "id" | "created_at">[],
  ): Promise<Transaction[]>;
  updateTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  deleteMultipleTransactions(ids: string[]): Promise<void>;
  deleteTransactionByTransferId(transferId: string): Promise<void>;
  clearTransactions(ledgerId: string): Promise<void>;
  clearBudgets(ledgerId: string): Promise<void>;
  clearScheduledTransactions(ledgerId: string): Promise<void>;

  // Scheduled Transactions
  getScheduledTransactions(ledgerId: string): Promise<ScheduledTransaction[]>;
  getScheduledTransactionById(
    id: string,
  ): Promise<ScheduledTransaction | undefined>;
  addScheduledTransaction(
    transaction: Omit<ScheduledTransaction, "id" | "created_at">,
  ): Promise<ScheduledTransaction>;
  updateScheduledTransaction(transaction: ScheduledTransaction): Promise<void>;
  deleteScheduledTransaction(id: string): Promise<void>;
  deleteMultipleScheduledTransactions(ids: string[]): Promise<void>;

  // Payees/Vendors/Accounts
  ensurePayeeExists(
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
  ): Promise<string | null>;
  checkIfPayeeIsAccount(name: string, ledgerId: string): Promise<boolean>;
  getAccountCurrency(accountName: string, ledgerId: string): Promise<string>;
  getAllVendors(ledgerId: string): Promise<Vendor[]>;
  getVendorByName(name: string, ledgerId: string): Promise<Vendor | undefined>;
  /**
   * Moves the sources' transactions to the target, then deletes the sources
   * with their recurring transactions and budgets. Throws if the target does
   * not exist in the ledger.
   */
  mergePayees(
    targetName: string,
    sourceNames: string[],
    ledgerId: string,
  ): Promise<void>;
  /**
   * Renames a vendor or account (vendors and accounts share one set of names
   * per ledger) in its transactions, recurring transactions and budgets.
   * Throws NameConflictError if the name is taken in the ledger.
   */
  renamePayee(vendorId: string, newName: string): Promise<void>;
  /**
   * Deletes a vendor or account, plus the recurring transactions and the
   * vendor/account budgets that use its name in the same ledger. Past
   * transactions keep the name.
   */
  deletePayee(id: string): Promise<void>;
  getAllAccounts(ledgerId: string): Promise<Account[]>;
  /**
   * Updates an account, identified by its vendor id (the vendor row holds the
   * name). A new name is applied as in `renamePayee`; a currency is copied to
   * the account's transactions and recurring transactions. Fields not given
   * stay unchanged.
   */
  updateAccountDetails(
    vendorId: string,
    changes: AccountDetailsChanges,
  ): Promise<void>;

  // Categories
  ensureCategoryExists(name: string, ledgerId: string): Promise<string | null>;
  ensureSubCategoryExists(
    name: string,
    categoryId: string,
    ledgerId: string,
  ): Promise<string | null>;
  getUserCategories(ledgerId: string): Promise<Category[]>;
  getSubCategories(ledgerId: string): Promise<SubCategory[]>;
  /**
   * Moves the sources' transactions and sub-categories to the target, then
   * deletes the sources with their recurring transactions and budgets.
   * Throws if the target does not exist in the ledger.
   */
  mergeCategories(
    targetName: string,
    sourceNames: string[],
    ledgerId: string,
  ): Promise<void>;
  /** Throws NameConflictError if the ledger already has the name. */
  renameCategory(categoryId: string, newName: string): Promise<void>;
  /**
   * Deletes a category with its sub-categories, plus the recurring
   * transactions and budgets that use it in the same ledger. Past
   * transactions keep the name.
   */
  deleteCategory(id: string): Promise<void>;
  /** Throws NameConflictError if the parent category already has the name. */
  renameSubCategory(subCategoryId: string, newName: string): Promise<void>;
  /**
   * Deletes a sub-category, clears it from transactions and recurring
   * transactions in the ledger, and removes the budgets scoped to it.
   */
  deleteSubCategory(subCategoryId: string): Promise<void>;

  // Budgets
  getBudgetsWithSpending(ledgerId: string): Promise<Budget[]>;
  addBudget(budget: Omit<Budget, "id" | "spent_amount">): Promise<void>;
  updateBudget(budget: Budget): Promise<void>;
  deleteBudget(id: string): Promise<void>;

  // Maintenance
  linkTransactionsAsTransfer(
    id1: string,
    id2: string,
    transferId?: string,
  ): Promise<void>;
  unlinkTransactions(transferId: string): Promise<void>;
  clearAllData(): Promise<void>;
  exportData(ledgerId?: string): Promise<unknown>;
  importData(data: unknown, ledgerId?: string): Promise<void>;

  // AI Providers
  getAIProviders(): Promise<AIProvider[]>;
  addAIProvider(provider: Omit<AIProvider, "id">): Promise<AIProvider>;
  updateAIProvider(provider: AIProvider): Promise<void>;
  deleteAIProvider(id: string): Promise<void>;
  setDefaultAIProvider(id: string): Promise<void>;

  // Scheduled backups
  getBackupConfigs(): Promise<BackupConfig[]>;
  /** Schedules whose `nextBackup` is at or before `nowIso` (an ISO string). */
  getDueBackupConfigs(nowIso: string): Promise<BackupConfig[]>;
  getBackupConfig(id: string): Promise<BackupConfig | undefined>;
  addBackupConfig(config: BackupConfig): Promise<void>;
  updateBackupConfig(
    id: string,
    changes: Partial<Omit<BackupConfig, "id">>,
  ): Promise<void>;
  deleteBackupConfig(id: string): Promise<void>;
}

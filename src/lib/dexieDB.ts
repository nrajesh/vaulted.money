import Dexie, { Table } from "dexie";
import {
  Transaction,
  Budget,
  Vendor,
  Category,
  ScheduledTransaction,
  Account,
  SubCategory,
  BackupConfig,
  SafetyBackup,
  AIProvider,
} from "@/types/dataProvider";

// Extend the interfaces to include Dexie-specific keys (optional, but good for TS)
// We reuse the DataProvider interfaces which already have 'id'.

// Interfaces removed; imported from types/dataProvider
// Extended interfaces can be defined here if strictly Dexie specific, but we use shared ones.

export interface Ledger {
  id: string;
  name: string;
  short_name?: string;
  icon?: string;
  currency: string;
  created_at: string;
  last_accessed: string;
}

export class FinanceDatabase extends Dexie {
  transactions!: Table<Transaction>;
  scheduled_transactions!: Table<ScheduledTransaction>;
  budgets!: Table<Budget>;
  vendors!: Table<Vendor>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  sub_categories!: Table<SubCategory>;
  ledgers!: Table<Ledger>;
  backup_configs!: Table<BackupConfig>;
  ai_providers!: Table<AIProvider>;
  safety_backups!: Table<SafetyBackup>;

  constructor() {
    super("FinanceTrackerDB");

    // Schema definition
    // Note: ++id is not used because we use UUIDs (strings) for compatibility
    this.version(10).stores({
      transactions:
        "id, user_id, date, account, vendor, category, transfer_id, recurrence_id",
      scheduled_transactions: "id, user_id, date, account, vendor",
      budgets: "id, user_id, category_name, is_goal",
      vendors: "id, [user_id+name], name, is_account, account_id, user_id",
      accounts: "id, user_id, [user_id+remarks], type",
      categories: "id, [user_id+name], user_id, name",
      sub_categories: "id, user_id, category_id, name",
      ledgers: "id, name, last_accessed",
      backup_configs: "id, isActive, nextBackup",
      ai_providers: "id, name, type",
    });

    // Automatic safety copies taken before bulk changes
    this.version(11).stores({
      safety_backups: "id, created_at",
    });
  }
}

// Singleton pattern to prevent multiple instances during HMR
const globalForDb = globalThis as unknown as {
  financeTrackerDb: FinanceDatabase | undefined;
};

export const db = globalForDb.financeTrackerDb ?? new FinanceDatabase();

// Add listeners for debugging blocking issues
db.on("blocked", () => {
  console.error(
    "[Dexie] Database operation BLOCKED. You may have another tab open.",
  );
});

db.on("versionchange", () => {
  console.warn(
    "[Dexie] Database version change detected. Closing connection to allow upgrade.",
  );
  db.close();
});

if (process.env.NODE_ENV !== "production") globalForDb.financeTrackerDb = db;

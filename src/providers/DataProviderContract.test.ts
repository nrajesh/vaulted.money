import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/dexieDB";
import type {
  BackupConfig,
  DataProvider,
  Transaction,
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

    it("returns a category by id, or undefined when it does not exist", async () => {
      const categoryId = await provider.ensureCategoryExists("Food", LEDGER);

      expect(await provider.getCategoryById(categoryId!)).toMatchObject({
        id: categoryId,
        name: "Food",
        user_id: LEDGER,
      });
      expect(await provider.getCategoryById("missing")).toBeUndefined();
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

  describe("accounts", () => {
    it("updates only the account fields it is given", async () => {
      await provider.ensurePayeeExists("Checking", true, LEDGER, {
        currency: "USD",
        startingBalance: 100,
        remarks: "Main account",
      });
      const [account] = await provider.getAllAccounts(LEDGER);

      await provider.updateAccount(account.id, { currency: "EUR" });

      const [updated] = await provider.getAllAccounts(LEDGER);
      expect(updated).toMatchObject({
        id: account.id,
        currency: "EUR",
        starting_balance: 100,
        remarks: "Main account",
      });
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

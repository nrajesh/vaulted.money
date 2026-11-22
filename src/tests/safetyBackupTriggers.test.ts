import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import type { DataProvider } from "@/types/dataProvider";
import {
  generateBackupData,
  processEncryptedImport,
  processImport,
} from "@/utils/backupUtils";
import { encryptData } from "@/utils/crypto";
import { SafetyBackupFailedError } from "@/utils/safetyBackup";
import { generateDiverseDemoData } from "@/utils/demoDataGenerator";
import { createContinuitySync, type SyncMemory } from "@/utils/continuitySync";
import type { CSVRow } from "@/utils/csvUtils";

// Vite injects this at build time; vitest does not.
vi.stubGlobal("__APP_VERSION__", "test");

const LEDGER = "ledger-1";

/*
 * The CSV hook reads the provider, ledger and transactions contexts. The
 * provider is the real LocalDataProvider (set per test); the others are stubs.
 */
let currentProvider: DataProvider;
const setOperationProgress = vi.fn();

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => currentProvider,
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ activeLedger: { id: "ledger-1", currency: "EUR" } }),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    transactions: [],
    refetchTransactions: vi.fn(),
    refetchVendors: vi.fn().mockResolvedValue(undefined),
    refetchAccounts: vi.fn().mockResolvedValue(undefined),
    accountCurrencyMap: new Map([["Checking", "EUR"]]),
    setOperationProgress,
  }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// Parsing is not under test: hand the hook ready-made rows.
let csvRows: CSVRow[] = [];
vi.mock("@/utils/csvUtils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/utils/csvUtils")>();
  return {
    ...original,
    parseTransactionCSV: (
      _file: File,
      onComplete: (results: unknown) => void,
    ) => {
      void onComplete({
        data: csvRows,
        errors: [],
        meta: { fields: Object.keys(csvRows[0] ?? {}) },
      });
    },
  };
});

const addTransaction = (dp: DataProvider, vendor: string) =>
  dp.addTransaction({
    user_id: LEDGER,
    date: "2026-01-15",
    amount: -10,
    currency: "EUR",
    account: "Checking",
    vendor,
    category: "Food",
  } as Parameters<DataProvider["addTransaction"]>[0]);

const vendors = async (dp: DataProvider) =>
  (await dp.getTransactions(LEDGER)).map((t) => t.vendor).sort();

/** A backup file with the books of a throwaway provider holding `vendor`. */
const backupFileWith = async (dp: DataProvider, vendor: string) => {
  const before = await generateBackupData(dp);
  await db.transactions.clear();
  await addTransaction(dp, vendor);
  const file = JSON.stringify(await generateBackupData(dp));
  // Put the original books back.
  await dp.importData(before.data);
  return file;
};

describe("safety copy triggers", () => {
  let dp: DataProvider;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.open();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
    dp = new LocalDataProvider();
    currentProvider = dp;
  });

  it("processImport of a backup file makes a restore_file copy", async () => {
    await addTransaction(dp, "Before");
    const file = await backupFileWith(dp, "FromFile");

    const result = await processImport(file, dp);

    expect(result.type).toBe("success");
    const [copy] = await dp.listSafetyBackups();
    expect(copy.reason).toBe("restore_file");
    const saved = JSON.parse((await dp.getSafetyBackup(copy.id))!.payload);
    expect(
      saved.data.transactions.map((t: { vendor: string }) => t.vendor),
    ).toEqual(["Before"]);
    expect(await vendors(dp)).toEqual(["FromFile"]);
  });

  it("processImport stops with SafetyBackupFailedError when the copy fails, and imports with continueWithoutCopy", async () => {
    await addTransaction(dp, "Before");
    const file = await backupFileWith(dp, "FromFile");
    vi.spyOn(dp, "saveSafetyBackup").mockRejectedValue(new Error("full"));

    await expect(processImport(file, dp)).rejects.toBeInstanceOf(
      SafetyBackupFailedError,
    );
    expect(await vendors(dp)).toEqual(["Before"]);

    const result = await processImport(file, dp, { continueWithoutCopy: true });
    expect(result.type).toBe("success");
    expect(await vendors(dp)).toEqual(["FromFile"]);
  });

  it("processEncryptedImport makes a restore_file copy and is required", async () => {
    await addTransaction(dp, "Before");
    const file = await encryptData(
      await backupFileWith(dp, "FromFile"),
      "secret",
    );

    const spy = vi
      .spyOn(dp, "saveSafetyBackup")
      .mockRejectedValueOnce(new Error("full"));
    await expect(
      processEncryptedImport(file, "secret", dp),
    ).rejects.toBeInstanceOf(SafetyBackupFailedError);
    expect(await vendors(dp)).toEqual(["Before"]);
    spy.mockRestore();

    const result = await processEncryptedImport(file, "secret", dp);
    expect(result.type).toBe("success");
    const [copy] = await dp.listSafetyBackups();
    expect(copy.reason).toBe("restore_file");
    expect(await vendors(dp)).toEqual(["FromFile"]);
  });

  it("generating demo data keeps a demo_data copy of the previous data", async () => {
    await addTransaction(dp, "Seeded");

    await generateDiverseDemoData(dp, () => {}, {
      now: new Date(2026, 10, 22, 12),
      seed: 7,
    });

    const copies = await dp.listSafetyBackups();
    expect(copies).toHaveLength(1);
    expect(copies[0].reason).toBe("demo_data");
    const saved = JSON.parse((await dp.getSafetyBackup(copies[0].id))!.payload);
    expect(
      saved.data.transactions.map((t: { vendor: string }) => t.vendor),
    ).toContain("Seeded");
  }, 60_000);

  it("generating demo data stops when the copy fails, unless the person continues", async () => {
    await addTransaction(dp, "Seeded");
    vi.spyOn(dp, "saveSafetyBackup").mockRejectedValue(new Error("full"));

    await expect(
      generateDiverseDemoData(dp, () => {}, { seed: 7 }),
    ).rejects.toBeInstanceOf(SafetyBackupFailedError);
    expect(await vendors(dp)).toEqual(["Seeded"]);

    await generateDiverseDemoData(dp, () => {}, {
      seed: 7,
      continueWithoutCopy: true,
    });
    expect(await vendors(dp)).not.toContain("Seeded");
  }, 60_000);

  describe("continuity sync", () => {
    const makeFolder = () => {
      const files = new Map<string, string>();
      const write = vi.fn(
        async (_folder: unknown, name: string, content: string) => {
          files.set(name, content);
        },
      );
      return {
        files,
        write,
        io: {
          read: async (_folder: unknown, name: string) => {
            const text = files.get(name);
            if (text === undefined) {
              const error = new Error("not here");
              error.name = "NotFoundError";
              throw error;
            }
            return text;
          },
          write,
        },
      };
    };

    const makeMemory = (): SyncMemory => {
      let lastHash: string | null = null;
      return {
        getLastHash: () => lastHash,
        setLastHash: (hash) => {
          lastHash = hash;
        },
      };
    };

    /** Pushes this device's books, then changes the file as another device would. */
    const startWithChangedFile = async () => {
      await addTransaction(dp, "Local");
      const folder = makeFolder();
      const engine = createContinuitySync({
        io: folder.io,
        memory: makeMemory(),
      });
      engine.configure({
        dataProvider: dp,
        folder: "shared",
        passphrase: null,
        onLoaded: vi.fn(),
      });
      await engine.syncNow(); // push: write #1
      expect(folder.write).toHaveBeenCalledTimes(1);

      const envelope = JSON.parse(folder.files.get("ledger.json")!);
      const first = envelope.data.transactions[0];
      envelope.data.transactions.push({
        ...first,
        id: "from-other-device",
        vendor: "Remote",
      });
      folder.files.set("ledger.json", JSON.stringify(envelope));
      return { folder, engine };
    };

    it("continuity load makes a sync copy", async () => {
      const { engine } = await startWithChangedFile();

      await engine.syncNow(); // pull

      const [copy] = await dp.listSafetyBackups();
      expect(copy.reason).toBe("sync");
      const saved = JSON.parse((await dp.getSafetyBackup(copy.id))!.payload);
      expect(
        saved.data.transactions.map((t: { vendor: string }) => t.vendor),
      ).toEqual(["Local"]);
      expect(await vendors(dp)).toEqual(["Local", "Remote"]);
    });

    it("a sync that loads changes writes the sync file once", async () => {
      const { engine, folder } = await startWithChangedFile();

      await engine.syncNow(); // pull, makes a copy
      await engine.syncNow(); // in step: the copy changed nothing

      expect(engine.getStatus().state).toBe("idle");
      expect(folder.write).toHaveBeenCalledTimes(1);
      expect(await dp.listSafetyBackups()).toHaveLength(1);
    });

    it("an unchanged sync makes no copy", async () => {
      await addTransaction(dp, "Local");
      const folder = makeFolder();
      const engine = createContinuitySync({
        io: folder.io,
        memory: makeMemory(),
      });
      engine.configure({
        dataProvider: dp,
        folder: "shared",
        passphrase: null,
        onLoaded: vi.fn(),
      });
      await engine.syncNow(); // push
      await engine.syncNow(); // in step
      expect(await dp.listSafetyBackups()).toHaveLength(0);
    });
  });

  it("transaction CSV import makes a csv_import copy with entity transactions", async () => {
    const { useTransactionCSV } =
      await import("@/hooks/transactions/useTransactionCSV");
    await addTransaction(dp, "Before");
    csvRows = [
      {
        Date: "16/01/2026",
        Account: "Checking",
        Vendor: "Imported",
        Category: "Food",
        Amount: "-5",
        Remarks: "",
        Currency: "EUR",
        Frequency: "None",
        "End Date": "",
      },
    ];

    const { result } = renderHook(() => useTransactionCSV());
    const file = new File(["x"], "t.csv", { type: "text/csv" });
    result.current.handleFileChange({
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>);

    await waitFor(async () => {
      expect(await dp.listSafetyBackups()).toHaveLength(1);
    });
    const [copy] = await dp.listSafetyBackups();
    expect(copy.reason).toBe("csv_import");
    expect(copy.entity).toBe("transactions");
    const saved = JSON.parse((await dp.getSafetyBackup(copy.id))!.payload);
    expect(
      saved.data.transactions.map((t: { vendor: string }) => t.vendor),
    ).toEqual(["Before"]);
  });
});

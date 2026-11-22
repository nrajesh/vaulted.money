import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import type { AIProvider, DataProvider } from "@/types/dataProvider";
import {
  SafetyBackupFailedError,
  makeSafetyBackup,
  restoreSafetyBackup,
  withSafetyBackup,
} from "./safetyBackup";

// Vite injects this at build time; vitest does not.
vi.stubGlobal("__APP_VERSION__", "test");

const LEDGER = "ledger-1";

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

const vendorsInCopy = async (dp: DataProvider, id: string) => {
  const copy = await dp.getSafetyBackup(id);
  const parsed = JSON.parse(copy!.payload);
  return (parsed.data.transactions as { vendor: string }[]).map(
    (t) => t.vendor,
  );
};

const providerWithKey = (name: string) =>
  ({
    name,
    type: "OPENAI",
    baseUrl: "https://example.test",
    api_key: "k",
  }) as unknown as Omit<AIProvider, "id">;

describe("safetyBackup", () => {
  let dp: DataProvider;

  beforeEach(async () => {
    await db.open();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
    dp = new LocalDataProvider();
  });

  it("makes a copy before running the operation", async () => {
    await addTransaction(dp, "Before");
    const { result, backedUp } = await withSafetyBackup(
      dp,
      { reason: "csv_import", entity: "transactions" },
      async () => {
        await addTransaction(dp, "After");
        return 42;
      },
    );
    expect(result).toBe(42);
    expect(backedUp).toBe(true);
    const [summary] = await dp.listSafetyBackups();
    expect(summary.reason).toBe("csv_import");
    expect(summary.entity).toBe("transactions");
    expect(await vendorsInCopy(dp, summary.id)).toEqual(["Before"]);
  });

  it("still runs and reports backedUp false when the copy fails", async () => {
    vi.spyOn(dp, "saveSafetyBackup").mockRejectedValue(new Error("full"));
    const run = vi.fn().mockResolvedValue("ok");
    const out = await withSafetyBackup(dp, { reason: "sync" }, run);
    expect(run).toHaveBeenCalled();
    expect(out).toEqual({ result: "ok", backedUp: false });
  });

  it("makeSafetyBackup returns null instead of throwing", async () => {
    vi.spyOn(dp, "saveSafetyBackup").mockRejectedValue(new Error("full"));
    expect(await makeSafetyBackup(dp, { reason: "sync" })).toBeNull();
  });

  it("stops a required operation when the copy fails", async () => {
    vi.spyOn(dp, "saveSafetyBackup").mockRejectedValue(new Error("full"));
    const run = vi.fn().mockResolvedValue("ok");
    await expect(
      withSafetyBackup(dp, { reason: "demo_data", required: true }, run),
    ).rejects.toBeInstanceOf(SafetyBackupFailedError);
    expect(run).not.toHaveBeenCalled();

    const out = await withSafetyBackup(
      dp,
      { reason: "demo_data", required: true, continueWithoutCopy: true },
      run,
    );
    expect(run).toHaveBeenCalledTimes(1);
    expect(out.backedUp).toBe(false);
  });

  it("restores a copy and keeps the AI providers on the device", async () => {
    await addTransaction(dp, "Original");
    await dp.addAIProvider(providerWithKey("First"));
    const copy = await makeSafetyBackup(dp, { reason: "sync" });
    await addTransaction(dp, "Changed");
    await dp.addAIProvider(providerWithKey("Second"));

    await restoreSafetyBackup(dp, copy!.id);

    const exported = (await dp.exportData()) as {
      transactions: { vendor: string }[];
    };
    expect(exported.transactions.map((t) => t.vendor)).toEqual(["Original"]);

    const providers = (await dp.getAIProviders()) as (AIProvider & {
      api_key?: string;
    })[];
    expect(providers.map((p) => p.name).sort()).toEqual(["First", "Second"]);
    expect(providers.every((p) => p.api_key === "k")).toBe(true);
  });

  it("makes an undo copy before restoring and keeps the restored copy", async () => {
    await addTransaction(dp, "Original");
    const copy = await makeSafetyBackup(dp, { reason: "sync" });
    for (let i = 0; i < 5; i++) {
      await addTransaction(dp, `Later${i}`);
      await makeSafetyBackup(dp, { reason: "csv_import" });
    }
    expect((await dp.listSafetyBackups()).length).toBe(5);
    // The oldest (the one we want) was already pruned; take a fresh target.
    expect(
      (await dp.listSafetyBackups()).find((b) => b.id === copy!.id),
    ).toBeUndefined();
    const oldest = (await dp.listSafetyBackups()).at(-1)!;

    await restoreSafetyBackup(dp, oldest.id);

    const list = await dp.listSafetyBackups();
    expect(list.length).toBe(5);
    expect(list[0].reason).toBe("restore_safety_copy");
    expect(list.some((b) => b.id === oldest.id)).toBe(true);
  });

  it("a copy never contains AI keys", async () => {
    await addTransaction(dp, "Original");
    await dp.addAIProvider(providerWithKey("First"));
    const copy = await makeSafetyBackup(dp, { reason: "sync" });
    const stored = await dp.getSafetyBackup(copy!.id);
    expect(stored!.payload).not.toContain('"k"');
    expect(stored!.payload).not.toContain("api_key");
    expect(stored!.payload).toContain("First");
  });
});

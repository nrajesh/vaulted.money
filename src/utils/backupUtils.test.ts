import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  generateBackupData,
  processEncryptedImport,
  unwrapBackupEnvelope,
} from "./backupUtils";
import { encryptData } from "./crypto";
import type { DataProvider } from "@/types/dataProvider";

beforeAll(() => {
  vi.stubGlobal("__APP_VERSION__", "0.0.0-test");
});

const bareData = { transactions: [{ id: "t1" }], accounts: [] };

const makeProvider = () =>
  ({
    exportData: vi.fn().mockResolvedValue(bareData),
    importData: vi.fn().mockResolvedValue(undefined),
  }) as unknown as DataProvider;

describe("unwrapBackupEnvelope", () => {
  it("returns the inner data of an envelope produced by generateBackupData", async () => {
    const envelope = await generateBackupData(makeProvider());
    expect(unwrapBackupEnvelope(envelope)).toEqual(bareData);
  });

  it("leaves legacy bare backups untouched", () => {
    expect(unwrapBackupEnvelope(bareData)).toBe(bareData);
  });
});

describe("processEncryptedImport", () => {
  it("imports an encrypted envelope (as exported by the API) without Invalid data format", async () => {
    const provider = makeProvider();
    const envelope = await generateBackupData(provider);
    const encrypted = await encryptData(JSON.stringify(envelope), "pw");

    const result = await processEncryptedImport(encrypted, "pw", provider);

    expect(result).toEqual({ type: "success" });
    expect(provider.importData).toHaveBeenCalledWith(bareData);
  });
});

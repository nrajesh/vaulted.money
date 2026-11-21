import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataProvider } from "@/types/dataProvider";
import {
  canonicalJson,
  conflictFileName,
  createContinuitySync,
  decideSync,
  decodeSyncFile,
  encodeSyncFile,
  fingerprintBooks,
  SYNC_FILE_NAME,
  type SyncMemory,
} from "./continuitySync";

beforeEach(() => {
  vi.stubGlobal("__APP_VERSION__", "0.0.0-test");
});

type Books = { transactions: { id: string; amount: number }[] } & Record<
  string,
  unknown
>;

/** A device: its books, an export/import pair and its own sync memory. */
const makeDevice = (initial: Books) => {
  let books: Books = structuredClone(initial);
  let lastHash: string | null = null;
  const dataProvider = {
    exportData: vi.fn(async () => structuredClone(books)),
    importData: vi.fn(async (data: unknown) => {
      books = structuredClone(data as Books);
    }),
  } as unknown as DataProvider;
  const memory: SyncMemory = {
    getLastHash: () => lastHash,
    setLastHash: (hash) => {
      lastHash = hash;
    },
  };
  return {
    dataProvider,
    memory,
    get books() {
      return books;
    },
    edit(update: (current: Books) => Books) {
      books = update(structuredClone(books));
    },
  };
};

/** A shared folder, as iCloud Drive or Dropbox would present it. */
const makeFolder = () => {
  const files = new Map<string, string>();
  return {
    files,
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
      write: async (_folder: unknown, name: string, content: string) => {
        files.set(name, content);
      },
    },
  };
};

const startSync = (
  device: ReturnType<typeof makeDevice>,
  folder: ReturnType<typeof makeFolder>,
  passphrase: string | null = null,
) => {
  const engine = createContinuitySync({
    io: folder.io,
    memory: device.memory,
    now: () => new Date(2026, 10, 21, 15, 30, 5),
  });
  const onLoaded = vi.fn();
  engine.configure({
    dataProvider: device.dataProvider,
    folder: "shared",
    passphrase,
    onLoaded,
  });
  return { engine, onLoaded };
};

const coffee = { id: "t1", amount: -4 };
const rent = { id: "t2", amount: -900 };
const salary = { id: "t3", amount: 2500 };

describe("decideSync", () => {
  it.each([
    [{ localHash: "a", fileHash: null, lastHash: null }, "push"],
    [{ localHash: "a", fileHash: "a", lastHash: null }, "in-sync"],
    [{ localHash: "a", fileHash: "b", lastHash: "a" }, "pull"],
    [{ localHash: "b", fileHash: "a", lastHash: "a" }, "push"],
    [{ localHash: "b", fileHash: "c", lastHash: "a" }, "conflict"],
    // Never synced from here and the copies differ: ask, do not guess.
    [{ localHash: "b", fileHash: "c", lastHash: null }, "conflict"],
  ] as const)("%o → %s", (input, expected) => {
    expect(decideSync(input)).toBe(expected);
  });
});

describe("fingerprintBooks", () => {
  it("ignores key order, row order, settings and last-opened times", async () => {
    const a = await fingerprintBooks({
      transactions: [coffee, rent],
      ledgers: [{ id: "l1", name: "Home", last_accessed: "2026-01-01" }],
      theme: "dark",
      exportedAt: "2026-01-01",
    });
    const b = await fingerprintBooks({
      transactions: [
        { amount: -900, id: "t2" },
        { amount: -4, id: "t1" },
      ],
      ledgers: [{ name: "Home", id: "l1", last_accessed: "2026-11-21" }],
      theme: "light",
      exportedAt: "2026-11-21",
    });
    expect(a).toBe(b);
  });

  it("changes when a transaction changes", async () => {
    const before = await fingerprintBooks({ transactions: [coffee] });
    const after = await fingerprintBooks({
      transactions: [{ ...coffee, amount: -5 }],
    });
    expect(before).not.toBe(after);
  });

  it("writes keys in a stable order", () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: undefined }] })).toBe(
      '{"a":[{"d":2}],"b":1}',
    );
  });
});

describe("sync file format", { timeout: 30_000 }, () => {
  const envelope = {
    appVersion: "2.0.0",
    schemaVersion: 8,
    exportTimestamp: "2026-11-21T00:00:00Z",
    data: { transactions: [coffee] },
  };

  it("round-trips an encrypted file and hides its contents", async () => {
    const text = await encodeSyncFile(envelope, "correct horse");
    expect(text).not.toContain("t1");
    const decoded = await decodeSyncFile(text, ["correct horse"]);
    expect(decoded).toEqual({
      kind: "ok",
      data: envelope.data,
      usedPassphrase: "correct horse",
    });
  });

  it("reports a locked file and a wrong passphrase", async () => {
    const text = await encodeSyncFile(envelope, "correct horse");
    expect(await decodeSyncFile(text, [null])).toEqual({ kind: "locked" });
    expect(await decodeSyncFile(text, ["battery staple"])).toEqual({
      kind: "wrong-passphrase",
    });
  });

  it("opens with the previous passphrase after a change", async () => {
    const text = await encodeSyncFile(envelope, "old passphrase");
    const decoded = await decodeSyncFile(text, [
      "new passphrase",
      "old passphrase",
    ]);
    expect(decoded).toMatchObject({
      kind: "ok",
      usedPassphrase: "old passphrase",
    });
  });

  it("refuses a file from a newer layout", async () => {
    const text = JSON.stringify({ ...envelope, schemaVersion: 99 });
    expect(await decodeSyncFile(text, [null])).toEqual({
      kind: "newer-version",
      schemaVersion: 99,
    });
  });

  it("reads plain files and bare legacy data", async () => {
    expect(
      await decodeSyncFile(JSON.stringify(envelope), [null]),
    ).toMatchObject({ kind: "ok", usedPassphrase: null });
    expect(
      await decodeSyncFile(JSON.stringify({ transactions: [] }), [null]),
    ).toMatchObject({ kind: "ok" });
    expect(await decodeSyncFile(null, [null])).toEqual({ kind: "missing" });
  });

  it("names conflict copies by local time", () => {
    expect(conflictFileName(new Date(2026, 10, 21, 9, 5, 7))).toBe(
      "ledger-conflict-2026-11-21-090507.json",
    );
  });
});

describe("continuity sync between two devices", { timeout: 30_000 }, () => {
  it("writes the first copy, then carries a change to the other device", async () => {
    const folder = makeFolder();
    const phone = makeDevice({ transactions: [coffee] });
    const desktop = makeDevice({ transactions: [coffee] });

    await startSync(phone, folder).engine.syncNow();
    expect(folder.files.has(SYNC_FILE_NAME)).toBe(true);

    const desktopSync = startSync(desktop, folder);
    await desktopSync.engine.syncNow();
    expect(desktopSync.engine.getStatus().state).toBe("idle");

    // The phone records a purchase; the desktop picks it up on opening.
    phone.edit((books) => ({
      ...books,
      transactions: [...books.transactions, rent],
    }));
    await startSync(phone, folder).engine.syncNow();
    await desktopSync.engine.syncNow();

    expect(desktop.books.transactions).toEqual([coffee, rent]);
    expect(desktopSync.onLoaded).toHaveBeenCalledTimes(1);
  });

  it("does not overwrite this device's unsynced change with an old file", async () => {
    const folder = makeFolder();
    const phone = makeDevice({ transactions: [coffee] });
    const phoneSync = startSync(phone, folder);
    await phoneSync.engine.syncNow();

    // Edited here; the app is reopened before the change was written out.
    phone.edit((books) => ({ ...books, transactions: [coffee, salary] }));
    await phoneSync.engine.syncNow();

    expect(phone.books.transactions).toEqual([coffee, salary]);
    expect(phone.dataProvider.importData).not.toHaveBeenCalled();
    const decoded = await decodeSyncFile(folder.files.get(SYNC_FILE_NAME)!, [
      null,
    ]);
    expect(decoded).toMatchObject({
      data: { transactions: [coffee, salary] },
    });
  });

  it("asks when both devices changed, and keeps the other copy aside", async () => {
    const folder = makeFolder();
    const phone = makeDevice({ transactions: [coffee] });
    const desktop = makeDevice({ transactions: [coffee] });
    const phoneSync = startSync(phone, folder);
    const desktopSync = startSync(desktop, folder);
    await phoneSync.engine.syncNow();
    await desktopSync.engine.syncNow();

    phone.edit((books) => ({ ...books, transactions: [coffee, rent] }));
    desktop.edit((books) => ({ ...books, transactions: [coffee, salary] }));
    await phoneSync.engine.syncNow();
    await desktopSync.engine.syncNow();

    const status = desktopSync.engine.getStatus();
    expect(status).toEqual({
      state: "conflict",
      conflictFile: "ledger-conflict-2026-11-21-153005.json",
    });
    // Further changes wait for the answer instead of deciding it.
    await desktopSync.engine.syncNow();
    expect(desktop.books.transactions).toEqual([coffee, salary]);

    await desktopSync.engine.resolveConflict("this-device");
    const kept = await decodeSyncFile(folder.files.get(SYNC_FILE_NAME)!, [
      null,
    ]);
    const aside = await decodeSyncFile(
      folder.files.get("ledger-conflict-2026-11-21-153005.json")!,
      [null],
    );
    expect(kept).toMatchObject({ data: { transactions: [coffee, salary] } });
    expect(aside).toMatchObject({ data: { transactions: [coffee, rent] } });
    expect(desktopSync.engine.getStatus().state).toBe("idle");
  });

  it("can take the other device's copy and keep this one aside", async () => {
    const folder = makeFolder();
    const phone = makeDevice({ transactions: [coffee] });
    const desktop = makeDevice({ transactions: [salary] });
    await startSync(phone, folder).engine.syncNow();
    const desktopSync = startSync(desktop, folder);
    await desktopSync.engine.syncNow();
    expect(desktopSync.engine.getStatus().state).toBe("conflict");

    await desktopSync.engine.resolveConflict("sync-folder");
    expect(desktop.books.transactions).toEqual([coffee]);
    const aside = await decodeSyncFile(
      folder.files.get("ledger-conflict-2026-11-21-153005.json")!,
      [null],
    );
    expect(aside).toMatchObject({ data: { transactions: [salary] } });
  });

  it("encrypts the file and stops on a device without the passphrase", async () => {
    const folder = makeFolder();
    const phone = makeDevice({ transactions: [coffee] });
    await startSync(phone, folder, "correct horse").engine.syncNow();
    expect(folder.files.get(SYNC_FILE_NAME)).not.toContain("t1");

    const desktop = makeDevice({ transactions: [salary] });
    const locked = startSync(desktop, folder);
    await locked.engine.syncNow();
    expect(locked.engine.getStatus()).toEqual({ state: "locked" });
    // The unreadable file is left alone.
    const stillEncrypted = await decodeSyncFile(
      folder.files.get(SYNC_FILE_NAME)!,
      ["correct horse"],
    );
    expect(stillEncrypted).toMatchObject({
      data: { transactions: [coffee] },
    });
  });

  it("re-encrypts the file when the passphrase is set or changed", async () => {
    const folder = makeFolder();
    const phone = makeDevice({ transactions: [coffee] });
    const { engine, onLoaded } = startSync(phone, folder);
    await engine.syncNow();
    expect(folder.files.get(SYNC_FILE_NAME)).toContain("t1");

    const configure = (passphrase: string | null) =>
      engine.configure({
        dataProvider: phone.dataProvider,
        folder: "shared",
        passphrase,
        onLoaded,
      });

    configure("first passphrase");
    await engine.syncNow();
    expect(
      await decodeSyncFile(folder.files.get(SYNC_FILE_NAME)!, [
        "first passphrase",
      ]),
    ).toMatchObject({ kind: "ok" });

    configure("second passphrase");
    await engine.syncNow();
    expect(
      await decodeSyncFile(folder.files.get(SYNC_FILE_NAME)!, [
        "second passphrase",
      ]),
    ).toMatchObject({ kind: "ok", usedPassphrase: "second passphrase" });

    configure(null);
    await engine.syncNow();
    expect(folder.files.get(SYNC_FILE_NAME)).toContain("t1");
  });

  it("batches a burst of changes into one write", async () => {
    const folder = makeFolder();
    const write = vi.spyOn(folder.io, "write");
    const phone = makeDevice({ transactions: [coffee] });
    const engine = createContinuitySync({
      io: folder.io,
      memory: phone.memory,
      changeDelayMs: 10,
    });
    engine.configure({
      dataProvider: phone.dataProvider,
      folder: "shared",
      passphrase: null,
      onLoaded: vi.fn(),
    });
    engine.notifyChange();
    engine.notifyChange();
    engine.notifyChange();
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Waits for the queued sync; finds nothing new to write.
    await engine.syncNow();
    expect(write).toHaveBeenCalledTimes(1);
  });
});

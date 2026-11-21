import type { DataProvider } from "@/types/dataProvider";
import { decryptData, encryptData } from "./crypto";
import { generateBackupData, SYNC_SCHEMA_VERSION } from "./backupUtils";
import { readSyncFile, writeSyncFile } from "./fs-adapter";

/**
 * Cross-device continuity through a folder the person chooses (one that
 * iCloud Drive, Google Drive, Dropbox or Nextcloud keeps in step between
 * devices). The cloud service only ever moves a file; it never runs code and,
 * with a sync passphrase, cannot read the file either.
 *
 * How two copies are reconciled
 * -----------------------------
 * Each device remembers a fingerprint (SHA-256) of the books as they were at
 * its last successful sync. On every sync it compares three fingerprints:
 *
 *   local  = the books on this device now
 *   file   = the books in the sync folder now
 *   last   = the books when this device last synced
 *
 * - local == file                → already in step.
 * - no file yet                  → write this device's books.
 * - local == last (file moved)   → only the other device changed: load the file.
 * - file == last (local moved)   → only this device changed: write the file.
 * - all three differ             → both changed. Nothing is overwritten; the
 *                                   person chooses which copy to keep, and the
 *                                   other copy is saved next to it as
 *                                   `ledger-conflict-<time>.json`.
 *
 * This replaces the old behaviour of loading the file on every start, which
 * silently threw away any change this device had not yet written out.
 *
 * Only the books are compared (ledgers, accounts, payees, categories,
 * transactions, schedules, budgets). Settings that ride along in the file
 * (theme, currencies, AI providers) and the "last opened" time of a ledger do
 * not count as a change, so opening the app on two devices never conflicts.
 */

export const SYNC_FILE_NAME = "ledger.json";

const COMPARED_TABLES = [
  "ledgers",
  "accounts",
  "vendors",
  "categories",
  "sub_categories",
  "transactions",
  "scheduled_transactions",
  "budgets",
] as const;

/** Fields that change just by using the app, not by editing the books. */
const IGNORED_FIELDS = new Set(["last_accessed"]);

/**
 * JSON with object keys sorted and ignored fields dropped, so the same books
 * give the same text on every device whatever order the database stored the
 * fields in.
 */
export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item ?? null)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined && !IGNORED_FIELDS.has(key))
    .sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sortById = (rows: unknown[]): unknown[] =>
  [...rows].sort((a, b) => {
    const idA = String((a as { id?: unknown })?.id ?? "");
    const idB = String((b as { id?: unknown })?.id ?? "");
    return idA < idB ? -1 : idA > idB ? 1 : 0;
  });

/** SHA-256 of the books in an export (settings and timestamps left out). */
export const fingerprintBooks = async (data: unknown): Promise<string> => {
  const source = (data ?? {}) as Record<string, unknown>;
  const books: Record<string, unknown> = {};
  for (const table of COMPARED_TABLES) {
    const rows = source[table];
    books[table] = Array.isArray(rows) ? sortById(rows) : [];
  }
  const bytes = new TextEncoder().encode(canonicalJson(books));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export type SyncDecision = "in-sync" | "push" | "pull" | "conflict";

/** The three-way comparison described at the top of this file. */
export const decideSync = ({
  localHash,
  fileHash,
  lastHash,
}: {
  localHash: string;
  fileHash: string | null;
  lastHash: string | null;
}): SyncDecision => {
  if (fileHash === null) return "push";
  if (localHash === fileHash) return "in-sync";
  if (lastHash !== null && localHash === lastHash) return "pull";
  if (lastHash !== null && fileHash === lastHash) return "push";
  return "conflict";
};

export type DecodedSyncFile =
  | { kind: "missing" }
  | { kind: "locked" }
  | { kind: "wrong-passphrase" }
  | { kind: "newer-version"; schemaVersion: number }
  | { kind: "unreadable"; message: string }
  | { kind: "ok"; data: unknown; usedPassphrase: string | null };

const isEncryptedPackage = (parsed: unknown) => {
  const candidate = parsed as Record<string, unknown> | null;
  return Boolean(
    candidate && candidate.ciphertext && candidate.iv && candidate.salt,
  );
};

/**
 * Reads the text of a sync file. Accepts the plain envelope written before
 * sync passphrases existed, the encrypted envelope, and bare legacy data.
 * Tries each passphrase given (the current one, then the one it replaced).
 */
export const decodeSyncFile = async (
  content: string | null,
  passphrases: Array<string | null>,
): Promise<DecodedSyncFile> => {
  if (content === null || content.trim() === "") return { kind: "missing" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { kind: "unreadable", message: "The sync file is not valid JSON." };
  }

  // The passphrase that opened the file (null for a plain file).
  let usedPassphrase: string | null = null;
  if (isEncryptedPackage(parsed)) {
    const candidates = [
      ...new Set(passphrases.filter((p): p is string => Boolean(p))),
    ];
    if (candidates.length === 0) return { kind: "locked" };
    let opened = false;
    for (const candidate of candidates) {
      try {
        parsed = JSON.parse(await decryptData(content, candidate));
        usedPassphrase = candidate;
        opened = true;
        break;
      } catch {
        // Try the next one.
      }
    }
    if (!opened) return { kind: "wrong-passphrase" };
  }

  const envelope = parsed as {
    appVersion?: unknown;
    schemaVersion?: unknown;
    data?: unknown;
  };
  if (envelope && envelope.appVersion && envelope.data) {
    const schemaVersion = Number(envelope.schemaVersion);
    // A newer app may store things this one does not know about; loading it
    // would drop them, and writing back would delete them on the other device.
    if (Number.isFinite(schemaVersion) && schemaVersion > SYNC_SCHEMA_VERSION) {
      return { kind: "newer-version", schemaVersion };
    }
    return { kind: "ok", data: envelope.data, usedPassphrase };
  }
  const bare = parsed as { transactions?: unknown } | null;
  if (bare && Array.isArray(bare.transactions)) {
    return { kind: "ok", data: bare, usedPassphrase };
  }
  return {
    kind: "unreadable",
    message: "The sync file does not contain Vaulted Money data.",
  };
};

/** Text for a sync file: the backup envelope, encrypted when there is a passphrase. */
export const encodeSyncFile = async (
  envelope: unknown,
  passphrase: string | null,
): Promise<string> => {
  const json = JSON.stringify(envelope, null, 2);
  return passphrase ? encryptData(json, passphrase) : json;
};

const isMissingFileError = (error: unknown) => {
  if (error instanceof Error && error.name === "NotFoundError") return true;
  const message = error instanceof Error ? error.message : String(error);
  return /ENOENT|does not exist|not found|no such file/i.test(message);
};

/** `ledger-conflict-2026-11-21-1530.json`, in local time. */
export const conflictFileName = (now: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `ledger-conflict-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
};

// --- The engine -----------------------------------------------------------

export type SyncStatus =
  | { state: "off" }
  | { state: "idle"; lastSyncedAt: number | null }
  | { state: "syncing"; loading: boolean }
  | { state: "locked" }
  | { state: "wrong-passphrase" }
  | { state: "newer-version" }
  | { state: "conflict"; conflictFile: string }
  | { state: "error"; message: string };

export type ConflictChoice = "this-device" | "sync-folder";

export interface SyncFileIO {
  read: (folder: unknown, name: string) => Promise<string>;
  write: (folder: unknown, name: string, content: string) => Promise<void>;
}

export interface SyncSettings {
  dataProvider: DataProvider;
  folder: unknown;
  passphrase: string | null;
  /** Called after the books were replaced from the sync file. */
  onLoaded: () => Promise<void> | void;
}

export interface SyncMemory {
  getLastHash: () => string | null;
  setLastHash: (hash: string | null) => void;
}

const LAST_HASH_KEY = "vm.sync.lastHash";

/** Per-device memory of the last synced fingerprint (localStorage, guarded). */
export const localSyncMemory: SyncMemory = {
  getLastHash: () => {
    try {
      return localStorage.getItem(LAST_HASH_KEY);
    } catch {
      return null;
    }
  },
  setLastHash: (hash) => {
    try {
      if (hash) localStorage.setItem(LAST_HASH_KEY, hash);
      else localStorage.removeItem(LAST_HASH_KEY);
    } catch {
      // Not remembered; the next sync compares without it and may ask.
    }
  },
};

// Looked up on each call, not bound once, so tests can mock the adapter.
const defaultIO: SyncFileIO = {
  read: (folder, name) => readSyncFile(folder, name),
  write: (folder, name, content) => writeSyncFile(folder, name, content),
};

interface PendingConflict {
  fileData: unknown;
  fileHash: string;
}

export const createContinuitySync = ({
  io = defaultIO,
  memory = localSyncMemory,
  now = () => new Date(),
  changeDelayMs = 800,
}: {
  io?: SyncFileIO;
  memory?: SyncMemory;
  now?: () => Date;
  changeDelayMs?: number;
} = {}) => {
  let settings: SyncSettings | null = null;
  // The passphrase before the latest change, so a file it locked still opens
  // and can be written again with the new one (or without one).
  let previousPassphrase: string | null = null;
  let status: SyncStatus = { state: "off" };
  let lastSyncedAt: number | null = null;
  let conflict: PendingConflict | null = null;
  let queue: Promise<void> = Promise.resolve();
  let changeTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const setStatus = (next: SyncStatus) => {
    status = next;
    listeners.forEach((listener) => listener());
  };

  const writeFile = async (name: string, envelope: unknown) => {
    if (!settings) return;
    const text = await encodeSyncFile(envelope, settings.passphrase);
    await io.write(settings.folder, name, text);
  };

  const markSynced = (hash: string) => {
    memory.setLastHash(hash);
    lastSyncedAt = now().getTime();
    setStatus({ state: "idle", lastSyncedAt });
  };

  const load = async (data: unknown, hash: string) => {
    if (!settings) return;
    setStatus({ state: "syncing", loading: true });
    await settings.dataProvider.importData(data);
    markSynced(hash);
    await settings.onLoaded();
  };

  const readFileText = async (): Promise<string | null> => {
    if (!settings) return null;
    try {
      return await io.read(settings.folder, SYNC_FILE_NAME);
    } catch (error) {
      if (isMissingFileError(error)) return null;
      throw error;
    }
  };

  const runOnce = async () => {
    if (!settings) return;
    // An open conflict waits for the person; never decide it behind their back.
    if (conflict) return;
    setStatus({ state: "syncing", loading: false });

    const decoded = await decodeSyncFile(await readFileText(), [
      settings.passphrase,
      previousPassphrase,
    ]);
    // In each of these cases writing would destroy a file this device cannot
    // read, so stop and tell the person instead.
    if (decoded.kind === "locked") return setStatus({ state: "locked" });
    if (decoded.kind === "wrong-passphrase")
      return setStatus({ state: "wrong-passphrase" });
    if (decoded.kind === "newer-version")
      return setStatus({ state: "newer-version" });
    if (decoded.kind === "unreadable")
      return setStatus({ state: "error", message: decoded.message });

    const localEnvelope = await generateBackupData(settings.dataProvider);
    const localHash = await fingerprintBooks(localEnvelope.data);
    const fileHash =
      decoded.kind === "ok" ? await fingerprintBooks(decoded.data) : null;
    const decision = decideSync({
      localHash,
      fileHash,
      lastHash: memory.getLastHash(),
    });

    if (decision === "in-sync") {
      // Write the file again when the passphrase was set, changed or removed.
      if (
        decoded.kind === "ok" &&
        decoded.usedPassphrase !== settings.passphrase
      ) {
        await writeFile(SYNC_FILE_NAME, localEnvelope);
      }
      return markSynced(localHash);
    }
    if (decision === "push") {
      await writeFile(SYNC_FILE_NAME, localEnvelope);
      return markSynced(localHash);
    }
    if (decision === "pull" && decoded.kind === "ok") {
      return load(decoded.data, fileHash as string);
    }
    if (decoded.kind === "ok") {
      conflict = {
        fileData: decoded.data,
        fileHash: fileHash as string,
      };
      setStatus({ state: "conflict", conflictFile: conflictFileName(now()) });
    }
  };

  const enqueue = (task: () => Promise<void>) => {
    queue = queue.then(task).catch((error: unknown) => {
      console.error("Continuity sync failed:", error);
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    });
    return queue;
  };

  return {
    /** Starts, changes or (with null) stops syncing. */
    configure(next: SyncSettings | null) {
      if (settings && next && settings.passphrase !== next.passphrase) {
        previousPassphrase = settings.passphrase;
      }
      settings = next;
      if (!next) {
        conflict = null;
        if (changeTimer) clearTimeout(changeTimer);
        changeTimer = null;
        setStatus({ state: "off" });
      } else if (status.state === "off") {
        setStatus({ state: "idle", lastSyncedAt });
      }
    },

    /** Syncs now (app opened, came back to the front, or is being left). */
    syncNow() {
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = null;
      if (!settings) return Promise.resolve();
      return enqueue(runOnce);
    },

    /** Something changed here; sync shortly, once a burst of edits settles. */
    notifyChange() {
      if (!settings) return;
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        changeTimer = null;
        void enqueue(runOnce);
      }, changeDelayMs);
    },

    /**
     * Settles a conflict. The copy not chosen is written next to the sync
     * file (encrypted like it), so nothing is lost either way.
     */
    resolveConflict(choice: ConflictChoice) {
      return enqueue(async () => {
        if (!settings || !conflict || status.state !== "conflict") return;
        const pending = conflict;
        const keepAside = status.conflictFile;
        conflict = null;
        // Read this device's books again: edits made while the question was
        // open belong to the copy being kept or set aside, too.
        const localEnvelope = await generateBackupData(settings.dataProvider);
        if (choice === "this-device") {
          await writeFile(keepAside, {
            ...localEnvelope,
            data: pending.fileData,
          });
          await writeFile(SYNC_FILE_NAME, localEnvelope);
          markSynced(await fingerprintBooks(localEnvelope.data));
        } else {
          await writeFile(keepAside, localEnvelope);
          await load(pending.fileData, pending.fileHash);
        }
      });
    },

    /** Forget the last sync (a different folder was picked). */
    forget() {
      memory.setLastHash(null);
      conflict = null;
      if (status.state !== "off") setStatus({ state: "idle", lastSyncedAt });
    },

    getStatus: () => status,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type ContinuitySync = ReturnType<typeof createContinuitySync>;

/** The one engine the app uses. */
export const continuitySync = createContinuitySync();

// --- Sync passphrase --------------------------------------------------------

const PASSPHRASE_KEY = "vm.sync.passphrase";
const passphraseListeners = new Set<() => void>();

/**
 * The passphrase that encrypts the sync file. Kept on this device only, like
 * AI keys: it is never written into a backup or the sync file itself, and
 * every device that shares the folder needs the same one.
 */
export const getSyncPassphrase = (): string | null => {
  try {
    return localStorage.getItem(PASSPHRASE_KEY) || null;
  } catch {
    return null;
  }
};

export const setSyncPassphrase = (passphrase: string | null) => {
  try {
    if (passphrase) localStorage.setItem(PASSPHRASE_KEY, passphrase);
    else localStorage.removeItem(PASSPHRASE_KEY);
  } catch {
    // Storage blocked: the passphrase lasts until the app is closed.
  }
  passphraseListeners.forEach((listener) => listener());
};

export const subscribeSyncPassphrase = (listener: () => void) => {
  passphraseListeners.add(listener);
  return () => {
    passphraseListeners.delete(listener);
  };
};

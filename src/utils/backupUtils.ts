import { DataProvider } from "@/types/dataProvider";
import { decryptData } from "./crypto";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { showSuccess } from "./toast";

/**
 * Save content to a file, using File System Access API if available,
 * falling back to legacy download.
 */
export const saveFile = async (
  filename: string,
  content: string,
  description: string,
): Promise<boolean> => {
  try {
    // Native Mobile Save Route (Bypasses Blob URLs)
    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      showSuccess(`Saved to Documents: ${filename}`);
      return true;
    }

    // Try File System Access API first (Chrome/Edge/Desktop)
    // @ts-expect-error - showSaveFilePicker is not yet in all TS definitions
    if (window.showSaveFilePicker) {
      // @ts-expect-error - showSaveFilePicker types
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: description,
            accept: {
              "application/json": [".json", ".lock"],
              "text/csv": [".csv"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    }
    throw new Error("File System Access API not supported");
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Save cancelled by user", { cause: err });
    }

    // Fallback to classic download
    const element = document.createElement("a");

    // Use application/octet-stream to force download in stubborn browsers (like Safari)
    // instead of opening the JSON in a tab.
    const mimeType = filename.endsWith(".csv")
      ? "text/csv;charset=utf-8"
      : "application/octet-stream";

    const BOM = filename.endsWith(".csv") ? "\uFEFF" : "";
    const file = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(file);

    element.href = url;
    element.download = filename;
    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    // Cleanup with a small delay to ensure the click is registered
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }, 100);

    return false; // Indicates fallback was used
  }
};

/**
 * Generate a full backup object (all ledgers)
 * Wrapped in a SyncPayloadEnvelope for cross-device compatibility version checking.
 */
export const generateBackupData = async (dataProvider: DataProvider) => {
  const rawData = await dataProvider.exportData();
  return {
    appVersion: __APP_VERSION__,
    schemaVersion: 8, // Manually synced to Dexie schema version in dexieDB.ts
    exportTimestamp: new Date().toISOString(),
    data: rawData,
  };
};

/**
 * Backups (from the app and from the Local API) wrap the data in a
 * `{ appVersion, schemaVersion, exportTimestamp, data }` envelope, while
 * `importData` expects the bare data. Returns the inner data for an envelope
 * and the input unchanged otherwise (legacy backups have no envelope).
 */
export const unwrapBackupEnvelope = (parsed: unknown): unknown => {
  const candidate = parsed as { appVersion?: unknown; data?: unknown } | null;
  return candidate && candidate.appVersion && candidate.data
    ? candidate.data
    : parsed;
};

/**
 * Process import of a backup file string.
 * Detects encryption and returns necessary next steps or success.
 */
export type ImportResult =
  | { type: "success" }
  | { type: "encrypted"; content: string }
  | { type: "warning"; message: string; dataToImport: unknown } // Added warning type for version mismatch
  | { type: "error"; message: string };

export const processImport = async (
  content: string,
  dataProvider: DataProvider,
): Promise<ImportResult> => {
  try {
    const parsed = JSON.parse(content);
    if (parsed.ciphertext && parsed.iv && parsed.salt) {
      return { type: "encrypted", content: content };
    } else {
      let dataToImport = parsed;
      if (parsed.appVersion && parsed.schemaVersion && parsed.data) {
        // This is a SyncPayloadEnvelope
        dataToImport = parsed.data;
        const currentVersion = __APP_VERSION__;
        if (
          parsed.appVersion !== currentVersion ||
          parsed.schemaVersion !== 8 // Dexie schema version
        ) {
          return {
            type: "warning",
            message: `The imported data is from an incompatible version (App: ${parsed.appVersion}, Schema: ${parsed.schemaVersion}). Importing this data may cause corruption. Do you want to proceed?`,
            dataToImport: dataToImport,
          };
        }
      }

      await dataProvider.importData(dataToImport);
      return { type: "success" };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invalid file format";
    return { type: "error", message };
  }
};

/**
 * Decrypt and import data
 */
export const processEncryptedImport = async (
  content: string,
  password: string,
  dataProvider: DataProvider,
): Promise<ImportResult> => {
  try {
    const decryptedParams = await decryptData(content, password);
    const data = unwrapBackupEnvelope(JSON.parse(decryptedParams));
    await dataProvider.importData(data);
    return { type: "success" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Decryption failed";
    return { type: "error", message };
  }
};

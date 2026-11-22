import type {
  DataProvider,
  SafetyBackupReason,
  SafetyBackupSummary,
} from "@/types/dataProvider";
import { generateBackupData, unwrapBackupEnvelope } from "./backupUtils";

/** Thrown when a required safety copy could not be made and the person has not agreed to go on without one. */
export class SafetyBackupFailedError extends Error {
  constructor(message = "Could not make a safety copy before this change") {
    super(message);
    this.name = "SafetyBackupFailedError";
  }
}

export interface SafetyBackupOptions {
  reason: SafetyBackupReason;
  entity?: string;
  required?: boolean; // restore + demo data: true
  continueWithoutCopy?: boolean; // person confirmed after a failure
  protectId?: string;
}

/**
 * Copies must never hold AI keys (they are secrets and are never exported).
 * Keys normally live in localStorage, but a provider row may carry one, so
 * drop any key-like field from the provider rows before storing.
 */
const withoutAiKeys = (backup: { data: unknown }) => {
  const data = backup.data as { ai_providers?: Record<string, unknown>[] };
  if (!Array.isArray(data?.ai_providers)) return backup;
  return {
    ...backup,
    data: {
      ...data,
      ai_providers: data.ai_providers.map((provider) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { api_key, apiKey, ...rest } = provider;
        return rest;
      }),
    },
  };
};

/** Stores a copy of everything. Never throws; returns null when the copy failed. */
export async function makeSafetyBackup(
  dp: DataProvider,
  options: SafetyBackupOptions,
): Promise<SafetyBackupSummary | null> {
  try {
    const backup = withoutAiKeys(await generateBackupData(dp));
    const ledgers = (backup.data as { ledgers?: unknown[] }).ledgers;
    return await dp.saveSafetyBackup(
      {
        reason: options.reason,
        entity: options.entity,
        ledger_count: Array.isArray(ledgers) ? ledgers.length : 0,
        payload: JSON.stringify(backup),
      },
      { protectId: options.protectId },
    );
  } catch (error) {
    console.error("Safety backup failed", error);
    return null;
  }
}

/**
 * Makes a copy, then runs the operation. A failed copy does not block the
 * operation unless it is `required` and the person has not chosen to go on.
 */
export async function withSafetyBackup<T>(
  dp: DataProvider,
  options: SafetyBackupOptions,
  run: () => Promise<T>,
): Promise<{ result: T; backedUp: boolean }> {
  const copy = await makeSafetyBackup(dp, options);
  if (!copy && options.required && !options.continueWithoutCopy) {
    throw new SafetyBackupFailedError();
  }
  return { result: await run(), backedUp: copy !== null };
}

/**
 * Replaces the data with a stored copy. An undo copy of the current data is
 * made first (and the copy being restored is protected from pruning), so a
 * restore can itself be undone.
 */
export async function restoreSafetyBackup(
  dp: DataProvider,
  id: string,
  options: { continueWithoutCopy?: boolean } = {},
): Promise<void> {
  const copy = await dp.getSafetyBackup(id);
  if (!copy) throw new Error("Safety copy not found");
  const data = unwrapBackupEnvelope(JSON.parse(copy.payload));

  /*
   * Why AI providers are carried over: copies never contain AI keys, and the
   * import replaces the provider table with the copy's. Without this step a
   * restore would silently disconnect every AI provider on the device. So we
   * read the providers as they are now (with their keys) and put them back
   * afterwards, by id, over whatever the copy brought. `updateAIProvider`
   * is an upsert, so it also re-adds providers the copy did not have while
   * keeping their ids (the keys in localStorage are stored per id).
   */
  const deviceProviders = await dp.getAIProviders();

  await withSafetyBackup(
    dp,
    {
      reason: "restore_safety_copy",
      required: true,
      continueWithoutCopy: options.continueWithoutCopy,
      protectId: id,
    },
    async () => {
      await dp.importData(data);
      for (const provider of deviceProviders) {
        await dp.updateAIProvider(provider);
      }
    },
  );
}

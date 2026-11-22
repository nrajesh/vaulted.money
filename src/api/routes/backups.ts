import { z } from "zod";
import type { BackupConfig } from "@/types/dataProvider";
import {
  generateBackupData,
  processImport,
  restoreWithSafetyCopy,
} from "@/utils/backupUtils";
import { decryptData, encryptData } from "@/utils/crypto";
import {
  restoreSafetyBackup,
  SafetyBackupFailedError,
  withSafetyBackup,
} from "@/utils/safetyBackup";
import {
  ApiError,
  badRequest,
  conflict,
  fileResponse,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import type { RouteContext, RouteDef } from "../router";
import { requireLedger } from "./shared";

const exportSchema = z.object({
  ledger_id: z.string().optional(),
  /** Encrypts the backup with AES-GCM (same format as in-app encrypted backups). */
  password: z.string().min(1).optional(),
});

const importSchema = z
  .object({
    /** Raw backup file text (plain or encrypted). */
    content: z.string().min(1).optional(),
    /** Alternatively, an already-parsed plain backup object. */
    backup: z.record(z.string(), z.unknown()).optional(),
    password: z.string().min(1).optional(),
    /** Restore into this existing ledger instead of replacing everything. */
    ledger_id: z.string().optional(),
    /** Proceed even if the backup came from a different app/schema version. */
    force: z.boolean().default(false),
    /** Restoring overwrites existing data; this must be set to proceed. */
    confirm_replace: z.literal(true, {
      error: "restoring replaces existing data; set confirm_replace to true",
    }),
    /**
     * A safety copy of the current data is made before restoring. If it cannot
     * be made the restore is refused with 409; set this to restore anyway.
     */
    continue_without_safety_copy: z.boolean().default(false),
  })
  .refine((v) => Boolean(v.content) !== Boolean(v.backup), {
    message: 'provide exactly one of "content" or "backup"',
  });

const safetyRestoreSchema = z.object({
  /** Restoring replaces all current data with the copy; this must be set to proceed. */
  confirm_restore: z.literal(true, {
    error:
      "restoring a safety copy replaces all current data; set confirm_restore to true",
  }),
  /**
   * An undo copy of the current data is made first. If it cannot be made the
   * restore is refused with 409; set this to restore anyway.
   */
  continue_without_safety_copy: z.boolean().default(false),
});

const safetyDeleteSchema = z.object({
  /** Deleting a safety copy cannot be undone; this must be set to proceed. */
  confirm_delete: z.literal(true, {
    error: "this deletes the safety copy; set confirm_delete to true",
  }),
});

/**
 * A restore that needs a safety copy first, when that copy could not be made
 * (for example storage is full). The data is left as it was.
 */
const safetyCopyFailed = () =>
  new ApiError(
    409,
    "safety_copy_failed",
    'Could not make a safety copy of the current data, so nothing was restored. Retry with "continue_without_safety_copy": true to restore without one.',
  );

/** Runs a restore, turning a failed required safety copy into a 409. */
async function guardSafetyCopy<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof SafetyBackupFailedError) throw safetyCopyFailed();
    throw error;
  }
}

const schedulePatchSchema = z.object({
  is_active: z.boolean().optional(),
  frequency_ms: z.number().int().min(60_000).optional(),
});

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw badRequest("Backup content is not valid JSON");
  }
};

const isEncryptedBackup = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  "ciphertext" in value &&
  "iv" in value &&
  "salt" in value;

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

async function buildBackup(
  ctx: RouteContext,
  ledgerId: string | undefined,
  password: string | undefined,
) {
  const dp = ctx.services.dataProvider;
  let envelope;
  if (ledgerId) {
    await requireLedger(ctx.services, ledgerId);
    // Same envelope as a full backup so the import path treats both alike.
    const full = await generateBackupData(dp);
    envelope = { ...full, data: await dp.exportData(ledgerId) };
  } else {
    envelope = await generateBackupData(dp);
  }
  const plain = JSON.stringify(envelope, null, 2);
  const scope = ledgerId ? `ledger-${ledgerId.slice(0, 8)}` : "all";
  if (password) {
    return fileResponse(
      await encryptData(plain, password),
      "application/octet-stream",
      `vaultedmoney-backup-${scope}-${stamp()}.lock`,
    );
  }
  return fileResponse(
    plain,
    "application/json",
    `vaultedmoney-backup-${scope}-${stamp()}.json`,
  );
}

/** Strips fields that are secrets or not serialisable (password hash, folder handle). */
const presentSchedule = (config: {
  id: string;
  frequency: number;
  isActive: boolean;
  nextBackup: string;
  lastBackup?: string;
  path?: string;
  encrypted?: boolean;
}) => ({
  id: config.id,
  frequency_ms: config.frequency,
  is_active: config.isActive,
  next_backup: config.nextBackup,
  last_backup: config.lastBackup ?? null,
  path: config.path ?? null,
  encrypted: Boolean(config.encrypted),
});

export const backupRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/backups/export",
    summary:
      "Download an unencrypted backup of everything, or one ledger with ?ledger_id=",
    query: {
      ledger_id: "Limit the backup to one ledger",
    },
    handler: (ctx) => {
      if (ctx.query.password !== undefined) {
        throw badRequest(
          "Passwords must not be sent in the URL; use POST /backups/export",
        );
      }
      return buildBackup(ctx, ctx.query.ledger_id, undefined);
    },
  },
  {
    method: "POST",
    path: "/backups/export",
    summary:
      "Generate a backup download, optionally for one ledger and/or password-encrypted",
    body: exportSchema,
    handler: (ctx) => {
      const { ledger_id, password } = parse(exportSchema, ctx.body);
      return buildBackup(ctx, ledger_id, password);
    },
  },
  {
    method: "POST",
    path: "/backups/import",
    summary:
      "Restore a backup. DESTRUCTIVE: replaces existing data and requires confirm_replace=true",
    body: importSchema,
    handler: async (ctx) => {
      const input = parse(importSchema, ctx.body);
      const dp = ctx.services.dataProvider;
      if (input.ledger_id) await requireLedger(ctx.services, input.ledger_id);

      let content = input.content ?? JSON.stringify(input.backup);
      let parsed = parseJson(content);
      if (isEncryptedBackup(parsed)) {
        if (!input.password) {
          throw badRequest('This backup is encrypted; provide "password"');
        }
        try {
          content = await decryptData(content, input.password);
        } catch {
          throw badRequest(
            "Could not decrypt the backup: wrong password or corrupt file",
          );
        }
        parsed = parseJson(content);
      }

      /*
       * Every restore path replaces data, so each first makes a required
       * safety copy of everything (reason "restore_file"), as restoring a file
       * in the app does. If that copy fails the restore is refused with 409
       * unless the caller set continue_without_safety_copy.
       */
      const copyOptions = {
        continueWithoutCopy: input.continue_without_safety_copy,
      };
      const result = await guardSafetyCopy(async () => {
        if (input.ledger_id) {
          const ledgerId = input.ledger_id;
          // processImport has no ledger targeting, so unwrap the envelope here.
          const envelope = parsed as { data?: unknown; appVersion?: string };
          const data =
            envelope.appVersion && envelope.data ? envelope.data : parsed;
          await withSafetyBackup(
            dp,
            { reason: "restore_file", required: true, ...copyOptions },
            () => dp.importData(data, ledgerId),
          );
          return { type: "success" as const };
        }
        const imported = await processImport(content, dp, copyOptions);
        if (imported.type !== "warning") return imported;
        if (!input.force) {
          throw conflict(
            `${imported.message} Retry with "force": true to proceed.`,
          );
        }
        await restoreWithSafetyCopy(dp, imported.dataToImport, copyOptions);
        return { type: "success" as const };
      });

      if (result.type === "error") {
        throw new ApiError(400, "import_failed", result.message);
      }
      return { ...json({ restored: true }), reloadUi: true };
    },
  },
  {
    method: "GET",
    path: "/backups/safety",
    summary:
      "List automatic safety copies made before imports, AI changes and sync",
    handler: async ({ services }) =>
      // Summaries only: the stored content (the payload) is never returned.
      json({
        items: (await services.dataProvider.listSafetyBackups()).map(
          (copy) => ({
            id: copy.id,
            reason: copy.reason,
            entity: copy.entity ?? null,
            created_at: copy.created_at,
            ledger_count: copy.ledger_count,
          }),
        ),
      }),
  },
  {
    method: "POST",
    path: "/backups/safety/:safetyId/restore",
    summary:
      "Restore an automatic safety copy (mirrors the Restore button on the Backup screen)",
    body: safetyRestoreSchema,
    handler: async ({ params, body, services }) => {
      const input = parse(safetyRestoreSchema, body);
      const dp = services.dataProvider;
      if (!(await dp.getSafetyBackup(params.safetyId))) {
        throw notFound(`Safety copy "${params.safetyId}"`);
      }
      await guardSafetyCopy(() =>
        restoreSafetyBackup(dp, params.safetyId, {
          continueWithoutCopy: input.continue_without_safety_copy,
        }),
      );
      return { ...json({ restored: params.safetyId }), reloadUi: true };
    },
  },
  {
    method: "DELETE",
    path: "/backups/safety/:safetyId",
    summary: "Delete an automatic safety copy",
    body: safetyDeleteSchema,
    handler: async ({ params, body, services }) => {
      parse(safetyDeleteSchema, body);
      const dp = services.dataProvider;
      if (!(await dp.getSafetyBackup(params.safetyId))) {
        throw notFound(`Safety copy "${params.safetyId}"`);
      }
      return json({
        deleted: await dp.deleteSafetyBackups([params.safetyId]),
      });
    },
  },
  {
    method: "GET",
    path: "/backups/schedules",
    summary: "List scheduled backup configurations",
    handler: async ({ services }) =>
      json({
        data: (await services.dataProvider.getBackupConfigs()).map(
          presentSchedule,
        ),
      }),
  },
  {
    method: "PATCH",
    path: "/backups/schedules/:scheduleId",
    summary: "Enable/disable a scheduled backup or change its frequency",
    body: schedulePatchSchema,
    handler: async ({ params, body, services }) => {
      const patch = parse(schedulePatchSchema, body);
      const dataProvider = services.dataProvider;
      const existing = await dataProvider.getBackupConfig(params.scheduleId);
      if (!existing) throw notFound(`Backup schedule "${params.scheduleId}"`);
      const update: Partial<Omit<BackupConfig, "id">> = {};
      if (patch.is_active !== undefined) update.isActive = patch.is_active;
      if (patch.frequency_ms !== undefined) {
        update.frequency = patch.frequency_ms;
        update.nextBackup = new Date(
          Date.now() + patch.frequency_ms,
        ).toISOString();
      }
      await dataProvider.updateBackupConfig(existing.id, update);
      return json(
        presentSchedule((await dataProvider.getBackupConfig(existing.id))!),
      );
    },
  },
  {
    method: "DELETE",
    path: "/backups/schedules/:scheduleId",
    summary: "Delete a scheduled backup configuration",
    handler: async ({ params, services }) => {
      const dataProvider = services.dataProvider;
      if (!(await dataProvider.getBackupConfig(params.scheduleId))) {
        throw notFound(`Backup schedule "${params.scheduleId}"`);
      }
      await dataProvider.deleteBackupConfig(params.scheduleId);
      return noContent();
    },
  },
];

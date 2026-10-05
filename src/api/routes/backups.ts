import { z } from "zod";
import { db } from "@/lib/dexieDB";
import { generateBackupData, processImport } from "@/utils/backupUtils";
import { decryptData, encryptData } from "@/utils/crypto";
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
  })
  .refine((v) => Boolean(v.content) !== Boolean(v.backup), {
    message: 'provide exactly one of "content" or "backup"',
  });

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

      let result;
      if (input.ledger_id) {
        // processImport has no ledger targeting, so unwrap the envelope here.
        const envelope = parsed as { data?: unknown; appVersion?: string };
        const data =
          envelope.appVersion && envelope.data ? envelope.data : parsed;
        await dp.importData(data, input.ledger_id);
        result = { type: "success" as const };
      } else {
        result = await processImport(content, dp);
        if (result.type === "warning") {
          if (!input.force) {
            throw conflict(
              `${result.message} Retry with "force": true to proceed.`,
            );
          }
          await dp.importData(result.dataToImport);
          result = { type: "success" as const };
        }
      }

      if (result.type === "error") {
        throw new ApiError(400, "import_failed", result.message);
      }
      return { ...json({ restored: true }), reloadUi: true };
    },
  },
  {
    method: "GET",
    path: "/backups/schedules",
    summary: "List scheduled backup configurations",
    handler: async () =>
      json({ data: (await db.backup_configs.toArray()).map(presentSchedule) }),
  },
  {
    method: "PATCH",
    path: "/backups/schedules/:scheduleId",
    summary: "Enable/disable a scheduled backup or change its frequency",
    body: schedulePatchSchema,
    handler: async ({ params, body }) => {
      const patch = parse(schedulePatchSchema, body);
      const existing = await db.backup_configs.get(params.scheduleId);
      if (!existing) throw notFound(`Backup schedule "${params.scheduleId}"`);
      const update: Record<string, unknown> = {};
      if (patch.is_active !== undefined) update.isActive = patch.is_active;
      if (patch.frequency_ms !== undefined) {
        update.frequency = patch.frequency_ms;
        update.nextBackup = new Date(
          Date.now() + patch.frequency_ms,
        ).toISOString();
      }
      await db.backup_configs.update(existing.id, update);
      return json(presentSchedule((await db.backup_configs.get(existing.id))!));
    },
  },
  {
    method: "DELETE",
    path: "/backups/schedules/:scheduleId",
    summary: "Delete a scheduled backup configuration",
    handler: async ({ params }) => {
      if (!(await db.backup_configs.get(params.scheduleId))) {
        throw notFound(`Backup schedule "${params.scheduleId}"`);
      }
      await db.backup_configs.delete(params.scheduleId);
      return noContent();
    },
  },
];

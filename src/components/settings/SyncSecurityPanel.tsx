import * as React from "react";
import { useTranslation } from "react-i18next";
import { Lock, LockOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useContinuitySyncStatus,
  useSyncPassphrase,
} from "@/hooks/useContinuitySync";
import { continuitySync, setSyncPassphrase } from "@/utils/continuitySync";
import { formatDisplayDate } from "@/utils/dateFormat";

const MIN_PASSPHRASE_LENGTH = 8;

const formatTime = (value: number, language: string) => {
  try {
    return new Intl.DateTimeFormat(language, {
      hour: "numeric",
      minute: "2-digit",
    }).format(value);
  } catch {
    return new Date(value).toLocaleTimeString();
  }
};

/**
 * The part of the continuity card that explains how to sync with a cloud
 * folder, encrypts the sync file with a passphrase, and says how the last
 * sync went.
 */
export const SyncSecurityPanel = () => {
  const { t, i18n } = useTranslation();
  const passphrase = useSyncPassphrase();
  const status = useContinuitySyncStatus();
  const [draft, setDraft] = React.useState("");
  const tooShort = draft.length > 0 && draft.length < MIN_PASSPHRASE_LENGTH;

  const savePassphrase = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.length < MIN_PASSPHRASE_LENGTH) return;
    setSyncPassphrase(draft);
    setDraft("");
  };

  const statusText = (() => {
    switch (status.state) {
      case "idle":
        return status.lastSyncedAt
          ? t("settings.sync.status.synced", {
              date: formatDisplayDate(status.lastSyncedAt, i18n.language),
              time: formatTime(status.lastSyncedAt, i18n.language),
              defaultValue: "Last synced {{date}}, {{time}}.",
            })
          : t("settings.sync.status.waiting", {
              defaultValue: "Waiting for the first sync.",
            });
      case "syncing":
        return t("settings.sync.status.syncing", {
          defaultValue: "Syncing…",
        });
      case "locked":
        return t("settings.sync.status.locked", {
          defaultValue:
            "The sync file is encrypted. Enter the passphrase you set on your other device.",
        });
      case "wrong-passphrase":
        return t("settings.sync.status.wrongPassphrase", {
          defaultValue:
            "The passphrase does not open the sync file. Enter the one you set on your other device.",
        });
      case "newer-version":
        return t("settings.sync.status.newerVersion", {
          defaultValue:
            "The sync file was written by a newer version of Vaulted Money. Update this app to keep syncing.",
        });
      case "conflict":
        return t("settings.sync.status.conflict", {
          defaultValue: "Waiting for you to choose which copy to keep.",
        });
      case "error":
        return t("settings.sync.status.error", {
          message: status.message,
          defaultValue: "Sync stopped: {{message}}",
        });
      default:
        return null;
    }
  })();
  const isProblem =
    status.state === "locked" ||
    status.state === "wrong-passphrase" ||
    status.state === "newer-version" ||
    status.state === "error";

  return (
    <div className="space-y-4 max-w-xl">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          {t("settings.sync.guide.step1", {
            defaultValue:
              "On each device, choose the same folder in iCloud Drive, Google Drive, Dropbox or Nextcloud.",
          })}
        </li>
        <li>
          {t("settings.sync.guide.step2", {
            defaultValue:
              "Set the same passphrase on each device. The file is encrypted before it leaves the device, so the cloud service cannot read it.",
          })}
        </li>
        <li>
          {t("settings.sync.guide.step3", {
            defaultValue:
              "Changes are saved to the folder as you work and picked up when you open the app on another device. If both devices changed, you choose which copy to keep.",
          })}
        </li>
      </ol>

      <form className="space-y-2" onSubmit={savePassphrase}>
        <Label
          htmlFor="sync-passphrase"
          className="flex items-center gap-2 font-medium"
        >
          {passphrase ? (
            <Lock className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          ) : (
            <LockOpen className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          )}
          {passphrase
            ? t("settings.sync.passphrase.on", {
                defaultValue: "Sync file is encrypted",
              })
            : t("settings.sync.passphrase.off", {
                defaultValue: "Sync file is not encrypted",
              })}
        </Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="sync-passphrase"
            type="password"
            autoComplete="new-password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              passphrase
                ? t("settings.sync.passphrase.changePlaceholder", {
                    defaultValue: "New passphrase",
                  })
                : t("settings.sync.passphrase.placeholder", {
                    defaultValue: "Sync passphrase",
                  })
            }
            aria-invalid={tooShort}
            aria-describedby="sync-passphrase-hint"
            className="min-w-0 flex-1"
          />
          <Button
            type="submit"
            disabled={draft.length < MIN_PASSPHRASE_LENGTH}
            className="h-auto whitespace-normal"
          >
            {passphrase
              ? t("settings.sync.passphrase.change", {
                  defaultValue: "Change passphrase",
                })
              : t("settings.sync.passphrase.set", {
                  defaultValue: "Encrypt sync file",
                })}
          </Button>
          {passphrase && (
            <Button
              type="button"
              variant="outline"
              className="h-auto whitespace-normal"
              onClick={() => setSyncPassphrase(null)}
            >
              {t("settings.sync.passphrase.remove", {
                defaultValue: "Stop encrypting",
              })}
            </Button>
          )}
        </div>
        <p id="sync-passphrase-hint" className="text-xs text-muted-foreground">
          {tooShort
            ? t("settings.sync.passphrase.tooShort", {
                min: MIN_PASSPHRASE_LENGTH,
                defaultValue: "Use at least {{min}} characters.",
              })
            : t("settings.sync.passphrase.hint", {
                defaultValue:
                  "Kept on this device only and never included in backups. Every device that uses the folder needs the same passphrase; if it is lost, choose an empty folder to start again.",
              })}
        </p>
      </form>

      {statusText && (
        <div className="flex flex-wrap items-center gap-2">
          <p
            role="status"
            className={
              isProblem
                ? "text-sm text-amber-800 dark:text-amber-300"
                : "text-sm text-muted-foreground"
            }
          >
            {statusText}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto whitespace-normal"
            disabled={status.state === "syncing"}
            onClick={() => void continuitySync.syncNow()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("settings.sync.syncNow", { defaultValue: "Sync now" })}
          </Button>
        </div>
      )}
    </div>
  );
};

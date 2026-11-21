import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSyncConfig } from "@/hooks/useSyncConfig";
import {
  useContinuitySyncStatus,
  useSyncPassphrase,
} from "@/hooks/useContinuitySync";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { continuitySync } from "@/utils/continuitySync";
import LoadingSpinner from "./feedback/LoadingSpinner";

/**
 * Runs continuity sync for the whole app (see `src/utils/continuitySync.ts`):
 * once when the app opens, whenever it comes back to the front, and when it is
 * left, so changes reach the folder before the device sleeps. Screens only
 * report changes through `useContinuitySync().triggerExport`.
 */
export const ContinuitySyncManager = () => {
  const { t } = useTranslation();
  const { config, isReady, needsPermission } = useSyncConfig();
  const passphrase = useSyncPassphrase();
  const dataProvider = useDataProvider();
  const { activeLedger, switchLedger } = useLedger();
  const queryClient = useQueryClient();
  const status = useContinuitySyncStatus();

  // Read through refs so a ledger switch does not restart syncing.
  const activeLedgerId = useRef<string | undefined>(activeLedger?.id);
  const switchLedgerRef = useRef(switchLedger);
  useEffect(() => {
    activeLedgerId.current = activeLedger?.id;
    switchLedgerRef.current = switchLedger;
  });

  const enabled =
    isReady &&
    config.autoSyncEnabled &&
    Boolean(config.syncDirectoryHandle) &&
    !needsPermission;

  useEffect(() => {
    if (!enabled) {
      continuitySync.configure(null);
      return;
    }
    continuitySync.configure({
      dataProvider,
      folder: config.syncDirectoryHandle,
      passphrase,
      onLoaded: async () => {
        // Stay in the ledger the person was using when it still exists.
        await queryClient.invalidateQueries();
        const ledgers = await dataProvider.getLedgers();
        const target =
          ledgers.find((ledger) => ledger.id === activeLedgerId.current) ??
          ledgers[0];
        if (target) await switchLedgerRef.current(target.id, target);
      },
    });
    void continuitySync.syncNow();

    const onVisibility = () => void continuitySync.syncNow();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [
    enabled,
    config.syncDirectoryHandle,
    passphrase,
    dataProvider,
    queryClient,
  ]);

  if (status.state === "syncing" && status.loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AlertDialog open={status.state === "conflict"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("sync.conflict.title", {
              defaultValue: "Changes on two devices",
            })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {t("sync.conflict.body", {
                  defaultValue:
                    "This device and another device both changed your books since they last synced. Choose which copy to keep.",
                })}
              </p>
              <p>
                {t("sync.conflict.keptAside", {
                  file: status.state === "conflict" ? status.conflictFile : "",
                  defaultValue:
                    "The other copy is saved in your sync folder as {{file}}, so nothing is lost. You can import it later if you need it.",
                })}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => void continuitySync.resolveConflict("sync-folder")}
          >
            {t("sync.conflict.useFolder", {
              defaultValue: "Use the other device's copy",
            })}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void continuitySync.resolveConflict("this-device")}
          >
            {t("sync.conflict.useDevice", {
              defaultValue: "Keep this device's copy",
            })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

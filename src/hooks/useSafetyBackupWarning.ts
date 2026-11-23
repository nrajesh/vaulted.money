import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Imports, AI changes and sync still go ahead when no safety copy could be
 * made (only restores and demo data require one). This returns a function
 * that warns the person in that case: call it with `backedUp` from
 * `withSafetyBackup` and it shows a toast only when the copy failed.
 */
export const useSafetyBackupWarning = (): ((backedUp: boolean) => void) => {
  const { t } = useTranslation();
  return useCallback(
    (backedUp: boolean) => {
      if (backedUp) return;
      toast.warning(
        t("safetyBackups.failedWarning", {
          defaultValue:
            "No safety copy could be made first, but the change went ahead.",
        }),
      );
    },
    [t],
  );
};

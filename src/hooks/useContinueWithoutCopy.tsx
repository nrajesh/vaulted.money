import * as React from "react";
import { useTranslation } from "react-i18next";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { SafetyBackupFailedError } from "@/utils/safetyBackup";

export type RequiredCopyAction = (options: {
  continueWithoutCopy?: boolean;
}) => Promise<void>;

/**
 * For the operations that replace everything (restoring a backup file and
 * generating demo data), a safety copy is required. When it cannot be made
 * the operation throws `SafetyBackupFailedError` without changing anything.
 *
 * `runRequired(action)` runs the action; on that error it asks the person
 * whether to go on without a copy and, if they agree, runs the action again
 * with `continueWithoutCopy: true`. Render `continueWithoutCopyDialog` once
 * on the screen. Other errors are passed on unchanged.
 */
export const useContinueWithoutCopy = () => {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] =
    React.useState<RequiredCopyAction | null>(null);

  const runRequired = React.useCallback(async (action: RequiredCopyAction) => {
    try {
      await action({});
    } catch (error) {
      if (error instanceof SafetyBackupFailedError) {
        // A function in state must be wrapped, or React would call it.
        setPendingAction(() => action);
        return;
      }
      throw error;
    }
  }, []);

  const continueWithoutCopyDialog = (
    <ConfirmationDialog
      isOpen={pendingAction !== null}
      onOpenChange={(open) => {
        if (!open) setPendingAction(null);
      }}
      onConfirm={() => {
        if (pendingAction) void pendingAction({ continueWithoutCopy: true });
      }}
      title={t("safetyBackups.continueWithoutCopyTitle", {
        defaultValue: "Continue without a safety copy?",
      })}
      description={t("safetyBackups.continueWithoutCopyBody", {
        defaultValue:
          "A safety copy of your current data couldn't be made, so this change can't be undone. Continue anyway?",
      })}
    />
  );

  return { runRequired, continueWithoutCopyDialog };
};

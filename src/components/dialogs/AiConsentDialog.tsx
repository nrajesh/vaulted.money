import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
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
import { getPendingAiConsent, subscribeAiConsent } from "@/utils/aiConsent";

/**
 * Asks once per AI provider before payee names are sent to it. Mounted at the
 * app root; opened by `requestAiConsent` in `src/utils/aiConsent.ts`.
 */
export const AiConsentDialog = () => {
  const { t } = useTranslation();
  const pending = useSyncExternalStore(
    subscribeAiConsent,
    getPendingAiConsent,
    () => null,
  );
  const provider = pending?.providerName ?? "";

  return (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        // Escape or clicking away counts as "Not now".
        if (!open) pending?.answer(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("aiConsent.title", {
              provider,
              defaultValue: "Send payee names to {{provider}}?",
            })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {t("aiConsent.what", {
                  provider,
                  defaultValue:
                    'To suggest categories, Vaulted Money sends {{provider}} the payee names you are categorising, such as "Starbucks", and the names of your categories.',
                })}
              </p>
              <p>
                {t("aiConsent.notSent", {
                  defaultValue:
                    "Amounts, dates, accounts and notes are never sent.",
                })}
              </p>
              <p>
                {t("aiConsent.policy", {
                  provider,
                  defaultValue:
                    "{{provider}} handles them under its own privacy policy. You'll only be asked once for this provider.",
                })}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="h-11"
            onClick={() => pending?.answer(false)}
          >
            {t("aiConsent.decline", { defaultValue: "Not now" })}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11"
            onClick={() => pending?.answer(true)}
          >
            {t("aiConsent.allow", { defaultValue: "Send payee names" })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

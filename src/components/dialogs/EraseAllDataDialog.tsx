import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EraseAllDataDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  /** How many ledgers will be lost. With none, no extra confirmation is needed. */
  ledgerCount: number;
  title: string;
  description: string;
  confirmText: string;
}

/**
 * Confirmation for actions that replace everything in the app. When there is
 * data to lose, the user must type a word before the button enables, so the
 * action cannot be triggered by a reflexive double click.
 */
const EraseAllDataDialog: React.FC<EraseAllDataDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  ledgerCount,
  title,
  description,
  confirmText,
}) => {
  const { t } = useTranslation();
  const [typed, setTyped] = React.useState("");
  // Deliberately not translated: it is typed exactly, in every language.
  const phrase = "ERASE";
  const needsTyping = ledgerCount > 0;
  const canConfirm = !needsTyping || typed.trim() === phrase;

  React.useEffect(() => {
    if (!isOpen) setTyped("");
  }, [isOpen]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {needsTyping && (
          <div className="space-y-2">
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {ledgerCount === 1
                ? t("dialogs.eraseAll.warningOne", {
                    defaultValue:
                      "1 ledger and everything in it will be permanently deleted.",
                  })
                : t("dialogs.eraseAll.warningMany", {
                    total: ledgerCount,
                    defaultValue:
                      "{{total}} ledgers and everything in them will be permanently deleted.",
                  })}
            </p>
            <Label htmlFor="erase-all-confirm">
              {t("dialogs.eraseAll.prompt", {
                phrase,
                defaultValue: "Type {{phrase}} to confirm",
              })}
            </Label>
            <Input
              id="erase-all-confirm"
              value={typed}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleConfirm();
              }}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EraseAllDataDialog;

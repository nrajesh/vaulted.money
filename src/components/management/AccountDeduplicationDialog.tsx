import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useLedger } from "@/contexts/LedgerContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";

interface AccountReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountDeduplicationDialog: React.FC<
  AccountReconciliationDialogProps
> = ({ isOpen, onClose }) => {
  const dataProvider = useDataProvider();
  const {
    refetchAccounts: _refetchAccounts,
    accounts: contextAccounts,
    invalidateAllData,
  } = useTransactions();
  const { activeLedger } = useLedger();
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedMaster, setSelectedMaster] = useState<string>("");
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);

  // Filter only accounts (is_account=true is handled by contextAccounts usually, but let's be safe)
  const accounts = useMemo(() => {
    // Typically contextAccounts are the ones displayed in Accounts page
    return contextAccounts.sort((a, b) => a.name.localeCompare(b.name));
  }, [contextAccounts]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMaster("");
      setSelectedDuplicates([]);
    }
  }, [isOpen]);

  const handleMerge = async () => {
    if (!selectedMaster || selectedDuplicates.length === 0) return;

    setIsProcessing(true);
    try {
      await dataProvider.mergePayees(
        selectedMaster,
        selectedDuplicates,
        activeLedger?.id || "",
      );
      showSuccess(
        `Successfully merged ${selectedDuplicates.length} accounts into ${selectedMaster}.`,
      );
      await invalidateAllData();
      onClose();
    } catch (error: unknown) {
      showError(`Merge failed: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const potentialDuplicates = useMemo(() => {
    return accounts.filter((a) => a.name !== selectedMaster);
  }, [accounts, selectedMaster]);

  const handleToggleDuplicate = (name: string) => {
    setSelectedDuplicates((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deduplicate Accounts</DialogTitle>
          <DialogDescription>
            Select the primary account you want to keep, then select the
            duplicate accounts to merge into it. All transactions from
            duplicates will be moved to the primary account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Primary Account (Keep this one)</Label>
            <Select
              value={selectedMaster}
              onValueChange={(val) => {
                setSelectedMaster(val);
                setSelectedDuplicates([]); // Reset duplicates if master changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.name}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMaster && (
            <div className="space-y-2">
              <Label>Duplicate Accounts (Merge these)</Label>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {potentialDuplicates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other accounts found.
                  </p>
                ) : (
                  potentialDuplicates.map((acc) => (
                    <div key={acc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dup-${acc.id}`}
                        checked={selectedDuplicates.includes(acc.name)}
                        onCheckedChange={() => handleToggleDuplicate(acc.name)}
                      />
                      <Label
                        htmlFor={`dup-${acc.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {acc.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected duplicates will be permanently deleted after their
                transactions are moved. Their recurring transactions and budgets
                are deleted too.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={
              isProcessing || !selectedMaster || selectedDuplicates.length === 0
            }
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Merge Accounts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDeduplicationDialog;

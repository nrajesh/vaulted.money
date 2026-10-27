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

interface VendorReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorDeduplicationDialog: React.FC<VendorReconciliationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const dataProvider = useDataProvider();
  const {
    refetchVendors: _refetchVendors,
    vendors: contextVendors,
    invalidateAllData,
  } = useTransactions();
  const { activeLedger } = useLedger();
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedMaster, setSelectedMaster] = useState<string>("");
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);

  // Filter payees (use contextVendors which typically excludes accounts or includes all?
  // In TransactionsContext, 'vendors' are payees. 'accounts' are accounts.
  // We use contextVendors here.
  const vendors = useMemo(() => {
    return contextVendors.sort((a, b) => a.name.localeCompare(b.name));
  }, [contextVendors]);

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
        `Successfully merged ${selectedDuplicates.length} vendors into ${selectedMaster}.`,
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
    return vendors.filter((v) => v.name !== selectedMaster);
  }, [vendors, selectedMaster]);

  const handleToggleDuplicate = (name: string) => {
    setSelectedDuplicates((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deduplicate Vendors</DialogTitle>
          <DialogDescription>
            Select the primary vendor you want to keep, then select the
            duplicate vendors to merge into it. All transactions from duplicates
            will be moved to the primary vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Primary Vendor (Keep this one)</Label>
            <Select
              value={selectedMaster}
              onValueChange={(val) => {
                setSelectedMaster(val);
                setSelectedDuplicates([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.name}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMaster && (
            <div className="space-y-2">
              <Label>Duplicate Vendors (Merge these)</Label>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {potentialDuplicates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other vendors found.
                  </p>
                ) : (
                  potentialDuplicates.map((v) => (
                    <div key={v.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dup-${v.id}`}
                        checked={selectedDuplicates.includes(v.name)}
                        onCheckedChange={() => handleToggleDuplicate(v.name)}
                      />
                      <Label
                        htmlFor={`dup-${v.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {v.name}
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
            Merge Vendors
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDeduplicationDialog;

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

interface CategoryReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryDeduplicationDialog: React.FC<
  CategoryReconciliationDialogProps
> = ({ isOpen, onClose }) => {
  const dataProvider = useDataProvider();
  const {
    refetchCategories: _refetchCategories,
    categories: contextCategories,
    invalidateAllData,
  } = useTransactions();
  const { activeLedger } = useLedger();
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedMaster, setSelectedMaster] = useState<string>("");
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);

  // Filter categories
  const categories = useMemo(() => {
    return contextCategories.sort((a, b) => a.name.localeCompare(b.name));
  }, [contextCategories]);

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
      await dataProvider.mergeCategories(
        selectedMaster,
        selectedDuplicates,
        activeLedger?.id || "",
      );
      showSuccess(
        `Successfully merged ${selectedDuplicates.length} categories into ${selectedMaster}.`,
      );
      await invalidateAllData();
      onClose();
    } catch (error: unknown) {
      showError(
        `Merge failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const potentialDuplicates = useMemo(() => {
    return categories.filter((c) => c.name !== selectedMaster);
  }, [categories, selectedMaster]);

  const handleToggleDuplicate = (name: string) => {
    setSelectedDuplicates((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deduplicate Categories</DialogTitle>
          <DialogDescription>
            Select the primary category you want to keep, then select the
            duplicate categories to merge into it. All transactions from
            duplicates will be moved to the primary category.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Primary Category (Keep this one)</Label>
            <Select
              value={selectedMaster}
              onValueChange={(val) => {
                setSelectedMaster(val);
                setSelectedDuplicates([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMaster && (
            <div className="space-y-2">
              <Label>Duplicate Categories (Merge these)</Label>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {potentialDuplicates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other categories found.
                  </p>
                ) : (
                  potentialDuplicates.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dup-${c.id}`}
                        checked={selectedDuplicates.includes(c.name)}
                        onCheckedChange={() => handleToggleDuplicate(c.name)}
                      />
                      <Label
                        htmlFor={`dup-${c.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {c.name}
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
            Merge Categories
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDeduplicationDialog;

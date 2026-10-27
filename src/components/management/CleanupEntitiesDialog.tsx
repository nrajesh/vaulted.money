import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";

interface CleanupEntitiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "vendor" | "category";
}

const CleanupEntitiesDialog: React.FC<CleanupEntitiesDialogProps> = ({
  isOpen,
  onClose,
  entityType,
}) => {
  const dataProvider = useDataProvider();
  const { vendors, categories, invalidateAllData } = useTransactions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [unusedEntities, setUnusedEntities] = useState<
    { id: string; name: string; totalTransactions?: number }[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const entities = entityType === "vendor" ? vendors : categories;
      // Filter those with 0 transactions
      const unused = entities.filter(
        (e: { id: string; name: string; totalTransactions?: number }) =>
          (e.totalTransactions || 0) === 0 &&
          e.name !== "Others" &&
          e.name !== "Transfer",
      );
      setUnusedEntities(unused);
      setSelectedIds([]);
    }
  }, [isOpen, entityType, vendors, categories]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(unusedEntities.map((e) => e.id));
    else setSelectedIds([]);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      if (entityType === "vendor") {
        // Each delete also removes the vendor's recurring transactions and
        // budgets in its ledger.
        await Promise.all(
          selectedIds.map((id) => dataProvider.deletePayee(id)),
        );
      } else {
        await Promise.all(
          selectedIds.map((id) => dataProvider.deleteCategory(id)),
        );
      }

      showSuccess(
        `Deleted ${selectedIds.length} unused ${entityType === "vendor" ? "payees" : "categories"}.`,
      );
      await invalidateAllData();
      onClose();
    } catch (error: unknown) {
      showError(
        `Failed to delete: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cleanup Unused {entityType === "vendor" ? "Payees" : "Categories"}
          </DialogTitle>
          <DialogDescription>
            The following {entityType === "vendor" ? "payees" : "categories"}{" "}
            have 0 associated transactions. Select the ones you wish to delete.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={
                unusedEntities.length > 0 &&
                selectedIds.length === unusedEntities.length
              }
              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All
            </label>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {unusedEntities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No unused items found.
              </p>
            ) : (
              unusedEntities.map((e) => (
                <div key={e.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={e.id}
                    checked={selectedIds.includes(e.id)}
                    onCheckedChange={() => handleToggleSelect(e.id)}
                  />
                  <label htmlFor={e.id} className="text-sm">
                    {e.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isProcessing || selectedIds.length === 0}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CleanupEntitiesDialog;

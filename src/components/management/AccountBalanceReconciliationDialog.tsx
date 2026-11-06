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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLedger } from "@/contexts/LedgerContext";

interface AccountBalanceReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountRowData {
  id: string;
  name: string;
  currency: string;
  systemBalance: number;
  actualBalance: string; // Input value
  difference: number;
}

const AccountBalanceReconciliationDialog: React.FC<
  AccountBalanceReconciliationDialogProps
> = ({ isOpen, onClose }) => {
  const dataProvider = useDataProvider();
  // const session = useSession();
  const { activeLedger } = useLedger();
  const { accounts, transactions, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();

  const [rows, setRows] = useState<AccountRowData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize rows when dialog opens
  useEffect(() => {
    if (isOpen) {
      const calculatedRows = accounts.map((acc) => {
        const sysBal = acc.running_balance || 0;

        return {
          id: acc.id,
          name: acc.name,
          currency: acc.currency || "USD",
          systemBalance: sysBal,
          actualBalance: "",
          difference: 0,
        };
      });
      setRows(calculatedRows);
      setSelectedIds([]);
    }
  }, [isOpen, accounts, transactions]);

  const handleActualBalanceChange = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const actual = parseFloat(value);
          const diff = isNaN(actual) ? 0 : actual - row.systemBalance;
          return { ...row, actualBalance: value, difference: diff };
        }
        return row;
      }),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(rows.map((r) => r.id));
    else setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleReconcile = async () => {
    if (selectedIds.length === 0) return;
    if (!activeLedger?.id) {
      showError("No active ledger.");
      return;
    }

    setIsProcessing(true);
    try {
      // Filter selected rows that have a difference to adjust
      const adjustments = rows.filter(
        (r) => selectedIds.includes(r.id) && r.difference !== 0,
      );

      if (adjustments.length === 0) {
        showSuccess("No adjustments needed for selected accounts.");
        onClose();
        return;
      }

      await Promise.all(
        adjustments.map((adj) =>
          dataProvider.addTransaction({
            user_id: activeLedger.id,
            date: new Date().toISOString(),
            account: adj.name,
            vendor: "Balance Adjustment",
            category: "Adjustment",
            amount: adj.difference,
            remarks: `Reconciliation Adjustment to match balance ${adj.actualBalance}`,
            currency: adj.currency,
          }),
        ),
      );

      showSuccess(`Reconciled ${adjustments.length} accounts successfully.`);
      await invalidateAllData();
      onClose();
    } catch (error: unknown) {
      showError(
        `Reconciliation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Reconcile Account Balances</DialogTitle>
          <DialogDescription>
            Select accounts and enter their actual bank balances to
            automatically create adjustment transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    aria-label="Select all accounts"
                    checked={
                      rows.length > 0 && selectedIds.length === rows.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(Boolean(checked))
                    }
                  />
                </TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">System Balance</TableHead>
                <TableHead className="text-right">Actual Balance</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${row.name}`}
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => handleToggleSelect(row.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.systemBalance, row.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={row.actualBalance}
                      onChange={(e) =>
                        handleActualBalanceChange(row.id, e.target.value)
                      }
                      className="h-8 w-[120px] ml-auto text-right"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell
                    className={`text-right ${row.difference === 0 ? "text-green-600" : "text-orange-600"}`}
                  >
                    {row.difference > 0 ? "+" : ""}
                    {formatCurrency(row.difference, row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleReconcile}
            disabled={isProcessing || selectedIds.length === 0}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reconcile Selected ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountBalanceReconciliationDialog;

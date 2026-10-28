import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Transaction } from "@/types/dataProvider";

type Pair = [Transaction, Transaction];

interface TransferSuggestionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pairs: Pair[];
  onLink: (selected: Pair[]) => Promise<void> | void;
}

/**
 * Lists transactions that look like the two legs of a transfer and links only
 * the ones the user ticks. Nothing is pre-selected: a purchase and its refund
 * can look exactly like a transfer, so the choice stays with the user.
 */
export const TransferSuggestionsDialog = ({
  isOpen,
  onOpenChange,
  pairs,
  onLink,
}: TransferSuggestionsDialogProps) => {
  const { formatCurrency } = useCurrency();
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [isLinking, setIsLinking] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) setSelected(new Set());
  }, [isOpen, pairs]);

  const allSelected = pairs.length > 0 && selected.size === pairs.length;

  const toggle = (index: number, checked: boolean) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });

  const handleLink = async () => {
    setIsLinking(true);
    try {
      await onLink(pairs.filter((_, index) => selected.has(index)));
      onOpenChange(false);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Possible transfers</DialogTitle>
          <DialogDescription>
            These pairs look like money moved between your own accounts. Tick
            the ones that really are transfers; a purchase and its refund can
            look the same.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b pb-2">
          <Checkbox
            id="select-all-transfer-suggestions"
            checked={allSelected}
            onCheckedChange={(checked) =>
              setSelected(
                checked === true
                  ? new Set(pairs.map((_, index) => index))
                  : new Set(),
              )
            }
          />
          <label
            htmlFor="select-all-transfer-suggestions"
            className="text-sm font-medium"
          >
            Select all ({pairs.length})
          </label>
        </div>

        <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {pairs.map(([from, to], index) => (
            <li key={`${from.id}-${to.id}`} className="rounded-md border p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  className="mt-1"
                  checked={selected.has(index)}
                  onCheckedChange={(checked) => toggle(index, checked === true)}
                  aria-label={`Link ${from.account} and ${to.account} on ${from.date.slice(0, 10)}`}
                />
                <span className="min-w-0 flex-1 space-y-1 text-sm">
                  <span className="block font-medium">
                    {from.account} ↔ {to.account}
                  </span>
                  <span className="block text-muted-foreground">
                    {from.date.slice(0, 10)}: {from.vendor} (
                    {formatCurrency(from.amount, from.currency)})
                  </span>
                  <span className="block text-muted-foreground">
                    {to.date.slice(0, 10)}: {to.vendor} (
                    {formatCurrency(to.amount, to.currency)})
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            onClick={handleLink}
            disabled={selected.size === 0 || isLinking}
          >
            Link {selected.size > 0 ? selected.size : ""} selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferSuggestionsDialog;

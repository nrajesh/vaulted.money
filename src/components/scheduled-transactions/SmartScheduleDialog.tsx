import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScheduledTransaction } from "@/types/dataProvider";
import { detectRecurringPatterns } from "@/utils/smartScheduler";

interface SmartScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

interface SuggestedSchedule extends ScheduledTransaction {
  isSelected: boolean;
  linkedWith?: string; // ID of the paired transaction
  isPaired?: boolean; // Whether the link is active
}

export function SmartScheduleDialog({
  isOpen,
  onClose,
  onSave,
}: SmartScheduleDialogProps) {
  const { transactions, scheduledTransactions } = useTransactions();
  const dataProvider = useDataProvider();
  const { activeLedger } = useLedger();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<SuggestedSchedule[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const calculateSuggestions = useCallback(async () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const patterns = detectRecurringPatterns(
          transactions,
          scheduledTransactions,
        );
        const enriched: SuggestedSchedule[] = patterns.map((p) => ({
          ...p,
          isSelected: true,
        }));

        // --- Pairing Logic ---
        // Find potential pairs: Same Date, Inverse Amount, "Transfer" related?
        // Or just inverse amount and same frequency/next-date?
        // Let's be strict: Category "Transfer" OR just inverse amounts on same day.
        const processedIds = new Set<string>();

        for (let i = 0; i < enriched.length; i++) {
          if (processedIds.has(enriched[i].id)) continue;

          const itemA = enriched[i];
          // Look for match
          for (let j = i + 1; j < enriched.length; j++) {
            if (processedIds.has(enriched[j].id)) continue;
            const itemB = enriched[j];

            // Check 1: Frequency & Date match
            if (itemA.frequency !== itemB.frequency) continue;
            if (itemA.date.split("T")[0] !== itemB.date.split("T")[0]) continue;

            // Check 2: Inverse Amount (approximate)
            if (Math.abs(itemA.amount + itemB.amount) < 0.01) {
              // Match found!
              // Create Link
              enriched[i].linkedWith = itemB.id;
              enriched[i].isPaired = true;
              enriched[j].linkedWith = itemA.id;
              enriched[j].isPaired = true;

              processedIds.add(itemA.id);
              processedIds.add(itemB.id);
              break; // Pair found, stop looking for A
            }
          }
        }

        // Sort so pairs are adjacent?
        // We can group them in rendering or just sort by Date then ID?
        enriched.sort((a, b) => {
          // Sort by PAIR first?
          // If paired, verify order?
          // Let's just sort by Date, Descending Amount (Positive first)
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return b.amount - a.amount;
        });

        setSuggestions(enriched);
      } catch (error) {
        console.error("Error calculating schedules:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 500);
  }, [transactions, scheduledTransactions]);

  useEffect(() => {
    if (isOpen) {
      calculateSuggestions();
    }
  }, [isOpen, calculateSuggestions]);

  const handleCreateSchedules = async () => {
    setIsSaving(true);
    const selectedItems = suggestions.filter((s) => s.isSelected);

    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one transaction to schedule.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      const userId = activeLedger?.id;
      if (!userId) throw new Error("No active ledger selected");

      let createdCount = 0;
      let skippedCount = 0;

      for (const item of selectedItems) {
        // Duplicate check: same vendor + account + category + sub_category + frequency
        const isDuplicate = scheduledTransactions.some(
          (s) =>
            s.vendor === item.vendor &&
            s.account === item.account &&
            s.category === item.category &&
            (s.sub_category ?? null) === (item.sub_category ?? null) &&
            s.frequency === item.frequency,
        );

        if (isDuplicate) {
          skippedCount++;
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isSelected, linkedWith, isPaired, id, ...payload } = item;

        await dataProvider.addScheduledTransaction({
          ...payload,
          user_id: userId,
        });
        createdCount++;
      }

      const parts: string[] = [];
      if (createdCount > 0)
        parts.push(
          `Scheduled ${createdCount} recurring transaction${createdCount !== 1 ? "s" : ""}.`,
        );
      if (skippedCount > 0)
        parts.push(
          `Skipped ${skippedCount} duplicate${skippedCount !== 1 ? "s" : ""}.`,
        );

      toast({
        title: createdCount > 0 ? "Schedules created" : "No new schedules",
        description: parts.join(" "),
      });
      // Await onSave so the context refreshes before dialog closes
      await onSave();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error creating schedules",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    const newSuggestions = suggestions.map((s) => ({
      ...s,
      isSelected: checked,
    }));
    setSuggestions(newSuggestions);
  };

  const toggleSelection = (index: number) => {
    const item = suggestions[index];
    const newSuggestions = [...suggestions];

    const newSelectedState = !item.isSelected;
    newSuggestions[index].isSelected = newSelectedState;

    // Handle Pairing
    if (item.isPaired && item.linkedWith) {
      const partnerIndex = newSuggestions.findIndex(
        (s) => s.id === item.linkedWith,
      );
      if (partnerIndex !== -1) {
        newSuggestions[partnerIndex].isSelected = newSelectedState;
      }
    }

    setSuggestions(newSuggestions);
  };

  const toggleLink = (index: number) => {
    const item = suggestions[index];
    if (!item.linkedWith) return;

    const newSuggestions = [...suggestions];
    const partnerIndex = newSuggestions.findIndex(
      (s) => s.id === item.linkedWith,
    );

    // Toggle 'isPaired' for both
    const newPairedState = !item.isPaired;
    newSuggestions[index].isPaired = newPairedState;
    if (partnerIndex !== -1) {
      newSuggestions[partnerIndex].isPaired = newPairedState;
    }

    setSuggestions(newSuggestions);
  };

  const updateAmount = (index: number, amount: string) => {
    const val = parseFloat(amount);
    if (!isNaN(val)) {
      const newSuggestions = [...suggestions];
      newSuggestions[index].amount = val;

      // If paired, do we update the other one?
      // Usually transfers match exactly.
      if (newSuggestions[index].isPaired && newSuggestions[index].linkedWith) {
        const partnerIndex = newSuggestions.findIndex(
          (s) => s.id === newSuggestions[index].linkedWith,
        );
        if (partnerIndex !== -1) {
          newSuggestions[partnerIndex].amount = -val; // Inverse
        }
      }

      setSuggestions(newSuggestions);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-500" />
            Smart Schedule Creation
          </DialogTitle>
          <DialogDescription>
            We detected these potential recurring transactions. Review suggested
            amounts and select which ones to schedule.
          </DialogDescription>
        </DialogHeader>

        {isCalculating ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing patterns...
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm bg-muted/50 border-b items-center">
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    aria-label="Select all suggestions"
                    checked={
                      suggestions.length > 0 &&
                      suggestions.every((s) => s.isSelected)
                    }
                    onCheckedChange={(checked) =>
                      toggleSelectAll(checked as boolean)
                    }
                  />
                </div>
                <div className="col-span-2">Frequency</div>
                <div className="col-span-4">Payee / Account</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No recurring patterns detected.
                  </div>
                ) : (
                  suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 ${item.isSelected ? "bg-card" : "opacity-50"} ${item.isPaired ? "border-l-4 border-l-blue-500" : ""}`}
                    >
                      <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                        <Checkbox
                          aria-label={`Select suggestion ${idx + 1}`}
                          checked={item.isSelected}
                          onCheckedChange={() => toggleSelection(idx)}
                        />
                        {item.linkedWith && (
                          <button
                            onClick={() => toggleLink(idx)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title={
                              item.isPaired
                                ? "Unlink transaction"
                                : "Link transaction"
                            }
                          >
                            {item.isPaired ? (
                              <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-link text-blue-600"
                                >
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center opacity-50">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-unlink"
                                >
                                  <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.004 5.004 0 0 0-6.95 0l-1.72 1.71" />
                                  <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.004 5.004 0 0 0 6.95 0l1.71-1.71" />
                                  <line x1="8" x2="16" y1="2" y2="2" />
                                  <line x1="8" x2="16" y1="22" y2="22" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="col-span-2 text-xs">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                          {item.frequency}
                        </span>
                      </div>
                      <div className="col-span-4 flex flex-col">
                        <span
                          className="font-medium truncate"
                          title={item.vendor}
                        >
                          {item.vendor}
                        </span>
                        <span
                          className="text-xs text-muted-foreground truncate"
                          title={item.account}
                        >
                          {item.account}
                        </span>
                      </div>
                      <div className="col-span-3 flex flex-col">
                        <span
                          className="text-sm truncate"
                          title={item.category}
                        >
                          {item.category}
                        </span>
                        {item.sub_category && (
                          <span className="text-xs text-muted-foreground truncate">
                            {item.sub_category}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateAmount(idx, e.target.value)}
                          className="h-8 text-right"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSchedules}
            disabled={
              isSaving || suggestions.filter((s) => s.isSelected).length === 0
            }
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {suggestions.filter((s) => s.isSelected).length} Schedules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

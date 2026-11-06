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
import { useTranslation } from "react-i18next";
import { Transaction } from "@/data/finance-data";

interface SmartBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface SuggestedBudget {
  category: string;
  subCategory?: string;
  averageSpend: number;
  transactionCount: number;
  isSelected: boolean;
  proposedAmount: number;
}

export function SmartBudgetDialog({
  isOpen,
  onClose,
  onSave,
}: SmartBudgetDialogProps) {
  const { transactions } = useTransactions();
  const dataProvider = useDataProvider();
  const { activeLedger } = useLedger();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<SuggestedBudget[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const calculateSuggestions = useCallback(async () => {
    setIsCalculating(true);
    // Simulate a brief calculation time for better UX or if we make it async later
    setTimeout(() => {
      try {
        const generatedSuggestions = generateBudgetSuggestions(transactions);
        setSuggestions(generatedSuggestions);
      } catch (error) {
        console.error("Error calculating suggestions:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 500);
  }, [transactions]);

  useEffect(() => {
    if (isOpen) {
      calculateSuggestions();
    }
  }, [isOpen, calculateSuggestions]);

  const generateBudgetSuggestions = (txs: Transaction[]): SuggestedBudget[] => {
    // 1. Group transactions by Category (and SubCategory optionally, but let's stick to Category for now to keep it simple, or maybe top-level only?)
    // The requirement says "10 categories or sub-categories". Let's do Category + SubCategory if available, else Category.

    // Key: "Category:SubCategory" or "Category"
    const groups: Record<
      string,
      {
        total: number;
        count: number;
        months: Set<string>;
        category: string;
        sub: string | undefined;
      }
    > = {};

    txs.forEach((t) => {
      // Skip income and transfers for budgeting usually?
      // Assumption: Budgeting is for expenses.
      // We should check if transaction amount is negative (expense) or if type is 'expense'.
      // Our data model usually has negative amounts for expenses or distinct types.
      // Let's assume negative amounts are expenses or use t.type if available (not in standard Transaction interface apparently, checking context...)
      // Standard Transaction has amount. Expenses are typically negative? Or positive?
      // In many personal finance apps, expenses are entered as positive values in "Expense" categories.
      // Let's assume we filter for "Expense" categories or rely on amount.
      // Let's rely on categories that are NOT "Income" or "Transfer".

      if (t.category === "Income" || t.category === "Transfer") return;

      const key = t.sub_category
        ? `${t.category} > ${t.sub_category}`
        : t.category;

      if (!groups[key]) {
        groups[key] = {
          total: 0,
          count: 0,
          months: new Set(),
          category: t.category,
          sub: t.sub_category || undefined,
        };
      }

      // Sum absolute amounts for spending
      groups[key].total += Math.abs(t.amount);
      groups[key].count += 1;

      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      groups[key].months.add(monthKey);
    });

    // 2. Calculate averages and sort
    const results = Object.values(groups).map((g) => {
      const monthCount = g.months.size || 1;
      // If data spans partial months, maybe max(months.size, 1)?
      // Simple average: Total / MonthCount
      const avg = g.total / monthCount;

      return {
        category: g.category,
        subCategory: g.sub,
        averageSpend: avg,
        transactionCount: g.count,
        isSelected: true, // Default to selected
        proposedAmount: Math.ceil(avg), // Round up to nearest whole number
      };
    });

    // 3. Sort by occurrences (transaction count) as per requirements "most transactions"
    results.sort((a, b) => b.transactionCount - a.transactionCount);

    // 4. Take top 10
    return results.slice(0, 10);
  };

  const handleCreateBudgets = async () => {
    setIsSaving(true);
    const selectedItems = suggestions.filter((s) => s.isSelected);

    if (selectedItems.length === 0) {
      toast({
        title: t("budgets.smart.noneSelected.title", {
          defaultValue: "No budgets selected",
        }),
        description: t("budgets.smart.noneSelected.description", {
          defaultValue: "Please select at least one budget to create.",
        }),
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      const ledgerId = activeLedger?.id;
      if (!ledgerId) throw new Error("No active ledger selected");

      // Fetch existing budgets to prevent duplicates
      const existingBudgets =
        await dataProvider.getBudgetsWithSpending(ledgerId);

      let createdCount = 0;
      let skippedCount = 0;

      for (const item of selectedItems) {
        // Duplicate check: same category + sub_category + frequency + is_goal
        const isDuplicate = existingBudgets.some(
          (b) =>
            b.category_name === item.category &&
            (b.sub_category_name ?? null) === (item.subCategory ?? null) &&
            b.frequency === "Monthly" &&
            !b.is_goal,
        );

        if (isDuplicate) {
          skippedCount++;
          continue;
        }

        const catId = await dataProvider.ensureCategoryExists(
          item.category,
          ledgerId,
        );

        if (!catId) {
          throw new Error(`Failed to ensure category exists: ${item.category}`);
        }

        let subCatId = null;
        if (item.subCategory) {
          subCatId = await dataProvider.ensureSubCategoryExists(
            item.subCategory as string,
            catId,
            ledgerId,
          );
        }

        const newBudget: Omit<
          import("@/types/dataProvider").Budget,
          "id" | "spent_amount"
        > = {
          user_id: ledgerId,
          category_id: catId,
          category_name: item.category,
          sub_category_id: subCatId,
          sub_category_name: item.subCategory,
          target_amount: item.proposedAmount,
          currency: activeLedger?.currency || "USD",
          start_date: new Date().toISOString().substring(0, 10),
          end_date: null,
          frequency: "Monthly",
        };

        await dataProvider.addBudget(newBudget);
        createdCount++;
      }

      const parts: string[] = [];
      if (createdCount > 0)
        parts.push(
          t("budgets.smart.created", {
            count: createdCount,
            defaultValue: "Created {{count}} smart budget(s).",
          }),
        );
      if (skippedCount > 0)
        parts.push(
          t("budgets.smart.skipped", {
            count: skippedCount,
            defaultValue: "Skipped {{count}} duplicate(s).",
          }),
        );

      toast({
        title:
          createdCount > 0
            ? t("budgets.smart.toastCreated", {
                defaultValue: "Budgets created",
              })
            : t("budgets.smart.toastNone", { defaultValue: "No new budgets" }),
        description: parts.join(" "),
      });
      onSave();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : t("budgets.smart.error.generic", {
              defaultValue: "Something went wrong.",
            });
      toast({
        title: t("budgets.smart.error.title", {
          defaultValue: "Error creating budgets",
        }),
        description: message,
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
    const newSuggestions = [...suggestions];
    newSuggestions[index].isSelected = !newSuggestions[index].isSelected;
    setSuggestions(newSuggestions);
  };

  const updateAmount = (index: number, amount: string) => {
    const val = parseFloat(amount);
    if (!isNaN(val)) {
      const newSuggestions = [...suggestions];
      newSuggestions[index].proposedAmount = val;
      setSuggestions(newSuggestions);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            {t("budgets.smart.title", {
              defaultValue: "Smart Budget Creation",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("budgets.smart.description", {
              defaultValue:
                "We analyzed your past transactions and found these top spending categories. Adjust the proposed monthly amounts and select the budgets you want to create.",
            })}
          </DialogDescription>
        </DialogHeader>

        {isCalculating ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("budgets.smart.analyzing", {
                defaultValue: "Analyzing your spending habits...",
              })}
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm bg-muted/50 border-b items-center">
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    aria-label={t("budgets.smart.selectAll", {
                      defaultValue: "Select all suggestions",
                    })}
                    checked={
                      suggestions.length > 0 &&
                      suggestions.every((s) => s.isSelected)
                    }
                    onCheckedChange={(checked) =>
                      toggleSelectAll(checked as boolean)
                    }
                  />
                </div>
                <div className="col-span-6">
                  {t("budgets.smart.category", { defaultValue: "Category" })}
                </div>
                <div className="col-span-2 text-right">
                  {t("budgets.smart.avgSpend", { defaultValue: "Avg. Spend" })}
                </div>
                <div className="col-span-3 text-right">
                  {t("budgets.smart.budget", { defaultValue: "Budget" })}
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {t("budgets.smart.notEnough", {
                      defaultValue:
                        "Not enough data to make suggestions. Upload more transactions!",
                    })}
                  </div>
                ) : (
                  suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 ${item.isSelected ? "bg-card" : "opacity-50"}`}
                    >
                      <div className="col-span-1 flex justify-center">
                        <Checkbox
                          aria-label={t("budgets.smart.selectOne", {
                            number: idx + 1,
                            defaultValue: "Select suggestion {{number}}",
                          })}
                          checked={item.isSelected}
                          onCheckedChange={() => toggleSelection(idx)}
                        />
                      </div>
                      <div className="col-span-6">
                        <div
                          className="font-medium truncate"
                          title={
                            item.subCategory
                              ? `${item.category} > ${item.subCategory}`
                              : item.category
                          }
                        >
                          {item.category}
                          {item.subCategory && (
                            <span className="text-muted-foreground text-xs ml-1">
                              {" "}
                              &gt; {item.subCategory}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("budgets.smart.transactionCount", {
                            count: item.transactionCount,
                            defaultValue: "{{count}} transactions",
                          })}
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-sm text-muted-foreground">
                        {item.averageSpend.toLocaleString("en-US", {
                          style: "currency",
                          currency: activeLedger?.currency || "USD",
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={item.proposedAmount}
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
            {t("budgets.smart.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={handleCreateBudgets}
            disabled={
              isSaving || suggestions.filter((s) => s.isSelected).length === 0
            }
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("budgets.smart.create", {
              count: suggestions.filter((s) => s.isSelected).length,
              defaultValue: "Create {{count}} Budgets",
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

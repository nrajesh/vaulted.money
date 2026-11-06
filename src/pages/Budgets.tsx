import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Budget } from "../types/budgets";
import { Account } from "@/types/dataProvider";
import { BudgetSummary } from "../components/budgets/BudgetSummary";
import { AddEditBudgetDialog } from "../components/budgets/AddEditBudgetDialog";
import { useToast } from "@/components/ui/use-toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { PlusCircle, Wand2, Trash2 } from "lucide-react";
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
import { BudgetPaginationWrapper } from "../components/budgets/BudgetPaginationWrapper";
import { SmartBudgetDialog } from "../components/budgets/SmartBudgetDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateBudgetSpent } from "@/utils/budgetUtils";

export default function BudgetsPage() {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSmartBudgetOpen, setIsSmartBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const dataProvider = useDataProvider();

  // Use Ledger Context
  const { activeLedger } = useLedger();
  const ledgerId = activeLedger?.id || null;

  // Contexts for real-time calculation
  const { transactions, accounts, vendors, deleteBudget, hiddenBudgetIds } =
    useTransactions();
  const { convertBetweenCurrencies } = useCurrency();

  const fetchBudgets = useCallback(
    async (currentLedgerId: string) => {
      setIsLoading(true);
      try {
        // We still fetch budgets to get the configuration, but we might ignore the returned 'spent_amount'
        // in favor of client-side calculation to match Alerts logic.
        const data = await dataProvider.getBudgetsWithSpending(currentLedgerId);
        setBudgets(data || []);
      } catch (error: unknown) {
        toast({
          title: t("budgets.page.errorFetching", {
            defaultValue: "Error fetching budgets",
          }),
          description: (error as Error).message,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    },
    [dataProvider, toast, t],
  );

  useEffect(() => {
    if (ledgerId) {
      // Defer to avoid synchronous setState in effect (setIsLoading)
      const timer = setTimeout(() => fetchBudgets(ledgerId), 0);
      return () => clearTimeout(timer);
    } else {
      // Defer to avoid synchronous setState in effect
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [ledgerId, fetchBudgets]);

  // Recalculate spent amounts using shared logic
  const processedBudgets = useMemo(() => {
    // Adapt Payees to Accounts for budget calculation
    const adaptedAccounts = accounts.map((a) => ({
      ...a,
      currency: a.currency || "USD",
      type: a.type || "Other",
      starting_balance: a.starting_balance || 0,
      user_id: "", // partial match
      remarks: a.remarks || "",
      created_at: a.created_at || new Date().toISOString(),
    })) as unknown as Account[];

    return budgets.map((budget) => {
      const spent = calculateBudgetSpent(
        budget,
        transactions,
        adaptedAccounts,
        vendors,
        convertBetweenCurrencies,
        budget.currency, // Calculate spent in the budget's currency
      );
      return { ...budget, spent_amount: spent };
    });
  }, [budgets, transactions, accounts, vendors, convertBetweenCurrencies]);

  const filteredBudgets = useMemo(() => {
    let base = processedBudgets;
    // Apply hidden filter
    if (hiddenBudgetIds.size > 0) {
      base = base.filter((b) => !hiddenBudgetIds.has(b.id));
    }

    if (!searchTerm) {
      return base;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return base.filter((budget) =>
      budget.category_name.toLowerCase().includes(lowerCaseSearchTerm),
    );
  }, [processedBudgets, searchTerm, hiddenBudgetIds]);

  // Separate spending budgets from goal budgets for summary calculations
  const spendingBudgets = useMemo(() => {
    return filteredBudgets.filter((b) => !b.is_goal);
  }, [filteredBudgets]);

  const activeBudgets = useMemo(() => {
    return filteredBudgets.filter((b) => b.is_active !== false);
  }, [filteredBudgets]);

  const inactiveBudgets = useMemo(() => {
    return filteredBudgets.filter((b) => b.is_active === false);
  }, [filteredBudgets]);

  const handleOpenDialog = (budget: Budget | null = null) => {
    setSelectedBudget(budget);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedBudget(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (ledgerId) {
      fetchBudgets(ledgerId);
    }
  };

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDeleteId(budgetId);
    setIsConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDeleteId) return;

    try {
      deleteBudget(budgetToDeleteId);
      // Toast is handled by context now
      // handleSave(); // Not strictly needed if local state is just for initial load, but effectiveBudgets handles UI.
      // However, fetchBudgets creates 'budgets' state.
      // If we don't update 'budgets' state, effectiveBudgets filters it.
      // But if we reload, it's gone.
      // So simple delete is fine.
    } catch (error: unknown) {
      toast({
        title: t("budgets.page.errorDeleting", {
          defaultValue: "Error deleting budget",
        }),
        description: (error as Error).message,
        variant: "destructive",
      });
    }

    setBudgetToDeleteId(null);
    setIsConfirmingDelete(false);
  };

  // Mass Delete Logic
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleSelection = useCallback((budgetId: string) => {
    setSelectedBudgetIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(budgetId)) {
        newSelection.delete(budgetId);
      } else {
        newSelection.add(budgetId);
      }
      return newSelection;
    });
  }, []);

  const handleMassDelete = async () => {
    if (selectedBudgetIds.size === 0) return;

    try {
      selectedBudgetIds.forEach((id) => {
        deleteBudget(id);
      });
      setSelectedBudgetIds(new Set());
      toast({
        title: t("budgets.page.deletedMany.title", {
          defaultValue: "Budgets deleted",
        }),
        description: t("budgets.page.deletedMany.description", {
          count: selectedBudgetIds.size,
          defaultValue: "Successfully deleted {{count}} budgets.",
        }),
      });
    } catch (error: unknown) {
      toast({
        title: t("budgets.page.errorDeletingMany", {
          defaultValue: "Error deleting budgets",
        }),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = useCallback(() => {
    if (
      selectedBudgetIds.size === filteredBudgets.length &&
      filteredBudgets.length > 0
    ) {
      setSelectedBudgetIds(new Set());
    } else {
      const allIds = new Set(filteredBudgets.map((b) => b.id));
      setSelectedBudgetIds(allIds);
    }
  }, [selectedBudgetIds.size, filteredBudgets]);

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start gap-4">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("budgets.page.title", { defaultValue: "Budgets" })}
          </h1>
          <p className="app-page-subtitle">
            {t("budgets.page.subtitle", {
              defaultValue: "Track your spending limits and goals",
            })}
          </p>
        </div>
        <div className="app-action-panel">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="tour-smart-budget"
              onClick={() => setIsSmartBudgetOpen(true)}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {t("budgets.page.smartCreate", { defaultValue: "Smart Create" })}
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="tour-create-budget bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />{" "}
              {t("budgets.page.create", { defaultValue: "Create Budget" })}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="tour-budget-search-bar app-filter-panel">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder={t("budgets.page.search", {
                defaultValue: "Search budgets by category name...",
              })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-md"
            />
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="animate-in fade-in zoom-in duration-300"
            >
              {selectedBudgetIds.size === filteredBudgets.length &&
              filteredBudgets.length > 0
                ? t("budgets.page.deselectAll", {
                    defaultValue: "Deselect All",
                  })
                : t("budgets.page.selectAll", { defaultValue: "Select All" })}
            </Button>
            {selectedBudgetIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleMassDelete}
                className="animate-in fade-in zoom-in duration-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("budgets.page.deleteCount", {
                  count: selectedBudgetIds.size,
                  defaultValue: "Delete ({{count}})",
                })}
              </Button>
            )}
          </div>
        </div>

        <div className="tour-budget-list">
          <BudgetSummary budgets={spendingBudgets} isLoading={isLoading} />
        </div>

        <div>
          <h2 className="app-section-title mb-4">
            {t("budgets.page.active", { defaultValue: "Active Budgets" })}
          </h2>

          <BudgetPaginationWrapper
            budgets={activeBudgets}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
            transactions={transactions}
            selectedBudgetIds={selectedBudgetIds}
            onToggleSelection={toggleSelection}
          />

          {inactiveBudgets.length > 0 && (
            <div className="mt-8">
              <h2 className="app-section-title mb-4 text-muted-foreground">
                {t("budgets.page.inactive", {
                  defaultValue: "Inactive Budgets",
                })}
              </h2>
              <BudgetPaginationWrapper
                budgets={inactiveBudgets}
                isLoading={isLoading}
                onEdit={handleOpenDialog}
                onDelete={handleDeleteClick}
                transactions={transactions}
                selectedBudgetIds={selectedBudgetIds}
                onToggleSelection={toggleSelection}
              />
            </div>
          )}
        </div>
      </div>

      {ledgerId && (
        <AddEditBudgetDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsDialogOpen(true);
          }}
          onSuccess={handleSave}
          budget={selectedBudget}
          allBudgets={budgets} // passing current budgets for duplicate check
        />
      )}

      <SmartBudgetDialog
        isOpen={isSmartBudgetOpen}
        onClose={() => setIsSmartBudgetOpen(false)}
        onSave={handleSave}
      />

      <AlertDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("budgets.page.confirmTitle", {
                defaultValue: "Are you absolutely sure?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("budgets.page.confirmDescription", {
                defaultValue: "This will delete the selected budget.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("budgets.page.confirmDelete", {
                defaultValue: "Delete Budget",
              })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

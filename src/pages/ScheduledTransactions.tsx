import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { ScheduledTransactionsTable } from "@/components/scheduled-transactions/ScheduledTransactionsTable";
import { useTransactions } from "@/contexts/TransactionsContext";
import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";
import { ScheduledTransaction } from "@/types/dataProvider";
import { toast } from "sonner";
import { useLocalTransactionFilters } from "@/hooks/transactions/useLocalTransactionFilters";
import { ScheduledSearchFilterBar } from "@/components/scheduled-transactions/ScheduledSearchFilterBar";
import { SmartScheduleDialog } from "@/components/scheduled-transactions/SmartScheduleDialog";
import { addMonths, addWeeks, addYears } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { slugify } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const ScheduledTransactionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    scheduledTransactions,
    addScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    accounts,
    vendors,
    categories,
    allSubCategories,
    addTransaction, // For processing 'make happen today'
    invalidateAllData,
    deleteMultipleScheduledTransactions,
    unlinkScheduledTransaction,
  } = useTransactions();

  // Independent Search State
  const filterState = useLocalTransactionFilters();
  const {
    searchTerm,
    dateRange,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    minAmount,
    maxAmount,
  } = filterState;

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] =
    React.useState<ScheduledTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSmartSchedulerOpen, setIsSmartSchedulerOpen] = React.useState(false);

  // --- Smart Scheduler Logic ---
  // --- Smart Scheduler Logic ---
  const handleSmartSchedule = () => {
    setIsSmartSchedulerOpen(true);
  };

  // --- Filtering Logic ---
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get("id");

  const filteredTransactions = React.useMemo(() => {
    // If we have no transactions yet, return empty
    if (!scheduledTransactions || scheduledTransactions.length === 0) return [];

    const result = scheduledTransactions.filter((t) => {
      // Direct ID Match (if passed via URL)
      if (targetId) {
        return t.id === targetId;
      }

      // Date Range (Future looking)
      if (dateRange && dateRange.from) {
        const tDate = new Date(t.date);
        // Start of 'from' day
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (tDate < fromDate) return false;

        if (dateRange.to) {
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          if (tDate > endDate) return false;
        }
      }

      if (
        selectedAccounts.length > 0 &&
        !selectedAccounts.includes(slugify(t.account))
      )
        return false;
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(slugify(t.category))
      )
        return false;
      if (
        selectedSubCategories.length > 0 &&
        !selectedSubCategories.includes(slugify(t.sub_category || ""))
      )
        return false;
      if (
        selectedVendors.length > 0 &&
        !selectedVendors.includes(slugify(t.vendor))
      )
        return false;

      // Amount
      if (minAmount !== undefined && Math.abs(t.amount) < minAmount)
        return false;
      if (maxAmount !== undefined && Math.abs(t.amount) > maxAmount)
        return false;

      // Search Term (Generic)
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return (
          (t.remarks || "").toLowerCase().includes(lower) ||
          (t.vendor || "").toLowerCase().includes(lower) ||
          (t.category || "").toLowerCase().includes(lower) ||
          (t.account || "").toLowerCase().includes(lower)
        );
      }

      return true;
    });

    // Sorting
    result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return result;
  }, [
    scheduledTransactions,
    dateRange,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    minAmount,
    maxAmount,
    searchTerm,
    targetId,
  ]);

  // --- Actions ---

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction: ScheduledTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduledTransaction(id);
    } catch (error) {
      console.error("Failed to delete scheduled transaction:", error);
      toast.error(
        t("scheduled.page.deleteFailed", {
          defaultValue: "Failed to delete scheduled transaction",
        }),
      );
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      if (ids.length === 0) return;
      await deleteMultipleScheduledTransactions(ids);
    } catch (error) {
      console.error("Failed to bulk delete scheduled transactions:", error);
      toast.error(
        t("scheduled.page.bulkDeleteFailed", {
          defaultValue: "Failed to delete scheduled transactions",
        }),
      );
    }
  };

  const calculateNextDate = (currentDate: Date, frequency: string): Date => {
    const d = new Date(currentDate);
    if (frequency === "Weekly") return addWeeks(d, 1);
    if (frequency === "Monthly") return addMonths(d, 1);
    if (frequency === "Yearly") return addYears(d, 1);
    // Daily?
    if (frequency === "Daily") {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    }
    return d;
  };

  const handleProcessToday = async (st: ScheduledTransaction) => {
    try {
      const today = new Date();
      const transactionPayload = {
        date: today.toISOString(),
        account: st.account,
        vendor: st.vendor,
        category: st.category,
        sub_category: st.sub_category,
        amount: st.amount,
        currency: st.currency,
        remarks:
          st.remarks ||
          t("scheduled.page.processedRemark", {
            defaultValue: "Processed from schedule",
          }),
        is_scheduled_origin: true,
        user_id: st.user_id,
        // recurrence_id: st.id
      };

      await addTransaction(transactionPayload);

      const currentNextDate = new Date(st.date);
      const nextDate = calculateNextDate(currentNextDate, st.frequency);

      await updateScheduledTransaction({
        ...st,
        date: nextDate.toISOString(),
      });

      toast.success(
        t("scheduled.page.processed", {
          defaultValue: "Transaction processed and schedule advanced!",
        }),
      );
    } catch (e) {
      console.error("Process Today Error", e);
      toast.error(
        t("scheduled.page.processFailed", {
          defaultValue: "Failed to process transaction.",
        }),
      );
    }
  };

  const handleSubmit = async (
    values: Partial<ScheduledTransaction> & {
      frequency_value?: string;
      frequency_unit?: string;
      account?: string;
    },
  ) => {
    setIsSubmitting(true);
    try {
      const transactionData = {
        ...values,
        frequency: `${values.frequency_value}${values.frequency_unit}`,
      };
      delete transactionData.frequency_value;
      delete transactionData.frequency_unit;

      const accountObj = accounts.find((a) => a.name === values.account);
      const currency = accountObj?.currency || "USD";
      // Ensure ID is present for local optimistic updates if needed, though dataProvider usually adds it.
      // But let's let backend handle.
      const payload = {
        ...transactionData,
        currency,
        user_id: transactionData.user_id as string,
      } as Omit<ScheduledTransaction, "id" | "created_at">;

      if (editingTransaction) {
        await updateScheduledTransaction({ ...editingTransaction, ...payload });
        toast.success(
          t("scheduled.page.updated", {
            defaultValue: "Scheduled transaction updated",
          }),
        );
      } else {
        await addScheduledTransaction(payload);
        toast.success(
          t("scheduled.page.created", {
            defaultValue: "Scheduled transaction created",
          }),
        );
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save scheduled transaction:", error);
      toast.error(
        t("scheduled.page.saveFailed", {
          defaultValue: "Failed to save scheduled transaction",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col gap-6">
        <div className="flex flex-col items-start gap-4">
          <div>
            <h1 className="app-gradient-title app-page-title">
              {t("scheduled.header.title", {
                defaultValue: "Scheduled Transactions",
              })}
            </h1>
            <p className="app-page-subtitle">
              {t("scheduled.header.subtitle", {
                defaultValue: "Manage recurring payments and transfers",
              })}
            </p>
          </div>
          <div className="app-action-panel">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSmartSchedule}
                variant="outline"
                className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-950"
              >
                <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />{" "}
                {t("scheduled.header.autoSchedule", {
                  defaultValue: "Auto-Schedule",
                })}
              </Button>
              <Button
                onClick={handleAdd}
                className="tour-scheduled-add bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />{" "}
                {t("scheduled.header.addScheduled", {
                  defaultValue: "Add Scheduled",
                })}
              </Button>
            </div>
          </div>
        </div>

        <ScheduledSearchFilterBar
          filterState={filterState}
          targetId={targetId}
          onClearId={() => {
            // Use navigate to replace URL without the ID
            navigate("/scheduled", { replace: true });
          }}
        />
      </div>

      <div className="tour-scheduled-list app-table-shell">
        <ScheduledTransactionsTable
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onProcessToday={handleProcessToday}
          onUnlink={unlinkScheduledTransaction}
        />
      </div>

      <AddEditScheduledTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={editingTransaction}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        accounts={accounts}
        allPayees={[
          ...vendors.map((v) => ({
            value: v.name,
            label: v.name,
            isAccount: false,
          })),
          ...accounts.map((a) => ({
            value: a.name,
            label: a.name,
            isAccount: true,
          })),
        ].sort((a, b) => a.label.localeCompare(b.label))}
        categories={categories}
        allSubCategories={allSubCategories}
        isLoading={false}
      />

      <SmartScheduleDialog
        isOpen={isSmartSchedulerOpen}
        onClose={() => setIsSmartSchedulerOpen(false)}
        onSave={invalidateAllData}
      />
    </div>
  );
};

export default ScheduledTransactionsPage;

"use client";

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import AddEditTransactionDialog from "@/components/dialogs/AddEditTransactionDialog";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
// import { useDefaultAccountSelection } from "@/hooks/useDefaultAccountSelection";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

import { slugify } from "@/lib/utils";
import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";
import { projectScheduledTransactions } from "@/utils/forecasting";
import { addMonths } from "date-fns";
import { Transaction } from "@/data/finance-data";
import { ScheduledTransaction } from "@/types/dataProvider";
import { TransactionPageHeader } from "@/components/transactions/TransactionPageHeader";
import { useTransactionPageActions } from "@/hooks/transactions/useTransactionPageActions";
import { MissingCurrencyDialog } from "@/components/dialogs/MissingCurrencyDialog";
import TransferSuggestionsDialog from "@/components/transactions/TransferSuggestionsDialog";
import {
  useAutoCategorize,
  CategorizeResult,
  BulkCategorizeResult,
} from "@/hooks/useAutoCategorize";
import { useAIConfig } from "@/hooks/useAIConfig";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Transactions = () => {
  const { t } = useTranslation();
  //   const session = useSession();
  const {
    transactions: allTransactions,
    scheduledTransactions,
    isLoadingTransactions,
    deleteMultipleTransactions,
    invalidateAllData,
    addTransaction,
    accounts,
    vendors,
    categories,
    subCategories,
    unlinkTransaction,
    linkTransactions,
    accountCurrencyMap,
    cleanUpDuplicates,
    updateTransaction,
    setOperationProgress,
  } = useTransactions();
  const { activeLedger } = useLedger();
  const { autoCategorizeBulk, getHistoricalMapping } = useAutoCategorize();
  const { config } = useAIConfig();

  const {
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    excludeTransfers,
    minAmount,
    maxAmount,
    searchTerm,
    limit,
    sortOrder,
    transactionType,
    setSelectedCategories,
    setSelectedSubCategories,
    setSelectedAccounts,
    setSelectedVendors,
    setDateRange,
  } = useTransactionFilters();

  const location = useLocation();

  React.useEffect(() => {
    if (location.state) {
      const state = location.state as {
        filterCategory?: string;
        filterSubCategory?: string;
        filterVendor?: string;
        filterAccount?: string;
        dateRange?: { from: string | Date; to: string | Date };
      };

      if (
        state.filterCategory ||
        state.filterSubCategory ||
        state.filterVendor ||
        state.filterAccount
      ) {
        if (state.filterCategory) {
          setSelectedCategories([slugify(state.filterCategory)]);
          setSelectedVendors([]);
          if (!state.filterSubCategory) {
            setSelectedSubCategories([]);
          }
          setSelectedAccounts([]);
        }

        if (state.filterSubCategory) {
          setSelectedSubCategories([slugify(state.filterSubCategory)]);
        }

        if (state.filterVendor) {
          setSelectedVendors([slugify(state.filterVendor)]);
          setSelectedCategories([]);
          setSelectedSubCategories([]);
          setSelectedAccounts([]);
        }

        if (state.filterAccount) {
          setSelectedAccounts([slugify(state.filterAccount)]);
          setSelectedCategories([]);
          setSelectedSubCategories([]);
          setSelectedVendors([]);
        }
      }

      if (state.dateRange) {
        setDateRange({
          from: new Date(state.dateRange.from),
          to: new Date(state.dateRange.to),
        });
      }

      window.history.replaceState({}, document.title);
    }
  }, [
    location.state,
    setSelectedAccounts,
    setSelectedCategories,
    setSelectedSubCategories,
    setSelectedVendors,
    setDateRange,
  ]);

  const dataProvider = useDataProvider();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [isScheduledDialogOpen, setIsScheduledDialogOpen] = useState(false);
  const [scheduledTransactionToEdit, setScheduledTransactionToEdit] =
    useState<ScheduledTransaction | null>(null);
  const [selectedTransactionForSchedule, setSelectedTransactionForSchedule] =
    useState<ScheduledTransaction | null>(null);

  const [isCleanupConfirmOpen, setIsCleanupConfirmOpen] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [unlinkTransferId, setUnlinkTransferId] = useState<string | null>(null);

  const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);

  const { toast } = useToast();

  const projectedTransactions = React.useMemo(() => {
    if (scheduledTransactions.length > 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() + 1);

      let end: Date;
      if (dateRange?.to) {
        end = new Date(dateRange.to);
      } else {
        end = addMonths(today, 6);
      }

      return projectScheduledTransactions(scheduledTransactions, start, end);
    }
    return [];
  }, [scheduledTransactions, dateRange?.to]);

  const combinedTransactions = React.useMemo(
    () => [...allTransactions, ...projectedTransactions],
    [allTransactions, projectedTransactions],
  );

  const filteredTransactions = React.useMemo(() => {
    let result = combinedTransactions.filter((t) => {
      if (dateRange?.from) {
        const tDate = new Date(t.date);
        if (tDate < dateRange.from) return false;
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

      if (excludeTransfers && (t.category === "Transfer" || !!t.transfer_id))
        return false;

      if (minAmount !== undefined && Math.abs(t.amount) < minAmount)
        return false;
      if (maxAmount !== undefined && Math.abs(t.amount) > maxAmount)
        return false;

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return (
          (t.remarks || "").toLowerCase().includes(lower) ||
          (t.vendor || "").toLowerCase().includes(lower) ||
          (t.category || "").toLowerCase().includes(lower) ||
          (t.sub_category || "").toLowerCase().includes(lower) ||
          t.amount.toString().includes(lower)
        );
      }

      if (transactionType === "expense") {
        if (t.amount > 0) return false;
      } else if (transactionType === "income") {
        if (t.amount < 0) return false;
      }

      return true;
    });

    if (sortOrder === "largest") {
      result.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortOrder === "smallest") {
      result.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    } else {
      result.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [
    combinedTransactions,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    excludeTransfers,
    minAmount,
    maxAmount,
    searchTerm,
    limit,
    sortOrder,
    transactionType,
  ]);

  // Memoized handlers to prevent unnecessary re-renders of TransactionTable/TransactionRow
  const handleDeleteTransactionsWrapper = React.useCallback(
    async (
      items: {
        id: string;
        transfer_id?: string;
        is_projected?: boolean;
        recurrence_id?: string;
        date?: string;
      }[],
    ) => {
      // Simplified Logic: Directly delete without prompting.
      // Real transactions are deleted. Projected transactions are 'skipped'.
      const extendedItems = items.map((i) => {
        // Find full object to carry extra metadata if needed (like recurrence_id for projected items)
        // Actually, filteredTransactions should have it.
        const full = filteredTransactions.find((t) => t.id === i.id);
        return full
          ? {
              ...i,
              ...full,
              transfer_id: full.transfer_id || undefined,
              recurrence_id: full.recurrence_id || undefined,
            }
          : i;
      });

      await deleteMultipleTransactions(extendedItems);
    },
    [filteredTransactions, deleteMultipleTransactions],
  );
  // Removed handleConfirmDelete and related dialogs.

  const handleScheduleTransactions = (
    selectedTransactions: Transaction[],
    clearSelection: () => void,
  ) => {
    if (selectedTransactions.length === 0) return;

    const transaction = selectedTransactions[0];

    if (selectedTransactions.length === 1 && transaction.recurrence_id) {
      const existingSchedule = scheduledTransactions.find(
        (s) => s.id === transaction.recurrence_id,
      );
      if (existingSchedule) {
        setScheduledTransactionToEdit(existingSchedule);
        setSelectedTransactionForSchedule(null);
        setIsScheduledDialogOpen(true);
        clearSelection();
        return;
      } else {
        toast({
          title: t("transactions.toasts.scheduleNotFound.title", {
            defaultValue: "Schedule Not Found",
          }),
          description: t("transactions.toasts.scheduleNotFound.description", {
            defaultValue: "The original schedule seems to have been deleted.",
          }),
          variant: "destructive",
        });
      }
    }

    setScheduledTransactionToEdit(null);
    setSelectedTransactionForSchedule({
      ...transaction,
      frequency: "Monthly",
      id: "",
      date: new Date().toISOString(),
    } as unknown as ScheduledTransaction);
    setIsScheduledDialogOpen(true);
    clearSelection();
  };

  const REQUIRED_HEADERS = [
    "Date",
    "Account",
    "Payee",
    "Category",
    "Subcategory",
    "Currency",
    "Amount",
    "Notes",
    "Frequency",
    "End Date",
    "Transfer ID",
    "Account Type",
    "Transfer Account",
    "Transfer Amount",
  ];

  const {
    handleExport,
    handleImportClick,
    handleFileChange,
    fileInputRef,
    mappingDialogState,
    setMappingDialogState,
    handleMappingConfirm,
    handleDetectTransfers,
    transferReview,
    setTransferReview,
    handleLinkSuggestedTransfers,
    missingCurrencyAccounts,
    resolveMissingCurrencies,
  } = useTransactionPageActions(filteredTransactions);

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    try {
      const count = await cleanUpDuplicates();
      if (count > 0) {
        toast({
          title: t("transactions.toasts.cleanupComplete.title", {
            defaultValue: "Cleanup Complete",
          }),
          description: t("transactions.toasts.cleanupComplete.description", {
            count,
            defaultValue: "Removed {{count}} duplicate transactions.",
          }),
        });
        invalidateAllData();
      } else {
        toast({
          title: t("transactions.toasts.noDuplicates.title", {
            defaultValue: "No Duplicates",
          }),
          description: t("transactions.toasts.noDuplicates.description", {
            defaultValue: "No duplicate transactions were found.",
          }),
        });
      }
    } catch (_error) {
      toast({
        title: t("transactions.toasts.cleanupFailed.title", {
          defaultValue: "Cleanup Failed",
        }),
        description: t("transactions.toasts.cleanupFailed.description", {
          defaultValue: "An error occurred while removing duplicates.",
        }),
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
      setIsCleanupConfirmOpen(false);
    }
  };

  const handleBulkCategorize = async () => {
    try {
      const uncategorizedItems = allTransactions.filter(
        (t) =>
          !t.category ||
          t.category.toLowerCase() === "uncategorized" ||
          t.category.trim() === "",
      );

      const allUniqueVendors = Array.from(
        new Set(
          uncategorizedItems.map((t) => t.vendor?.trim()).filter(Boolean),
        ),
      );

      if (allUniqueVendors.length === 0) {
        toast({
          title: t("transactions.toasts.nothingToCategorize.title", {
            defaultValue: "Nothing to categorize",
          }),
          description: t(
            "transactions.toasts.nothingToCategorize.description",
            {
              defaultValue: "No uncategorized vendors found.",
            },
          ),
        });
        return;
      }

      // Check for config before starting progress modal
      if (!config.apiKey || !config.provider) {
        toast({
          title: t("transactions.toasts.aiNotConfigured.title", {
            defaultValue: "AI Not Configured",
          }),
          description: (
            <div className="flex flex-col gap-2">
              <span>
                {t("transactions.toasts.aiNotConfigured.description", {
                  defaultValue: "Please configure your AI provider and API key",
                })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="w-fit mt-1"
              >
                <Link to="/settings">
                  {t("transactions.toasts.aiNotConfigured.action", {
                    defaultValue: "Go to AI Settings",
                  })}
                </Link>
              </Button>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      const localMappings: Record<string, CategorizeResult> = {};
      const unknownVendors: string[] = [];

      const sortedHistory = [...allTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      for (const vendor of allUniqueVendors) {
        if (!vendor) continue;
        const cached = getHistoricalMapping(vendor, sortedHistory);
        if (cached) {
          localMappings[vendor] = cached;
        } else {
          unknownVendors.push(vendor);
        }
      }

      let aiMappings: BulkCategorizeResult = {};

      if (unknownVendors.length > 0) {
        setIsBulkCategorizing(true);
        setOperationProgress({
          title: "Auto-Categorizing",
          description: `Categorizing ${allUniqueVendors.length} unique vendors (${
            Object.keys(localMappings).length ? "Some locally matched" : ""
          })...`,
          stage: "Calling AI",
          progress: 50,
          totalStages: 100,
        });

        try {
          aiMappings = await autoCategorizeBulk(
            unknownVendors,
            categories,
            subCategories,
          );
        } catch (e) {
          if (Object.keys(localMappings).length === 0) {
            throw e;
          }
          // If we have some local mappings, we ignore the AI error and let it proceed
        }
      } else {
        setIsBulkCategorizing(true);
        setOperationProgress({
          title: "Auto-Categorizing locally",
          description: `Matched ${allUniqueVendors.length} vendors from your history!`,
          stage: "Applying updates",
          progress: 90,
          totalStages: 100,
        });
      }

      const combinedMappings = { ...localMappings, ...aiMappings };
      const updates = [];

      for (const t of uncategorizedItems) {
        if (!t.vendor) continue;
        const vendorKey = Object.keys(combinedMappings).find(
          (k) => k.toLowerCase() === t.vendor.toLowerCase(),
        );
        const suggestion = vendorKey ? combinedMappings[vendorKey] : null;

        if (suggestion && suggestion.categoryName) {
          updates.push({
            ...t,
            category: suggestion.categoryName,
            sub_category: suggestion.subCategoryName || t.sub_category,
          });
        }
      }

      if (updates.length > 0) {
        for (let i = 0; i < updates.length; i++) {
          await updateTransaction(updates[i]);
        }
        toast({
          title: t("transactions.toasts.bulkCategorization.title", {
            defaultValue: "Bulk Categorization",
          }),
          description: t("transactions.toasts.bulkCategorization.description", {
            count: updates.length,
            defaultValue: "Categorized {{count}} transactions successfully.",
          }),
        });
        invalidateAllData();
      } else {
        toast({
          title: t("transactions.toasts.noChanges.title", {
            defaultValue: "No changes",
          }),
          description: t("transactions.toasts.noChanges.description", {
            defaultValue:
              "The AI could not confidently categorize any items or no valid mappings were returned.",
          }),
        });
      }
    } catch (e) {
      console.error("Bulk categorization error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Bulk categorization failed";

      const errorStr = String(errorMessage || "");

      const isApiKeyIssue =
        errorStr.toLowerCase().includes("unauthorized") ||
        errorStr.toLowerCase().includes("invalid") ||
        errorStr.toLowerCase().includes("401") ||
        errorStr.toLowerCase().includes("403") ||
        errorStr.toLowerCase().includes("key") ||
        errorStr.toLowerCase().includes("configured") ||
        errorStr.toLowerCase().includes("failed to fetch");

      const errorHint = isApiKeyIssue
        ? t("transactions.toasts.categorizationFailed.apiKeyHint", {
            defaultValue:
              "Please check your API key or endpoint configuration.",
          })
        : t("transactions.toasts.categorizationFailed.genericHint", {
            defaultValue: "An unexpected error occurred during categorization.",
          });

      toast({
        title: t("transactions.toasts.categorizationFailed.title", {
          defaultValue: "Categorization Failed",
        }),
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm">{errorStr}</span>
              <span className="text-xs opacity-90 italic">{errorHint}</span>
            </div>
            {(isApiKeyIssue || errorStr.length > 0) && (
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="w-fit mt-1"
              >
                <Link to="/settings">
                  {t("transactions.toasts.aiNotConfigured.action", {
                    defaultValue: "Go to AI Settings",
                  })}
                </Link>
              </Button>
            )}
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setOperationProgress(null);
      setIsBulkCategorizing(false);
    }
  };

  const handleUnlinkTransaction = React.useCallback((transferId: string) => {
    setUnlinkTransferId(transferId);
    setIsUnlinkConfirmOpen(true);
  }, []);

  const confirmUnlinkTransaction = async () => {
    if (unlinkTransferId) {
      await unlinkTransaction(unlinkTransferId);
      toast({
        title: t("transactions.toasts.unlinked.title", {
          defaultValue: "Transactions Unlinked",
        }),
        description: t("transactions.toasts.unlinked.description", {
          defaultValue: "The transfer link has been removed.",
        }),
      });
      setUnlinkTransferId(null);
    }
  };

  const handleLinkTransactions = React.useCallback(
    async (id1: string, id2: string) => {
      await linkTransactions(id1, id2);
      toast({
        title: t("transactions.toasts.linked.title", {
          defaultValue: "Transactions Linked",
        }),
        description: t("transactions.toasts.linked.description", {
          defaultValue: "The transactions have been paired as a transfer.",
        }),
      });
    },
    [linkTransactions, toast, t],
  );

  const handleRowDoubleClick = React.useCallback(
    (transaction: Transaction) => {
      setEditingTransaction(transaction);
      setIsDialogOpen(true);
    },
    [setEditingTransaction, setIsDialogOpen],
  );

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col gap-6">
        <div className="tour-add-transaction">
          <TransactionPageHeader
            onImportClick={handleImportClick}
            onExportClick={handleExport}
            onDetectTransfers={handleDetectTransfers}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsDialogOpen(true);
            }}
            onCleanUpDuplicates={() => setIsCleanupConfirmOpen(true)}
            onBulkCategorize={handleBulkCategorize}
            isBulkCategorizeEnabled={!isBulkCategorizing}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />
        </div>

        <div className="tour-transaction-filters">
          <SearchFilterBar />
        </div>
      </div>

      <div className="tour-transaction-list app-table-shell">
        <TransactionTable
          transactions={filteredTransactions}
          allData={combinedTransactions}
          loading={isLoadingTransactions}
          onRefresh={invalidateAllData}
          onDeleteTransactions={handleDeleteTransactionsWrapper}
          onAddTransaction={addTransaction}
          onScheduleTransactions={handleScheduleTransactions}
          onUnlinkTransaction={handleUnlinkTransaction}
          onLinkTransactions={handleLinkTransactions}
          onRowDoubleClick={handleRowDoubleClick}
          accountCurrencyMap={accountCurrencyMap}
        />
      </div>

      <AddEditTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={(accountName) => {
          if (accountName && selectedAccounts.length > 0) {
            const slugifiedAccount = slugify(accountName);
            if (!selectedAccounts.includes(slugifiedAccount)) {
              setSelectedAccounts((prev) => {
                if (prev.includes(slugifiedAccount)) return prev;
                return [...prev, slugifiedAccount];
              });
              toast({
                title: t("transactions.toasts.filterUpdated.title", {
                  defaultValue: "Filter Updated",
                }),
                description: t(
                  "transactions.toasts.filterUpdated.description",
                  {
                    accountName,
                    defaultValue:
                      'Added "{{accountName}}" to your view so you can see the new transaction.',
                  },
                ),
              });
            }
          }
          // Invalidate data AFTER updating filters to avoid race condition with default account selection
          invalidateAllData();
        }}
        transactionToEdit={editingTransaction}
      />

      <AddEditScheduledTransactionDialog
        isOpen={isScheduledDialogOpen}
        onOpenChange={setIsScheduledDialogOpen}
        transaction={
          scheduledTransactionToEdit || selectedTransactionForSchedule
        }
        onSubmit={async (values) => {
          try {
            const isEdit = !!scheduledTransactionToEdit?.id;
            const payload = {
              ...values,
              user_id: activeLedger?.id || "local-user",
            };

            if (isEdit) {
              await dataProvider.updateScheduledTransaction({
                ...scheduledTransactionToEdit,
                ...payload,
              });
              toast({
                title: t("transactions.toasts.scheduleUpdated.title", {
                  defaultValue: "Schedule Updated",
                }),
                description: t(
                  "transactions.toasts.scheduleUpdated.description",
                  {
                    defaultValue: "The recurring transaction has been updated.",
                  },
                ),
              });
            } else {
              await dataProvider.addScheduledTransaction(payload);
              toast({
                title: t("transactions.toasts.scheduleCreated.title", {
                  defaultValue: "Schedule Created",
                }),
                description: t(
                  "transactions.toasts.scheduleCreated.description",
                  {
                    defaultValue:
                      "A new recurring transaction has been scheduled.",
                  },
                ),
              });
            }
            setIsScheduledDialogOpen(false);
            invalidateAllData();
          } catch (e) {
            console.error(e);
            toast({
              title: t("transactions.toasts.scheduleSaveError.title", {
                defaultValue: "Error",
              }),
              description: t(
                "transactions.toasts.scheduleSaveError.description",
                {
                  defaultValue: "Failed to save schedule.",
                },
              ),
              variant: "destructive",
            });
          }
        }}
        isSubmitting={false}
        isLoading={false}
        accounts={accounts || []}
        categories={categories || []}
        allSubCategories={subCategories?.map((s) => s.name) || []}
        allPayees={[
          ...(accounts || []).map((a) => ({
            value: a.name,
            label: a.name,
            isAccount: true,
          })),
          ...(vendors || []).map((v) => ({
            value: v.name,
            label: v.name,
            isAccount: false,
          })),
        ]}
      />

      {mappingDialogState.isOpen && (
        <CSVMappingDialog
          isOpen={true}
          onClose={() =>
            setMappingDialogState((prev) => ({ ...prev, isOpen: false }))
          }
          file={mappingDialogState.file}
          requiredHeaders={REQUIRED_HEADERS}
          onConfirm={handleMappingConfirm}
        />
      )}

      <TransferSuggestionsDialog
        isOpen={transferReview.isOpen}
        onOpenChange={(isOpen) =>
          setTransferReview((previous) => ({ ...previous, isOpen }))
        }
        pairs={transferReview.pairs}
        onLink={handleLinkSuggestedTransfers}
      />
      <MissingCurrencyDialog
        isOpen={missingCurrencyAccounts.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            // If user closes dialog without confirming, we should probably abort import or let them cancel
            // But the hook resets state on finish/error.
            // We don't have a direct cancel method exposed yet, but closing dialog essentially pauses it indefinitely unless we clear state.
            // We should probably just do nothing or reload page.
            // Ideally we add a cancelImport to the hook but for now let's just let it stay or close.
            // Actually the dialog has a cancel button which should clear the state.
          }
        }}
        accounts={missingCurrencyAccounts}
        onConfirm={resolveMissingCurrencies}
        onCancel={() => window.location.reload()} // Simple way to abort for now or we can expose a reset function
      />

      <ConfirmationDialog
        isOpen={isCleanupConfirmOpen}
        onOpenChange={setIsCleanupConfirmOpen}
        onConfirm={handleCleanupDuplicates}
        title={t("transactions.confirmations.removeDuplicatesTitle", {
          defaultValue: "Remove Duplicate Transactions?",
        })}
        description={t(
          "transactions.confirmations.removeDuplicatesDescription",
          {
            defaultValue:
              "This scans for transactions with identical recurrence IDs on the same date and removes duplicates. This action cannot be undone.",
          },
        )}
        confirmText={
          isCleaningUp
            ? t("transactions.confirmations.cleaning", {
                defaultValue: "Cleaning...",
              })
            : t("transactions.confirmations.removeDuplicatesAction", {
                defaultValue: "Remove Duplicates",
              })
        }
      />

      <ConfirmationDialog
        isOpen={isUnlinkConfirmOpen}
        onOpenChange={setIsUnlinkConfirmOpen}
        onConfirm={confirmUnlinkTransaction}
        title={t("transactions.confirmations.unlinkTitle", {
          defaultValue: "Unlink Transactions?",
        })}
        description={t("transactions.confirmations.unlinkDescription", {
          defaultValue:
            "Are you sure you want to break the link between these transactions? They will no longer be treated as a transfer pair.",
        })}
        confirmText={t("transactions.confirmations.unlinkAction", {
          defaultValue: "Unlink",
        })}
      />
    </div>
  );
};

export default Transactions;

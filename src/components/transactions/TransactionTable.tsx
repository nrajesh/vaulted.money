import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead, // Keep for non-sortable headers like Checkbox column
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash, Copy, X, CalendarClock, Pencil, Link } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@/types/dataProvider";

interface TransactionTableProps {
  transactions: Transaction[];
  allData?: Transaction[]; // Full dataset for finding hidden transfer partners
  loading: boolean;
  onRefresh: () => void;
  onDeleteTransactions: (
    transactions: { id: string; transfer_id?: string }[],
  ) => void;
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "created_at">,
  ) => void;
  onRowDoubleClick?: (
    transaction: Transaction,
    event: React.MouseEvent,
  ) => void;
  onScheduleTransactions?: (
    transactions: Transaction[],
    clearSelection: () => void,
  ) => void;
  onUnlinkTransaction?: (transferId: string) => void;
  onLinkTransactions?: (id1: string, id2: string) => void;
  accountCurrencyMap?: Map<string, string>;
}

// Memoized Row Component
const TransactionRow = React.memo(
  ({
    transaction,
    isSelected,
    onToggleSelect,
    onRowDoubleClick,
    onUnlinkTransaction,
    onAddTransaction,
    onScheduleTransactions,
    onDeleteTransactions,
    accountCurrencyMap,
    selectedCurrency,
    today,
    navigate,
    toast,
    isValidTransfer,
  }: {
    transaction: Transaction;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onRowDoubleClick?: (
      transaction: Transaction,
      event: React.MouseEvent,
    ) => void;
    onUnlinkTransaction?: (transferId: string) => void;
    onAddTransaction: (
      transaction: Omit<Transaction, "id" | "created_at">,
    ) => void;
    onScheduleTransactions?: (
      transactions: Transaction[],
      clearSelection: () => void,
    ) => void;
    onDeleteTransactions: (
      transactions: { id: string; transfer_id?: string }[],
    ) => void;
    accountCurrencyMap?: Map<string, string>;
    selectedCurrency: string;
    today: Date;
    navigate: ReturnType<typeof useNavigate>; // useNavigate return type is NavigateFunction.
    toast: ReturnType<typeof useToast>["toast"]; // `useToast` return type.
    isValidTransfer: boolean;
  }) => {
    const isFuture = useMemo(() => {
      const txnDate = new Date(transaction.date);
      txnDate.setHours(0, 0, 0, 0);
      return txnDate > today;
    }, [transaction.date, today]);

    const renderCell = (field: string, value: unknown) => {
      const isFormerAccount =
        field === "account" && !accountCurrencyMap?.has(value as string);

      return (
        <span
          className={`cursor-pointer flex items-center gap-1 ${isFormerAccount ? "text-slate-400 dark:text-slate-500 italic" : ""}`}
        >
          {field === "amount"
            ? (value as number).toLocaleString(undefined, {
                style: "currency",
                currency:
                  accountCurrencyMap?.get(transaction.account) ||
                  transaction.currency ||
                  selectedCurrency,
              })
            : field === "date"
              ? new Date(value as string).toLocaleDateString()
              : (value as React.ReactNode) || "-"}
          {isFormerAccount && (
            <span
              className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded font-normal not-italic"
              title="This account has been deleted"
            >
              Former
            </span>
          )}
        </span>
      );
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
            data-state={isSelected ? "selected" : undefined}
            className={`group ${isSelected ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50 ${isFuture ? "opacity-70 italic text-slate-500 bg-slate-50/50 dark:bg-slate-900/50" : ""}`}
            onDoubleClick={(e) => {
              if (onRowDoubleClick && !transaction.is_projected) {
                onRowDoubleClick(transaction, e);
              }
            }}
          >
            <TableCell
              className="w-[40px] px-2"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <Checkbox
                  aria-label={`Select transaction: ${transaction.vendor || "No Payee"}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(transaction.id)}
                />
                {transaction.transfer_id && isValidTransfer && (
                  <button
                    className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 group/link transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title="Unlink Transfer"
                    aria-label="Unlink Transfer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUnlinkTransaction && transaction.transfer_id)
                        onUnlinkTransaction(transaction.transfer_id);
                    }}
                  >
                    <Link className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 group-hover/link:text-red-500" />
                  </button>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                {renderCell("date", transaction.date)}
                {transaction.is_scheduled_origin && (
                  <button
                    type="button"
                    title="Go to Scheduled Transaction"
                    aria-label="Go to Scheduled Transaction"
                    className="hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full p-1 transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (transaction.recurrence_id) {
                        navigate(`/scheduled?id=${transaction.recurrence_id}`);
                      } else {
                        toast({
                          title: "Reference Missing",
                          description:
                            "Could not find the original scheduled transaction.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                  </button>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
              {renderCell("category", transaction.category)}
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              {renderCell("sub_category", transaction.sub_category)}
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              {renderCell("vendor", transaction.vendor)}
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              {renderCell("account", transaction.account)}
            </TableCell>
            <TableCell
              className="max-w-[200px] truncate text-slate-600 dark:text-slate-400"
              title={transaction.remarks || ""}
            >
              {renderCell("remarks", transaction.remarks)}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
            >
              {renderCell("amount", transaction.amount)}
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem inset onClick={() => onToggleSelect(transaction.id)}>
            {isSelected ? "Deselect" : "Select"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          {!transaction.is_projected && (
            <>
              <ContextMenuItem
                inset
                onClick={(e) =>
                  onRowDoubleClick && onRowDoubleClick(transaction, e)
                }
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem
            inset
            onClick={() =>
              onScheduleTransactions &&
              onScheduleTransactions([transaction], () => {})
            }
          >
            <CalendarClock className="h-4 w-4 mr-2" />{" "}
            {transaction.recurrence_id ? "Edit Schedule" : "Schedule"}
          </ContextMenuItem>
          <ContextMenuItem
            inset
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, created_at, ...rest } = transaction;
              onAddTransaction({
                ...rest,
                remarks: transaction.remarks + " (Copy)",
                recurrence_id: undefined,
                is_scheduled_origin: undefined,
                is_projected: undefined,
                recurrence_frequency: undefined,
                recurrence_end_date: undefined,
              });
            }}
          >
            <Copy className="h-4 w-4 mr-2" /> Duplicate
          </ContextMenuItem>
          <ContextMenuItem
            inset
            className="text-red-600"
            onClick={() => onDeleteTransactions([{ id: transaction.id }])}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);

TransactionRow.displayName = "TransactionRow";

// Mobile Memoized Card Component
const TransactionMobileCard = React.memo(
  ({
    transaction,
    isSelected,
    onToggleSelect,
    onRowDoubleClick,
    onUnlinkTransaction,
    onAddTransaction,
    onScheduleTransactions,
    onDeleteTransactions,
    accountCurrencyMap,
    selectedCurrency,
    today,
    navigate,
    toast,
    isValidTransfer,
  }: {
    transaction: Transaction;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onRowDoubleClick?: (
      transaction: Transaction,
      event: React.MouseEvent,
    ) => void;
    onUnlinkTransaction?: (transferId: string) => void;
    onAddTransaction: (
      transaction: Omit<Transaction, "id" | "created_at">,
    ) => void;
    onScheduleTransactions?: (
      transactions: Transaction[],
      clearSelection: () => void,
    ) => void;
    onDeleteTransactions: (
      transactions: { id: string; transfer_id?: string }[],
    ) => void;
    accountCurrencyMap?: Map<string, string>;
    selectedCurrency: string;
    today: Date;
    navigate: ReturnType<typeof useNavigate>;
    toast: ReturnType<typeof useToast>["toast"];
    isValidTransfer: boolean;
  }) => {
    const isFuture = useMemo(() => {
      const txnDate = new Date(transaction.date);
      txnDate.setHours(0, 0, 0, 0);
      return txnDate > today;
    }, [transaction.date, today]);

    const formattedAmount = transaction.amount.toLocaleString(undefined, {
      style: "currency",
      currency:
        accountCurrencyMap?.get(transaction.account) ||
        transaction.currency ||
        selectedCurrency,
    });

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`app-mobile-row ${isSelected ? "app-row-selected" : ""} ${
              isFuture
                ? "opacity-70 italic bg-slate-50/50 dark:bg-slate-900/50"
                : ""
            }`}
            onClick={(e) => {
              if (onRowDoubleClick && !transaction.is_projected) {
                onRowDoubleClick(transaction, e);
              }
            }}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Checkbox
                  aria-label={`Select transaction: ${transaction.vendor || "No Payee"}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(transaction.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex min-w-0 items-center gap-2">
                    <div className="truncate text-base font-bold leading-tight">
                      {transaction.vendor || "No Payee"}
                    </div>
                    {transaction.transfer_id && isValidTransfer && (
                      <button
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 transition-colors hover:bg-red-100 dark:bg-blue-900/30 dark:hover:bg-red-900/30"
                        title="Unlink Transfer"
                        aria-label="Unlink Transfer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUnlinkTransaction && transaction.transfer_id)
                            onUnlinkTransaction(transaction.transfer_id);
                        }}
                      >
                        <Link className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                      </button>
                    )}
                  </div>
                  <div className="mb-2 min-w-0 truncate text-sm text-slate-500 dark:text-slate-400">
                    {new Date(transaction.date).toLocaleDateString()}{" "}
                    {" \u00b7 "}
                    <span
                      className={
                        !accountCurrencyMap?.has(transaction.account)
                          ? "italic text-slate-400"
                          : ""
                      }
                    >
                      {transaction.account}
                    </span>
                    {!accountCurrencyMap?.has(transaction.account) && (
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 rounded uppercase font-medium">
                        Former
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      {transaction.category}
                    </span>
                    {transaction.sub_category && (
                      <span className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                        {transaction.sub_category}
                      </span>
                    )}
                  </div>

                  {transaction.remarks && (
                    <div className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">
                      {transaction.remarks}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex max-w-[42%] shrink-0 flex-col items-end gap-2">
                <div
                  className={`max-w-full truncate text-right text-base font-bold sm:text-lg ${transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                >
                  {formattedAmount}
                </div>
                {transaction.is_scheduled_origin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (transaction.recurrence_id) {
                        navigate(`/scheduled?id=${transaction.recurrence_id}`);
                      } else {
                        toast({
                          title: "Reference Missing",
                          description:
                            "Could not find the original scheduled transaction.",
                          variant: "destructive",
                        });
                      }
                    }}
                    title="Go to Scheduled Transaction"
                    aria-label="Go to Scheduled Transaction"
                    className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/30"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem inset onClick={() => onToggleSelect(transaction.id)}>
            {isSelected ? "Deselect" : "Select"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          {!transaction.is_projected && (
            <>
              <ContextMenuItem
                inset
                onClick={(e) =>
                  onRowDoubleClick && onRowDoubleClick(transaction, e)
                }
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem
            inset
            onClick={() =>
              onScheduleTransactions &&
              onScheduleTransactions([transaction], () => {})
            }
          >
            <CalendarClock className="h-4 w-4 mr-2" />{" "}
            {transaction.recurrence_id ? "Edit Schedule" : "Schedule"}
          </ContextMenuItem>
          <ContextMenuItem
            inset
            onClick={() => {
              const { id: _id, created_at: _created_at, ...rest } = transaction;
              onAddTransaction({
                ...rest,
                remarks: transaction.remarks + " (Copy)",
                recurrence_id: undefined,
                is_scheduled_origin: undefined,
                is_projected: undefined,
                recurrence_frequency: undefined,
                recurrence_end_date: undefined,
              });
            }}
          >
            <Copy className="h-4 w-4 mr-2" /> Duplicate
          </ContextMenuItem>
          <ContextMenuItem
            inset
            className="text-red-600"
            onClick={() => onDeleteTransactions([{ id: transaction.id }])}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);
TransactionMobileCard.displayName = "TransactionMobileCard";

const TransactionTable = ({
  transactions,
  allData,
  loading,
  onDeleteTransactions,
  onAddTransaction,
  onScheduleTransactions,
  onRowDoubleClick,
  onUnlinkTransaction,
  onLinkTransactions,
  accountCurrencyMap,
}: TransactionTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { selectedCurrency } = useCurrency();
  const navigate = useNavigate();

  // Optimization: Calculate today once per render
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination when data length changes (e.g. filters applied)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  // Use the sorting hook
  const { sortedData, sortConfig, handleHeaderClick, handleHeaderRightClick } =
    useTableSort({
      data: transactions,
      initialSort: { key: "date", direction: "desc" },
    });

  // Calculate Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedData = useMemo(
    () => sortedData.slice(offset, offset + pageSize),
    [sortedData, offset, pageSize],
  );

  // Selection Handlers (Updated for Pagination)
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const currentIds = paginatedData.map((t) => t.id);
      const allSelected = currentIds.every((id) => prev.has(id));

      const newSet = new Set(prev);
      if (allSelected) {
        currentIds.forEach((id) => newSet.delete(id));
      } else {
        currentIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  }, [paginatedData]);

  const toggleSelect = useCallback(
    (id: string) => {
      // Determine linked IDs first
      const txn = (allData || sortedData).find((t) => t.id === id);
      const idsToToggle = [id];

      // Always toggle pair if it exists (even if hidden)
      if (txn?.transfer_id && !txn.transfer_id.startsWith("split-")) {
        (allData || sortedData).forEach((t) => {
          if (t.transfer_id === txn.transfer_id && t.id !== id) {
            idsToToggle.push(t.id);
          }
        });
      }

      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        const isSelected = prev.has(id);

        idsToToggle.forEach((targetId) => {
          if (isSelected) {
            newSelected.delete(targetId);
          } else {
            newSelected.add(targetId);
          }
        });

        console.log("Toggle Select Debug:", {
          clickedId: id,
          txnTransferId: txn?.transfer_id,
          linkedIdsFound: idsToToggle,
        });

        return newSelected;
      });
    },
    [sortedData, allData],
  );

  // Bulk Actions
  const handleBulkDelete = () => {
    const toDelete = sortedData
      .filter((t) => selectedIds.has(t.id))
      .map((t) => ({ id: t.id, transfer_id: t.transfer_id || undefined }));

    onDeleteTransactions(toDelete);
    setSelectedIds(new Set());
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = sortedData.filter((t) => selectedIds.has(t.id));
    toDuplicate.forEach((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...rest } = t;
      onAddTransaction({
        ...rest,
        date: new Date().toISOString(),
        remarks: `${t.remarks} (Copy)`,
        recurrence_id: undefined,
        is_scheduled_origin: undefined,
        is_projected: undefined,
      });
    });
    setSelectedIds(new Set());
    toast({
      title: "Duplicated",
      description: `${toDuplicate.length} transactions duplicated.`,
    });
  };

  const handleBulkSchedule = () => {
    const toSchedule = sortedData.filter((t) => selectedIds.has(t.id));
    if (onScheduleTransactions) {
      onScheduleTransactions(toSchedule, () => setSelectedIds(new Set()));
    }
  };

  const numSelected = selectedIds.size;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // Helper to check if all current page items are selected
  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((t) => selectedIds.has(t.id));

  return (
    <div className="space-y-4">
      {/* Bulk Toolbar */}
      <div
        className={`app-table-toolbar ${
          numSelected > 0
            ? "app-table-toolbar-active"
            : "app-table-toolbar-idle"
        } ${numSelected === 0 ? "hidden md:block" : ""}`}
      >
        <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 px-1 text-sm font-medium">
              {numSelected} selected
            </span>
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={numSelected === 0}
              className="h-10 w-10 p-0 disabled:pointer-events-none disabled:opacity-45 sm:h-9 sm:w-auto sm:px-3"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear selection</span>
              <span className="hidden sm:inline sm:ml-1">Clear</span>
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={numSelected === 0}
              className="h-10 w-10 p-0 disabled:pointer-events-none disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 sm:h-9 sm:w-auto sm:px-3"
              title="Delete selected"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete selected</span>
              <span className="hidden sm:inline sm:ml-1">Delete</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBulkDuplicate}
              disabled={numSelected === 0}
              className="h-10 w-10 p-0 disabled:pointer-events-none disabled:opacity-45 sm:h-9 sm:w-auto sm:px-3"
              title="Duplicate selected"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Duplicate selected</span>
              <span className="hidden sm:inline sm:ml-1">Duplicate</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBulkSchedule}
              disabled={numSelected === 0}
              className="h-10 w-10 p-0 disabled:pointer-events-none disabled:opacity-45 sm:h-9 sm:w-auto sm:px-3"
              title="Schedule selected"
            >
              <CalendarClock className="h-4 w-4" />
              <span className="sr-only">Schedule selected</span>
              <span className="hidden sm:inline sm:ml-1">Schedule</span>
            </Button>
            {onLinkTransactions && (
              <Button
                size="sm"
                variant="default"
                className="h-10 w-10 bg-blue-600 p-0 text-white hover:bg-blue-700 disabled:pointer-events-none disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground sm:h-9 sm:w-auto sm:px-3"
                disabled={numSelected !== 2}
                title="Link selected pair"
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  if (ids.length === 2 && onLinkTransactions) {
                    onLinkTransactions(ids[0], ids[1]);
                    setSelectedIds(new Set()); // Clear selection after linking
                  }
                }}
              >
                <Link className="h-4 w-4" />
                <span className="sr-only">Link selected pair</span>
                <span className="hidden sm:inline sm:ml-1">Link Pair</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-3">
        {sortedData.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-md">
            No transactions found.
          </div>
        ) : (
          paginatedData.map((transaction) => (
            <TransactionMobileCard
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedIds.has(transaction.id)}
              onToggleSelect={toggleSelect}
              onRowDoubleClick={onRowDoubleClick}
              onUnlinkTransaction={onUnlinkTransaction}
              onAddTransaction={onAddTransaction}
              onScheduleTransactions={onScheduleTransactions}
              onDeleteTransactions={onDeleteTransactions}
              accountCurrencyMap={accountCurrencyMap}
              selectedCurrency={selectedCurrency}
              today={today}
              navigate={navigate}
              toast={toast}
              isValidTransfer={
                !!(
                  transaction.transfer_id &&
                  !transaction.transfer_id.startsWith("split-")
                )
              }
            />
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allCurrentPageSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all transactions on this page"
                />
              </TableHead>
              <SortableHeader
                label="Date"
                sortKey="date"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
              />
              <SortableHeader
                label="Category"
                sortKey="category"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Sub-category"
                sortKey="sub_category"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Payee"
                sortKey="vendor"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Account"
                sortKey="account"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Notes"
                sortKey="remarks"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Amount"
                sortKey="amount"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-right text-slate-800 dark:text-slate-200 font-semibold"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedIds.has(transaction.id)}
                  onToggleSelect={toggleSelect}
                  onRowDoubleClick={onRowDoubleClick}
                  onUnlinkTransaction={onUnlinkTransaction}
                  onAddTransaction={onAddTransaction}
                  onScheduleTransactions={onScheduleTransactions}
                  onDeleteTransactions={onDeleteTransactions}
                  accountCurrencyMap={accountCurrencyMap}
                  selectedCurrency={selectedCurrency}
                  today={today}
                  navigate={navigate}
                  toast={toast}
                  isValidTransfer={
                    !!(
                      transaction.transfer_id &&
                      !transaction.transfer_id.startsWith("split-")
                    )
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground order-2 sm:order-1">
            <span>Rows per page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1); // Reset to first page when changing size
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-border mx-2" />
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Pagination className="w-full justify-center order-1 sm:w-auto sm:justify-end sm:order-2">
            <PaginationContent className="w-full justify-between sm:w-auto sm:justify-start">
              <PaginationItem>
                <PaginationFirst
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0 sm:w-auto sm:px-2.5 [&_span]:hidden sm:[&_span]:inline"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0 sm:w-auto sm:px-2.5 [&_span]:hidden sm:[&_span]:inline"
                />
              </PaginationItem>

              {/* Simple Page Indicator / Jumper could go here, but focusing on Nav controls for now */}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0 sm:w-auto sm:px-2.5 [&_span]:hidden sm:[&_span]:inline"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLast
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0 sm:w-auto sm:px-2.5 [&_span]:hidden sm:[&_span]:inline"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToDDMMYYYY, cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  PlayCircle,
  X,
  Link,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ScheduledTransaction } from "@/types/dataProvider";
import { hasScheduleEnded } from "@/utils/scheduleUtils";

interface ScheduledTransactionsTableProps {
  transactions: ScheduledTransaction[];
  onEdit?: (transaction: ScheduledTransaction) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onProcessToday?: (transaction: ScheduledTransaction) => void;
  onUnlink?: (transferId: string) => void;
}

export function ScheduledTransactionsTable({
  transactions = [],
  onEdit,
  onDelete,
  onBulkDelete,
  onProcessToday,
  onUnlink,
}: ScheduledTransactionsTableProps) {
  const { t } = useTranslation();
  const { accountCurrencyMap } = useTransactions();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 10;

  // A schedule has ended once its next occurrence would fall after the end
  // date: the startup scheduler stops creating transactions for it.
  const isEnded = (transaction: ScheduledTransaction) =>
    hasScheduleEnded(transaction.end_date, new Date(transaction.date));

  // The next date means nothing once a schedule has ended, so show the marker
  // and the date it stopped instead of an overdue "next" date.
  const renderNextDate = (transaction: ScheduledTransaction) => {
    if (!isEnded(transaction)) return formatDateToDDMMYYYY(transaction.date);
    const endDate = formatDateToDDMMYYYY(transaction.end_date as string);
    return (
      <span
        className="inline-flex flex-wrap items-center gap-2"
        title={t("scheduled.table.endedTitle", {
          date: endDate,
          defaultValue:
            "Ended on {{date}}. It will not create any more transactions.",
        })}
      >
        <Badge variant="secondary" className="text-xs font-normal">
          {t("scheduled.table.ended", { defaultValue: "Ended" })}
        </Badge>
        <span className="text-slate-500 dark:text-slate-400">{endDate}</span>
      </span>
    );
  };

  const handleAccountClick = (accountName: string) => {
    navigate("/transactions", { state: { filterAccount: accountName } });
  };

  const handleVendorClick = (vendorName: string) => {
    const isAccount = accountCurrencyMap.has(vendorName);
    const filterKey = isAccount ? "filterAccount" : "filterVendor";
    navigate("/transactions", { state: { [filterKey]: vendorName } });
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate("/transactions", { state: { filterCategory: categoryName } });
  };

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction,
  );

  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Selection Handlers
  const toggleSelectAll = () => {
    // "Select All" means select ALL filtered transactions (as per user request)
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);

    const txn = transactions.find((t) => t.id === id);
    const idsToToggle = [id];

    // If part of a transfer, find pair
    if (txn?.transfer_id) {
      const pair = transactions.find(
        (t) => t.transfer_id === txn.transfer_id && t.id !== id,
      );
      if (pair) idsToToggle.push(pair.id);
    }

    const isSelected = selectedIds.has(id);

    idsToToggle.forEach((targetId) => {
      if (isSelected) newSelected.delete(targetId);
      else newSelected.add(targetId);
    });

    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } else if (onDelete) {
      // Fallback to loop if no bulk handler
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  // Safety check
  if (!accountCurrencyMap) {
    console.error(
      "ScheduledTransactionsTable: accountCurrencyMap is missing from context.",
    );
    return (
      <div className="p-4 text-red-500">
        {t("scheduled.table.contextError", {
          defaultValue: "Error loading table context.",
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Toolbar */}
      <div
        className={`app-table-toolbar ${
          selectedIds.size > 0
            ? "app-table-toolbar-active"
            : "app-table-toolbar-idle"
        }`}
      >
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-1 text-sm font-medium">
              {t("scheduled.table.selected", {
                count: selectedIds.size,
                defaultValue: "{{count}} selected",
              })}
            </span>
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
              className="h-10 w-10 p-0 disabled:pointer-events-none disabled:opacity-45 sm:h-9 sm:w-auto sm:px-3"
              title={t("scheduled.table.clearSelection", {
                defaultValue: "Clear selection",
              })}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">
                {t("scheduled.table.clearSelection", {
                  defaultValue: "Clear selection",
                })}
              </span>
              <span className="hidden sm:inline sm:ml-1">
                {t("scheduled.table.clear", { defaultValue: "Clear" })}
              </span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="h-10 w-10 p-0 disabled:pointer-events-none disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 sm:h-9 sm:w-auto sm:px-3"
              title={t("scheduled.table.deleteSelected", {
                defaultValue: "Delete selected",
              })}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">
                {t("scheduled.table.deleteSelected", {
                  defaultValue: "Delete selected",
                })}
              </span>
              <span className="hidden sm:inline sm:ml-1">
                {t("scheduled.table.delete", { defaultValue: "Delete" })}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-md border">
            {t("scheduled.table.empty", {
              defaultValue: "No scheduled transactions found.",
            })}
          </div>
        ) : (
          currentTransactions.map((transaction, index) => {
            if (!transaction) return null;
            const currentAccountCurrency =
              accountCurrencyMap.get(transaction.account) ||
              transaction.currency ||
              "USD";

            return (
              <div
                key={transaction.id || `sched-txn-${index}`}
                className={`app-mobile-row flex flex-col gap-3 bg-white/50 backdrop-blur-sm dark:bg-black/20 ${
                  selectedIds.has(transaction.id) ? "app-row-selected" : ""
                } ${isEnded(transaction) ? "opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedIds.has(transaction.id)}
                      onCheckedChange={() => toggleSelect(transaction.id)}
                      aria-label={t("scheduled.table.selectOne", {
                        name: transaction.vendor,
                        defaultValue:
                          "Select scheduled transaction for {{name}}",
                      })}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base truncate text-slate-800 dark:text-slate-100">
                          {transaction.vendor ||
                            t("scheduled.table.unknown", {
                              defaultValue: "Unknown",
                            })}
                        </span>
                        {transaction.transfer_id && (
                          <Link className="h-3.5 w-3.5 text-blue-500" />
                        )}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">
                        {transaction.account ||
                          t("scheduled.table.unknown", {
                            defaultValue: "Unknown",
                          })}
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 text-slate-500">
                            {t("scheduled.table.headers.date", {
                              defaultValue: "Date",
                            })}
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {renderNextDate(transaction)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 text-slate-500">
                            {t("scheduled.table.headers.freq", {
                              defaultValue: "Freq",
                            })}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {transaction.frequency ||
                              t("scheduled.table.na", { defaultValue: "N/A" })}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                badgeVariants({ variant: "outline" }),
                                "text-xs",
                              )}
                            >
                              {transaction.category ||
                                t("scheduled.table.uncategorized", {
                                  defaultValue: "Uncategorized",
                                })}
                            </span>
                            {transaction.sub_category && (
                              <Badge variant="secondary" className="text-xs">
                                {transaction.sub_category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-2">
                    <span
                      className={`font-bold text-lg ${transaction.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {formatCurrency(
                        transaction.amount,
                        currentAccountCurrency,
                      )}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {t("scheduled.table.actions", {
                            defaultValue: "Actions",
                          })}
                        </DropdownMenuLabel>
                        {onProcessToday && (
                          <DropdownMenuItem
                            onClick={() => onProcessToday(transaction)}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />{" "}
                            {t("scheduled.table.makeHappenToday", {
                              defaultValue: "Make happen today",
                            })}
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" />{" "}
                            {t("scheduled.table.edit", {
                              defaultValue: "Edit",
                            })}
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(transaction.id)}
                            className="text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />{" "}
                            {t("scheduled.table.delete", {
                              defaultValue: "Delete",
                            })}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    transactions.length > 0 &&
                    selectedIds.size === transactions.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label={t("scheduled.table.selectAll", {
                    defaultValue: "Select all scheduled transactions",
                  })}
                />
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                {t("scheduled.table.headers.nextDate", {
                  defaultValue: "Next Date",
                })}
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                {t("scheduled.table.headers.frequency", {
                  defaultValue: "Frequency",
                })}
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                {t("scheduled.table.headers.vendorAccount", {
                  defaultValue: "Vendor / Account",
                })}
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                {t("scheduled.table.headers.category", {
                  defaultValue: "Category",
                })}
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                {t("scheduled.table.headers.subCategory", {
                  defaultValue: "Sub-category",
                })}
              </TableHead>
              <TableHead className="text-right text-slate-800 dark:text-slate-200 font-semibold">
                {t("scheduled.table.headers.amount", {
                  defaultValue: "Amount",
                })}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-slate-500"
                >
                  {t("scheduled.table.empty", {
                    defaultValue: "No scheduled transactions found.",
                  })}
                </TableCell>
              </TableRow>
            ) : (
              currentTransactions.map((transaction, index) => {
                // Defensive coding against incomplete data
                if (!transaction) return null;

                const currentAccountCurrency =
                  accountCurrencyMap.get(transaction.account) ||
                  transaction.currency ||
                  "USD";

                return (
                  <ContextMenu key={transaction.id || `sched-txn-${index}`}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className={`group cursor-pointer hover:bg-muted/50 ${selectedIds.has(transaction.id) ? "bg-muted" : ""} ${isEnded(transaction) ? "opacity-70" : ""}`}
                        onDoubleClick={() => onEdit && onEdit(transaction)}
                      >
                        <TableCell
                          className="w-[40px]"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(transaction.id)}
                            onCheckedChange={() => toggleSelect(transaction.id)}
                            aria-label={t("scheduled.table.selectOne", {
                              name: transaction.vendor,
                              defaultValue:
                                "Select scheduled transaction for {{name}}",
                            })}
                          />
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                          {renderNextDate(transaction)}
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                          {transaction.frequency ||
                            t("scheduled.table.na", { defaultValue: "N/A" })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.transfer_id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUnlink)
                                    onUnlink(transaction.transfer_id!);
                                }}
                                className="mr-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors group/link"
                                aria-label={t("scheduled.table.unlinkPair", {
                                  defaultValue: "Unlink Pair",
                                })}
                                title={t("scheduled.table.unlinkPair", {
                                  defaultValue: "Unlink Pair",
                                })}
                              >
                                <Link className="h-3.5 w-3.5 text-blue-500 group-hover/link:text-red-500" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVendorClick(transaction.vendor);
                              }}
                              className="appearance-none bg-transparent border-0 p-0 text-left font-medium cursor-pointer hover:text-primary hover:underline text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm"
                            >
                              {transaction.vendor ||
                                t("scheduled.table.unknown", {
                                  defaultValue: "Unknown",
                                })}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccountClick(transaction.account);
                            }}
                            className="appearance-none bg-transparent border-0 p-0 text-left text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm"
                          >
                            {transaction.account ||
                              t("scheduled.table.unknown", {
                                defaultValue: "Unknown",
                              })}
                          </button>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryClick(transaction.category);
                            }}
                            className={cn(
                              badgeVariants({ variant: "outline" }),
                              "text-slate-700 dark:text-slate-300",
                              transaction.category !== "Transfer" &&
                                "cursor-pointer hover:border-primary",
                            )}
                          >
                            {transaction.category ||
                              t("scheduled.table.uncategorized", {
                                defaultValue: "Uncategorized",
                              })}
                          </button>
                        </TableCell>
                        <TableCell>
                          {transaction.sub_category && (
                            <Badge
                              variant="outline"
                              className="text-xs text-slate-700 dark:text-slate-300 font-normal"
                            >
                              {transaction.sub_category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${transaction.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {formatCurrency(
                            transaction.amount,
                            currentAccountCurrency,
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">
                                  {t("scheduled.table.openMenu", {
                                    defaultValue: "Open menu",
                                  })}
                                </span>
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {t("scheduled.table.actions", {
                                  defaultValue: "Actions",
                                })}
                              </DropdownMenuLabel>
                              {onProcessToday && (
                                <DropdownMenuItem
                                  onClick={() => onProcessToday(transaction)}
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" />{" "}
                                  {t("scheduled.table.makeHappenToday", {
                                    defaultValue: "Make happen today",
                                  })}
                                </DropdownMenuItem>
                              )}
                              {onEdit && (
                                <DropdownMenuItem
                                  onClick={() => onEdit(transaction)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />{" "}
                                  {t("scheduled.table.edit", {
                                    defaultValue: "Edit",
                                  })}
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => onDelete(transaction.id)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />{" "}
                                  {t("scheduled.table.delete", {
                                    defaultValue: "Delete",
                                  })}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        inset
                        onClick={() => toggleSelect(transaction.id)}
                      >
                        {selectedIds.has(transaction.id)
                          ? t("scheduled.table.deselect", {
                              defaultValue: "Deselect",
                            })
                          : t("scheduled.table.select", {
                              defaultValue: "Select",
                            })}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      {onProcessToday && (
                        <ContextMenuItem
                          onClick={() => onProcessToday(transaction)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />{" "}
                          {t("scheduled.table.makeHappenToday", {
                            defaultValue: "Make happen today",
                          })}
                        </ContextMenuItem>
                      )}
                      <ContextMenuSeparator />
                      {onEdit && (
                        <ContextMenuItem onClick={() => onEdit(transaction)}>
                          <Pencil className="mr-2 h-4 w-4" />{" "}
                          {t("scheduled.table.edit", { defaultValue: "Edit" })}
                        </ContextMenuItem>
                      )}
                      {onDelete && (
                        <ContextMenuItem
                          onClick={() => onDelete(transaction.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />{" "}
                          {t("scheduled.table.delete", {
                            defaultValue: "Delete",
                          })}
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={
                    currentPage === 1
                      ? undefined
                      : () => paginate(currentPage - 1)
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 text-sm text-slate-500">
                  {t("scheduled.table.pageOf", {
                    page: currentPage,
                    total: totalPages,
                    defaultValue: "Page {{page}} of {{total}}",
                  })}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={
                    currentPage === totalPages
                      ? undefined
                      : () => paginate(currentPage + 1)
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

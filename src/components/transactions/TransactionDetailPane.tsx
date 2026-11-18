import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  CalendarClock,
  Copy,
  Pencil,
  ReceiptText,
  Trash,
} from "lucide-react";
import type { Transaction } from "@/types/dataProvider";
import { Button } from "@/components/ui/button";
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
import { formatDisplayDate } from "@/utils/dateFormat";
import { cn } from "@/lib/utils";

/** How many earlier payments to the same payee the panel lists. */
const PAYEE_HISTORY_LIMIT = 5;

interface TransactionDetailPaneProps {
  /** The selected transaction, or null to show the "pick one" hint. */
  transaction: Transaction | null;
  /** Every transaction in the ledger, for the payee history. */
  allTransactions: Transaction[];
  /** Currency of the transaction's account (falls back to the app's). */
  currencyFor: (transaction: Transaction) => string;
  onEdit: (transaction: Transaction) => void;
  onDuplicate: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onSelect: (transactionId: string) => void;
  className?: string;
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return amount.toLocaleString(undefined, { style: "currency", currency });
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const amountTone = (amount: number) =>
  amount < 0
    ? "text-red-600 dark:text-red-400"
    : "text-green-700 dark:text-green-400";

/**
 * The right-hand panel of the two-panel Transactions layout: everything about
 * the selected transaction, its actions, and the latest payments to the same
 * payee. Shown when the screen is wide enough for two phone-width columns
 * (see transactionLayout.ts), e.g. an unfolded iPhone Duo or a tablet.
 */
export function TransactionDetailPane({
  transaction,
  allTransactions,
  currencyFor,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
  className,
}: TransactionDetailPaneProps) {
  const { t, i18n } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Latest real payments to the same payee in this ledger (newest first).
  const payeeHistory = useMemo(() => {
    if (!transaction?.vendor) return [];
    return allTransactions
      .filter(
        (item) =>
          item.vendor === transaction.vendor &&
          item.id !== transaction.id &&
          !item.is_projected,
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, PAYEE_HISTORY_LIMIT);
  }, [allTransactions, transaction]);

  if (!transaction) {
    return (
      <section
        aria-label={t("transactionsTable.details.title", {
          defaultValue: "Transaction details",
        })}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-muted-foreground",
          className,
        )}
      >
        <ReceiptText className="h-10 w-10" aria-hidden="true" />
        <p className="text-sm">
          {t("transactionsTable.details.empty", {
            defaultValue: "Select a transaction to see its details here.",
          })}
        </p>
      </section>
    );
  }

  const currency = currencyFor(transaction);
  const isTransfer = !!(
    transaction.transfer_id && !transaction.transfer_id.startsWith("split-")
  );
  const payee =
    transaction.vendor ||
    t("transactionsTable.noPayee", { defaultValue: "No Payee" });

  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: t("transactionsTable.headers.date", { defaultValue: "Date" }),
      value: formatDisplayDate(transaction.date, i18n.language),
    },
    {
      label: t("transactionsTable.headers.account", {
        defaultValue: "Account",
      }),
      value: transaction.account,
    },
    {
      label: t("transactionsTable.headers.category", {
        defaultValue: "Category",
      }),
      value: transaction.category,
    },
  ];
  if (transaction.sub_category) {
    facts.push({
      label: t("transactionsTable.headers.subCategory", {
        defaultValue: "Sub-category",
      }),
      value: transaction.sub_category,
    });
  }
  if (transaction.remarks) {
    facts.push({
      label: t("transactionsTable.headers.notes", { defaultValue: "Notes" }),
      value: transaction.remarks,
    });
  }

  return (
    <section
      aria-label={t("transactionsTable.details.title", {
        defaultValue: "Transaction details",
      })}
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm",
        className,
      )}
    >
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isTransfer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
              <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />
              {t("transactionsTable.details.transfer", {
                defaultValue: "Transfer",
              })}
            </span>
          )}
          {transaction.recurrence_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              {t("transactionsTable.details.scheduled", {
                defaultValue: "Scheduled",
              })}
            </span>
          )}
        </div>
        <h2 className="break-words text-xl font-semibold leading-tight">
          {payee}
        </h2>
        <p
          className={cn(
            "text-4xl font-bold tabular-nums tracking-tight",
            amountTone(transaction.amount),
          )}
        >
          {formatMoney(transaction.amount, currency)}
        </p>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        {facts.map((fact) => (
          <React.Fragment key={fact.label}>
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="min-w-0 break-words font-medium">{fact.value}</dd>
          </React.Fragment>
        ))}
      </dl>

      {!transaction.is_projected && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onEdit(transaction)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("transactionsTable.details.edit", { defaultValue: "Edit" })}
          </Button>
          <Button variant="outline" onClick={() => onDuplicate(transaction)}>
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("transactionsTable.duplicate", { defaultValue: "Duplicate" })}
          </Button>
          <Button
            variant="outline"
            className="text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("management.actions.delete", { defaultValue: "Delete" })}
          </Button>
        </div>
      )}

      {payeeHistory.length > 0 && (
        <div className="space-y-3 border-t pt-5">
          <h3 className="text-sm font-semibold">
            {t("transactionsTable.details.payeeHistory", {
              payee,
              defaultValue: "Earlier with {{payee}}",
            })}
          </h3>
          <ul className="space-y-1">
            {payeeHistory.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md border-0 bg-transparent px-2 py-2 text-left text-sm hover:bg-accent"
                  aria-label={t("transactionsTable.details.openEarlier", {
                    date: formatDisplayDate(item.date, i18n.language),
                    defaultValue: "Open the transaction from {{date}}",
                  })}
                >
                  <span className="text-muted-foreground">
                    {formatDisplayDate(item.date, i18n.language)}
                  </span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      amountTone(item.amount),
                    )}
                  >
                    {formatMoney(item.amount, currencyFor(item))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("transactionsTable.details.deleteTitle", {
                defaultValue: "Delete this transaction?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("transactionsTable.details.deleteDescription", {
                payee,
                defaultValue:
                  "The transaction with {{payee}} will be removed. This cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDelete(false);
                onDelete(transaction);
              }}
            >
              {t("management.actions.delete", { defaultValue: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

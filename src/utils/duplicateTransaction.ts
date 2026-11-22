import type { ScheduledTransaction, Transaction } from "@/types/dataProvider";

/**
 * The record "Duplicate" adds: the same transaction without its id, its
 * schedule link or projection flags, and with "(Copy)" added to the notes so
 * the two are easy to tell apart. Shared by the row menu and the details
 * panel.
 */
export function duplicateTransactionPayload(
  transaction: Transaction,
): Omit<Transaction, "id" | "created_at"> {
  const { id: _id, created_at: _createdAt, ...rest } = transaction;
  return {
    ...rest,
    remarks: `${transaction.remarks ?? ""} (Copy)`.trim(),
    recurrence_id: undefined,
    is_scheduled_origin: undefined,
    is_projected: undefined,
    recurrence_frequency: undefined,
    recurrence_end_date: undefined,
  };
}

/**
 * The schedule "Duplicate" adds on the Upcoming bills screen: the same payee,
 * amount, account, category, interval, dates and notes, without its id. The
 * transfer link is dropped because a link joins exactly two schedules; when
 * the payee is an account, addScheduledTransaction links the copy to a new
 * pair of its own.
 */
export function duplicateScheduledTransactionPayload(
  schedule: ScheduledTransaction,
): Omit<ScheduledTransaction, "id" | "created_at"> {
  const {
    id: _id,
    created_at: _createdAt,
    transfer_id: _transferId,
    ...rest
  } = schedule;
  return rest;
}

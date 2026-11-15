import type { Transaction } from "@/types/dataProvider";

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

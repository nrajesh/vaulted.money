/**
 * Pure maintenance logic shared by the Transactions page buttons and the Local
 * API ("Detect Transfers", "Cleanup Duplicates"). Keeping one implementation
 * means the UI and the API can never disagree about what counts as a transfer
 * or a duplicate.
 */

export interface MaintenanceTransaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  account: string;
  vendor: string;
  category: string;
  transfer_id?: string | null;
  recurrence_id?: string | null;
  created_at?: string;
}

const parseDate = (value: string): Date | null => {
  if (!value) return null;

  // Handle DD/MM/YYYY (common import format issue)
  const ddmmyyyy = value.match(
    new RegExp("^(\\d{1,2})[-./](\\d{1,2})[-./](\\d{4})$"),
  );
  if (ddmmyyyy) {
    return new Date(
      parseInt(ddmmyyyy[3], 10),
      parseInt(ddmmyyyy[2], 10) - 1,
      parseInt(ddmmyyyy[1], 10),
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Finds pairs of transactions that are the two legs of one transfer.
 *
 * Two transactions pair up when they are on different accounts, at most one
 * day apart, and either cancel out exactly in the same currency, or have
 * opposite signs and look like a transfer (swapped account/vendor, both in the
 * "Transfer" category, or both vendors mentioning "transfer"/"xfer").
 * Already-linked transactions are skipped, except import artefacts whose
 * transfer id starts with "split-". Each transaction joins at most one pair.
 */
export function findTransferPairs<T extends MaintenanceTransaction>(
  list: T[],
): [T, T][] {
  const pairs: [T, T][] = [];
  const processedIds = new Set<string>();
  const isLinked = (t: T) =>
    Boolean(t.transfer_id) && !t.transfer_id!.startsWith("split-");

  // Parse every date once and bucket the candidates by calendar day, so each
  // transaction is compared only with those at most one day away. Scanning the
  // whole list per transaction was O(n²) and froze the UI on large ledgers.
  const dayNumbers: (number | null)[] = list.map((t) => {
    const parsed = parseDate(t.date);
    return parsed
      ? Math.round(
          Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) /
            86_400_000,
        )
      : null;
  });
  const indicesByDay = new Map<number, number[]>();
  dayNumbers.forEach((day, index) => {
    if (day === null || isLinked(list[index])) return;
    const bucket = indicesByDay.get(day);
    if (bucket) bucket.push(index);
    else indicesByDay.set(day, [index]);
  });

  for (let i = 0; i < list.length; i++) {
    const t1 = list[i];
    const day1 = dayNumbers[i];
    if (day1 === null || isLinked(t1) || processedIds.has(t1.id)) continue;

    // Allow 1 day difference for timezone offsets or bank processing delays.
    // Candidates are visited in list order so the first match still wins.
    const candidates = [day1 - 1, day1, day1 + 1]
      .flatMap((day) => indicesByDay.get(day) ?? [])
      .filter((index) => index > i)
      .sort((a, b) => a - b);

    for (const j of candidates) {
      const t2 = list[j];
      if (processedIds.has(t2.id)) continue;
      if (t1.account === t2.account) continue;

      // Strict match: same currency, amounts cancel out
      const isStrictMatch =
        t1.currency === t2.currency && Math.abs(t1.amount + t2.amount) <= 0.01;

      // Heuristic match: cross-currency or loosely described transfers
      const cat1 = (t1.category || "").toLowerCase();
      const cat2 = (t2.category || "").toLowerCase();
      const isTransferCat = cat1 === "transfer" && cat2 === "transfer";
      const isOppositeSign = t1.amount * t2.amount < 0;

      const t1Acc = (t1.account || "").trim().toLowerCase();
      const t1Vend = (t1.vendor || "").trim().toLowerCase();
      const t2Acc = (t2.account || "").trim().toLowerCase();
      const t2Vend = (t2.vendor || "").trim().toLowerCase();
      const isSwapped = t1Acc === t2Vend && t2Acc === t1Vend;
      const hasTransferKeyword =
        (t1Vend.includes("transfer") || t1Vend.includes("xfer")) &&
        (t2Vend.includes("transfer") || t2Vend.includes("xfer"));

      const shouldLink =
        isStrictMatch ||
        (isOppositeSign && (isSwapped || isTransferCat || hasTransferKeyword));

      if (shouldLink) {
        pairs.push([t1, t2]);
        processedIds.add(t1.id);
        processedIds.add(t2.id);
        break;
      }
    }
  }
  return pairs;
}

/**
 * Ids of duplicate instances generated from recurring schedules: transactions
 * with the same recurrence id on the same day. The oldest (by created_at) is
 * kept; every later copy is returned for deletion.
 */
export function findDuplicateRecurringInstances(
  transactions: MaintenanceTransaction[],
): string[] {
  const duplicates: string[] = [];
  const seen = new Set<string>();
  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(a.created_at || 0).getTime() -
      new Date(b.created_at || 0).getTime(),
  );
  for (const t of sorted) {
    if (!t.recurrence_id) continue;
    const key = `${t.recurrence_id}|${t.date.substring(0, 10)}`;
    if (seen.has(key)) duplicates.push(t.id);
    else seen.add(key);
  }
  return duplicates;
}

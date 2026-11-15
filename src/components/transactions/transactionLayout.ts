/**
 * How the Transactions screen arranges itself for the width it has.
 *
 * - "stacked": a single list of cards (phones, iPhone Duo folded).
 * - "split":   the card list beside a details panel for the selected
 *              transaction (iPhone Duo unfolded, tablets, narrow windows).
 * - "table":   the full table with every column (wide windows).
 *
 * Decided by the width of the transactions area, never by device or
 * orientation, so it is right on iPad, Split View and resizable windows too.
 * Between SPLIT_MIN_WIDTH and TABLE_DEFAULT_WIDTH the split is the default;
 * from TABLE_DEFAULT_WIDTH up the table is, and the person can switch between
 * the two whenever both fit.
 */
export type TransactionLayout = "stacked" | "split" | "table";

/** Two phone-width columns fit from here (about two 360px panes). */
export const SPLIT_MIN_WIDTH = 720;
/** Below this the table's seven columns get cramped, so split is the default. */
export const TABLE_DEFAULT_WIDTH = 1024;

export type TransactionLayoutPreference = "split" | "table" | null;

export function pickTransactionLayout(
  width: number,
  preference: TransactionLayoutPreference,
): TransactionLayout {
  // Not measured yet (first render, or no ResizeObserver): keep the
  // long-standing responsive table/card behaviour.
  if (width <= 0) return "table";
  if (width < SPLIT_MIN_WIDTH) return "stacked";
  if (preference) return preference;
  return width < TABLE_DEFAULT_WIDTH ? "split" : "table";
}

const PREFERENCE_KEY = "transactions.layout";

export function readLayoutPreference(): TransactionLayoutPreference {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEY);
    return stored === "split" || stored === "table" ? stored : null;
  } catch {
    return null;
  }
}

export function storeLayoutPreference(value: "split" | "table"): void {
  try {
    localStorage.setItem(PREFERENCE_KEY, value);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this visit.
  }
}

/**
 * The transaction the details panel opens on when nothing is selected: the
 * first card of the list (newest date first, upcoming scheduled ones
 * included), so the panel always matches a row the person can see.
 */
export function firstListedTransaction<T extends { date: string }>(
  transactions: T[],
): T | null {
  return transactions.reduce<T | null>(
    (first, item) => (!first || item.date > first.date ? item : first),
    null,
  );
}

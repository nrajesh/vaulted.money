import { parseSearchQuery } from "@/utils/searchParser";
import { normalizeForMatch } from "@/utils/fuzzyMatch";
import { slugify } from "@/lib/utils";
import type { Payee } from "@/components/dialogs/AddEditPayeeDialog";

/**
 * Applying a search to data. Understanding the query is `parseSearchQuery`'s
 * job and happens in one place; these helpers only apply what it found.
 */

/** True when every word of `text` appears in one of the fields (any case or accent). */
export const matchesSearchText = (
  fields: (string | null | undefined)[],
  text: string,
): boolean => {
  const terms = normalizeForMatch(text).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeForMatch(fields.filter(Boolean).join(" "));
  return terms.every((term) => haystack.includes(term));
};

interface SearchableTransaction {
  vendor: string;
  category: string;
  sub_category?: string | null;
  account: string;
  remarks?: string | null;
}

/** The text part of a transaction search: vendor, category, account, remarks. */
export const matchesTransactionText = (
  transaction: SearchableTransaction,
  text: string,
): boolean =>
  matchesSearchText(
    [
      transaction.vendor,
      transaction.category,
      transaction.sub_category,
      transaction.account,
      transaction.remarks,
    ],
    text,
  );

/**
 * Search for the accounts list, read by the same parser as everywhere else:
 * "savings" or a name picks accounts, "negative" or "positive" the sign of the
 * balance, "over 1000" / "under 50" / "between 100 and 500" the size of it, and
 * whatever is left is matched against name, currency and remarks.
 */
export const filterAccounts = (accounts: Payee[], query: string): Payee[] => {
  if (!query.trim()) return accounts;

  const parsed = parseSearchQuery(query, {
    accounts: accounts.map((account) => ({
      name: account.name,
      slug: slugify(account.name),
      type: account.type,
    })),
    categories: [],
    subCategories: [],
    vendors: [],
  });
  const chosen = parsed.selectedAccounts;

  return accounts.filter((account) => {
    const balance = account.running_balance ?? 0;

    // An empty list means "all accounts"; "__no_match__" matches nothing.
    if (chosen && chosen.length > 0 && !chosen.includes(slugify(account.name)))
      return false;

    if (parsed.transactionType === "expense" && balance >= 0) return false;
    if (parsed.transactionType === "income" && balance <= 0) return false;
    if (parsed.minAmount !== undefined && Math.abs(balance) < parsed.minAmount)
      return false;
    if (parsed.maxAmount !== undefined && Math.abs(balance) > parsed.maxAmount)
      return false;

    return matchesSearchText(
      [account.name, account.currency, account.remarks],
      parsed.searchTerm,
    );
  });
};

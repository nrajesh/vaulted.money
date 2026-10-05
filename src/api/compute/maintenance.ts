/**
 * Pure helpers for the maintenance endpoints (duplicate suggestions,
 * categorize-from-history). Kept free of I/O so they are easy to test.
 */

/** Lower-cases, strips accents/punctuation and collapses whitespace. */
export const normalizeName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export interface NamedItem {
  id: string;
  name: string;
}

/**
 * Groups items whose normalised names are identical ("Starbucks", "starbucks ",
 * "STARBUCKS."). Only groups with two or more members are returned. The
 * `suggested_target` is the member with the shortest, then alphabetically
 * first, name, which is a sensible default "keep this one" for a merge.
 */
export function groupSimilarNames<T extends NamedItem>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()]
    .filter((members) => members.length > 1)
    .map((members) => {
      const sorted = [...members].sort(
        (a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name),
      );
      return {
        suggested_target: sorted[0].name,
        names: sorted.map((m) => m.name),
        items: sorted,
      };
    })
    .sort((a, b) => a.suggested_target.localeCompare(b.suggested_target));
}

export interface HistoricalTransaction {
  date: string;
  vendor: string;
  category: string;
  sub_category?: string | null;
}

export const isUncategorized = (t: { category?: string | null }) =>
  !t.category ||
  t.category.trim() === "" ||
  t.category.toLowerCase() === "uncategorized";

/**
 * The category most recently used for `vendor`, or null. Same rule as the
 * Transactions page's "Categorize Missing" (history first, AI second).
 */
export function historicalMapping(
  vendor: string,
  newestFirst: HistoricalTransaction[],
): { categoryName: string; subCategoryName: string } | null {
  if (!vendor.trim()) return null;
  const match = newestFirst.find(
    (t) =>
      t.vendor?.toLowerCase() === vendor.toLowerCase() && !isUncategorized(t),
  );
  return match
    ? {
        categoryName: match.category,
        subCategoryName: match.sub_category || "",
      }
    : null;
}

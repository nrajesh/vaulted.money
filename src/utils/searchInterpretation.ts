import type { ParsedFilterState } from "@/utils/searchParser";

/**
 * One thing the search parser understood in what the user typed, in a form the
 * UI can show as a suggestion. Nothing here is applied until the user picks it.
 */
export type InterpretationPart =
  | { kind: "date"; from: Date; to?: Date }
  | { kind: "allTime" }
  | { kind: "amount"; min?: number; max?: number }
  | { kind: "type"; type: "income" | "expense" }
  | { kind: "limit"; count: number; order: "largest" | "smallest" }
  | {
      kind: "entity";
      entity: "account" | "category" | "subCategory" | "vendor";
      name: string;
      slug: string;
      /** What the user typed, when it only matched despite a typo. */
      typed?: string;
    }
  /** Several accounts at once, e.g. every "checking" account. */
  | { kind: "accounts"; count: number }
  | { kind: "text"; text: string };

interface NamedEntity {
  name: string;
  slug: string;
}

export interface InterpretationContext {
  accounts: NamedEntity[];
  categories: NamedEntity[];
  subCategories: NamedEntity[];
  vendors: NamedEntity[];
}

export interface SearchInterpretation {
  parts: InterpretationPart[];
  /** What to hand to the filter bar when the user accepts the suggestion. */
  update: Partial<ParsedFilterState>;
}

/** More accounts than this are summarised as a count instead of listed. */
const MAX_LISTED_ACCOUNTS = 3;

/** The parser's marker for "the user asked for accounts that don't exist". */
const NO_MATCH = "__no_match__";

/**
 * Turns a parse result into the suggestion shown to the user. Returns null
 * when nothing structured was found, so plain text searches get no suggestion.
 */
export const buildInterpretation = (
  parsed: ParsedFilterState,
  context: InterpretationContext,
): SearchInterpretation | null => {
  const parts: InterpretationPart[] = [];
  const update: Partial<ParsedFilterState> = {};

  if (parsed.isAllTime) {
    parts.push({ kind: "allTime" });
    update.isAllTime = true;
  } else if (parsed.dateRange?.from) {
    parts.push({
      kind: "date",
      from: parsed.dateRange.from,
      to: parsed.dateRange.to,
    });
    update.dateRange = parsed.dateRange;
  }

  if (parsed.minAmount !== undefined || parsed.maxAmount !== undefined) {
    parts.push({
      kind: "amount",
      min: parsed.minAmount,
      max: parsed.maxAmount,
    });
    update.minAmount = parsed.minAmount;
    update.maxAmount = parsed.maxAmount;
  }

  if (parsed.transactionType) {
    parts.push({ kind: "type", type: parsed.transactionType });
    update.transactionType = parsed.transactionType;
  }

  if (parsed.limit !== undefined) {
    parts.push({
      kind: "limit",
      count: parsed.limit,
      order: parsed.sortOrder ?? "largest",
    });
    update.limit = parsed.limit;
    update.sortOrder = parsed.sortOrder;
  }

  const typedFor = (entity: string, slug: string) =>
    parsed.fuzzyMatches?.find((m) => m.kind === entity && m.slug === slug)
      ?.typed;

  const addEntities = (
    entity: "account" | "category" | "subCategory" | "vendor",
    slugs: string[],
    known: NamedEntity[],
  ) => {
    const matched = slugs.filter((slug) => slug !== NO_MATCH);
    // "checking" can match a dozen accounts; one badge says so without
    // filling the suggestion with names.
    if (entity === "account" && matched.length > MAX_LISTED_ACCOUNTS) {
      parts.push({ kind: "accounts", count: matched.length });
      return matched.filter((slug) => known.some((k) => k.slug === slug));
    }
    matched.forEach((slug) => {
      const name = known.find((k) => k.slug === slug)?.name;
      if (name) {
        parts.push({
          kind: "entity",
          entity,
          name,
          slug,
          typed: typedFor(entity, slug),
        });
      }
    });
    return matched.filter((slug) => known.some((k) => k.slug === slug));
  };

  const accounts = addEntities(
    "account",
    parsed.selectedAccounts ?? [],
    context.accounts,
  );
  if (accounts.length > 0) update.selectedAccounts = accounts;

  const categories = addEntities(
    "category",
    parsed.selectedCategories,
    context.categories,
  );
  if (categories.length > 0) update.selectedCategories = categories;

  const subCategories = addEntities(
    "subCategory",
    parsed.selectedSubCategories,
    context.subCategories,
  );
  if (subCategories.length > 0) update.selectedSubCategories = subCategories;

  const vendors = addEntities(
    "vendor",
    parsed.selectedVendors,
    context.vendors,
  );
  if (vendors.length > 0) update.selectedVendors = vendors;

  // Nothing structured: leave it to the plain "Search Text" row.
  if (parts.length === 0) return null;

  // Words the parser did not understand still narrow the results as text.
  if (parsed.searchTerm) {
    parts.push({ kind: "text", text: parsed.searchTerm });
  }
  update.searchTerm = parsed.searchTerm;

  return { parts, update };
};

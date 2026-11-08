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

/** One thing the parser understood and what accepting just it would apply. */
export interface InterpretationItem {
  part: InterpretationPart;
  update: Partial<ParsedFilterState>;
}

export interface SearchInterpretation {
  /** Each piece on its own, so the user can accept any one of them. */
  items: InterpretationItem[];
  parts: InterpretationPart[];
  /** What to hand to the filter bar when the user accepts everything. */
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
  const items: InterpretationItem[] = [];
  const add = (part: InterpretationPart, update: Partial<ParsedFilterState>) =>
    items.push({ part, update });

  if (parsed.isAllTime) {
    add({ kind: "allTime" }, { isAllTime: true });
  } else if (parsed.dateRange?.from) {
    add(
      { kind: "date", from: parsed.dateRange.from, to: parsed.dateRange.to },
      { dateRange: parsed.dateRange },
    );
  }

  if (parsed.minAmount !== undefined || parsed.maxAmount !== undefined) {
    add(
      { kind: "amount", min: parsed.minAmount, max: parsed.maxAmount },
      { minAmount: parsed.minAmount, maxAmount: parsed.maxAmount },
    );
  }

  if (parsed.transactionType) {
    add(
      { kind: "type", type: parsed.transactionType },
      { transactionType: parsed.transactionType },
    );
  }

  if (parsed.limit !== undefined) {
    add(
      {
        kind: "limit",
        count: parsed.limit,
        order: parsed.sortOrder ?? "largest",
      },
      { limit: parsed.limit, sortOrder: parsed.sortOrder },
    );
  }

  const typedFor = (entity: string, slug: string) =>
    parsed.fuzzyMatches?.find((m) => m.kind === entity && m.slug === slug)
      ?.typed;

  const addEntities = (
    entity: "account" | "category" | "subCategory" | "vendor",
    slugs: string[],
    known: NamedEntity[],
    field:
      | "selectedAccounts"
      | "selectedCategories"
      | "selectedSubCategories"
      | "selectedVendors",
  ) => {
    const matched = slugs.filter(
      (slug) => slug !== NO_MATCH && known.some((k) => k.slug === slug),
    );
    // "checking" can match a dozen accounts; one badge says so without
    // filling the suggestion with names.
    if (entity === "account" && matched.length > MAX_LISTED_ACCOUNTS) {
      add({ kind: "accounts", count: matched.length }, { [field]: matched });
      return;
    }
    matched.forEach((slug) => {
      const name = known.find((k) => k.slug === slug)!.name;
      add(
        { kind: "entity", entity, name, slug, typed: typedFor(entity, slug) },
        { [field]: [slug] },
      );
    });
  };

  addEntities(
    "account",
    parsed.selectedAccounts ?? [],
    context.accounts,
    "selectedAccounts",
  );
  addEntities(
    "category",
    parsed.selectedCategories,
    context.categories,
    "selectedCategories",
  );
  addEntities(
    "subCategory",
    parsed.selectedSubCategories,
    context.subCategories,
    "selectedSubCategories",
  );
  addEntities(
    "vendor",
    parsed.selectedVendors,
    context.vendors,
    "selectedVendors",
  );

  // Nothing structured: leave it to the plain "Search Text" row.
  if (items.length === 0) return null;

  // Words the parser did not understand still narrow the results as text.
  if (parsed.searchTerm) {
    add(
      { kind: "text", text: parsed.searchTerm },
      { searchTerm: parsed.searchTerm },
    );
  }

  // Accepting everything also clears an earlier text search when there is
  // no leftover text, so the new filters are not combined with a stale one.
  const update: Partial<ParsedFilterState> = { searchTerm: parsed.searchTerm };
  for (const item of items) {
    // Merge entity lists (account, category...) rather than overwrite them.
    for (const [key, value] of Object.entries(item.update)) {
      const existing = (update as Record<string, unknown>)[key];
      (update as Record<string, unknown>)[key] =
        Array.isArray(existing) && Array.isArray(value)
          ? [...existing, ...value]
          : value;
    }
  }

  return { items, parts: items.map((item) => item.part), update };
};

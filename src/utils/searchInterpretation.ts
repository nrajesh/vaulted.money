import {
  isOpenRangeStart,
  parseSearchQuery,
  type ParsedFilterState,
  type ParseOptions,
} from "@/utils/searchParser";
import { slugify } from "@/lib/utils";

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
  accounts: (NamedEntity & { type?: string })[];
  categories: NamedEntity[];
  subCategories: NamedEntity[];
  vendors: NamedEntity[];
}

/**
 * The names a query can refer to, in the form the parser needs. Shared by the
 * search box and the API so both resolve "starbuks" against the same list:
 * names are de-duplicated by slug, vendors that are really accounts are left
 * out, and the result is sorted.
 */
export const buildSearchEntities = (source: {
  accounts: { name: string; type?: string }[];
  categories: { name: string }[];
  subCategories: { name: string }[];
  vendors: { name: string }[];
  /** Vendor names seen on transactions but perhaps not saved yet. */
  extraVendorNames?: string[];
}): InterpretationContext => {
  const unique = <T extends { name: string }>(list: T[]) => {
    const bySlug = new Map<string, T & { slug: string }>();
    for (const item of list) {
      const slug = slugify(item.name);
      if (slug && !bySlug.has(slug)) bySlug.set(slug, { ...item, slug });
    }
    return Array.from(bySlug.values());
  };
  const accountSlugs = new Set(source.accounts.map((a) => slugify(a.name)));
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name);

  return {
    accounts: unique(source.accounts),
    categories: unique(source.categories),
    subCategories: unique(source.subCategories),
    vendors: unique([
      ...source.vendors,
      ...(source.extraVendorNames ?? []).map((name) => ({ name })),
    ])
      .filter((vendor) => !accountSlugs.has(vendor.slug))
      .sort(byName),
  };
};

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
 * What accepting several pieces at once applies. Lists of the same kind
 * (two vendors, two accounts) are joined rather than overwritten.
 */
export const mergeInterpretationUpdates = (
  items: InterpretationItem[],
): Partial<ParsedFilterState> => {
  const merged: Record<string, unknown> = {};
  for (const { update } of items) {
    for (const [key, value] of Object.entries(update)) {
      const existing = merged[key];
      merged[key] =
        Array.isArray(existing) && Array.isArray(value)
          ? [...existing, ...value]
          : value;
    }
  }
  return merged as Partial<ParsedFilterState>;
};

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

  const update = mergeInterpretationUpdates(items);

  return { items, parts: items.map((item) => item.part), update };
};

/**
 * The single entry point for reading a typed query: the search box and the
 * API both call this, so they cannot disagree about what a query means.
 */
export const interpretQuery = (
  query: string,
  entities: InterpretationContext,
  options: ParseOptions = {},
) => {
  const parsed = parseSearchQuery(query, entities, options);
  return { parsed, interpretation: buildInterpretation(parsed, entities) };
};

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** How an interpretation is described to scripts: plain JSON, names not slugs. */
export interface SearchFilterDescription {
  /** Every filter must match; several values of one kind (two vendors) match either. */
  combine: "all";
  date_range: { from: string | null; to: string | null } | null;
  all_time: boolean;
  /** Size of the amount, sign ignored, as in the app. */
  min_amount: number | null;
  max_amount: number | null;
  type: "income" | "expense" | null;
  accounts: string[];
  categories: string[];
  sub_categories: string[];
  vendors: string[];
  /** Words left after everything above was taken out. */
  text: string;
  /** "top 5" / "smallest 3". */
  limit: number | null;
  sort: "largest" | "smallest" | null;
  /** Names that matched despite a typo or a plural, as typed. */
  corrections: {
    kind: "account" | "category" | "sub_category" | "vendor";
    typed: string;
    name: string;
  }[];
}

const KIND_NAMES = {
  account: "account",
  category: "category",
  subCategory: "sub_category",
  vendor: "vendor",
} as const;

/**
 * Describes what a query was understood as, from the same interpretation items
 * the search box shows, so the two always agree.
 */
export const describeInterpretation = (
  query: string,
  entities: InterpretationContext,
  options: ParseOptions = {},
): SearchFilterDescription => {
  const { parsed, interpretation } = interpretQuery(query, entities, options);
  const parts = interpretation?.parts ?? [];
  const description: SearchFilterDescription = {
    combine: "all",
    date_range: null,
    all_time: false,
    min_amount: null,
    max_amount: null,
    type: null,
    accounts: [],
    categories: [],
    sub_categories: [],
    vendors: [],
    text: "",
    limit: null,
    sort: null,
    corrections: [],
  };

  for (const part of parts) {
    switch (part.kind) {
      case "allTime":
        description.all_time = true;
        break;
      case "date":
        description.date_range = {
          // An open start ("before 2019") has no real from date.
          from: isOpenRangeStart(part.from) ? null : isoDay(part.from),
          to: part.to ? isoDay(part.to) : null,
        };
        break;
      case "amount":
        description.min_amount = part.min ?? null;
        description.max_amount = part.max ?? null;
        break;
      case "type":
        description.type = part.type;
        break;
      case "limit":
        description.limit = part.count;
        description.sort = part.order;
        break;
      case "text":
        break; // taken from the parser below, which also covers plain text
      case "accounts":
        // Summarised in the search box; the API lists them all below.
        break;
      case "entity": {
        const list =
          part.entity === "account"
            ? description.accounts
            : part.entity === "category"
              ? description.categories
              : part.entity === "subCategory"
                ? description.sub_categories
                : description.vendors;
        list.push(part.name);
        if (part.typed) {
          description.corrections.push({
            kind: KIND_NAMES[part.entity],
            typed: part.typed,
            name: part.name,
          });
        }
        break;
      }
    }
  }

  description.text = parsed.searchTerm;

  // Accounts picked by type ("savings") can be many; list every name.
  const accountNames = (parsed.selectedAccounts ?? [])
    .map((slug) => entities.accounts.find((a) => a.slug === slug)?.name)
    .filter((name): name is string => Boolean(name));
  description.accounts = Array.from(
    new Set([...description.accounts, ...accountNames]),
  );
  return description;
};

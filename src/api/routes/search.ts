import { badRequest, dateParam, flag, json } from "../http";
import type { RouteDef } from "../router";
import {
  buildSearchEntities,
  describeInterpretation,
  type SearchFilterDescription,
} from "@/utils/searchInterpretation";
import { loadAccountResources, requireLedger } from "./shared";

/** A filter the transactions endpoint cannot express, and why. */
interface Unmapped {
  filter: string;
  reason: string;
}

/**
 * The query parameters of `GET /ledgers/:id/transactions` that give the same
 * result as `filters`, where that endpoint can express it. Its `min_amount` /
 * `max_amount` are signed, while the interpretation (like the app) speaks of
 * the size of an amount, so with a known type they are converted; without one
 * a size cannot be written as a signed range.
 */
const toTransactionParams = (filters: SearchFilterDescription) => {
  const params: Record<string, string | number> = {};
  const unmapped: Unmapped[] = [];

  if (filters.date_range?.from) params.from = filters.date_range.from;
  if (filters.date_range?.to) params.to = filters.date_range.to;

  const single = (
    name: "account" | "vendor" | "category" | "sub_category",
    values: string[],
  ) => {
    if (values.length === 1) params[name] = values[0];
    else if (values.length > 1) {
      unmapped.push({
        filter: `${name}s`,
        reason: `The transactions endpoint takes one ${name}; ${values.length} matched (${values.join(", ")}). Call it once per value.`,
      });
    }
  };
  single("account", filters.accounts);
  single("vendor", filters.vendors);
  single("category", filters.categories);
  single("sub_category", filters.sub_categories);

  if (filters.type) params.type = filters.type;
  if (filters.text) params.search = filters.text;

  if (filters.min_amount !== null || filters.max_amount !== null) {
    if (filters.type === "expense") {
      if (filters.max_amount !== null) params.min_amount = -filters.max_amount;
      if (filters.min_amount !== null) params.max_amount = -filters.min_amount;
    } else if (filters.type === "income") {
      if (filters.min_amount !== null) params.min_amount = filters.min_amount;
      if (filters.max_amount !== null) params.max_amount = filters.max_amount;
    } else {
      unmapped.push({
        filter: "amount",
        reason:
          "The app compares the size of an amount, but min_amount/max_amount are signed. Add an income or expense type to the search, or filter the result yourself.",
      });
    }
  }
  if (filters.limit !== null) {
    unmapped.push({
      filter: "limit",
      reason: `"top ${filters.limit}" needs sorting by amount, which the transactions endpoint does not do. Sort the result yourself.`,
    });
  }
  return { params, unmapped };
};

export const searchRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/search/interpret",
    summary:
      "Interpret a natural-language search phrase into structured filters, as the search box does (changes nothing)",
    query: {
      q: 'The phrase to read, e.g. "starbuks over 20 last month" (required)',
      today:
        "YYYY-MM-DD to treat as today, for repeatable results (default: today)",
      typos:
        "false to match names exactly, with no typo correction (default true)",
    },
    handler: async ({ params, query, services }) => {
      await requireLedger(services, params.ledgerId);
      const q = (query.q ?? "").trim();
      if (!q) throw badRequest('Query parameter "q" is required');
      const today = dateParam("today", query.today);

      const [accounts, vendors, categories, subCategories] = await Promise.all([
        loadAccountResources(services, params.ledgerId),
        services.dataProvider.getAllVendors(params.ledgerId),
        services.dataProvider.getUserCategories(params.ledgerId),
        services.dataProvider.getSubCategories(params.ledgerId),
      ]);
      const entities = buildSearchEntities({
        accounts,
        categories,
        subCategories,
        vendors: vendors.filter((vendor) => !vendor.is_account),
      });

      const filters = describeInterpretation(q, entities, {
        fuzzy: query.typos === undefined ? true : flag(query.typos),
        now: today ? new Date(`${today}T12:00:00`) : undefined,
      });
      return json({ query: q, filters, ...toTransactionParams(filters) });
    },
  },
];

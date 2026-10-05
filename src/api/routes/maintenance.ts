import { z } from "zod";
import type { Transaction } from "@/types/dataProvider";
import { readAiApiKeyFromStorage } from "@/constants/aiApiKeyStorage";
import { categorizeVendorsBulk } from "@/hooks/useAutoCategorize";
import {
  findDuplicateRecurringInstances,
  findTransferPairs,
} from "@/utils/transactionMaintenance";
import {
  ApiError,
  badRequest,
  isoDateSchema,
  json,
  notFound,
  parse,
} from "../http";
import { round2, dayOf, todayKey } from "../compute/shared";
import {
  groupSimilarNames,
  historicalMapping,
  isUncategorized,
} from "../compute/maintenance";
import type { RouteContext, RouteDef } from "../router";
import { accountBalance, loadAccountResources, requireLedger } from "./shared";

/**
 * Maintenance operations: the API equivalents of the buttons on the
 * Transactions, Accounts, Categories and Vendors pages. Every operation that
 * changes data supports `dry_run` (report what would happen), and deletions
 * additionally require `confirm_delete: true`.
 */

const dryRunSchema = z.object({ dry_run: z.boolean().default(false) });
const deleteSchema = dryRunSchema.extend({
  confirm_delete: z.boolean().default(false),
});
const cleanupSchema = deleteSchema.extend({
  /** Restrict the cleanup to these ids (each must be currently unused). */
  ids: z.array(z.string()).optional(),
});
const mergeSchema = z.object({
  target: z.string().trim().min(1),
  sources: z.array(z.string().trim().min(1)).min(1),
});
const reconcileSchema = dryRunSchema.extend({
  adjustments: z
    .array(
      z.object({
        /** Account name or id. */
        account: z.string().trim().min(1),
        /** The real balance, e.g. from your bank statement. */
        actual_balance: z.number().finite(),
      }),
    )
    .min(1),
  /** Balance "as of" this date, and the date of the adjustment. Default: today. */
  date: isoDateSchema.optional(),
});
const categorizeSchema = dryRunSchema.extend({
  /**
   * Also ask the default AI provider about vendors with no history. Off by
   * default: it sends vendor names (never amounts) to the provider.
   */
  use_ai: z.boolean().default(false),
});

const requireConfirmation = (confirmed: boolean) => {
  if (!confirmed) {
    throw badRequest(
      'This deletes data. Preview with "dry_run": true, then repeat with "confirm_delete": true.',
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Transactions                                                               */
/* -------------------------------------------------------------------------- */

async function detectTransfers(ctx: RouteContext) {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const { dry_run } = parse(dryRunSchema, ctx.body);
  const dp = ctx.services.dataProvider;
  const transactions = await dp.getTransactions(ctx.params.ledgerId);
  const pairs = findTransferPairs(transactions);
  if (!dry_run) {
    for (const [a, b] of pairs) await dp.linkTransactionsAsTransfer(a.id, b.id);
  }
  return json({
    dry_run,
    pairs_found: pairs.length,
    linked: dry_run ? 0 : pairs.length,
    pairs: pairs.map(([a, b]) => ({
      transaction_ids: [a.id, b.id],
      accounts: [a.account, b.account],
      amounts: [a.amount, b.amount],
      currencies: [a.currency, b.currency],
      dates: [dayOf(a.date), dayOf(b.date)],
    })),
  });
}

async function cleanupDuplicateTransactions(ctx: RouteContext) {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const { dry_run, confirm_delete } = parse(deleteSchema, ctx.body);
  const dp = ctx.services.dataProvider;
  const transactions = await dp.getTransactions(ctx.params.ledgerId);
  const ids = findDuplicateRecurringInstances(transactions);
  if (!dry_run && ids.length > 0) {
    requireConfirmation(confirm_delete);
    await dp.deleteMultipleTransactions(ids);
  }
  return json({
    dry_run,
    duplicates_found: ids.length,
    deleted: dry_run ? 0 : ids.length,
    transaction_ids: ids,
  });
}

async function categorizeMissing(ctx: RouteContext) {
  const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
  const { dry_run, use_ai } = parse(categorizeSchema, ctx.body);
  const dp = ctx.services.dataProvider;
  const [transactions, categories, subCategories] = await Promise.all([
    dp.getTransactions(ledger.id),
    dp.getUserCategories(ledger.id),
    dp.getSubCategories(ledger.id),
  ]);

  const uncategorized = transactions.filter(isUncategorized);
  const vendors = [
    ...new Set(uncategorized.map((t) => t.vendor?.trim()).filter(Boolean)),
  ] as string[];

  // 1. History: reuse the category last used with the same vendor.
  const newestFirst = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const mapping: Record<
    string,
    { categoryName: string; subCategoryName: string; source: "history" | "ai" }
  > = {};
  const unknown: string[] = [];
  for (const vendor of vendors) {
    const hit = historicalMapping(vendor, newestFirst);
    if (hit) mapping[vendor] = { ...hit, source: "history" };
    else unknown.push(vendor);
  }

  // 2. AI (opt-in) for vendors with no history.
  if (use_ai && unknown.length > 0) {
    const providers = await dp.getAIProviders();
    const provider = providers.find((p) => p.isDefault);
    const apiKey = provider ? readAiApiKeyFromStorage(provider.id) : "";
    if (!provider || !apiKey) {
      throw new ApiError(
        400,
        "ai_not_configured",
        "No default AI provider with an API key is configured. Set one via /ai-providers, or call with use_ai=false.",
      );
    }
    try {
      const ai = await categorizeVendorsBulk(
        provider,
        apiKey,
        unknown,
        categories,
        subCategories,
      );
      for (const [vendor, result] of Object.entries(ai)) {
        if (result?.categoryName) {
          mapping[vendor] = {
            categoryName: result.categoryName,
            subCategoryName: result.subCategoryName || "",
            source: "ai",
          };
        }
      }
    } catch (error) {
      throw new ApiError(
        502,
        "ai_failed",
        error instanceof Error ? error.message : "AI categorization failed",
      );
    }
  }

  const changes: {
    transaction_id: string;
    vendor: string;
    category: string;
    sub_category: string | null;
    source: "history" | "ai";
  }[] = [];
  const updated: Transaction[] = [];
  for (const t of uncategorized) {
    const key = Object.keys(mapping).find(
      (k) => k.toLowerCase() === t.vendor?.trim().toLowerCase(),
    );
    if (!key) continue;
    const m = mapping[key];
    changes.push({
      transaction_id: t.id,
      vendor: t.vendor,
      category: m.categoryName,
      sub_category: m.subCategoryName || t.sub_category || null,
      source: m.source,
    });
    updated.push({
      ...t,
      category: m.categoryName,
      sub_category: m.subCategoryName || t.sub_category,
    });
  }

  if (!dry_run) {
    for (const t of updated) {
      const catId = await dp.ensureCategoryExists(t.category, ledger.id);
      if (t.sub_category && catId) {
        await dp.ensureSubCategoryExists(t.sub_category, catId, ledger.id);
      }
      await dp.updateTransaction(t);
    }
  }

  return json({
    dry_run,
    uncategorized_found: uncategorized.length,
    categorized: dry_run ? 0 : changes.length,
    matched: changes.length,
    still_uncategorized: uncategorized.length - changes.length,
    sources: {
      history: changes.filter((c) => c.source === "history").length,
      ai: changes.filter((c) => c.source === "ai").length,
    },
    changes,
  });
}

/* -------------------------------------------------------------------------- */
/* Accounts                                                                   */
/* -------------------------------------------------------------------------- */

async function reconcileAccounts(ctx: RouteContext) {
  const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
  const input = parse(reconcileSchema, ctx.body);
  const dp = ctx.services.dataProvider;
  const [accounts, transactions] = await Promise.all([
    loadAccountResources(ctx.services, ledger.id),
    dp.getTransactions(ledger.id),
  ]);

  const asOf = input.date ? new Date(input.date) : new Date();
  const results = [];
  for (const adj of input.adjustments) {
    const account = accounts.find(
      (a) => a.id === adj.account || a.name === adj.account,
    );
    if (!account) throw notFound(`Account "${adj.account}"`);

    // "System balance" is what the app currently believes, as of the date.
    const asOfKey = todayKey(asOf);
    const system = accountBalance(
      account,
      transactions.filter((t) => dayOf(t.date) <= asOfKey),
      asOf,
    );
    const difference = round2(adj.actual_balance - system);
    let transactionId: string | null = null;

    if (Math.abs(difference) >= 0.005 && !input.dry_run) {
      // Same adjustment the Reconcile dialog creates.
      const created = await dp.addTransaction({
        user_id: ledger.id,
        date: asOf.toISOString(),
        account: account.name,
        vendor: "Balance Adjustment",
        category: "Adjustment",
        amount: difference,
        remarks: `Reconciliation Adjustment to match balance ${adj.actual_balance}`,
        currency: account.currency || ledger.currency,
      });
      transactionId = created.id;
    }
    results.push({
      account: account.name,
      currency: account.currency,
      system_balance: system,
      actual_balance: adj.actual_balance,
      difference,
      adjusted: transactionId !== null,
      transaction_id: transactionId,
    });
  }
  return json({
    dry_run: input.dry_run,
    adjusted: results.filter((r) => r.adjusted).length,
    results,
  });
}

async function mergeAccounts(ctx: RouteContext) {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const { target, sources } = parse(mergeSchema, ctx.body);
  if (sources.includes(target)) {
    throw badRequest("The target cannot also be a source");
  }
  const accounts = await loadAccountResources(
    ctx.services,
    ctx.params.ledgerId,
  );
  const known = new Set(accounts.map((a) => a.name));
  const missing = [target, ...sources].filter((n) => !known.has(n));
  if (missing.length > 0) {
    throw notFound(`Account(s) ${missing.map((n) => `"${n}"`).join(", ")}`);
  }
  await ctx.services.dataProvider.mergePayees(
    target,
    sources,
    ctx.params.ledgerId,
  );
  return { status: 204 };
}

/* -------------------------------------------------------------------------- */
/* Vendors and categories: duplicates and unused                              */
/* -------------------------------------------------------------------------- */

type EntityKind = "vendor" | "category";

/**
 * Entities nothing refers to. Stricter than the UI's cleanup: the UI only
 * checks transactions and would silently cascade-delete recurring schedules
 * and budgets that use the entity; the API leaves those entities alone.
 */
async function findUnused(ctx: RouteContext, kind: EntityKind) {
  const ledgerId = ctx.params.ledgerId;
  const dp = ctx.services.dataProvider;
  const [transactions, scheduled, budgets] = await Promise.all([
    dp.getTransactions(ledgerId),
    dp.getScheduledTransactions(ledgerId),
    dp.getBudgetsWithSpending(ledgerId),
  ]);

  if (kind === "vendor") {
    const vendors = (await dp.getAllVendors(ledgerId)).filter(
      (v) => !v.is_account,
    );
    const used = new Set<string>([
      ...transactions.map((t) => t.vendor),
      ...scheduled.map((s) => s.vendor),
      ...budgets
        .filter((b) => b.budget_scope === "vendor")
        .map((b) => b.budget_scope_name ?? ""),
    ]);
    return vendors
      .filter((v) => !used.has(v.name))
      .map((v) => ({ id: v.id, name: v.name }));
  }

  const categories = await dp.getUserCategories(ledgerId);
  const used = new Set<string>([
    ...transactions.map((t) => t.category),
    ...scheduled.map((s) => s.category),
  ]);
  const budgetCategoryIds = new Set(budgets.map((b) => b.category_id));
  return categories
    .filter(
      (c) =>
        !used.has(c.name) &&
        !budgetCategoryIds.has(c.id) &&
        c.name !== "Others" &&
        c.name !== "Transfer",
    )
    .map((c) => ({ id: c.id, name: c.name }));
}

async function cleanupUnused(ctx: RouteContext, kind: EntityKind) {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const { dry_run, confirm_delete, ids } = parse(cleanupSchema, ctx.body);
  const unused = await findUnused(ctx, kind);
  const unusedIds = new Set(unused.map((u) => u.id));
  const targets = ids
    ? ids.map((id) => {
        if (!unusedIds.has(id)) {
          throw badRequest(
            `"${id}" is not an unused ${kind}; refusing to delete it`,
          );
        }
        return unused.find((u) => u.id === id)!;
      })
    : unused;

  if (!dry_run && targets.length > 0) {
    requireConfirmation(confirm_delete);
    const dp = ctx.services.dataProvider;
    for (const target of targets) {
      if (kind === "vendor") await dp.deletePayee(target.id);
      else await dp.deleteCategory(target.id);
    }
  }
  return json({
    dry_run,
    unused_found: unused.length,
    deleted: dry_run ? 0 : targets.length,
    items: targets,
  });
}

const duplicatesRoute = (
  path: string,
  summary: string,
  load: (ctx: RouteContext) => Promise<{ id: string; name: string }[]>,
): RouteDef => ({
  method: "GET",
  path,
  summary,
  handler: async (ctx) => {
    await requireLedger(ctx.services, ctx.params.ledgerId);
    const groups = groupSimilarNames(await load(ctx));
    return json({ groups_found: groups.length, data: groups });
  },
});

/** Everything in this file, registered by routes/index.ts. */
export const maintenanceRoutes: RouteDef[] = [
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions/detect-transfers",
    summary:
      'Find and link transfer pairs ("Detect Transfers"). Body: {dry_run?}',
    body: dryRunSchema,
    handler: detectTransfers,
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions/cleanup-duplicates",
    summary:
      'Delete duplicate recurring-schedule transactions ("Cleanup Duplicates"). Body: {dry_run?, confirm_delete?}',
    body: deleteSchema,
    handler: cleanupDuplicateTransactions,
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions/categorize-missing",
    summary:
      'Categorize uncategorized transactions from history, optionally with AI ("Categorize Missing"). Body: {dry_run?, use_ai?}',
    body: categorizeSchema,
    handler: categorizeMissing,
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/accounts/reconcile",
    summary:
      'Create balance-adjustment transactions so accounts match real balances ("Reconcile Balance"). Body: {adjustments:[{account, actual_balance}], date?, dry_run?}',
    body: reconcileSchema,
    handler: reconcileAccounts,
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/accounts/merge",
    summary:
      'Merge accounts into a target account ("De-duplicate"). Body: {target, sources}',
    body: mergeSchema,
    handler: mergeAccounts,
  },
  duplicatesRoute(
    "/ledgers/:ledgerId/accounts/duplicates",
    "Suggest accounts that look like duplicates (same name ignoring case/punctuation)",
    async (ctx) =>
      (await loadAccountResources(ctx.services, ctx.params.ledgerId)).map(
        (a) => ({
          id: a.id,
          name: a.name,
        }),
      ),
  ),
  duplicatesRoute(
    "/ledgers/:ledgerId/vendors/duplicates",
    "Suggest vendors that look like duplicates",
    async (ctx) =>
      (await ctx.services.dataProvider.getAllVendors(ctx.params.ledgerId))
        .filter((v) => !v.is_account)
        .map((v) => ({ id: v.id, name: v.name })),
  ),
  duplicatesRoute(
    "/ledgers/:ledgerId/categories/duplicates",
    "Suggest categories that look like duplicates",
    async (ctx) =>
      (
        await ctx.services.dataProvider.getUserCategories(ctx.params.ledgerId)
      ).map((c) => ({ id: c.id, name: c.name })),
  ),
  {
    method: "GET",
    path: "/ledgers/:ledgerId/vendors/unused",
    summary: "List vendors nothing refers to",
    handler: async (ctx) => {
      await requireLedger(ctx.services, ctx.params.ledgerId);
      const data = await findUnused(ctx, "vendor");
      return json({ unused_found: data.length, data });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/vendors/cleanup",
    summary:
      'Delete unused vendors ("Cleanup Unused"). Body: {ids?, dry_run?, confirm_delete?}',
    body: cleanupSchema,
    handler: (ctx) => cleanupUnused(ctx, "vendor"),
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/categories/unused",
    summary: "List categories nothing refers to",
    handler: async (ctx) => {
      await requireLedger(ctx.services, ctx.params.ledgerId);
      const data = await findUnused(ctx, "category");
      return json({ unused_found: data.length, data });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/categories/cleanup",
    summary:
      'Delete unused categories ("Cleanup Unused"). Body: {ids?, dry_run?, confirm_delete?}',
    body: cleanupSchema,
    handler: (ctx) => cleanupUnused(ctx, "category"),
  },
];

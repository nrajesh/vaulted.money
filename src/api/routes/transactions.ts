import { z } from "zod";
import { db } from "@/lib/dexieDB";
import type { Transaction } from "@/types/dataProvider";
import {
  badRequest,
  flag,
  isoDateSchema,
  json,
  noContent,
  notFound,
  numberParam,
  parse,
} from "../http";
import { dayOf, TRANSFER_CATEGORY } from "../compute/shared";
import type { RouteContext, RouteDef } from "../router";
import {
  getTransactionInLedger,
  loadAccountResources,
  requireLedger,
} from "./shared";

const MAX_PAGE = 1000;

const txSchema = z.object({
  date: isoDateSchema,
  amount: z.number().finite(),
  account: z.string().trim().min(1),
  vendor: z.string().trim().min(1),
  category: z.string().trim().min(1),
  sub_category: z.string().trim().nullish(),
  remarks: z.string().nullish(),
  currency: z.string().trim().min(1).optional(),
});
const patchSchema = txSchema.partial();
const bulkSchema = z.object({
  transactions: z.array(txSchema).min(1).max(MAX_PAGE),
});
const transferSchema = z.object({
  from_account: z.string().trim().min(1),
  to_account: z.string().trim().min(1),
  amount: z.number().finite().positive(),
  /** Amount credited to the destination when the two currencies differ. */
  to_amount: z.number().finite().positive().optional(),
  date: isoDateSchema,
  remarks: z.string().nullish(),
});

/**
 * Creates a transaction through the DataProvider (which auto-creates missing
 * categories, vendors and accounts, exactly as the UI does). The currency
 * defaults to the account's, then the ledger's.
 */
async function createTransaction(
  ctx: RouteContext,
  input: z.output<typeof txSchema>,
  ledgerCurrency: string,
) {
  const accounts = await loadAccountResources(
    ctx.services,
    ctx.params.ledgerId,
  );
  const currency =
    input.currency ??
    accounts.find((a) => a.name === input.account)?.currency ??
    ledgerCurrency;
  return ctx.services.dataProvider.addTransaction({
    user_id: ctx.params.ledgerId,
    date: input.date,
    amount: input.amount,
    currency,
    account: input.account,
    vendor: input.vendor,
    category: input.category,
    sub_category: input.sub_category ?? null,
    remarks: input.remarks ?? null,
  });
}

export function filterTransactions(
  all: Transaction[],
  q: Record<string, string>,
) {
  const min = numberParam("min_amount", q.min_amount);
  const max = numberParam("max_amount", q.max_amount);
  const search = q.search?.toLowerCase();
  const type = q.type?.toLowerCase();
  if (type && type !== "income" && type !== "expense") {
    throw badRequest('Query parameter "type" must be "income" or "expense"');
  }
  return all.filter((t) => {
    const day = dayOf(t.date);
    if (q.from && day < q.from) return false;
    if (q.to && day > q.to) return false;
    if (q.account && t.account !== q.account) return false;
    if (q.vendor && t.vendor !== q.vendor) return false;
    if (q.category && t.category !== q.category) return false;
    if (q.sub_category && t.sub_category !== q.sub_category) return false;
    if (min !== undefined && t.amount < min) return false;
    if (max !== undefined && t.amount > max) return false;
    if (type === "income" && t.amount < 0) return false;
    if (type === "expense" && t.amount >= 0) return false;
    if (flag(q.exclude_transfers) && t.category === TRANSFER_CATEGORY)
      return false;
    if (search) {
      const haystack = [
        t.vendor,
        t.category,
        t.account,
        t.remarks,
        t.sub_category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export const transactionRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/transactions",
    summary:
      "List transactions (filters: from, to, account, vendor, category, sub_category, min_amount, max_amount, type, search, exclude_transfers, limit, offset)",
    query: {
      from: "Earliest date, YYYY-MM-DD",
      to: "Latest date, YYYY-MM-DD",
      account: "Exact account name",
      vendor: "Exact vendor name",
      category: "Exact category name",
      sub_category: "Exact sub-category name",
      min_amount: "Minimum amount (signed)",
      max_amount: "Maximum amount (signed)",
      type: "income or expense",
      search: "Text to find in vendor, category, account, remarks",
      exclude_transfers: "true to hide transfers",
      limit: "Page size, 1-1000 (default 100)",
      offset: "Rows to skip",
    },
    handler: async ({ params, query, services }) => {
      await requireLedger(services, params.ledgerId);
      const limit = Math.min(
        Math.max(numberParam("limit", query.limit) ?? 100, 1),
        MAX_PAGE,
      );
      const offset = Math.max(numberParam("offset", query.offset) ?? 0, 0);
      const matches = filterTransactions(
        await services.dataProvider.getTransactions(params.ledgerId),
        query,
      );
      return json({
        data: matches.slice(offset, offset + limit),
        total: matches.length,
        limit,
        offset,
      });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions",
    summary: "Create a transaction",
    body: txSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(txSchema, ctx.body);
      return json(await createTransaction(ctx, input, ledger.currency), 201);
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions/bulk",
    summary: `Create up to ${MAX_PAGE} transactions in one call`,
    body: bulkSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const { transactions } = parse(bulkSchema, ctx.body);
      const created: Transaction[] = [];
      for (const input of transactions) {
        created.push(await createTransaction(ctx, input, ledger.currency));
      }
      return json({ data: created, count: created.length }, 201);
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions/transfer",
    summary: "Create a linked transfer between two accounts",
    body: transferSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(transferSchema, ctx.body);
      if (input.from_account === input.to_account) {
        throw badRequest("Source and destination accounts must differ");
      }
      const accounts = await loadAccountResources(
        ctx.services,
        ctx.params.ledgerId,
      );
      const from = accounts.find((a) => a.name === input.from_account);
      const to = accounts.find((a) => a.name === input.to_account);
      if (!from) throw notFound(`Account "${input.from_account}"`);
      if (!to) throw notFound(`Account "${input.to_account}"`);
      if (from.currency !== to.currency && input.to_amount === undefined) {
        throw badRequest(
          `Accounts use different currencies (${from.currency} / ${to.currency}); provide "to_amount"`,
        );
      }

      const dp = ctx.services.dataProvider;
      const common = {
        user_id: ctx.params.ledgerId,
        date: input.date,
        category: TRANSFER_CATEGORY,
        remarks: input.remarks ?? null,
      };
      const outgoing = await dp.addTransaction({
        ...common,
        amount: -input.amount,
        account: from.name,
        vendor: to.name,
        currency: from.currency || ledger.currency,
      });
      const incoming = await dp.addTransaction({
        ...common,
        amount: input.to_amount ?? input.amount,
        account: to.name,
        vendor: from.name,
        currency: to.currency || ledger.currency,
      });
      await dp.linkTransactionsAsTransfer(outgoing.id, incoming.id);
      const transferId = (await db.transactions.get(outgoing.id))?.transfer_id;
      return json({ transfer_id: transferId, outgoing, incoming }, 201);
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/transactions/transfer/:transferId",
    summary: "Delete both legs of a transfer",
    handler: async ({ params, services }) => {
      await requireLedger(services, params.ledgerId);
      const legs = await db.transactions
        .where("transfer_id")
        .equals(params.transferId)
        .and((t) => t.user_id === params.ledgerId)
        .count();
      if (legs === 0) throw notFound(`Transfer "${params.transferId}"`);
      await services.dataProvider.deleteTransactionByTransferId(
        params.transferId,
      );
      return noContent();
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/transactions/:transactionId",
    summary: "Get a transaction",
    handler: async ({ params, services }) => {
      await requireLedger(services, params.ledgerId);
      return json(
        await getTransactionInLedger(params.ledgerId, params.transactionId),
      );
    },
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/transactions/:transactionId",
    summary: "Update a transaction",
    body: patchSchema,
    handler: async ({ params, body, services }) => {
      await requireLedger(services, params.ledgerId);
      const existing = await getTransactionInLedger(
        params.ledgerId,
        params.transactionId,
      );
      const patch = parse(patchSchema, body);
      const dp = services.dataProvider;

      // Keep the lookup tables in step when a patch introduces new names.
      if (patch.category && patch.category !== existing.category) {
        await dp.ensureCategoryExists(patch.category, params.ledgerId);
      }
      if (patch.vendor && patch.vendor !== existing.vendor) {
        await dp.ensurePayeeExists(patch.vendor, false, params.ledgerId);
      }
      if (patch.account && patch.account !== existing.account) {
        await dp.ensurePayeeExists(patch.account, true, params.ledgerId, {
          currency: patch.currency ?? existing.currency,
        });
      }

      const updated: Transaction = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined),
        ),
      };
      await dp.updateTransaction(updated);
      return json(updated);
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/transactions/:transactionId",
    summary: "Delete a transaction",
    handler: async ({ params, services }) => {
      await requireLedger(services, params.ledgerId);
      await getTransactionInLedger(params.ledgerId, params.transactionId);
      await services.dataProvider.deleteTransaction(params.transactionId);
      return noContent();
    },
  },
];

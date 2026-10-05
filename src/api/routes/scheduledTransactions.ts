import { z } from "zod";
import { db } from "@/lib/dexieDB";
import type { ScheduledTransaction } from "@/types/dataProvider";
import {
  badRequest,
  isoDateSchema,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import type { RouteContext, RouteDef } from "../router";
import { loadAccountResources, requireLedger } from "./shared";

/** Same formats the app understands: named, or `<n><d|w|m|y>` such as `2w`. */
const frequencySchema = z
  .string()
  .regex(/^(Daily|Weekly|Monthly|Yearly|One-time|\d+[dwmy])$/, {
    message:
      'must be Daily, Weekly, Monthly, Yearly, One-time or a duration like "2w" (d, w, m, y)',
  });

const baseSchema = z.object({
  /** Next occurrence. The app creates the real transaction when it is due. */
  date: isoDateSchema,
  amount: z.number().finite(),
  account: z.string().trim().min(1),
  vendor: z.string().trim().min(1),
  category: z.string().trim().min(1),
  sub_category: z.string().trim().nullish(),
  frequency: frequencySchema,
  end_date: isoDateSchema.nullish(),
  remarks: z.string().nullish(),
  currency: z.string().trim().min(1).optional(),
  ignored_dates: z.array(isoDateSchema).optional(),
});
const patchSchema = baseSchema.partial();

async function find(ctx: RouteContext): Promise<ScheduledTransaction> {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const item = await db.scheduled_transactions.get(ctx.params.scheduledId);
  if (!item || item.user_id !== ctx.params.ledgerId) {
    throw notFound(`Scheduled transaction "${ctx.params.scheduledId}"`);
  }
  return item;
}

/** Makes sure the account and vendor exist, as the UI does when saving. */
async function ensurePayees(
  ctx: RouteContext,
  account: string,
  vendor: string,
  currency: string,
) {
  const dp = ctx.services.dataProvider;
  await dp.ensurePayeeExists(account, true, ctx.params.ledgerId, { currency });
  await dp.ensurePayeeExists(vendor, false, ctx.params.ledgerId);
}

export const scheduledTransactionRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/scheduled-transactions",
    summary: "List recurring (scheduled) transactions",
    handler: async ({ params, services }) => {
      await requireLedger(services, params.ledgerId);
      return json({
        data: await services.dataProvider.getScheduledTransactions(
          params.ledgerId,
        ),
      });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/scheduled-transactions",
    summary: "Create a recurring transaction",
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(baseSchema, ctx.body);
      const accounts = await loadAccountResources(ctx.services, ledger.id);
      const currency =
        input.currency ??
        accounts.find((a) => a.name === input.account)?.currency ??
        ledger.currency;
      await ensurePayees(ctx, input.account, input.vendor, currency);
      const created = await ctx.services.dataProvider.addScheduledTransaction({
        user_id: ledger.id,
        date: input.date,
        amount: input.amount,
        currency,
        account: input.account,
        vendor: input.vendor,
        category: input.category,
        sub_category: input.sub_category ?? null,
        frequency: input.frequency,
        end_date: input.end_date ?? null,
        remarks: input.remarks ?? null,
        ignored_dates: input.ignored_dates ?? [],
      });
      return json(created, 201);
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/scheduled-transactions/:scheduledId",
    summary: "Get a recurring transaction",
    handler: async (ctx) => json(await find(ctx)),
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/scheduled-transactions/:scheduledId",
    summary: "Update a recurring transaction",
    handler: async (ctx) => {
      const existing = await find(ctx);
      const patch = parse(patchSchema, ctx.body);
      const updated: ScheduledTransaction = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined),
        ),
      };
      await ensurePayees(
        ctx,
        updated.account,
        updated.vendor,
        updated.currency,
      );
      await ctx.services.dataProvider.updateScheduledTransaction(updated);
      return json(updated);
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/scheduled-transactions/:scheduledId/skip",
    summary: "Skip one occurrence by date (adds it to ignored_dates)",
    handler: async (ctx) => {
      const existing = await find(ctx);
      const { date } = parse(z.object({ date: isoDateSchema }), ctx.body);
      if (existing.frequency === "One-time") {
        throw badRequest("A one-time schedule has nothing to skip; delete it");
      }
      const ignored = new Set(existing.ignored_dates ?? []);
      ignored.add(date);
      const updated = { ...existing, ignored_dates: [...ignored] };
      await ctx.services.dataProvider.updateScheduledTransaction(updated);
      return json(updated);
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/scheduled-transactions/:scheduledId",
    summary: "Delete a recurring transaction (created transactions are kept)",
    handler: async (ctx) => {
      const existing = await find(ctx);
      await ctx.services.dataProvider.deleteScheduledTransaction(existing.id);
      return noContent();
    },
  },
];

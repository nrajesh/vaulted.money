import { z } from "zod";
import { db } from "@/lib/dexieDB";
import { conflict, json, noContent, notFound, parse } from "../http";
import { propagateAccountCurrency, renamePayee } from "../entityOps";
import type { RouteDef, RouteContext } from "../router";
import {
  ACCOUNT_TYPES,
  accountBalance,
  loadAccountResources,
  requireLedger,
  type AccountResource,
} from "./shared";

const createSchema = z.object({
  name: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  starting_balance: z.number().finite().default(0),
  type: z.enum(ACCOUNT_TYPES).default("Checking"),
  credit_limit: z.number().finite().nonnegative().optional(),
  remarks: z.string().optional(),
});
const patchSchema = createSchema
  .partial()
  .extend({ credit_limit: z.number().finite().nonnegative().nullish() });

async function findAccount({
  params,
  services,
}: RouteContext): Promise<AccountResource> {
  const accounts = await loadAccountResources(services, params.ledgerId);
  const account = accounts.find((a) => a.id === params.accountId);
  if (!account) throw notFound(`Account "${params.accountId}"`);
  return account;
}

const withBalance = async (ctx: RouteContext, account: AccountResource) => {
  const transactions = await ctx.services.dataProvider.getTransactions(
    ctx.params.ledgerId,
  );
  return {
    ...account,
    balance: accountBalance(account, transactions, new Date()),
  };
};

export const accountRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/accounts",
    summary: "List accounts with current balances",
    handler: async ({ params, services }) => {
      await requireLedger(services, params.ledgerId);
      const [accounts, transactions] = await Promise.all([
        loadAccountResources(services, params.ledgerId),
        services.dataProvider.getTransactions(params.ledgerId),
      ]);
      const now = new Date();
      return json({
        data: accounts.map((a) => ({
          ...a,
          balance: accountBalance(a, transactions, now),
        })),
      });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/accounts",
    summary: "Create an account",
    body: createSchema,
    handler: async (ctx) => {
      const { params, body, services } = ctx;
      await requireLedger(services, params.ledgerId);
      const input = parse(createSchema, body);
      const existing = await services.dataProvider.getVendorByName(
        input.name,
        params.ledgerId,
      );
      if (existing) {
        throw conflict(`"${input.name}" already exists as a vendor or account`);
      }
      const vendorId = await services.dataProvider.ensurePayeeExists(
        input.name,
        true,
        params.ledgerId,
        {
          currency: input.currency,
          startingBalance: input.starting_balance,
          remarks: input.remarks,
          type: input.type,
          creditLimit: input.credit_limit,
        },
      );
      const created = (
        await loadAccountResources(services, params.ledgerId)
      ).find((a) => a.vendor_id === vendorId);
      return json(created, 201);
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/accounts/:accountId",
    summary: "Get an account",
    handler: async (ctx) =>
      json(await withBalance(ctx, await findAccount(ctx))),
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/accounts/:accountId",
    summary:
      "Update an account (renames and currency changes propagate to its transactions)",
    body: patchSchema,
    handler: async (ctx) => {
      const account = await findAccount(ctx);
      const patch = parse(patchSchema, ctx.body);
      const ledgerId = ctx.params.ledgerId;

      let name = account.name;
      if (patch.name !== undefined && patch.name !== account.name) {
        const vendor = await ctx.services.dataProvider.getVendorByName(
          account.name,
          ledgerId,
        );
        if (vendor) await renamePayee(ledgerId, vendor, patch.name);
        name = patch.name;
      }
      if (patch.currency !== undefined && patch.currency !== account.currency) {
        await propagateAccountCurrency(ledgerId, name, patch.currency);
      }

      await db.accounts.update(account.id, {
        ...(patch.currency !== undefined && { currency: patch.currency }),
        ...(patch.starting_balance !== undefined && {
          starting_balance: patch.starting_balance,
        }),
        ...(patch.type !== undefined && { type: patch.type }),
        ...(patch.remarks !== undefined && { remarks: patch.remarks }),
        ...(patch.credit_limit !== undefined && {
          credit_limit: patch.credit_limit ?? undefined,
        }),
      });
      return json(await withBalance(ctx, await findAccount(ctx)));
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/accounts/:accountId",
    summary: "Delete an account (its transactions are kept)",
    handler: async (ctx) => {
      const account = await findAccount(ctx);
      await ctx.services.dataProvider.deletePayee(account.vendor_id);
      return noContent();
    },
  },
];

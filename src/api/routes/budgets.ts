import { z } from "zod";
import type { Budget } from "@/types/dataProvider";
import {
  badRequest,
  isoDateSchema,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import { calculateBudgetSpent } from "@/utils/budgetUtils";
import type { RouteContext, RouteDef } from "../router";
import { currentConverter, requireLedger } from "./shared";

const frequencySchema = z
  .string()
  .regex(/^(Monthly|Quarterly|Yearly|One-time|\d+[dwmy])$/, {
    message:
      'must be Monthly, Quarterly, Yearly, One-time or a duration like "3m"',
  });

const createSchema = z.object({
  budget_scope: z
    .enum(["category", "sub_category", "account", "vendor"])
    .default("category"),
  /** Required for category scope; for sub_category scope this is the parent. */
  category: z.string().trim().min(1).optional(),
  sub_category: z.string().trim().min(1).optional(),
  /** Required for account, vendor and sub_category scopes: the entity name. */
  scope_name: z.string().trim().min(1).optional(),
  target_amount: z.number().finite().positive(),
  currency: z.string().trim().min(1).optional(),
  frequency: frequencySchema.default("Monthly"),
  start_date: isoDateSchema.optional(),
  end_date: isoDateSchema.nullish(),
  is_active: z.boolean().default(true),
  is_goal: z.boolean().default(false),
  target_date: isoDateSchema.nullish(),
  monthly_contribution: z.number().finite().nullish(),
  goal_context: z.string().nullish(),
  account_scope_values: z.array(z.string()).nullish(),
});

const patchSchema = z.object({
  target_amount: z.number().finite().positive().optional(),
  currency: z.string().trim().min(1).optional(),
  frequency: frequencySchema.optional(),
  start_date: isoDateSchema.optional(),
  end_date: isoDateSchema.nullish(),
  is_active: z.boolean().optional(),
  target_date: isoDateSchema.nullish(),
  monthly_contribution: z.number().finite().nullish(),
  goal_context: z.string().nullish(),
  account_scope_values: z.array(z.string()).nullish(),
});

const iso = (value: string) => new Date(value).toISOString();

/** Adds the computed `spent_amount` the UI would show. */
async function withSpending(ctx: RouteContext, budgets: Budget[]) {
  const { dataProvider } = ctx.services;
  const ledgerId = ctx.params.ledgerId;
  const [transactions, accounts, vendors] = await Promise.all([
    dataProvider.getTransactions(ledgerId),
    dataProvider.getAllAccounts(ledgerId),
    dataProvider.getAllVendors(ledgerId),
  ]);
  const { convert } = currentConverter();
  return budgets.map((budget) => ({
    ...budget,
    spent_amount:
      Math.round(
        calculateBudgetSpent(
          budget,
          transactions,
          accounts,
          vendors,
          convert,
          budget.currency,
        ) * 100,
      ) / 100,
  }));
}

async function findBudget(ctx: RouteContext): Promise<Budget> {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const budgets = await ctx.services.dataProvider.getBudgetsWithSpending(
    ctx.params.ledgerId,
  );
  const budget = budgets.find((b) => b.id === ctx.params.budgetId);
  if (!budget) throw notFound(`Budget "${ctx.params.budgetId}"`);
  return budget;
}

export const budgetRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/budgets",
    summary: "List budgets and savings goals with current spending",
    handler: async (ctx) => {
      await requireLedger(ctx.services, ctx.params.ledgerId);
      const budgets = await ctx.services.dataProvider.getBudgetsWithSpending(
        ctx.params.ledgerId,
      );
      return json({ data: await withSpending(ctx, budgets) });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/budgets",
    summary: "Create a budget or savings goal",
    body: createSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(createSchema, ctx.body);
      const dp = ctx.services.dataProvider;
      const ledgerId = ctx.params.ledgerId;

      let categoryId = "";
      let categoryName = "";
      let subId: string | null = null;
      let subName: string | null = null;
      let scopeName: string | null = null;

      if (input.budget_scope === "category") {
        if (!input.category) throw badRequest('"category" is required');
        const category = (await dp.getUserCategories(ledgerId)).find(
          (c) => c.name === input.category,
        );
        if (!category) throw badRequest(`Unknown category "${input.category}"`);
        categoryId = category.id;
        categoryName = category.name;
        if (input.sub_category) {
          const sub = (await dp.getSubCategories(ledgerId)).find(
            (s) =>
              s.category_id === category.id && s.name === input.sub_category,
          );
          if (!sub) {
            throw badRequest(`Unknown sub-category "${input.sub_category}"`);
          }
          subId = sub.id;
          subName = sub.name;
        }
      } else {
        // Same storage convention as the Budgets dialog: non-category scopes
        // keep the entity name as the display name and carry no category id.
        if (!input.scope_name) throw badRequest('"scope_name" is required');
        categoryName = input.scope_name;
        scopeName = input.scope_name;
      }

      const start = input.start_date ?? new Date().toISOString();
      const budget = {
        user_id: ledgerId,
        category_id: categoryId,
        category_name: categoryName,
        sub_category_id: subId,
        sub_category_name: subName,
        target_amount: input.target_amount,
        currency: input.currency ?? ledger.currency,
        start_date: iso(start),
        end_date: input.end_date ? iso(input.end_date) : null,
        frequency: input.frequency as Budget["frequency"],
        is_active: input.is_active,
        account_scope: input.account_scope_values?.length ? "GROUP" : "ALL",
        account_scope_values: input.account_scope_values?.length
          ? input.account_scope_values
          : null,
        is_goal: input.is_goal,
        target_date: input.target_date ? iso(input.target_date) : null,
        monthly_contribution: input.monthly_contribution ?? null,
        goal_context: input.goal_context ?? null,
        budget_scope: input.budget_scope,
        budget_scope_name: scopeName,
      } as Omit<Budget, "id" | "spent_amount">;

      await dp.addBudget(budget);
      // addBudget returns void; the newest matching row is the one just added.
      const created = (await dp.getBudgetsWithSpending(ledgerId))
        .filter((b) => b.category_name === categoryName)
        .sort((a, b) =>
          (b.created_at ?? "").localeCompare(a.created_at ?? ""),
        )[0];
      return json((await withSpending(ctx, [created]))[0], 201);
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/budgets/:budgetId",
    summary: "Get a budget with current spending",
    handler: async (ctx) =>
      json((await withSpending(ctx, [await findBudget(ctx)]))[0]),
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/budgets/:budgetId",
    summary: "Update a budget",
    body: patchSchema,
    handler: async (ctx) => {
      const existing = await findBudget(ctx);
      const patch = parse(patchSchema, ctx.body);
      const updated = { ...existing } as Budget;
      if (patch.target_amount !== undefined)
        updated.target_amount = patch.target_amount;
      if (patch.currency !== undefined) updated.currency = patch.currency;
      if (patch.frequency !== undefined)
        updated.frequency = patch.frequency as Budget["frequency"];
      if (patch.start_date !== undefined)
        updated.start_date = iso(patch.start_date);
      if (patch.end_date !== undefined)
        updated.end_date = patch.end_date ? iso(patch.end_date) : null;
      if (patch.is_active !== undefined) updated.is_active = patch.is_active;
      if (patch.target_date !== undefined)
        updated.target_date = patch.target_date ? iso(patch.target_date) : null;
      if (patch.monthly_contribution !== undefined)
        updated.monthly_contribution = patch.monthly_contribution;
      if (patch.goal_context !== undefined)
        updated.goal_context = patch.goal_context;
      if (patch.account_scope_values !== undefined) {
        const values = patch.account_scope_values?.length
          ? patch.account_scope_values
          : null;
        updated.account_scope_values = values;
        updated.account_scope = values ? "GROUP" : "ALL";
      }
      await ctx.services.dataProvider.updateBudget(updated);
      return json((await withSpending(ctx, [updated]))[0]);
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/budgets/:budgetId",
    summary: "Delete a budget",
    handler: async (ctx) => {
      const budget = await findBudget(ctx);
      await ctx.services.dataProvider.deleteBudget(budget.id);
      return noContent();
    },
  },
];

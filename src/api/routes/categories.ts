import { z } from "zod";
import type { Category, SubCategory } from "@/types/dataProvider";
import {
  badRequest,
  conflict,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import {
  deleteSubCategory,
  renameCategory,
  renameSubCategory,
} from "../entityOps";
import type { RouteContext, RouteDef } from "../router";
import { requireLedger } from "./shared";

const nameSchema = z.object({ name: z.string().trim().min(1) });
const createCategorySchema = nameSchema.extend({
  sub_categories: z.array(z.string().trim().min(1)).optional(),
});
const mergeSchema = z.object({
  target: z.string().trim().min(1),
  sources: z.array(z.string().trim().min(1)).min(1),
});

async function load(ctx: RouteContext) {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const [categories, subCategories] = await Promise.all([
    ctx.services.dataProvider.getUserCategories(ctx.params.ledgerId),
    ctx.services.dataProvider.getSubCategories(ctx.params.ledgerId),
  ]);
  return { categories, subCategories };
}

async function findCategory(ctx: RouteContext) {
  const { categories, subCategories } = await load(ctx);
  const category = categories.find((c) => c.id === ctx.params.categoryId);
  if (!category) throw notFound(`Category "${ctx.params.categoryId}"`);
  return {
    category,
    subs: subCategories.filter((s) => s.category_id === category.id),
  };
}

const present = (category: Category, subs: SubCategory[]) => ({
  ...category,
  sub_categories: subs.filter((s) => s.category_id === category.id),
});

export const categoryRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/categories",
    summary: "List categories with their sub-categories",
    handler: async (ctx) => {
      const { categories, subCategories } = await load(ctx);
      return json({ data: categories.map((c) => present(c, subCategories)) });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/categories",
    summary: "Create a category (optionally with sub-categories)",
    handler: async (ctx) => {
      const { categories } = await load(ctx);
      const input = parse(createCategorySchema, ctx.body);
      if (categories.some((c) => c.name === input.name)) {
        throw conflict(`Category "${input.name}" already exists`);
      }
      const dp = ctx.services.dataProvider;
      const id = await dp.ensureCategoryExists(input.name, ctx.params.ledgerId);
      for (const sub of input.sub_categories ?? []) {
        if (id) await dp.ensureSubCategoryExists(sub, id, ctx.params.ledgerId);
      }
      const { category, subs } = await findCategory({
        ...ctx,
        params: { ...ctx.params, categoryId: id ?? "" },
      });
      return json(present(category, subs), 201);
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/categories/merge",
    summary: "Merge categories into a target category",
    handler: async (ctx) => {
      const { categories } = await load(ctx);
      const { target, sources } = parse(mergeSchema, ctx.body);
      if (sources.includes(target)) {
        throw badRequest("The target cannot also be a source");
      }
      const known = new Set(categories.map((c) => c.name));
      const missing = [target, ...sources].filter((n) => !known.has(n));
      if (missing.length > 0) {
        throw notFound(
          `Category(ies) ${missing.map((n) => `"${n}"`).join(", ")}`,
        );
      }
      await ctx.services.dataProvider.mergeCategories(
        target,
        sources,
        ctx.params.ledgerId,
      );
      return noContent();
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/categories/:categoryId",
    summary: "Get a category",
    handler: async (ctx) => {
      const { category, subs } = await findCategory(ctx);
      return json(present(category, subs));
    },
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/categories/:categoryId",
    summary: "Rename a category (propagates to transactions and budgets)",
    handler: async (ctx) => {
      const { category, subs } = await findCategory(ctx);
      const { name } = parse(nameSchema, ctx.body);
      await renameCategory(ctx.params.ledgerId, category, name);
      return json(present({ ...category, name }, subs));
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/categories/:categoryId",
    summary: "Delete a category, its sub-categories and dependent budgets",
    handler: async (ctx) => {
      const { category } = await findCategory(ctx);
      await ctx.services.dataProvider.deleteCategory(category.id);
      return noContent();
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/categories/:categoryId/sub-categories",
    summary: "List a category's sub-categories",
    handler: async (ctx) => json({ data: (await findCategory(ctx)).subs }),
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/categories/:categoryId/sub-categories",
    summary: "Create a sub-category",
    handler: async (ctx) => {
      const { category, subs } = await findCategory(ctx);
      const { name } = parse(nameSchema, ctx.body);
      if (subs.some((s) => s.name === name)) {
        throw conflict(`Sub-category "${name}" already exists`);
      }
      const id = await ctx.services.dataProvider.ensureSubCategoryExists(
        name,
        category.id,
        ctx.params.ledgerId,
      );
      const created = (
        await ctx.services.dataProvider.getSubCategories(ctx.params.ledgerId)
      ).find((s) => s.id === id);
      return json(created, 201);
    },
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/categories/:categoryId/sub-categories/:subCategoryId",
    summary: "Rename a sub-category",
    handler: async (ctx) => {
      const { category, subs } = await findCategory(ctx);
      const sub = subs.find((s) => s.id === ctx.params.subCategoryId);
      if (!sub) throw notFound(`Sub-category "${ctx.params.subCategoryId}"`);
      const { name } = parse(nameSchema, ctx.body);
      await renameSubCategory(ctx.params.ledgerId, category, sub, name);
      return json({ ...sub, name });
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/categories/:categoryId/sub-categories/:subCategoryId",
    summary: "Delete a sub-category",
    handler: async (ctx) => {
      const { category, subs } = await findCategory(ctx);
      const sub = subs.find((s) => s.id === ctx.params.subCategoryId);
      if (!sub) throw notFound(`Sub-category "${ctx.params.subCategoryId}"`);
      await deleteSubCategory(ctx.params.ledgerId, category, sub);
      return noContent();
    },
  },
];

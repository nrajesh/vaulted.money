import { z } from "zod";
import type { Vendor } from "@/types/dataProvider";
import {
  badRequest,
  conflict,
  flag,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import { renamePayee } from "../entityOps";
import type { RouteContext, RouteDef } from "../router";
import { requireLedger } from "./shared";

const nameSchema = z.object({ name: z.string().trim().min(1) });
const mergeSchema = z.object({
  target: z.string().trim().min(1),
  sources: z.array(z.string().trim().min(1)).min(1),
});

async function findVendor(ctx: RouteContext): Promise<Vendor> {
  await requireLedger(ctx.services, ctx.params.ledgerId);
  const vendors = await ctx.services.dataProvider.getAllVendors(
    ctx.params.ledgerId,
  );
  const vendor = vendors.find((v) => v.id === ctx.params.vendorId);
  if (!vendor) throw notFound(`Vendor "${ctx.params.vendorId}"`);
  return vendor;
}

export const vendorRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/vendors",
    summary: "List vendors (add ?include_accounts=true to include accounts)",
    query: {
      include_accounts: "true to include accounts",
    },
    handler: async ({ params, query, services }) => {
      await requireLedger(services, params.ledgerId);
      const vendors = await services.dataProvider.getAllVendors(
        params.ledgerId,
      );
      const data = vendors
        .filter((v) => flag(query.include_accounts) || !v.is_account)
        .sort((a, b) => a.name.localeCompare(b.name));
      return json({ data });
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/vendors",
    summary: "Create a vendor",
    body: nameSchema,
    handler: async ({ params, body, services }) => {
      await requireLedger(services, params.ledgerId);
      const { name } = parse(nameSchema, body);
      if (await services.dataProvider.getVendorByName(name, params.ledgerId)) {
        throw conflict(`"${name}" already exists as a vendor or account`);
      }
      await services.dataProvider.ensurePayeeExists(
        name,
        false,
        params.ledgerId,
      );
      return json(
        await services.dataProvider.getVendorByName(name, params.ledgerId),
        201,
      );
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/vendors/merge",
    summary:
      "Merge vendors into a target vendor, re-pointing their transactions",
    body: mergeSchema,
    handler: async ({ params, body, services }) => {
      await requireLedger(services, params.ledgerId);
      const { target, sources } = parse(mergeSchema, body);
      if (sources.includes(target)) {
        throw badRequest("The target cannot also be a source");
      }
      const vendors = await services.dataProvider.getAllVendors(
        params.ledgerId,
      );
      const known = new Set(vendors.map((v) => v.name));
      const missing = [target, ...sources].filter((n) => !known.has(n));
      if (missing.length > 0) {
        throw notFound(`Vendor(s) ${missing.map((n) => `"${n}"`).join(", ")}`);
      }
      await services.dataProvider.mergePayees(target, sources, params.ledgerId);
      return noContent();
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/vendors/:vendorId",
    summary: "Get a vendor",
    handler: async (ctx) => json(await findVendor(ctx)),
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId/vendors/:vendorId",
    summary: "Rename a vendor (propagates to transactions and budgets)",
    body: nameSchema,
    handler: async (ctx) => {
      const vendor = await findVendor(ctx);
      const { name } = parse(nameSchema, ctx.body);
      await renamePayee(ctx.params.ledgerId, vendor, name);
      return json({ ...vendor, name });
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId/vendors/:vendorId",
    summary: "Delete a vendor (use the accounts endpoint for accounts)",
    handler: async (ctx) => {
      const vendor = await findVendor(ctx);
      if (vendor.is_account) {
        throw conflict(
          "This is an account; delete it via the accounts endpoint",
        );
      }
      await ctx.services.dataProvider.deletePayee(vendor.id);
      return noContent();
    },
  },
];

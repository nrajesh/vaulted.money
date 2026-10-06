import { z } from "zod";
import { json, noContent, parse } from "../http";
import type { RouteDef } from "../router";
import { requireLedger } from "./shared";

const createSchema = z.object({
  name: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  short_name: z.string().trim().optional(),
  icon: z.string().optional(),
});
const patchSchema = createSchema.partial();

// Same defaults as the "New ledger" dialog, so every ledger has the same shape.
const DEFAULT_ICON = "building";
const present = <T extends { icon?: string; short_name?: string }>(
  ledger: T,
) => ({
  ...ledger,
  icon: ledger.icon ?? DEFAULT_ICON,
  short_name: ledger.short_name ?? "",
});

export const ledgerRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers",
    summary: "List ledgers",
    handler: async ({ services }) =>
      json({ data: (await services.dataProvider.getLedgers()).map(present) }),
  },
  {
    method: "POST",
    path: "/ledgers",
    summary: "Create a ledger",
    body: createSchema,
    handler: async ({ body, services }) => {
      const input = parse(createSchema, body);
      return json(
        present(
          await services.dataProvider.addLedger({
            ...input,
            icon: input.icon ?? DEFAULT_ICON,
            short_name: input.short_name ?? "",
          }),
        ),
        201,
      );
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId",
    summary: "Get a ledger",
    handler: async ({ params, services }) =>
      json(present(await requireLedger(services, params.ledgerId))),
  },
  {
    method: "PATCH",
    path: "/ledgers/:ledgerId",
    summary: "Update a ledger",
    body: patchSchema,
    handler: async ({ params, body, services }) => {
      const ledger = await requireLedger(services, params.ledgerId);
      const updated = { ...ledger, ...parse(patchSchema, body) };
      await services.dataProvider.updateLedger(updated);
      return json(present(updated));
    },
  },
  {
    method: "DELETE",
    path: "/ledgers/:ledgerId",
    summary: "Delete a ledger and all of its data",
    handler: async ({ params, services }) => {
      await requireLedger(services, params.ledgerId);
      await services.dataProvider.deleteLedger(params.ledgerId);
      // The UI may be showing this ledger; reload so it re-selects cleanly.
      return { ...noContent(), reloadUi: true };
    },
  },
];

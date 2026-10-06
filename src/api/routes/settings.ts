import { z } from "zod";
import { builtInLanguageOptions } from "@/i18n/resources";
import { getCustomLanguages } from "@/i18n/customLanguages";
import {
  getEnabledLanguages,
  saveEnabledLanguages,
} from "@/i18n/languagePreferences";
import { json, notFound, parse, badRequest } from "../http";
import { readCurrencyState, writeCurrencyState } from "../currencySettings";
import type { RouteContext, RouteDef } from "../router";

/**
 * The app's global preferences in one resource: the same values as the
 * Settings page (default currency, language, future-transactions window and
 * the default AI provider). Per-ledger settings live on /ledgers/{id}.
 */

const FUTURE_MONTHS_KEY = "futureMonths";
const DEFAULT_FUTURE_MONTHS = 2;

const patchSchema = z.object({
  /** "Default Currency" (display currency). Must be an active currency. */
  base_currency: z.string().trim().toUpperCase().min(1).optional(),
  /** App language code, built in or custom. */
  language: z.string().trim().toLowerCase().min(1).optional(),
  /** "Future Transactions": months of scheduled transactions to show. */
  future_months: z.number().int().min(0).max(120).optional(),
  /** "Default AI Provider": a provider id, or null for None (Disabled). */
  default_ai_provider_id: z.string().min(1).nullable().optional(),
});

const readFutureMonths = (): number => {
  const parsed = parseInt(localStorage.getItem(FUTURE_MONTHS_KEY) ?? "", 10);
  return Number.isNaN(parsed) || parsed < 0 ? DEFAULT_FUTURE_MONTHS : parsed;
};

async function readSettings(ctx: RouteContext) {
  const providers = await ctx.services.dataProvider.getAIProviders();
  const defaultProvider = providers.find((p) => p.isDefault);
  return {
    base_currency: readCurrencyState().base,
    language: getEnabledLanguages()[0],
    future_months: readFutureMonths(),
    default_ai_provider_id: defaultProvider?.id ?? null,
    ai_enabled: Boolean(defaultProvider),
  };
}

export const settingsRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/settings",
    summary:
      "Read global settings (currency, language, future months, AI provider)",
    handler: async (ctx) => json(await readSettings(ctx)),
  },
  {
    method: "PATCH",
    path: "/settings",
    summary:
      "Change global settings. Body: any of {base_currency, language, future_months, default_ai_provider_id (null = disabled)}",
    body: patchSchema,
    handler: async (ctx) => {
      const patch = parse(patchSchema, ctx.body);
      const dp = ctx.services.dataProvider;

      // Validate everything first so a bad value changes nothing.
      const currencies = readCurrencyState();
      if (patch.base_currency !== undefined) {
        const known = currencies.currencies.some(
          (c) => c.code === patch.base_currency,
        );
        if (!known) throw notFound(`Currency "${patch.base_currency}"`);
        if (!currencies.rates[patch.base_currency]) {
          throw badRequest(
            `Currency "${patch.base_currency}" has no exchange rate`,
          );
        }
      }
      if (patch.language !== undefined) {
        const available = [
          ...builtInLanguageOptions.map((l) => l.code as string),
          ...getCustomLanguages().map((l) => l.code),
        ];
        if (!available.includes(patch.language)) {
          throw notFound(`Language "${patch.language}"`);
        }
      }
      const providers = await dp.getAIProviders();
      if (
        typeof patch.default_ai_provider_id === "string" &&
        !providers.some((p) => p.id === patch.default_ai_provider_id)
      ) {
        throw notFound(`AI provider "${patch.default_ai_provider_id}"`);
      }

      if (patch.base_currency !== undefined) {
        currencies.base = patch.base_currency;
        writeCurrencyState(currencies);
      }
      if (patch.language !== undefined) saveEnabledLanguages([patch.language]);
      if (patch.future_months !== undefined) {
        localStorage.setItem(FUTURE_MONTHS_KEY, String(patch.future_months));
      }
      if (patch.default_ai_provider_id === null) {
        for (const p of providers.filter((p) => p.isDefault)) {
          await dp.updateAIProvider({ ...p, isDefault: false });
        }
      } else if (typeof patch.default_ai_provider_id === "string") {
        await dp.setDefaultAIProvider(patch.default_ai_provider_id);
      }
      return json(await readSettings(ctx));
    },
  },
];

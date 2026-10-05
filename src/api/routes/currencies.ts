import { z } from "zod";
import { fetchWithTimeout } from "@/utils/apiUtils";
import {
  frankfurterLatestRatesUrl,
  type FrankfurterRate,
} from "@/constants/frankfurter";
import { defaultExchangeRates } from "@/constants/currency";
import {
  ApiError,
  badRequest,
  conflict,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import {
  readCurrencyState,
  writeCurrencyState,
  type CurrencyState,
} from "../currencySettings";
import type { RouteDef } from "../router";

const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,10}$/, { message: "must be 2-10 letters or digits" });
const rateSchema = z.number().finite().positive();

const createSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  rate: rateSchema,
});
const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  symbol: z.string().trim().min(1).optional(),
  rate: rateSchema.optional(),
});

const present = (state: CurrencyState) => ({
  base: state.base,
  currencies: state.currencies.map((c) => ({
    ...c,
    rate: state.rates[c.code] ?? null,
  })),
});

const find = (state: CurrencyState, code: string) => {
  const entry = state.currencies.find((c) => c.code === code.toUpperCase());
  if (!entry) throw notFound(`Currency "${code}"`);
  return entry;
};

export const currencyRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/currencies",
    summary: "List active currencies, exchange rates and the base currency",
    handler: () => json(present(readCurrencyState())),
  },
  {
    method: "POST",
    path: "/currencies",
    summary: "Add a currency with an initial rate (relative to USD)",
    handler: ({ body }) => {
      const input = parse(createSchema, body);
      const state = readCurrencyState();
      if (state.currencies.some((c) => c.code === input.code)) {
        throw conflict(`Currency "${input.code}" already exists`);
      }
      state.currencies.push({
        code: input.code,
        name: input.name,
        symbol: input.symbol,
      });
      state.rates[input.code] = input.rate;
      writeCurrencyState(state);
      return json({ ...input }, 201);
    },
  },
  {
    method: "PUT",
    path: "/currencies/base",
    summary: "Set the base (display) currency",
    handler: ({ body }) => {
      const { code } = parse(z.object({ code: codeSchema }), body);
      const state = readCurrencyState();
      find(state, code);
      if (!state.rates[code]) {
        throw badRequest(`Currency "${code}" has no exchange rate`);
      }
      state.base = code;
      writeCurrencyState(state);
      return json(present(state));
    },
  },
  {
    method: "POST",
    path: "/currencies/refresh-rates",
    summary: "Fetch the latest exchange rates from Frankfurter",
    handler: async () => {
      const state = readCurrencyState();
      let data: FrankfurterRate[];
      try {
        const response = await fetchWithTimeout(
          frankfurterLatestRatesUrl("USD"),
          {},
          5000,
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = (await response.json()) as FrankfurterRate[];
      } catch (error) {
        throw new ApiError(
          502,
          "rates_unavailable",
          `Could not fetch exchange rates: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
      const fetched: Record<string, number> = Object.fromEntries(
        data.map(({ quote, rate }) => [quote.toUpperCase(), rate]),
      );
      fetched.USD = 1;
      let updated = 0;
      for (const { code } of state.currencies) {
        if (fetched[code]) {
          state.rates[code] = fetched[code];
          updated++;
        } else if (state.rates[code] === undefined) {
          state.rates[code] = defaultExchangeRates[code] ?? 1;
        }
      }
      writeCurrencyState(state);
      return json({ ...present(state), updated });
    },
  },
  {
    method: "GET",
    path: "/currencies/:code",
    summary: "Get a currency",
    handler: ({ params }) => {
      const state = readCurrencyState();
      const entry = find(state, params.code);
      return json({ ...entry, rate: state.rates[entry.code] ?? null });
    },
  },
  {
    method: "PATCH",
    path: "/currencies/:code",
    summary: "Update a currency's name, symbol or exchange rate",
    handler: ({ params, body }) => {
      const patch = parse(patchSchema, body);
      const state = readCurrencyState();
      const entry = find(state, params.code);
      if (patch.name) entry.name = patch.name;
      if (patch.symbol) entry.symbol = patch.symbol;
      if (patch.rate !== undefined) state.rates[entry.code] = patch.rate;
      writeCurrencyState(state);
      return json({ ...entry, rate: state.rates[entry.code] ?? null });
    },
  },
  {
    method: "DELETE",
    path: "/currencies/:code",
    summary: "Remove a currency (the base currency cannot be removed)",
    handler: ({ params }) => {
      const state = readCurrencyState();
      const entry = find(state, params.code);
      if (entry.code === state.base) {
        throw conflict("The base currency cannot be removed");
      }
      state.currencies = state.currencies.filter((c) => c.code !== entry.code);
      writeCurrencyState(state);
      return noContent();
    },
  },
];

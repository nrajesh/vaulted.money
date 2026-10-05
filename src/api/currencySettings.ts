import {
  availableCurrencies,
  currencySymbols,
  defaultExchangeRates,
} from "@/constants/currency";

/**
 * Currency settings live in localStorage, owned by `CurrencyContext`. The API
 * reads and writes the same keys and then fires `app:currencies-changed` so the
 * mounted context re-reads them (see CurrencyContext).
 */

export interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyState {
  base: string;
  currencies: CurrencyEntry[];
  rates: Record<string, number>;
}

const KEY_BASE = "selectedCurrency";
const KEY_ACTIVE = "active_currencies";
const KEY_RATES = "currency_exchange_rates";

export const CURRENCIES_CHANGED_EVENT = "app:currencies-changed";

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function readCurrencyState(): CurrencyState {
  const defaults = availableCurrencies.map((c) => ({
    ...c,
    symbol: currencySymbols[c.code] || c.code,
  }));
  return {
    base: localStorage.getItem(KEY_BASE) || "USD",
    currencies: readJson<CurrencyEntry[]>(KEY_ACTIVE, defaults),
    rates: { ...defaultExchangeRates, ...readJson(KEY_RATES, {}) },
  };
}

export function writeCurrencyState(state: CurrencyState): void {
  localStorage.setItem(KEY_BASE, state.base);
  localStorage.setItem(KEY_ACTIVE, JSON.stringify(state.currencies));
  localStorage.setItem(KEY_RATES, JSON.stringify(state.rates));
  window.dispatchEvent(new CustomEvent(CURRENCIES_CHANGED_EVENT));
}

/** Same conversion maths as `CurrencyContext.convertBetweenCurrencies`. */
export const makeConverter =
  (rates: Record<string, number>) =>
  (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    return (amount / (rates[from] ?? 1)) * (rates[to] ?? 1);
  };

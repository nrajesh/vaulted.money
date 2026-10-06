import { db } from "@/lib/dexieDB";
import type { Account, Ledger, Transaction } from "@/types/dataProvider";
import { notFound } from "../http";
import type { ApiServices } from "../router";
import { readCurrencyState, makeConverter } from "../currencySettings";
import { dayOf, todayKey } from "../compute/shared";

export const ACCOUNT_TYPES = [
  "Checking",
  "Savings",
  "Credit Card",
  "Investment",
  "Other",
] as const;

export async function requireLedger(
  services: ApiServices,
  ledgerId: string,
): Promise<Ledger> {
  const ledger = (await services.dataProvider.getLedgers()).find(
    (l) => l.id === ledgerId,
  );
  if (!ledger) throw notFound(`Ledger "${ledgerId}"`);
  return ledger;
}

/**
 * An account as the API presents it. In storage an account is split across a
 * vendor row (holds the name) and an account row (currency, balance, type).
 */
export interface AccountResource {
  id: string;
  vendor_id: string;
  name: string;
  currency: string;
  starting_balance: number;
  type: Account["type"];
  credit_limit?: number;
  remarks: string;
  created_at: string;
}

export async function loadAccountResources(
  services: ApiServices,
  ledgerId: string,
): Promise<AccountResource[]> {
  const [vendors, accounts] = await Promise.all([
    services.dataProvider.getAllVendors(ledgerId),
    services.dataProvider.getAllAccounts(ledgerId),
  ]);
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const resources: AccountResource[] = [];
  for (const vendor of vendors) {
    const account = vendor.account_id ? byId.get(vendor.account_id) : undefined;
    if (!vendor.is_account || !account) continue;
    resources.push({
      id: account.id,
      vendor_id: vendor.id,
      name: vendor.name,
      currency: account.currency,
      starting_balance: account.starting_balance,
      type: account.type,
      credit_limit: account.credit_limit,
      remarks: account.remarks,
      created_at: account.created_at,
    });
  }
  return resources.sort((a, b) => a.name.localeCompare(b.name));
}

/** Balance in the account's own currency: starting balance plus past-dated transactions. */
export function accountBalance(
  account: AccountResource,
  transactions: Transaction[],
  now: Date,
): number {
  const today = todayKey(now);
  let balance = account.starting_balance || 0;
  for (const t of transactions) {
    if (t.account === account.name && dayOf(t.date) <= today) {
      balance += t.amount;
    }
  }
  return Math.round(balance * 100) / 100;
}

/** Currency conversion using the rates the app currently has stored. */
export const currentConverter = () => {
  const state = readCurrencyState();
  return { base: state.base, convert: makeConverter(state.rates) };
};

export const getTransactionInLedger = async (
  ledgerId: string,
  id: string,
): Promise<Transaction> => {
  const tx = await db.transactions.get(id);
  if (!tx || tx.user_id !== ledgerId) throw notFound(`Transaction "${id}"`);
  return tx;
};

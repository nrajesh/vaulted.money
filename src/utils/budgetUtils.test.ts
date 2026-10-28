import { describe, expect, it } from "vitest";
import type {
  Account,
  Budget,
  Transaction,
  Vendor,
} from "@/types/dataProvider";
import { calculateBudgetSpent } from "./budgetUtils";

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), 2, 12).toISOString();

const tx = (account: string, amount: number): Transaction =>
  ({
    id: `${account}-${amount}`,
    user_id: "l",
    date: today,
    amount,
    currency: "EUR",
    account,
    vendor: "Netflix",
    category: "Entertainment",
    created_at: today,
  }) as Transaction;

const budget = {
  id: "b",
  user_id: "l",
  category_id: "c",
  category_name: "Entertainment",
  target_amount: 90,
  spent_amount: 0,
  currency: "EUR",
  start_date: today,
  end_date: null,
  frequency: "Monthly",
  account_scope: "GROUP",
  account_scope_values: ["Credit Card"],
} as Budget;

const transactions = [tx("Visa", -14), tx("Checking", -50)];
const identity = (amount: number) => amount;

describe("calculateBudgetSpent with an account-type scope", () => {
  it("resolves types from plain account rows linked through the vendor", () => {
    const accounts = [
      { id: "acc-1", type: "Credit Card" },
      { id: "acc-2", type: "Checking" },
    ] as Account[];
    const vendors = [
      { id: "v1", name: "Visa", is_account: true, account_id: "acc-1" },
      { id: "v2", name: "Checking", is_account: true, account_id: "acc-2" },
    ] as Vendor[];
    expect(
      calculateBudgetSpent(
        budget,
        transactions,
        accounts,
        vendors,
        identity,
        "EUR",
      ),
    ).toBe(14);
  });

  it("resolves types from the payees the UI passes, whose id is the vendor id", () => {
    // Same shape as TransactionsContext.accounts: vendor fields plus account details.
    const payees = [
      {
        id: "v1",
        name: "Visa",
        is_account: true,
        account_id: "acc-1",
        type: "Credit Card",
      },
      {
        id: "v2",
        name: "Checking",
        is_account: true,
        account_id: "acc-2",
        type: "Checking",
      },
    ] as unknown as Account[];
    const vendors = payees as unknown as Vendor[];
    expect(
      calculateBudgetSpent(
        budget,
        transactions,
        payees,
        vendors,
        identity,
        "EUR",
      ),
    ).toBe(14);
  });
});

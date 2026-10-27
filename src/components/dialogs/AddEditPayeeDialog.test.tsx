import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { showError } from "@/utils/toast";
import AddEditPayeeDialog, { type Payee } from "./AddEditPayeeDialog";

/*
 * Editing a payee or account in the dialog, run against a real
 * LocalDataProvider so the tests check what ends up stored.
 */

// The payee form's Radix checkbox measures itself with ResizeObserver, which
// jsdom does not provide.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const provider = new LocalDataProvider();

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => provider,
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    availableCurrencies: [
      { code: "EUR", name: "Euro" },
      { code: "USD", name: "US Dollar" },
    ],
  }),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    invalidateAllData: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ activeLedger: { id: "home", name: "Home" } }),
}));

vi.mock("@/utils/toast", () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

/** Gives a ledger a Checking / Bakery transaction and a budget for each. */
const seed = async (ledgerId: string) => {
  const transaction = await provider.addTransaction({
    user_id: ledgerId,
    date: "2026-01-15",
    amount: -4,
    currency: "EUR",
    account: "Checking",
    vendor: "Bakery",
    category: "Food",
  });
  for (const [scope, name] of [
    ["vendor", "Bakery"],
    ["account", "Checking"],
  ] as const) {
    await provider.addBudget({
      user_id: ledgerId,
      category_id: "",
      category_name: name,
      budget_scope: scope,
      budget_scope_name: name,
      target_amount: 40,
      currency: "EUR",
      start_date: "2026-01-01T00:00:00.000Z",
      end_date: null,
      frequency: "Monthly",
    });
  }
  return transaction;
};

/** The dialog's `payee` prop for a stored vendor or account. */
const payeeNamed = async (name: string, ledgerId: string): Promise<Payee> => {
  const vendor = (await provider.getVendorByName(name, ledgerId))!;
  const account = (await provider.getAllAccounts(ledgerId)).find(
    (row) => row.id === vendor.account_id,
  );
  return {
    id: vendor.id,
    name: vendor.name,
    is_account: vendor.is_account,
    account_id: vendor.account_id ?? null,
    currency: account?.currency ?? null,
    starting_balance: account?.starting_balance ?? null,
    remarks: account?.remarks ?? null,
    running_balance: null,
    type: account?.type,
  } as Payee;
};

const renameInDialog = async (payee: Payee, newName: string) => {
  const onOpenChange = vi.fn();
  render(
    <AddEditPayeeDialog
      isOpen
      onOpenChange={onOpenChange}
      payee={payee}
      isAccountOnly={payee.is_account}
    />,
  );
  const nameInput = await screen.findByLabelText("Name");
  await waitFor(() => expect(nameInput).toHaveValue(payee.name));
  fireEvent.change(nameInput, { target: { value: newName } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  return onOpenChange;
};

const budgetNames = async (ledgerId: string) =>
  (await provider.getBudgetsWithSpending(ledgerId))
    .map((budget) => budget.budget_scope_name)
    .sort();

describe("AddEditPayeeDialog editing", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.open();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
  });

  it("renames an account in the active ledger's records only", async () => {
    const homeTransaction = await seed("home");
    const otherTransaction = await seed("other");

    const onOpenChange = await renameInDialog(
      await payeeNamed("Checking", "home"),
      "Current",
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(await provider.getTransactionById(homeTransaction.id)).toMatchObject(
      { account: "Current" },
    );
    expect(await budgetNames("home")).toEqual(["Bakery", "Current"]);
    expect(
      await provider.getTransactionById(otherTransaction.id),
    ).toMatchObject({ account: "Checking" });
    expect(await budgetNames("other")).toEqual(["Bakery", "Checking"]);
  });

  it("renames a payee in the active ledger's records only", async () => {
    const homeTransaction = await seed("home");
    const otherTransaction = await seed("other");

    const onOpenChange = await renameInDialog(
      await payeeNamed("Bakery", "home"),
      "Boulangerie",
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(await provider.getTransactionById(homeTransaction.id)).toMatchObject(
      { vendor: "Boulangerie" },
    );
    expect(await budgetNames("home")).toEqual(["Boulangerie", "Checking"]);
    expect(
      await provider.getTransactionById(otherTransaction.id),
    ).toMatchObject({ vendor: "Bakery" });
  });

  it("shows an error and stays open when the name is already taken", async () => {
    const homeTransaction = await seed("home");

    const onOpenChange = await renameInDialog(
      await payeeNamed("Checking", "home"),
      "Bakery",
    );

    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('A vendor or account named "Bakery"'),
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(await provider.getTransactionById(homeTransaction.id)).toMatchObject(
      { account: "Checking", vendor: "Bakery" },
    );
  });
});

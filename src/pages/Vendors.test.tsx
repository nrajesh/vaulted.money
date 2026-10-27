import type * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import type { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import type { ColumnDefinition } from "@/components/management/EntityTable";
import { showError, showSuccess } from "@/utils/toast";
import VendorsPage from "./Vendors";

/*
 * Renaming a vendor inline on the Vendors page, run against a real
 * LocalDataProvider so the tests check what ends up stored. The table layout
 * is replaced by a minimal stand-in that renders the page's own name cells
 * and its edit handler.
 */

const provider = new LocalDataProvider();
let vendorRows: Payee[] = [];

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => provider,
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    vendors: vendorRows,
    isLoadingVendors: false,
    invalidateAllData: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/hooks/usePayeeManagement", () => ({
  usePayeeManagement: () => ({
    handlePayeeNameClick: vi.fn(),
    selectedPayee: null,
  }),
}));

vi.mock("@/components/management/EntityManagementPage", () => ({
  default: ({
    data,
    columns,
    customEditHandler,
  }: {
    data: Payee[];
    columns: ColumnDefinition<Payee>[];
    customEditHandler: (item: Payee) => void;
  }) => (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {columns[0].cellRenderer?.(item) as React.ReactNode}
          <button type="button" onClick={() => customEditHandler(item)}>
            Edit {item.name}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

vi.mock("@/utils/toast", () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <VendorsPage />
    </QueryClientProvider>,
  );

const renameInline = (currentName: string, newName: string) => {
  fireEvent.click(screen.getByRole("button", { name: `Edit ${currentName}` }));
  const input = screen.getByDisplayValue(currentName);
  fireEvent.change(input, { target: { value: newName } });
  fireEvent.blur(input);
};

describe("Vendors page inline rename", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.open();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });
  });

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
    const vendor = (await provider.getVendorByName("Bakery", ledgerId))!;
    return { transaction, vendor };
  };

  it("renames the vendor in the ledger's transactions, not just the vendor list", async () => {
    const home = await seed("home");
    const other = await seed("other");
    vendorRows = [{ ...home.vendor, name: "Bakery" } as unknown as Payee];
    renderPage();

    renameInline("Bakery", "Boulangerie");

    await waitFor(() => expect(showSuccess).toHaveBeenCalled());
    expect(
      await provider.getTransactionById(home.transaction.id),
    ).toMatchObject({ vendor: "Boulangerie" });
    expect(
      await provider.getTransactionById(other.transaction.id),
    ).toMatchObject({ vendor: "Bakery" });
  });

  it("shows an error instead of creating a duplicate name", async () => {
    const home = await seed("home");
    vendorRows = [{ ...home.vendor, name: "Bakery" } as unknown as Payee];
    renderPage();

    renameInline("Bakery", "Checking");

    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining('A vendor or account named "Checking"'),
      ),
    );
    expect(await provider.getVendorByName("Bakery", "home")).toBeDefined();
  });
});

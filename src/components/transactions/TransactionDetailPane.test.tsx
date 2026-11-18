import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionDetailPane } from "./TransactionDetailPane";
import type { Transaction } from "@/types/dataProvider";

const make = (overrides: Partial<Transaction>): Transaction => ({
  id: "t1",
  user_id: "ledger-1",
  date: "2026-11-10T00:00:00.000Z",
  amount: -54.2,
  currency: "EUR",
  account: "Checking",
  vendor: "Albert Heijn",
  category: "Food",
  sub_category: "Groceries",
  remarks: "Weekly shop",
  created_at: "2026-11-10T00:00:00.000Z",
  ...overrides,
});

const selected = make({});
const earlier = [
  make({ id: "t2", date: "2026-11-03T00:00:00.000Z", amount: -31 }),
  make({ id: "t3", date: "2026-10-27T00:00:00.000Z", amount: -48 }),
  make({ id: "other", vendor: "Shell", amount: -60 }),
  make({ id: "proj", date: "2026-11-17T00:00:00.000Z", is_projected: true }),
];

const renderPane = (transaction: Transaction | null = selected) => {
  const handlers = {
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onSelect: vi.fn(),
  };
  render(
    <TransactionDetailPane
      transaction={transaction}
      allTransactions={[selected, ...earlier]}
      currencyFor={() => "EUR"}
      {...handlers}
    />,
  );
  return handlers;
};

describe("TransactionDetailPane", () => {
  it("asks the person to pick a transaction when none is selected", () => {
    renderPane(null);
    expect(
      screen.getByText("Select a transaction to see its details here."),
    ).toBeInTheDocument();
  });

  it("shows the payee, amount and every detail of the selection", () => {
    renderPane();
    const pane = screen.getByRole("region", { name: "Transaction details" });
    expect(
      within(pane).getByRole("heading", { name: "Albert Heijn" }),
    ).toBeInTheDocument();
    expect(within(pane).getByText(/54\.20/)).toBeInTheDocument();
    for (const value of ["Checking", "Food", "Groceries", "Weekly shop"]) {
      expect(within(pane).getByText(value)).toBeInTheDocument();
    }
  });

  it("lists earlier real payments to the same payee, newest first", async () => {
    const { onSelect } = renderPane();
    const history = screen.getAllByRole("button", {
      name: /Open the transaction from/,
    });
    // t2 and t3 only: not the selection, another payee or a projection.
    expect(history).toHaveLength(2);
    await userEvent.click(history[0]);
    expect(onSelect).toHaveBeenCalledWith("t2");
  });

  it("edits and duplicates the selection", async () => {
    const { onEdit, onDuplicate } = renderPane();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(onEdit).toHaveBeenCalledWith(selected);
    expect(onDuplicate).toHaveBeenCalledWith(selected);
  });

  it("asks before deleting", async () => {
    const { onDelete } = renderPane();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete" }),
    );
    expect(onDelete).toHaveBeenCalledWith(selected);
  });

  it("hides the actions for a projected (not yet real) transaction", () => {
    renderPane(make({ is_projected: true }));
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });
});

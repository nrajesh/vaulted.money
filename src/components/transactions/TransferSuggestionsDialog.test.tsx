import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Transaction } from "@/types/dataProvider";
import TransferSuggestionsDialog from "./TransferSuggestionsDialog";

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number, code?: string) => `${code ?? ""}${amount}`,
  }),
}));

const leg = (id: string, account: string, amount: number): Transaction =>
  ({
    id,
    account,
    amount,
    vendor: "x",
    currency: "USD",
    date: "2026-03-01T00:00:00.000Z",
    category: "Food",
    user_id: "l",
  }) as Transaction;

const pairs: [Transaction, Transaction][] = [
  [leg("a1", "Checking", -50), leg("a2", "Savings", 50)],
  [leg("b1", "Visa", -9), leg("b2", "Checking", 9)],
];

const renderDialog = () => {
  const onLink = vi.fn();
  render(
    <TransferSuggestionsDialog
      isOpen
      onOpenChange={() => {}}
      pairs={pairs}
      onLink={onLink}
    />,
  );
  return onLink;
};

describe("TransferSuggestionsDialog", () => {
  it("pre-selects nothing and cannot link until the user chooses", () => {
    renderDialog();
    expect(
      screen.getByRole("button", { name: /Link\s*selected/ }),
    ).toBeDisabled();
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).not.toBeChecked();
    }
  });

  it("links only the pairs the user ticked", async () => {
    const onLink = renderDialog();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Link Visa and Checking/ }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Link 1 selected/ }),
    );
    expect(onLink).toHaveBeenCalledWith([pairs[1]]);
  });

  it("can select every suggestion at once", async () => {
    const onLink = renderDialog();
    await userEvent.click(screen.getByLabelText(/Select all/));
    await userEvent.click(
      screen.getByRole("button", { name: /Link 2 selected/ }),
    );
    expect(onLink).toHaveBeenCalledWith(pairs);
  });
});

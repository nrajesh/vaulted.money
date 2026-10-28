import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ScheduledTransactionsTable } from "./ScheduledTransactionsTable";
import type { ScheduledTransaction } from "@/types/dataProvider";

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({ accountCurrencyMap: new Map() }),
}));
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({ formatCurrency: (n: number) => String(n) }),
}));

const schedule = (
  overrides: Partial<ScheduledTransaction>,
): ScheduledTransaction =>
  ({
    id: "s1",
    user_id: "u1",
    account: "Checking",
    vendor: "Gym",
    category: "Health",
    amount: -30,
    currency: "EUR",
    frequency: "1m",
    date: "2030-05-01T00:00:00.000Z",
    end_date: null,
    created_at: "2020-01-01T00:00:00.000Z",
    ...overrides,
  }) as ScheduledTransaction;

const renderTable = (transactions: ScheduledTransaction[]) =>
  render(
    <MemoryRouter>
      <ScheduledTransactionsTable transactions={transactions} />
    </MemoryRouter>,
  );

describe("ScheduledTransactionsTable ended marker", () => {
  it("marks a schedule whose next occurrence is past its end date", () => {
    renderTable([
      schedule({
        date: "2024-03-01T00:00:00.000Z",
        end_date: "2024-02-15T00:00:00.000Z",
      }),
    ]);
    // Mobile card and desktop row both render in jsdom.
    expect(screen.getAllByText("Ended").length).toBeGreaterThan(0);
  });

  it("does not mark a schedule that still has occurrences to come", () => {
    renderTable([
      schedule({ end_date: "2031-01-01T00:00:00.000Z" }),
      schedule({ id: "s2", end_date: null }),
    ]);
    expect(screen.queryByText("Ended")).toBeNull();
  });
});

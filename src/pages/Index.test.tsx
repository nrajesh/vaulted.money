import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/dataProvider";
import Index from "./Index";

const overviewState = vi.hoisted(() => ({
  excludeTransfers: false,
  transactions: [] as unknown[],
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({ transactions: overviewState.transactions }),
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => String(amount),
    convertBetweenCurrencies: (amount: number) => amount,
    selectedCurrency: "USD",
  }),
}));

vi.mock("@/hooks/transactions/useTransactionFilters", () => ({
  useTransactionFilters: () => ({
    searchTerm: "",
    selectedAccounts: [],
    selectedCategories: [],
    selectedSubCategories: [],
    selectedVendors: [],
    dateRange: undefined,
    excludeTransfers: overviewState.excludeTransfers,
    minAmount: undefined,
    maxAmount: undefined,
    transactionType: undefined,
  }),
}));

vi.mock("@/components/filters/SearchFilterBar", () => ({
  SearchFilterBar: () => null,
}));
vi.mock("@/components/dashboard/RunwayCard", () => ({
  RunwayCard: () => null,
}));
vi.mock("@/components/dashboard/BudgetStatusCard", () => ({
  BudgetStatusCard: () => null,
}));
vi.mock("@/components/dashboard/StackedCategoryChart", () => ({
  StackedCategoryChart: () => null,
}));
vi.mock("@/components/dashboard/RecentActivityFeed", () => ({
  RecentActivityFeed: () => null,
}));
vi.mock("@/components/dashboard/ConsolidatedMetricsCard", () => ({
  ConsolidatedMetricsCard: ({
    income,
    expenses,
    netWorth,
  }: {
    income: string;
    expenses: string;
    netWorth: string;
  }) => (
    <div data-testid="overview-metrics">
      {income}/{expenses}/{netWorth}
    </div>
  ),
}));

const makeTransaction = (
  id: string,
  amount: number,
  category: string,
): Transaction => ({
  id,
  user_id: "test-ledger",
  date: "2025-01-15",
  amount,
  currency: "USD",
  account: "Checking",
  vendor: "Example",
  category,
  created_at: "2025-01-15T12:00:00.000Z",
});

describe("Overview totals", () => {
  it("includes transfers only when the exclude-transfers filter is off", () => {
    overviewState.transactions = [
      makeTransaction("income", 100, "Salary"),
      makeTransaction("expense", -40, "Food"),
      makeTransaction("transfer-in", 50, "Transfer"),
      makeTransaction("transfer-out", -25, "Transfer"),
      makeTransaction("uncategorized", 15, ""),
      {
        ...makeTransaction("linked-transfer", 30, "Other"),
        transfer_id: "pair-1",
      },
    ];
    overviewState.excludeTransfers = false;

    const { rerender } = render(<Index />);
    expect(screen.getByTestId("overview-metrics")).toHaveTextContent(
      "195/65/130",
    );

    overviewState.excludeTransfers = true;
    rerender(<Index />);
    expect(screen.getByTestId("overview-metrics")).toHaveTextContent(
      "115/40/75",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import TransactionTable from "@/components/transactions/TransactionTable";
import { BrowserRouter } from "react-router-dom";
import { Transaction } from "@/types/dataProvider";

// Mocks
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "USD",
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTableSort", () => ({
  useTableSort: ({ data }: { data: unknown[] }) => ({
    sortedData: data,
    sortConfig: { key: "date", direction: "desc" },
    handleHeaderClick: vi.fn(),
    handleHeaderRightClick: vi.fn(),
  }),
}));

describe("TransactionTable", () => {
  const mockTransactions: Transaction[] = [
    {
      id: "1",
      date: "2023-10-27T00:00:00.000Z",
      amount: 100,
      account: "Test Account",
      vendor: "Test Vendor",
      category: "Utilities",
      sub_category: "Electric",
      remarks: "Test Transaction",
      currency: "USD",
      user_id: "user1",
      created_at: "2023-01-01T00:00:00.000Z",
      is_scheduled_origin: true,
      recurrence_id: "rec1",
    },
    {
      id: "2",
      date: "2023-10-27T00:00:00.000Z",
      amount: 50,
      account: "Bank A",
      vendor: "Bank B",
      category: "Transfer",
      transfer_id: "transfer123",
      currency: "USD",
      user_id: "user1",
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  it("renders 'Go to Scheduled Transaction' button with aria-label", () => {
    render(
      <BrowserRouter>
        <TransactionTable
          transactions={mockTransactions}
          loading={false}
          onRefresh={vi.fn()}
          onDeleteTransactions={vi.fn()}
          onAddTransaction={vi.fn()}
        />
      </BrowserRouter>,
    );

    const scheduleButtons = screen.getAllByLabelText(
      "Go to Scheduled Transaction",
    );
    expect(scheduleButtons.length).toBeGreaterThan(0);
    expect(scheduleButtons[0].tagName).toBe("BUTTON");
  });

  it("renders 'Unlink Transfer' button with aria-label", () => {
    render(
      <BrowserRouter>
        <TransactionTable
          transactions={mockTransactions}
          loading={false}
          onRefresh={vi.fn()}
          onDeleteTransactions={vi.fn()}
          onAddTransaction={vi.fn()}
          onUnlinkTransaction={vi.fn()}
        />
      </BrowserRouter>,
    );

    const unlinkButtons = screen.getAllByLabelText("Unlink Transfer");
    expect(unlinkButtons.length).toBeGreaterThan(0);
    expect(unlinkButtons[0].tagName).toBe("BUTTON");
  });
  it("hides the empty selection bar at every size until something is selected", () => {
    render(
      <BrowserRouter>
        <TransactionTable
          transactions={mockTransactions}
          loading={false}
          onRefresh={vi.fn()}
          onDeleteTransactions={vi.fn()}
          onAddTransaction={vi.fn()}
        />
      </BrowserRouter>,
    );
    const bar = screen.getByText(/0 selected/).closest(".app-table-toolbar");
    expect(bar).toHaveClass("hidden");
    // No breakpoint brings the empty bar back (it showed on desktop).
    expect(bar?.className).not.toMatch(/\b(sm|md|lg|xl):block\b/);
  });
});

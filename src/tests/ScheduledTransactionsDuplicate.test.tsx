import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ScheduledTransaction } from "@/types/dataProvider";
import { duplicateScheduledTransactionPayload } from "@/utils/duplicateTransaction";
import ScheduledTransactionsPage from "@/pages/ScheduledTransactions";

/*
 * Duplicate on the Upcoming bills screen adds a copy of a schedule through
 * the context's addScheduledTransaction: the same payee, amount, account,
 * category, interval and dates, under a new id.
 */

const rent: ScheduledTransaction = {
  id: "sched-rent",
  user_id: "ledger-1",
  account: "Everyday Account",
  vendor: "Hillside Lettings",
  category: "Housing",
  sub_category: "Rent",
  amount: -900,
  currency: "EUR",
  date: "2026-12-01T12:00:00.000Z",
  frequency: "1m",
  end_date: "2027-12-01T12:00:00.000Z",
  remarks: "Flat rent",
  created_at: "2026-01-01T12:00:00.000Z",
  last_processed: "2026-11-01T12:00:00.000Z",
  ignored_dates: ["2026-08-01T12:00:00.000Z"],
};

const transfer: ScheduledTransaction = {
  id: "sched-savings",
  user_id: "ledger-1",
  account: "Everyday Account",
  vendor: "Rainy Day Savings",
  category: "Transfer",
  amount: -100,
  currency: "EUR",
  date: "2026-12-05T12:00:00.000Z",
  frequency: "1m",
  created_at: "2026-01-01T12:00:00.000Z",
  transfer_id: "transfer-1",
};

// A stand-in store: the real provider gives every added schedule a new id.
let stored: ScheduledTransaction[] = [];
const addScheduledTransaction = vi.fn(
  async (schedule: Omit<ScheduledTransaction, "id" | "created_at">) => {
    stored.push({
      ...schedule,
      id: `new-${stored.length}`,
      created_at: "2026-11-22T12:00:00.000Z",
    });
  },
);

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    scheduledTransactions: [rent, transfer],
    addScheduledTransaction,
    updateScheduledTransaction: vi.fn(),
    deleteScheduledTransaction: vi.fn(),
    deleteMultipleScheduledTransactions: vi.fn(),
    unlinkScheduledTransaction: vi.fn(),
    addTransaction: vi.fn(),
    invalidateAllData: vi.fn(),
    accounts: [],
    vendors: [],
    categories: [],
    allSubCategories: [],
    accountCurrencyMap: new Map([["Everyday Account", "EUR"]]),
  }),
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => `€${amount}`,
  }),
}));

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
  },
}));

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

// Chrome the list does not depend on.
vi.mock("@/components/help/FeatureHint", () => ({ FeatureHint: () => null }));
vi.mock("@/components/layout/PageActionBar", () => ({
  PageActionBar: () => null,
}));
vi.mock("@/components/scheduled-transactions/ScheduledSearchFilterBar", () => ({
  ScheduledSearchFilterBar: () => null,
}));
vi.mock(
  "@/components/scheduled-transactions/AddEditScheduledTransactionDialog",
  () => ({ AddEditScheduledTransactionDialog: () => null }),
);
vi.mock("@/components/scheduled-transactions/SmartScheduleDialog", () => ({
  SmartScheduleDialog: () => null,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ScheduledTransactionsPage />
    </MemoryRouter>,
  );

const phoneCard = (payee: string) =>
  screen
    .getAllByText(payee)
    .find((element) => element.closest("[data-swipe-card]"))
    ?.closest("[data-swipe-card]") as HTMLElement;

describe("Duplicating a scheduled transaction", () => {
  beforeEach(() => {
    stored = [];
    vi.clearAllMocks();
  });

  it("creates a new schedule with the same fields under a new id", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      within(phoneCard("Hillside Lettings")).getByRole("button", {
        name: "More actions for Hillside Lettings",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );

    expect(addScheduledTransaction).toHaveBeenCalledTimes(1);
    const payload = addScheduledTransaction.mock.calls[0][0];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");

    expect(stored).toHaveLength(1);
    const copy = stored[0];
    expect(copy.id).not.toBe(rent.id);
    expect(copy).toMatchObject({
      user_id: rent.user_id,
      vendor: rent.vendor,
      account: rent.account,
      category: rent.category,
      sub_category: rent.sub_category,
      amount: rent.amount,
      currency: rent.currency,
      frequency: rent.frequency,
      date: rent.date,
      end_date: rent.end_date,
      remarks: rent.remarks,
      ignored_dates: rent.ignored_dates,
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Scheduled transaction duplicated",
    );
  });

  it("does not copy a transfer link: the context links the copy to a new pair", () => {
    const payload = duplicateScheduledTransactionPayload(transfer);
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
    expect(payload.transfer_id).toBeUndefined();
    expect(payload).toMatchObject({
      vendor: "Rainy Day Savings",
      account: "Everyday Account",
      amount: -100,
      frequency: "1m",
      date: transfer.date,
    });
  });
});

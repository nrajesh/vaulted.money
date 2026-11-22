import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import TransactionTable from "@/components/transactions/TransactionTable";
import { BrowserRouter } from "react-router-dom";
import { Transaction } from "@/types/dataProvider";
import { duplicateTransactionPayload } from "@/utils/duplicateTransaction";
import { firePointer, swipe } from "@/tests/pointerEvents";

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

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

/*
 * Phone transaction cards: swipe left reveals Delete, swipe right reveals
 * Duplicate, long press and the "…" button open the same menu the card's
 * right-click menu offered before. The desktop table rows are unchanged.
 */
describe("TransactionTable phone card gestures", () => {
  const groceries: Transaction = {
    id: "t-groceries",
    date: "2023-10-20T12:00:00.000Z",
    amount: -42.5,
    account: "Everyday Account",
    vendor: "Corner Grocer",
    category: "Food",
    remarks: "Weekly shop",
    currency: "USD",
    user_id: "user1",
    created_at: "2023-01-01T00:00:00.000Z",
  };
  const projected: Transaction = {
    id: "proj_rent",
    date: "2099-01-01T12:00:00.000Z",
    amount: -900,
    account: "Everyday Account",
    vendor: "Hillside Lettings",
    category: "Housing",
    currency: "USD",
    user_id: "user1",
    created_at: "2023-01-01T00:00:00.000Z",
    is_projected: true,
    recurrence_id: "rec-rent",
  };

  const renderTable = (
    props: Partial<React.ComponentProps<typeof TransactionTable>> = {},
  ) => {
    const handlers = {
      onDeleteTransactions: vi.fn(),
      onAddTransaction: vi.fn(),
      onRowDoubleClick: vi.fn(),
      onScheduleTransactions: vi.fn(),
    };
    render(
      <BrowserRouter>
        <TransactionTable
          transactions={[groceries, projected]}
          loading={false}
          onRefresh={vi.fn()}
          view="cards"
          {...handlers}
          {...props}
        />
      </BrowserRouter>,
    );
    return handlers;
  };

  /** The payee name inside the phone card (the desktop row repeats it). */
  const payeeIn = (name: string) =>
    screen
      .getAllByText(name)
      .find((element) => element.closest("[data-swipe-card]")) as HTMLElement;
  const card = (name: string) =>
    payeeIn(name).closest("[data-swipe-card]") as HTMLElement;
  const swipeLayer = (name: string) =>
    card(name).querySelector("[data-swipe-content]") as HTMLElement;
  const swipeLeft = (name: string) =>
    swipe(payeeIn(name), { x: 250, y: 100 }, { x: 120, y: 104 });
  const swipeRight = (name: string) =>
    swipe(payeeIn(name), { x: 100, y: 100 }, { x: 230, y: 100 });

  it("swiping a phone card left reveals Delete and tapping it calls onDeleteTransactions with that id", async () => {
    const user = userEvent.setup();
    const { onDeleteTransactions } = renderTable();

    expect(
      within(card("Corner Grocer")).queryByRole("button", {
        name: "Delete Corner Grocer",
      }),
    ).toBeNull();
    swipeLeft("Corner Grocer");
    // Revealing alone deletes nothing.
    expect(onDeleteTransactions).not.toHaveBeenCalled();

    await user.click(
      within(card("Corner Grocer")).getByRole("button", {
        name: "Delete Corner Grocer",
      }),
    );
    expect(onDeleteTransactions).toHaveBeenCalledWith([{ id: "t-groceries" }]);
  });

  it("swiping right reveals Duplicate and tapping it calls onAddTransaction with duplicateTransactionPayload(transaction)", async () => {
    const user = userEvent.setup();
    const { onAddTransaction, onRowDoubleClick } = renderTable();

    swipeRight("Corner Grocer");
    expect(onAddTransaction).not.toHaveBeenCalled();
    await user.click(
      within(card("Corner Grocer")).getByRole("button", {
        name: "Duplicate Corner Grocer",
      }),
    );
    expect(onAddTransaction).toHaveBeenCalledWith(
      duplicateTransactionPayload(groceries),
    );
    // The tap on the revealed button does not also open the card.
    expect(onRowDoubleClick).not.toHaveBeenCalled();
  });

  it('the "…" menu lists the same actions as before (select, edit, schedule, duplicate, delete)', async () => {
    const user = userEvent.setup();
    const { onRowDoubleClick, onScheduleTransactions } = renderTable();

    await user.click(
      screen.getByRole("button", { name: "More actions for Corner Grocer" }),
    );
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Select",
      "Edit",
      "Schedule",
      "Duplicate",
      "Delete",
    ]);
    // Opening the menu never opens the card underneath.
    expect(onRowDoubleClick).not.toHaveBeenCalled();

    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1);
    expect(onRowDoubleClick.mock.calls[0][0]).toBe(groceries);

    await user.click(
      screen.getByRole("button", { name: "More actions for Corner Grocer" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Schedule" }));
    expect(onScheduleTransactions).toHaveBeenCalledWith(
      [groceries],
      expect.any(Function),
    );
  });

  it("projected transactions have no Edit action (Delete skips the occurrence, as the menu did)", async () => {
    const user = userEvent.setup();
    const { onDeleteTransactions } = renderTable();

    await user.click(
      screen.getByRole("button", {
        name: "More actions for Hillside Lettings",
      }),
    );
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Select",
      "Edit Schedule",
      "Duplicate",
      "Delete",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDeleteTransactions).toHaveBeenCalledWith([{ id: "proj_rent" }]);
  });

  it("long press opens the menu", async () => {
    vi.useFakeTimers();
    renderTable();
    firePointer(payeeIn("Corner Grocer"), "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    firePointer(payeeIn("Corner Grocer"), "pointerUp", { x: 200, y: 100 });
    vi.useRealTimers();

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toContain("Duplicate");
  });

  it("a tap on the card still edits as before, and a projected card still does not", async () => {
    const user = userEvent.setup();
    const { onRowDoubleClick } = renderTable();

    await user.click(payeeIn("Hillside Lettings"));
    expect(onRowDoubleClick).not.toHaveBeenCalled();

    await user.click(payeeIn("Corner Grocer"));
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1);
    expect(onRowDoubleClick.mock.calls[0][0]).toBe(groceries);
  });

  it("a tap on the card opens the details panel when onCardClick is given", async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    const { onRowDoubleClick } = renderTable({ onCardClick });

    await user.click(payeeIn("Corner Grocer"));
    expect(onCardClick).toHaveBeenCalledWith(groceries);
    expect(onRowDoubleClick).not.toHaveBeenCalled();
  });

  it("checkboxes and bulk select still work, and a card does not swipe while something is selected", async () => {
    const user = userEvent.setup();
    const { onDeleteTransactions, onRowDoubleClick } = renderTable();

    await user.click(
      within(card("Corner Grocer")).getByRole("checkbox", {
        name: "Select transaction: Corner Grocer",
      }),
    );
    expect(onRowDoubleClick).not.toHaveBeenCalled();
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    swipeLeft("Hillside Lettings");
    expect(swipeLayer("Hillside Lettings").style.transform).toBe(
      "translateX(0px)",
    );

    await user.click(screen.getByRole("button", { name: /^Delete selected/ }));
    expect(onDeleteTransactions).toHaveBeenCalledWith([
      { id: "t-groceries", transfer_id: undefined },
    ]);
  });

  it("the card keeps its rounded shape while it slides", () => {
    renderTable();
    expect(card("Corner Grocer").className).toMatch(/\brounded-xl\b/);
  });
});

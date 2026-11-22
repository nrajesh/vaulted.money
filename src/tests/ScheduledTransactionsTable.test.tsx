import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest"; // Ensure jest-dom matchers are available
import { ScheduledTransactionsTable } from "@/components/scheduled-transactions/ScheduledTransactionsTable";
import { BrowserRouter } from "react-router-dom";
import { ScheduledTransaction } from "@/types/dataProvider";
import { swipe } from "@/tests/pointerEvents";

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

// Mock the contexts
vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    accountCurrencyMap: new Map([["Test Account", "USD"]]),
  }),
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => `$${amount}`,
  }),
}));

describe("ScheduledTransactionsTable", () => {
  const mockTransactions: ScheduledTransaction[] = [
    {
      id: "1",
      date: "2023-10-27T00:00:00.000Z",
      frequency: "Monthly",
      amount: 100,
      account: "Test Account",
      vendor: "Test Vendor",
      category: "Utilities",
      sub_category: "Electric",
      remarks: "Test Transaction",
      currency: "USD",
      user_id: "user1",
      created_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      date: "2023-10-27T00:00:00.000Z",
      frequency: "Monthly",
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

  it("renders transactions correctly", () => {
    render(
      <BrowserRouter>
        <ScheduledTransactionsTable transactions={mockTransactions} />
      </BrowserRouter>,
    );
    expect(screen.getAllByText("Test Vendor")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Test Account")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Utilities")[0]).toBeInTheDocument();
  });

  it("renders interactive elements as buttons", () => {
    render(
      <BrowserRouter>
        <ScheduledTransactionsTable transactions={mockTransactions} />
      </BrowserRouter>,
    );

    // Vendor should be a button
    const vendorButton = screen
      .getAllByText("Test Vendor")
      .find((el) => el.closest("button"))
      ?.closest("button");
    expect(vendorButton).toBeInTheDocument();
    expect(vendorButton).toHaveAttribute("type", "button");

    // Account should be a button
    const accountButton = screen
      .getAllByText("Test Account")
      .find((el) => el.closest("button"))
      ?.closest("button");
    expect(accountButton).toBeInTheDocument();
    expect(accountButton).toHaveAttribute("type", "button");

    // Category should be a element
    const categoryButton = screen.getAllByText("Utilities")[0];
    expect(categoryButton).toBeInTheDocument();
    // Badge variants apply classes, so we check if it is a button
  });

  it("renders unlink button with aria-label", () => {
    // We need to provide onUnlink prop to see the button usually, or just check the second transaction which has transfer_id
    // The button is rendered if transaction.transfer_id is present
    render(
      <BrowserRouter>
        <ScheduledTransactionsTable
          transactions={mockTransactions}
          onUnlink={() => {}}
        />
      </BrowserRouter>,
    );

    const unlinkButtons = screen.getAllByLabelText("Unlink Pair");
    expect(unlinkButtons.length).toBeGreaterThan(0);
    expect(unlinkButtons[0]).toBeInTheDocument();
  });

  describe("phone card gestures", () => {
    const renderWithHandlers = () => {
      const handlers = {
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onDuplicate: vi.fn(),
        onProcessToday: vi.fn(),
      };
      render(
        <BrowserRouter>
          <ScheduledTransactionsTable
            transactions={mockTransactions}
            {...handlers}
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

    it("the date and frequency wrap instead of sharing fixed columns (Larger text, 360px)", () => {
      renderWithHandlers();
      const facts = card("Test Vendor").querySelector(
        "[data-schedule-facts]",
      ) as HTMLElement;
      expect(facts).not.toBeNull();
      expect(facts.className).toContain("flex-wrap");
      expect(facts.className).not.toContain("grid-cols-2");
    });

    it("swipe left reveals Delete and tapping it deletes that schedule", async () => {
      const user = userEvent.setup();
      const { onDelete } = renderWithHandlers();

      expect(
        within(card("Test Vendor")).queryByRole("button", {
          name: "Delete Test Vendor",
        }),
      ).toBeNull();
      swipe(payeeIn("Test Vendor"), { x: 250, y: 100 }, { x: 120, y: 104 });
      expect(onDelete).not.toHaveBeenCalled();
      await user.click(
        within(card("Test Vendor")).getByRole("button", {
          name: "Delete Test Vendor",
        }),
      );
      expect(onDelete).toHaveBeenCalledWith("1");
    });

    it("swipe right reveals Duplicate and tapping calls onDuplicate with the schedule", async () => {
      const user = userEvent.setup();
      const { onDuplicate } = renderWithHandlers();

      swipe(payeeIn("Test Vendor"), { x: 100, y: 100 }, { x: 230, y: 100 });
      expect(onDuplicate).not.toHaveBeenCalled();
      await user.click(
        within(card("Test Vendor")).getByRole("button", {
          name: "Duplicate Test Vendor",
        }),
      );
      expect(onDuplicate).toHaveBeenCalledWith(mockTransactions[0]);
    });

    it("Duplicate appears in the card menu, between Edit and Delete", async () => {
      const user = userEvent.setup();
      const { onDuplicate } = renderWithHandlers();

      await user.click(
        within(card("Test Vendor")).getByRole("button", {
          name: "More actions for Test Vendor",
        }),
      );
      const items = await screen.findAllByRole("menuitem");
      expect(items.map((item) => item.textContent?.trim())).toEqual([
        "Make happen today",
        "Edit",
        "Duplicate",
        "Delete",
      ]);
      await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
      expect(onDuplicate).toHaveBeenCalledWith(mockTransactions[0]);
    });

    it("Duplicate appears in the desktop row menu", async () => {
      const user = userEvent.setup();
      const { onDuplicate } = renderWithHandlers();

      const desktopMenuButtons = screen.getAllByRole("button", {
        name: "Open menu",
      });
      await user.click(desktopMenuButtons[0]);
      const items = await screen.findAllByRole("menuitem");
      expect(items.map((item) => item.textContent?.trim())).toEqual([
        "Make happen today",
        "Edit",
        "Duplicate",
        "Delete",
      ]);
      await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
      expect(onDuplicate).toHaveBeenCalledWith(mockTransactions[0]);
    });

    it("a card does not swipe while something is selected", async () => {
      const user = userEvent.setup();
      renderWithHandlers();

      await user.click(
        within(card("Test Vendor")).getByRole("checkbox", {
          name: "Select scheduled transaction for Test Vendor",
        }),
      );
      swipe(payeeIn("Bank B"), { x: 250, y: 100 }, { x: 120, y: 104 });
      expect(
        (card("Bank B").querySelector("[data-swipe-content]") as HTMLElement)
          .style.transform,
      ).toBe("translateX(0px)");
    });
  });
});

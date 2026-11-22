import { describe, it, expect, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import type { Budget } from "@/types/budgets";
import { firePointer, swipe } from "@/tests/pointerEvents";

/*
 * Budget and goal cards: swipe left reveals Delete (the same handler as the
 * inline Delete button, which opens the page's confirmation), swipe right
 * reveals Edit (the same handler as the inline Edit button), and a long press
 * opens a menu with both. The inline buttons stay.
 */

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({ accounts: [] }),
}));

const spending: Budget = {
  id: "budget-food",
  user_id: "user1",
  category_id: "cat-food",
  category_name: "Groceries",
  target_amount: 400,
  spent_amount: 120,
  currency: "USD",
  start_date: "2026-11-01",
  end_date: null,
  frequency: "Monthly",
};

const goal: Budget = {
  ...spending,
  id: "budget-holiday",
  category_name: "Holiday fund",
  is_goal: true,
  target_date: "2027-06-30",
  goal_context: "Savings",
};

function renderCard(
  budget: Budget,
  props: Partial<React.ComponentProps<typeof BudgetCard>> = {},
) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <TooltipProvider>
        <BudgetCard
          budget={budget}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSelection={vi.fn()}
          {...props}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
  return { onEdit, onDelete };
}

const nameIn = (name: string) => screen.getByText(name);
const card = (name: string) =>
  nameIn(name).closest("[data-swipe-card]") as HTMLElement;
const swipeLayer = (name: string) =>
  card(name).querySelector("[data-swipe-content]") as HTMLElement;
const swipeLeft = (name: string) =>
  swipe(nameIn(name), { x: 250, y: 100 }, { x: 120, y: 104 });
const swipeRight = (name: string) =>
  swipe(nameIn(name), { x: 100, y: 100 }, { x: 230, y: 100 });

describe.each([
  ["budget", spending],
  ["goal", goal],
])("%s card gestures", (_kind, budget) => {
  const name = budget.category_name;

  it("swiping left reveals Delete; tapping it calls the inline Delete's handler (the existing confirmation)", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderCard(budget);

    expect(card(name)).not.toBeNull();
    expect(
      within(card(name)).queryByRole("button", { name: "Delete" }),
    ).toBeNull();
    swipeLeft(name);
    // Revealing alone deletes nothing.
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(
      within(card(name)).getByRole("button", { name: "Delete" }),
    );
    expect(onDelete).toHaveBeenCalledWith(budget.id);

    // The inline Delete button stays and uses the same handler.
    await user.click(screen.getByRole("button", { name: "Delete budget" }));
    expect(onDelete).toHaveBeenLastCalledWith(budget.id);
    expect(onDelete).toHaveBeenCalledTimes(2);
  });

  it("swiping right reveals Edit; tapping it calls the inline Edit's handler", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderCard(budget);

    swipeRight(name);
    expect(onEdit).not.toHaveBeenCalled();
    await user.click(within(card(name)).getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(budget);
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Edit budget" }),
    ).toBeInTheDocument();
  });

  it("a long press opens a menu with Edit and Delete", async () => {
    vi.useFakeTimers();
    renderCard(budget);
    firePointer(nameIn(name), "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    firePointer(nameIn(name), "pointerUp", { x: 200, y: 100 });
    vi.useRealTimers();

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
  });

  it("does not swipe while budgets are selected", () => {
    renderCard(budget, { selectionActive: true });
    swipeLeft(name);
    expect(swipeLayer(name).style.transform).toBe("translateX(0px)");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetPaginationWrapper } from "./BudgetPaginationWrapper";
import type { Budget } from "@/types/budgets";

// The cards themselves are not under test: render just the name.
vi.mock("./BudgetCard", () => ({
  BudgetCard: ({ budget }: { budget: Budget }) => (
    <div>{budget.category_name}</div>
  ),
}));

const budgets = Array.from(
  { length: 6 },
  (_, i) =>
    ({ id: `b${i}`, category_name: `Budget ${i + 1}` }) as unknown as Budget,
);

function renderOnPageTwo() {
  render(
    <BudgetPaginationWrapper
      budgets={budgets}
      isLoading={false}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  return screen.getByText("Budget 4").parentElement as HTMLElement;
}

function drag(
  grid: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  fireEvent.touchStart(grid, {
    targetTouches: [{ clientX: from.x, clientY: from.y }],
  });
  fireEvent.touchMove(grid, {
    targetTouches: [{ clientX: to.x, clientY: to.y }],
  });
  fireEvent.touchEnd(grid);
}

describe("BudgetPaginationWrapper touch paging", () => {
  it("stays on the page when scrolling down with a little sideways drift", () => {
    const grid = renderOnPageTwo();
    // A long scroll down whose thumb drifts 80px to the right.
    drag(grid, { x: 150, y: 600 }, { x: 230, y: 150 });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("still goes back a page on a clear swipe right", () => {
    const grid = renderOnPageTwo();
    drag(grid, { x: 60, y: 300 }, { x: 260, y: 320 });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });
});

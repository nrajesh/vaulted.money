import { describe, it, expect, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  EntityCardGrid,
  type ColumnDefinition,
} from "@/components/management/EntityCardGrid";
import { firePointer, swipe } from "@/tests/pointerEvents";

/*
 * Accounts, payees and categories share EntityCardGrid. Swipe left reveals
 * Delete (handleDeleteClick, which opens the page's ConfirmationDialog), swipe
 * right reveals Edit (handleEditClick). Items that cannot be deleted do not
 * swipe. The inline buttons, the full-card details button and the checkboxes
 * keep working, and nothing swipes while rows are selected.
 */

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

type Row = { id: string; name: string; total: string };

const rows: Row[] = [
  { id: "r-checking", name: "Everyday Checking", total: "120.00" },
  { id: "r-transfer", name: "Transfer", total: "0.00" },
];

const columns: ColumnDefinition<Row>[] = [
  { header: "Name", accessor: "name" },
  { header: "Total", accessor: "total", card: "primary" },
];

function renderGrid(
  props: Partial<React.ComponentProps<typeof EntityCardGrid<Row>>> = {},
) {
  const handlers = {
    handleEditClick: vi.fn(),
    handleDeleteClick: vi.fn(),
    handleRowSelect: vi.fn(),
  };
  render(
    <TooltipProvider>
      <EntityCardGrid<Row>
        data={rows}
        columns={columns}
        isLoading={false}
        selectedRows={[]}
        isEditing={() => false}
        isUpdating={false}
        isDeletable={(item) => item.name !== "Transfer"}
        {...handlers}
        {...props}
      />
    </TooltipProvider>,
  );
  return handlers;
}

const detailsButton = (name: string) =>
  screen.getByRole("button", { name: `Details: ${name}` });
const card = (name: string) =>
  detailsButton(name).closest("[data-swipe-card]") as HTMLElement;
const swipeLayer = (name: string) =>
  card(name).querySelector("[data-swipe-content]") as HTMLElement;
// Swipes start on the full-card details button, which covers the card.
const swipeLeft = (name: string) =>
  swipe(detailsButton(name), { x: 250, y: 100 }, { x: 120, y: 104 });
const swipeRight = (name: string) =>
  swipe(detailsButton(name), { x: 100, y: 100 }, { x: 230, y: 100 });

describe("EntityCardGrid card gestures (accounts, payees, categories)", () => {
  it("each row is still a list item holding an .app-mobile-row card", () => {
    renderGrid();
    const item = card("Everyday Checking").closest("li");
    expect(item).not.toBeNull();
    expect(item!.querySelector(".app-mobile-row")).not.toBeNull();
  });

  it("swipe left reveals Delete and tapping it calls handleDeleteClick (the existing confirmation)", async () => {
    const user = userEvent.setup();
    const { handleDeleteClick, handleEditClick } = renderGrid();

    swipeLeft("Everyday Checking");
    expect(handleDeleteClick).not.toHaveBeenCalled();
    // The swipe did not open the details dialog.
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(
      within(card("Everyday Checking")).getByRole("button", {
        name: "Delete",
      }),
    );
    expect(handleDeleteClick).toHaveBeenCalledWith(rows[0]);
    expect(handleEditClick).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("swipe right reveals Edit and tapping it calls handleEditClick", async () => {
    const user = userEvent.setup();
    const { handleEditClick, handleDeleteClick } = renderGrid();

    swipeRight("Everyday Checking");
    expect(handleEditClick).not.toHaveBeenCalled();
    await user.click(
      within(card("Everyday Checking")).getByRole("button", { name: "Edit" }),
    );
    expect(handleEditClick).toHaveBeenCalledWith(rows[0]);
    expect(handleDeleteClick).not.toHaveBeenCalled();
  });

  it("a non-deletable item has no left swipe and its Edit stays disabled", () => {
    renderGrid();
    swipeLeft("Transfer");
    expect(swipeLayer("Transfer").style.transform).toBe("translateX(0px)");
    expect(
      within(card("Transfer")).queryByRole("button", { name: "Delete" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Edit Transfer" }),
    ).toBeDisabled();
  });

  it("a long press opens a menu with Edit and Delete", async () => {
    vi.useFakeTimers();
    renderGrid();
    // Held on to: the open menu hides the rest of the page from role queries.
    const surface = detailsButton("Everyday Checking");
    firePointer(surface, "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    firePointer(surface, "pointerUp", { x: 200, y: 100 });
    vi.useRealTimers();

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
    // The long press did not also open the details dialog.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("tapping the full-card button still opens the details dialog", async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(detailsButton("Everyday Checking"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("the inline Edit and Delete buttons stay", async () => {
    const user = userEvent.setup();
    const { handleEditClick, handleDeleteClick } = renderGrid();
    await user.click(
      screen.getByRole("button", { name: "Edit Everyday Checking" }),
    );
    expect(handleEditClick).toHaveBeenCalledWith(rows[0]);
    await user.click(
      screen.getByRole("button", { name: "Delete Everyday Checking" }),
    );
    expect(handleDeleteClick).toHaveBeenCalledWith(rows[0]);
  });

  it("checkboxes still select, and nothing swipes while rows are selected", async () => {
    const user = userEvent.setup();
    const { handleRowSelect } = renderGrid({ selectedRows: ["r-checking"] });

    await user.click(
      within(card("Everyday Checking")).getByRole("checkbox", {
        name: "Select card",
      }),
    );
    expect(handleRowSelect).toHaveBeenCalledWith("r-checking", false);

    swipeLeft("Everyday Checking");
    expect(swipeLayer("Everyday Checking").style.transform).toBe(
      "translateX(0px)",
    );
  });
});

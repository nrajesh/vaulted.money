import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationalSearchInput } from "./ConversationalSearchInput";

// cmdk measures its list with these; jsdom has neither.
beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

const props = {
  categories: [{ name: "Groceries", slug: "groceries" }],
  accounts: [{ name: "Primary Checking", slug: "primary-checking" }],
  vendors: [{ name: "Starbucks", slug: "starbucks" }],
};

const openAndType = async (text: string) => {
  const onUpdate = vi.fn();
  render(<ConversationalSearchInput onUpdate={onUpdate} {...props} />);
  await userEvent.click(screen.getByRole("combobox"));
  const input = await screen.findByPlaceholderText(/type to filter/i);
  await userEvent.type(input, text);
  return { onUpdate, input };
};

describe("ConversationalSearchInput suggestion", () => {
  it("offers what it understood and applies it only when chosen", async () => {
    const { onUpdate } = await openAndType("starbuks over 20");

    expect(await screen.findByText("Understood as")).toBeInTheDocument();
    expect(
      screen.getByText(/Vendor: Starbucks \(matched “starbuks”\)/),
    ).toBeInTheDocument();
    expect(screen.getByText("Over 20")).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText(/Apply all 2/));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toMatchObject({
      selectedVendors: ["starbucks"],
      minAmount: 20,
    });
  });

  it("lets the user take just one understood piece", async () => {
    const { onUpdate } = await openAndType("starbuks over 20");
    await userEvent.click(await screen.findByText("Over 20"));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const update = onUpdate.mock.calls[0][0];
    expect(update).toEqual({ minAmount: 20, maxAmount: undefined });
    expect(update.selectedVendors).toBeUndefined();
  });

  it("keeps the other pieces on offer after one is taken", async () => {
    const { onUpdate } = await openAndType("groceries over 20 netflix");
    await userEvent.click(await screen.findByText("Over 20"));

    // The taken piece is gone from the suggestion; the rest stay, popover open.
    expect(screen.queryByText("Over 20")).not.toBeInTheDocument();
    expect(screen.getByText("Category: Groceries")).toBeInTheDocument();
    expect(screen.getByText(/Apply all 1|Understood as/)).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText("Category: Groceries"));
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate.mock.calls[1][0]).toEqual({
      selectedCategories: ["groceries"],
    });
  });

  it("applies whatever is left with 'Apply all' and then closes", async () => {
    const { onUpdate } = await openAndType("groceries over 20 starbucks");
    await userEvent.click(await screen.findByText("Over 20"));
    await userEvent.click(screen.getByText(/Apply all 2/));

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate.mock.calls[1][0]).toEqual({
      selectedCategories: ["groceries"],
      selectedVendors: ["starbucks"],
    });
    expect(screen.queryByText("Understood as")).not.toBeInTheDocument();
  });

  it("says how the filters combine, and offers Clear and Done", async () => {
    await openAndType("groceries over 20");
    expect(
      await screen.findByText(/must match every filter/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("Understood as")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type to filter/i)).toHaveValue("");
  });

  it("has the suggestion selected first, so Enter accepts it", async () => {
    const { onUpdate, input } = await openAndType("between 2016 to 2024");

    await screen.findByText("Understood as");
    await waitFor(() =>
      expect(screen.getAllByRole("option")[0]).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const { dateRange } = onUpdate.mock.calls[0][0];
    expect(dateRange.from.getFullYear()).toBe(2016);
    expect(dateRange.to.getFullYear()).toBe(2024);
  });

  it("keeps a typo-based suggestion off the default Enter choice", async () => {
    await openAndType("starbuks");
    await screen.findByText("Understood as");
    const options = screen.getAllByRole("option");
    expect(options[0]).not.toHaveTextContent("matched");
    expect(options[options.length - 1]).toHaveTextContent("matched");
  });

  it("says 'until' for an open-ended date instead of showing 1900", async () => {
    await openAndType("before 2019");
    expect(await screen.findByText(/Date: until/)).toBeInTheDocument();
    expect(screen.queryByText(/1900/)).not.toBeInTheDocument();
  });

  it("shows no suggestion for plain text", async () => {
    await openAndType("coffee beans");
    expect(screen.queryByText("Understood as")).not.toBeInTheDocument();
    expect(screen.getByText(/Search Text "coffee beans"/)).toBeInTheDocument();
  });
});

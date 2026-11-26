import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyManagement } from "@/components/management/CurrencyManagement";
import { firePointer, swipe } from "@/tests/pointerEvents";

/*
 * Currency rows: swipe left reveals Delete, which removes the currency the
 * way the Trash button does (no confirmation, as today). There is no right
 * swipe. The rate field and the area around it never swipe or long press, so
 * the rate stays editable.
 */

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/utils/apiUtils", () => ({
  // The currency list request never answers in these tests.
  fetchWithTimeout: vi.fn(() => new Promise(() => {})),
}));

vi.mock("@/utils/toast", () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

const removeCurrency = vi.fn();
const updateExchangeRate = vi.fn();

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "USD",
    exchangeRates: { USD: 1, EUR: 0.9, GBP: 0.8 },
    updateExchangeRate,
    refreshExchangeRates: vi.fn(),
    availableCurrencies: [
      { code: "USD", name: "US Dollar" },
      { code: "EUR", name: "Euro" },
      { code: "GBP", name: "British Pound" },
    ],
    currencySymbols: { USD: "$", EUR: "€", GBP: "£" },
    addCurrency: vi.fn(),
    removeCurrency,
  }),
}));

const renderCurrencies = () =>
  render(
    <TooltipProvider>
      <CurrencyManagement />
    </TooltipProvider>,
  );

const nameIn = (code: string) => screen.getByText(code);
const card = (code: string) =>
  nameIn(code).closest("[data-swipe-card]") as HTMLElement;
const swipeLayer = (code: string) =>
  card(code).querySelector("[data-swipe-content]") as HTMLElement;
const rateInput = (code: string) =>
  within(card(code)).getByRole("spinbutton") as HTMLInputElement;

describe("CurrencyManagement row gestures", () => {
  beforeEach(() => {
    removeCurrency.mockClear();
    updateExchangeRate.mockClear();
  });

  it("swipe left reveals Delete and tapping it removes the currency like the Trash button", async () => {
    const user = userEvent.setup();
    renderCurrencies();

    swipe(nameIn("GBP"), { x: 250, y: 100 }, { x: 120, y: 104 });
    expect(removeCurrency).not.toHaveBeenCalled();
    await user.click(
      within(card("GBP")).getByRole("button", { name: "Delete GBP" }),
    );
    expect(removeCurrency).toHaveBeenCalledWith("GBP");

    // The Trash button stays and does the same.
    await user.click(
      within(card("EUR")).getByRole("button", { name: "Remove currency" }),
    );
    expect(removeCurrency).toHaveBeenLastCalledWith("EUR");
  });

  it("has no right swipe", () => {
    renderCurrencies();
    swipe(nameIn("GBP"), { x: 100, y: 100 }, { x: 230, y: 100 });
    expect(swipeLayer("GBP").style.transform).toBe("translateX(0px)");
    expect(
      within(card("GBP")).queryByRole("button", { name: "Edit" }),
    ).toBeNull();
  });

  it("dragging in the rate field or the area around it never swipes, and the value stays editable", () => {
    renderCurrencies();
    const input = rateInput("GBP");

    swipe(input, { x: 300, y: 100 }, { x: 150, y: 104 });
    expect(swipeLayer("GBP").style.transform).toBe("translateX(0px)");

    // The box around the field (its padding) is part of the field's area.
    swipe(input.parentElement!, { x: 300, y: 100 }, { x: 150, y: 104 });
    expect(swipeLayer("GBP").style.transform).toBe("translateX(0px)");

    fireEvent.change(input, { target: { value: "0.75" } });
    expect(updateExchangeRate).toHaveBeenCalledWith("GBP", 0.75);
  });

  it("the rate field stays selectable although the row blocks text selection", () => {
    renderCurrencies();
    const layer = swipeLayer("EUR");
    expect(layer.className).toMatch(
      /(^|\s)any-pointer-coarse:select-none(\s|$)/,
    );
    // The rate input and its marked box get selection back from the layer.
    expect(layer.contains(rateInput("EUR"))).toBe(true);
    expect(layer.className).toContain("[&_input]:select-text");
    expect(rateInput("EUR").closest("[data-selectable-text]")).not.toBeNull();
    expect(layer.className).toContain("[&_[data-selectable-text]]:select-text");
  });

  it("pressing and holding in the rate field never opens the menu", () => {
    vi.useFakeTimers();
    renderCurrencies();
    const input = rateInput("GBP");
    for (const target of [input, input.parentElement!]) {
      firePointer(target, "pointerDown", { x: 300, y: 100 });
      act(() => {
        vi.advanceTimersByTime(800);
      });
      firePointer(target, "pointerUp", { x: 300, y: 100 });
    }
    vi.useRealTimers();
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("a long press elsewhere on the row opens a menu with Delete", async () => {
    vi.useFakeTimers();
    renderCurrencies();
    firePointer(nameIn("GBP"), "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    firePointer(nameIn("GBP"), "pointerUp", { x: 200, y: 100 });
    vi.useRealTimers();

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Delete"]);
  });
});

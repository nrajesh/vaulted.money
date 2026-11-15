import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { CurrencyProvider, useCurrency } from "./CurrencyContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CurrencyProvider>{children}</CurrencyProvider>
);

describe("formatCurrency", () => {
  it("puts the minus sign before the currency symbol", () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    const text = result.current.formatCurrency(-1380, "EUR");
    expect(text.startsWith("-€")).toBe(true);
    expect(text).not.toContain("€-");
  });

  it("leaves positive amounts and zero unsigned", () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.formatCurrency(1380, "EUR").startsWith("€")).toBe(
      true,
    );
    // A tiny negative rounding remainder shows as zero, never "-€0.00".
    expect(result.current.formatCurrency(-0.001, "EUR").startsWith("€")).toBe(
      true,
    );
  });
});

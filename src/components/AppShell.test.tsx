import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import { isLedgerFreePath } from "@/constants/ledgerFreeRoutes";

const ledger = vi.hoisted(() => ({
  active: null as { id: string } | null,
  isLoading: false,
}));
vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    activeLedger: ledger.active,
    isLoading: ledger.isLoading,
  }),
}));
vi.mock("@/components/Layout", () => ({
  default: () => <div>full layout</div>,
}));
vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ setTheme: vi.fn(), resolvedTheme: "light" }),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route path="settings" element={<div>settings page</div>} />
          <Route path="transactions" element={<div>transactions</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("AppShell", () => {
  it("opens app-wide settings with no ledger open, with a way back", () => {
    ledger.active = null;
    ledger.isLoading = false;
    renderAt("/settings");
    expect(screen.getByText("settings page")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to ledgers" }),
    ).toHaveAttribute("href", "/ledgers");
    expect(screen.getByRole("link", { name: "AI & agents" })).toHaveAttribute(
      "href",
      "/ai-providers",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("leaves ledger pages to the full layout, which sends them to the ledger list", () => {
    ledger.active = null;
    renderAt("/transactions");
    expect(screen.getByText("full layout")).toBeInTheDocument();
  });

  it("uses the full layout whenever a ledger is open", () => {
    ledger.active = { id: "l1" };
    renderAt("/settings");
    expect(screen.getByText("full layout")).toBeInTheDocument();
  });

  it("waits for the ledger to load before deciding", () => {
    ledger.active = null;
    ledger.isLoading = true;
    renderAt("/settings");
    expect(screen.getByText("full layout")).toBeInTheDocument();
  });

  it("knows which pages need no ledger", () => {
    for (const path of [
      "/settings",
      "/ai-providers",
      "/connect-agent",
      "/language",
      "/currencies",
      "/backup",
      "/acknowledgments",
    ]) {
      expect(isLedgerFreePath(path)).toBe(true);
    }
    for (const path of ["/transactions", "/dashboard", "/data-management"]) {
      expect(isLedgerFreePath(path)).toBe(false);
    }
  });
});

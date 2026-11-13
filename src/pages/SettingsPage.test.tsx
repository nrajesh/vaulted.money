import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";

const ledger = vi.hoisted(() => ({
  active: null as { id: string; name: string } | null,
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "USD",
    setCurrency: vi.fn(),
    availableCurrencies: [{ code: "USD", name: "US Dollar" }],
  }),
}));
vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    activeLedger: ledger.active,
    updateLedgerDetails: vi.fn(),
  }),
}));
vi.mock("@/hooks/useSyncConfig", () => ({
  useSyncConfig: () => ({
    config: { autoSyncEnabled: false },
    toggleAutoSync: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAIConfig", () => ({
  useAIConfig: () => ({ config: { provider: null, apiKey: "" } }),
}));
vi.mock("@/components/dialogs/ManageLedgerDialog", () => ({
  ManageLedgerDialog: () => null,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );

describe("SettingsPage", () => {
  it("sends everything AI to the one AI page instead of holding keys itself", () => {
    ledger.active = null;
    renderPage();
    expect(
      screen.getByRole("link", { name: "Open AI assistant" }),
    ).toHaveAttribute("href", "/ai-providers");
    expect(screen.getByText("No AI provider is in use.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/API Key/i)).toBeNull();
    expect(screen.queryByText("Local API")).toBeNull();
  });

  it("opens without a ledger and still offers the app-wide settings", () => {
    ledger.active = null;
    renderPage();
    expect(
      screen.getByRole("link", { name: "Choose a ledger" }),
    ).toHaveAttribute("href", "/ledgers");
    expect(screen.queryByText("Default Currency")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Every ledger on this device" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Future Transactions")).toBeInTheDocument();
    expect(screen.getByText("Cross-Device Continuity")).toBeInTheDocument();
  });

  it("shows the open ledger's own settings first", () => {
    ledger.active = { id: "l1", name: "Home" };
    renderPage();
    expect(
      screen.getByRole("heading", { name: "This ledger: Home" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Default Currency")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Choose a ledger" })).toBeNull();
  });
});

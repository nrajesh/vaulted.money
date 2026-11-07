import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "USD",
    setCurrency: vi.fn(),
    availableCurrencies: ["USD"],
  }),
}));
vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ activeLedger: null, updateLedgerDetails: vi.fn() }),
}));
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({ getAIProviders: () => Promise.resolve([]) }),
}));
vi.mock("@/hooks/useSyncConfig", () => ({
  useSyncConfig: () => ({
    config: { autoSyncEnabled: false },
    toggleAutoSync: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAIConfig", () => ({
  useAIConfig: () => ({
    config: { provider: "NONE" },
    saveConfig: vi.fn(),
    refreshConfig: vi.fn(),
  }),
}));
vi.mock("@/components/settings/ApiAccessCard", () => ({ default: () => null }));
vi.mock("@/components/dialogs/ManageLedgerDialog", () => ({
  ManageLedgerDialog: () => null,
}));
vi.mock("@/components/management/AIProviderManagement", () => ({
  default: () => null,
}));

describe("SettingsPage", () => {
  it("points BYOK users who want to chat with their data to the agent page", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Connect an AI agent" }),
    ).toHaveAttribute("href", "/connect-agent");
    expect(
      screen.getByText(/Want to chat with your data instead\?/),
    ).toBeInTheDocument();
  });
});

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";

// Mock Capacitor before any imports that use it
vi.mock("@capacitor/core", async () => {
  const actual =
    await vi.importActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: vi.fn() },
  };
});

// Mock heavy providers to avoid Dexie/IndexedDB issues in test
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "EUR",
    setCurrency: vi.fn(),
    availableCurrencies: [],
  }),
}));
vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    activeLedger: null,
    updateLedgerDetails: vi.fn(),
  }),
  LedgerProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/useSyncConfig", () => ({
  useSyncConfig: () => ({
    syncEnabled: false,
    needsPermission: false,
    requestPermission: vi.fn(),
    config: {
      autoSyncEnabled: false,
      syncFolderPath: "",
    },
    toggleAutoSync: vi.fn(),
    setSyncFolder: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAIConfig", () => ({
  useAIConfig: () => ({
    config: { provider: null },
    saveConfig: vi.fn(),
    refreshConfig: vi.fn(),
  }),
}));
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    getAIProviders: vi.fn().mockResolvedValue([]),
  }),
}));

import React from "react";
import { Capacitor } from "@capacitor/core";
import { act, cleanup } from "@testing-library/react";

describe("DonationPage hiding on native platforms (FR-021)", () => {
  let render: typeof import("@testing-library/react").render;
  let screen: typeof import("@testing-library/react").screen;
  let MemoryRouter: typeof import("react-router-dom").MemoryRouter;
  let SettingsPage: React.ComponentType;

  // Importing the whole Settings page is slow on a busy CI machine, so do it
  // once with a generous timeout instead of inside the first test (5 s limit).
  beforeAll(async () => {
    ({ render, screen } = await import("@testing-library/react"));
    ({ MemoryRouter } = await import("react-router-dom"));
    SettingsPage = (await import("@/pages/SettingsPage")).default;
  }, 60000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SettingsPage starts async work on mount (provider look-ups, effects). If a
  // test ends while that is still pending, React's scheduler fires after the
  // jsdom window is torn down and Vitest reports "window is not defined",
  // which fails the run even though every test passed. Unmount, then let the
  // event loop drain before the file finishes.
  afterEach(async () => {
    cleanup();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("hides the Support Development link when Capacitor.isNativePlatform() is true", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("link", { name: /support development|donate/i }),
    ).toBeNull();
  });

  it("shows the Support Development link when not native", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
    // At least one link to /donate should exist
    const links = screen.getAllByRole("link", {
      name: /support development/i,
    });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});

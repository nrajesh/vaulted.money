import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Ledger } from "@/types/dataProvider";
import { swipe } from "@/tests/pointerEvents";
import LedgerEntryPage from "@/pages/LedgerEntryPage";

/*
 * Swipe and long press on the ledger cards of the first screen: swipe left
 * reveals Delete (the existing confirmation), swipe right reveals Edit (the
 * ledger dialog Settings uses), and the phone "…" button lists both.
 */

const mockSwitchLedger = vi.fn();
const mockDeleteLedger = vi.fn();

const ledgers: Ledger[] = [
  {
    id: "ledger-home",
    name: "Home budget",
    currency: "EUR",
    icon: "home",
    created_at: "2026-01-01T12:00:00.000Z",
    last_accessed: "2026-11-20T12:00:00.000Z",
  },
  {
    id: "ledger-work",
    name: "Side business",
    currency: "USD",
    icon: "building",
    created_at: "2026-01-01T12:00:00.000Z",
    last_accessed: "2026-11-21T12:00:00.000Z",
  },
];

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    ledgers,
    isLoading: false,
    switchLedger: mockSwitchLedger,
    refreshLedgers: vi.fn(),
    deleteLedger: mockDeleteLedger,
  }),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    generateDiverseDemoData: vi.fn(),
    setOperationProgress: vi.fn(),
  }),
}));

vi.mock("@/contexts/HelpDrawerContext", () => ({
  useHelpDrawer: () => ({ openHelp: vi.fn() }),
}));

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ setTheme: vi.fn(), resolvedTheme: "light" }),
}));

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({}),
}));

vi.mock("@/hooks/useSafetyBackupWarning", () => ({
  useSafetyBackupWarning: () => vi.fn(),
}));

// The ledger dialog is stubbed so the test can see which ledger it edits.
vi.mock("@/components/dialogs/ManageLedgerDialog", () => ({
  ManageLedgerDialog: ({
    isOpen,
    ledgerToEdit,
  }: {
    isOpen: boolean;
    ledgerToEdit?: Ledger;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Ledger dialog">
        {ledgerToEdit ? `Editing ${ledgerToEdit.name}` : "Creating"}
      </div>
    ) : null,
}));

// Heavy chrome the cards do not depend on.
vi.mock("@/components/help/FeatureHint", () => ({ FeatureHint: () => null }));
vi.mock("@/components/language/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));
vi.mock("@/components/feedback/FeedbackLauncher", () => ({
  FeedbackLauncher: () => null,
}));
vi.mock("@/components/SiteFooter", () => ({ default: () => null }));
vi.mock("@/components/BrandLockup", () => ({ default: () => null }));
vi.mock("@/components/dialogs/GlobalProgressDialog", () => ({
  GlobalProgressDialog: () => null,
}));
vi.mock("@/components/transactions/CSVMappingDialog", () => ({
  default: () => null,
}));
vi.mock("@/components/dialogs/EraseAllDataDialog", () => ({
  default: () => null,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LedgerEntryPage />
    </MemoryRouter>,
  );

const ledgerName = (name: string) => screen.getByRole("heading", { name });
/** The whole swipeable card around a ledger. */
const ledgerCard = (name: string) =>
  ledgerName(name).closest("[data-swipe-card]") as HTMLElement;
const swipeLayer = (name: string) =>
  ledgerCard(name).querySelector("[data-swipe-content]") as HTMLElement;

const swipeLeft = (name: string) =>
  swipe(ledgerName(name), { x: 250, y: 100 }, { x: 120, y: 104 });
const swipeRight = (name: string) =>
  swipe(ledgerName(name), { x: 100, y: 100 }, { x: 230, y: 100 });

describe("Ledger card gestures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("swiping a ledger left reveals Delete and tapping opens the existing confirmation dialog", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      within(ledgerCard("Home budget")).queryByRole("button", {
        name: "Delete Home budget",
      }),
    ).toBeNull();
    swipeLeft("Home budget");
    await user.click(
      // The revealed button names the ledger for screen readers.
      within(ledgerCard("Home budget")).getByRole("button", {
        name: "Delete Home budget",
      }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Are you sure?")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/permanently delete this ledger/),
    ).toBeInTheDocument();
    // Ledgers always confirm: nothing is deleted yet, nor opened.
    expect(mockDeleteLedger).not.toHaveBeenCalled();
    expect(mockSwitchLedger).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: "Delete Permanently" }),
    );
    expect(mockDeleteLedger).toHaveBeenCalledWith("ledger-home");
  });

  it("swiping right reveals Edit and tapping it opens the same edit flow as the existing edit control", async () => {
    const user = userEvent.setup();
    renderPage();

    swipeRight("Side business");
    await user.click(
      within(ledgerCard("Side business")).getByRole("button", {
        name: "Edit Side business",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Ledger dialog",
    });
    expect(dialog).toHaveTextContent("Editing Side business");
    expect(mockSwitchLedger).not.toHaveBeenCalled();
  });

  it('the phone "…" button lists Edit and Delete', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "More actions for Home budget" }),
    );
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Delete"]);

    // Choosing from the menu never opens the ledger underneath.
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(mockSwitchLedger).not.toHaveBeenCalled();
  });

  it("tapping a ledger card still opens it", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(ledgerName("Home budget"));
    expect(mockSwitchLedger).toHaveBeenCalledWith("ledger-home");
  });

  it("Manage (selection) mode disables swiping", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Manage" }));
    swipeLeft("Home budget");
    expect(swipeLayer("Home budget").style.transform).toBe("translateX(0px)");
    expect(
      within(ledgerCard("Home budget")).queryByRole("button", {
        name: "Delete Home budget",
      }),
    ).toBeNull();

    // A tap still selects the ledger rather than opening it.
    await user.click(ledgerName("Home budget"));
    expect(mockSwitchLedger).not.toHaveBeenCalled();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("the sliding layer takes the page colour, so the translucent card looks unchanged", () => {
    renderPage();
    expect(swipeLayer("Home budget").className).toMatch(/\bbg-gray-50\b/);
    expect(swipeLayer("Home budget").className).toMatch(/\bdark:bg-gray-900\b/);
  });
});

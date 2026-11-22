import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SafetyBackupSummary } from "@/types/dataProvider";
import { swipe } from "@/tests/pointerEvents";
import SafetyBackups from "./SafetyBackups";

const mockListSafetyBackups = vi.fn();
const mockGetSafetyBackup = vi.fn();
const mockDeleteSafetyBackups = vi.fn();
const mockReload = vi.fn();
const mockRestoreSafetyBackup = vi.fn();
const mockSaveFile = vi.fn().mockResolvedValue(true);

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    listSafetyBackups: mockListSafetyBackups,
    getSafetyBackup: mockGetSafetyBackup,
    deleteSafetyBackups: mockDeleteSafetyBackups,
  }),
}));

vi.mock("@/utils/safetyBackup", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/safetyBackup")>();
  return {
    ...actual,
    restoreSafetyBackup: (...args: unknown[]) =>
      mockRestoreSafetyBackup(...args),
  };
});

vi.mock("@/utils/backupUtils", () => ({
  saveFile: (...args: unknown[]) => mockSaveFile(...args),
}));

const mockShowSuccess = vi.fn();
vi.mock("@/utils/toast", () => ({
  showSuccess: (...args: unknown[]) => mockShowSuccess(...args),
  showError: vi.fn(),
}));

const older: SafetyBackupSummary = {
  id: "copy-old",
  reason: "sync",
  created_at: new Date(2026, 10, 20, 9, 30).toISOString(),
  ledger_count: 1,
};
const newer: SafetyBackupSummary = {
  id: "copy-new",
  reason: "csv_import",
  entity: "transactions",
  created_at: new Date(2026, 10, 22, 14, 5).toISOString(),
  ledger_count: 3,
};

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafetyBackups />
    </QueryClientProvider>,
  );
};

const originalLocation = window.location;

describe("SafetyBackups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The provider returns newest first.
    mockListSafetyBackups.mockResolvedValue([newer, older]);
    mockDeleteSafetyBackups.mockResolvedValue(2);
    mockRestoreSafetyBackup.mockResolvedValue(undefined);
    // jsdom's location.reload is not configurable on its own, so replace location.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: mockReload },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("shows the empty state when there are no copies", async () => {
    mockListSafetyBackups.mockResolvedValue([]);
    renderSection();

    expect(
      await screen.findByText(/No safety copies yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Automatic safety copies" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Made before imports, AI changes and sync. The last 5 are kept.",
      ),
    ).toBeInTheDocument();
  });

  it("lists copies newest first with their reason and ledger count", async () => {
    renderSection();

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0]).getByText("Before CSV import: transactions"),
    ).toBeInTheDocument();
    expect(within(items[0]).getByText(/3 ledgers/)).toBeInTheDocument();
    expect(within(items[1]).getByText("Before sync")).toBeInTheDocument();
    expect(within(items[1]).getByText(/1 ledger$/)).toBeInTheDocument();

    // Icon-only menu button is named for screen readers.
    expect(
      within(items[0]).getByRole("button", { name: /More actions/i }),
    ).toBeInTheDocument();
  });

  it("names each row's buttons after its copy for screen readers", async () => {
    renderSection();

    const items = await screen.findAllByRole("listitem");
    const restoreButtons = items.map((item) =>
      within(item).getByRole("button", { name: /^Restore / }),
    );
    const saveButtons = items.map((item) =>
      within(item).getByRole("button", { name: /^Save as file: / }),
    );

    // Each name starts with the visible text (so speech control still works)
    // and adds the copy's reason and details (date, ledgers).
    expect(restoreButtons[0]).toHaveAccessibleName(
      expect.stringMatching(
        /^Restore Before CSV import: transactions, .*3 ledgers$/,
      ),
    );
    expect(restoreButtons[1]).toHaveAccessibleName(
      expect.stringMatching(/^Restore Before sync, .*1 ledger$/),
    );
    expect(restoreButtons[0].getAttribute("aria-label")).not.toBe(
      restoreButtons[1].getAttribute("aria-label"),
    );
    expect(saveButtons[0]).toHaveAccessibleName(
      expect.stringMatching(
        /^Save as file: Before CSV import: transactions, .*3 ledgers$/,
      ),
    );
    expect(saveButtons[1]).toHaveAccessibleName(
      expect.stringMatching(/^Save as file: Before sync, .*1 ledger$/),
    );

    // The visible text stays short.
    expect(restoreButtons[0]).toHaveTextContent(/^Restore$/);
    expect(saveButtons[0]).toHaveTextContent(/^Save as file$/);
  });

  it("says 0 ledgers for a copy of an empty database", async () => {
    // Generate demo data on a fresh install copies an empty database.
    mockListSafetyBackups.mockResolvedValue([
      { ...older, reason: "demo_data", ledger_count: 0 },
    ]);
    renderSection();

    const [item] = await screen.findAllByRole("listitem");
    expect(
      within(item).getByText("Before generating demo data"),
    ).toBeInTheDocument();
    expect(within(item).getByText(/0 ledgers$/)).toBeInTheDocument();
  });

  it("keeps the title wide enough that the header buttons wrap below it", async () => {
    // At 360px with Larger text, Delete and Cancel used to squeeze the
    // title to one letter per line: flex-1 with min-w-0 and no basis never
    // wraps. A basis makes the buttons move to their own line instead.
    const user = userEvent.setup();
    renderSection();
    await screen.findAllByRole("listitem");
    await user.click(screen.getByRole("button", { name: "Select" }));

    const titleBlock = screen.getByRole("heading", {
      name: "Automatic safety copies",
    }).parentElement!;
    expect(titleBlock.className).toMatch(/\bbasis-/);
  });

  it("restores after confirming", async () => {
    const user = userEvent.setup();
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(
      within(items[0]).getByRole("button", {
        name: /^Restore Before CSV import: transactions,/,
      }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Restore this safety copy?"),
    ).toBeInTheDocument();
    expect(mockRestoreSafetyBackup).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(mockRestoreSafetyBackup).toHaveBeenCalled());
    expect(mockRestoreSafetyBackup.mock.calls[0][1]).toBe("copy-new");
    expect(mockRestoreSafetyBackup.mock.calls[0][2]).toEqual({});
    // Everything was replaced: the app reloads so the active ledger is rebuilt.
    await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1));
    expect(mockShowSuccess).toHaveBeenCalledWith("Safety copy restored.");
  });

  it("saves a copy as a file named after its date", async () => {
    const user = userEvent.setup();
    mockGetSafetyBackup.mockResolvedValue({ ...newer, payload: '{"a":1}' });
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(
      within(items[0]).getByRole("button", {
        name: /^Save as file: Before CSV import: transactions,/,
      }),
    );

    await waitFor(() => expect(mockSaveFile).toHaveBeenCalled());
    expect(mockGetSafetyBackup).toHaveBeenCalledWith("copy-new");
    expect(mockSaveFile.mock.calls[0][0]).toBe(
      "vaulted-money-safety-copy-2026-11-22-1405.json",
    );
    expect(mockSaveFile.mock.calls[0][1]).toBe('{"a":1}');
  });

  it("deletes several selected copies after confirming", async () => {
    const user = userEvent.setup();
    renderSection();

    await screen.findAllByRole("listitem");
    await user.click(screen.getByRole("button", { name: "Select" }));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole("button", { name: "Delete (2)" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Delete safety copies?"),
    ).toBeInTheDocument();
    expect(mockDeleteSafetyBackups).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockDeleteSafetyBackups).toHaveBeenCalledWith([
        "copy-new",
        "copy-old",
      ]),
    );
  });

  it("deletes one copy from its menu after confirming", async () => {
    const user = userEvent.setup();
    mockDeleteSafetyBackups.mockResolvedValue(1);
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(
      within(items[1]).getByRole("button", { name: /More actions/i }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockDeleteSafetyBackups).toHaveBeenCalledWith(["copy-old"]),
    );
  });

  describe("phone gestures", () => {
    /** The swiping layer of a copy's row. */
    const swipeLayer = (item: HTMLElement) =>
      item.querySelector("[data-swipe-content]") as HTMLElement;

    it("swiping a copy left reveals Delete; tapping it opens the same delete confirmation as the menu", async () => {
      const user = userEvent.setup();
      mockDeleteSafetyBackups.mockResolvedValue(1);
      renderSection();

      const items = await screen.findAllByRole("listitem");
      // Hidden from screen readers while the row is closed.
      expect(
        within(items[0]).queryByRole("button", {
          name: "Delete Before CSV import: transactions",
        }),
      ).toBeNull();

      swipe(
        within(items[0]).getByText("Before CSV import: transactions"),
        { x: 250, y: 100 },
        { x: 120, y: 104 },
      );
      await user.click(
        within(items[0]).getByRole("button", {
          name: "Delete Before CSV import: transactions",
        }),
      );

      // The swipe and the tap only ask; nothing is deleted yet.
      const dialog = await screen.findByRole("alertdialog");
      expect(
        within(dialog).getByText("Delete this safety copy?"),
      ).toBeInTheDocument();
      expect(mockDeleteSafetyBackups).not.toHaveBeenCalled();

      await user.click(within(dialog).getByRole("button", { name: "Delete" }));
      await waitFor(() =>
        expect(mockDeleteSafetyBackups).toHaveBeenCalledWith(["copy-new"]),
      );
    });

    it("the ⋯ menu still offers Delete", async () => {
      const user = userEvent.setup();
      renderSection();

      const items = await screen.findAllByRole("listitem");
      await user.click(
        within(items[0]).getByRole("button", { name: /More actions/i }),
      );
      const menuItems = await screen.findAllByRole("menuitem");
      expect(menuItems.map((item) => item.textContent)).toEqual(["Delete"]);
    });

    it("a copy has no right swipe", async () => {
      renderSection();

      const items = await screen.findAllByRole("listitem");
      swipe(
        within(items[0]).getByText("Before CSV import: transactions"),
        { x: 100, y: 100 },
        { x: 230, y: 100 },
      );
      expect(swipeLayer(items[0]).style.transform).toBe("translateX(0px)");
      expect(
        within(items[0]).queryByRole("button", {
          name: "Delete Before CSV import: transactions",
        }),
      ).toBeNull();
    });

    it("does not swipe in Select mode", async () => {
      const user = userEvent.setup();
      renderSection();

      await screen.findAllByRole("listitem");
      await user.click(screen.getByRole("button", { name: "Select" }));
      const items = screen.getAllByRole("listitem");
      swipe(
        within(items[0]).getByText("Before CSV import: transactions"),
        { x: 250, y: 100 },
        { x: 120, y: 104 },
      );
      expect(swipeLayer(items[0]).style.transform).toBe("translateX(0px)");
      expect(
        within(items[0]).queryByRole("button", {
          name: "Delete Before CSV import: transactions",
        }),
      ).toBeNull();
    });

    it("the sliding layer takes the card's own surface colour", async () => {
      renderSection();
      const items = await screen.findAllByRole("listitem");
      expect(swipeLayer(items[0]).className).toMatch(/\bbg-card\b/);
    });
  });

  it("offers to continue without a copy when the undo copy fails", async () => {
    const user = userEvent.setup();
    const { SafetyBackupFailedError } = await import("@/utils/safetyBackup");
    mockRestoreSafetyBackup
      .mockRejectedValueOnce(new SafetyBackupFailedError())
      .mockResolvedValueOnce(undefined);
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(
      within(items[0]).getByRole("button", {
        name: /^Restore Before CSV import: transactions,/,
      }),
    );
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Restore" }));

    const second = await screen.findByRole("alertdialog", {
      name: "Continue without a safety copy?",
    });
    await user.click(within(second).getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(mockRestoreSafetyBackup).toHaveBeenCalledTimes(2),
    );
    expect(mockRestoreSafetyBackup.mock.calls[1][1]).toBe("copy-new");
    expect(mockRestoreSafetyBackup.mock.calls[1][2]).toEqual({
      continueWithoutCopy: true,
    });
    await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1));
  });
});

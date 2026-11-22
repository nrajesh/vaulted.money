import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SafetyBackupSummary } from "@/types/dataProvider";
import SafetyBackups from "./SafetyBackups";

const mockListSafetyBackups = vi.fn();
const mockGetSafetyBackup = vi.fn();
const mockDeleteSafetyBackups = vi.fn();
const mockRefreshLedgers = vi.fn().mockResolvedValue([]);
const mockRestoreSafetyBackup = vi.fn();
const mockSaveFile = vi.fn().mockResolvedValue(true);

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    listSafetyBackups: mockListSafetyBackups,
    getSafetyBackup: mockGetSafetyBackup,
    deleteSafetyBackups: mockDeleteSafetyBackups,
  }),
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ refreshLedgers: mockRefreshLedgers }),
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

vi.mock("@/utils/toast", () => ({
  showSuccess: vi.fn(),
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

describe("SafetyBackups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The provider returns newest first.
    mockListSafetyBackups.mockResolvedValue([newer, older]);
    mockDeleteSafetyBackups.mockResolvedValue(2);
    mockRestoreSafetyBackup.mockResolvedValue(undefined);
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

  it("restores after confirming", async () => {
    const user = userEvent.setup();
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(within(items[0]).getByRole("button", { name: "Restore" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Restore this safety copy?"),
    ).toBeInTheDocument();
    expect(mockRestoreSafetyBackup).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(mockRestoreSafetyBackup).toHaveBeenCalled());
    expect(mockRestoreSafetyBackup.mock.calls[0][1]).toBe("copy-new");
    expect(mockRestoreSafetyBackup.mock.calls[0][2]).toEqual({});
  });

  it("saves a copy as a file named after its date", async () => {
    const user = userEvent.setup();
    mockGetSafetyBackup.mockResolvedValue({ ...newer, payload: '{"a":1}' });
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(
      within(items[0]).getByRole("button", { name: "Save as file" }),
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

  it("offers to continue without a copy when the undo copy fails", async () => {
    const user = userEvent.setup();
    const { SafetyBackupFailedError } = await import("@/utils/safetyBackup");
    mockRestoreSafetyBackup
      .mockRejectedValueOnce(new SafetyBackupFailedError())
      .mockResolvedValueOnce(undefined);
    renderSection();

    const items = await screen.findAllByRole("listitem");
    await user.click(within(items[0]).getByRole("button", { name: "Restore" }));
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
  });
});

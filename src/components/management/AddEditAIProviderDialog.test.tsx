import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddEditAIProviderDialog from "./AddEditAIProviderDialog";
import { readAiApiKeyFromStorage } from "@/constants/aiApiKeyStorage";
import { showError } from "@/utils/toast";
import type { AIProvider } from "@/types/dataProvider";

const device = vi.hoisted(() => ({ local: true }));
vi.mock("@/utils/localModels", async (original) => ({
  ...(await original<typeof import("@/utils/localModels")>()),
  canUseLocalModels: () => device.local,
}));

vi.mock("@/utils/toast", () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

// The form's Radix checkbox measures itself with ResizeObserver, which jsdom
// does not have.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const dataProvider = vi.hoisted(() => ({
  addAIProvider: vi.fn(),
  updateAIProvider: vi.fn(),
}));
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => dataProvider,
}));

const localProvider: AIProvider = {
  id: "local-1",
  name: "Local Agent",
  type: "CUSTOM",
  baseUrl: "http://localhost:1234/v1",
  model: "",
};

const renderDialog = (provider: AIProvider | null, isFirstProvider = false) =>
  render(
    <AddEditAIProviderDialog
      isOpen
      onOpenChange={vi.fn()}
      provider={provider}
      isFirstProvider={isFirstProvider}
    />,
  );

describe("AddEditAIProviderDialog", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    device.local = true;
    vi.mocked(showError).mockClear();
    dataProvider.addAIProvider.mockReset();
    dataProvider.updateAIProvider.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("loads a local model's list with no key and turns the field into a labelled dropdown", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ data: [{ id: "qwen" }, { id: "llama3" }] }),
    });
    renderDialog(localProvider);
    // Before loading, the field explains what to do.
    expect(
      screen.getByText(/Click Load models to pick from a list/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load models" }));

    expect(await screen.findByText("Select your model")).toBeInTheDocument();
    expect(
      screen.getByText(/Models found: 2\. Select the one to use/),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:1234/v1/models", {
      headers: {},
    });
    expect(showError).not.toHaveBeenCalled();

    // Typing a name by hand stays possible.
    fireEvent.click(
      screen.getByRole("button", { name: "Type a model name instead" }),
    );
    expect(screen.queryByText("Select your model")).toBeNull();
  });

  it("asks a hosted provider for its key right there, without sending anything", () => {
    renderDialog({
      ...localProvider,
      id: "hosted-1",
      type: "OPENAI",
      baseUrl: "https://api.openai.com/v1",
    });
    fireEvent.click(screen.getByRole("button", { name: "Load models" }));
    expect(showError).toHaveBeenCalledWith(
      "Enter the API key for this provider first.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a key typed in the dialog straight away, before saving", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ data: [{ id: "gpt-x" }] }),
    });
    renderDialog({
      ...localProvider,
      id: "hosted-1",
      type: "OPENAI",
      baseUrl: "https://api.openai.com/v1",
    });
    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "sk-typed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Load models" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        { headers: { Authorization: "Bearer sk-typed" } },
      ),
    );
  });

  it("says the key is optional for a local model", () => {
    renderDialog(localProvider);
    expect(
      screen.getByLabelText("API key (not needed for a local model)"),
    ).toBeInTheDocument();
  });

  it("saves the key with the provider and puts the first provider to use", async () => {
    dataProvider.addAIProvider.mockResolvedValue({ id: "new-1" });
    renderDialog(null, true);
    fireEvent.change(screen.getByLabelText("Provider Name"), {
      target: { value: "Mine" },
    });
    fireEvent.change(screen.getByLabelText("Base URL (Endpoint)"), {
      target: { value: "https://api.example.com/v1" },
    });
    fireEvent.change(screen.getByLabelText(/^API key/), {
      target: { value: "  sk-new  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));

    await waitFor(() =>
      expect(dataProvider.addAIProvider).toHaveBeenCalledTimes(1),
    );
    expect(dataProvider.addAIProvider.mock.calls[0][0]).toMatchObject({
      name: "Mine",
      isDefault: true,
    });
    // The key never goes to the database, only to this device's storage.
    expect(dataProvider.addAIProvider.mock.calls[0][0]).not.toHaveProperty(
      "apiKey",
    );
    await waitFor(() =>
      expect(readAiApiKeyFromStorage("new-1")).toBe("sk-new"),
    );
  });

  it("shows the saved key when editing and removes it when cleared", async () => {
    localStorage.setItem("vaultedmoney_ai_apiKey_local-1", "old-key");
    dataProvider.updateAIProvider.mockResolvedValue(undefined);
    renderDialog(localProvider);
    const keyField = screen.getByLabelText(/^API key/) as HTMLInputElement;
    await waitFor(() => expect(keyField.value).toBe("old-key"));
    fireEvent.change(keyField, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    await waitFor(() =>
      expect(dataProvider.updateAIProvider).toHaveBeenCalledTimes(1),
    );
    expect(readAiApiKeyFromStorage("local-1")).toBe("");
  });

  it("offers no local-model option outside the desktop app, and starts a new provider as a hosted one", () => {
    device.local = false;
    renderDialog(null);
    expect(
      (screen.getByLabelText("Base URL (Endpoint)") as HTMLInputElement).value,
    ).toBe("https://api.openai.com/v1");
    expect(screen.queryByText(/A model on my computer/)).toBeNull();
    expect(screen.getByLabelText("API key")).toBeInTheDocument();
  });

  it("refuses a localhost address outside the desktop app instead of failing to fetch", () => {
    device.local = false;
    renderDialog(localProvider);
    fireEvent.click(screen.getByRole("button", { name: "Load models" }));
    expect(showError).toHaveBeenCalledWith(
      "A model on your own computer can only be reached from the desktop app.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains an unreachable server instead of saying Failed to fetch", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    renderDialog(localProvider);
    fireEvent.click(screen.getByRole("button", { name: "Load models" }));
    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith(
        expect.stringContaining("nothing answered at http://localhost:1234/v1"),
      ),
    );
  });
});

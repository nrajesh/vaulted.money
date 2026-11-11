import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AIProviderManagement from "./AIProviderManagement";
import type { AIProvider } from "@/types/dataProvider";

vi.mock("@/utils/toast", () => ({ showError: vi.fn(), showSuccess: vi.fn() }));
vi.mock("./AddEditAIProviderDialog", () => ({
  default: ({
    isOpen,
    provider,
  }: {
    isOpen: boolean;
    provider?: AIProvider;
  }) => (isOpen ? <div>dialog for {provider?.name ?? "new"}</div> : null),
}));

const store = vi.hoisted(() => ({ providers: [] as unknown[] }));
const dataProvider = vi.hoisted(() => ({
  getAIProviders: vi.fn(),
  setDefaultAIProvider: vi.fn(),
  deleteAIProvider: vi.fn(),
}));
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => dataProvider,
}));

const local: AIProvider = {
  id: "local-1",
  name: "Local Agent",
  type: "CUSTOM",
  baseUrl: "http://localhost:1234/v1",
  model: "qwen2.5-7b-instruct",
  isDefault: true,
};
const hosted: AIProvider = {
  id: "hosted-1",
  name: "My OpenAI",
  type: "OPENAI",
  baseUrl: "https://api.openai.com/v1",
};

describe("AIProviderManagement", () => {
  beforeEach(() => {
    localStorage.clear();
    store.providers = [local, hosted];
    dataProvider.getAIProviders.mockReset();
    dataProvider.getAIProviders.mockImplementation(() =>
      Promise.resolve(store.providers),
    );
    dataProvider.setDefaultAIProvider.mockReset();
    dataProvider.setDefaultAIProvider.mockResolvedValue(undefined);
    dataProvider.deleteAIProvider.mockReset();
    dataProvider.deleteAIProvider.mockResolvedValue(undefined);
  });

  it("shows each provider as a card with what it still needs", async () => {
    render(<AIProviderManagement />);
    expect(
      await screen.findByRole("heading", { name: "Local Agent" }),
    ).toBeInTheDocument();
    expect(screen.getByText("In use")).toBeInTheDocument();
    expect(screen.getByText("Not needed")).toBeInTheDocument();
    // A hosted provider without a key says so and offers the fix.
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(
      screen.getByText(/cannot be used until you add its API key/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit My OpenAI" }));
    expect(screen.getByText("dialog for My OpenAI")).toBeInTheDocument();
    // No table, search or CSV buttons for a list this short.
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("button", { name: /CSV/ })).toBeNull();
  });

  it("puts another provider to use with one click", async () => {
    render(<AIProviderManagement />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Use this one" }),
    );
    await waitFor(() =>
      expect(dataProvider.setDefaultAIProvider).toHaveBeenCalledWith(
        "hosted-1",
      ),
    );
  });

  it("warns when the chosen model is an embedding model", async () => {
    store.providers = [
      { ...local, model: "nomic-ai/nomic-embed-text-v1.5-GGUF" },
    ];
    render(<AIProviderManagement />);
    expect(
      await screen.findByText(/looks like an embedding model/),
    ).toBeInTheDocument();
  });

  it("removes a provider and its saved key after confirming", async () => {
    localStorage.setItem("vaultedmoney_ai_apiKey_hosted-1", "sk-old");
    render(<AIProviderManagement />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Remove My OpenAI" }),
    );
    expect(dataProvider.deleteAIProvider).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(dataProvider.deleteAIProvider).toHaveBeenCalledWith("hosted-1"),
    );
    await waitFor(() =>
      expect(
        localStorage.getItem("vaultedmoney_ai_apiKey_hosted-1"),
      ).toBeNull(),
    );
  });

  it("invites the first provider when there is none", async () => {
    store.providers = [];
    render(<AIProviderManagement />);
    expect(await screen.findByText(/No provider yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add AI Provider" }));
    expect(screen.getByText("dialog for new")).toBeInTheDocument();
  });
});

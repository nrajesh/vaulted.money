import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as React from "react";
import AiHubPage from "./AiHubPage";
import type { AIProvider } from "@/types/dataProvider";

const aiFeatures = vi.hoisted(() => ({ enabled: true }));
vi.mock("@/hooks/useAiFeatures", () => ({
  useAiFeatures: () => ({
    enabled: aiFeatures.enabled,
    ready: true,
    setEnabled: vi.fn(),
  }),
}));

// The provider list is tested on its own; here it only reports what exists.
const listed = vi.hoisted(() => ({ providers: [] as unknown[] }));
vi.mock("@/components/management/AIProviderManagement", () => {
  const ProviderListStub = ({
    onProvidersChange,
  }: {
    onProvidersChange?: (providers: AIProvider[]) => void;
  }) => {
    React.useEffect(() => {
      onProvidersChange?.(listed.providers as AIProvider[]);
    }, [onProvidersChange]);
    return <div>provider list</div>;
  };
  return { default: ProviderListStub };
});

const win = window as unknown as { electron?: unknown };

const status = {
  enabled: false,
  port: 4317,
  token: "tok",
  running: false,
  url: "http://127.0.0.1:4317",
};
const bridge = (extra: object = {}) => ({
  getApiConfig: () => Promise.resolve(status),
  setApiConfig: () => Promise.resolve(status),
  regenerateApiToken: () => Promise.resolve(status),
  getConnectInfo: () => Promise.resolve({ serverPath: "/x/server.mjs" }),
  ...extra,
});
const renderPage = () =>
  render(
    <MemoryRouter>
      <AiHubPage />
    </MemoryRouter>,
  );

describe("AiHubPage", () => {
  afterEach(() => {
    delete win.electron;
    aiFeatures.enabled = true;
    listed.providers = [];
    localStorage.clear();
  });

  it("locks the agent part outside the Mac app instead of offering a bar to open", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "AI assistant" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Available ONLY in the Mac app."),
    ).toBeInTheDocument();
    // Nothing to expand, and none of the agent setup is shown.
    expect(
      screen.queryByRole("button", {
        name: /Chat with your data from an AI agent/,
      }),
    ).toBeNull();
    expect(screen.queryByText("How do you want to chat?")).toBeNull();
    expect(screen.queryByText(/Reads and updates your data/)).toBeNull();
    // The in-app part still works on the web.
    expect(
      screen.getByRole("button", { name: /AI inside the app/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("shows only the AI switch when AI features are off", () => {
    aiFeatures.enabled = false;
    renderPage();
    expect(screen.getByText("AI is off")).toBeInTheDocument();
    expect(screen.queryByText("provider list")).toBeNull();
    expect(
      screen.queryByRole("heading", {
        name: "Chat with your data from an AI agent",
      }),
    ).toBeNull();
  });

  it("explains an older desktop build without the API bridge", () => {
    win.electron = { selectFolder: () => Promise.resolve(null) };
    renderPage();
    expect(
      screen.getByText(/does not include the Local API/i),
    ).toBeInTheDocument();
  });

  it("explains a build without getConnectInfo", async () => {
    win.electron = bridge({ getConnectInfo: undefined });
    renderPage();
    expect(
      await screen.findByText(/cannot connect agents yet/i),
    ).toBeInTheDocument();
  });

  it("renders the panel and the switch turns the Local API on", async () => {
    const setApiConfig = vi.fn(() =>
      Promise.resolve({ ...status, enabled: true, running: true }),
    );
    win.electron = bridge({ setApiConfig });
    renderPage();
    fireEvent.click(await screen.findByLabelText("Allow agents to connect"));
    await waitFor(() =>
      expect(setApiConfig).toHaveBeenCalledWith({ enabled: true }),
    );
  });

  it("does not switch the API on by itself", async () => {
    const setApiConfig = vi.fn(() => Promise.resolve(status));
    win.electron = bridge({ setApiConfig });
    renderPage();
    await screen.findByLabelText("Allow agents to connect");
    expect(setApiConfig).not.toHaveBeenCalled();
  });

  it("switching Allow agents to connect off disconnects, everywhere on the page", async () => {
    const on = { ...status, enabled: true, running: true };
    const setApiConfig = vi.fn(() =>
      Promise.resolve({ ...on, enabled: false, running: false }),
    );
    win.electron = bridge({
      getApiConfig: () => Promise.resolve(on),
      setApiConfig,
    });
    renderPage();
    expect(
      await screen.findByText("On. Agents on this computer can connect."),
    ).toBeInTheDocument();
    // There is no separate disconnect button: the switch is the control.
    expect(screen.queryByRole("button", { name: /Disconnect/ })).toBeNull();
    fireEvent.click(screen.getByLabelText("Allow agents to connect"));
    await waitFor(() =>
      expect(setApiConfig).toHaveBeenCalledWith({ enabled: false }),
    );
    expect(
      await screen.findByText("Off. No agent can connect."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Allow agents to connect")).not.toBeChecked();
    expect(screen.queryByText("Ready")).toBeNull();
  });

  it("never shows the outdated message while connection details load", async () => {
    let resolveInfo: (v: { serverPath: string }) => void = () => {};
    win.electron = bridge({
      getConnectInfo: () =>
        new Promise((resolve) => {
          resolveInfo = resolve;
        }),
    });
    renderPage();
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(/cannot connect agents yet/i)).toBeNull();
    expect(screen.queryByLabelText("Allow agents to connect")).toBeNull();
    resolveInfo({ serverPath: "/x/server.mjs" });
    expect(
      await screen.findByLabelText("Allow agents to connect"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cannot connect agents yet/i)).toBeNull();
  });

  it("shows a plain error when getConnectInfo rejects", async () => {
    win.electron = bridge({
      getConnectInfo: () => Promise.reject(new Error("boom")),
    });
    renderPage();
    expect(
      await screen.findByText(/Could not read the connection details/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cannot connect agents yet/i)).toBeNull();
  });

  it("shows a plain error when getApiConfig rejects", async () => {
    win.electron = bridge({
      getApiConfig: () => Promise.reject(new Error("boom")),
    });
    renderPage();
    expect(
      await screen.findByText(/Could not read the Local API status/i),
    ).toBeInTheDocument();
  });

  it("states honestly what is sent, as short facts on each bar", async () => {
    win.electron = bridge();
    renderPage();
    for (const fact of [
      "Powers Auto-categorize",
      "Sends payee names only, never amounts",
      "Works without agent access",
      "Reads and updates your data",
      "What it reads is sent to its AI provider",
      "A local LLM keeps your data private",
      "Its switch also runs the Local API for scripts",
    ]) {
      expect(screen.getByText(fact)).toBeInTheDocument();
    }
  });

  it("shows the providers and the agent steps on one page, with no tabs", async () => {
    win.electron = bridge();
    renderPage();
    expect(screen.getByText("provider list")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Allow agents to connect"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /AI Providers/ })).toBeNull();
  });

  it("says nothing is set up when there is no provider", () => {
    renderPage();
    expect(
      screen.getByText("Not set up yet. Add a provider to start."),
    ).toBeInTheDocument();
  });

  it("reports a local model as in use without a key, and opens the agent steps on it", async () => {
    listed.providers = [
      {
        id: "p1",
        name: "Local Agent",
        type: "CUSTOM",
        baseUrl: "http://localhost:1234/v1",
        isDefault: true,
      },
    ];
    win.electron = bridge({
      getApiConfig: () =>
        Promise.resolve({ ...status, enabled: true, running: true }),
    });
    renderPage();
    expect(
      await screen.findByText(
        "Local Agent is in use. Your own endpoint, no key needed.",
      ),
    ).toBeInTheDocument();
    // The agent steps follow what is already set up instead of starting over.
    expect(
      await screen.findByRole("tab", { name: /A private model/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Picked to match Local Agent/)).toBeInTheDocument();
  });

  it("says when the provider in use still needs its key", async () => {
    listed.providers = [
      {
        id: "p2",
        name: "Claude",
        type: "ANTHROPIC",
        baseUrl: "https://api.anthropic.com/v1/messages",
        isDefault: true,
      },
    ];
    renderPage();
    expect(
      await screen.findByText("Claude still needs its API key."),
    ).toBeInTheDocument();
  });

  it("shares one on/off state between the agent steps and the Local API card", async () => {
    const on = { ...status, enabled: true, running: true };
    const setApiConfig = vi.fn(() => Promise.resolve(on));
    win.electron = bridge({ setApiConfig });
    renderPage();
    fireEvent.click(await screen.findByLabelText("Allow agents to connect"));
    // The Local API row sits under the same switch and follows it.
    const row = await screen.findByRole("button", {
      name: /Local API for scripts\s*On/,
    });
    fireEvent.click(row);
    expect(await screen.findByLabelText("Port")).toBeInTheDocument();
    expect(
      screen.getByText("On. Agents on this computer can connect."),
    ).toBeInTheDocument();
  });

  it("shows one on/off switch for agent access, not two", async () => {
    win.electron = bridge();
    renderPage();
    await screen.findByLabelText("Allow agents to connect");
    expect(screen.queryByLabelText("Enable local API")).toBeNull();
    // The Local API lives inside the agent steps, right under its switch.
    const panel = screen
      .getByLabelText("Allow agents to connect")
      .closest("[aria-labelledby='connect-agent-title']");
    const row = screen.getByRole("button", {
      name: /Local API for scripts\s*Off/,
    });
    expect(panel).toContainElement(row);
    fireEvent.click(row);
    expect(
      screen.getByText(
        "Switch on Allow agents to connect to see the address and access token.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Port")).toBeNull();
  });

  it("does not call the private-model route ready when no local model is set up", async () => {
    const on = { ...status, enabled: true, running: true };
    win.electron = bridge({ getApiConfig: () => Promise.resolve(on) });
    renderPage();
    fireEvent.mouseDown(
      await screen.findByRole("tab", { name: /A private model/ }),
      { button: 0 },
    );
    expect(
      await screen.findByText(/No model on this computer is set up/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Open a chat in LM Studio/)).toBeNull();
    const steps = screen.getByRole("list", { name: "Steps" }).textContent;
    expect(steps).not.toMatch(/Pick how you chat with your money\s*\(done\)/);
    expect(steps).not.toMatch(/Ready to ask your first question/);
  });

  it("blocks the private-model route while the local model is an embedding model", async () => {
    listed.providers = [
      {
        id: "p1",
        name: "Local Agent",
        type: "CUSTOM",
        baseUrl: "http://localhost:1234/v1",
        model: "text-embedding-nomic-embed-text-v1.5",
        isDefault: true,
      },
    ];
    const on = { ...status, enabled: true, running: true };
    win.electron = bridge({ getApiConfig: () => Promise.resolve(on) });
    renderPage();
    expect(
      await screen.findByText(/Your local model is an embedding model/),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Steps" }).textContent).not.toMatch(
      /Ready to ask your first question/,
    );
  });

  it("shows each part of AI as a bar that closes and stays closed", async () => {
    win.electron = bridge();
    const { unmount } = renderPage();
    const inApp = screen.getByRole("button", { name: /AI inside the app/ });
    const agents = screen.getByRole("button", {
      name: /Chat with your data from an AI agent/,
    });
    expect(inApp).toHaveAttribute("aria-expanded", "true");
    expect(agents).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(agents);
    expect(agents).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Allow agents to connect")).toBeNull();
    // The bar still reports the state while closed.
    expect(agents.textContent).toMatch(/Off\. No agent can connect\./);
    expect(inApp).toHaveAttribute("aria-expanded", "true");

    unmount();
    renderPage();
    expect(
      screen.getByRole("button", {
        name: /Chat with your data from an AI agent/,
      }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the agent bar when arriving for the agent steps, even if it was closed", async () => {
    localStorage.setItem(
      "vaulted.aiBars",
      JSON.stringify({ "ai-agents": false }),
    );
    win.electron = bridge();
    render(
      <MemoryRouter>
        <AiHubPage focus="agents" />
      </MemoryRouter>,
    );
    expect(
      await screen.findByLabelText("Allow agents to connect"),
    ).toBeInTheDocument();
  });

  it("does not call a provider with an embedding model ready", async () => {
    listed.providers = [
      {
        id: "p1",
        name: "Local Agent",
        type: "CUSTOM",
        baseUrl: "http://localhost:1234/v1",
        model: "text-embedding-nomic-embed-text-v1.5",
        isDefault: true,
      },
    ];
    renderPage();
    expect(
      await screen.findByText(
        "Local Agent is in use, but its model cannot chat. Pick another.",
      ),
    ).toBeInTheDocument();
  });

  it("does not say Ready when the chosen agent is not installed", async () => {
    const on = { ...status, enabled: true, running: true };
    win.electron = bridge({
      getApiConfig: () => Promise.resolve(on),
      detectCodex: () => Promise.resolve({ cli: false }),
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole("tab", { name: /Codex/ }), {
      button: 0,
    });
    expect(
      await screen.findByText(/Codex is not on this computer yet/),
    ).toBeInTheDocument();
    const steps = screen.getByRole("list", { name: "Steps" }).textContent;
    expect(steps).toMatch(/Switch on\s*\(done\)/);
    expect(steps).not.toMatch(/money\s*\(done\)/);
    expect(steps).not.toMatch(/Ready to ask your first question/);
    expect(screen.queryByText(/Type codex in a terminal/)).toBeNull();
  });
});

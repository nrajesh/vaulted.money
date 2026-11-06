import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConnectToAgentPanel from "./ConnectToAgentPanel";
import type { ApiServerStatus } from "@/utils/electron";

const TOKEN = "secret-token-abc123";
const SERVER_PATH = "/Applications/Vaulted Money/mcp/server.mjs";

const makeStatus = (over: Partial<ApiServerStatus> = {}): ApiServerStatus => ({
  enabled: false,
  port: 4317,
  token: TOKEN,
  running: false,
  url: "http://127.0.0.1:4317",
  ...over,
});

describe("ConnectToAgentPanel", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });
  afterEach(() => vi.restoreAllMocks());

  const renderPanel = (
    status = makeStatus(),
    handlers = { onEnable: vi.fn(), onDisconnect: vi.fn() },
  ) => {
    render(
      <ConnectToAgentPanel
        status={status}
        serverPath={SERVER_PATH}
        onEnable={handlers.onEnable}
        onDisconnect={handlers.onDisconnect}
      />,
    );
    return handlers;
  };

  it("shows Off and never renders the token when the API is off", () => {
    const { container } = render(
      <ConnectToAgentPanel
        status={makeStatus()}
        serverPath={SERVER_PATH}
        onEnable={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );
    expect(screen.getByText("Connect to agent")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(TOKEN);
  });

  it("shows Ready when the API is running", () => {
    renderPanel(makeStatus({ enabled: true, running: true }));
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("calls onEnable when the switch is turned on", () => {
    const { onEnable } = renderPanel();
    fireEvent.click(screen.getByRole("switch"));
    expect(onEnable).toHaveBeenCalledTimes(1);
  });

  it("copies exact snippets and never the token", async () => {
    renderPanel(makeStatus({ enabled: true, running: true }));
    fireEvent.click(
      screen.getByRole("button", { name: "Copy Claude Code commands" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Copy local model configuration" }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    const [code, local] = writeText.mock.calls.map((c) => c[0] as string);
    expect(code).toBe(
      "/plugin marketplace add nrajesh/vaulted.money\n/plugin install vaulted-money@vaulted-money",
    );
    expect(JSON.parse(local)).toEqual({
      mcpServers: {
        "vaulted-money": { command: "node", args: [SERVER_PATH] },
      },
    });
    expect(local).toContain(SERVER_PATH);
    for (const [text] of writeText.mock.calls) {
      expect(text).not.toContain(TOKEN);
    }
  });

  it("links to the latest release for Claude Desktop", () => {
    renderPanel();
    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/nrajesh/vaulted.money/releases/latest",
    );
    expect(screen.getByText(/double-click/i)).toBeInTheDocument();
  });

  it("states the privacy facts plainly", () => {
    renderPanel();
    expect(screen.getByText(/sent to the AI provider/i)).toBeInTheDocument();
    expect(screen.getByText(/local model/i, { selector: "p" })).toBeTruthy();
    expect(screen.getByText(/claude\.ai website/i)).toBeInTheDocument();
    expect(screen.getByText(/Node 18/)).toBeInTheDocument();
  });

  it("asks for confirmation before disconnecting", () => {
    const { onDisconnect } = renderPanel(
      makeStatus({ enabled: true, running: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Disconnect everything" }),
    );
    expect(onDisconnect).not.toHaveBeenCalled();
    expect(screen.getByText(/cuts off every connected agent/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Confirm disconnect" }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("can cancel the disconnect", () => {
    const { onDisconnect } = renderPanel();
    fireEvent.click(
      screen.getByRole("button", { name: "Disconnect everything" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDisconnect).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ConnectToAgentPanel from "./ConnectToAgentPanel";
import type { ApiServerStatus } from "@/utils/electron";

vi.mock("@/utils/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));
import { showError } from "@/utils/toast";

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
    vi.mocked(showError).mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });
  afterEach(() => vi.restoreAllMocks());

  const renderPanel = (
    status = makeStatus(),
    handlers = { onToggle: vi.fn(), onDisconnect: vi.fn() },
  ) => {
    render(
      <ConnectToAgentPanel
        status={status}
        serverPath={SERVER_PATH}
        onToggle={handlers.onToggle}
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
        onToggle={vi.fn()}
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

  it("calls onToggle(true) when the switch is turned on", () => {
    const { onToggle } = renderPanel();
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("calls onToggle(false) when the switch is turned off", () => {
    const { onToggle } = renderPanel(makeStatus({ enabled: true }));
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("shows an error and no copied state when the clipboard rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    renderPanel();
    const button = screen.getByRole("button", {
      name: "Copy Claude Code commands",
    });
    fireEvent.click(button);
    await waitFor(() => expect(showError).toHaveBeenCalledTimes(1));
    expect(button.querySelector(".lucide-check")).toBeNull();
  });

  it("leaves no timer behind after unmount", async () => {
    vi.useFakeTimers();
    try {
      renderPanel();
      fireEvent.click(
        screen.getByRole("button", { name: "Copy Claude Code commands" }),
      );
      await vi.advanceTimersByTimeAsync(0);
      cleanup();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
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

  it("names the download link by its visible text and explains the switch", () => {
    renderPanel();
    expect(
      screen.getByRole("link", { name: "Download the .mcpb bundle" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/also turns the Local API/i)).toBeInTheDocument();
  });

  it("can cancel the disconnect", () => {
    const { onDisconnect } = renderPanel();
    fireEvent.click(
      screen.getByRole("button", { name: "Disconnect everything" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDisconnect).not.toHaveBeenCalled();
  });

  it("renders its title at the requested heading level", () => {
    const props = {
      status: makeStatus(),
      serverPath: SERVER_PATH,
      onToggle: vi.fn(),
      onDisconnect: vi.fn(),
    };
    const { rerender } = render(<ConnectToAgentPanel {...props} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Connect to agent" }),
    ).toBeInTheDocument();
    rerender(<ConnectToAgentPanel {...props} headingLevel={2} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Connect to agent" }),
    ).toBeInTheDocument();
  });
});

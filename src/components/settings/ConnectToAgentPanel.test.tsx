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

  const selectChoice = (name: RegExp) =>
    fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0 });

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
    selectChoice(/Claude Code/);
    const button = screen.getByRole("button", { name: "Copy step 1" });
    fireEvent.click(button);
    await waitFor(() => expect(showError).toHaveBeenCalledTimes(1));
    expect(button.querySelector(".lucide-check")).toBeNull();
  });

  it("leaves no timer behind after unmount", async () => {
    vi.useFakeTimers();
    try {
      renderPanel();
      selectChoice(/Claude Code/);
      fireEvent.click(screen.getByRole("button", { name: "Copy step 1" }));
      await vi.advanceTimersByTimeAsync(0);
      cleanup();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("defaults to the Claude app and shows only its steps", () => {
    renderPanel();
    expect(screen.getByRole("tab", { name: /The Claude app/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("link", {
        name: /Download vaulted-money\.mcpb from the latest release/,
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/nrajesh/vaulted.money/releases/latest",
    );
    expect(
      screen.getByRole("link", { name: /opens in a new tab/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Claude asks you to confirm/)).toBeInTheDocument();
    expect(screen.getByText(/Keep Vaulted Money open/)).toBeInTheDocument();
    expect(screen.getByText(/No extra software/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy setup" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy step 1" })).toBeNull();
  });

  it("shows each choice's own steps and hides the others", () => {
    renderPanel();
    selectChoice(/private model/);
    expect(screen.getByRole("button", { name: "Copy setup" })).toBeVisible();
    expect(screen.getByText(/Edit mcp\.json/)).toBeInTheDocument();
    expect(screen.getByText(/Choose a model that can use tools/)).toBeVisible();
    expect(screen.getByText(/Requires Node 18/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your questions and data stay on this computer when the model runs here.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Download/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy step 1" })).toBeNull();

    selectChoice(/Claude Code/);
    expect(screen.getByText("In the Claude app")).toBeInTheDocument();
    expect(screen.getByText("In a terminal")).toBeInTheDocument();
    expect(
      screen.getByText(/Open Settings, then Customize, then Plugins/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Add from a repository/)).toBeInTheDocument();
    expect(
      screen.getByText(/Open Discover, find Vaulted Money/),
    ).toBeInTheDocument();
    expect(screen.getByText("No commands needed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy step 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy step 2" })).toBeVisible();
    expect(screen.getByText(/Needs Node 18/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy setup" })).toBeNull();
  });

  it("copies exact text for every button and never the token", async () => {
    const { container } = render(
      <ConnectToAgentPanel
        status={makeStatus({ enabled: true, running: true })}
        serverPath={SERVER_PATH}
        onToggle={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );
    selectChoice(/private model/);
    fireEvent.click(screen.getByRole("button", { name: "Copy setup" }));
    selectChoice(/Claude Code/);
    fireEvent.click(screen.getByRole("button", { name: "Copy step 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy step 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy question 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy question 2" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(5));
    const [local, one, two, ask1, ask2] = writeText.mock.calls.map(
      (c) => c[0] as string,
    );
    expect(JSON.parse(local)).toEqual({
      mcpServers: {
        "vaulted-money": { command: "node", args: [SERVER_PATH] },
      },
    });
    expect(one).toBe("/plugin marketplace add nrajesh/vaulted.money");
    expect(two).toBe("/plugin install vaulted-money@vaulted-money");
    expect(ask1).toBe("Where is my money going this month?");
    expect(ask2).toBe("Am I over budget anywhere?");
    for (const [text] of writeText.mock.calls) {
      expect(text).not.toContain(TOKEN);
    }
    expect(container.innerHTML).not.toContain(TOKEN);
  });

  it("copies the repository name for the Claude app route and announces copies", async () => {
    renderPanel();
    selectChoice(/Claude Code/);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    fireEvent.click(
      screen.getByRole("button", { name: "Copy repository name" }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("nrajesh/vaulted.money"),
    );
    await waitFor(() => expect(status).toHaveTextContent("Copied"));
  });

  it("keeps the privacy claims accurate", () => {
    renderPanel();
    expect(screen.getByText("Keeps data on your device")).toBeInTheDocument();
    expect(screen.queryByText(/Nothing leaves/)).toBeNull();
    expect(screen.queryByText("Most private")).toBeNull();
  });

  it("marks step 1 done only when enabled", () => {
    const { unmount } = render(
      <ConnectToAgentPanel
        status={makeStatus({ enabled: false })}
        serverPath={SERVER_PATH}
        onToggle={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );
    expect(screen.getByRole("list", { name: "Steps" }).textContent).not.toMatch(
      /\(done\)/,
    );
    unmount();
    renderPanel(makeStatus({ enabled: true, running: true }));
    const strip = screen.getByRole("list", { name: "Steps" });
    expect(strip.textContent).toMatch(/Switch on\s*\(done\)/);
    expect(strip.textContent).toMatch(/Pick how you chat with your money/);
    expect(strip.textContent).toMatch(/Ask your first question/);
  });

  it("lets the keyboard move between the choices", async () => {
    renderPanel();
    const app = screen.getByRole("tab", { name: /The Claude app/ });
    app.focus();
    fireEvent.keyDown(app, { key: "ArrowRight" });
    const local = screen.getByRole("tab", { name: /private model/ });
    await waitFor(() => expect(local).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("button", { name: "Copy setup" })).toBeVisible();
    fireEvent.keyDown(local, { key: "ArrowRight" });
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Claude Code/ })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
  });

  it("states the privacy facts plainly", () => {
    renderPanel();
    expect(screen.getByText(/sent to the AI provider/i)).toBeInTheDocument();
    expect(screen.getByText(/local model/i, { selector: "p" })).toBeTruthy();
    expect(screen.getByText(/claude\.ai website/i)).toBeInTheDocument();
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

  it("explains the switch", () => {
    renderPanel();
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

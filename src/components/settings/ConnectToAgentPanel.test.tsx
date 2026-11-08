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
    const button = screen.getByRole("button", { name: "Copy commands" });
    fireEvent.click(button);
    await waitFor(() => expect(showError).toHaveBeenCalledTimes(1));
    expect(button.querySelector(".lucide-check")).toBeNull();
  });

  it("leaves no timer behind after unmount", async () => {
    vi.useFakeTimers();
    try {
      renderPanel();
      selectChoice(/Claude Code/);
      fireEvent.click(screen.getByRole("button", { name: "Copy commands" }));
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
    expect(screen.queryByRole("button", { name: "Copy commands" })).toBeNull();
  });

  it("shows each choice's own steps and hides the others", () => {
    renderPanel();
    selectChoice(/A private model/);
    expect(screen.getByRole("button", { name: "Copy setup" })).toBeVisible();
    expect(screen.getByText(/Edit mcp\.json/)).toBeInTheDocument();
    expect(screen.getByText(/Choose a model that can use tools/)).toBeVisible();
    expect(screen.getByText(/Requires Node 18/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your questions and data stay on this computer when the model runs here (for example LM Studio).",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Download/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy commands" })).toBeNull();

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
    expect(screen.getByRole("button", { name: "Copy commands" })).toBeVisible();
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
    selectChoice(/A private model/);
    fireEvent.click(screen.getByRole("button", { name: "Copy setup" }));
    selectChoice(/Claude Code/);
    fireEvent.click(screen.getByRole("button", { name: "Copy commands" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy question 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy question 2" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(4));
    const [local, commands, ask1, ask2] = writeText.mock.calls.map(
      (c) => c[0] as string,
    );
    expect(JSON.parse(local)).toEqual({
      mcpServers: {
        "vaulted-money": { command: "node", args: [SERVER_PATH] },
      },
    });
    // A plain terminal needs the `claude` prefix; `/plugin` only works
    // inside a running Claude Code session.
    expect(commands).toBe(
      "claude plugin marketplace add nrajesh/vaulted.money\nclaude plugin install vaulted-money@vaulted-money",
    );
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
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Copy repository name" }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("nrajesh/vaulted.money"),
    );
    await waitFor(() => expect(status).toHaveTextContent("Copied"));
  });

  it("keeps heading levels in order", () => {
    renderPanel();
    selectChoice(/Claude Code/);
    const levels = screen
      .getAllByRole("heading")
      .map((h) => Number(h.tagName.slice(1)));
    // Card titles are h3 like the other pages; sections inside are h4 and h5.
    expect(levels).toEqual([3, 4, 5, 5, 3, 4]);
  });

  it("keeps the privacy claims accurate", () => {
    renderPanel();
    // The card face stays short; the full privacy sentence lives in the steps.
    expect(screen.getByText("Stays on your device")).toBeInTheDocument();
    expect(
      screen.getByText("Runs on your computer, for example in LM Studio."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/stay on this computer/)).toBeNull();
    selectChoice(/A private model/);
    expect(
      screen.getByText(
        "Your questions and data stay on this computer when the model runs here (for example LM Studio).",
      ),
    ).toBeInTheDocument();
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
    const local = screen.getByRole("tab", { name: /A private model/ });
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

  it("renders its title as a card heading", () => {
    renderPanel();
    expect(
      screen.getByRole("heading", { level: 3, name: "Connect to agent" }),
    ).toBeInTheDocument();
  });

  describe("finding Claude on this computer", () => {
    const bridge = (over: Record<string, unknown>) => {
      (window as unknown as { electron?: unknown }).electron = over;
    };
    afterEach(() => {
      delete (window as unknown as { electron?: unknown }).electron;
    });

    it("shows only the manual steps when the build cannot look", () => {
      renderPanel();
      selectChoice(/Claude Code/);
      expect(
        screen.queryByRole("button", { name: "Set up Claude Code for me" }),
      ).toBeNull();
      expect(screen.queryByText(/could not find/i)).toBeNull();
    });

    it("offers the setup button when Claude Code is found and reports success", async () => {
      const setup = vi.fn().mockResolvedValue("ready");
      bridge({
        detectClaude: vi.fn().mockResolvedValue({ code: true, desktop: true }),
        setupClaudeCodePlugin: setup,
      });
      renderPanel();
      selectChoice(/Claude Code/);
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Set up Claude Code for me",
        }),
      );
      expect(await screen.findByText(/Done\. Open Claude Code/)).toBeVisible();
      expect(setup).toHaveBeenCalledWith();
    });

    it("falls back to the manual steps when the setup fails", async () => {
      bridge({
        detectClaude: vi.fn().mockResolvedValue({ code: true, desktop: true }),
        setupClaudeCodePlugin: vi.fn().mockRejectedValue(new Error("boom")),
      });
      renderPanel();
      selectChoice(/Claude Code/);
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Set up Claude Code for me",
        }),
      );
      expect(await screen.findByText(/did not work/)).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Copy commands" }),
      ).toBeVisible();
    });

    it("links to the Claude Code page when it is not installed", async () => {
      bridge({
        detectClaude: vi.fn().mockResolvedValue({ code: false, desktop: true }),
      });
      renderPanel();
      selectChoice(/Claude Code/);
      const link = await screen.findByRole("link", { name: /Get Claude Code/ });
      expect(link).toHaveAttribute("href", "https://claude.com/claude-code");
      expect(
        screen.queryByRole("button", { name: "Set up Claude Code for me" }),
      ).toBeNull();
    });

    it("links to the Claude app download when the app is not installed", async () => {
      bridge({
        detectClaude: vi.fn().mockResolvedValue({ code: true, desktop: false }),
      });
      renderPanel();
      const link = await screen.findByRole("link", {
        name: /Get the Claude app/,
      });
      expect(link).toHaveAttribute("href", "https://claude.ai/download");
    });
  });

  describe("Codex", () => {
    const bridge = (over: Record<string, unknown>) => {
      (window as unknown as { electron?: unknown }).electron = over;
    };
    afterEach(() => {
      delete (window as unknown as { electron?: unknown }).electron;
    });

    it("always offers the config snippet with the server path, never the token", () => {
      renderPanel();
      selectChoice(/^Codex/);
      expect(screen.getByText(/\[mcp_servers\.vaulted-money\]/)).toBeVisible();
      expect(screen.getByText(/command = "node"/)).toBeVisible();
      expect(document.body.textContent).not.toContain("secret-token");
    });

    it("offers one-click setup when Codex is found and reports success", async () => {
      const setup = vi.fn().mockResolvedValue("ready");
      bridge({
        detectCodex: vi.fn().mockResolvedValue({ cli: true }),
        setupCodex: setup,
      });
      renderPanel();
      selectChoice(/^Codex/);
      fireEvent.click(
        await screen.findByRole("button", { name: "Set up Codex for me" }),
      );
      expect(await screen.findByText(/Done\. Open Codex/)).toBeVisible();
      expect(setup).toHaveBeenCalledWith();
    });

    it("says when Node.js is needed", async () => {
      bridge({
        detectCodex: vi.fn().mockResolvedValue({ cli: true }),
        setupCodex: vi.fn().mockResolvedValue("node-missing"),
      });
      renderPanel();
      selectChoice(/^Codex/);
      fireEvent.click(
        await screen.findByRole("button", { name: "Set up Codex for me" }),
      );
      expect(
        await screen.findByText(/Node 18 or newer is needed/),
      ).toBeVisible();
    });

    it("shows install help when Codex is not found", async () => {
      bridge({ detectCodex: vi.fn().mockResolvedValue({ cli: false }) });
      renderPanel();
      selectChoice(/^Codex/);
      expect(
        await screen.findByRole("link", { name: /Get Codex/ }),
      ).toHaveAttribute("href", "https://github.com/openai/codex");
      expect(screen.getByText("npm install -g @openai/codex")).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Set up Codex for me" }),
      ).toBeNull();
    });
  });
});

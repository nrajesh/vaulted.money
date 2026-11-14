import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelpDrawer } from "./HelpDrawer";
import {
  HelpDrawerProvider,
  useHelpDrawer,
} from "@/contexts/HelpDrawerContext";
import {
  DisplayPreferencesApplier,
  resetDisplayPreferencesCache,
} from "@/hooks/useDisplayPreferences";
import { helpCardsForPath } from "./helpTopics";

vi.mock("@/hooks/useAiFeatures", () => ({
  useAiFeatures: () => ({ enabled: false, ready: true, setEnabled: vi.fn() }),
}));
vi.mock("@/hooks/useAIConfig", () => ({
  useAIConfig: () => ({ config: { provider: null, apiKey: "" } }),
}));

const OpenButton = () => {
  const { openHelp } = useHelpDrawer();
  return (
    <>
      <button onClick={() => openHelp()}>open help</button>
      <button onClick={() => openHelp("ask")}>open ask</button>
    </>
  );
};

const renderDrawer = (path = "/accounts") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <HelpDrawerProvider>
        <DisplayPreferencesApplier />
        <HelpDrawer />
        <OpenButton />
        <Routes>
          <Route path="/ai-providers" element={<p>ai setup page</p>} />
          <Route path="*" element={null} />
        </Routes>
      </HelpDrawerProvider>
    </MemoryRouter>,
  );

describe("HelpDrawer", () => {
  beforeAll(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
  });

  beforeEach(() => {
    localStorage.clear();
    resetDisplayPreferencesCache();
    document.documentElement.removeAttribute("data-text-size");
    document.documentElement.removeAttribute("data-contrast");
    document.documentElement.removeAttribute("data-reduce-motion");
  });

  it("shows help cards for the current screen", async () => {
    renderDrawer("/accounts");
    await userEvent.click(screen.getByText("open help"));
    const dialog = await screen.findByRole("dialog", { name: "Help" });
    expect(within(dialog).getByText("Where your money lives")).toBeVisible();
    expect(within(dialog).getByText("Match your bank's balance")).toBeVisible();
  });

  it("previews the matching User Guide section in place", async () => {
    renderDrawer("/backup");
    await userEvent.click(screen.getByText("open help"));
    await userEvent.click(
      await screen.findByRole("button", { name: "Read more: Backups" }),
    );
    const preview = await screen.findByRole("dialog", { name: "Backups" });
    expect(
      within(preview).getByRole("link", { name: /Read more/ }),
    ).toHaveAttribute("href", expect.stringContaining("USER_GUIDE.md#backups"));
  });

  it("applies text size, contrast and motion settings and remembers them", async () => {
    renderDrawer();
    await userEvent.click(screen.getByText("open help"));
    await userEvent.click(await screen.findByRole("radio", { name: /Larger/ }));
    await userEvent.click(
      screen.getByRole("switch", { name: "High contrast" }),
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "Reduce motion" }),
    );

    const root = document.documentElement;
    expect(root).toHaveAttribute("data-text-size", "larger");
    expect(root).toHaveAttribute("data-contrast", "high");
    expect(root).toHaveAttribute("data-reduce-motion", "true");
    expect(JSON.parse(localStorage.getItem("vm.displayPreferences")!)).toEqual({
      textSize: "larger",
      highContrast: true,
      reduceMotion: true,
    });
  });

  it("guides asking AI without a chat, and links to setup", async () => {
    renderDrawer("/dashboard");
    await userEvent.click(screen.getByText("open ask"));
    const dialog = await screen.findByRole("dialog", { name: "Help" });
    expect(within(dialog).getByText("Off")).toBeVisible();
    expect(within(dialog).getByText("Not set up")).toBeVisible();
    expect(within(dialog).getByText("Mac app only")).toBeVisible();
    expect(
      within(dialog).getByRole("button", {
        name: "Copy question: Am I over budget anywhere this month?",
      }),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Set up the AI assistant" }),
    );
    expect(screen.getByText("ai setup page")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Help" })).toBeNull();
  });
});

describe("helpCardsForPath", () => {
  it("matches report sub-pages and falls back for unknown screens", () => {
    expect(helpCardsForPath("/reports/advanced")).toContain("reports");
    expect(helpCardsForPath("/settings")).toEqual(["privacy", "ledgers"]);
  });
});

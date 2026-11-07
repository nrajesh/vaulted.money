import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";
import { ConnectAgentSidebarItem } from "./Layout";

const win = window as unknown as { electron?: unknown };
const translate = ((_key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? _key) as never;

const renderItem = (isActive = false) =>
  render(
    <MemoryRouter>
      <SidebarProvider>
        <SidebarMenu>
          <li>AI Providers</li>
          <ConnectAgentSidebarItem isActive={isActive} t={translate} />
        </SidebarMenu>
      </SidebarProvider>
    </MemoryRouter>,
  );

describe("ConnectAgentSidebarItem", () => {
  // SidebarProvider reads matchMedia, which jsdom does not provide.
  beforeAll(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })) as typeof window.matchMedia;
  });

  afterEach(() => {
    delete win.electron;
  });

  it("links to the agent page when the desktop bridge exists", () => {
    win.electron = { getApiConfig: () => Promise.resolve({}) };
    renderItem();
    const link = screen.getByRole("link", { name: "Connect agent" });
    expect(link).toHaveAttribute("href", "/connect-agent");
    // It comes right after the AI Providers entry.
    expect(
      screen.getByText("AI Providers").nextElementSibling,
    ).toContainElement(link);
  });

  it("marks itself active on the agent page", () => {
    win.electron = { getApiConfig: () => Promise.resolve({}) };
    renderItem(true);
    expect(screen.getByRole("link", { name: "Connect agent" })).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("is absent without the bridge", () => {
    renderItem();
    expect(screen.queryByRole("link", { name: "Connect agent" })).toBeNull();
  });

  it("is absent on an older desktop build without getApiConfig", () => {
    win.electron = { selectFolder: () => Promise.resolve(null) };
    renderItem();
    expect(screen.queryByRole("link", { name: "Connect agent" })).toBeNull();
  });
});

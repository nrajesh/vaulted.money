import { beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebarNav } from "./AppSidebarNav";

const renderNav = (
  path: string,
  env = { isNative: false, hasDesktopBridge: false },
) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider defaultOpen>
        <AppSidebarNav env={env} />
      </SidebarProvider>
    </MemoryRouter>,
  );

describe("AppSidebarNav", () => {
  // SidebarProvider reads matchMedia, which jsdom does not provide.
  beforeAll(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  it("shows the intent groups with plain labels", () => {
    renderNav("/dashboard");
    for (const label of [
      "Everyday",
      "Plan & understand",
      "Organise",
      "AI & connections",
      "More options",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Payees" })).toHaveAttribute(
      "href",
      "/vendors",
    );
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("folds power-user pages away until opened", async () => {
    renderNav("/dashboard");
    expect(screen.queryByRole("link", { name: "Currencies" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.getByRole("link", { name: "Currencies" })).toBeVisible();
  });

  it("unfolds More options when the current page is inside it", () => {
    renderNav("/currencies");
    expect(screen.getByRole("link", { name: "Currencies" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows Connect other AI apps only with the desktop bridge", () => {
    renderNav("/dashboard");
    expect(
      screen.queryByRole("link", { name: "Connect other AI apps" }),
    ).toBeNull();
  });

  it("opens Reports and highlights it on a report page", () => {
    renderNav("/reports/advanced", { isNative: false, hasDesktopBridge: true });
    expect(screen.getByRole("link", { name: "Detailed" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Connect other AI apps" }),
    ).toHaveAttribute("href", "/connect-agent");
  });
});

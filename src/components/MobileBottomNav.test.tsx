import { beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { MobileBottomNav } from "./MobileBottomNav";

const SheetState = () => {
  const { openMobile } = useSidebar();
  return <p>{openMobile ? "sheet open" : "sheet closed"}</p>;
};

const renderNav = (path = "/transactions") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider>
        <MobileBottomNav />
        <SheetState />
      </SidebarProvider>
    </MemoryRouter>,
  );

describe("MobileBottomNav", () => {
  // jsdom has no matchMedia, which the sidebar uses to detect phones.
  beforeAll(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  it("links the four most-used pages", () => {
    renderNav();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const hrefs = Array.from(nav.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual([
      "/dashboard",
      "/transactions",
      "/accounts",
      "/budgets",
    ]);
  });

  it("marks the current page for assistive technology", () => {
    renderNav("/accounts");
    expect(screen.getByRole("link", { name: "Accounts" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Budgets" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("opens the full menu from More", async () => {
    renderNav();
    expect(screen.getByText("sheet closed")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByText("sheet open")).toBeInTheDocument();
  });
});

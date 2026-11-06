import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MobileHeaderActionsMenu } from "./Layout";

const renderMenu = () =>
  render(
    <MemoryRouter>
      <MobileHeaderActionsMenu
        displayName="Home Budget"
        hasTourForCurrentRoute={false}
        logout={vi.fn()}
        resolvedTheme="light"
        setTheme={vi.fn()}
        startTour={vi.fn()}
        t={
          ((_key: string, options?: { defaultValue?: string }) =>
            options?.defaultValue ?? _key) as never
        }
      />
    </MemoryRouter>,
  );

describe("MobileHeaderActionsMenu", () => {
  it("offers Connect an AI agent between Home and Dark mode", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual([
      "Home",
      "Connect an AI agent",
      "Dark mode",
      "Log out",
    ]);
    expect(
      screen.getByRole("menuitem", { name: "Connect an AI agent" }),
    ).toHaveAttribute("href", "/connect-agent");
  });

  it("closes the menu after choosing it", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Connect an AI agent" }),
    );
    expect(screen.queryByRole("menuitem")).toBeNull();
  });
});

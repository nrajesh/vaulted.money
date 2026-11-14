import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MobileHeaderActionsMenu, SettingsHeaderButton } from "./Layout";

const win = window as unknown as { electron?: unknown };
const translate = ((_key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? _key) as never;

const renderMenu = () =>
  render(
    <MemoryRouter>
      <MobileHeaderActionsMenu
        displayName="Home Budget"
        logout={vi.fn()}
        resolvedTheme="light"
        setTheme={vi.fn()}
        t={
          ((_key: string, options?: { defaultValue?: string }) =>
            options?.defaultValue ?? _key) as never
        }
      />
    </MemoryRouter>,
  );

describe("MobileHeaderActionsMenu", () => {
  beforeEach(() => {
    win.electron = { getApiConfig: () => Promise.resolve({}) };
  });
  afterEach(() => {
    delete win.electron;
  });

  it("offers Connect an AI agent between Home and Dark mode", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual([
      "Home",
      "Settings",
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

describe("agent entry points without the desktop bridge", () => {
  afterEach(() => {
    delete win.electron;
  });

  it("hides the menu item on web and mobile, keeping Settings", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Home", "Settings", "Dark mode", "Log out"]);
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(
      screen.queryByRole("menuitem", { name: /Connect an AI agent/ }),
    ).toBeNull();
  });

  it("hides the menu item on an older desktop build without the API bridge", async () => {
    win.electron = { selectFolder: () => Promise.resolve(null) };
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.queryByRole("menuitem", { name: /Connect an AI agent/ }),
    ).toBeNull();
  });

  it("shows a Settings button in the desktop header on every build", () => {
    render(
      <MemoryRouter>
        <SettingsHeaderButton t={translate} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});

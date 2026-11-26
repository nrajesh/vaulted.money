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

  it("offers Connect an AI agent after Settings", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual([
      "Home",
      "Settings",
      "Connect an AI agent",
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
    ).toEqual(["Home", "Settings", "Log out"]);
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

describe("theme choice in the phone menu", () => {
  it("shows Light, Auto and Dark with the saved choice selected", async () => {
    const setTheme = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeaderActionsMenu
          displayName="Home Budget"
          logout={vi.fn()}
          resolvedTheme="dark"
          theme="system"
          setTheme={setTheme}
          t={translate}
        />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByRole("menuitemradio", { name: "Auto" })).toBeChecked();
    expect(
      screen.getByRole("menuitemradio", { name: "Light" }),
    ).not.toBeChecked();
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Light" }));
    expect(setTheme).toHaveBeenCalledWith("light");
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Auto" }));
    expect(setTheme).toHaveBeenCalledWith("system");
  });

  it("reaches and picks a theme with the keyboard", async () => {
    const setTheme = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeaderActionsMenu
          displayName="Home Budget"
          logout={vi.fn()}
          resolvedTheme="light"
          theme="system"
          setTheme={setTheme}
          t={translate}
        />
      </MemoryRouter>,
    );
    screen.getByRole("button", { name: "More actions" }).focus();
    await userEvent.keyboard("{Enter}");
    const dark = screen.getByRole("menuitemradio", { name: "Dark" });
    // Arrow keys walk the menu's items until the Dark choice has focus.
    for (let step = 0; step < 15 && document.activeElement !== dark; step++) {
      await userEvent.keyboard("{ArrowDown}");
    }
    expect(document.activeElement).toBe(dark);
    await userEvent.keyboard("{Enter}");
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});

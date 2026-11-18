import { describe, expect, it, vi } from "vitest";
import type { MenuItemConstructorOptions } from "electron";
import { buildAppMenuTemplate } from "./appMenu";

const roles = (items: MenuItemConstructorOptions[]): string[] =>
  items.flatMap((item) => [
    ...(item.role ? [item.role] : []),
    ...(Array.isArray(item.submenu) ? roles(item.submenu) : []),
  ]);

const build = (overrides: { isMac?: boolean; isDev?: boolean } = {}) =>
  buildAppMenuTemplate({
    appName: "Vaulted Money",
    isMac: overrides.isMac ?? true,
    isDev: overrides.isDev ?? false,
    openWebsite: vi.fn(),
  });

describe("desktop app menu", () => {
  it("hides the web developer items in the shipped app", () => {
    const shipped = roles(build());
    expect(shipped).not.toContain("reload");
    expect(shipped).not.toContain("forceReload");
    expect(shipped).not.toContain("toggleDevTools");
  });

  it("keeps the developer items while running the dev server", () => {
    expect(roles(build({ isDev: true }))).toEqual(
      expect.arrayContaining(["reload", "toggleDevTools"]),
    );
  });

  it("has the standard Mac menus, including Edit for copy and paste", () => {
    const template = build();
    expect(template[0].label).toBe("Vaulted Money");
    expect(roles(template)).toEqual(
      expect.arrayContaining(["about", "quit", "editMenu", "windowMenu"]),
    );
  });

  it("uses a File menu with Quit on Windows and Linux", () => {
    const template = build({ isMac: false });
    expect(template[0].label).toBe("File");
    expect(roles(template)).not.toContain("about");
  });

  it("opens the website from Help", () => {
    const openWebsite = vi.fn();
    const template = buildAppMenuTemplate({
      appName: "Vaulted Money",
      isMac: true,
      isDev: false,
      openWebsite,
    });
    const help = template.find((item) => item.role === "help");
    const submenu = help?.submenu as MenuItemConstructorOptions[];
    submenu[0].click?.(
      undefined as never,
      undefined as never,
      undefined as never,
    );
    expect(openWebsite).toHaveBeenCalledOnce();
  });
});

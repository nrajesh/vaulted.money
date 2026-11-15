import { describe, expect, it, vi } from "vitest";
import * as path from "path";
import { buildTrayMenuTemplate, trayIconPath, usesTray } from "./tray";

describe("tray icon (Windows and Linux)", () => {
  it("is used on Windows and Linux, where there is no Dock to reopen the window", () => {
    expect(usesTray("win32")).toBe(true);
    expect(usesTray("linux")).toBe(true);
    expect(usesTray("darwin")).toBe(false);
  });

  it("offers to open the window and to quit", () => {
    const open = vi.fn();
    const quit = vi.fn();
    const template = buildTrayMenuTemplate({
      appName: "Vaulted Money",
      open,
      quit,
    });
    const labelled = template.filter((item) => item.label);
    expect(labelled.map((item) => item.label)).toEqual([
      "Open Vaulted Money",
      "Quit Vaulted Money",
    ]);
    labelled[0].click?.(
      undefined as never,
      undefined as never,
      undefined as never,
    );
    labelled[1].click?.(
      undefined as never,
      undefined as never,
      undefined as never,
    );
    expect(open).toHaveBeenCalledOnce();
    expect(quit).toHaveBeenCalledOnce();
  });

  it("loads its image from the app's resources once installed", () => {
    expect(
      trayIconPath({
        isPackaged: true,
        resourcesPath: "/opt/Vaulted Money/resources",
        appPath: "/ignored",
      }),
    ).toBe(path.join("/opt/Vaulted Money/resources", "tray", "tray.png"));
  });

  it("loads its image from the repository while developing", () => {
    expect(
      trayIconPath({
        isPackaged: false,
        resourcesPath: "/ignored",
        appPath: "/repo",
      }),
    ).toBe(path.join("/repo", "assets", "tray", "tray.png"));
  });
});

import type { MenuItemConstructorOptions } from "electron";
import * as path from "path";

/**
 * The notification-area (tray) icon on Windows and Linux.
 *
 * Closing the window only hides it, so scheduled backups and the Local API
 * keep running (the data lives in the window's renderer). On a Mac the Dock
 * icon brings the window back; Windows and Linux have no equivalent, so the
 * tray icon does that job, and is also where the app is quit.
 */
export function usesTray(platform: NodeJS.Platform): boolean {
  return platform === "win32" || platform === "linux";
}

export interface TrayMenuOptions {
  appName: string;
  open: () => void;
  quit: () => void;
}

export function buildTrayMenuTemplate({
  appName,
  open,
  quit,
}: TrayMenuOptions): MenuItemConstructorOptions[] {
  return [
    { label: `Open ${appName}`, click: open },
    { type: "separator" },
    { label: `Quit ${appName}`, click: quit },
  ];
}

/**
 * Where the tray image is. Installed apps ship it as an extra resource (see
 * "extraResources" in package.json); in development it is read from the repo.
 */
export function trayIconPath({
  isPackaged,
  resourcesPath,
  appPath,
}: {
  isPackaged: boolean;
  resourcesPath: string;
  appPath: string;
}): string {
  return isPackaged
    ? path.join(resourcesPath, "tray", "tray.png")
    : path.join(appPath, "assets", "tray", "tray.png");
}

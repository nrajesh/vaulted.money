import type { MenuItemConstructorOptions } from "electron";

/**
 * The desktop app's menu bar.
 *
 * Electron's default menu includes web-developer items ("Reload", "Force
 * Reload", "Toggle Developer Tools") that look out of place in a finished app.
 * This keeps the standard Mac menus (the app menu, Edit for copy/paste
 * shortcuts, View for zoom and full screen, Window) and shows the developer
 * items only while running against the dev server.
 *
 * Item labels come from Electron's built-in roles, which macOS shows in the
 * system language.
 */
export interface AppMenuOptions {
  appName: string;
  isMac: boolean;
  isDev: boolean;
  openWebsite: () => void;
}

export function buildAppMenuTemplate({
  appName,
  isMac,
  isDev,
  openWebsite,
}: AppMenuOptions): MenuItemConstructorOptions[] {
  const developerItems: MenuItemConstructorOptions[] = isDev
    ? [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
      ]
    : [];

  const template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push({
      label: appName,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  } else {
    template.push({ label: "File", submenu: [{ role: "quit" }] });
  }

  template.push(
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        ...developerItems,
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [{ label: `${appName} Website`, click: openWebsite }],
    },
  );

  return template;
}

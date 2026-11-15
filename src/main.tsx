import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import "@/i18n/config";
import { Capacitor } from "@capacitor/core";
import { isElectron } from "@/utils/electron";

// Suppress Recharts ResponsiveContainer annoying warning
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("The width(-1) and height(-1)")
  ) {
    return;
  }
  originalWarn(...args);
};

// Mark the installed apps (iOS, Android, desktop) so globals.css can turn off
// browser-only behaviour there, such as rubber-band scrolling of the page.
if (Capacitor.isNativePlatform() || isElectron()) {
  document.documentElement.dataset.shell = "app";
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

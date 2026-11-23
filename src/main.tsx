import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import "@/i18n/config";
import { Capacitor } from "@capacitor/core";
import { isElectron } from "@/utils/electron";
import { z } from "zod";

// Zod's speed-up compiles validators with `new Function`, which the page's
// Content-Security-Policy forbids (it logged an "eval" error on every load).
// Turn it off: validation behaves the same, only a little slower.
z.config({ jitless: true });

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

// App Store preview recording only (marketing/app-preview): a build made
// with VITE_PREVIEW_AUTOPLAY=1 plays the preview story by itself. Vite drops
// this branch, and the module, from every other build.
if (import.meta.env.VITE_PREVIEW_AUTOPLAY === "1") {
  void import("@/marketing/previewAutoplay").then((m) =>
    m.startPreviewAutoplay(),
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

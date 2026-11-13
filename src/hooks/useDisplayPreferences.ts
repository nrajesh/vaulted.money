import { useEffect, useSyncExternalStore } from "react";

/**
 * Display settings from the help drawer: text size, high contrast and reduced
 * motion. They are per-device comfort settings (like the OS ones they mirror),
 * so they live in localStorage, guarded because storage can be unavailable.
 *
 * They are applied as attributes on <html> (see globals.css):
 *   data-text-size="large" | "larger"   scales the root font size (all rem)
 *   data-contrast="high"               stronger text, borders and outlines
 *   data-reduce-motion="true"          stops animations and transitions
 */
export type TextSize = "default" | "large" | "larger";

export interface DisplayPreferences {
  textSize: TextSize;
  highContrast: boolean;
  /** Null means "follow the device setting" (prefers-reduced-motion). */
  reduceMotion: boolean | null;
}

const STORAGE_KEY = "vm.displayPreferences";
const DEFAULTS: DisplayPreferences = {
  textSize: "default",
  highContrast: false,
  reduceMotion: null,
};
const TEXT_SIZES: TextSize[] = ["default", "large", "larger"];

const listeners = new Set<() => void>();
let cache: DisplayPreferences | null = null;

const parse = (raw: string | null): DisplayPreferences => {
  try {
    const value = JSON.parse(raw ?? "{}") as Partial<DisplayPreferences>;
    return {
      textSize: TEXT_SIZES.includes(value.textSize as TextSize)
        ? (value.textSize as TextSize)
        : DEFAULTS.textSize,
      highContrast: value.highContrast === true,
      reduceMotion:
        typeof value.reduceMotion === "boolean" ? value.reduceMotion : null,
    };
  } catch {
    return DEFAULTS;
  }
};

const read = (): DisplayPreferences => {
  if (cache) return cache;
  try {
    cache = parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    cache = DEFAULTS;
  }
  return cache;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setDisplayPreferences = (update: Partial<DisplayPreferences>) => {
  cache = { ...read(), ...update };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Applies for this session only.
  }
  listeners.forEach((listener) => listener());
};

/** Clears the in-memory copy so tests start from storage. */
export const resetDisplayPreferencesCache = () => {
  cache = null;
  listeners.forEach((listener) => listener());
};

export const systemPrefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useDisplayPreferences = () =>
  useSyncExternalStore(subscribe, read, () => DEFAULTS);

/**
 * Applies the stored settings to <html>. Mounted once at the app root so the
 * settings also hold on screens outside the main layout (ledger picker).
 */
export const useApplyDisplayPreferences = () => {
  const preferences = useDisplayPreferences();
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.textSize === "default") {
      root.removeAttribute("data-text-size");
    } else {
      root.setAttribute("data-text-size", preferences.textSize);
    }
    if (preferences.highContrast) root.setAttribute("data-contrast", "high");
    else root.removeAttribute("data-contrast");
    // When following the device, CSS handles prefers-reduced-motion itself.
    if (preferences.reduceMotion === null) {
      root.removeAttribute("data-reduce-motion");
    } else {
      root.setAttribute("data-reduce-motion", String(preferences.reduceMotion));
    }
  }, [preferences]);
};

export const DisplayPreferencesApplier = () => {
  useApplyDisplayPreferences();
  return null;
};

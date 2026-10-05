import * as React from "react";

/**
 * Minimal light/dark/system theme provider.
 *
 * Replaces `next-themes`, whose provider renders an inline <script> for
 * flash prevention. In a client-only React 19 app that script never runs and
 * React logs "Encountered a script tag while rendering React component".
 * Applying the class in a layout effect is flash-free here because the root
 * element is empty until React renders.
 */

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  /** The theme actually in effect: `system` resolved to light or dark. */
  resolvedTheme: "light" | "dark";
  /** Unknown values are ignored, so callers may pass plain strings. */
  setTheme: (theme: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

const DARK_QUERY = "(prefers-color-scheme: dark)";

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const readStoredTheme = (storageKey: string, fallback: Theme): Theme => {
  try {
    const stored = localStorage.getItem(storageKey);
    return isTheme(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
};

const systemPrefersDark = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(DARK_QUERY).matches;

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    readStoredTheme(storageKey, defaultTheme),
  );
  const [systemDark, setSystemDark] = React.useState(systemPrefersDark);

  // Follow the OS setting while the theme is "system".
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Keep several windows/tabs in step.
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setThemeState(readStoredTheme(storageKey, defaultTheme));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, defaultTheme]);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = React.useCallback(
    (next: string) => {
      if (!isTheme(next)) return;
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Storage can be unavailable (private mode); the choice still applies.
      }
    },
    [storageKey],
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

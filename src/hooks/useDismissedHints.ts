import { useCallback, useSyncExternalStore } from "react";

/**
 * Which inline hints the person has dismissed on this device. A per-device
 * convenience only, so it lives in localStorage; every read and write is
 * guarded because storage can be unavailable (private windows, previews).
 */
const STORAGE_KEY = "vm.dismissedHints";
const listeners = new Set<() => void>();
let cache: string[] | null = null;

const read = (): string[] => {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    cache = [];
  }
  return cache;
};

const write = (ids: string[]) => {
  cache = ids;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked: the hint stays hidden for this session only.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Brings every dismissed hint back (used by "Show tips again"). */
export const resetDismissedHints = () => write([]);

export const useDismissedHints = () => {
  const dismissed = useSyncExternalStore(subscribe, read, read);
  const isDismissed = useCallback(
    (id: string) => dismissed.includes(id),
    [dismissed],
  );
  const dismiss = useCallback((id: string) => {
    const current = read();
    if (!current.includes(id)) write([...current, id]);
  }, []);
  return { dismissed, isDismissed, dismiss };
};

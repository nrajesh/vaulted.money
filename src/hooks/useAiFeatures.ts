import * as React from "react";
import { useDataProvider } from "@/context/DataProviderContext";
import { getElectronAPI } from "@/utils/electron";

/**
 * The master "AI features" switch. When it is off, nothing in the app talks to
 * an AI provider and no agent can connect.
 *
 * It lives in localStorage because it is a per-device privacy choice, not
 * ledger data. Until the user chooses, it follows what they already use: on if
 * they have an AI provider or agents connected, off for a fresh install.
 */
const STORAGE_KEY = "vaulted.aiFeatures";
const CHANGE_EVENT = "vaulted:ai-features";

const readChoice = (): boolean | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "on") return true;
    if (value === "off") return false;
  } catch {
    // Storage can be blocked; fall back to the inferred default.
  }
  return null;
};

export const setAiFeatures = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Not persisted, but the in-memory listeners below still update.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

export const useAiFeatures = () => {
  const dataProvider = useDataProvider();
  const choice = React.useSyncExternalStore(subscribe, readChoice, () => null);
  const [inferred, setInferred] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (choice !== null) return;
    let cancelled = false;
    (async () => {
      let inUse = false;
      try {
        inUse = (await dataProvider.getAIProviders()).length > 0;
      } catch {
        // Treated as not in use.
      }
      try {
        const api = await getElectronAPI()?.getApiConfig?.();
        if (api?.enabled) inUse = true;
      } catch {
        // Older desktop builds have no Local API.
      }
      if (!cancelled) setInferred(inUse);
    })();
    return () => {
      cancelled = true;
    };
  }, [choice, dataProvider]);

  return {
    enabled: choice ?? inferred ?? false,
    /** False until we know, so the page does not flash the "off" state. */
    ready: choice !== null || inferred !== null,
    setEnabled: setAiFeatures,
  };
};

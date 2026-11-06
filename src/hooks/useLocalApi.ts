import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  getElectronAPI,
  type ApiServerStatus,
  type ElectronAPI,
} from "@/utils/electron";
import { showError, showSuccess } from "@/utils/toast";

/**
 * Single source of truth for the desktop Local API status and its actions,
 * shared by the Settings card and the Connect to agent page. It only reads
 * the status on mount; the API is never switched on without a user action.
 */
export const useLocalApi = () => {
  const { t } = useTranslation();
  const electronApi = getElectronAPI();
  // An older desktop build may lack the API bridge in its preload script.
  const electron: ElectronAPI | null =
    electronApi && typeof electronApi.getApiConfig === "function"
      ? electronApi
      : null;
  const [status, setStatus] = React.useState<ApiServerStatus | null>(null);
  const [portInput, setPortInput] = React.useState("");
  // Null when the desktop build predates getConnectInfo.
  const [serverPath, setServerPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    electron?.getApiConfig().then((next) => {
      setStatus(next);
      setPortInput(String(next.port));
    });
    if (typeof electron?.getConnectInfo === "function") {
      electron
        .getConnectInfo()
        .then((info) => setServerPath(info.serverPath))
        .catch(() => setServerPath(null));
    }
  }, [electron]);

  const apply = async (
    update: { enabled?: boolean; port?: number },
    successMessage: string,
  ) => {
    if (!electron) return;
    const next = await electron.setApiConfig(update);
    setStatus(next);
    setPortInput(String(next.port));
    if (next.error) showError(next.error);
    else showSuccess(successMessage);
  };

  const toggleEnabled = (enabled: boolean) =>
    apply(
      { enabled },
      enabled
        ? t("settings.api.started", { defaultValue: "API enabled" })
        : t("settings.api.stopped", { defaultValue: "API disabled" }),
    );

  const regenerate = async () => {
    if (!electron) return;
    setStatus(await electron.regenerateApiToken());
    showSuccess(
      t("settings.api.tokenRegenerated", {
        defaultValue:
          "New token generated. Update any client using the old one.",
      }),
    );
  };

  // Agents re-read the app's config on every request, so a new token alone
  // would be picked up at once. Switching the API off as well is what cuts
  // them off until the user switches it on again.
  const disconnectEverything = async () => {
    if (!electron) return;
    await electron.regenerateApiToken();
    await apply(
      { enabled: false },
      t("settings.api.disconnected", {
        defaultValue:
          "Local API switched off and token replaced. Switch it on to reconnect.",
      }),
    );
  };

  return {
    /** Whether any electron bridge exists (false on web and mobile). */
    hasBridge: Boolean(electronApi),
    /** Whether the bridge supports the Local API. */
    supported: Boolean(electron),
    status,
    portInput,
    setPortInput,
    serverPath,
    apply,
    toggleEnabled,
    regenerate,
    disconnectEverything,
  };
};

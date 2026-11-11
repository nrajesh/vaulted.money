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

  const connectSupported = typeof electron?.getConnectInfo === "function";
  // Set when reading the status or the connection details fails.
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [connectFailed, setConnectFailed] = React.useState(false);

  React.useEffect(() => {
    electron
      ?.getApiConfig()
      .then((next) => {
        setStatus(next);
        setPortInput(String(next.port));
      })
      .catch(() => setLoadFailed(true));
    if (typeof electron?.getConnectInfo === "function") {
      electron
        .getConnectInfo()
        .then((info) => setServerPath(info.serverPath))
        .catch(() => setConnectFailed(true));
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
        ? t("aiHub.agents.switchedOn", {
            defaultValue: "Agent access is on.",
          })
        : t("aiHub.agents.switchedOff", {
            defaultValue:
              "Agent access is off. No agent or script can connect.",
          }),
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

  return {
    /** Whether any electron bridge exists (false on web and mobile). */
    hasBridge: Boolean(electronApi),
    /** Whether the bridge supports the Local API. */
    supported: Boolean(electron),
    status,
    portInput,
    setPortInput,
    serverPath,
    connectSupported,
    loadFailed,
    connectFailed,
    apply,
    toggleEnabled,
    regenerate,
  };
};

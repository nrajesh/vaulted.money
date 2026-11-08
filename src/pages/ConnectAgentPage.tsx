import { useTranslation } from "react-i18next";
import ConnectToAgentPanel from "@/components/settings/ConnectToAgentPanel";
import AiHubLayout from "@/components/management/AiHubLayout";
import { useLocalApi } from "@/hooks/useLocalApi";

/**
 * Desktop-only page for connecting an AI agent to the Local API. Reached from
 * the Local API card in Settings.
 */
const ConnectAgentPage = () => {
  const { t } = useTranslation();
  const {
    hasBridge,
    supported,
    status,
    serverPath,
    connectSupported,
    loadFailed,
    connectFailed,
    toggleEnabled,
    disconnectEverything,
  } = useLocalApi();

  let body: React.ReactNode = null;
  if (!supported) {
    body = (
      <p className="text-sm text-muted-foreground">
        {hasBridge
          ? t("settings.api.outdatedDesktop", {
              defaultValue:
                "This desktop build does not include the Local API. Update or rebuild the desktop app to use it.",
            })
          : t("settings.api.desktopOnly", {
              defaultValue:
                "The Local API is available in the desktop app only. The web and mobile apps cannot host a local server.",
            })}
      </p>
    );
  } else if (loadFailed || connectFailed) {
    body = (
      <p role="alert" className="text-sm text-destructive">
        {loadFailed
          ? t("settings.api.loadFailed", {
              defaultValue:
                "Could not read the Local API status. Restart the app and try again.",
            })
          : t("settings.agent.connectFailed", {
              defaultValue:
                "Could not read the connection details. Restart the app and try again.",
            })}
      </p>
    );
  } else if (!connectSupported) {
    body = (
      <p className="text-sm text-muted-foreground">
        {t("settings.agent.outdatedDesktop", {
          defaultValue:
            "This desktop build cannot connect agents yet. Update or rebuild the desktop app to use it.",
        })}
      </p>
    );
  } else if (status && serverPath) {
    body = (
      <ConnectToAgentPanel
        status={status}
        serverPath={serverPath}
        onToggle={toggleEnabled}
        onDisconnect={disconnectEverything}
      />
    );
  }

  return (
    <AiHubLayout>
      <div className="page-container">
        <div className="app-page-header">
          <h1 className="app-gradient-title app-page-title">
            {t("settings.agent.title", { defaultValue: "Connect to agent" })}
          </h1>
          <p className="app-page-subtitle">
            {t("settings.agent.pageIntro", {
              defaultValue:
                "Let an AI agent read and update your data. What it reads is sent to its AI provider, unless the model runs on this device.",
            })}
          </p>
        </div>
        <div>{body}</div>
      </div>
    </AiHubLayout>
  );
};

export default ConnectAgentPage;

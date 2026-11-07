import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import ConnectToAgentPanel from "@/components/settings/ConnectToAgentPanel";
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
    <div className="page-container">
      <div className="app-page-header">
        <h1 className="app-gradient-title app-page-title">
          {t("settings.agent.title", { defaultValue: "Connect to agent" })}
        </h1>
        <p className="app-page-subtitle">
          {t("settings.agent.pageIntro", {
            defaultValue:
              "Let an AI agent such as Claude read and update your money manager. The connection to the app stays on this computer. What an agent reads is sent to its AI provider (Anthropic, for Claude). A local model keeps everything on this device.",
          })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("settings.agent.byokNote", {
            defaultValue:
              "Looking for AI categorisation with your own API key?",
          })}{" "}
          <Link to="/settings" className="underline">
            {t("settings.agent.byokLink", {
              defaultValue: "See AI Integrations in Settings.",
            })}
          </Link>
        </p>
        <Link
          to="/settings"
          className="mt-2 inline-flex items-center gap-1 text-sm underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("settings.agent.backToSettings", {
            defaultValue: "Back to Settings",
          })}
        </Link>
      </div>
      <div>{body}</div>
    </div>
  );
};

export default ConnectAgentPage;

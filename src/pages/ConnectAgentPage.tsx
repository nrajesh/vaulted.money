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
  } else if (status && serverPath) {
    body = (
      <ConnectToAgentPanel
        status={status}
        serverPath={serverPath}
        onToggle={toggleEnabled}
        onDisconnect={disconnectEverything}
      />
    );
  } else if (status) {
    body = (
      <p className="text-sm text-muted-foreground">
        {t("settings.agent.outdatedDesktop", {
          defaultValue:
            "This desktop build cannot connect agents yet. Update or rebuild the desktop app to use it.",
        })}
      </p>
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
              "Let an AI agent such as Claude read and update your money manager. Everything stays on this computer until you choose an agent that runs in the cloud.",
          })}
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
      <div className="max-w-2xl">{body}</div>
    </div>
  );
};

export default ConnectAgentPage;

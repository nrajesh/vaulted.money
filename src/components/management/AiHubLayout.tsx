import * as React from "react";
import { Power } from "lucide-react";
import { useTranslation } from "react-i18next";
import AiAgentTabs from "@/components/management/AiAgentTabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAiFeatures } from "@/hooks/useAiFeatures";
import { getElectronAPI } from "@/utils/electron";

/**
 * The frame shared by the AI Providers and Connect agent pages: the tabs, the
 * master AI switch, then the page. It sits at the same place on both pages, so
 * switching tabs never moves it. With AI off, only the switch is shown.
 */
const AiHubLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const { enabled, ready, setEnabled } = useAiFeatures();

  const change = (next: boolean) => {
    setEnabled(next);
    // Off also closes the door to agents.
    if (!next) void getElectronAPI()?.setApiConfig?.({ enabled: false });
  };

  return (
    <>
      <div className="space-y-3 px-3 pt-3 sm:px-6 sm:pt-6">
        <AiAgentTabs />
        <div className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2">
          <Switch
            id="ai-features"
            checked={enabled}
            onCheckedChange={change}
            disabled={!ready}
          />
          <label htmlFor="ai-features" className="text-sm font-medium">
            {t("settings.agent.hubSwitch", { defaultValue: "AI features" })}
          </label>
          <span className="text-xs text-muted-foreground">
            {t("settings.agent.hubSwitchHint", {
              defaultValue: "Off hides AI and blocks agent access.",
            })}
          </span>
        </div>
      </div>
      {ready &&
        (enabled ? (
          children
        ) : (
          <div className="page-container">
            <div className="flex flex-col items-start gap-3 rounded-lg border p-6">
              <Power className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 className="text-lg font-semibold">
                {t("settings.agent.hubOffTitle", {
                  defaultValue: "AI is off",
                })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("settings.agent.hubOffBody", {
                  defaultValue:
                    "Nothing is sent to any AI provider and no agent can connect.",
                })}
              </p>
              <Button onClick={() => change(true)}>
                {t("settings.agent.hubTurnOn", { defaultValue: "Turn on AI" })}
              </Button>
            </div>
          </div>
        ))}
    </>
  );
};

export default AiHubLayout;

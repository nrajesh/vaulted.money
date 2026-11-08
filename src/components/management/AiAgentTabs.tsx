import { Link, useLocation } from "react-router-dom";
import { Bot, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getElectronAPI } from "@/utils/electron";

const hasAgentBridge = () =>
  typeof getElectronAPI()?.getApiConfig === "function";

/**
 * Switcher shared by the AI providers and Connect agent pages. Both sit under
 * one "AI & agents" sidebar entry, so this is how you move between them.
 * Agents can only connect to the desktop app, so on the web that tab is shown
 * greyed out and says so.
 */
const AiAgentTabs = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const desktopOnly = !hasAgentBridge();

  const tabs = [
    {
      to: "/ai-providers",
      icon: Brain,
      label: t("layout.nav.aiProviders", { defaultValue: "AI Providers" }),
      hint: t("layout.nav.aiProvidersHint", {
        defaultValue: "Use your own AI key to categorise transactions",
      }),
    },
    {
      to: "/connect-agent",
      icon: Bot,
      label: t("layout.nav.connectAgentShort", {
        defaultValue: "Connect agent",
      }),
      // On the web there is nothing to open, so say where it lives instead of
      // hiding the tab and leaving people to wonder.
      hint: desktopOnly
        ? t("layout.nav.connectAgentDesktopOnly", {
            defaultValue: "Connect an agent is available in the desktop app",
          })
        : t("layout.nav.connectAgentHint", {
            defaultValue:
              "Analyze, chat or debate with your data using an AI agent",
          }),
      disabled: desktopOnly,
    },
  ];

  return (
    <nav
      aria-label={t("layout.nav.aiAndAgents", { defaultValue: "AI & agents" })}
      className="grid gap-2 sm:grid-cols-2"
    >
      {tabs.map(({ to, icon: Icon, label, hint, disabled }) => {
        const active = pathname === to;
        if (disabled) {
          return (
            <div
              key={to}
              aria-disabled="true"
              className="flex h-full items-start gap-3 rounded-lg border border-dashed px-4 py-3 text-left text-muted-foreground"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs">{hint}</span>
              </span>
            </div>
          );
        }
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary/10 shadow-sm"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                active && "text-primary",
              )}
              aria-hidden
            />
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {label}
              </span>
              <span className="text-xs">{hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AiAgentTabs;

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
 * The agent tab shows only in the desktop app, where agents can connect.
 */
const AiAgentTabs = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const tabs = [
    {
      to: "/ai-providers",
      icon: Brain,
      label: t("layout.nav.aiProviders", { defaultValue: "AI Providers" }),
      hint: t("layout.nav.aiProvidersHint", {
        defaultValue: "Use your own AI key to categorise transactions",
      }),
    },
    ...(hasAgentBridge()
      ? [
          {
            to: "/connect-agent",
            icon: Bot,
            label: t("layout.nav.connectAgentShort", {
              defaultValue: "Connect agent",
            }),
            hint: t("layout.nav.connectAgentHint", {
              defaultValue:
                "Analyze, chat or debate with your data using an AI agent",
            }),
          },
        ]
      : []),
  ];

  if (tabs.length < 2) return null;

  return (
    <nav
      aria-label={t("layout.nav.aiAndAgents", { defaultValue: "AI & agents" })}
      className="mb-4 grid gap-2 sm:grid-cols-2"
    >
      {tabs.map(({ to, icon: Icon, label, hint }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/60 text-muted-foreground",
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
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

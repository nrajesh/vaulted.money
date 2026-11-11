import * as React from "react";
import {
  ArrowLeftRight,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Cloud,
  Laptop,
  Plug,
  Power,
  ShieldCheck,
  Sparkles,
  Store,
  Unlink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AIProviderManagement from "@/components/management/AIProviderManagement";
import ApiAccessCard from "@/components/settings/ApiAccessCard";
import ConnectToAgentPanel from "@/components/settings/ConnectToAgentPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { readAiApiKeyFromStorage } from "@/constants/aiApiKeyStorage";
import { useAiFeatures } from "@/hooks/useAiFeatures";
import { useLocalApi } from "@/hooks/useLocalApi";
import type { AIProvider } from "@/types/dataProvider";
import { agentChoiceForProvider } from "@/utils/agentChoice";
import { isAiReady, looksLikeEmbeddingModel } from "@/utils/aiModels";
import { cn } from "@/lib/utils";

const IN_APP_SECTION = "ai-in-app";
const AGENTS_SECTION = "ai-agents";

const FACT_ICON = "h-3.5 w-3.5";
const BARS_STORAGE_KEY = "vaulted.aiBars";
const readOpenBars = (): Record<string, boolean> => {
  try {
    const value = JSON.parse(localStorage.getItem(BARS_STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

// Scrolls instead of using a "#" link, which would break the hash router the
// desktop and mobile apps use.
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (typeof element?.scrollIntoView === "function") {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

/**
 * Everything AI in one place: the master switch, what is set up right now, the
 * providers used inside the app, and the steps to connect an AI agent. Both
 * halves read the same state, so they can never disagree about what is set up.
 */
const AiHubPage = ({ focus }: { focus?: "agents" }) => {
  const { t } = useTranslation();
  const { enabled, ready, setEnabled } = useAiFeatures();
  const api = useLocalApi();
  const [providers, setProviders] = React.useState<AIProvider[]>([]);

  const change = (next: boolean) => {
    setEnabled(next);
    // Off also closes the door to agents.
    if (!next && api.status?.enabled) void api.toggleEnabled(false);
  };

  // Which bars are open. Both start open; a bar the user closes stays closed
  // on this device.
  const [openBars, setOpenBars] =
    React.useState<Record<string, boolean>>(readOpenBars);
  const toggleBar = (id: string, open: boolean) => {
    setOpenBars((previous) => {
      const next = { ...previous, [id]: open };
      try {
        localStorage.setItem(BARS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Not remembered; the page still works.
      }
      return next;
    });
  };

  const showContent = ready && enabled;
  React.useEffect(() => {
    if (focus === "agents" && showContent) {
      // Arriving for the agent steps: make sure they are showing.
      setOpenBars((previous) => ({ ...previous, [AGENTS_SECTION]: true }));
      scrollToSection(AGENTS_SECTION);
    }
  }, [focus, showContent]);

  const inUse = providers.find((provider) => provider.isDefault) ?? null;
  const inUseReady =
    !!inUse && isAiReady(inUse, readAiApiKeyFromStorage(inUse.id));

  let inAppStatus: string;
  if (providers.length === 0) {
    inAppStatus = t("aiHub.summary.inAppNone", {
      defaultValue: "Not set up yet. Add a provider to start.",
    });
  } else if (!inUse) {
    inAppStatus = t("aiHub.summary.inAppNoneInUse", {
      defaultValue: "No provider is in use. Pick one below.",
    });
  } else if (!inUseReady) {
    inAppStatus = t("aiHub.summary.inAppNeedsKey", {
      name: inUse.name,
      defaultValue: "{{name}} still needs its API key.",
    });
  } else if (looksLikeEmbeddingModel(inUse.model)) {
    inAppStatus = t("aiHub.summary.inAppWrongModel", {
      name: inUse.name,
      defaultValue:
        "{{name}} is in use, but its model cannot chat. Pick another.",
    });
  } else if (inUse.type === "CUSTOM") {
    inAppStatus = t("aiHub.summary.inAppLocal", {
      name: inUse.name,
      defaultValue: "{{name}} is in use. Your own endpoint, no key needed.",
    });
  } else {
    inAppStatus = t("aiHub.summary.inAppReady", {
      name: inUse.name,
      defaultValue: "{{name}} is in use.",
    });
  }

  // What the private-model route can rely on: a model on this computer.
  const localProvider =
    inUse?.type === "CUSTOM"
      ? inUse
      : providers.find((provider) => provider.type === "CUSTOM");
  const localModel = !localProvider
    ? "missing"
    : looksLikeEmbeddingModel(localProvider.model)
      ? "embedding"
      : "ready";

  // Ready means it can actually do its job, not merely that it exists.
  const inAppReady = inUseReady && !looksLikeEmbeddingModel(inUse?.model);

  const agentsOn = !!api.status?.enabled && !!api.status?.running;
  let agentStatus: string;
  if (!api.supported) {
    agentStatus = t("aiHub.summary.agentsMacOnly", {
      defaultValue: "Available ONLY in the Mac app.",
    });
  } else if (agentsOn) {
    agentStatus = t("aiHub.summary.agentsOn", {
      defaultValue: "On. Agents on this computer can connect.",
    });
  } else {
    agentStatus = t("aiHub.summary.agentsOff", {
      defaultValue: "Off. No agent can connect.",
    });
  }

  let agentBody: React.ReactNode = null;
  const showPanel =
    api.supported &&
    !api.loadFailed &&
    !api.connectFailed &&
    api.connectSupported &&
    !!api.status &&
    !!api.serverPath;
  if (!api.supported) {
    agentBody = (
      <p className="text-sm text-muted-foreground">
        {api.hasBridge
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
  } else if (api.loadFailed || api.connectFailed) {
    agentBody = (
      <p role="alert" className="text-sm text-destructive-text">
        {api.loadFailed
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
  } else if (!api.connectSupported) {
    agentBody = (
      <p className="text-sm text-muted-foreground">
        {t("settings.agent.outdatedDesktop", {
          defaultValue:
            "This desktop build cannot connect agents yet. Update or rebuild the desktop app to use it.",
        })}
      </p>
    );
  } else if (showPanel && api.status && api.serverPath) {
    agentBody = (
      <ConnectToAgentPanel
        status={api.status}
        serverPath={api.serverPath}
        onToggle={api.toggleEnabled}
        localModel={localModel}
        localApi={<ApiAccessCard api={api} embedded />}
        suggestedChoice={inUseReady ? agentChoiceForProvider(inUse) : null}
        suggestionNote={
          inUse
            ? t("aiHub.agents.matchNote", {
                name: inUse.name,
                defaultValue:
                  "Picked to match {{name}}, which you already use inside the app. Choose another any time.",
              })
            : undefined
        }
      />
    );
  }

  /**
   * One part of AI as a bar that opens and closes. The bar always says what
   * the part is and its current state, and turns green when it is ready, so
   * it stays clear which of the two a switch or setting belongs to.
   */
  const bar = (
    id: string,
    icon: React.ReactNode,
    title: string,
    status: string,
    isReady: boolean,
    facts: [React.ReactNode, string][],
    children: React.ReactNode,
    locked = false,
  ) => {
    const open = openBars[id] ?? true;
    // A part this device cannot use is not a bar to open: it says where it
    // works, loudly, and offers nothing to click.
    if (locked) {
      return (
        <section
          id={id}
          className="flex flex-col items-start gap-3 rounded-lg border border-dashed px-4 py-3 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              {icon}
            </span>
            <h2 className="min-w-0 text-base font-semibold text-muted-foreground">
              {title}
            </h2>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Laptop className="h-4 w-4 shrink-0" aria-hidden />
            {status}
          </p>
        </section>
      );
    }
    return (
      <section
        id={id}
        className={cn(
          "scroll-mt-4 overflow-hidden rounded-lg border",
          isReady && "border-green-600/60",
        )}
      >
        <h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-content`}
            onClick={() => toggleBar(id, !open)}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              isReady
                ? "bg-green-600/10 hover:bg-green-600/15"
                : "bg-muted/40 hover:bg-muted/70",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isReady
                  ? "bg-green-600 text-white"
                  : "border bg-background text-muted-foreground",
              )}
            >
              {isReady ? <Check className="h-4 w-4" aria-hidden /> : icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-semibold text-foreground">
                {title}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isReady
                    ? "text-green-700 dark:text-green-400"
                    : "text-muted-foreground",
                )}
              >
                {status}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </h2>
        {/* Kept mounted while closed, so the bar's status stays current. */}
        <div id={`${id}-content`} hidden={!open} className="border-t">
          {/* What this part does, as icons with a few words each, side by
              side, instead of a paragraph to read. */}
          <ul
            className={cn(
              "flex flex-wrap gap-x-6 gap-y-2 px-3 pt-4 sm:px-6",
              id === IN_APP_SECTION && "tour-ai-byok",
            )}
          >
            {facts.map(([factIcon, text]) => (
              <li key={text} className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  {factIcon}
                </span>
                <span className="text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
          {children}
        </div>
      </section>
    );
  };

  return (
    <>
      <div className="space-y-4 bg-background px-3 pt-3 sm:px-6 sm:pt-6">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("layout.nav.aiAndAgents", { defaultValue: "AI & agents" })}
          </h1>
          <p className="app-page-subtitle">
            {t("aiHub.subtitle", {
              defaultValue:
                "Everything AI lives on this page. Nothing is sent anywhere until you switch it on and set it up.",
            })}
          </p>
        </div>
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

      {ready && !enabled && (
        <div className="page-container">
          <div className="flex flex-col items-start gap-3 rounded-lg border p-6">
            <Power className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-semibold">
              {t("settings.agent.hubOffTitle", { defaultValue: "AI is off" })}
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
      )}

      {showContent && (
        <div className="space-y-3 bg-background px-3 py-4 sm:px-6">
          {bar(
            IN_APP_SECTION,
            <Brain className="h-4 w-4" aria-hidden />,
            t("aiHub.providers.title", { defaultValue: "AI inside the app" }),
            inAppStatus,
            inAppReady,
            [
              [
                <Sparkles className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.autoCategorize", {
                  defaultValue: "Powers Auto-categorize",
                }),
              ],
              [
                <Store className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.vendorNamesOnly", {
                  defaultValue: "Sends vendor names only, never amounts",
                }),
              ],
              [
                <Unlink className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.independent", {
                  defaultValue: "Works without agent access",
                }),
              ],
            ],
            // The list brings its own full-height page frame; here it is one
            // part of a longer page.
            <div className="tour-ai-list [&_.page-container]:min-h-0">
              <AIProviderManagement
                onProvidersChange={setProviders}
                hideHeading
              />
            </div>,
          )}
          {bar(
            AGENTS_SECTION,
            <Bot className="h-4 w-4" aria-hidden />,
            t("aiHub.agents.title", {
              defaultValue: "Chat with your data from an AI agent",
            }),
            agentStatus,
            agentsOn,
            [
              [
                <ArrowLeftRight className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.readsUpdates", {
                  defaultValue: "Reads and updates your data",
                }),
              ],
              [
                <Cloud className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.sentToProvider", {
                  defaultValue: "What it reads is sent to its AI provider",
                }),
              ],
              [
                <ShieldCheck className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.localPrivate", {
                  defaultValue: "A local LLM keeps your data private",
                }),
              ],
              [
                <Plug className={FACT_ICON} aria-hidden />,
                t("aiHub.facts.switchesApi", {
                  defaultValue:
                    "Its switch also runs the Local API for scripts",
                }),
              ],
            ],
            <div className="page-container !min-h-0">
              <div>{agentBody}</div>
              {/* With the agent steps showing, the Local API sits inside them,
                  under its switch. Otherwise it gets its own card. */}
              {api.supported && !api.loadFailed && !showPanel && (
                <div className="grid">
                  <ApiAccessCard api={api} />
                </div>
              )}
            </div>,
            !api.hasBridge,
          )}
        </div>
      )}
    </>
  );
};

export default AiHubPage;

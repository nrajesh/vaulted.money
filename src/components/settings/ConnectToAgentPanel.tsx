import * as React from "react";
import {
  AlertTriangle,
  Bot,
  Braces,
  Check,
  Cloud,
  Copy,
  Download,
  Loader2,
  MessageCircle,
  Power,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { getElectronAPI, type ApiServerStatus } from "@/utils/electron";
import { showError } from "@/utils/toast";
import {
  readAgentChoice,
  writeAgentChoice,
  type AgentChoice,
} from "@/utils/agentChoice";

const RELEASES_URL = "https://github.com/nrajesh/vaulted.money/releases/latest";
const CLAUDE_CODE_REPOSITORY = "nrajesh/vaulted.money";
const CLAUDE_APP_DOWNLOAD_URL = "https://claude.ai/download";
const CLAUDE_CODE_URL = "https://claude.com/claude-code";
const CODEX_URL = "https://github.com/openai/codex";
const CODEX_INSTALL_COMMAND = "npm install -g @openai/codex";
// Two lines: a terminal runs them one after the other when pasted. The
// `claude` prefix matters: a plain terminal does not understand `/plugin`.
const CLAUDE_CODE_COMMANDS =
  "claude plugin marketplace add nrajesh/vaulted.money\nclaude plugin install vaulted-money@vaulted-money";
const PRIVACY_ICON = "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground";
const EXAMPLE_QUESTIONS = [
  "Where is my money going this month?",
  "Am I over budget anywhere?",
];

interface ConnectToAgentPanelProps {
  status: ApiServerStatus;
  serverPath: string;
  onToggle: (enabled: boolean) => void;
  /**
   * The model on this computer that is set up under "AI inside the app", as
   * far as the private-model route depends on it: there is none ("missing"),
   * it cannot chat ("embedding"), or it is fine. Left out when unknown.
   */
  localModel?: "ready" | "missing" | "embedding";
  /** The Local API controls, shown under the switch that governs them. */
  localApi?: React.ReactNode;
  /**
   * The choice that matches what is already set up in the app (for example a
   * local model). Used until the user picks one themselves.
   */
  suggestedChoice?: AgentChoice | null;
  /** Says why that choice is preselected, e.g. the provider's name. */
  suggestionNote?: string;
}

/** A labelled copy button that shows a tick after a successful copy. */
const CopyButton = ({
  label,
  variant,
  isCopied,
  onCopy,
}: {
  label: string;
  variant: "default" | "outline";
  isCopied: boolean;
  onCopy: () => void;
}) => (
  <Button
    type="button"
    variant={variant}
    size="sm"
    className="shrink-0"
    aria-label={label}
    onClick={onCopy}
  >
    {isCopied ? (
      <Check className="mr-2 h-4 w-4" />
    ) : (
      <Copy className="mr-2 h-4 w-4" />
    )}
    {label}
  </Button>
);

type CopyTarget =
  | "local"
  | "repo"
  | "commands"
  | "ask0"
  | "ask1"
  | "codexInstall"
  | "codexConfig";
type SetupState = "idle" | "running" | "ready" | "failed" | "not-found";
type CodexSetupState = SetupState | "node-missing";
type Choice = AgentChoice;

/**
 * Lets the user connect an AI agent to the Local API. Status is owned by the
 * parent card. The snippets here never contain the API token: the MCP server
 * reads it from the app's own config file.
 */
const ConnectToAgentPanel = ({
  status,
  serverPath,
  onToggle,
  localModel,
  localApi,
  suggestedChoice = null,
  suggestionNote,
}: ConnectToAgentPanelProps) => {
  const { t } = useTranslation();
  // `serial` restarts the reset timer when the same button is copied twice.
  const [copiedState, setCopiedState] = React.useState<{
    target: CopyTarget;
    serial: number;
  } | null>(null);
  const copied = copiedState?.target ?? null;
  // One timer per copy; the cleanup also covers unmount and a later copy.
  React.useEffect(() => {
    if (!copiedState) return;
    const timer = window.setTimeout(() => setCopiedState(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedState]);
  // What the user picked last time wins; otherwise follow what they already
  // set up in the app, so this page never contradicts it.
  const [picked, setPicked] = React.useState<Choice | null>(readAgentChoice);
  const choice: Choice = picked ?? suggestedChoice ?? "claude-app";
  const setChoice = (next: Choice) => {
    setPicked(next);
    writeAgentChoice(next);
  };
  // What the desktop app found on this computer. Stays null in an older build
  // that cannot look, in which case the page shows only the manual steps.
  const [detected, setDetected] = React.useState<{
    code: boolean;
    desktop: boolean;
  } | null>(null);
  const [setupState, setSetupState] = React.useState<SetupState>("idle");
  const [codexFound, setCodexFound] = React.useState<boolean | null>(null);
  const [codexState, setCodexState] = React.useState<CodexSetupState>("idle");
  React.useEffect(() => {
    let cancelled = false;
    getElectronAPI()
      ?.detectCodex?.()
      .then((result) => {
        if (!cancelled) setCodexFound(result.cli);
      })
      .catch(() => {
        if (!cancelled) setCodexFound(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  React.useEffect(() => {
    let cancelled = false;
    getElectronAPI()
      ?.detectClaude?.()
      .then((result) => {
        if (!cancelled) setDetected(result);
      })
      .catch(() => {
        if (!cancelled) setDetected(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runClaudeCodeSetup = async () => {
    const setup = getElectronAPI()?.setupClaudeCodePlugin;
    if (!setup) return;
    setSetupState("running");
    try {
      setSetupState(await setup());
    } catch {
      setSetupState("failed");
    }
  };
  const runCodexSetup = async () => {
    const setup = getElectronAPI()?.setupCodex;
    if (!setup) return;
    setCodexState("running");
    try {
      setCodexState(await setup());
    } catch {
      setCodexState("failed");
    }
  };
  // The card titles are h3, like the cards on the other pages.
  const SubHeading = "h4";
  const RouteHeading = "h5";

  const localModelSnippet = JSON.stringify(
    {
      mcpServers: {
        "vaulted-money": { command: "node", args: [serverPath] },
      },
    },
    null,
    2,
  );

  // Codex reads TOML. A JSON string is also a valid TOML string.
  const codexConfig = `[mcp_servers.vaulted-money]\ncommand = "node"\nargs = [${JSON.stringify(serverPath)}]`;

  const copy = async (target: CopyTarget, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setCopiedState(null);
      showError(
        t("settings.agent.copyFailed", {
          defaultValue: "Could not copy to the clipboard.",
        }),
      );
      return;
    }
    setCopiedState((previous) => ({
      target,
      serial: (previous?.serial ?? 0) + 1,
    }));
  };

  const ready = status.enabled && status.running;

  const copyButton = (
    target: CopyTarget,
    value: string,
    label: string,
    variant: "default" | "outline" = "outline",
  ) => (
    <CopyButton
      label={label}
      variant={variant}
      isCopied={copied === target}
      onCopy={() => copy(target, value)}
    />
  );

  const step = (n: number, children: React.ReactNode) => (
    <li className="flex items-start gap-3 text-sm">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pt-0.5">
        {children}
      </div>
    </li>
  );

  const privacyLine = (text: string) => (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );

  const choiceCard = (
    value: Choice,
    icon: React.ReactNode,
    title: string,
    explanation: string,
    badge: string | null,
  ) => (
    <TabsTrigger
      value={value}
      // Styled as a button you press, with a radio mark, so it is obvious
      // that these are choices and which one is picked.
      // With agent access off there is nothing to choose for.
      disabled={!status.enabled}
      className="group h-auto cursor-pointer flex-col items-start gap-1 whitespace-normal rounded-lg border-2 border-border bg-card p-3 text-left text-foreground shadow-sm transition-colors hover:border-primary/60 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:border-border disabled:hover:bg-card"
    >
      <span className="flex w-full items-start gap-2 text-sm font-semibold [&>svg]:mt-0.5 [&>svg]:shrink-0">
        {icon}
        <span className="flex-1">{title}</span>
        <span
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/60 text-transparent group-data-[state=active]:border-primary group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground"
        >
          <Check className="h-3 w-3" />
        </span>
      </span>
      <span className="text-xs font-normal text-muted-foreground">
        {explanation}
      </span>
      {badge && (
        <Badge variant="secondary" className="mt-1">
          {badge}
        </Badge>
      )}
    </TabsTrigger>
  );

  // Step 2 counts as done once a way to chat is chosen, whether the user picked
  // it here or it follows the provider they already use inside the app.
  const choiceMade = picked !== null || suggestedChoice !== null;

  // What stops the chosen route from working, if anything. While something
  // does, nothing on the page may look finished.
  let blocker: string | null = null;
  if (choice === "local" && localModel === "missing") {
    blocker = t("aiHub.chat.blockNoLocal", {
      defaultValue:
        "No model on this computer is set up. Add one under AI inside the app first, or pick another way to chat.",
    });
  } else if (choice === "local" && localModel === "embedding") {
    blocker = t("aiHub.chat.blockEmbedding", {
      defaultValue:
        "Your local model is an embedding model, which cannot chat. Pick a chat model under AI inside the app first.",
    });
  } else if (choice === "claude-app" && detected && !detected.desktop) {
    blocker = t("settings.agent.appNotFound", {
      defaultValue: "We could not find the Claude app on this computer.",
    });
  } else if (
    choice === "claude-code" &&
    detected &&
    !detected.code &&
    !detected.desktop
  ) {
    // Claude Code runs in a terminal or inside the Claude app; with neither
    // on this computer there is nowhere to chat yet.
    blocker = t("aiHub.chat.blockNoClaudeCode", {
      defaultValue:
        "Claude Code is not on this computer yet. Install it, then come back.",
    });
  } else if (choice === "codex" && codexFound === false) {
    blocker = t("aiHub.chat.blockNoCodex", {
      defaultValue:
        "Codex is not on this computer yet. Install it, then come back.",
    });
  } else if (
    choice === "claude-code" &&
    (setupState === "failed" || setupState === "not-found")
  ) {
    blocker = t("aiHub.chat.blockSetup", {
      defaultValue:
        "The setup did not finish. Use the manual steps, then come back.",
    });
  } else if (
    choice === "codex" &&
    (codexState === "failed" ||
      codexState === "not-found" ||
      codexState === "node-missing")
  ) {
    blocker = t("aiHub.chat.blockSetup", {
      defaultValue:
        "The setup did not finish. Use the manual steps, then come back.",
    });
  }

  // With agent access off nothing is chosen, so there is nothing to block:
  // the card just says to switch on first.
  if (!status.enabled) blocker = null;

  const canAsk = status.enabled && choiceMade && !blocker;
  // The chat itself happens in the agent's app, so the last step is done as
  // soon as everything before it is: there is nothing more to do here.
  const stepsDone = [status.enabled, canAsk, canAsk];

  // Where the conversation actually happens. The chat is in the agent's own
  // app, never on this page, so say exactly where to go.
  const whereToChat: Record<Choice, string> = {
    "claude-app": t("aiHub.chat.whereClaudeApp", {
      defaultValue:
        "Open the Claude desktop app and start a new chat. Ask your question there.",
    }),
    local: t("aiHub.chat.whereLocal", {
      defaultValue:
        "Open a chat in LM Studio with a model that can use tools. Ask your question there.",
    }),
    "claude-code": t("aiHub.chat.whereClaudeCode", {
      defaultValue:
        "Open Claude Code, in the Claude app or by typing claude in a terminal. Ask your question there.",
    }),
    codex: t("aiHub.chat.whereCodex", {
      defaultValue: "Type codex in a terminal. Ask your question there.",
    }),
  };

  const progressBar = (
    <span
      aria-hidden="true"
      className="block h-1 w-full overflow-hidden rounded-full bg-muted"
    >
      <span className="block h-full w-1/3 animate-[agent-progress_1.2s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-pulse" />
    </span>
  );
  const setupStatus = (
    state: CodexSetupState,
    messages: Partial<Record<CodexSetupState, string>>,
  ) => (
    <div role="status" className="space-y-2 text-xs">
      {state === "running" && progressBar}
      {state !== "idle" && (
        <p
          className={
            state === "ready"
              ? "flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400"
              : "text-muted-foreground"
          }
        >
          {state === "ready" && (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          {messages[state]}
        </p>
      )}
    </div>
  );

  const privacyPoint = (icon: React.ReactNode, title: string, body: string) => (
    <li className="flex items-start gap-3">
      {icon}
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block text-muted-foreground">{body}</span>
      </span>
    </li>
  );

  const stepTitles = [
    t("settings.agent.step1", { defaultValue: "Switch on" }),
    t("settings.agent.step2", {
      defaultValue: "Pick how you chat with your money",
    }),
    canAsk
      ? t("aiHub.chat.readyStep", {
          defaultValue: "Ready to ask your first question",
        })
      : t("settings.agent.step3", { defaultValue: "Ask your first question" }),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ThemedCard
        aria-labelledby="connect-agent-title"
        className="lg:col-span-2"
      >
        <ThemedCardHeader>
          <div className="flex items-center justify-between gap-4">
            <ThemedCardTitle
              id="connect-agent-title"
              className="flex items-center gap-2"
            >
              <Bot className="h-5 w-5 text-muted-foreground" />
              {t("settings.agent.title", { defaultValue: "Connect to agent" })}
            </ThemedCardTitle>
            {/* "Ready" is a promise that chatting will work, so it waits for
                every step; until then the badge only says on or off. */}
            <span
              className={
                canAsk && ready
                  ? "rounded-full bg-green-600/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                  : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {canAsk && ready
                ? t("settings.agent.ready", { defaultValue: "Ready" })
                : ready
                  ? t("aiHub.api.on", { defaultValue: "On" })
                  : t("settings.agent.off", { defaultValue: "Off" })}
            </span>
          </div>
          <ThemedCardDescription>
            {t("settings.agent.description", {
              defaultValue:
                "Chat with an AI about your money manager in three quick steps.",
            })}
          </ThemedCardDescription>
        </ThemedCardHeader>
        <ThemedCardContent className="space-y-5">
          <p role="status" className="sr-only">
            {copied
              ? t("settings.agent.copiedStatus", { defaultValue: "Copied" })
              : ""}
          </p>

          <ol
            aria-label={t("settings.agent.steps", { defaultValue: "Steps" })}
            className="grid gap-2 text-sm sm:grid-cols-3"
          >
            {stepTitles.map((title, index) => {
              const done = stepsDone[index];
              return (
                <li
                  key={title}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <span
                    aria-hidden="true"
                    className={
                      done
                        ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white"
                        : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                    }
                  >
                    {done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span>
                    {title}
                    {done && (
                      <span className="sr-only">
                        {" "}
                        {t("settings.agent.done", { defaultValue: "(done)" })}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="agent-enabled">
                {t("settings.agent.enable", {
                  defaultValue: "Allow agents to connect",
                })}
              </Label>
              <Switch
                id="agent-enabled"
                checked={status.enabled}
                onCheckedChange={(checked) => {
                  onToggle(checked);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {status.enabled
                ? t("aiHub.agents.switchOnHint", {
                    defaultValue:
                      "Switch this off to disconnect every agent and script at once.",
                  })
                : t("aiHub.agents.switchOffHint", {
                    defaultValue:
                      "Off: no agent or script can reach your data.",
                  })}
            </p>
            {localApi}
          </div>

          <div className="space-y-3">
            <SubHeading className="text-sm font-semibold">
              {t("settings.agent.chooseTitle", {
                defaultValue: "How do you want to chat?",
              })}
            </SubHeading>
            <p className="text-xs text-muted-foreground">
              {status.enabled
                ? t("aiHub.chat.pickOne", {
                    defaultValue: "Click one of the four options to choose it.",
                  })
                : t("aiHub.chat.pickLocked", {
                    defaultValue:
                      "Switch on Allow agents to connect to choose one.",
                  })}
            </p>
            {/* Off: no option is shown as picked and none can be, so the page
                never looks set up while nothing can connect. */}
            <Tabs
              value={status.enabled ? choice : ""}
              onValueChange={(v) => setChoice(v as Choice)}
            >
              <TabsList
                aria-label={t("settings.agent.chooseTitle", {
                  defaultValue: "How do you want to chat?",
                })}
                className="grid h-auto w-full items-stretch gap-2 bg-transparent p-0 grid-cols-2 sm:grid-cols-4"
              >
                {choiceCard(
                  "claude-app",
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />,
                  t("settings.agent.appTitle", {
                    defaultValue: "The Claude app",
                  }),
                  t("settings.agent.appBlurb", {
                    defaultValue: "Chat in the Claude desktop app.",
                  }),
                  t("settings.agent.appBadge", { defaultValue: "Easiest" }),
                )}
                {choiceCard(
                  "local",
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
                  t("settings.agent.localTitle", {
                    defaultValue: "A private model",
                  }),
                  t("settings.agent.localBlurb", {
                    defaultValue:
                      "Runs on your computer, for example in LM Studio.",
                  }),
                  t("settings.agent.localBadge", {
                    defaultValue: "Stays on your device",
                  }),
                )}
                {choiceCard(
                  "claude-code",
                  <Terminal className="h-4 w-4" aria-hidden="true" />,
                  t("settings.agent.codeTitle", {
                    defaultValue: "Claude Code",
                  }),
                  t("settings.agent.codeBlurb", {
                    defaultValue:
                      "For people who already use Claude Code, in the Claude app or in a terminal.",
                  }),
                  null,
                )}
                {choiceCard(
                  "codex",
                  <Braces className="h-4 w-4" aria-hidden="true" />,
                  t("settings.agent.codexTitle", { defaultValue: "Codex" }),
                  t("settings.agent.codexBlurb", {
                    defaultValue: "For people who use OpenAI Codex.",
                  }),
                  null,
                )}
              </TabsList>
              {status.enabled &&
                suggestionNote &&
                !picked &&
                suggestedChoice === choice && (
                  <p className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    {suggestionNote}
                  </p>
                )}

              <TabsContent value="claude-app" className="space-y-3">
                {detected && !detected.desktop && (
                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    <p>
                      {t("settings.agent.appNotFound", {
                        defaultValue:
                          "We could not find the Claude app on this computer.",
                      })}
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={CLAUDE_APP_DOWNLOAD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("settings.agent.appGet", {
                          defaultValue: "Get the Claude app",
                        })}
                        <span className="sr-only">
                          {" "}
                          {t("settings.agent.newTab", {
                            defaultValue: "(opens in a new tab)",
                          })}
                        </span>
                      </a>
                    </Button>
                  </div>
                )}
                <ol className="space-y-3">
                  {step(
                    1,
                    <Button
                      asChild
                      size="sm"
                      className="h-auto whitespace-normal"
                    >
                      <a
                        href={RELEASES_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download
                          className="mr-2 h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          {t("settings.agent.download", {
                            defaultValue:
                              "Download vaulted-money.mcpb from the latest release",
                          })}
                          <span className="sr-only">
                            {" "}
                            {t("settings.agent.newTab", {
                              defaultValue: "(opens in a new tab)",
                            })}
                          </span>
                        </span>
                      </a>
                    </Button>,
                  )}
                  {step(
                    2,
                    t("settings.agent.appOpen", {
                      defaultValue:
                        "Open the downloaded file. Claude asks you to confirm.",
                    }),
                  )}
                  {step(
                    3,
                    t("settings.agent.appKeepOpen", {
                      defaultValue: "Keep Vaulted Money open.",
                    }),
                  )}
                </ol>
                <p className="text-xs text-muted-foreground">
                  {t("settings.agent.appNoExtra", {
                    defaultValue: "No extra software needed.",
                  })}
                </p>
                {privacyLine(
                  t("settings.agent.appPrivacy", {
                    defaultValue: "What Claude reads is sent to Anthropic.",
                  }),
                )}
              </TabsContent>

              <TabsContent value="local" className="space-y-3">
                <ol className="space-y-3">
                  {step(
                    1,
                    copyButton(
                      "local",
                      localModelSnippet,
                      t("settings.agent.copySetup", {
                        defaultValue: "Copy setup",
                      }),
                      "default",
                    ),
                  )}
                  {step(
                    2,
                    t("settings.agent.localOpen", {
                      defaultValue:
                        "In LM Studio open Program, then Install, then Edit mcp.json, and paste.",
                    }),
                  )}
                  {step(
                    3,
                    t("settings.agent.localModel", {
                      defaultValue: "Choose a model that can use tools.",
                    }),
                  )}
                </ol>
                <p className="text-xs text-muted-foreground">
                  {t("settings.agent.nodeNote", {
                    defaultValue: "Requires Node 18 or newer.",
                  })}
                </p>
                {privacyLine(
                  t("settings.agent.localPrivacyLine", {
                    defaultValue:
                      "Your questions and data stay on this computer when the model runs here (for example LM Studio).",
                  }),
                )}
              </TabsContent>

              <TabsContent value="claude-code" className="space-y-4">
                {detected && (
                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    {detected.code ? (
                      <>
                        <p>
                          {t("settings.agent.codeFound", {
                            defaultValue: "Claude Code is on this computer.",
                          })}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={setupState === "running"}
                          onClick={runClaudeCodeSetup}
                        >
                          {setupState === "running" && (
                            <Loader2
                              className="mr-2 h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          )}
                          {t("settings.agent.codeSetupButton", {
                            defaultValue: "Set up Claude Code for me",
                          })}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>
                          {t("settings.agent.codeNotFound", {
                            defaultValue:
                              "We could not find Claude Code on this computer.",
                          })}
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={CLAUDE_CODE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("settings.agent.codeGet", {
                              defaultValue: "Get Claude Code",
                            })}
                            <span className="sr-only">
                              {" "}
                              {t("settings.agent.newTab", {
                                defaultValue: "(opens in a new tab)",
                              })}
                            </span>
                          </a>
                        </Button>
                      </>
                    )}
                    {setupStatus(setupState, {
                      running: t("settings.agent.codeSetupRunning", {
                        defaultValue: "Setting up. This can take a minute.",
                      }),
                      ready: t("settings.agent.codeSetupReady", {
                        defaultValue:
                          "Done. Open Claude Code and ask about your money.",
                      }),
                      failed: t("settings.agent.codeSetupFailed", {
                        defaultValue:
                          "That did not work. Use the steps below instead.",
                      }),
                      "not-found": t("settings.agent.codeNotFound", {
                        defaultValue:
                          "We could not find Claude Code on this computer.",
                      }),
                    })}
                  </div>
                )}
                <div className="space-y-2">
                  <RouteHeading className="text-sm font-medium">
                    {t("settings.agent.routeApp", {
                      defaultValue: "In the Claude app",
                    })}
                  </RouteHeading>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.agent.routeAppNote", {
                      defaultValue: "No commands needed.",
                    })}
                  </p>
                  <ol className="space-y-3">
                    {step(
                      1,
                      t("settings.agent.appRoute1", {
                        defaultValue:
                          "Open Settings, then Customize, then Plugins.",
                      }),
                    )}
                    {step(
                      2,
                      t("settings.agent.appRoute2", {
                        defaultValue:
                          "Click Add, then Add marketplace, then Add from a repository.",
                      }),
                    )}
                    {step(
                      3,
                      <>
                        <span>
                          {t("settings.agent.appRoute3", {
                            defaultValue: "Paste this, then click Sync:",
                          })}
                        </span>
                        <code className="break-all rounded bg-muted px-2 py-1 text-xs">
                          {CLAUDE_CODE_REPOSITORY}
                        </code>
                        {copyButton(
                          "repo",
                          CLAUDE_CODE_REPOSITORY,
                          t("settings.agent.copyRepository", {
                            defaultValue: "Copy repository name",
                          }),
                        )}
                      </>,
                    )}
                    {step(
                      4,
                      t("settings.agent.appRoute4", {
                        defaultValue:
                          "Open Discover, find Vaulted Money and click the + button.",
                      }),
                    )}
                  </ol>
                </div>
                <div className="space-y-2">
                  <RouteHeading className="text-sm font-medium">
                    {t("settings.agent.routeTerminal", {
                      defaultValue: "In a terminal",
                    })}
                  </RouteHeading>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.agent.codeNode", {
                      defaultValue: "Needs Node 18 or newer.",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.agent.terminalNote", {
                      defaultValue:
                        "Paste this into a normal terminal, not into Claude Code.",
                    })}
                  </p>
                  <pre className="whitespace-pre-wrap break-all rounded bg-muted px-2 py-1 text-xs">
                    {CLAUDE_CODE_COMMANDS}
                  </pre>
                  {copyButton(
                    "commands",
                    CLAUDE_CODE_COMMANDS,
                    t("settings.agent.copyCommands", {
                      defaultValue: "Copy commands",
                    }),
                  )}
                </div>
                {privacyLine(
                  t("settings.agent.codePrivacy", {
                    defaultValue: "What Claude reads is sent to Anthropic.",
                  }),
                )}
              </TabsContent>

              <TabsContent value="codex" className="space-y-4">
                {codexFound !== null && (
                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    {codexFound ? (
                      <>
                        <p>
                          {t("settings.agent.codexFound", {
                            defaultValue: "Codex is on this computer.",
                          })}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={codexState === "running"}
                          onClick={runCodexSetup}
                        >
                          {codexState === "running" && (
                            <Loader2
                              className="mr-2 h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          )}
                          {t("settings.agent.codexSetupButton", {
                            defaultValue: "Set up Codex for me",
                          })}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>
                          {t("settings.agent.codexNotFound", {
                            defaultValue:
                              "We could not find Codex on this computer.",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("settings.agent.codexInstallNote", {
                            defaultValue:
                              "Install, then come back and click Set up.",
                          })}
                        </p>
                        <pre className="whitespace-pre-wrap break-all rounded bg-muted px-2 py-1 text-xs">
                          {CODEX_INSTALL_COMMAND}
                        </pre>
                        <div className="flex flex-wrap gap-2">
                          {copyButton(
                            "codexInstall",
                            CODEX_INSTALL_COMMAND,
                            t("settings.agent.copyInstall", {
                              defaultValue: "Copy install command",
                            }),
                          )}
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={CODEX_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t("settings.agent.codexGet", {
                                defaultValue: "Get Codex",
                              })}
                              <span className="sr-only">
                                {" "}
                                {t("settings.agent.newTab", {
                                  defaultValue: "(opens in a new tab)",
                                })}
                              </span>
                            </a>
                          </Button>
                        </div>
                      </>
                    )}
                    {setupStatus(codexState, {
                      running: t("settings.agent.codeSetupRunning", {
                        defaultValue: "Setting up. This can take a minute.",
                      }),
                      ready: t("settings.agent.codexSetupReady", {
                        defaultValue:
                          "Done. Open Codex and ask about your money.",
                      }),
                      failed: t("settings.agent.codexSetupFailed", {
                        defaultValue:
                          "That did not work. Use the steps below instead.",
                      }),
                      "node-missing": t("settings.agent.codexNodeMissing", {
                        defaultValue:
                          "Node 18 or newer is needed. Install it, then try again.",
                      }),
                      "not-found": t("settings.agent.codexNotFound", {
                        defaultValue:
                          "We could not find Codex on this computer.",
                      }),
                    })}
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t("settings.agent.codexConfigNote", {
                      defaultValue: "Or add this to ~/.codex/config.toml",
                    })}
                  </p>
                  <pre className="whitespace-pre-wrap break-all rounded bg-muted px-2 py-1 text-xs">
                    {codexConfig}
                  </pre>
                  {copyButton(
                    "codexConfig",
                    codexConfig,
                    t("settings.agent.copyConfig", {
                      defaultValue: "Copy config",
                    }),
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("settings.agent.nodeNote", {
                      defaultValue: "Requires Node 18 or newer.",
                    })}
                  </p>
                </div>
                {privacyLine(
                  t("settings.agent.codexPrivacy", {
                    defaultValue: "What Codex reads is sent to OpenAI.",
                  }),
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ThemedCardContent>
      </ThemedCard>

      <div className="space-y-4">
        <ThemedCard aria-labelledby="where-to-chat-title">
          <ThemedCardHeader>
            <ThemedCardTitle id="where-to-chat-title">
              {t("settings.agent.askTitle", {
                defaultValue: "Ask your first question",
              })}
            </ThemedCardTitle>
          </ThemedCardHeader>
          <ThemedCardContent className="space-y-3">
            {blocker ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{blocker}</span>
              </p>
            ) : canAsk ? (
              <p className="flex items-start gap-2 rounded-md bg-green-600/10 px-3 py-2 text-sm">
                <MessageCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-green-700 dark:text-green-400"
                  aria-hidden="true"
                />
                <span>{whereToChat[choice]}</span>
              </p>
            ) : (
              <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {status.enabled
                  ? t("aiHub.chat.pickFirst", {
                      defaultValue:
                        "Pick how you want to chat. This card then says where to ask.",
                    })
                  : t("aiHub.chat.switchOnFirst", {
                      defaultValue:
                        "Switch on Allow agents to connect first. This card then says where to ask.",
                    })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("aiHub.chat.notHere", {
                defaultValue:
                  "The chat happens in that app, not on this page. Keep Vaulted Money open while you chat.",
              })}
            </p>
            <ul className="space-y-2">
              {EXAMPLE_QUESTIONS.map((question, index) => (
                <li
                  key={question}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span className="min-w-0 text-sm">
                    &ldquo;{question}&rdquo;
                  </span>
                  {copyButton(
                    index === 0 ? "ask0" : "ask1",
                    question,
                    t("settings.agent.copyQuestion", {
                      defaultValue: "Copy question",
                    }) + ` ${index + 1}`,
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {t("settings.agent.demoTip", {
                defaultValue:
                  "Tip: try it with demo data first (Ledgers, then Generate demo data). It replaces your current data, so only use it on a fresh start.",
              })}
            </p>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard aria-labelledby="agent-privacy-title">
          <ThemedCardContent className="space-y-3 pt-6">
            <SubHeading
              id="agent-privacy-title"
              className="text-sm font-medium leading-none tracking-tight"
            >
              {t("settings.agent.privacyTitle", { defaultValue: "Privacy" })}
            </SubHeading>
            <ul className="space-y-3 text-sm">
              {privacyPoint(
                <Cloud className={PRIVACY_ICON} aria-hidden="true" />,
                t("aiHub.privacy.cloudTitle", {
                  defaultValue: "Claude and Codex",
                }),
                t("aiHub.privacy.cloudBody", {
                  defaultValue:
                    "What the agent reads (transactions, vendors, balances) is sent to its maker: Anthropic or OpenAI.",
                }),
              )}
              {privacyPoint(
                <ShieldCheck className={PRIVACY_ICON} aria-hidden="true" />,
                t("aiHub.privacy.localTitle", {
                  defaultValue: "A private model",
                }),
                t("aiHub.privacy.localBody", {
                  defaultValue: "Everything stays on this computer.",
                }),
              )}
              {privacyPoint(
                <Power className={PRIVACY_ICON} aria-hidden="true" />,
                t("aiHub.privacy.offTitle", {
                  defaultValue: "Switched off",
                }),
                t("aiHub.privacy.offBody", {
                  defaultValue:
                    "No agent can read anything. Agents work with the desktop app only, not the claude.ai website.",
                }),
              )}
            </ul>
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
};

export default ConnectToAgentPanel;

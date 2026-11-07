import * as React from "react";
import {
  Bot,
  Check,
  Copy,
  Download,
  MessageCircle,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const RELEASES_URL = "https://github.com/nrajesh/vaulted.money/releases/latest";
const CLAUDE_CODE_REPOSITORY = "nrajesh/vaulted.money";
const CLAUDE_APP_DOWNLOAD_URL = "https://claude.ai/download";
const CLAUDE_CODE_URL = "https://claude.com/claude-code";
// Two lines: a terminal runs them one after the other when pasted. The
// `claude` prefix matters: a plain terminal does not understand `/plugin`.
const CLAUDE_CODE_COMMANDS =
  "claude plugin marketplace add nrajesh/vaulted.money\nclaude plugin install vaulted-money@vaulted-money";
const EXAMPLE_QUESTIONS = [
  "Where is my money going this month?",
  "Am I over budget anywhere?",
];

interface ConnectToAgentPanelProps {
  status: ApiServerStatus;
  serverPath: string;
  onToggle: (enabled: boolean) => void;
  onDisconnect: () => void;
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

type CopyTarget = "local" | "repo" | "commands" | "ask0" | "ask1";
type SetupState = "idle" | "running" | "ready" | "failed" | "not-found";
type Choice = "claude-app" | "local" | "claude-code";

/**
 * Lets the user connect an AI agent to the Local API. Status is owned by the
 * parent card. The snippets here never contain the API token: the MCP server
 * reads it from the app's own config file.
 */
const ConnectToAgentPanel = ({
  status,
  serverPath,
  onToggle,
  onDisconnect,
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
  const [confirming, setConfirming] = React.useState(false);
  const [choice, setChoice] = React.useState<Choice>("claude-app");
  // What the desktop app found on this computer. Stays null in an older build
  // that cannot look, in which case the page shows only the manual steps.
  const [detected, setDetected] = React.useState<{
    code: boolean;
    desktop: boolean;
  } | null>(null);
  const [setupState, setSetupState] = React.useState<SetupState>("idle");
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
      className="h-auto flex-col items-start gap-1 whitespace-normal border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:ring-1 data-[state=active]:ring-primary"
    >
      <span className="flex w-full items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
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

  const stepTitles = [
    t("settings.agent.step1", { defaultValue: "Switch on" }),
    t("settings.agent.step2", {
      defaultValue: "Pick how you chat with your money",
    }),
    t("settings.agent.step3", { defaultValue: "Ask your first question" }),
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
            <span
              className={
                ready
                  ? "rounded-full bg-green-600/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                  : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {ready
                ? t("settings.agent.ready", { defaultValue: "Ready" })
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
              const done = index === 0 && status.enabled;
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
              {t("settings.agent.enableHint", {
                defaultValue:
                  "This also turns the Local API on or off for scripts, not only agents.",
              })}
            </p>
          </div>

          <div className="space-y-3">
            <SubHeading className="text-sm font-semibold">
              {t("settings.agent.chooseTitle", {
                defaultValue: "How do you want to chat?",
              })}
            </SubHeading>
            <Tabs value={choice} onValueChange={(v) => setChoice(v as Choice)}>
              <TabsList
                aria-label={t("settings.agent.chooseTitle", {
                  defaultValue: "How do you want to chat?",
                })}
                className="grid h-auto w-full items-stretch gap-2 bg-transparent p-0 sm:grid-cols-3"
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
              </TabsList>

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
                    <p role="status" className="text-xs text-muted-foreground">
                      {setupState === "running" &&
                        t("settings.agent.codeSetupRunning", {
                          defaultValue: "Setting up. This can take a minute.",
                        })}
                      {setupState === "ready" &&
                        t("settings.agent.codeSetupReady", {
                          defaultValue:
                            "Done. Open Claude Code and ask about your money.",
                        })}
                      {setupState === "failed" &&
                        t("settings.agent.codeSetupFailed", {
                          defaultValue:
                            "That did not work. Use the steps below instead.",
                        })}
                      {setupState === "not-found" &&
                        t("settings.agent.codeNotFound", {
                          defaultValue:
                            "We could not find Claude Code on this computer.",
                        })}
                    </p>
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
            </Tabs>
          </div>
        </ThemedCardContent>
      </ThemedCard>

      <div className="space-y-4">
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle>
              {t("settings.agent.askTitle", {
                defaultValue: "Ask your first question",
              })}
            </ThemedCardTitle>
          </ThemedCardHeader>
          <ThemedCardContent className="space-y-2">
            <ul className="space-y-2">
              {EXAMPLE_QUESTIONS.map((question, index) => (
                <li
                  key={question}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-sm">&ldquo;{question}&rdquo;</span>
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

        <ThemedCard>
          <ThemedCardContent className="pt-6">
            <Alert>
              <SubHeading className="mb-1 font-medium leading-none tracking-tight">
                {t("settings.agent.privacyTitle", { defaultValue: "Privacy" })}
              </SubHeading>
              <AlertDescription className="space-y-1">
                <p>
                  {t("settings.agent.privacyCloud", {
                    defaultValue:
                      "Whatever the agent reads, such as transactions, vendors and balances, is sent to the AI provider (Anthropic, for Claude).",
                  })}
                </p>
                <p>
                  {t("settings.agent.privacyLocal", {
                    defaultValue:
                      "A local model keeps everything on this device. This does not work in the claude.ai website.",
                  })}
                </p>
              </AlertDescription>
            </Alert>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard>
          <ThemedCardContent className="pt-6">
            {confirming ? (
              <Alert variant="destructive">
                <AlertDescription className="space-y-2">
                  <p>
                    {t("settings.agent.disconnectWarning", {
                      defaultValue:
                        "This switches the Local API off and replaces the token, which cuts off every connected agent and script. Switch the Local API on again to let them reconnect on their own, with no copy-paste.",
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      aria-label={t("settings.agent.confirmDisconnect", {
                        defaultValue: "Confirm disconnect",
                      })}
                      onClick={() => {
                        setConfirming(false);
                        onDisconnect();
                      }}
                    >
                      {t("settings.agent.confirm", {
                        defaultValue: "Disconnect",
                      })}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label={t("common.cancel", {
                        defaultValue: "Cancel",
                      })}
                      onClick={() => setConfirming(false)}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                type="button"
                variant="outline"
                aria-label={t("settings.agent.disconnect", {
                  defaultValue: "Disconnect everything",
                })}
                onClick={() => setConfirming(true)}
              >
                {t("settings.agent.disconnect", {
                  defaultValue: "Disconnect everything",
                })}
              </Button>
            )}
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
};

export default ConnectToAgentPanel;

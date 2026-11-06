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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiServerStatus } from "@/utils/electron";
import { showError } from "@/utils/toast";

const RELEASES_URL = "https://github.com/nrajesh/vaulted.money/releases/latest";
const CLAUDE_CODE_REPOSITORY = "nrajesh/vaulted.money";
const CLAUDE_CODE_STEP_ONE = "/plugin marketplace add nrajesh/vaulted.money";
const CLAUDE_CODE_STEP_TWO = "/plugin install vaulted-money@vaulted-money";
const EXAMPLE_QUESTIONS = [
  "Where is my money going this month?",
  "Am I over budget anywhere?",
];

interface ConnectToAgentPanelProps {
  status: ApiServerStatus;
  serverPath: string;
  /** Heading level of the panel title; use 2 when the page has an h1. */
  headingLevel?: 2 | 3;
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

type CopyTarget = "local" | "repo" | "step1" | "step2" | "ask0" | "ask1";
type Choice = "claude-app" | "local" | "claude-code";

/**
 * Lets the user connect an AI agent to the Local API. Status is owned by the
 * parent card. The snippets here never contain the API token: the MCP server
 * reads it from the app's own config file.
 */
const ConnectToAgentPanel = ({
  status,
  serverPath,
  headingLevel = 3,
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
  const Heading = `h${headingLevel}` as const;
  const [confirming, setConfirming] = React.useState(false);
  const [choice, setChoice] = React.useState<Choice>("claude-app");
  const SubHeading = headingLevel === 2 ? "h3" : "h4";

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
    <section
      aria-labelledby="connect-agent-title"
      className="space-y-5 rounded-md border p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <Heading
          id="connect-agent-title"
          className="flex items-center gap-2 text-base font-semibold"
        >
          <Bot className="h-5 w-5 text-muted-foreground" />
          {t("settings.agent.title", { defaultValue: "Connect to agent" })}
        </Heading>
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
      <p className="text-sm text-muted-foreground">
        {t("settings.agent.description", {
          defaultValue:
            "Chat with an AI about your money manager in three quick steps.",
        })}
      </p>

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
              t("settings.agent.appTitle", { defaultValue: "The Claude app" }),
              t("settings.agent.appBlurb", {
                defaultValue: "Chat in the Claude desktop app.",
              }),
              t("settings.agent.appBadge", { defaultValue: "Easiest" }),
            )}
            {choiceCard(
              "local",
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
              t("settings.agent.localTitle", {
                defaultValue: "A private model on this computer",
              }),
              t("settings.agent.localBlurb", {
                defaultValue:
                  "Your questions and data stay on this computer when the model runs here (for example LM Studio).",
              }),
              t("settings.agent.localBadge", {
                defaultValue: "Keeps data on your device",
              }),
            )}
            {choiceCard(
              "claude-code",
              <Terminal className="h-4 w-4" aria-hidden="true" />,
              t("settings.agent.codeTitle", { defaultValue: "Claude Code" }),
              t("settings.agent.codeBlurb", {
                defaultValue:
                  "For people who already use Claude Code, in the Claude app or in a terminal.",
              }),
              null,
            )}
          </TabsList>

          <TabsContent value="claude-app" className="space-y-3">
            <ol className="space-y-3">
              {step(
                1,
                <Button asChild size="sm" className="h-auto whitespace-normal">
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
                  t("settings.agent.copySetup", { defaultValue: "Copy setup" }),
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
                  "Your questions and data stay on this computer when the model runs here.",
              }),
            )}
          </TabsContent>

          <TabsContent value="claude-code" className="space-y-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium">
                {t("settings.agent.routeApp", {
                  defaultValue: "In the Claude app",
                })}
              </h5>
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
              <h5 className="text-sm font-medium">
                {t("settings.agent.routeTerminal", {
                  defaultValue: "In a terminal",
                })}
              </h5>
              <p className="text-xs text-muted-foreground">
                {t("settings.agent.codeNode", {
                  defaultValue: "Needs Node 18 or newer.",
                })}
              </p>
              <ol className="space-y-3">
                {step(
                  1,
                  <>
                    <code className="break-all rounded bg-muted px-2 py-1 text-xs">
                      {CLAUDE_CODE_STEP_ONE}
                    </code>
                    {copyButton(
                      "step1",
                      CLAUDE_CODE_STEP_ONE,
                      t("settings.agent.copyStep1", {
                        defaultValue: "Copy step 1",
                      }),
                    )}
                  </>,
                )}
                {step(
                  2,
                  <>
                    <code className="break-all rounded bg-muted px-2 py-1 text-xs">
                      {CLAUDE_CODE_STEP_TWO}
                    </code>
                    {copyButton(
                      "step2",
                      CLAUDE_CODE_STEP_TWO,
                      t("settings.agent.copyStep2", {
                        defaultValue: "Copy step 2",
                      }),
                    )}
                  </>,
                )}
              </ol>
            </div>
            {privacyLine(
              t("settings.agent.codePrivacy", {
                defaultValue: "What Claude reads is sent to Anthropic.",
              }),
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <SubHeading className="text-sm font-semibold">
          {t("settings.agent.askTitle", {
            defaultValue: "Ask your first question",
          })}
        </SubHeading>
        <ul className="space-y-2">
          {EXAMPLE_QUESTIONS.map((question, index) => (
            <li key={question} className="flex flex-wrap items-center gap-2">
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
      </div>

      <Alert>
        <AlertTitle>
          {t("settings.agent.privacyTitle", { defaultValue: "Privacy" })}
        </AlertTitle>
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
                {t("settings.agent.confirm", { defaultValue: "Disconnect" })}
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label={t("common.cancel", { defaultValue: "Cancel" })}
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
    </section>
  );
};

export default ConnectToAgentPanel;

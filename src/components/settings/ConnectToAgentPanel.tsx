import * as React from "react";
import { Bot, Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ApiServerStatus } from "@/utils/electron";
import { showError } from "@/utils/toast";

const RELEASES_URL = "https://github.com/nrajesh/vaulted.money/releases/latest";
const CLAUDE_CODE_COMMANDS =
  "/plugin marketplace add nrajesh/vaulted.money\n/plugin install vaulted-money@vaulted-money";

interface ConnectToAgentPanelProps {
  status: ApiServerStatus;
  serverPath: string;
  /** Heading level of the panel title; use 2 when the page has an h1. */
  headingLevel?: 2 | 3;
  onToggle: (enabled: boolean) => void;
  onDisconnect: () => void;
}

type CopyTarget = "desktop" | "code" | "local";

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
  const [copied, setCopied] = React.useState<CopyTarget | null>(null);
  const copiedTimer = React.useRef<number | null>(null);
  React.useEffect(
    () => () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    },
    [],
  );
  const Heading = `h${headingLevel}` as const;
  const [confirming, setConfirming] = React.useState(false);

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
      setCopied(null);
      showError(
        t("settings.agent.copyFailed", {
          defaultValue: "Could not copy to the clipboard.",
        }),
      );
      return;
    }
    setCopied(target);
    // One shared timer so a later copy is not cleared by an earlier one.
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(null), 1500);
  };

  const ready = status.enabled && status.running;

  const copyButton = (target: CopyTarget, value: string, label: string) => (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={() => copy(target, value)}
    >
      {copied === target ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <section
      aria-labelledby="connect-agent-title"
      className="space-y-4 rounded-md border p-4"
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
            "Let an AI agent read and update your money manager through the Local API. Turn it on, then copy the setup for your agent.",
        })}
      </p>

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
      <p className="-mt-2 text-xs text-muted-foreground">
        {t("settings.agent.enableHint", {
          defaultValue:
            "This also turns the Local API on or off for scripts, not only agents.",
        })}
      </p>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          {t("settings.agent.desktopTitle", { defaultValue: "Claude Desktop" })}
        </h4>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm">
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t("settings.agent.download", {
                defaultValue: "Download the .mcpb bundle",
              })}
            </a>{" "}
            {t("settings.agent.doubleClick", {
              defaultValue: "from the latest release, then double-click it.",
            })}
          </p>
          {copyButton(
            "desktop",
            RELEASES_URL,
            t("settings.agent.copyDesktop", {
              defaultValue: "Copy Claude Desktop download link",
            }),
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          {t("settings.agent.codeTitle", { defaultValue: "Claude Code" })}
        </h4>
        <div className="flex items-start justify-between gap-2">
          <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
            {CLAUDE_CODE_COMMANDS}
          </pre>
          {copyButton(
            "code",
            CLAUDE_CODE_COMMANDS,
            t("settings.agent.copyCode", {
              defaultValue: "Copy Claude Code commands",
            }),
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          {t("settings.agent.localTitle", { defaultValue: "Local model" })}
        </h4>
        <div className="flex items-start justify-between gap-2">
          <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
            {localModelSnippet}
          </pre>
          {copyButton(
            "local",
            localModelSnippet,
            t("settings.agent.copyLocal", {
              defaultValue: "Copy local model configuration",
            }),
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.agent.nodeNote", {
            defaultValue: "Requires Node 18 or newer.",
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

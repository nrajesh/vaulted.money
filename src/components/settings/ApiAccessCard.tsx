import * as React from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Copy,
  KeyRound,
  Plug,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocalApi } from "@/hooks/useLocalApi";

type LocalApi = ReturnType<typeof useLocalApi>;

interface ApiAccessCardProps {
  /**
   * The Local API state of the page this card sits on. Sharing it keeps this
   * card and the agent steps beside it showing the same on/off state.
   */
  api?: LocalApi;
  /** On the AI page the agent steps are right above, so the link is dropped. */
  embedded?: boolean;
}

/**
 * Desktop-only controls for the local REST API. The API is off by default,
 * listens on 127.0.0.1 only and requires the bearer token shown here.
 */
const ApiAccessCard = ({ api, embedded }: ApiAccessCardProps) =>
  api ? (
    <ApiAccessCardView api={api} embedded={embedded} />
  ) : (
    <StandaloneApiAccessCard />
  );

const StandaloneApiAccessCard = () => <ApiAccessCardView api={useLocalApi()} />;

const ApiAccessCardView = ({
  api,
  embedded = false,
}: {
  api: LocalApi;
  embedded?: boolean;
}) => {
  const { t } = useTranslation();
  const {
    hasBridge,
    supported,
    status,
    portInput,
    setPortInput,
    apply,
    toggleEnabled,
    regenerate,
    loadFailed,
  } = api;
  const [showToken, setShowToken] = React.useState(false);
  const [copied, setCopied] = React.useState<"token" | "url" | null>(null);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  if (!supported) {
    return (
      <ThemedCard className="md:col-span-2 lg:col-span-3">
        <ThemedCardHeader>
          <ThemedCardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            {t("settings.api.title", { defaultValue: "Local API" })}
          </ThemedCardTitle>
          <ThemedCardDescription>
            {hasBridge
              ? t("settings.api.outdatedDesktop", {
                  defaultValue:
                    "This desktop build does not include the Local API. Update or rebuild the desktop app to use it.",
                })
              : t("settings.api.desktopOnly", {
                  defaultValue:
                    "The Local API is available in the desktop app only. The web and mobile apps cannot host a local server.",
                })}
          </ThemedCardDescription>
        </ThemedCardHeader>
      </ThemedCard>
    );
  }
  if (loadFailed) {
    return (
      <ThemedCard className="md:col-span-2 lg:col-span-3">
        <ThemedCardHeader>
          <ThemedCardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            {t("settings.api.title", { defaultValue: "Local API" })}
          </ThemedCardTitle>
          <ThemedCardDescription role="alert">
            {t("settings.api.loadFailed", {
              defaultValue:
                "Could not read the Local API status. Restart the app and try again.",
            })}
          </ThemedCardDescription>
        </ThemedCardHeader>
      </ThemedCard>
    );
  }
  if (!status) return null;

  const copy = async (what: "token" | "url", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1500);
  };

  // The address with the port cut out, so the port can sit in it as a field.
  const [, urlBeforePort = "", urlAfterPort = ""] =
    /^(.*:)\d+(.*)$/.exec(status.url) ?? [];

  const fields = (
    <>
      {/* One line for the whole address. Only the port is a field; the rest
          is fixed text, because the server always binds to 127.0.0.1. */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium leading-none">
          {t("aiHub.api.address", { defaultValue: "Address" })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 items-center rounded-md bg-muted px-3 font-mono text-xs">
            <span className="whitespace-nowrap">{urlBeforePort}</span>
            <Input
              id="api-port"
              aria-label={t("settings.api.port", { defaultValue: "Port" })}
              inputMode="numeric"
              maxLength={5}
              className="mx-1 my-1 h-8 w-[4.75rem] bg-background px-2 text-center font-mono text-xs"
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
            />
            <span className="whitespace-nowrap">{urlAfterPort}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={Number(portInput) === status.port}
            onClick={() =>
              apply(
                { port: Number(portInput) },
                t("settings.api.portChanged", {
                  defaultValue: "Port updated",
                }),
              )
            }
          >
            {t("aiHub.api.savePort", { defaultValue: "Save port" })}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label={t("settings.api.copyUrl", {
              defaultValue: "Copy base URL",
            })}
            onClick={() => copy("url", status.url)}
          >
            {copied === "url" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("aiHub.api.portOnly", {
            defaultValue: "Only the port number can be changed.",
          })}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>
          {t("settings.api.token", { defaultValue: "Access token" })}
        </Label>
        <div className="flex gap-2">
          <Input
            readOnly
            type={showToken ? "text" : "password"}
            value={status.token}
            tabIndex={-1}
            className="cursor-default bg-muted font-mono text-xs focus-visible:ring-0"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label={t("settings.api.showToken", {
              defaultValue: "Show or hide token",
            })}
            onClick={() => setShowToken((v) => !v)}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("settings.api.copyToken", {
              defaultValue: "Copy token",
            })}
            onClick={() => copy("token", status.token)}
          >
            {copied === "token" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("settings.api.regenerate", {
              defaultValue: "Generate new token",
            })}
            onClick={regenerate}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Alert>
        <AlertTitle>
          {t("settings.api.usageTitle", { defaultValue: "Try it" })}
        </AlertTitle>
        <AlertDescription>
          <code className="break-all text-xs">
            curl -H &quot;Authorization: Bearer &lt;token&gt;&quot; {status.url}
            /ledgers
          </code>
        </AlertDescription>
      </Alert>
    </>
  );

  // Inside the agent steps: the same controls as one quiet, collapsible row
  // under the switch that governs them, with no second on/off switch.
  if (embedded) {
    return (
      <Collapsible
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        className="rounded-md border"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plug
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="flex-1">
              {t("aiHub.api.inlineTitle", {
                defaultValue: "Local API for scripts",
              })}
            </span>
            <span
              className={
                status.enabled
                  ? "text-xs text-green-700 dark:text-green-400"
                  : "text-xs text-muted-foreground"
              }
            >
              {status.enabled
                ? t("aiHub.api.on", { defaultValue: "On" })
                : t("settings.agent.off", { defaultValue: "Off" })}
            </span>
            <ChevronRight
              className={`h-4 w-4 shrink-0 transition-transform ${advancedOpen ? "rotate-90" : ""}`}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t px-3 py-3">
          <p className="text-xs text-muted-foreground">
            {t("aiHub.api.inlineBody", {
              defaultValue:
                "For your own scripts. Reachable from this computer only.",
            })}
          </p>
          {status.enabled ? (
            fields
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("aiHub.api.inlineOff", {
                defaultValue:
                  "Switch on Allow agents to connect to see the address and access token.",
              })}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <ThemedCard className="md:col-span-2 lg:col-span-3">
      <ThemedCardHeader>
        <ThemedCardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          {t("settings.api.title", { defaultValue: "Local API" })}
        </ThemedCardTitle>
        <ThemedCardDescription>
          {t("settings.api.description", {
            defaultValue:
              "Let scripts and tools on this computer manage your data over HTTP. The API only listens on 127.0.0.1, so only apps on this computer can reach it. If you connect an AI agent, what it reads is sent to that agent's provider.",
          })}
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="api-enabled">
            {t("settings.api.enable", { defaultValue: "Enable local API" })}
          </Label>
          <Switch
            id="api-enabled"
            checked={status.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>

        <>
          <p className="text-sm text-muted-foreground">
            {t("settings.api.agentHint", {
              defaultValue: "Want an AI agent to work with your money manager?",
            })}
          </p>
          <Button asChild variant="outline">
            <Link to="/connect-agent">
              <Bot className="mr-2 h-4 w-4" />
              {t("settings.api.connectAgent", {
                defaultValue: "Connect an AI agent",
              })}
            </Link>
          </Button>
        </>

        {status.enabled && (
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="px-2">
                <ChevronRight
                  className={`mr-1 h-4 w-4 transition-transform ${advancedOpen ? "rotate-90" : ""}`}
                />
                {t("settings.api.advanced", { defaultValue: "Advanced" })}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {fields}
            </CollapsibleContent>
          </Collapsible>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default ApiAccessCard;

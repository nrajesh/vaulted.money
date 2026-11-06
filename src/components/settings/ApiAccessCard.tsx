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

/**
 * Desktop-only controls for the local REST API. The API is off by default,
 * listens on 127.0.0.1 only and requires the bearer token shown here.
 */
const ApiAccessCard = () => {
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
  } = useLocalApi();
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
              "Let scripts and tools on this computer manage your data over HTTP. Nothing leaves your device: the API only listens on 127.0.0.1.",
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
              <div className="space-y-2">
                <Label htmlFor="api-port">
                  {t("settings.api.port", { defaultValue: "Port" })}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="api-port"
                    inputMode="numeric"
                    className="max-w-[8rem]"
                    value={portInput}
                    onChange={(e) => setPortInput(e.target.value)}
                  />
                  <Button
                    variant="outline"
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
                    {t("common.save", { defaultValue: "Save" })}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {t("settings.api.baseUrl", { defaultValue: "Base URL" })}
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={status.url}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
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
              </div>

              <div className="space-y-2">
                <Label>
                  {t("settings.api.token", { defaultValue: "Access token" })}
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    type={showToken ? "text" : "password"}
                    value={status.token}
                    className="font-mono text-xs"
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
                    curl -H &quot;Authorization: Bearer &lt;token&gt;&quot;{" "}
                    {status.url}/ledgers
                  </code>
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          </Collapsible>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default ApiAccessCard;

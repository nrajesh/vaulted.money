import * as React from "react";
import { Check, Copy, KeyRound, Plug, RefreshCw } from "lucide-react";
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
import { getElectronAPI, type ApiServerStatus } from "@/utils/electron";
import { showError, showSuccess } from "@/utils/toast";

/**
 * Desktop-only controls for the local REST API. The API is off by default,
 * listens on 127.0.0.1 only and requires the bearer token shown here.
 */
const ApiAccessCard = () => {
  const { t } = useTranslation();
  const electron = getElectronAPI();
  const [status, setStatus] = React.useState<ApiServerStatus | null>(null);
  const [portInput, setPortInput] = React.useState("");
  const [showToken, setShowToken] = React.useState(false);
  const [copied, setCopied] = React.useState<"token" | "url" | null>(null);

  React.useEffect(() => {
    electron?.getApiConfig().then((next) => {
      setStatus(next);
      setPortInput(String(next.port));
    });
  }, [electron]);

  if (!electron || !status) return null;

  const apply = async (
    update: { enabled?: boolean; port?: number },
    successMessage: string,
  ) => {
    const next = await electron.setApiConfig(update);
    setStatus(next);
    setPortInput(String(next.port));
    if (next.error) showError(next.error);
    else showSuccess(successMessage);
  };

  const copy = async (what: "token" | "url", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const regenerate = async () => {
    setStatus(await electron.regenerateApiToken());
    showSuccess(
      t("settings.api.tokenRegenerated", {
        defaultValue:
          "New token generated. Update any client using the old one.",
      }),
    );
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
            onCheckedChange={(enabled) =>
              apply(
                { enabled },
                enabled
                  ? t("settings.api.started", { defaultValue: "API enabled" })
                  : t("settings.api.stopped", { defaultValue: "API disabled" }),
              )
            }
          />
        </div>

        {status.enabled && (
          <>
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
          </>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default ApiAccessCard;

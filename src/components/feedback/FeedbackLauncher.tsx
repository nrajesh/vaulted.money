import * as React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Bug, Lightbulb, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FEEDBACK_KIND,
  type FeedbackKind,
  buildFeedbackDiagnostics,
  buildGitHubFeedbackUrl,
} from "@/utils/feedbackLinks";
import { showError, showSuccess } from "@/utils/toast";

const OPTIONS: Array<{
  kind: FeedbackKind;
  /** Translation key prefix, e.g. "bug" -> feedback.bug.title */
  id: "bug" | "idea" | "security";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    kind: FEEDBACK_KIND.BUG,
    id: "bug",
    title: "Report an issue",
    description: "Open a bug report with the required details pre-filled.",
    icon: Bug,
  },
  {
    kind: FEEDBACK_KIND.FEEDBACK,
    id: "idea",
    title: "Share feedback",
    description: "Suggest an improvement or feature request.",
    icon: Lightbulb,
  },
  {
    kind: FEEDBACK_KIND.VULNERABILITY,
    id: "security",
    title: "Security vulnerability",
    description: "Use responsible disclosure from the security policy page.",
    icon: AlertTriangle,
  },
];

const getAppContext = () =>
  navigator.userAgent.includes("Electron") ? "Electron App" : "Web App";

interface FeedbackLauncherProps {
  triggerClassName?: string;
}

export const FeedbackLauncher = ({
  triggerClassName,
}: FeedbackLauncherProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [selectedKind, setSelectedKind] = React.useState<FeedbackKind>(
    FEEDBACK_KIND.BUG,
  );

  const copyDiagnostics = React.useCallback(async () => {
    const diagnosticsText = buildFeedbackDiagnostics({
      pathname: location.pathname,
      appContext: getAppContext(),
      feedbackKind: selectedKind,
    });

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(diagnosticsText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = diagnosticsText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showSuccess(t("feedback.copied", { defaultValue: "Diagnostics copied" }));
    } catch {
      showError(
        t("feedback.copyFailed", {
          defaultValue: "Unable to copy diagnostics",
        }),
      );
    }
  }, [location.pathname, selectedKind, t]);

  const handleContinue = React.useCallback(() => {
    const feedbackUrl = buildGitHubFeedbackUrl(selectedKind, {
      pathname: location.pathname,
      appContext: getAppContext(),
    });

    window.open(feedbackUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, [location.pathname, selectedKind]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("feedback.give", { defaultValue: "Give feedback" })}
          title={t("feedback.tooltip", { defaultValue: "Feedback" })}
          className={triggerClassName}
        >
          <MessageSquarePlus className="size-5" />
          <span className="sr-only">
            {t("feedback.give", { defaultValue: "Give feedback" })}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {t("feedback.dialogTitle", { defaultValue: "Share feedback" })}
          </DialogTitle>
          <DialogDescription>
            {t("feedback.dialogDescription", {
              defaultValue:
                "Choose what you want to report. We will open the matching GitHub page in a new tab.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.kind === selectedKind;
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => setSelectedKind(option.kind)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  "hover:border-primary/50 hover:bg-muted/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected && "border-primary bg-primary/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-muted p-2">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {t(`feedback.${option.id}.title`, {
                        defaultValue: option.title,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(`feedback.${option.id}.description`, {
                        defaultValue: option.description,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {t("feedback.noGithub", {
            defaultValue:
              "No GitHub account? Use Copy diagnostics and share details with the maintainer.",
          })}
        </p>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={copyDiagnostics}>
            {t("feedback.copy", { defaultValue: "Copy diagnostics" })}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={handleContinue}>
            {selectedKind === FEEDBACK_KIND.VULNERABILITY
              ? t("feedback.openSecurity", {
                  defaultValue: "Open security policy",
                })
              : t("feedback.openIssue", { defaultValue: "Open GitHub issue" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

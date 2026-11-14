import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";
import {
  useHelpDrawer,
  type HelpDrawerTab,
} from "@/contexts/HelpDrawerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  resetDismissedHints,
  useDismissedHints,
} from "@/hooks/useDismissedHints";
import {
  setDisplayPreferences,
  systemPrefersReducedMotion,
  useDisplayPreferences,
  type TextSize,
} from "@/hooks/useDisplayPreferences";
import { useAiFeatures } from "@/hooks/useAiFeatures";
import { useAIConfig } from "@/hooks/useAIConfig";
import { useLocalApi } from "@/hooks/useLocalApi";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { InlinePreview } from "./InlinePreview";
import {
  GUIDE_SECTIONS,
  HELP_CARDS,
  SAMPLE_QUESTIONS,
  USER_GUIDE_URL,
  guideUrl,
  helpCardsForPath,
  type HelpCardId,
} from "./helpTopics";

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </h3>
);

const HelpCardView = ({ id }: { id: HelpCardId }) => {
  const { t } = useTranslation();
  const card = HELP_CARDS[id];
  const guide = card.guide ? GUIDE_SECTIONS[card.guide] : null;
  const guideTitle =
    card.guide && guide
      ? t(`helpDrawer.guide.${card.guide}.title`, {
          defaultValue: guide.title,
        })
      : "";
  const readMore = t("helpDrawer.previewGuide", {
    title: guideTitle,
    defaultValue: "Read more: {{title}}",
  });

  return (
    <li className="rounded-xl border bg-card p-4">
      <p className="font-medium text-foreground">
        {t(`helpDrawer.cards.${id}.title`, { defaultValue: card.title })}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t(`helpDrawer.cards.${id}.body`, { defaultValue: card.body })}
      </p>
      {card.guide && guide && (
        <InlinePreview
          title={guideTitle}
          triggerText={readMore}
          triggerLabel={readMore}
          readMoreHref={guideUrl(card.guide)}
          body={t(`helpDrawer.guide.${card.guide}.summary`, {
            defaultValue: guide.summary,
          })}
        />
      )}
    </li>
  );
};

const TEXT_SIZES: Array<{ value: TextSize; key: string; fallback: string }> = [
  { value: "default", key: "helpDrawer.textDefault", fallback: "Default" },
  { value: "large", key: "helpDrawer.textLarge", fallback: "Large" },
  { value: "larger", key: "helpDrawer.textLarger", fallback: "Larger" },
];

const DisplaySettings = () => {
  const { t } = useTranslation();
  const preferences = useDisplayPreferences();
  const reduceMotion = preferences.reduceMotion ?? systemPrefersReducedMotion();
  const textSizeLabelId = React.useId();

  return (
    <section
      className="space-y-4"
      aria-labelledby={`${textSizeLabelId}-display`}
    >
      <div id={`${textSizeLabelId}-display`}>
        <SectionHeading>
          {t("helpDrawer.display", { defaultValue: "Display" })}
        </SectionHeading>
      </div>
      <div className="space-y-2">
        <p id={textSizeLabelId} className="text-sm font-medium">
          {t("helpDrawer.textSize", { defaultValue: "Text size" })}
        </p>
        <div
          role="radiogroup"
          aria-labelledby={textSizeLabelId}
          className="grid grid-cols-3 gap-2"
        >
          {TEXT_SIZES.map(({ value, key, fallback }, index) => {
            const selected = preferences.textSize === value;
            return (
              <Button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                variant={selected ? "default" : "outline"}
                className="h-11"
                onClick={() => setDisplayPreferences({ textSize: value })}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mr-1 font-semibold",
                    ["text-sm", "text-base", "text-lg"][index],
                  )}
                >
                  A
                </span>
                {t(key, { defaultValue: fallback })}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <div>
          <Label htmlFor="help-high-contrast" className="text-sm font-medium">
            {t("helpDrawer.highContrast", { defaultValue: "High contrast" })}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("helpDrawer.highContrastHint", {
              defaultValue: "Darker text and stronger outlines.",
            })}
          </p>
        </div>
        <Switch
          id="help-high-contrast"
          checked={preferences.highContrast}
          onCheckedChange={(checked) =>
            setDisplayPreferences({ highContrast: checked === true })
          }
        />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <div>
          <Label htmlFor="help-reduce-motion" className="text-sm font-medium">
            {t("helpDrawer.reduceMotion", { defaultValue: "Reduce motion" })}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("helpDrawer.reduceMotionHint", {
              defaultValue:
                "Stops animations. Follows your device until you change it.",
            })}
          </p>
        </div>
        <Switch
          id="help-reduce-motion"
          checked={reduceMotion}
          onCheckedChange={(checked) =>
            setDisplayPreferences({ reduceMotion: checked === true })
          }
        />
      </div>
    </section>
  );
};

const HelpTab = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { dismissed } = useDismissedHints();
  const cards = helpCardsForPath(pathname);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading>
          {t("helpDrawer.onThisScreen", { defaultValue: "On this screen" })}
        </SectionHeading>
        <ul className="space-y-3">
          {cards.map((id) => (
            <HelpCardView key={id} id={id} />
          ))}
        </ul>
      </section>

      <DisplaySettings />

      <section className="space-y-3">
        <SectionHeading>
          {t("helpDrawer.moreHelp", { defaultValue: "More help" })}
        </SectionHeading>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start"
            disabled={dismissed.length === 0}
            onClick={() => {
              resetDismissedHints();
              showSuccess(
                t("helpDrawer.tipsShown", {
                  defaultValue: "Hidden tips are back.",
                }),
              );
            }}
          >
            {t("helpDrawer.showTips", {
              defaultValue: "Show hidden tips again",
            })}
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start">
            <a href={USER_GUIDE_URL} target="_blank" rel="noreferrer">
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("helpDrawer.userGuide", { defaultValue: "User guide" })}
              <ExternalLink
                className="ml-auto h-3.5 w-3.5"
                aria-hidden="true"
              />
            </a>
          </Button>
          <FeedbackLauncher
            showLabel
            triggerClassName="h-11 w-full justify-start"
          />
        </div>
      </section>
    </div>
  );
};

const StatusRow = ({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) => (
  <div className="flex min-h-11 items-center justify-between gap-3 border-b py-2 last:border-0">
    <dt className="text-sm">{label}</dt>
    <dd
      className={cn(
        "text-right text-sm font-medium",
        good
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-muted-foreground",
      )}
    >
      {value}
    </dd>
  </div>
);

const AskTab = ({ onNavigate }: { onNavigate: (to: string) => void }) => {
  const { t } = useTranslation();
  const { enabled: aiEnabled } = useAiFeatures();
  const { config } = useAIConfig();
  const localApi = useLocalApi();
  const [copied, setCopied] = React.useState<string | null>(null);

  const agentsOn =
    !!localApi.status?.enabled && !!localApi.status?.running && aiEnabled;

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      showSuccess(
        t("helpDrawer.ask.copied", { defaultValue: "Question copied" }),
      );
    } catch {
      showError(
        t("helpDrawer.ask.copyFailed", {
          defaultValue: "Couldn't copy. Select the text instead.",
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed">
        {t("helpDrawer.ask.intro", {
          defaultValue:
            "Ask questions about your money in an AI app connected to Vaulted Money, such as Claude or ChatGPT.",
        })}
      </p>

      <section className="space-y-2">
        <SectionHeading>
          {t("helpDrawer.ask.status", { defaultValue: "Status" })}
        </SectionHeading>
        <dl className="rounded-xl border px-4">
          <StatusRow
            label={t("helpDrawer.ask.aiFeatures", {
              defaultValue: "AI features",
            })}
            value={
              aiEnabled
                ? t("helpDrawer.ask.on", { defaultValue: "On" })
                : t("helpDrawer.ask.off", { defaultValue: "Off" })
            }
            good={aiEnabled}
          />
          <StatusRow
            label={t("helpDrawer.ask.inApp", {
              defaultValue: "AI inside the app",
            })}
            value={
              config.provider
                ? t("helpDrawer.ask.inAppReady", {
                    name: config.provider.name,
                    defaultValue: "Ready: {{name}}",
                  })
                : t("helpDrawer.ask.notSetUp", { defaultValue: "Not set up" })
            }
            good={!!config.provider}
          />
          <StatusRow
            label={t("helpDrawer.ask.otherApps", {
              defaultValue: "Other AI apps",
            })}
            value={
              !localApi.supported
                ? t("helpDrawer.ask.macOnly", {
                    defaultValue: "Mac app only",
                  })
                : agentsOn
                  ? t("helpDrawer.ask.connected", {
                      defaultValue: "Can connect",
                    })
                  : t("helpDrawer.ask.notConnected", {
                      defaultValue: "Not switched on",
                    })
            }
            good={agentsOn}
          />
        </dl>
      </section>

      <section className="space-y-2">
        <SectionHeading>
          {t("helpDrawer.ask.samples", { defaultValue: "Questions to try" })}
        </SectionHeading>
        <ul className="space-y-2">
          {SAMPLE_QUESTIONS.map(({ key, text }) => {
            const question = t(key, { defaultValue: text });
            return (
              <li
                key={key}
                className="flex items-center gap-2 rounded-xl border p-3 pl-4"
              >
                <span className="flex-1 select-text text-sm">{question}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label={t("helpDrawer.ask.copyQuestion", {
                    question,
                    defaultValue: "Copy question: {{question}}",
                  })}
                  onClick={() => void copy(key, question)}
                >
                  {copied === key ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <Button
        type="button"
        className="h-11 w-full"
        onClick={() => onNavigate("/ai-providers")}
      >
        <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("helpDrawer.ask.setUp", {
          defaultValue: "Set up the AI assistant",
        })}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("helpDrawer.ask.privacyNote", {
          defaultValue:
            "What an AI app reads is sent to the company that makes it. Nothing is sent until you switch it on.",
        })}
      </p>
    </div>
  );
};

/**
 * The help drawer: offline help for the current screen with display
 * settings, and a guide to asking AI about your money. Slides in from the
 * right on desktop and up from the bottom on phones.
 */
export const HelpDrawer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOpen, setOpen, tab, setTab } = useHelpDrawer();
  const titleId = React.useId();
  const descriptionId = React.useId();

  const goTo = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        // SheetContent ships placeholder title/description elements; point
        // the dialog at the real ones.
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "flex flex-col gap-4 overflow-hidden p-0",
          isMobile
            ? "h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
            : "w-full sm:max-w-md",
        )}
      >
        <SheetHeader className="px-5 pt-5 text-left">
          <SheetTitle id={titleId}>
            {t("helpDrawer.title", { defaultValue: "Help" })}
          </SheetTitle>
          <SheetDescription id={descriptionId}>
            {t("helpDrawer.description", {
              defaultValue:
                "Tips for this screen, display settings and asking AI.",
            })}
          </SheetDescription>
        </SheetHeader>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as HelpDrawerTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-5 grid h-11 grid-cols-2">
            <TabsTrigger value="help" className="h-9">
              {t("helpDrawer.tabHelp", { defaultValue: "Help & display" })}
            </TabsTrigger>
            <TabsTrigger value="ask" className="h-9">
              {t("helpDrawer.tabAsk", { defaultValue: "Ask AI" })}
            </TabsTrigger>
          </TabsList>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
            <TabsContent value="help" className="mt-0">
              <HelpTab />
            </TabsContent>
            <TabsContent value="ask" className="mt-0">
              <AskTab onNavigate={goTo} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

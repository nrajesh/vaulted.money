import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  Heart,
  Monitor,
  ShieldCheck,
  Smartphone,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { storeChannels, type StoreChannelKey } from "@/data/storeChannels";

const REPO_URL = "https://github.com/nrajesh/vaulted.money";
const SPONSORS_URL = "https://github.com/sponsors/nrajesh";

/**
 * Store cards use generic device icons, not the stores' logos: Apple's and
 * Google's badges may only be shown once a listing is live (and link to it).
 */
const STORE_DETAILS: Record<
  StoreChannelKey,
  { icon: LucideIcon; descriptionKey: string; descriptionDefault: string }
> = {
  appStore: {
    icon: Smartphone,
    descriptionKey: "supportPage.stores.appStore",
    descriptionDefault: "iPhone and iPad",
  },
  playStore: {
    icon: Smartphone,
    descriptionKey: "supportPage.stores.playStore",
    descriptionDefault: "Android phones and tablets",
  },
  polar: {
    icon: Monitor,
    descriptionKey: "supportPage.stores.polar",
    descriptionDefault: "Desktop app for Mac, Windows and Linux",
  },
};

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li key={item} className="flex gap-3 text-sm leading-relaxed">
        <Check
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
          aria-hidden="true"
        />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/**
 * "Support the project": why Vaulted Money exists, and the optional ways to
 * support it (pay once in a store when live, GitHub Sponsors, or free help).
 * Hidden on iOS and Android, where store rules limit links to outside
 * payments.
 */
export default function DonationPage() {
  const { t } = useTranslation();

  const whyPoints = [
    t("supportPage.why.affordable", {
      defaultValue:
        "Knowing what you earn, spend and have left shouldn't need a subscription. It's addition, subtraction and honest record-keeping.",
    }),
    t("supportPage.why.onDevice", {
      defaultValue:
        "Your money stays on your device. There's no Vaulted Money account and no server to send it to.",
    }),
    t("supportPage.why.noTracking", {
      defaultValue: "No ads, no tracking and no selling your data.",
    }),
    t("supportPage.why.offline", {
      defaultValue:
        "Works fully offline. AI is optional, off by default, and uses your own key.",
    }),
    t("supportPage.why.openSource", {
      defaultValue:
        "Open source under the MIT licence: anyone can read the code, adapt it or translate it.",
    }),
  ];

  const helpPoints = [
    t("supportPage.help.allFree", {
      defaultValue:
        "Every feature stays free. Paying unlocks nothing extra, and nothing is held back.",
    }),
    t("supportPage.help.payOnce", {
      defaultValue:
        "When Vaulted Money goes live in the stores, you can pay once to support solo development. Same app, no subscription.",
    }),
    t("supportPage.help.private", {
      defaultValue:
        "Paying never links to your money data. There's no account to link it to.",
    }),
    t("supportPage.help.sponsors", {
      defaultValue:
        "Want to help now? GitHub Sponsors takes one-time or monthly support.",
    }),
    t("supportPage.help.freeWays", {
      defaultValue:
        "Can't pay? A GitHub star, a bug report or telling a friend helps too.",
    }),
  ];

  return (
    <div className="page-container">
      <div className="app-page-header">
        <h1 className="app-gradient-title app-page-title">
          {t("supportPage.title", { defaultValue: "Support the project" })}
        </h1>
        <p className="app-page-subtitle">
          {t("supportPage.subtitle", {
            defaultValue:
              "Vaulted Money is free, open source and private. Supporting it is optional.",
          })}
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck
                className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
              {t("supportPage.why.title", {
                defaultValue: "Why Vaulted Money exists",
              })}
            </ThemedCardTitle>
          </ThemedCardHeader>
          <ThemedCardContent className="pt-5">
            <BulletList items={whyPoints} />
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle className="flex items-center gap-2 text-xl">
              <Heart
                className="h-5 w-5 shrink-0 text-pink-600 dark:text-pink-400"
                aria-hidden="true"
              />
              {t("supportPage.help.title", {
                defaultValue: "Supporting it is optional",
              })}
            </ThemedCardTitle>
          </ThemedCardHeader>
          <ThemedCardContent className="space-y-6 pt-5">
            <BulletList items={helpPoints} />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="h-auto min-h-11 gap-2 whitespace-normal bg-pink-700 text-white hover:bg-pink-800 dark:bg-pink-600 dark:hover:bg-pink-700"
              >
                <a
                  href={SPONSORS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("supportPage.help.sponsorButton", {
                    defaultValue: "Sponsor on GitHub",
                  })}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto min-h-11 gap-2 whitespace-normal"
              >
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("supportPage.help.starButton", {
                    defaultValue: "Star on GitHub",
                  })}
                </a>
              </Button>
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      <section className="space-y-4" aria-labelledby="support-stores-title">
        <div>
          <h2
            id="support-stores-title"
            className="text-lg font-semibold text-foreground"
          >
            {t("supportPage.stores.title", {
              defaultValue: "Pay once in a store",
            })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("supportPage.stores.note", {
              defaultValue: "Links appear here once each listing is live.",
            })}
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {storeChannels.map((channel) => {
            const details = STORE_DETAILS[channel.key];
            const Icon = details.icon;
            const isLive = channel.active && channel.url;
            return (
              <li key={channel.key}>
                <ThemedCard className="h-full">
                  <ThemedCardContent className="flex h-full flex-col gap-3 pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <Icon
                        className="h-6 w-6 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {!isLive && (
                        <Badge variant="secondary">
                          {t("supportPage.stores.comingSoon", {
                            defaultValue: "Coming soon",
                          })}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {channel.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(details.descriptionKey, {
                          defaultValue: details.descriptionDefault,
                        })}
                      </p>
                    </div>
                    {isLive && (
                      <Button
                        asChild
                        className="mt-auto h-auto min-h-11 whitespace-normal"
                      >
                        <a
                          href={channel.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("supportPage.stores.getIt", {
                            store: channel.label,
                            defaultValue: "Get it on {{store}}",
                          })}
                        </a>
                      </Button>
                    )}
                  </ThemedCardContent>
                </ThemedCard>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

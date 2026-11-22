import type { LucideIcon } from "lucide-react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { storeChannels, type StoreChannelKey } from "@/data/storeChannels";
import { cn } from "@/lib/utils";

/**
 * "Get Vaulted Money" section for the website homepage: one card per place
 * the paid app is sold. A card is a link only once its listing is live
 * (`active` and `url` in `storeChannels`); until then it is a dashed,
 * non-clickable "Coming soon" card.
 *
 * Generic device icons, not the stores' logos: Apple's and Google's badges
 * may only be shown once a listing is live (and link to it). When a phone
 * listing goes live, replace its icon with the store's official badge.
 */
const CHANNEL_DETAILS: Record<
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
    descriptionDefault: "Mac, Windows and Linux",
  },
};

export default function HomeStoreLinks() {
  const { t } = useTranslation();
  return (
    <section
      id="get"
      className="border-b border-slate-200 px-4 py-10 dark:border-border sm:py-12"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="app-gradient-title text-2xl font-semibold mb-2">
          {t("home.stores.heading", { defaultValue: "Get Vaulted Money" })}
        </h2>
        <p className="mb-6 max-w-3xl text-slate-600 dark:text-slate-300">
          {t("home.stores.descBefore", {
            defaultValue:
              "The desktop app is on sale now. The phone apps are coming soon. The same app is free on",
          })}{" "}
          <a
            href="https://github.com/nrajesh/vaulted.money"
            className="underline"
          >
            GitHub
          </a>
          {t("home.stores.descAfter", {
            defaultValue:
              ". Buying through a store supports continued development.",
          })}
        </p>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {storeChannels.map((channel) => {
            const details = CHANNEL_DETAILS[channel.key];
            const Icon = details.icon;
            const isActive = Boolean(channel.active && channel.url);
            const body = (
              <>
                <Icon className="h-7 w-7 shrink-0" aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="break-words text-base font-semibold">
                    {channel.label}
                  </span>
                  <span className="break-words text-sm">
                    {t(details.descriptionKey, {
                      defaultValue: details.descriptionDefault,
                    })}
                  </span>
                  <span className="mt-1 text-sm font-semibold">
                    {isActive
                      ? t("home.stores.desktopPrice", {
                          defaultValue: "€9.99 one-time",
                        })
                      : t("home.stores.comingSoon", {
                          defaultValue: "Coming Soon",
                        })}
                  </span>
                </span>
                {isActive && (
                  <ExternalLink
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </>
            );
            const cardClass =
              "flex h-full items-center gap-4 rounded-xl border px-5 py-4";
            return (
              <li key={channel.key}>
                {isActive ? (
                  <a
                    href={channel.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      cardClass,
                      "border-slate-900 bg-slate-900 text-white transition-colors hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
                    )}
                  >
                    {body}
                  </a>
                ) : (
                  <div
                    aria-disabled="true"
                    className={cn(
                      cardClass,
                      "border-dashed border-slate-500 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

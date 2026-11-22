import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Apple, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { DESKTOP_CHECKOUT_URL } from "@/utils/feedbackLinks";

/**
 * "Get the app" row for the website homepage: one button per place the paid
 * app is sold. The phone stores say "Coming soon" until their listings go
 * live; the desktop app is on sale through Polar. Website only: the iOS and
 * Android builds compile the homepage out.
 */
const pendingClasses =
  "flex min-w-[10.5rem] items-center gap-3 rounded-lg border border-dashed border-slate-500 px-4 py-2.5 text-slate-600 dark:border-slate-500 dark:text-slate-300";

function PendingStore({
  icon,
  name,
  comingSoon,
}: {
  icon: ReactNode;
  name: string;
  comingSoon: string;
}) {
  return (
    <span aria-disabled="true" className={pendingClasses}>
      {icon}
      <span className="flex flex-col leading-tight">
        <span className="text-xs">{comingSoon}</span>
        <span className="break-words text-base font-semibold">{name}</span>
      </span>
    </span>
  );
}

export function StoreButtons() {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {t("home.stores.heading", { defaultValue: "Get the app" })}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <PendingStore
          icon={<Apple className="h-6 w-6 shrink-0" aria-hidden="true" />}
          name={t("home.stores.appStore", { defaultValue: "App Store" })}
          comingSoon={t("home.stores.comingSoon", {
            defaultValue: "Coming soon",
          })}
        />
        <PendingStore
          icon={<Smartphone className="h-6 w-6 shrink-0" aria-hidden="true" />}
          name={t("home.stores.googlePlay", { defaultValue: "Google Play" })}
          comingSoon={t("home.stores.comingSoon", {
            defaultValue: "Coming soon",
          })}
        />
        <a
          href={DESKTOP_CHECKOUT_URL}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-[10.5rem] items-center gap-3 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-white transition-colors hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Monitor className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="flex flex-col leading-tight">
            <span className="text-xs">
              {t("home.stores.desktopPrice", {
                defaultValue: "€9.99 one-time",
              })}
            </span>
            <span className="break-words text-base font-semibold">
              {t("home.stores.desktop", { defaultValue: "Desktop" })}
            </span>
          </span>
          <ExternalLink
            className="ml-auto h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        </a>
      </div>
    </div>
  );
}

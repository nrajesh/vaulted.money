import { useTranslation } from "react-i18next";
import { storeChannels } from "@/data/storeChannels";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { cn } from "@/lib/utils";

export default function HomeStoreLinks() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="app-gradient-title text-2xl font-semibold mb-2">
        {t("home.stores.heading", { defaultValue: "Get Vaulted Money" })}
      </h2>
      <p className="text-muted-foreground mb-6">
        {t("home.stores.descBefore", {
          defaultValue:
            "Coming soon to your favorite store. The same app is free on",
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {storeChannels.map((channel) => {
          const isActive = channel.active && channel.url;
          const cardClass = cn(
            "transition",
            isActive ? "hover:shadow-md" : "opacity-60",
          );
          const Inner = (
            <ThemedCard className={cardClass}>
              <ThemedCardHeader>
                <ThemedCardTitle className="text-sm font-medium">
                  {channel.label}
                </ThemedCardTitle>
              </ThemedCardHeader>
              <ThemedCardContent>
                {isActive ? (
                  <span className="text-xs text-primary">
                    {t("home.stores.openStore", {
                      defaultValue: "Open store →",
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("home.stores.comingSoon", {
                      defaultValue: "Coming Soon",
                    })}
                  </span>
                )}
              </ThemedCardContent>
            </ThemedCard>
          );
          if (isActive) {
            return (
              <a
                key={channel.key}
                href={channel.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {Inner}
              </a>
            );
          }
          return <div key={channel.key}>{Inner}</div>;
        })}
      </div>
    </section>
  );
}

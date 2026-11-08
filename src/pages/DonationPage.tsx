import { ArrowRight, Heart, Smartphone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Badge } from "@/components/ui/badge";
import { storeChannels } from "@/data/storeChannels";

export default function DonationPage() {
  return (
    <div className="flex-1 space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">Donate</h1>
          <p className="app-page-subtitle">
            Vaulted Money is free and open-source. If you find it useful,
            consider supporting development through a store purchase or direct
            contribution.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12 items-start">
        {/* Github Sponsors */}
        <ThemedCard className="tour-donate-github border-pink-200 bg-pink-50/50 dark:border-pink-900/50 dark:bg-pink-950/20 h-full">
          <ThemedCardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-100 hover:text-pink-700"
              >
                Monthly Support
              </Badge>
            </div>
            <ThemedCardTitle className="flex items-center gap-3 text-2xl text-pink-900 dark:text-pink-100">
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
              Github Sponsors
            </ThemedCardTitle>
            <ThemedCardDescription>
              Become a sponsor on Github to support my open source work
              continuously.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent className="space-y-4">
            <p className="text-muted-foreground">
              Github Sponsors is the best way to support ongoing development.
              You can choose a one-time or monthly tier.
            </p>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                Special badge on your Github profile
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                Priority support for issues
              </li>
            </ul>
            <div className="pt-4">
              <Button
                size="lg"
                className="w-full gap-2 group bg-pink-600 hover:bg-pink-700 text-white border-none"
                asChild
              >
                <a
                  href="https://github.com/sponsors/nrajesh"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sponsor on Github
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        {/* Direct Donation (QR Codes) */}
        <ThemedCard className="tour-donate-direct border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 h-full">
          <ThemedCardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 hover:text-emerald-700"
              >
                Direct Contribution
              </Badge>
            </div>
            <ThemedCardTitle className="flex items-center gap-3 text-2xl text-emerald-900 dark:text-emerald-100">
              <Smartphone className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
              Scan to Pay
            </ThemedCardTitle>
            <ThemedCardDescription>
              Directly support via Bank Transfer or PayPal using the QR code
              below.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent className="flex flex-col items-center space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
              <div className="flex flex-col items-center gap-3">
                <span className="font-semibold text-lg text-emerald-800 dark:text-emerald-200">
                  Revolut
                </span>
                <a
                  href="https://checkout.revolut.com/pay/f98ac0fd-41f3-4a09-9a61-7ab6c70717f3"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Revolut checkout"
                  className="block"
                >
                  <div className="relative group flex h-48 w-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                      src="/assets/qrcode_revolut.jpg"
                      alt="Revolut QR Code"
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </a>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="font-semibold text-lg text-emerald-800 dark:text-emerald-200">
                  PayPal
                </span>
                <a
                  href="https://www.paypal.com/donate/?hosted_button_id=4AFPCKPWTGFUU"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open PayPal donation link"
                  className="block"
                >
                  <div className="relative group flex h-48 w-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                      src="/assets/qrcode_paypal.jpg"
                      alt="PayPal QR Code"
                      className="h-40 w-40 object-contain [image-rendering:pixelated] transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </a>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground max-w-xs mt-4">
              Scan with your banking app or PayPal to send a donation directly.
            </p>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Store Channels */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Buy on a Store
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Buying through a store is the easiest way to support development. The
          same app is free on{" "}
          <a
            href="https://github.com/nrajesh/vaulted.money"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            GitHub
          </a>{" "}
          for those who want to build it themselves.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storeChannels
            .filter((ch) => ch.key !== "polarSh")
            .map((channel) => {
              const isActive = channel.active && channel.url;
              return (
                <ThemedCard
                  key={channel.key}
                  className={
                    isActive
                      ? "border-blue-200 dark:border-blue-900/50"
                      : "opacity-70"
                  }
                >
                  <ThemedCardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={
                          isActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
                        }
                      >
                        {isActive ? "Available" : "Coming Soon"}
                      </Badge>
                    </div>
                    <ThemedCardTitle className="flex items-center gap-3 text-xl">
                      <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      {channel.label}
                    </ThemedCardTitle>
                    <ThemedCardDescription>
                      €9.99 one-time — supports continued development
                    </ThemedCardDescription>
                  </ThemedCardHeader>
                  <ThemedCardContent>
                    {isActive ? (
                      <Button size="lg" className="w-full gap-2 group" asChild>
                        <a
                          href={channel.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get on {channel.label}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        This channel will be available soon.
                      </p>
                    )}
                  </ThemedCardContent>
                </ThemedCard>
              );
            })}
        </div>
      </div>
    </div>
  );
}

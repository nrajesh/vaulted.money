import { useRef, useState } from "react";
import { Clock, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import aiDemoVideo from "../../../marketing/search-demo/final/vaulted-money-ai.mp4";
import aiDemoPoster from "@/assets/ai-demo-poster.jpg";
import agentDemoVideo from "../../../marketing/search-demo/final/vaulted-money-agent.mp4";
import agentDemoPoster from "@/assets/agent-demo-poster.jpg";
import apiDemoVideo from "../../../marketing/search-demo/final/vaulted-money-api.mp4";
import apiDemoPoster from "@/assets/api-demo-poster.jpg";
import syncDemoVideo from "../../../marketing/search-demo/final/vaulted-money-sync.mp4";
import syncDemoPoster from "@/assets/sync-demo-poster.jpg";
import { DEMO_VIDEO_ATTRIBUTE, pauseOtherDemoVideos } from "@/utils/demoVideos";

interface DemoCard {
  id: string;
  title: string;
  body: string;
  /** Left out until the video exists; the card then says "Coming soon". */
  video?: string;
  poster?: string;
}

/**
 * A row of demo videos under the hero, one card per selling point, so all of
 * them are in view at once (no carousel). A card is only its poster until
 * someone presses play: the video file is not fetched before that
 * (`preload="none"`). On a phone the row scrolls sideways.
 *
 * To add a video: import the MP4 from `marketing/search-demo/final/` and a
 * poster from `@/assets/`, then set `video` and `poster` on its card below.
 */
const HomeDemoCards = () => {
  const { t } = useTranslation();
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  // Cards whose play button was pressed; they show the browser's controls.
  const [started, setStarted] = useState<Record<string, boolean>>({});

  const cards: DemoCard[] = [
    {
      id: "ai",
      title: t("home.demos.ai.title", { defaultValue: "AI, Your Call" }),
      body: t("home.demos.ai.body", {
        defaultValue: "AI stays off until you switch it on.",
      }),
      video: aiDemoVideo,
      poster: aiDemoPoster,
    },
    {
      // The translation keys keep their first name ("claude"); the card is
      // about any AI agent, shown with a model running on the computer.
      id: "claude",
      title: t("home.demos.claude.title", {
        defaultValue: "AI agent - Meet Ledger",
      }),
      body: t("home.demos.claude.body", {
        defaultValue:
          "A local LLM helps in importing years of transactions. One of many possibilities with AI.",
      }),
      video: agentDemoVideo,
      poster: agentDemoPoster,
    },
    {
      id: "api",
      title: t("home.demos.api.title", {
        defaultValue: "Your Ledger, Scriptable",
      }),
      body: t("home.demos.api.body", {
        defaultValue: "A documented API on your own computer.",
      }),
      video: apiDemoVideo,
      poster: apiDemoPoster,
    },
    {
      id: "sync",
      title: t("home.demos.sync.title", {
        defaultValue: "One Ledger, Two Devices",
      }),
      body: t("home.demos.sync.body", {
        defaultValue: "Carry a ledger through a folder you choose.",
      }),
      video: syncDemoVideo,
      poster: syncDemoPoster,
    },
  ];

  const play = (id: string) => {
    setStarted((previous) => ({ ...previous, [id]: true }));
    void videoRefs.current[id]?.play().catch(() => undefined);
  };

  return (
    <section
      id="demos"
      className="scroll-mt-24 border-b border-slate-200 px-4 py-8 dark:border-border sm:scroll-mt-28 sm:py-10"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold tracking-normal text-[hsl(var(--brand-accent-text))] sm:text-3xl dark:text-[hsl(var(--brand-accent-soft))]">
          {t("home.demos.title", { defaultValue: "See it in action" })}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("home.demos.intro", {
            defaultValue:
              "Short videos of the real app. Nothing loads until you press play.",
          })}
        </p>

        <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {cards.map((card) => (
            <li
              key={card.id}
              className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto"
            >
              <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950 shadow-md shadow-slate-950/10 dark:border-slate-600 dark:shadow-black/30">
                {card.video ? (
                  <>
                    <video
                      ref={(element) => {
                        videoRefs.current[card.id] = element;
                      }}
                      {...{ [DEMO_VIDEO_ATTRIBUTE]: "" }}
                      className="aspect-video w-full bg-slate-950 object-cover"
                      src={card.video}
                      poster={card.poster}
                      aria-label={card.title}
                      preload="none"
                      playsInline
                      controls={Boolean(started[card.id])}
                      onPlay={(event) =>
                        pauseOtherDemoVideos(event.currentTarget)
                      }
                    />
                    {!started[card.id] && (
                      <button
                        type="button"
                        onClick={() => play(card.id)}
                        aria-label={t("home.demos.play", {
                          title: card.title,
                          defaultValue: "Play video: {{title}}",
                        })}
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/35 transition-colors hover:bg-slate-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-slate-950/80 text-white shadow-lg">
                          <Play className="ml-0.5 h-6 w-6" aria-hidden />
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_40%_30%,#1b2c4a_0%,#0a1020_75%)] text-slate-200">
                    <Clock className="h-6 w-6" aria-hidden />
                    <span className="rounded-md border border-slate-400/60 px-2.5 py-1 text-xs font-semibold">
                      {t("home.demos.comingSoon", {
                        defaultValue: "Coming soon",
                      })}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                {card.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {card.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeDemoCards;

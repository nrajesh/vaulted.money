import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Maximize,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  Archive,
  BookOpen,
  Coins,
  GitFork,
  HardDrive,
  Lock,
  Receipt,
  Shield,
  Upload,
  Users,
  Wallet,
} from "lucide-react-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { GITHUB_REPO_URL } from "@/utils/feedbackLinks";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import SiteFooter from "@/components/SiteFooter";
import BrandLockup from "@/components/BrandLockup";
import HomeDemoCards from "@/components/homepage/HomeDemoCards";
import { DEMO_VIDEO_ATTRIBUTE, pauseOtherDemoVideos } from "@/utils/demoVideos";
import searchDemoVideo from "../../marketing/search-demo/final/vaulted-money-search.mp4";
import searchDemoPoster from "@/assets/search-demo-poster.svg";

const webInstallCommand = `git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm dev`;

const desktopInstallCommand = `git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm run electron:dev`;

const androidInstallCommand = `git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm run android:build:apk`;

const iosInstallCommand = `git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm run ios:build:simulator`;

const HomePage = () => {
  const { t } = useTranslation();
  const { setTheme, resolvedTheme } = useTheme();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const demoVideoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateMotionPreference = () => {
      setPrefersReducedMotion(motionPreference.matches);
      if (motionPreference.matches) {
        demoVideoRef.current?.pause();
      } else {
        void demoVideoRef.current?.play().catch(() => undefined);
      }
    };

    motionPreference.addEventListener("change", updateMotionPreference);
    return () =>
      motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  const openDemoFullscreen = async () => {
    const video = demoVideoRef.current;
    if (!video) return;

    const webkitVideo = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };

    try {
      if (video.requestFullscreen) {
        await video.requestFullscreen();
      } else {
        webkitVideo.webkitEnterFullscreen?.();
      }
    } catch {
      webkitVideo.webkitEnterFullscreen?.();
    }
  };

  // ── Translated data arrays (re-derived whenever language changes) ──────────

  const trustPillars = [
    {
      icon: Shield,
      title: t("home.trust.privacy.title", { defaultValue: "Privacy-first" }),
      description: t("home.trust.privacy.description", {
        defaultValue:
          "No account required. Your financial records stay in your browser or desktop app unless you export them.",
      }),
      previewTitle: t("home.trust.privacy.previewTitle", {
        defaultValue: "Local-only ledger",
      }),
      previewMeta: t("home.trust.privacy.previewMeta", {
        defaultValue: "Browser storage",
      }),
      previewStat: t("home.trust.privacy.previewStat", {
        defaultValue: "0 accounts",
      }),
      previewDetail: t("home.trust.privacy.previewDetail", {
        defaultValue: "required online",
      }),
    },
    {
      icon: HardDrive,
      title: t("home.trust.dataLocal.title", { defaultValue: "Data-local" }),
      description: t("home.trust.dataLocal.description", {
        defaultValue:
          "Vaulted Money is built around local ledgers, IndexedDB, and optional file backups instead of a hosted database.",
      }),
      previewTitle: t("home.trust.dataLocal.previewTitle", {
        defaultValue: "Backup vault",
      }),
      previewMeta: t("home.trust.dataLocal.previewMeta", {
        defaultValue: "Encrypted JSON",
      }),
      previewStat: t("home.trust.dataLocal.previewStat", {
        defaultValue: "Auto",
      }),
      previewDetail: t("home.trust.dataLocal.previewDetail", {
        defaultValue: "backup rhythm",
      }),
    },
    {
      icon: GitFork,
      title: t("home.trust.openSource.title", { defaultValue: "Open-sourced" }),
      description: t("home.trust.openSource.description", {
        defaultValue: "Active development. Public code and roadmap on GitHub.",
      }),
      previewTitle: t("home.trust.openSource.previewTitle", {
        defaultValue: "Auditable source",
      }),
      previewMeta: t("home.trust.openSource.previewMeta", {
        defaultValue: "MIT project",
      }),
      previewStat: t("home.trust.openSource.previewStat", {
        defaultValue: "Public",
      }),
      previewDetail: t("home.trust.openSource.previewDetail", {
        defaultValue: "roadmap and code",
      }),
    },
  ];

  const moneyTools = [
    {
      icon: BookOpen,
      label: t("home.tools.multiLedger", {
        defaultValue: "Multi-ledger tracking",
      }),
    },
    {
      icon: Coins,
      label: t("home.tools.multiCurrency", {
        defaultValue: "Multi-currency balances",
      }),
    },
    {
      icon: Users,
      label: t("home.tools.accountScopes", {
        defaultValue: "Account scopes for different people",
      }),
    },
    {
      icon: Receipt,
      label: t("home.tools.csvImports", {
        defaultValue: "CSV transaction imports",
      }),
    },
    {
      icon: Wallet,
      label: t("home.tools.accountsVendors", {
        defaultValue: "Accounts, payees, categories",
      }),
    },
    {
      icon: Lock,
      label: t("home.tools.encryptedBackup", {
        defaultValue: "Encrypted backup options",
      }),
    },
  ];

  const usageFundamentals = [
    {
      icon: Upload,
      title: t("home.usage.csv.title", {
        defaultValue: "Bring your history with CSV",
      }),
      description: t("home.usage.csv.description", {
        defaultValue:
          "Start with a ledger, then import bank exports from the Transactions screen. Mapping columns once makes future imports faster.",
      }),
    },
    {
      icon: Archive,
      title: t("home.usage.backup.title", {
        defaultValue: "Keep a backup",
      }),
      description: t("home.usage.backup.description", {
        defaultValue:
          "Browser data can be cleared. Export a backup, or enable automatic backups where supported.",
      }),
    },
    {
      icon: Sparkles,
      title: t("home.usage.ai.title", {
        defaultValue: "AI, when you choose",
      }),
      description: t("home.usage.ai.description", {
        defaultValue:
          "AI features are optional. Use them on your terms; connect an agent from desktop.",
      }),
    },
  ];

  const commands = [
    {
      id: "web",
      label: t("home.commands.web.label", { defaultValue: "Web" }),
      title: t("home.commands.web.title", { defaultValue: "Run the web app" }),
      detail: t("home.commands.web.detail", {
        defaultValue: "Best for trying Vaulted Money in a browser.",
      }),
      prereq: "",
      command: webInstallCommand,
    },
    {
      id: "desktop",
      label: t("home.commands.desktop.label", { defaultValue: "Desktop" }),
      title: t("home.commands.desktop.title", {
        defaultValue: "Run the desktop app",
      }),
      detail: t("home.commands.desktop.detail", {
        defaultValue:
          "Best for a local app window with desktop backup support.",
      }),
      prereq: "",
      command: desktopInstallCommand,
    },
    {
      id: "android",
      label: t("home.commands.android.label", { defaultValue: "Android" }),
      title: t("home.commands.android.title", {
        defaultValue: "Build the Android app",
      }),
      detail: t("home.commands.android.detail", {
        defaultValue:
          "Produces a debug APK you can install on any Android device.",
      }),
      prereq: t("home.commands.android.prereq", {
        defaultValue: "Requires Android Studio and Java SDK on your machine.",
      }),
      command: androidInstallCommand,
    },
    {
      id: "ios",
      label: t("home.commands.ios.label", { defaultValue: "iOS" }),
      title: t("home.commands.ios.title", {
        defaultValue: "Build the iOS app",
      }),
      detail: t("home.commands.ios.detail", {
        defaultValue: "Builds for the iOS Simulator (macOS only).",
      }),
      prereq: t("home.commands.ios.prereq", {
        defaultValue:
          "Requires Xcode and macOS. Not available on Windows or Linux.",
      }),
      command: iosInstallCommand,
    },
  ];

  const roadmapMilestones = [
    {
      window: t("home.milestones.recent", { defaultValue: "Recent release" }),
      title: t("home.milestones.search.title", {
        defaultValue: "Natural-language search",
      }),
      summary: t("home.milestones.search.summary", {
        defaultValue:
          "Dates, amounts, typos, largest and smallest. Search and API share one interpreter. Pick suggestions one at a time.",
      }),
      label: t("home.nav.search", { defaultValue: "Search" }),
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "blue",
    },
    {
      window: t("home.milestones.recent", { defaultValue: "Recent release" }),
      title: t("home.milestones.aiHub.title", {
        defaultValue: "AI hub and MCP agent connections",
      }),
      summary: t("home.milestones.aiHub.summary", {
        defaultValue:
          "One switch controls AI features. Connect Claude Code, Claude Desktop, or Codex through MCP on desktop.",
      }),
      label: t("home.milestones.agentLabel", {
        defaultValue: "AI & agents",
      }),
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "violet",
    },
    {
      window: t("home.milestones.localApi.window", {
        defaultValue: "October 2026",
      }),
      title: t("home.milestones.localApi.title", {
        defaultValue: "Local API for the desktop app",
      }),
      summary: t("home.milestones.localApiDetails", {
        defaultValue:
          "The desktop Local API includes an OpenAPI description and a ready-made Postman collection.",
      }),
      label: t("home.commands.desktop.label", { defaultValue: "Desktop" }),
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "emerald",
    },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const copyCommand = async (id: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(id);
      showSuccess(
        t("home.commands.copied", { defaultValue: "Install command copied." }),
      );
      window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      setCopiedCommand(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background pt-16 text-foreground sm:pt-24">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 px-3 shadow-sm backdrop-blur dark:border-border/80 dark:bg-slate-950/90 sm:px-4">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center"
            aria-label="Vaulted Money home"
          >
            <BrandLockup size="header" />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 text-sm shadow-sm dark:border-border dark:bg-slate-900/70 lg:flex">
            <a
              href="#search"
              className="rounded-full px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-sky-950/60 dark:hover:text-sky-200"
            >
              {t("home.nav.search", { defaultValue: "Search" })}
            </a>
            <a
              href="#differences"
              className="rounded-full px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-950/60 dark:hover:text-violet-200"
            >
              {t("home.nav.differences", { defaultValue: "How it differs" })}
            </a>
            <a
              href="#trust"
              className="rounded-full px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
            >
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </a>
            <a
              href="#workflow"
              className="rounded-full px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-sky-950/60 dark:hover:text-sky-200"
            >
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </a>
            <a
              href="#roadmap"
              className="rounded-full px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-200"
            >
              {t("home.nav.roadmap", { defaultValue: "Roadmap" })}
            </a>
            <a
              href="#install"
              className="rounded-full px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-800 dark:text-slate-300 dark:hover:bg-amber-950/60 dark:hover:text-amber-200"
            >
              {t("home.nav.install", { defaultValue: "Install" })}
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-slate-500 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-500 dark:bg-slate-900/80 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label={t("layout.toggleTheme", {
                defaultValue: "Toggle theme",
              })}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </Button>
            <Button asChild className="hidden h-10 rounded-md sm:inline-flex">
              <Link to="/ledgers?demo=1">
                {t("home.hero.tryDemo", {
                  defaultValue: "Try it with demo data",
                })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-slate-500 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-500 dark:bg-slate-900/80 dark:hover:bg-slate-800 lg:hidden"
                  aria-label={t("home.nav.menu", { defaultValue: "Menu" })}
                >
                  <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                srTitle={t("home.nav.menu", { defaultValue: "Menu" })}
                className="flex w-[17rem] flex-col gap-0 border-l border-slate-200/60 bg-white/95 px-0 pt-12 backdrop-blur-xl dark:border-border/60 dark:bg-slate-950/95"
              >
                <div className="px-5 pb-4">
                  <p className="text-lg font-bold tracking-normal text-[hsl(var(--brand-accent-text))] dark:text-[hsl(var(--brand-accent-soft))]">
                    Vaulted Money
                  </p>
                </div>
                <nav className="flex flex-col gap-0.5 border-t border-slate-200/60 px-3 pt-3 dark:border-border/60">
                  {[
                    {
                      href: "#search",
                      label: t("home.nav.search", {
                        defaultValue: "Search",
                      }),
                    },
                    {
                      href: "#differences",
                      label: t("home.nav.differences", {
                        defaultValue: "How it differs",
                      }),
                    },
                    {
                      href: "#trust",
                      label: t("home.nav.trust", { defaultValue: "Trust" }),
                    },
                    {
                      href: "#workflow",
                      label: t("home.nav.workflow", {
                        defaultValue: "Workflow",
                      }),
                    },
                    {
                      href: "#roadmap",
                      label: t("home.nav.roadmap", { defaultValue: "Roadmap" }),
                    },
                    {
                      href: "#install",
                      label: t("home.nav.install", { defaultValue: "Install" }),
                    },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className="rounded-lg px-4 py-3 text-[0.95rem] font-semibold text-slate-700 transition-colors hover:bg-[hsl(var(--brand-accent)/0.1)] hover:text-[hsl(var(--brand-accent-strong))] dark:text-slate-200 dark:hover:bg-[hsl(var(--brand-accent)/0.12)] dark:hover:text-[hsl(var(--brand-accent-soft))]"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                <div className="mt-auto border-t border-slate-200/60 px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 dark:border-border/60">
                  <Button
                    asChild
                    className="h-11 w-full rounded-lg bg-[hsl(var(--brand-accent))] text-[0.95rem] font-semibold text-white hover:bg-[hsl(var(--brand-accent-strong))]"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Link to="/ledgers?demo=1">
                      {t("home.hero.tryDemo", {
                        defaultValue: "Try it with demo data",
                      })}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,hsl(var(--background)),rgba(248,250,252,0.72))] px-4 pt-6 pb-2 dark:border-border dark:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.45))] sm:py-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl items-center gap-7 sm:gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]">
          <div className="max-w-2xl">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200">
                {t("home.badges.private", { defaultValue: "Privacy-first" })}
              </span>
              <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 dark:border-sky-700/60 dark:bg-sky-950/50 dark:text-sky-200">
                {t("home.badges.local", { defaultValue: "Data-local" })}
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200">
                {t("home.badges.open", { defaultValue: "Open-sourced" })}
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-[hsl(var(--brand-accent-text))] sm:text-5xl dark:text-[hsl(var(--brand-accent-soft))] lg:text-6xl">
              {t("home.hero.headline", {
                defaultValue: "Ask your ledger. Keep control.",
              })}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700 dark:text-slate-200 sm:text-xl">
              {t("home.hero.positioning", {
                defaultValue:
                  "Private, local-first money tracking. No account. Open source. Plain-English search needs no AI or cloud.",
              })}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-md px-5">
                <Link to="/ledgers?demo=1">
                  {t("home.hero.tryDemo", {
                    defaultValue: "Try it with demo data",
                  })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-md border-slate-500 px-5 dark:border-slate-500"
              >
                <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                  <GitFork className="h-4 w-4" />
                  {t("home.actions.github", { defaultValue: "View source" })}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="group relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950 shadow-xl shadow-slate-950/10 dark:border-slate-600 dark:shadow-black/30">
              <video
                ref={demoVideoRef}
                {...{ [DEMO_VIDEO_ATTRIBUTE]: "" }}
                onPlay={(event) => pauseOtherDemoVideos(event.currentTarget)}
                className="aspect-video w-full bg-slate-950 object-cover"
                src={searchDemoVideo}
                poster={searchDemoPoster}
                aria-label={t("home.hero.videoLabel", {
                  defaultValue: "Natural-language search demo video",
                })}
                autoPlay={!prefersReducedMotion}
                loop={!prefersReducedMotion}
                muted
                playsInline
                controls
                preload={prefersReducedMotion ? "none" : "metadata"}
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent" />
              <div className="absolute inset-x-0 bottom-14 z-10 flex items-center justify-between gap-2 px-3 sm:px-4">
                <span className="pointer-events-none min-w-0 text-2xl font-black leading-none tracking-tight text-white drop-shadow sm:text-3xl">
                  {t("home.hero.videoTitle", {
                    defaultValue: "Ask. Don’t Search.",
                  })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="pointer-events-auto h-8 shrink-0 border-white/50 bg-slate-950/75 px-2.5 text-xs font-semibold text-white shadow-sm hover:bg-white hover:text-slate-950 sm:px-3 sm:text-sm"
                  onClick={() => void openDemoFullscreen()}
                  aria-label={t("home.hero.videoFullscreen", {
                    defaultValue: "Go full screen",
                  })}
                >
                  <Maximize className="h-3.5 w-3.5" />
                  {t("home.hero.videoFullscreen", {
                    defaultValue: "Full screen",
                  })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo videos, one card per selling point ─────────────────────── */}
      <HomeDemoCards />

      {/* ── Search examples ──────────────────────────────────────────────── */}
      <section
        id="search"
        className="scroll-mt-24 border-b border-slate-200 bg-slate-50 px-4 py-10 dark:border-border dark:bg-slate-900/55 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-[hsl(var(--brand-accent-text))] sm:text-4xl dark:text-[hsl(var(--brand-accent-soft))]">
              {t("home.search.title", {
                defaultValue: "Search in plain English",
              })}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {t("home.search.intro", {
                defaultValue:
                  "It understands dates, amounts, and typos. Pick suggestions one by one; the row above always shows applied filters or ‘No filters applied’.",
              })}
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("home.search.languageLabel", {
                defaultValue: "Search in English",
              })}
            </p>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-300 bg-white px-4 dark:divide-slate-700 dark:border-slate-600 dark:bg-slate-950">
              {[
                t("home.search.example1", {
                  defaultValue: "expenses over 20 last month in groceries",
                }),
                t("home.search.example2", {
                  defaultValue: "starbuks since 2020",
                }),
                t("home.search.example3", {
                  defaultValue: "largest expense 2 weeks from today",
                }),
              ].map((query) => (
                <li key={query} className="py-3">
                  <code className="break-words text-sm font-medium text-slate-800 dark:text-slate-100 sm:text-base">
                    {query}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Product differences ──────────────────────────────────────────── */}
      <section
        id="differences"
        className="scroll-mt-24 px-4 py-10 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-3xl font-bold tracking-normal text-[hsl(var(--brand-accent-text))] sm:text-4xl dark:text-[hsl(var(--brand-accent-soft))]">
            {t("home.differences.title", {
              defaultValue: "How it differs",
            })}
          </h2>
          <ul className="divide-y divide-table-rule border-y border-table-rule">
            {[
              {
                icon: Shield,
                title: t("home.differences.privateTitle", {
                  defaultValue: "Private by design",
                }),
                description: t("home.differences.privateDescription", {
                  defaultValue:
                    "No account. Your data stays local unless exported.",
                }),
              },
              {
                icon: Search,
                title: t("home.differences.searchTitle", {
                  defaultValue: "Plain-English search, without AI or cloud",
                }),
                description: t("home.differences.searchDescription", {
                  defaultValue: "The app and API share search logic.",
                }),
              },
              {
                icon: GitFork,
                title: t("home.differences.agentTitle", {
                  defaultValue: "Connect your own AI agent through MCP",
                }),
                description: t("home.differences.agentDescription", {
                  defaultValue: "Desktop app only.",
                }),
              },
              {
                icon: Upload,
                title: t("home.differences.apiTitle", {
                  defaultValue: "Script it through the Local API",
                }),
                description: t("home.differences.apiDescription", {
                  defaultValue: "OpenAPI and Postman. Desktop app only.",
                }),
              },
            ].map((item) => (
              <li
                key={item.title}
                className="flex min-w-0 items-start gap-4 py-4 sm:items-center"
              >
                <item.icon className="icon-brand mt-1 h-5 w-5 shrink-0 sm:mt-0" />
                <div className="min-w-0 sm:flex sm:flex-1 sm:items-center sm:justify-between sm:gap-8">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 sm:min-w-[15rem]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:mt-0 sm:max-w-2xl sm:text-right">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section
        id="trust"
        className="scroll-mt-24 px-4 pt-8 pb-8 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-normal text-[hsl(var(--brand-accent-text))] sm:text-4xl dark:text-[hsl(var(--brand-accent-soft))]">
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trustPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-slate-900"
              >
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-border dark:bg-slate-950/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-slate-900">
                        <pillar.icon className="icon-brand h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {pillar.previewTitle}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pillar.previewMeta}
                        </p>
                      </div>
                    </div>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
                    <p className="text-2xl font-bold tracking-normal">
                      {pillar.previewStat}
                    </p>
                    <p className="pb-1 text-xs text-slate-500 dark:text-slate-400">
                      {pillar.previewDetail}
                    </p>
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[hsl(var(--brand-accent-text))] dark:text-[hsl(var(--brand-accent-soft))]">
                  {pillar.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ──────────────────────────────────────────────────────── */}
      <section
        id="workflow"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 px-4 py-10 dark:border-border dark:bg-slate-900/55 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-[hsl(var(--brand-accent-text))] sm:text-4xl dark:text-[hsl(var(--brand-accent-soft))]">
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </h2>
            <p className="mt-4 text-xl font-medium text-slate-800 dark:text-slate-200">
              {t("home.workflow.title", {
                defaultValue: "Personal, family, or business.",
              })}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              {t("home.workflow.description", {
                defaultValue:
                  "Track spending, set budgets, import CSVs, and back up your data.",
              })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-md">
                <Link to="/ledgers">
                  {t("home.actions.goLedgers", {
                    defaultValue: "Go to /ledgers",
                  })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                  <GitFork className="h-4 w-4" />
                  {t("home.actions.github", { defaultValue: "View source" })}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {moneyTools.map((tool) => (
              <div
                key={tool.label}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-slate-950/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <tool.icon className="icon-brand h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{tool.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap ───────────────────────────────────────────────────────── */}
      <section
        id="roadmap"
        className="scroll-mt-24 border-y border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-10 dark:border-border dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-normal text-[hsl(var(--brand-accent-text))] sm:text-4xl dark:text-[hsl(var(--brand-accent-soft))]">
                {t("home.nav.roadmap", { defaultValue: "Roadmap" })}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                {t("home.roadmap.recentDescription", {
                  defaultValue: "Recent releases. Built in public.",
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-border dark:bg-slate-950/65">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t("home.roadmap.snapshot", { defaultValue: "Snapshot" })}
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                {t("home.roadmap.shippedCount", {
                  count: roadmapMilestones.length,
                  defaultValue: "{{count}} shipped milestones",
                })}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("home.roadmap.shippedSummary", {
                  defaultValue:
                    "Recent additions include local natural-language search, MCP agent connections, and the desktop Local API.",
                })}
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-[1.1rem] top-0 bottom-0 hidden w-px bg-slate-200 dark:bg-table-rule sm:block" />
              <div className="space-y-4">
                {roadmapMilestones.map((item) => (
                  <article
                    key={`${item.window}-${item.title}`}
                    className="relative sm:pl-12"
                  >
                    <div
                      className={cn(
                        "absolute left-0 top-6 hidden h-9 w-9 items-center justify-center rounded-full border-4 border-white shadow-sm dark:border-slate-950 sm:flex",
                        item.accent === "emerald" &&
                          "bg-emerald-500 shadow-emerald-500/25",
                        item.accent === "blue" &&
                          "bg-blue-500 shadow-blue-500/25",
                        item.accent === "orange" &&
                          "bg-orange-500 shadow-orange-500/25",
                        item.accent === "red" && "bg-red-500 shadow-red-500/25",
                        item.accent === "violet" &&
                          "bg-violet-500 shadow-violet-500/25",
                      )}
                    />
                    <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-border dark:bg-slate-950/70">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {item.window}
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">
                            {item.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              item.accent === "red" &&
                                "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-200",
                              item.accent === "orange" &&
                                "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
                              item.accent === "blue" &&
                                "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200",
                              item.accent === "emerald" &&
                                "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
                              item.accent === "violet" &&
                                "bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
                            )}
                          >
                            {item.status}
                          </span>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            {item.label}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.summary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Install ───────────────────────────────────────────────────────── */}
      <section
        id="install"
        className="scroll-mt-24 border-t border-slate-200 bg-slate-950 px-4 py-10 text-slate-50 dark:border-border sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-normal text-slate-50 sm:text-4xl">
                {t("home.nav.install", { defaultValue: "Install" })}
              </h2>
              <p className="mt-4 text-xl font-medium text-slate-300">
                {t("home.commands.title", {
                  defaultValue: "Install it or jump straight into a ledger.",
                })}
              </p>
            </div>
            <Button
              asChild
              className="h-11 rounded-md bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link to="/ledgers">
                {t("home.actions.openLedgers", {
                  defaultValue: "Open /ledgers",
                })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="web" className="mt-6">
            <TabsList className="inline-flex h-11 w-full justify-start gap-0 overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/80 p-1">
              {commands.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="shrink-0 rounded-md px-4 py-2 text-sm font-semibold text-slate-400 transition-colors data-[state=active]:bg-[hsl(var(--brand-accent))] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {commands.map((item) => (
              <TabsContent key={item.id} value={item.id}>
                <article className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                    <div>
                      <h3 className="text-[0.95rem] font-semibold text-slate-50">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-400">{item.detail}</p>
                      {item.prereq && (
                        <p className="mt-1 text-xs font-medium text-[hsl(var(--brand-accent))]">
                          {item.prereq}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => void copyCommand(item.id, item.command)}
                      aria-label={`Copy ${item.title} command`}
                    >
                      {copiedCommand === item.id ? (
                        <Check className="h-4 w-4 text-[hsl(var(--brand-accent-soft))]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm leading-7 text-[hsl(var(--brand-accent-soft)/0.85)]">
                    <code>{item.command}</code>
                  </pre>
                </article>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* ── Usage tips ────────────────────────────────────────────────────── */}
      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/60 dark:bg-amber-950/30">
            <div className="grid gap-4 md:grid-cols-3">
              {usageFundamentals.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className="icon-brand mt-1 h-5 w-5 shrink-0" />
                  <div>
                    <h2 className="text-base font-semibold text-[hsl(var(--brand-accent-text))] dark:text-[hsl(var(--brand-accent-soft))]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-amber-950 dark:text-amber-100">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* "Get Vaulted Money" store section hidden until store listings exist (see HomeStoreLinks). */}
      <SiteFooter />
    </main>
  );
};

export default HomePage;

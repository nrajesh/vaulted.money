import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import {
  Archive,
  BookOpen,
  Coins,
  Database,
  Download,
  GitFork,
  HardDrive,
  Lock,
  Receipt,
  Shield,
  Terminal,
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
import HomeHeroDemo from "@/components/homepage/HomeHeroDemo";
import HomeStoreLinks from "@/components/homepage/HomeStoreLinks";

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
        defaultValue:
          "The code, roadmap, and privacy posture are auditable in the public repository.",
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
        defaultValue: "Accounts, vendors, categories",
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
        defaultValue: "Back up before you rely on the browser",
      }),
      description: t("home.usage.backup.description", {
        defaultValue:
          "Local-first means your data is yours, but private windows, browser resets, or clearing site data can erase local storage.",
      }),
    },
    {
      icon: Download,
      title: t("home.usage.automate.title", {
        defaultValue: "Automate a backup rhythm",
      }),
      description: t("home.usage.automate.description", {
        defaultValue:
          "Use encrypted or plain JSON exports, and enable automated backups when your browser or desktop platform supports it.",
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
      window: t("home.milestones.localApi.window", {
        defaultValue: "October 2026",
      }),
      title: t("home.milestones.localApi.title", {
        defaultValue: "Local API for the desktop app",
      }),
      summary: t("home.milestones.localApi.summary", {
        defaultValue:
          "The Electron desktop app can now expose an opt-in REST API on your own machine, so you can script Vaulted Money, import and export data, or build your own interface while everything stays local.",
      }),
      label: "Current",
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "emerald",
    },
    {
      window: t("home.milestones.privacyRefresh.window", {
        defaultValue: "May 2026",
      }),
      title: t("home.milestones.privacyRefresh.title", {
        defaultValue: "Privacy and public branding refresh",
      }),
      summary: t("home.milestones.privacyRefresh.summary", {
        defaultValue:
          "The public-facing experience expanded with a dedicated privacy page, updated branding, and sharper trust messaging for new users.",
      }),
      label: "Previous",
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "emerald",
    },
    {
      window: t("home.milestones.brandLaunch.window", {
        defaultValue: "April 2026",
      }),
      title: t("home.milestones.brandLaunch.title", {
        defaultValue: "Vaulted Money brand and public homepage launch",
      }),
      summary: t("home.milestones.brandLaunch.summary", {
        defaultValue:
          "The app was renamed to Vaulted Money, the public homepage landed, and the install story became much clearer for web and desktop users.",
      }),
      label: "v1.5-v1.6",
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "orange",
    },
    {
      window: t("home.milestones.languageRollout.window", {
        defaultValue: "March 2026",
      }),
      title: t("home.milestones.languageRollout.title", {
        defaultValue: "Language management and localization rollout",
      }),
      summary: t("home.milestones.languageRollout.summary", {
        defaultValue:
          "Multi-language support, language management UX, and broader translation coverage shipped as a major usability milestone.",
      }),
      label: "v1.4 era",
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "red",
    },
    {
      window: t("home.milestones.coreRelease.window", {
        defaultValue: "January 2026",
      }),
      title: t("home.milestones.coreRelease.title", {
        defaultValue: "Core local-first ledger release",
      }),
      summary: t("home.milestones.coreRelease.summary", {
        defaultValue:
          "The first tagged release established the web app foundation for ledgers, transactions, categories, budgets, and local data ownership.",
      }),
      label: "v1.0.0",
      status: t("home.status.released", { defaultValue: "Released" }),
      accent: "blue",
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 px-3 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-4">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center"
            aria-label="Vaulted Money home"
          >
            <BrandLockup size="header" />
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:flex">
            <a
              href="#trust"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
            >
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </a>
            <a
              href="#workflow"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-sky-950/60 dark:hover:text-sky-200"
            >
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </a>
            <a
              href="#roadmap"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-200"
            >
              {t("home.nav.roadmap", { defaultValue: "Roadmap" })}
            </a>
            <a
              href="#install"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-800 dark:text-slate-300 dark:hover:bg-amber-950/60 dark:hover:text-amber-200"
            >
              {t("home.nav.install", { defaultValue: "Install" })}
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
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
              <Link to="/ledgers">
                {t("home.actions.openApp", { defaultValue: "Open app" })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 lg:hidden"
                  aria-label={t("home.nav.menu", { defaultValue: "Menu" })}
                >
                  <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[17rem] flex-col gap-0 border-l border-slate-200/60 bg-white/95 px-0 pt-12 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/95"
              >
                <div className="px-5 pb-4">
                  <p className="app-gradient-title text-lg font-bold tracking-normal">
                    Vaulted Money
                  </p>
                </div>
                <nav className="flex flex-col gap-0.5 border-t border-slate-200/60 px-3 pt-3 dark:border-slate-800/60">
                  {[
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
                <div className="mt-auto border-t border-slate-200/60 px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 dark:border-slate-800/60">
                  <Button
                    asChild
                    className="h-11 w-full rounded-lg bg-[hsl(var(--brand-accent))] text-[0.95rem] font-semibold text-white hover:bg-[hsl(var(--brand-accent-strong))]"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Link to="/ledgers">
                      {t("home.actions.openApp", { defaultValue: "Open app" })}
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
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,hsl(var(--background)),rgba(248,250,252,0.72))] px-4 pt-6 pb-2 dark:border-slate-800 dark:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.45))] sm:py-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl items-center gap-5 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,42rem)]">
          <div className="max-w-3xl">
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

            <h1 className="app-gradient-title max-w-3xl text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl lg:text-6xl">
              Vaulted Money
            </h1>
            <p className="app-page-subtitle text-base sm:text-lg">
              {t("home.hero.subtitle", {
                defaultValue:
                  "A complete local-first money manager for multi-ledger, multi-currency tracking across personal, family, and business accounts.",
              })}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-md px-5">
                <Link to="/ledgers">
                  {t("home.actions.startLedger", {
                    defaultValue: "Start with ledgers",
                  })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-md border-slate-300 px-5 dark:border-slate-700"
              >
                <a href="#install">
                  <Terminal className="h-4 w-4" />
                  {t("home.actions.install", {
                    defaultValue: "Install locally",
                  })}
                </a>
              </Button>
            </div>

            <div className="mt-7 hidden max-w-2xl gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex sm:flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="icon-brand h-4 w-4" />
                {t("home.proof.noCloud", { defaultValue: "No cloud account" })}
              </div>
              <div className="flex items-center gap-2">
                <Database className="icon-brand h-4 w-4" />
                {t("home.proof.offline", { defaultValue: "Works offline" })}
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="icon-brand h-4 w-4" />
                {t("home.proof.auditable", { defaultValue: "Auditable code" })}
              </div>
            </div>
          </div>

          <div className="relative">
            <HomeHeroDemo />
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section
        id="trust"
        className="scroll-mt-24 px-4 pt-8 pb-8 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trustPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
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
                <h2 className="app-gradient-title mt-4 text-lg font-semibold">
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
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 px-4 py-10 dark:border-slate-800 dark:bg-slate-900/55 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </h2>
            <p className="mt-4 text-xl font-medium text-slate-800 dark:text-slate-200">
              {t("home.workflow.title", {
                defaultValue: "Everything needed to run a personal ledger.",
              })}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              {t("home.workflow.description", {
                defaultValue:
                  "Create a ledger, import CSV files, reconcile accounts, watch budgets, schedule recurring money movement, and export backups from one local app.",
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
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60"
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
        className="scroll-mt-24 border-y border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-10 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
                {t("home.nav.roadmap", { defaultValue: "Roadmap" })}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                {t("home.roadmap.description", {
                  defaultValue:
                    "Based on tagged releases and major shipped milestones so far.",
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/65">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t("home.roadmap.snapshot", { defaultValue: "Snapshot" })}
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                {t("home.roadmap.milestoneCount", {
                  defaultValue: "5 milestones",
                })}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("home.roadmap.milestoneShipped", {
                  defaultValue:
                    "Five major items shipped in 2026, led by the desktop Local API.",
                })}
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-[1.1rem] top-0 bottom-0 hidden w-px bg-slate-200 dark:bg-slate-800 sm:block" />
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
                    <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
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
        className="scroll-mt-24 border-t border-slate-200 bg-slate-950 px-4 py-10 text-slate-50 dark:border-slate-800 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
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
                    <h2 className="app-gradient-title text-base font-semibold">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <HomeStoreLinks />
      <SiteFooter />
    </main>
  );
};

export default HomePage;

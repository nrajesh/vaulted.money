import { Link } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Database,
  ExternalLink,
  FolderArchive,
  Globe,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import SiteFooter from "@/components/SiteFooter";
import BrandLockup from "@/components/BrandLockup";
import {
  GITHUB_REPO_ISSUES_URL,
  GITHUB_REPO_URL,
  SECURITY_POLICY_URL,
} from "@/utils/feedbackLinks";

const policySections = [
  {
    icon: ShieldCheck,
    title: "Overview",
    body: [
      "Vaulted Money is a privacy-first, local-first finance tracker. It is designed so that your ledgers, transactions, budgets, categories, and most preferences stay on your device rather than on our servers.",
      "We do not require you to create a Vaulted Money account to use the app. We also do not run a hosted cloud ledger service for your financial records.",
    ],
  },
  {
    icon: Database,
    title: "What the app stores locally",
    body: [
      "Depending on which features you use, Vaulted Money can store ledger names, accounts, transactions, budgets, scheduled transactions, categories, sub-categories, app preferences, exchange-rate caches, AI provider settings, and backup configuration on your device.",
      "In the web app, this data is primarily stored in your browser storage, including IndexedDB and local storage. In desktop and mobile app shells, local data may also be stored through the app container and local filesystem features you choose to enable.",
    ],
  },
  {
    icon: Brain,
    title: "Optional AI categorization",
    body: [
      "AI-powered categorization is optional and disabled unless you configure it yourself. If you add an API key and select a provider such as OpenAI, Gemini, Anthropic, Mistral, Perplexity, or a custom OpenAI-compatible endpoint, the app sends requests directly from your device to that provider.",
      "To help the provider suggest categories faster, the request may include financial context such as vendor or payee names and your existing category and sub-category lists. This can reveal spending-related information to the provider you choose. Review that provider's privacy terms before enabling the feature.",
      "Your AI provider API keys are stored locally on your device so the app can reuse them. We do not operate the AI endpoint and we do not receive a copy of those AI requests through a Vaulted Money server.",
    ],
  },
  {
    icon: Globe,
    title: "When data may leave your device",
    body: [
      "Your data can leave your device when you choose features that require external communication, such as AI categorization, refreshing exchange rates from Frankfurter, exporting backups, or using a cloud-synced folder that you control for continuity.",
      "If you open GitHub links for support, bug reports, or security disclosures, any information you submit there is governed by GitHub and whatever details you choose to share.",
    ],
  },
  {
    icon: FolderArchive,
    title: "Backups, exports, and sync",
    body: [
      "Vaulted Money lets you create plain or encrypted backups and import them later. If you export a backup, save a file to a shared folder, or use a cloud-synced directory, that copy is stored wherever you place it and is governed by that storage provider or device setup.",
      "You are responsible for protecting exported files, backup passwords, and access to any folders you connect to the app.",
    ],
  },
  {
    icon: Lock,
    title: "Security and your choices",
    body: [
      "No software can promise perfect security. Local-first storage reduces server exposure, but your data can still be affected by device compromise, shared-device access, browser resets, or deletion of local storage.",
      "You can limit data sharing by keeping AI features disabled, removing stored API keys, deleting ledgers you no longer need, clearing local app data, and removing exported backup files under your control.",
    ],
  },
];

const PrivacyPolicyPage = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground sm:pt-24">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 px-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 sm:h-24">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Vaulted Money home"
          >
            <BrandLockup size="header" />
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/ledgers">
                Open app
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,hsl(var(--background)),rgba(248,250,252,0.72))] px-4 py-10 dark:border-slate-800 dark:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.45))]">
        <div className="mx-auto max-w-6xl">
          <Button asChild variant="ghost" className="mb-4 -ml-3">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="max-w-6xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Privacy Policy
            </p>
            <h1 className="app-gradient-title max-w-4xl text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl">
              How Vaulted Money handles your data
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Last updated on May 15, 2026. This policy is based on the current
              behavior of Vaulted Money as a local-first budgeting and finance
              app.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              The short version: your financial records stay local by default.
              If you optionally enable third-party AI providers to speed up
              categorization, some financial context can be sent directly from
              your device to the provider you choose.
            </p>
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm dark:border-emerald-800/70 dark:bg-emerald-950/35 dark:text-emerald-50">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">
                    Local-first privacy statement
                  </h2>
                  <p className="mt-2 text-sm leading-7">
                    Vaulted Money is designed without centralized financial-data
                    collection, without a required Vaulted Money sign-in, and
                    without transfer of personally identifiable information to a
                    Vaulted Money server. You keep ownership and control of the
                    information you enter.
                  </p>
                  <p className="mt-2 text-sm leading-7">
                    Vaulted Money does not claim ownership of, control, or
                    accept responsibility for information you choose to share
                    with any third-party app, browser extension, plugin, AI
                    provider, storage service, or other external tool.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {policySections.map((section) => (
            <article
              key={section.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <section.icon className="h-5 w-5 text-slate-800 dark:text-slate-100" />
                </div>
                <h2 className="app-gradient-title text-xl font-semibold">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-10 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="app-gradient-title text-2xl font-bold tracking-normal sm:text-3xl">
            Contact and transparency
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Source code</h3>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Review the public repository, roadmap, and implementation
                details.
              </p>
            </a>

            <a
              href={GITHUB_REPO_ISSUES_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Support and feedback</h3>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Report bugs, request features, or ask product questions through
                GitHub.
              </p>
            </a>

            <a
              href={SECURITY_POLICY_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Security disclosures</h3>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Use the security policy for responsible disclosure of
                vulnerabilities.
              </p>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
};

export default PrivacyPolicyPage;

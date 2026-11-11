import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLedger } from "@/contexts/LedgerContext";
import { cn } from "@/lib/utils";
import { ledgerFreeNav, isLedgerFreePath } from "@/constants/ledgerFreeRoutes";

/**
 * The frame around every in-app page. With a ledger open it is the normal
 * layout with the sidebar. With none open, the pages that are not about one
 * ledger (settings, AI, languages, currencies, backup) still open, in a slim
 * frame that leads back to the ledger list. Without this, changing an app-wide
 * setting first meant creating and opening a ledger.
 */
const AppShell = () => {
  const { activeLedger, isLoading } = useLedger();
  const { pathname } = useLocation();
  if (!isLoading && !activeLedger && isLedgerFreePath(pathname)) {
    return <LedgerFreeShell />;
  }
  // Layout sends every other page to the ledger list when no ledger is open.
  return <Layout />;
};

const LedgerFreeShell = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-gray-50/90 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur dark:bg-gray-900/90 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/ledgers">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                {t("appSettings.backToLedgers", {
                  defaultValue: "Back to ledgers",
                })}
              </Link>
            </Button>
            <nav
              aria-label={t("appSettings.navLabel", {
                defaultValue: "App settings",
              })}
              className="order-last flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
            >
              {ledgerFreeNav.map(
                ({ to, labelKey, defaultLabel, alsoActive }) => {
                  const active =
                    pathname === to || (alsoActive ?? []).includes(pathname);
                  return (
                    <Link
                      key={to}
                      to={to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {t(labelKey, { defaultValue: defaultLabel })}
                    </Link>
                  );
                },
              )}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto sm:ml-0"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label={t("layout.toggleTheme", {
                defaultValue: "Toggle theme",
              })}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden />
              ) : (
                <Moon className="h-5 w-5" aria-hidden />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("appSettings.ledgerFreeNote", {
              defaultValue:
                "No ledger is open. What you change here applies to every ledger on this device.",
            })}
          </p>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AppShell;

import * as React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import {
  Building2,
  Globe,
  Home,
  Baby,
  Wallet,
  Landmark,
  ChevronDown,
  Moon,
  Sun,
  Plus,
  Pin,
  PinOff,
  BookOpen,
  HelpCircle,
  LogOut,
  MoreHorizontal,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getElectronAPI } from "@/utils/electron";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import AddEditTransactionDialog from "@/components/dialogs/AddEditTransactionDialog";
import { useLedger } from "@/contexts/LedgerContext";
import { useHelpDrawer } from "@/contexts/HelpDrawerContext";
import { useDefaultAccountSelection } from "@/hooks/useDefaultAccountSelection";
import { GlobalProgressDialog } from "@/components/dialogs/GlobalProgressDialog";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";
import SiteFooter from "@/components/SiteFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AppSidebarNav } from "@/components/navigation/AppSidebarNav";
import BrandLockup from "@/components/BrandLockup";
import { useIsMobile } from "@/hooks/use-mobile";

const PinTrigger = () => {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleSidebar();
      }}
      className="hidden md:flex group-data-[collapsible=icon]:hidden"
      aria-label={state === "collapsed" ? "Pin Sidebar" : "Unpin Sidebar"}
    >
      {state === "collapsed" ? (
        <Pin className="size-4" />
      ) : (
        <PinOff className="size-4" />
      )}
    </Button>
  );
};

/**
 * Auto-closes the mobile sidebar when the route changes.
 * Must be rendered inside SidebarProvider.
 */
const MobileSidebarCloser = () => {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  React.useEffect(() => {
    // Robust check for mobile view (768px is the MOBILE_BREAKPOINT in use-mobile.tsx)
    const isMobileViewport = window.innerWidth < 768;

    if (isMobileViewport) {
      // Use a small timeout to ensure navigation transition doesn't interfere with state update
      const timer = setTimeout(() => {
        setOpenMobile(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, setOpenMobile]);

  return null;
};

type SidebarLedgerFooterProps = {
  activeLedgerId?: string;
  avatarFallback: React.ReactNode;
  displayEmail: string;
  displayName: string;
  ledgers: Array<{
    id: string;
    name: string;
    short_name?: string;
  }>;
  logout: () => void;
  switchLedger: (ledgerId: string) => Promise<void>;
  t: ReturnType<typeof useTranslation>["t"];
};

const SidebarLedgerFooter = ({
  activeLedgerId,
  avatarFallback,
  displayEmail,
  displayName,
  ledgers,
  logout,
  switchLedger,
  t,
}: SidebarLedgerFooterProps) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const [mobileLedgersOpen, setMobileLedgersOpen] = React.useState(false);

  const handleSwitchLedger = async (ledgerId: string) => {
    await switchLedger(ledgerId);
    setMobileLedgersOpen(false);
    setOpenMobile(false);
  };

  const handleLogout = () => {
    setMobileLedgersOpen(false);
    setOpenMobile(false);
    logout();
  };

  if (isMobile) {
    return (
      <div className="border-t border-sidebar-border/70 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <Collapsible
          open={mobileLedgersOpen}
          onOpenChange={setMobileLedgersOpen}
        >
          <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/30 p-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-sidebar-accent/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
                  {avatarFallback}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">
                    {displayName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    mobileLedgersOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 px-1 pb-1 pt-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("layout.nav.myLedgers", { defaultValue: "My Ledgers" })}
              </p>
              {ledgers.map((ledger) => (
                <Button
                  key={ledger.id}
                  variant={activeLedgerId === ledger.id ? "secondary" : "ghost"}
                  className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left"
                  onClick={() => void handleSwitchLedger(ledger.id)}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center text-sm",
                      activeLedgerId === ledger.id
                        ? "opacity-100"
                        : "opacity-30",
                    )}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">
                      {ledger.name}
                    </span>
                    {ledger.short_name && (
                      <span className="block truncate text-sm text-muted-foreground">
                        {ledger.short_name}
                      </span>
                    )}
                  </span>
                </Button>
              ))}
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-sidebar-border/70 bg-transparent text-sm"
          >
            <Link to="/settings" onClick={() => setOpenMobile(false)}>
              <BookOpen className="h-4 w-4" />
              {t("layout.nav.settings", { defaultValue: "Settings" })}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-sidebar-border/70 bg-transparent text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("layout.nav.logout", { defaultValue: "Log out" })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2 p-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
            {avatarFallback}
          </div>
          <div className="text-left flex-1 truncate group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {displayEmail}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          {t("layout.nav.myLedgers", { defaultValue: "My Ledgers" })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {ledgers.map((ledger) => (
            <DropdownMenuItem
              key={ledger.id}
              onClick={() => switchLedger(ledger.id)}
            >
              <span
                className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center",
                  activeLedgerId === ledger.id ? "opacity-100" : "opacity-0",
                )}
              >
                ✓
              </span>
              <span>{ledger.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/settings">
            {t("layout.nav.settings", { defaultValue: "Settings" })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          {t("layout.nav.logout", { defaultValue: "Log out" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type MobileHeaderActionsMenuProps = {
  displayName: string;
  logout: () => void;
  resolvedTheme?: string;
  setTheme: (theme: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
  isHomepageMobilePreview?: boolean;
};

/**
 * Connecting an agent needs the desktop Local API, so entry points only show
 * when the Electron bridge exposes it (same guard as useLocalApi).
 */
const hasAgentBridge = () =>
  typeof getElectronAPI()?.getApiConfig === "function";

/** Desktop header icon button to Settings. Exported for tests. */
export const SettingsHeaderButton = ({
  t,
}: {
  t: ReturnType<typeof useTranslation>["t"];
}) => {
  const label = t("layout.nav.settings", { defaultValue: "Settings" });
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
    >
      <Link to="/settings" aria-label={label}>
        <BookOpen className="h-5 w-5 text-slate-600 dark:text-gray-300" />
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
};

// Exported only so tests can render the menu without the whole Layout.
export const MobileHeaderActionsMenu = ({
  displayName,
  logout,
  resolvedTheme,
  setTheme,
  t,
  isHomepageMobilePreview,
}: MobileHeaderActionsMenuProps) => {
  const actionItemClassName =
    "min-h-14 rounded-xl px-4 py-3 text-[1.05rem] font-medium text-foreground gap-3";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
          aria-label="More actions"
        >
          <MoreHorizontal className="h-5 w-5 text-slate-600 dark:text-gray-300" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(100vw-1.5rem,20rem)] rounded-2xl p-2 shadow-xl"
      >
        <div className="rounded-xl px-3 py-3">
          <p className="truncate text-lg font-semibold text-foreground">
            {displayName}
          </p>
          <p className="text-sm text-muted-foreground">Quick actions</p>
        </div>
        <DropdownMenuSeparator className="mx-1" />
        {isHomepageMobilePreview ? (
          <DropdownMenuItem disabled className={actionItemClassName}>
            <Home className="h-5 w-5" />
            {t("home.actions.home", { defaultValue: "Home" })}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className={actionItemClassName}>
            <Link to="/">
              <Home className="h-5 w-5" />
              {t("home.actions.home", { defaultValue: "Home" })}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className={actionItemClassName}>
          <Link to="/settings">
            <BookOpen className="h-5 w-5" />
            {t("layout.nav.settings", { defaultValue: "Settings" })}
          </Link>
        </DropdownMenuItem>
        {hasAgentBridge() && (
          <DropdownMenuItem asChild className={actionItemClassName}>
            <Link to="/connect-agent">
              <Bot className="h-5 w-5" />
              {t("layout.nav.connectAgent", {
                defaultValue: "Connect an AI agent",
              })}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className={actionItemClassName}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-1" />
        <DropdownMenuItem onClick={logout} className={actionItemClassName}>
          <LogOut className="h-5 w-5" />
          {t("layout.nav.logout", { defaultValue: "Log out" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Layout = () => {
  const { t } = useTranslation();
  const { setTheme, resolvedTheme } = useTheme();
  // const { user, userProfile, isLoadingUser } = useUser();
  const { activeLedger, ledgers, switchLedger, logout, isLoading } =
    useLedger();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomepageMobilePreview =
    new URLSearchParams(location.search).get("preview") === "homepage-mobile" ||
    (typeof window !== "undefined" && window.self !== window.top);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const { openHelp } = useHelpDrawer();

  React.useEffect(() => {
    if (!isLoading && !activeLedger) {
      navigate("/ledgers");
    }
  }, [isLoading, activeLedger, navigate]);

  React.useEffect(() => {
    if (isHomepageMobilePreview) {
      document.documentElement.classList.add("homepage-mobile-preview");
      // Safety net: never let the embedded preview drift sideways.
      const resetHorizontalScroll = () => {
        if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
      };
      window.addEventListener("scroll", resetHorizontalScroll);
      return () => {
        window.removeEventListener("scroll", resetHorizontalScroll);
        document.documentElement.classList.remove("homepage-mobile-preview");
      };
    }
  }, [isHomepageMobilePreview]);

  // Initialize default account selection globally
  useDefaultAccountSelection();

  const displayName = activeLedger?.name || "Select Ledger";
  const displayEmail = activeLedger?.short_name || "Budget";
  // const displayAvatar = null; // Removed
  const avatarFallback = activeLedger?.icon ? (
    activeLedger.icon === "home" ? (
      <Home className="h-4 w-4" />
    ) : activeLedger.icon === "globe" ? (
      <Globe className="h-4 w-4" />
    ) : activeLedger.icon === "baby" ? (
      <Baby className="h-4 w-4" />
    ) : activeLedger.icon === "wallet" ? (
      <Wallet className="h-4 w-4" />
    ) : activeLedger.icon === "landmark" ? (
      <Landmark className="h-4 w-4" />
    ) : (
      <Building2 className="h-4 w-4" />
    )
  ) : (
    activeLedger?.name?.substring(0, 2).toUpperCase() || "LG"
  );

  return (
    <SidebarProvider
      className={cn(
        "min-h-screen",
        isHomepageMobilePreview && "h-screen overflow-hidden",
      )}
    >
      <MobileSidebarCloser />
      <Sidebar collapsible="icon">
        <SidebarHeader className="pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-center">
            <BrandLockup
              size={isMobile ? "mobile" : "sidebar"}
              className="group-data-[collapsible=icon]:gap-0"
              iconWrapperClassName={cn(
                "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                isHomepageMobilePreview && "h-14 w-14",
              )}
              imageClassName="scale-[1.35] group-data-[collapsible=icon]:scale-[2.35]"
              nameClassName="group-data-[collapsible=icon]:hidden"
            />
            <PinTrigger />
            <SidebarTrigger className="flex md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <AppSidebarNav
            env={{
              isNative: Capacitor.isNativePlatform(),
              hasDesktopBridge: hasAgentBridge(),
            }}
          />
        </SidebarContent>
        <SidebarFooter>
          <SidebarLedgerFooter
            activeLedgerId={activeLedger?.id}
            avatarFallback={avatarFallback}
            displayEmail={displayEmail}
            displayName={displayName}
            ledgers={ledgers}
            logout={logout}
            switchLedger={switchLedger}
            t={t}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset
        className={cn(
          "flex flex-col bg-background",
          isHomepageMobilePreview && "h-screen overflow-hidden",
        )}
      >
        <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between border-b bg-background px-4 pt-[env(safe-area-inset-top)] sm:px-6 md:sticky md:top-0">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="aspect-square h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-input dark:bg-gray-800/80 dark:hover:bg-gray-700 md:hidden">
              <img
                src={resolvedTheme === "dark" ? logoDark : logoLight}
                alt=""
                className="aspect-square h-9 w-9 shrink-0 scale-[1.35] object-contain"
              />
            </SidebarTrigger>
            <div className="min-w-0 md:hidden">
              <p className="app-gradient-title block truncate text-xl font-black leading-none tracking-normal">
                Vaulted Money
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {displayName}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:gap-4 md:flex">
            {isHomepageMobilePreview ? (
              <Button
                type="button"
                disabled
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
              >
                <Home className="h-5 w-5 text-slate-600 dark:text-gray-300" />
                <span className="sr-only">
                  {t("home.actions.home", { defaultValue: "Home" })}
                </span>
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
              >
                <Link
                  to="/"
                  aria-label={t("home.actions.home", { defaultValue: "Home" })}
                >
                  <Home className="h-5 w-5 text-slate-600 dark:text-gray-300" />
                  <span className="sr-only">
                    {t("home.actions.home", { defaultValue: "Home" })}
                  </span>
                </Link>
              </Button>
            )}
            <LanguageSwitcher showLanguageSettings />
            <SettingsHeaderButton t={t} />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
              onClick={() => openHelp()}
              aria-label={t("helpDrawer.open", { defaultValue: "Help" })}
              aria-haspopup="dialog"
            >
              <HelpCircle className="h-5 w-5 text-slate-600 dark:text-gray-300" />
              <span className="sr-only">
                {t("helpDrawer.open", { defaultValue: "Help" })}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
              onClick={() =>
                setTheme(resolvedTheme === "light" ? "dark" : "light")
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
              <span className="sr-only">
                {t("layout.toggleTheme", { defaultValue: "Toggle theme" })}
              </span>
            </Button>
            <FeedbackLauncher triggerClassName="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input" />
            {!isHomepageMobilePreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
                onClick={logout}
                aria-label={t("layout.nav.logout", {
                  defaultValue: "Log out",
                })}
              >
                <LogOut className="h-5 w-5 text-slate-600 dark:text-gray-300" />
                <span className="sr-only">
                  {t("layout.nav.logout", { defaultValue: "Log out" })}
                </span>
              </Button>
            )}
          </div>
          {/* Round icon buttons must not be squeezed into ovals at large text sizes. */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <LanguageSwitcher showLanguageSettings />
            {/* Help is one tap away; Give feedback lives inside the drawer. */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
              onClick={() => openHelp()}
              aria-label={t("helpDrawer.open", { defaultValue: "Help" })}
              aria-haspopup="dialog"
            >
              <HelpCircle className="h-5 w-5 text-slate-600 dark:text-gray-300" />
            </Button>
            <MobileHeaderActionsMenu
              displayName={displayName}
              logout={logout}
              resolvedTheme={resolvedTheme}
              setTheme={setTheme}
              t={t}
              isHomepageMobilePreview={isHomepageMobilePreview}
            />
          </div>
        </header>
        <main
          className={cn(
            "flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-background pb-24 pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0 md:pb-0",
            isHomepageMobilePreview && "h-full overscroll-none",
          )}
        >
          <Outlet />
        </main>
        {!isHomepageMobilePreview && <SiteFooter />}
        {!isHomepageMobilePreview && (
          <>
            <MobileBottomNav />
            {/* Keeps the footer clear of the fixed tab bar on phones. */}
            <div
              aria-hidden="true"
              className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden"
            />
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className={cn(
                "fixed right-4 z-50 h-12 w-12 rounded-full px-0 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white sm:right-6 sm:h-14 sm:w-14 md:bottom-6",
                // Clear the tab bar on phones; the homepage preview has none.
                isHomepageMobilePreview
                  ? "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
                  : "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]",
              )}
              aria-label={t("layout.addTransaction", {
                defaultValue: "Add Transaction",
              })}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">
                {t("layout.addTransaction", {
                  defaultValue: "Add Transaction",
                })}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {t("layout.addTransaction", { defaultValue: "Add Transaction" })}
          </TooltipContent>
        </Tooltip>
        <AddEditTransactionDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
        <GlobalProgressDialog />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;

import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Receipt,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const tabClassName =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-tight text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

/**
 * Thumb-reachable navigation for phones. The four most-used pages are one tap
 * away; "More" opens the full sidebar sheet for everything else. Must render
 * inside `SidebarProvider`. Hidden from `md` up, where the sidebar is visible.
 */
export const MobileBottomNav = () => {
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();

  const tabs = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: t("layout.nav.dashboard", { defaultValue: "Dashboard" }),
    },
    {
      to: "/transactions",
      icon: Receipt,
      label: t("layout.nav.transactions", { defaultValue: "Transactions" }),
    },
    {
      to: "/accounts",
      icon: CreditCard,
      label: t("layout.nav.accounts", { defaultValue: "Accounts" }),
    },
    {
      to: "/budgets",
      icon: PiggyBank,
      label: t("layout.nav.budgets", { defaultValue: "Budgets" }),
    },
  ];

  return (
    <nav
      aria-label={t("layout.nav.primary", { defaultValue: "Primary" })}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(tabClassName, isActive && "text-primary")
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="max-w-full truncate">{label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className={cn(tabClassName, "bg-transparent border-0")}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span>{t("layout.nav.more", { defaultValue: "More" })}</span>
      </button>
    </nav>
  );
};

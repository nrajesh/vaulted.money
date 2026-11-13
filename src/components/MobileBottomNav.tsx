import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  BOTTOM_BAR_ITEM_IDS,
  findNavItem,
  isBottomBarPage,
  type NavItem,
} from "@/components/navigation/navConfig";

const tabClassName =
  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-tight text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

/** A short bar above the selected tab, so "selected" is not colour alone. */
const activeTabClassName =
  "text-primary before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:rounded-full before:bg-primary";

const bottomBarItems = BOTTOM_BAR_ITEM_IDS.map(findNavItem).filter(
  (item): item is NavItem => Boolean(item?.to),
);

/**
 * Thumb-reachable navigation for phones, rendered from the shared nav config.
 * The four everyday pages are one tap away; "More" opens the full sidebar
 * sheet and is shown as selected whenever the current page lives there.
 * Must render inside `SidebarProvider`. Hidden from `md` up.
 */
export const MobileBottomNav = () => {
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();
  const { pathname } = useLocation();
  const isMoreActive = !isBottomBarPage(pathname);

  return (
    <nav
      aria-label={t("layout.nav.primary", { defaultValue: "Primary" })}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {bottomBarItems.map(({ id, to, icon: Icon, labelKey, defaultLabel }) => (
        <NavLink
          key={id}
          to={to!}
          className={({ isActive }) =>
            cn(tabClassName, isActive && activeTabClassName)
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="max-w-full truncate">
            {t(labelKey, { defaultValue: defaultLabel })}
          </span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        aria-haspopup="dialog"
        aria-current={isMoreActive ? "page" : undefined}
        className={cn(
          tabClassName,
          "bg-transparent border-0",
          isMoreActive && activeTabClassName,
        )}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span>{t("nav.items.more", { defaultValue: "More" })}</span>
      </button>
    </nav>
  );
};

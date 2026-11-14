import type { ComponentType } from "react";
import {
  BarChart3,
  Bot,
  Brain,
  BookOpen,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  DatabaseZap,
  FolderTree,
  Heart,
  LayoutGrid,
  Lightbulb,
  Newspaper,
  PiggyBank,
  Receipt,
  Shield,
  Store,
} from "lucide-react";
import { LanguageIcon } from "@/components/language/LanguageIcon";

/**
 * The one list of app destinations. The desktop sidebar, the phone sidebar
 * sheet and the phone bottom bar all render from here, so labels, icons,
 * grouping and the "which item is selected" rule cannot drift apart.
 *
 * Groups follow what people want to do, not how the app is built: everyday
 * pages first, power-user tools folded into "More options".
 */

export type NavIcon = ComponentType<{ className?: string }>;

export type NavItemId =
  | "overview"
  | "transactions"
  | "accounts"
  | "budgets"
  | "calendar"
  | "scheduled"
  | "reports"
  | "reportsSimple"
  | "reportsDetailed"
  | "insights"
  | "charts"
  | "categories"
  | "payees"
  | "aiAssistant"
  | "connectApps"
  | "currencies"
  | "yourData"
  | "backup"
  | "language"
  | "settings"
  | "donate";

/** Who can see an item. Checked by `isNavItemVisible`. */
export type NavAvailability =
  | "everywhere"
  /** Needs the Electron Local API bridge (desktop app only). */
  | "desktopBridge"
  /** Hidden in the iOS/Android builds (store rules on donations). */
  | "notNative";

export interface NavItem {
  id: NavItemId;
  /** Route to open. Parents with children have none of their own. */
  to?: string;
  icon: NavIcon;
  labelKey: string;
  defaultLabel: string;
  /** Extra paths that should mark this item as the current page. */
  alsoActiveOn?: string[];
  availability?: NavAvailability;
  children?: NavItem[];
}

export type NavGroupId = "everyday" | "plan" | "organise" | "ai" | "more";

export interface NavGroup {
  id: NavGroupId;
  labelKey: string;
  defaultLabel: string;
  /** Folded away until opened (or until the current page is inside it). */
  collapsible?: boolean;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "everyday",
    labelKey: "nav.groups.everyday",
    defaultLabel: "Everyday",
    items: [
      {
        id: "overview",
        to: "/dashboard",
        icon: LayoutGrid,
        labelKey: "nav.items.overview",
        defaultLabel: "Overview",
      },
      {
        id: "transactions",
        to: "/transactions",
        icon: Receipt,
        labelKey: "nav.items.transactions",
        defaultLabel: "Transactions",
      },
      {
        id: "accounts",
        to: "/accounts",
        icon: CreditCard,
        labelKey: "nav.items.accounts",
        defaultLabel: "Accounts",
      },
      {
        id: "budgets",
        to: "/budgets",
        icon: PiggyBank,
        labelKey: "nav.items.budgets",
        defaultLabel: "Budgets",
      },
    ],
  },
  {
    id: "plan",
    labelKey: "nav.groups.plan",
    defaultLabel: "Plan & understand",
    items: [
      {
        id: "calendar",
        to: "/calendar",
        icon: Calendar,
        labelKey: "nav.items.calendar",
        defaultLabel: "Calendar",
      },
      {
        id: "scheduled",
        to: "/scheduled",
        icon: Clock,
        labelKey: "nav.items.scheduled",
        defaultLabel: "Upcoming bills",
      },
      {
        id: "reports",
        icon: Newspaper,
        labelKey: "nav.items.reports",
        defaultLabel: "Reports",
        children: [
          {
            id: "reportsSimple",
            to: "/reports/essential",
            icon: Newspaper,
            labelKey: "nav.items.reportsSimple",
            defaultLabel: "Simple",
          },
          {
            id: "reportsDetailed",
            to: "/reports/advanced",
            icon: Newspaper,
            labelKey: "nav.items.reportsDetailed",
            defaultLabel: "Detailed",
          },
        ],
      },
      {
        id: "insights",
        to: "/insights",
        icon: Lightbulb,
        labelKey: "nav.items.insights",
        defaultLabel: "Spending insights",
      },
      {
        id: "charts",
        to: "/analytics",
        icon: BarChart3,
        labelKey: "nav.items.charts",
        defaultLabel: "Charts",
      },
    ],
  },
  {
    id: "organise",
    labelKey: "nav.groups.organise",
    defaultLabel: "Organise",
    items: [
      {
        id: "categories",
        to: "/categories",
        icon: FolderTree,
        labelKey: "nav.items.categories",
        defaultLabel: "Categories",
      },
      {
        id: "payees",
        to: "/vendors",
        icon: Store,
        labelKey: "nav.items.payees",
        defaultLabel: "Payees",
      },
    ],
  },
  {
    id: "ai",
    labelKey: "nav.groups.ai",
    defaultLabel: "AI & connections",
    items: [
      {
        id: "aiAssistant",
        to: "/ai-providers",
        icon: Brain,
        labelKey: "nav.items.aiAssistant",
        defaultLabel: "AI assistant",
      },
      {
        id: "connectApps",
        to: "/connect-agent",
        icon: Bot,
        labelKey: "nav.items.connectApps",
        defaultLabel: "Connect other AI apps",
        availability: "desktopBridge",
      },
    ],
  },
  {
    id: "more",
    labelKey: "nav.groups.more",
    defaultLabel: "More options",
    collapsible: true,
    items: [
      {
        id: "currencies",
        to: "/currencies",
        icon: Coins,
        labelKey: "nav.items.currencies",
        defaultLabel: "Currencies",
      },
      {
        id: "yourData",
        to: "/data-management",
        icon: DatabaseZap,
        labelKey: "nav.items.yourData",
        defaultLabel: "Your data",
      },
      {
        id: "backup",
        to: "/backup",
        icon: Shield,
        labelKey: "nav.items.backup",
        defaultLabel: "Backup",
      },
      {
        id: "language",
        to: "/language",
        icon: LanguageIcon,
        labelKey: "nav.items.language",
        defaultLabel: "Language",
      },
      {
        id: "settings",
        to: "/settings",
        icon: BookOpen,
        labelKey: "nav.items.settings",
        defaultLabel: "Settings",
      },
      {
        id: "donate",
        to: "/donate",
        icon: Heart,
        labelKey: "nav.items.donate",
        defaultLabel: "Support the project",
        availability: "notNative",
      },
    ],
  },
];

/** The phone bottom bar shows these; everything else lives behind "More". */
export const BOTTOM_BAR_ITEM_IDS: NavItemId[] = [
  "overview",
  "transactions",
  "accounts",
  "budgets",
];

export interface NavEnvironment {
  isNative: boolean;
  hasDesktopBridge: boolean;
}

export const isNavItemVisible = (item: NavItem, env: NavEnvironment) => {
  switch (item.availability) {
    case "desktopBridge":
      return env.hasDesktopBridge;
    case "notNative":
      return !env.isNative;
    default:
      return true;
  }
};

/**
 * The single "is this the current page" rule. An item is active on its own
 * route, on any `alsoActiveOn` path, or when one of its children is active
 * (so "Reports" stays highlighted on both report pages).
 */
export const isNavItemActive = (item: NavItem, pathname: string): boolean => {
  if (item.to && pathname === item.to) return true;
  if (item.alsoActiveOn?.includes(pathname)) return true;
  return (
    item.children?.some((child) => isNavItemActive(child, pathname)) ?? false
  );
};

export const findNavItem = (id: NavItemId): NavItem | undefined => {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.id === id) return item;
      const child = item.children?.find((c) => c.id === id);
      if (child) return child;
    }
  }
  return undefined;
};

/** True when the current page is one of the bottom-bar tabs. */
export const isBottomBarPage = (pathname: string) =>
  BOTTOM_BAR_ITEM_IDS.some((id) => {
    const item = findNavItem(id);
    return item ? isNavItemActive(item, pathname) : false;
  });

import { Link } from "react-router-dom";
import { SheetClose } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  Wallet,
  Tag,
  Building,
  Calendar,
  ScrollText,
  PiggyBank,
  User,
  Lightbulb,
  DatabaseZap,
  Shield,
} from "lucide-react"; // Importing icons
import { LanguageIcon } from "@/components/language/LanguageIcon";
import { useTranslation } from "react-i18next";
import BrandLockup from "@/components/BrandLockup";

const MobileNavContent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 p-4">
      <BrandLockup size="mobile" showName={false} className="justify-center" />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("layout.groups.dashboards", { defaultValue: "Dashboards" })}
        </h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t("layout.nav.dashboard", { defaultValue: "Dashboard" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/analytics"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <BarChart2 className="h-4 w-4" />
              {t("layout.nav.analytics", { defaultValue: "Analytics" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/insights"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Lightbulb className="h-4 w-4" />
              {t("layout.nav.insights", { defaultValue: "Insights" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/transactions"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted"
            >
              <Users className="h-4 w-4" />
              {t("layout.nav.transactions", { defaultValue: "Transactions" })}
            </Link>
          </SheetClose>
        </nav>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("layout.groups.management", { defaultValue: "Management" })}
        </h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/accounts"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Wallet className="h-4 w-4" />
              {t("layout.nav.accounts", { defaultValue: "Accounts" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/categories"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Tag className="h-4 w-4" />
              {t("layout.nav.categories", { defaultValue: "Categories" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/vendors"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Building className="h-4 w-4" />
              {t("layout.nav.vendors", { defaultValue: "Vendors" })}
            </Link>
          </SheetClose>
        </nav>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("layout.groups.configure", { defaultValue: "Configure" })}
        </h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/scheduled"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Calendar className="h-4 w-4" />
              {t("layout.nav.scheduled", { defaultValue: "Scheduled" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/reports/essential"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <ScrollText className="h-4 w-4" />
              {t("layout.nav.reportsEssential", { defaultValue: "Essential" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/reports/advanced"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <ScrollText className="h-4 w-4" />
              {t("layout.nav.reportsAdvanced", { defaultValue: "Advanced" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/budgets"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <PiggyBank className="h-4 w-4" />
              {t("layout.nav.budgets", { defaultValue: "Budgets" })}
            </Link>
          </SheetClose>
        </nav>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("layout.groups.setup", { defaultValue: "Setup" })}
        </h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <User className="h-4 w-4" />
              {t("layout.nav.settings", { defaultValue: "Settings" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/language"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <LanguageIcon className="h-4 w-4" />
              {t("layout.nav.languages", { defaultValue: "Languages" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/data-management"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <DatabaseZap className="h-4 w-4" />
              {t("layout.nav.data", { defaultValue: "Data" })}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/backup"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Shield className="h-4 w-4" />
              {t("layout.nav.backup", { defaultValue: "Backup" })}
            </Link>
          </SheetClose>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavContent;

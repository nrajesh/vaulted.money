import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GITHUB_REPO_URL } from "@/utils/feedbackLinks";

interface FooterLink {
  label: string;
  to?: string;
  href?: string;
  ariaLabel?: string;
}

interface SiteFooterProps {
  extraLinks?: FooterLink[];
}

const footerLinkClassName =
  "app-text-link font-medium text-sky-700 transition-colors hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200";

const SiteFooter = ({ extraLinks = [] }: SiteFooterProps) => {
  const { t } = useTranslation();

  return (
    <footer
      className="shrink-0 border-t border-border/60 bg-background px-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 md:pb-3"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-3xl min-w-0 flex-col items-center gap-2 text-center">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 text-xs font-medium">
          <span className="max-w-full truncate rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200">
            {t("home.badges.private", { defaultValue: "Privacy-first" })}
          </span>
          <span className="max-w-full truncate rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 dark:border-sky-700/60 dark:bg-sky-950/50 dark:text-sky-200">
            {t("home.badges.local", { defaultValue: "Data-local" })}
          </span>
          <span className="max-w-full truncate rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200">
            {t("home.badges.open", { defaultValue: "Open-sourced" })}
          </span>
        </div>

        <div className="flex max-w-full flex-col items-center gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-2">
          <Link to="/privacy" className={footerLinkClassName}>
            {t("layout.footer.privacyPolicy", {
              defaultValue: "Privacy Policy",
            })}
          </Link>
          <span
            className="hidden text-muted-foreground/30 sm:inline"
            aria-hidden="true"
          >
            |
          </span>
          <span className="hidden sm:inline">
            {t("layout.footer.madeBy", { defaultValue: "Made by " })}
            <a
              href="https://imaginest.nl"
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClassName}
            >
              Imaginest
            </a>
            {t("layout.footer.withHeart", {
              defaultValue: " with ❤️ for your financial ",
            })}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClassName}
              aria-label={t("layout.footer.githubAria", {
                defaultValue: "Open Vaulted Money on GitHub",
              })}
            >
              {t("layout.footer.freedom", { defaultValue: "freedom" })}
            </a>
          </span>
          <span className="sm:hidden">
            {t("layout.footer.madeBy", { defaultValue: "Made by " })}
            <a
              href="https://imaginest.nl"
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClassName}
            >
              Imaginest
            </a>
            {" with ❤️"}
          </span>
          <span className="sm:hidden">
            {t("layout.footer.forYourFinancial", {
              defaultValue: "For your financial ",
            })}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClassName}
              aria-label={t("layout.footer.githubAria", {
                defaultValue: "Open Vaulted Money on GitHub",
              })}
            >
              {t("layout.footer.freedom", { defaultValue: "freedom" })}
            </a>
          </span>
        </div>

        {extraLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {extraLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className={footerLinkClassName}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.ariaLabel}
                  className={footerLinkClassName}
                >
                  {link.label}
                </a>
              ),
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

export default SiteFooter;

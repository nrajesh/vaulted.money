/**
 * Pages that are not about one ledger, so they open even when none is. Shown
 * as the navigation of the frame used on the ledger list side of the app.
 * `alsoActive` lists other paths that show the same page.
 */
export const ledgerFreeNav: {
  to: string;
  labelKey: string;
  defaultLabel: string;
  alsoActive?: string[];
}[] = [
  {
    to: "/settings",
    labelKey: "layout.nav.settings",
    defaultLabel: "Settings",
  },
  {
    to: "/ai-providers",
    labelKey: "layout.nav.aiAndAgents",
    defaultLabel: "AI & agents",
    alsoActive: ["/connect-agent"],
  },
  {
    to: "/language",
    labelKey: "layout.nav.languages",
    defaultLabel: "Languages",
  },
  {
    to: "/currencies",
    labelKey: "layout.nav.currencies",
    defaultLabel: "Currencies",
  },
  { to: "/backup", labelKey: "layout.nav.backup", defaultLabel: "Backup" },
];

/** Reachable from the pages above, so they must not bounce to the ledger list. */
const OTHER_LEDGER_FREE_PATHS = ["/acknowledgments", "/donate"];

export const isLedgerFreePath = (pathname: string) =>
  OTHER_LEDGER_FREE_PATHS.includes(pathname) ||
  ledgerFreeNav.some(
    ({ to, alsoActive }) =>
      to === pathname || (alsoActive ?? []).includes(pathname),
  );

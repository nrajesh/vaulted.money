import { type Step } from "react-joyride";

type TourTranslator = (
  key: string,
  options?: { defaultValue?: string },
) => string;

// Define the steps for each route that supports a help tour
export const TOUR_STEPS: Record<string, Step[]> = {
  "/ledgers": [
    {
      target: "body",
      content:
        "Welcome to Vaulted Money! This is the Ledgers screen where you choose or create your central financial datastore.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-theme-toggle",
      content:
        "First off, you can toggle between Light and Dark mode up here at any time.",
      placement: "left",
    },
    {
      target: ".tour-ledger-title",
      content: "This is the gateway to your completely local datastore.",
      placement: "bottom",
    },
    {
      target: ".tour-ledger-search",
      content:
        "Use the search bar and bulk actions to quickly manage your ledgers.",
      placement: "bottom",
    },
    {
      target: ".tour-ledger-list",
      content:
        "Here you can see all your available ledgers. You can select one to enter it.",
      placement: "bottom",
    },
    {
      target: ".tour-create-ledger",
      content: "Click this button to create a new ledger from scratch.",
      placement: "left",
    },
  ],
  "/dashboard": [
    {
      target: ".tour-dashboard-summary",
      content:
        "This is your main dashboard summary showing your financial health at a glance.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-dashboard-charts",
      content: "These charts break down your spending by category over time.",
      placement: "right",
    },
    {
      target: ".tour-recent-transactions",
      content:
        "Your most recent transactions appear here. Keeping track is easy!",
      placement: "top",
    },
    {
      target: ".tour-sidebar-nav",
      content:
        "Use this navigation menu to visit different modules like Transactions, Budgets, and Insights.",
      placement: "right",
    },
  ],
  "/transactions": [
    {
      target: ".tour-transaction-list",
      content:
        "This is your transaction ledger. All your income and expenses are displayed here.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-add-transaction",
      content: "Click this button to add a new manual transaction easily.",
      placement: "bottom",
    },
    {
      target: ".tour-transaction-filters",
      content:
        "Use these filters to search by date, account, category, amount. You can also specify an NLP query like 'food under 50'.",
      placement: "bottom",
    },
    {
      target: ".tour-transaction-actions",
      content:
        "Open Actions to let AI categorise uncategorised items, or export your filtered view to CSV.",
      placement: "bottom",
    },
  ],
  "/budgets": [
    {
      target: "body",
      content:
        "Welcome to Budgets! Let's get your spending habits tracked and capped.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-budget-summary-cards",
      content:
        "At the top, a summarized view normalizes all of your monthly, yearly, and one-time budgets to give you an 'Average Monthly' spending picture.",
      placement: "bottom",
    },
    {
      target: ".tour-budget-search-bar",
      content:
        "You can quickly search for specific category budgets, and use the mass-selection tools to quickly clean up your list.",
      placement: "bottom",
    },
    {
      target: ".tour-create-budget",
      content:
        "Click this button to manually create a new budget cap for any category.",
      placement: "left",
    },
    {
      target: ".tour-smart-budget",
      content:
        "Or better yet, use Smart Create to magically generate realistic budgets based strictly on your historical spending trends.",
      placement: "left",
    },
    {
      target: ".tour-budget-list",
      content:
        "Here is your active budget list. The progress bars will change colors as you near your limits.",
      placement: "top",
    },
  ],
  "/calendar": [
    {
      target: "body",
      content:
        "Welcome to the Calendar View! Track your daily spending visually.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-calendar-grid",
      content:
        "Select any day on the grid to see the transactions that occurred.",
      placement: "bottom",
    },
    {
      target: ".tour-calendar-daily",
      content:
        "The transactions for the selected day will appear locally here.",
      placement: "left",
    },
  ],
  "/analytics": [
    {
      target: "body",
      content:
        "Welcome to Analytics! This is where you dissect your financial behavior.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-analytics-summary",
      content:
        "The top summary provides an instant read on your total spend and how it compares to your past.",
      placement: "bottom",
    },
    {
      target: ".tour-analytics-toggles",
      content:
        "Switch seamlessly between Line Charts for trends, Bar Charts for volumes, and Pie Charts for distribution.",
      placement: "bottom",
    },
    {
      target: ".tour-analytics-chart",
      content:
        "This interactive chart is fully touch-optimized! You can swipe left or right anywhere inside to step back and forward through time.",
      placement: "bottom",
    },
    {
      target: ".tour-analytics-period",
      content:
        "Alternatively, use the period selector to jump directly to specific months, quarters, or custom date ranges.",
      placement: "top",
    },
    {
      target: ".tour-analytics-breakdown",
      content:
        "Finally, the entity breakdown provides a tabular list grouping your spending by Category (or Payee). Click any row to learn more.",
      placement: "top",
    },
  ],
  "/insights": [
    {
      target: "body",
      content:
        "The Insights page gives you actionable intelligence on your budgets.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-insights-budget",
      content:
        "Here you'll find summarized cards showing how close you are to budget caps.",
      placement: "bottom",
    },
    {
      target: ".tour-insights-trends",
      content:
        "Discover your top spending trends compared to the previous period.",
      placement: "top",
    },
  ],
  "/accounts": [
    {
      target: "body",
      content: "Manage the source of your funds here.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-accounts-list",
      content: "Create new accounts, reconcile balances, and edit details.",
      placement: "bottom",
    },
  ],
  "/categories": [
    {
      target: "body",
      content: "Group your transactions to understand where your money goes.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-categories-list",
      content: "You can rename categories or manage their sub-categories here.",
      placement: "bottom",
    },
  ],
  "/vendors": [
    {
      target: "body",
      content: "Payees keep track of who you interact with.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-vendors-list",
      content: "Clean up, merge, or rename payees to keep your data tidy.",
      placement: "bottom",
    },
  ],
  "/currencies": [
    {
      target: "body",
      content:
        "Multi-currency support allows you to travel and track everything.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-currency-refresh",
      content:
        "Keep your exchange rates up-to-date with one click using live API data.",
      placement: "bottom",
    },
    {
      target: ".tour-currency-add",
      content:
        "Easily search and add a new custom currency along with an exchange rate.",
      placement: "bottom",
    },
    {
      target: ".tour-currency-list",
      content:
        "Manage your active currencies and their individual rates natively here.",
      placement: "top",
    },
  ],
  "/settings": [
    {
      target: "body",
      content:
        "Welcome to the Settings page! Here you can manage your app preferences and data.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-settings-ledger",
      content:
        "Use these controls to modify your active Ledger or create a completely new one.",
      placement: "bottom",
    },
    {
      target: ".tour-settings-currency",
      content: "Set the default currency for your application here.",
      placement: "bottom",
    },
    {
      target: ".tour-settings-ai",
      content: "Configure your AI integrations and keys locally.",
      placement: "top",
    },
    {
      target: ".tour-settings-sync",
      content:
        "Set up Cross-Device Continuity by selecting a synced folder location.",
      placement: "top",
    },
  ],
  "/language": [
    {
      target: "body",
      content:
        "Choose how Vaulted Money speaks to you. Pick your primary language or add a custom translation bundle.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-language-primary",
      content:
        "Select one built-in language as your primary UI language. The interface updates instantly without losing your data.",
      placement: "bottom",
    },
    {
      target: ".tour-language-custom",
      content:
        "Need a locale we do not ship? Add a code, display name, and translation JSON to extend the app.",
      placement: "top",
    },
  ],
  "/scheduled": [
    {
      target: "body",
      content: "Never miss a repeating transaction again.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-scheduled-add",
      content:
        "Add a new recurring transaction or let AI Auto-Schedule based on habits.",
      placement: "bottom",
    },
    {
      target: ".tour-scheduled-list",
      content:
        "Manage, edit, or process recurring transactions early from this list.",
      placement: "top",
    },
  ],

  "/data-management": [
    {
      target: "body",
      content: "You are in full control of your local data.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-data-export",
      content: "Export your ledger to a JSON file or an Encrypted Lock file.",
      placement: "bottom",
    },
    {
      target: ".tour-data-reset",
      content:
        "Need to start over? You can wipe your local database permanently here.",
      placement: "top",
    },
    {
      target: ".tour-data-demo",
      content: "Or generate demo data to safely explore the app's features.",
      placement: "top",
    },
  ],
  "/backup": [
    {
      target: "body",
      content: "Automated backups ensure you never lose your records.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-backup-settings",
      content:
        "Configure daily, weekly, or monthly automatic encrypted backups to your local filesystem. Note: The automated backup feature requires Chrome or a Chromium-based browser supporting the File System Access API.",
      placement: "bottom",
    },
  ],
  "/donate": [
    {
      target: "body",
      content: "This app is open-source and respects your privacy.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-donate-github",
      content: "You can sponsor continuous development via Github Sponsors.",
      placement: "bottom",
    },
    {
      target: ".tour-donate-direct",
      content: "Or make a direct contribution via Revolut or PayPal.",
      placement: "top",
    },
  ],
  "/ai-providers": [
    {
      target: "body",
      content: "Bring Your Own Key (BYOK) for AI analysis.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-ai-byok",
      content:
        "Complete privacy: keys are stored locally so you own them safely.",
      placement: "bottom",
    },
    {
      target: ".tour-entity-actions",
      content:
        "Add new providers, manage existing ones, or import configurations.",
      placement: "bottom",
    },
    {
      target: ".tour-entity-table",
      content:
        "View your AI Endpoints, models, and set your default provider here.",
      placement: "top",
    },
  ],
  "/reports/essential": [
    {
      target: "body",
      content: "Generate powerful tabular reports for your finances.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-report-filters",
      content:
        "Use the filter bar to scope the report to specific dates or accounts.",
      placement: "bottom",
    },
    {
      target: ".tour-report-export",
      content: "Export the generated report as a PDF document seamlessly.",
      placement: "left",
    },
    {
      target: ".tour-report-content",
      content: "Review your detailed categorical breakdown here.",
      placement: "top",
    },
  ],
  "/reports/advanced": [
    {
      target: "body",
      content:
        "Generate advanced analytical reports including cash flow and future projections.",
      placement: "center",
      skipBeacon: true,
    },
    {
      target: ".tour-report-filters",
      content: "Refine your reporting criteria using the filter bar.",
      placement: "bottom",
    },
    {
      target: ".tour-report-export",
      content:
        "Export these advanced reports to PDF to share or store offline.",
      placement: "left",
    },
    {
      target: ".tour-report-content",
      content:
        "Deep dive into your financial flows, limits, and multi-currency metrics.",
      placement: "top",
    },
  ],
};

const normalizeRouteKey = (pathname: string) => {
  if (pathname === "/") return "landing";
  if (pathname === "/dashboard") return "home";
  return pathname.replace(/^\//, "").replace(/\//g, ".");
};

// We can fallback to an empty array for paths that don't have tours
export const getStepsForRoute = (
  pathname: string,
  translate?: TourTranslator,
): Step[] => {
  const routeSteps = TOUR_STEPS[pathname] || [];
  if (!translate) {
    return routeSteps;
  }

  const routeKey = normalizeRouteKey(pathname);
  return routeSteps.map((step, index) => ({
    ...step,
    content: translate(`tour.${routeKey}.${index}.content`, {
      defaultValue: String(step.content),
    }),
  }));
};

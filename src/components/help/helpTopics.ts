/**
 * What the help drawer shows for each screen. Text is translated under
 * `helpDrawer.*` in `src/i18n/areas/helpDrawer.ts`; the English here is the
 * fallback. Each card may point at a section of the User Guide, which the
 * drawer previews in place (offline) with a link to the full guide.
 */

export const USER_GUIDE_URL =
  "https://github.com/nrajesh/vaulted.money/blob/main/documentation/USER_GUIDE.md";

export interface GuideSection {
  /** Heading anchor in USER_GUIDE.md. */
  anchor: string;
  title: string;
  summary: string;
}

export const GUIDE_SECTIONS = {
  core: {
    anchor: "core-concepts",
    title: "Core ideas",
    summary:
      "A ledger is a separate money book. Accounts are where money lives, payees are who it goes to or comes from, and categories say what it was for.",
  },
  transactions: {
    anchor: "transactions",
    title: "Transactions",
    summary:
      "Each transaction has a date, account, payee, category and amount. Spending is stored as a negative amount and income as positive.",
  },
  search: {
    anchor: "searching-and-filtering",
    title: "Searching in plain words",
    summary:
      'Type a sentence such as "groceries over 50 last month". The box lists what it understood, and nothing is applied until you pick it. Every filter you apply must match.',
  },
  csv: {
    anchor: "csv-import",
    title: "Importing bank files",
    summary:
      "Export a CSV file from your bank, then match its columns to date, amount, account, payee and category. Check a few rows afterwards before trusting the reports.",
  },
  budgets: {
    anchor: "budgets-and-reports",
    title: "Budgets and reports",
    summary:
      "Budgets compare your plan with what you actually spent. Reports answer questions like how much you spent this month or whether your savings are growing.",
  },
  ai: {
    anchor: "optional-ai-categorization",
    title: "Optional AI",
    summary:
      "AI can suggest categories using a service you choose and your own key. Only payee names are sent. Your key stays on this device and is never in backups.",
  },
  backups: {
    anchor: "backups",
    title: "Backups",
    summary:
      "Your data lives only on this device, so keep a backup before clearing browser data, switching devices or importing a large file. Encrypt it if it will sit in the cloud.",
  },
  localApi: {
    anchor: "local-api-desktop-app",
    title: "Connecting other apps",
    summary:
      "The Mac app can let AI apps and your own scripts reach your data through a connection that only works on your own computer. It is off until you switch it on.",
  },
  privacy: {
    anchor: "privacy-model",
    title: "Your privacy",
    summary:
      "There is no Vaulted Money account or server. Your data stays on this device unless you export it or switch on an AI feature.",
  },
} satisfies Record<string, GuideSection>;

export type GuideSectionId = keyof typeof GUIDE_SECTIONS;

export interface HelpCard {
  guide: GuideSectionId | null;
  title: string;
  body: string;
}

export const HELP_CARDS = {
  glance: {
    guide: "core",
    title: "Your money at a glance",
    body: "The cards show your balances, recent spending and what's coming up next.",
  },
  search: {
    guide: "search",
    title: "Search in plain words",
    body: 'Try "groceries over 50 last month". Nothing is applied until you pick it.',
  },
  addTransaction: {
    guide: "transactions",
    title: "Add a transaction",
    body: "Use the + button. Pick the account and payee, then the category it was for.",
  },
  importBank: {
    guide: "csv",
    title: "Bring in your bank history",
    body: "Actions, then Import CSV, reads a file exported from your bank.",
  },
  accounts: {
    guide: "core",
    title: "Where your money lives",
    body: "Add each bank account, card and cash wallet. Every transaction belongs to one account.",
  },
  reconcile: {
    guide: null,
    title: "Match your bank's balance",
    body: "If a balance is off, Actions, then Reconcile Balance, adds one adjustment to fix it.",
  },
  setBudget: {
    guide: "budgets",
    title: "Set a limit",
    body: "Create a budget for a category, account or payee and watch how much is left.",
  },
  smartBudget: {
    guide: "budgets",
    title: "Let the app suggest budgets",
    body: "Smart Create looks at your past spending and suggests realistic limits.",
  },
  calendar: {
    guide: "budgets",
    title: "Read the calendar",
    body: "Each day shows money in and out. Open a day to see the transactions behind it.",
  },
  repeats: {
    guide: "transactions",
    title: "Add it once, it repeats",
    body: "Set how often a bill or payday repeats. Auto-Schedule can find them in your history.",
  },
  reports: {
    guide: "budgets",
    title: "Simple or Detailed",
    body: "Simple reports answer everyday questions; Detailed ones break things down further. Both export to PDF, Excel or CSV.",
  },
  insights: {
    guide: "budgets",
    title: "Plan versus reality",
    body: "See which budgets are on track and where most of your money went.",
  },
  charts: {
    guide: "search",
    title: "Chart just what you need",
    body: 'Pick dates, or type a search like "dining this year", to focus the charts.',
  },
  categories: {
    guide: "core",
    title: "Categories and sub-categories",
    body: "Group spending like Food, then Groceries. Renaming one updates every transaction that uses it.",
  },
  payees: {
    guide: "core",
    title: "Keep payees tidy",
    body: 'Merge duplicates like "Starbucks" and "STARBUCKS #12" so your reports add up.',
  },
  aiOptional: {
    guide: "ai",
    title: "AI is optional",
    body: "Nothing is sent until you switch AI on and set it up. You can turn it off at any time.",
  },
  connectApps: {
    guide: "localApi",
    title: "Use Claude or ChatGPT",
    body: "In the Mac app, connect an AI app and ask questions about your money in that app.",
  },
  demo: {
    guide: "core",
    title: "Try it with demo data",
    body: "Generate demo data to explore every feature with sample numbers. Reset clears everything.",
  },
  backup: {
    guide: "backups",
    title: "Back up before big changes",
    body: "Your data lives only on this device. Save a copy before switching devices or reinstalling.",
  },
  currencies: {
    guide: "core",
    title: "More than one currency",
    body: "Add the currencies you use. Totals convert using the rates on this page.",
  },
  ledgers: {
    guide: "core",
    title: "One ledger per set of books",
    body: "Keep Home, Business or Travel apart. Each ledger has its own accounts and budgets.",
  },
  privacy: {
    guide: "privacy",
    title: "Your data stays here",
    body: "No account, no server. Nothing leaves this device unless you export it or switch on AI.",
  },
} satisfies Record<string, HelpCard>;

export type HelpCardId = keyof typeof HELP_CARDS;

/**
 * Cards per screen, matched in order. A path ending in "/*" matches the
 * section and everything under it.
 */
const SCREEN_CARDS: Array<{ paths: string[]; cards: HelpCardId[] }> = [
  { paths: ["/dashboard"], cards: ["glance", "search"] },
  {
    paths: ["/transactions"],
    cards: ["addTransaction", "search", "importBank"],
  },
  { paths: ["/accounts"], cards: ["accounts", "reconcile"] },
  { paths: ["/budgets"], cards: ["setBudget", "smartBudget"] },
  { paths: ["/calendar"], cards: ["calendar", "repeats"] },
  { paths: ["/scheduled"], cards: ["repeats", "calendar"] },
  { paths: ["/reports/*"], cards: ["reports", "search"] },
  { paths: ["/insights"], cards: ["insights", "setBudget"] },
  { paths: ["/analytics"], cards: ["charts", "search"] },
  { paths: ["/categories"], cards: ["categories"] },
  { paths: ["/vendors"], cards: ["payees"] },
  {
    paths: ["/ai-providers", "/connect-agent"],
    cards: ["aiOptional", "connectApps"],
  },
  { paths: ["/data-management"], cards: ["demo", "backup"] },
  { paths: ["/backup"], cards: ["backup"] },
  { paths: ["/currencies"], cards: ["currencies"] },
  { paths: ["/ledgers"], cards: ["ledgers", "demo"] },
];

const FALLBACK_CARDS: HelpCardId[] = ["privacy", "ledgers"];

const matches = (pattern: string, pathname: string) =>
  pattern.endsWith("/*")
    ? pathname.startsWith(pattern.slice(0, -1))
    : pathname === pattern;

export const helpCardsForPath = (pathname: string): HelpCardId[] =>
  SCREEN_CARDS.find(({ paths }) =>
    paths.some((pattern) => matches(pattern, pathname)),
  )?.cards ?? FALLBACK_CARDS;

export const guideUrl = (section: GuideSectionId) =>
  `${USER_GUIDE_URL}#${GUIDE_SECTIONS[section].anchor}`;

/** Sample questions for the Ask AI tab (helpDrawer.ask.q1..q5). */
export const SAMPLE_QUESTIONS = [
  {
    key: "helpDrawer.ask.q1",
    text: "What did I spend on eating out last month?",
  },
  {
    key: "helpDrawer.ask.q2",
    text: "Which subscriptions do I pay for, and what do they cost a year?",
  },
  { key: "helpDrawer.ask.q3", text: "Am I over budget anywhere this month?" },
  {
    key: "helpDrawer.ask.q4",
    text: "Which bills are due before my next payday?",
  },
  {
    key: "helpDrawer.ask.q5",
    text: "How has my spending changed since last month?",
  },
] as const;

/**
 * Short, plain-language tips for features a newcomer may not understand
 * without help. Text lives in `src/i18n/areas/plainLanguage.ts` under
 * `hints.<id>`; the English here is only the fallback.
 */
export const FEATURE_HINTS = {
  ledger: {
    title: "What's a ledger?",
    body: "A ledger is a separate set of books, like Home or a side business. Each one has its own accounts, budgets and transactions.",
  },
  reconcile: {
    title: "Balance not matching your bank?",
    body: "Open Actions, then Reconcile Balance, and enter what your bank shows. The app adds one adjustment so the two agree.",
  },
  transfers: {
    title: "Money moved between your accounts",
    body: "Moving money between your own accounts is a transfer, not spending. Actions, then Detect Transfers, pairs them so your totals stay right.",
  },
  scheduled: {
    title: "How upcoming bills work",
    body: "Add a bill, payday or transfer once and say how often it repeats. It then shows on the Calendar and in forecasts. Auto-Schedule can find repeats for you.",
  },
  connectApps: {
    title: "Ask other AI apps about your money",
    body: "In the desktop app you can let Claude, ChatGPT and similar apps read and update your data. It stays off until you switch it on, and what they read goes to that app's maker.",
  },
} as const;

export type FeatureHintId = keyof typeof FEATURE_HINTS;

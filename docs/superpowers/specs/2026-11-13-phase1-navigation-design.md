# Phase 1 — Unified navigation and page action bars

Part 1 of the pre-store UX polish (navigation → wording → help drawer → store audit).

## Why

Before App Store / Play Store submission, newcomers must find their way by intent, not by how the app is built. Menus are currently three hand-written copies with drifting labels and active states, and page action bars on phones are cluttered.

## Goals

- One navigation config feeds the desktop sidebar and the phone bottom bar.
- Groups by intent: **Everyday** (Overview, Transactions, Accounts, Budgets), **Plan & understand** (Calendar, Upcoming bills, Reports › Simple/Detailed, Spending insights, Charts), **Organise** (Categories, Payees), **AI & connections** (AI assistant, Connect other AI apps — desktop bridge only), **More options**, folded by default (Currencies, Import & clean up, Backup, Language, Settings, Support the project — not on native).
- Phone bottom bar: Overview · Transactions · Accounts · Budgets · More. "More" shows as active when the current page is not one of the four.
- One active-state rule (`isNavItemActive`) shared by every menu; Reports parent active on both report pages. "AI assistant" and "Connect other AI apps" are separate items, each active on its own page.
- Renames (owner-approved): Dashboard→Overview, Vendors→Payees (nav label), Essential/Advanced→Simple/Detailed, Scheduled→Upcoming bills, Insights→Spending insights, Analytics→Charts, Data→Import & clean up.
- Page action bars (Transactions, Accounts/Categories/Payees, Budgets, Upcoming bills): one shared `PageActionBar` — primary action button + an `Actions ▾` menu holding secondary utilities (reconcile, de-duplicate, clean up, detect transfers, categorise missing, import/export CSV, smart create, refresh). Shared spacing and 44px-tall buttons.
- On Transactions the page "Add transaction" button hides below `md`, because the floating + button does the same thing. Other pages keep their primary button, since the floating + adds a transaction, not an account or budget.

## Non-goals

- No URL changes, no home page changes, no change to demo onboarding.
- Page titles/subtitles and help copy are Phase 2. The tour is demoted in Phase 3.

## Approaches

1. **Shared config + render helpers (chosen):** a typed `navConfig.ts`, rendered by the sidebar and bottom bar. Lowest risk; keeps shadcn sidebar.
2. Keep separate menus, just fix labels: cheap but drifts again.
3. New navigation component library: overkill before submission.

## Builder's calls

- New translation keys live under `nav.*` in a new `src/i18n/areas/navigation.ts` (existing `layout.nav.*` keys in `resources.ts` win over area modules, so renames need new keys).
- Unused `src/components/layout/Header.tsx` and `src/components/navigation/MobileNavContent.tsx` are deleted.
- `Actions ▾` is used at every width for consistency (my call; desktop loses one click for rare utilities).
- Tour steps that targeted moved buttons point at the Actions menu instead.

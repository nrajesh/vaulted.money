# User Guide

This page explains Vaulted Money as an app, not as a code project.

## Core Concepts

| Term | Meaning |
| --- | --- |
| Ledger | A separate money book, such as Personal, Business, or Joint. |
| Transaction | One money event: income, expense, or transfer. |
| Account | Where money lives, such as checking, savings, cash, or credit card. |
| Payee or vendor | Who the money went to or came from. |
| Category | What the money was for. |
| Budget | A limit, goal, or plan for a category over time. |
| Backup | A file copy of your local data. |

## Basic Flow

1. Create a ledger.
2. Add accounts.
3. Add transactions manually or import a CSV.
4. Categorize transactions.
5. Create budgets.
6. Review dashboard, analytics, reports, and trends.
7. Export backups regularly.

## Ledgers

Use ledgers when you want clean separation. For example:

- Personal spending
- Family or joint expenses
- Freelance or business finances
- A travel budget

Each ledger can have its own currency, accounts, transactions, budgets, and reports.

## Transactions

Transactions are the heart of the app. A useful transaction usually has:

- Date
- Account
- Payee or vendor
- Category
- Amount
- Optional remarks

Expenses are stored as negative amounts. Income is stored as positive amounts.

## Searching And Filtering

The search box above your transactions, on the Dashboard, Analytics, Reports and Scheduled screens, understands plain sentences. Type what you want and the box lists what it understood, for example:

- `groceries over 50 last month`
- `starbuks expenses since 2020` (typos are fine)
- `between 2025 jul and sep`, `2 weeks from today`, `in 3 months`
- `€100`, `between 10 and 20`, `top 5 expenses`, `the largest expense coming up in next 2 weeks in checking account`

Each understood piece is its own row with an icon: date, amount, income or expense, account, category, vendor and leftover text. Pick one to apply it, and the others stay on offer until you press **Done** or **Clear**. **Apply all** takes whatever is left. Applied filters show as chips under the box; click a chip to remove it. Nothing is applied until you pick it.

Naming an account ("in checking account") narrows the search to that account instead of adding it to the accounts the page already has selected; naming a second account adds it. "Largest" or "smallest" with no number means just one.

How filters combine: **a transaction must match every filter you apply** (for example the vendor *and* the date). Several of the same kind, such as two vendors, match either. The box does not read "or" between different kinds of filter.

Names match singular and plural ("grocery" finds Groceries) and tolerate small typos; a name matched that way is marked "matched ...". If you press Enter without choosing, **Search Text** looks for your words in the vendor, category, account and remarks.

The Accounts list has its own search with the same reading: `negative`, `savings`, `over 1000`, `between 100 and 500`, or part of a name.

## CSV Import

Use CSV import when you already have bank history. The app lets you map CSV columns to fields like date, amount, account, vendor, category, and notes.

After importing, check a few rows manually so you trust the mapping before making decisions from the reports.

## Budgets And Reports

Budgets help you compare your plan with your actual spending. Reports help you answer questions like:

- How much did I spend this month?
- Which categories changed over time?
- What is my net worth?
- How much income came in?
- Are savings improving or shrinking?

## Optional AI Categorization

Vaulted Money can use a provider you configure to help categorize transactions. This is bring-your-own-key: you choose the provider and enter your own API key.

Supported provider types include Gemini, OpenAI, Anthropic, Mistral, Perplexity, and custom OpenAI-compatible endpoints.

API keys stay local and are not exported in backups. You must re-enter keys on a new device.

The **AI & agents** page has a master **AI features** switch and two tabs: **AI Providers** and **Connect agent**. Connecting an agent (Claude, Codex, a local model) needs the desktop app, so on the web the second tab is greyed out and says so.

## Backups

Because Vaulted Money is local-first, backups matter.

Use backup exports before:

- Clearing browser data
- Switching devices
- Reinstalling the app
- Trying a major upgrade
- Importing a large CSV

Encrypted backups are recommended when the file may live in cloud storage or on a shared computer.

## Local API (Desktop App)

The desktop app can run a local API so you can manage your data with scripts, Postman or your own interface instead of the GUI. It is off by default. Turn it on in Settings, copy the token, and see [API.md](API.md) and [API_COOKBOOK.md](API_COOKBOOK.md) for what you can do. It only accepts connections from your own computer and is not available in the web or mobile apps.

## Privacy Model

By default, Vaulted Money stores data locally in browser storage or the Electron app's local storage. There is no hosted Vaulted Money account and no central Vaulted Money server.

The Local API (desktop app, off by default) listens only on your own computer.

The main exception is optional AI categorization. If you configure and use it, relevant categorization data is sent to your selected AI provider.

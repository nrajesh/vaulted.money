# Local REST API

Vaulted Money's desktop app can expose its data over a local HTTP API, so scripts and tools on the same computer can manage ledgers, transactions and settings, and generate reports and backups.

- **Desktop (Electron) only.** The web and mobile builds have no process that can listen on a socket.
- **Off by default.** Turn it on in **Settings → Local API**.
- **The app must be running.** Closing the window only hides it, so the API keeps working until you quit the app.
- **Local-first.** The server binds to `127.0.0.1` and is never reachable from the network. No data leaves the device.

## Quick start

1. Open **Settings**, scroll to the **Local API** card (below Cross-Device Continuity, above About), switch it on, and copy the token. The card appears in every build, but it only has controls in the desktop app.
2. Call it:

```bash
export VM_TOKEN="<token from settings>"
export VM="http://127.0.0.1:47821/api/v1"

curl -H "Authorization: Bearer $VM_TOKEN" $VM/ledgers
curl -H "Authorization: Bearer $VM_TOKEN" $VM            # list every endpoint
```

`GET /api/v1` returns the full, current route table, and `GET /api/v1/openapi.json` an [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) description generated from the code (request bodies included), so they are always the authoritative reference.

Want a local AI agent (LM Studio, Claude Code) to use it? See the [MCP server](../mcp/README.md): eight small tools instead of 99, with previews before anything changes.

Prefer a GUI? A ready-made [Postman collection](postman/README.md) covers every endpoint. Building your own app or scripts? See the [API cookbook](API_COOKBOOK.md) and the machine-readable spec at `GET /api/v1/openapi.json`.

## Conventions

| | |
|---|---|
| Base URL | `http://127.0.0.1:<port>/api/v1` (default port `47821`) |
| Auth | `Authorization: Bearer <token>` on every request |
| Bodies | JSON (`Content-Type: application/json`) |
| Lists | `{ "data": [...] }`, transactions add `total`, `limit`, `offset` |
| Errors | `{ "error": { "code", "message", "details?" } }` with 400/401/403/404/405/409/413/502/503/504 |
| Deletes | `204 No Content` |
| Downloads | `Content-Disposition: attachment` (see below) |

Ledger data is addressed explicitly (`/ledgers/{ledgerId}/...`); the API never depends on which ledger is open in the UI. The open UI is refreshed after each change made through the API.

## Endpoints

### Ledgers
| | |
|---|---|
| `GET /ledgers` · `POST /ledgers` | list · create `{name, currency, short_name?, icon?}` |
| `GET/PATCH/DELETE /ledgers/{id}` | read · update · delete **with all its data** |

### Accounts
Under `/ledgers/{ledgerId}/accounts`. Accounts include a `balance` (starting balance plus transactions dated today or earlier, in the account's currency).

| | |
|---|---|
| `GET` · `POST` | list · create `{name, currency, starting_balance?, type?, credit_limit?, remarks?}` |
| `GET/PATCH/DELETE /{accountId}` | Renames and currency changes propagate to the account's transactions. Deleting keeps transactions. |

`type` is one of `Checking`, `Savings`, `Credit Card`, `Investment`, `Other`.

### Vendors
Under `/ledgers/{ledgerId}/vendors`.

| | |
|---|---|
| `GET` · `POST` | list (`?include_accounts=true` to include accounts) · create `{name}` |
| `GET/PATCH/DELETE /{vendorId}` | Rename propagates to transactions, scheduled transactions and budgets. |
| `POST /merge` | `{target, sources: [...]}`: re-point transactions, delete sources |

### Categories and sub-categories
Under `/ledgers/{ledgerId}/categories`.

| | |
|---|---|
| `GET` · `POST` | list with nested `sub_categories` · create `{name, sub_categories?: [...]}` |
| `GET/PATCH/DELETE /{categoryId}` | Rename propagates. Delete also removes sub-categories and budgets for the category. |
| `POST /merge` | `{target, sources: [...]}` |
| `GET` · `POST /{categoryId}/sub-categories` | list · create `{name}` |
| `PATCH/DELETE /{categoryId}/sub-categories/{subId}` | Delete clears the tag on transactions and removes budgets scoped to it. |

### Transactions
Under `/ledgers/{ledgerId}/transactions`.

| | |
|---|---|
| `GET` | Filters: `from`, `to` (`YYYY-MM-DD`), `account`, `vendor`, `category`, `sub_category`, `min_amount`, `max_amount`, `type=income\|expense`, `search`, `exclude_transfers`, `limit` (default 100, max 1000), `offset` |
| `POST` | `{date, amount, account, vendor, category, sub_category?, remarks?, currency?}`. Negative amounts are expenses. `currency` defaults to the account's. Unknown accounts, vendors and categories are created, as in the UI. |
| `POST /bulk` | `{transactions: [...]}` (up to 1000) |
| `POST /transfer` | `{from_account, to_account, amount, date, to_amount?, remarks?}`: two linked legs. `to_amount` is required when the currencies differ. |
| `DELETE /transfer/{transferId}` | delete both legs |
| `GET/PATCH/DELETE /{transactionId}` | |

### Recurring (scheduled) transactions
Under `/ledgers/{ledgerId}/scheduled-transactions`.

| | |
|---|---|
| `GET` · `POST` | list · create `{date, amount, account, vendor, category, frequency, sub_category?, end_date?, remarks?, currency?, ignored_dates?}` |
| `GET/PATCH/DELETE /{scheduledId}` | Deleting a schedule keeps the transactions it already created. |
| `POST /{scheduledId}/skip` | `{date}`: skip one occurrence |

- `date` is the **next** occurrence. The app turns due schedules into real transactions itself, whenever it is running, exactly as for schedules created in the UI.
- `frequency`: `Daily`, `Weekly`, `Monthly`, `Yearly`, `One-time`, or a duration like `2w` (`d`, `w`, `m`, `y`).
- Accounts, vendors and categories that do not exist yet are created; `currency` defaults to the account's.

### Budgets
Under `/ledgers/{ledgerId}/budgets`. Responses include the computed `spent_amount`.

`POST` body: `{budget_scope?, category?, sub_category?, scope_name?, target_amount, currency?, frequency?, start_date?, end_date?, is_active?, is_goal?, target_date?, monthly_contribution?, goal_context?, account_scope_values?}`

- `budget_scope`: `category` (default), `sub_category`, `account`, `vendor`.
- `category` scope needs an existing `category` (and optionally `sub_category`); the other scopes need `scope_name`.
- `frequency`: `Monthly` (default), `Quarterly`, `Yearly`, `One-time`, or a duration such as `3m`.

`GET/PATCH/DELETE /{budgetId}`.

### Currencies
| | |
|---|---|
| `GET /currencies` · `POST /currencies` | list with rates · add `{code, name, symbol, rate}` (rate is relative to USD) |
| `GET/PATCH/DELETE /currencies/{code}` | `PATCH {name?, symbol?, rate?}`. The base currency cannot be deleted. |
| `PUT /currencies/base` | `{code}` |
| `POST /currencies/refresh-rates` | Fetch the latest rates from Frankfurter. This is the only call that contacts the internet, and it does so exactly as the Currencies page does. |

### AI providers
| | |
|---|---|
| `GET` · `POST /ai-providers` | `{name, type, baseUrl, model?, description?, isDefault?, api_key?}` |
| `GET/PATCH/DELETE /ai-providers/{id}` | |
| `PUT /ai-providers/{id}/default` | |
| `PUT/DELETE /ai-providers/{id}/api-key` | `{api_key}` |

API keys are **write-only**: responses report `has_api_key` but never the key. They stay on the device and are never included in backups.

### Languages
| | |
|---|---|
| `GET /languages` | available languages and the current one |
| `PUT /languages/current` | `{code}` |
| `POST /languages/custom` · `DELETE /languages/custom/{code}` | `{code, name, translations}` |

### Backups
| | |
|---|---|
| `GET /backups/export` | Download an unencrypted backup. `?ledger_id=` limits it to one ledger. |
| `POST /backups/export` | `{ledger_id?, password?}`. With a password the download is an encrypted `.lock` file. |
| `POST /backups/import` | Restore. **Destructive**: see below. |
| `GET /backups/schedules` | scheduled backup configurations (no secrets) |
| `PATCH/DELETE /backups/schedules/{id}` | `{is_active?, frequency_ms?}` |

Restoring **replaces** existing data (everything, or the target ledger with `ledger_id`), so `confirm_replace: true` is required. Body: either `content` (the backup file text) or `backup` (a parsed object), plus `password` for encrypted files and `force: true` to accept a backup from a different app/schema version. The UI reloads after a restore.

Passwords are never accepted in the URL; use `POST` for encrypted exports.

### Maintenance (the clean-up buttons)
API versions of the maintenance buttons in the app. **Every operation that changes data accepts `dry_run: true` to preview it, and deletions also need `confirm_delete: true`.** Do the dry run first, read the result, then repeat without it.

| App button | Endpoint | Body |
|---|---|---|
| Transactions → **Detect Transfers** | `POST /ledgers/{id}/transactions/detect-transfers` | `{dry_run?}` |
| Transactions → **Cleanup Duplicates** | `POST /ledgers/{id}/transactions/cleanup-duplicates` | `{dry_run?, confirm_delete?}` |
| Transactions → **Categorize Missing** | `POST /ledgers/{id}/transactions/categorize-missing` | `{dry_run?, use_ai?}` |
| Accounts → **Reconcile Balance** | `POST /ledgers/{id}/accounts/reconcile` | `{adjustments:[{account, actual_balance}], date?, dry_run?}` |
| Accounts / Vendors / Categories → **De-duplicate** | `GET …/accounts\|vendors\|categories/duplicates` (suggestions), then `POST …/accounts/merge`, `…/vendors/merge`, `…/categories/merge` | `{target, sources:[…]}` |
| Vendors / Categories → **Cleanup Unused** | `GET …/vendors\|categories/unused`, then `POST …/vendors\|categories/cleanup` | `{ids?, dry_run?, confirm_delete?}` |

How each behaves:

- **Detect Transfers** pairs transactions on different accounts, at most one day apart, that cancel out in the same currency or look like a transfer (swapped account/vendor, both `Transfer`, or both vendors mentioning transfer). It links them with a shared `transfer_id`. The same code runs behind the app's button.
- **Cleanup Duplicates** removes extra copies of a recurring transaction created twice on the same day, keeping the oldest.
- **Categorize Missing** gives uncategorized transactions the category last used with the same vendor. **AI is opt-in:** with `use_ai: true` it also asks your default AI provider about vendors with no history. That sends vendor names (never amounts) to the provider and fails with `400 ai_not_configured` if no provider and key are set. The default is `false`, so nothing leaves the device unless you ask.
- **Reconcile Balance** compares the real balance you give with the app's balance (as of `date`, default today) and creates one `Balance Adjustment` transaction (category `Adjustment`) for the difference. Accounts that already match are left alone.
- **Duplicate suggestions** group names that are identical after ignoring case, accents, punctuation and spacing, and suggest which to keep. (The app makes you pick duplicates by hand; the merge itself is the same.)
- **Unused** is stricter than the app: a vendor or category counts as unused only if no transaction, recurring transaction or budget refers to it, so cleanup never silently deletes schedules or budgets. `Others` and `Transfer` are never listed. `ids` may only name currently-unused entries.

### CSV import and export
Exactly the formats of the app's **Import CSV / Export CSV** buttons, so files move freely between the app and the API.

| | Export | Import (body `{csv, dry_run?}`) |
|---|---|---|
| Transactions | `GET /ledgers/{id}/transactions/export` (same filters as the list; `?delimiter=,`) | `POST …/transactions/import` also takes `delimiter?` and `detect_transfers?` (default true) |
| Accounts | `GET …/accounts/export` | `POST …/accounts/import` |
| Vendors | `GET …/vendors/export` | `POST …/vendors/import` |
| Categories | `GET …/categories/export` | `POST …/categories/import` |

- Transaction files use `;` as the delimiter and `DD/MM/YYYY` dates, with the columns `Date;Account;Vendor;Category;Amount;Remarks;Currency;transfer_id;is_scheduled_origin;Frequency;End Date`. Accounts are `Account Name,Currency,Starting Balance,Remarks`; vendors `Vendor Name`; categories `Category Name,Sub Category Name`.
- Imports create missing accounts, vendors and categories, never overwrite existing ones, and report `imported`/`created`, `already_existed` and skipped row numbers. Use `dry_run` to validate a file first.
- Exports escape cells starting with `=`, `+`, `-` or `@` so spreadsheets do not run them as formulas.
- CSV is for spreadsheets and bank exports. For a complete, lossless copy (budgets, schedules, sub-category tags, settings) use [Backups](#backups).

### Settings
`GET /settings` and `PATCH /settings`: the Settings page as one resource.

| Field | Settings page | Notes |
|---|---|---|
| `base_currency` | Default Currency | Must be an active currency with a rate |
| `language` | Language | Built-in or custom language code |
| `future_months` | Future Transactions | Whole number 0–120 |
| `default_ai_provider_id` | Default AI Provider | A provider id, or `null` for **None (Disabled)** |

Send any subset; all values are validated first, so a bad value changes nothing. Per-ledger settings (name, currency, icon) are on `/ledgers/{id}`. *Cross-Device Continuity* needs an operating-system folder grant, so it can only be set up in the app.

## Generating analytics, insights and reports

These are computed on demand from the ledger's data. Every one accepts the same output options:

- default: JSON in the response body
- `?download=true`: the same JSON as a file
- `?format=csv`: a flat CSV table as a file (spreadsheet formula prefixes in user data are escaped)

| | |
|---|---|
| `GET /ledgers/{id}/analytics` | `from`, `to`, `group_by=day\|week\|month` (default `month`), `currency`, `include_transfers`. Totals, spend by category/vendor/account, and a time series. Future-dated transactions are excluded. |
| `GET /ledgers/{id}/insights` | Budget health (`good`/`warning`/`critical`) and the biggest vendor-spending and account-activity changes over the latest 30 days versus the 30 before. |
| `GET /reports` | report types |
| `GET /ledgers/{id}/reports/{type}` | `income-expense`, `net-worth` (`to` = as-of date), `trends` (monthly series). Accept `from`, `to`, `currency`. |

`currency` defaults to the ledger's currency; amounts are converted with the exchange rates stored in the app.

```bash
curl -H "Authorization: Bearer $VM_TOKEN" -OJ \
  "$VM/ledgers/$LEDGER/reports/income-expense?from=2026-01-01&format=csv"

curl -H "Authorization: Bearer $VM_TOKEN" -X POST -OJ \
  -H "Content-Type: application/json" -d '{"password":"correct horse battery"}' \
  $VM/backups/export
```

## Security model

The API can read and change all financial data, so it is locked down:

- **Opt-in and loopback-only.** Disabled until enabled in Settings; listens on `127.0.0.1` only.
- **Bearer token.** 256 random bits, compared in constant time, stored in `api-config.json` in the app's user-data folder with owner-only permissions. Regenerate it any time from Settings; the old token stops working immediately.
- **No browser access.** Requests carrying an `Origin` header are refused (no CORS), and the `Host` header must be loopback plus the configured port, which blocks DNS-rebinding attacks. Use `curl`, scripts or other non-browser clients.
- **Bounded input.** Request bodies are capped at 64 MiB and validated before use.
- **Secrets stay local.** AI API keys are never returned; backup passwords are never accepted in a URL.

Anything running as your user on the same computer can read the token file, so treat the API like any other local credential.

## Limitations

- Desktop only, and only while the app is running.
- Scheduled-backup folders must be chosen in the app (they need an OS folder grant), so the API can pause, resume, retime and remove schedules but not create them.
- Only one app instance serves the API; if the port is taken, pick another in Settings.
- Cross-Device Continuity (shared sync folder) can only be configured in the app.
- AI-based categorization needs a default AI provider and key in the app (the API never returns keys).

## How it works

```
curl ──HTTP──▶ electron/apiServer.ts ──IPC──▶ src/api/ApiBridge.tsx ──▶ src/api/* ──▶ DataProvider ──▶ IndexedDB
 (auth, framing, limits)            (renderer owns the data)      (router, validation, calculations)
```

Any change to what the API exposes must also update the tests, this document and the [Postman collection](postman/README.md); `src/api/postmanCoverage.test.ts` enforces the collection part.

IndexedDB lives in the renderer, so the main process only owns the socket and security, and relays each authorised request to the renderer. `src/api` is transport-agnostic and fully unit-tested against the real Dexie provider; add an endpoint by adding a `RouteDef` to the relevant file in `src/api/routes/`.

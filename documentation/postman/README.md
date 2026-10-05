# Testing the Local API with Postman

This folder contains a ready-made Postman collection that exercises every endpoint of the [Local API](../API.md), with assertions on status codes and response contents.

| File | Purpose |
|---|---|
| `vaulted-money-local-api.postman_collection.json` | 202 requests in 18 folders, with tests |
| `vaulted-money-local-api.postman_environment.json` | `baseUrl` and `token` variables |

You do not need a Postman account or any special permissions. The API only listens on your own computer.

## Setup (about 2 minutes)

1. **Run the desktop app.** The Local API does not exist in the web or mobile builds. For development: `pnpm electron`.
2. **Enable the API.** Open **Settings → Local API**, switch it on, and copy the **access token**. Note the port (default `47821`).
3. **Import into Postman.** Use **Import** and select both JSON files in this folder.
4. **Select the environment.** Pick **Vaulted Money Local API (local)** in the top-right environment dropdown.
5. **Set the variables** (environment → *Current value*):
   - `token`: paste the token from Settings.
   - `baseUrl`: change only if you changed the port, e.g. `http://127.0.0.1:50000/api/v1`.
6. **Smoke test.** Send *00 Smoke and security → Health*. You should get `200 {"status":"ok"}` and a passing test. A `401` means the token is wrong; a connection error means the API is off or the port differs.

Use *Current value* for the token so it stays on your machine and is not synced to Postman's cloud.

## Running the suite

Open the collection → **Run** (Collection Runner), keep the order, and run.

- Folders `00`–`15` are the safe flow, then `98 Cleanup`. Requests depend on earlier ones (for example, the ledger created in `01` is used everywhere), so run them in order. Individual requests can be re-sent, but if a folder fails midway, re-run from `01`.
- **Untick `99 Optional (changes your settings)`** unless you want those side effects (it overwrites your stored exchange rates from the internet).
- A passing run is 200 requests (everything except the two in `99`) with 545 assertions and no failures.

### What it touches in your real app

The suite is built so it can run against an app with real data:

| Area | Behaviour |
|---|---|
| Ledgers, accounts, transactions, budgets, etc. | All created inside a throwaway ledger, **Postman Test Ledger**, which `98 Cleanup` deletes. Your own ledgers are never touched. |
| Currencies | Adds and removes a made-up `ZZZ` currency. Base currency and rates are unchanged. |
| Languages | Sets the language to the one already active; adds and removes a custom `pmx` language. |
| AI providers | Creates and deletes a throwaway provider. The default provider is unchanged. |
| Backups | Exports are read-only. Restores use `ledger_id`, so they replace **only the test ledger**. |
| Settings | Folder 15 changes future months and restores whatever it found. |
| AI categorization | `use_ai` is never sent, so nothing is sent to an AI provider. |

Even so, run it against a **backup-protected** install the first time: use *Backups → Export everything* (or the in-app backup) first. If a run is interrupted, delete any leftover **Postman Test Ledger** from the app, and remove the `ZZZ` currency if it appears.

The app UI refreshes during the run and reloads once at the end (deleting a ledger triggers a reload).

## How the collection is organised

| Folder | Covers |
|---|---|
| 00 Smoke and security | health, endpoint index, OpenAPI document, missing/wrong token (401), browser `Origin` (403), 404/405 |
| 01 Ledgers · 02 Accounts · 03 Vendors · 04 Categories | CRUD, renames, merges, conflict (409) and validation (400) cases |
| 05 Transactions | create, bulk, linked transfers, every filter, pagination, balance arithmetic |
| 06 Recurring transactions | CRUD, skip an occurrence, invalid frequency |
| 07 Budgets · 08 Currencies · 09 Languages · 10 AI providers | CRUD plus checks that API keys are never echoed |
| 11 Analytics, insights and reports | JSON, CSV and file downloads, currency conversion, error cases |
| 12 Backups | plain and encrypted export, restore round-trips, wrong password, missing confirmation |
| 13 Maintenance | Detect Transfers, Cleanup Duplicates, Categorize Missing, Reconcile Balance, de-duplicate and cleanup-unused for accounts, vendors and categories, each as dry run → confirm |
| 14 CSV import and export | all four CSV exports, imports into a second throwaway ledger, dry runs, malformed files |
| 15 Settings | read, change and restore the global settings; atomic failure |
| 98 Cleanup | deletes the test ledger |
| 99 Optional | refresh exchange rates, set base currency |

Authentication is set once on the collection (**Authorization → Bearer Token → `{{token}}`**), so every request inherits it. IDs created along the way (`ledgerId`, `accountId`, …) are saved to collection variables by each request's test script; the dates (`today`, `monthStart`, `nextMonth`) are computed by a collection-level pre-request script. You never need to type these.

## Downloads in Postman

Analytics, insights, reports and backups return files when you use `format=csv` or `download=true`, or any backup export. Postman shows the body in the response pane; use **Save Response → Save to a file** to keep it. From the command line, `curl -OJ` saves with the server's filename.

## Running from the command line (optional)

With [Newman](https://github.com/postmanlabs/newman) (Postman's CLI runner):

```bash
npx newman run vaulted-money-local-api.postman_collection.json \
  -e vaulted-money-local-api.postman_environment.json \
  --env-var token=<your token> \
  --folder "00 Smoke and security" --folder "01 Ledgers" --folder "02 Accounts" \
  --folder "03 Vendors" --folder "04 Categories and sub-categories" --folder "05 Transactions" \
  --folder "06 Recurring (scheduled) transactions" --folder "07 Budgets" --folder "08 Currencies" \
  --folder "09 Languages" --folder "10 AI providers" --folder "11 Analytics, insights and reports" \
  --folder "12 Backups" --folder "98 Cleanup"
```

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Could not get any response` / ECONNREFUSED | The app is not running, the API is off, or the port differs from `baseUrl`. |
| Everything returns `401` | `token` is empty or stale. Copy it again, or after *Generate new token* update the environment. |
| `403 forbidden_origin` on normal requests | Something added an `Origin` header. Remove it; only the *Browser Origin* test should send one. |
| `403 forbidden_host` | `baseUrl` uses a hostname other than `127.0.0.1`/`localhost`. |
| `503 ui_not_ready` | The app window is still loading; retry in a moment. |
| Variable shows as `{{ledgerId}}` in a URL | `01 Ledgers → Create ledger` did not run or failed; run it first. |
| Many failures in `05` after a partial earlier run | Leftover data from an interrupted run. Delete the **Postman Test Ledger** in the app and start from `01`. |

## Keeping the collection up to date

Every request has a description (the matching button in the app, a body example, notes) and, where small, a saved example response captured from a real run, so the collection doubles as documentation. The collection is part of the API contract. Whenever anything an API entity exposes changes, update the matching requests **and their test assertions** in the same change, then update [API.md](../API.md). The full checklist is in [`documentation/CLAUDE.md`](../CLAUDE.md#local-api-changes).

This is enforced: `src/api/postmanCoverage.test.ts` (part of `pnpm test`) fails when

- a route in the API has no request in the collection, or
- a request in the collection calls a route that no longer exists.

Coverage is only half of it: `src/api/postmanRun.test.ts` (also part of `pnpm test`) **runs the whole collection with Newman** against the real server, router and database code and fails on any failed assertion, so a behaviour change that breaks an assertion cannot be merged. The collection file is edited directly (it is the source of truth; there is no generator).

To refresh the saved example responses after changing response shapes:

```bash
POSTMAN_REPORT=/tmp/run.json pnpm vitest run src/api/postmanRun
node scripts/postman-add-examples.mjs /tmp/run.json
``` Conventions to keep:

- Work inside the throwaway ledger and clean up after yourself; restore any global setting a request changes.
- Save created ids with `pm.collectionVariables.set(...)` and reuse them as `{{variables}}`.
- Give every request a `Status code is N` test, check `Content-Type` for JSON, and assert the important fields with `pm.expect(...)`.
- Never assert on data the suite did not create (the collection must pass on an empty install).
- Negative tests that deliberately hit a non-existent route (405/404 checks) go in the `NEGATIVE_TESTS` allowlist in `postmanCoverage.test.ts`.

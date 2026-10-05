# API cookbook: using Vaulted Money without the GUI

Everything the app can do, you can do over the [Local API](API.md): run your finances from scripts, a terminal or a spreadsheet, or build your own interface on top. This page is a set of working recipes. The [API reference](API.md) lists every endpoint.

Setup once: run the desktop app, open **Settings → Local API**, switch it on and copy the token.

```bash
export VM="http://127.0.0.1:47821/api/v1"
export VM_TOKEN="<token from settings>"
AUTH="Authorization: Bearer $VM_TOKEN"
JSON="Content-Type: application/json"
```

## The five rules that make it easy

1. **Everything lives under a ledger.** Find its id once: `curl -H "$AUTH" $VM/ledgers`.
2. **Names, not ids, in bodies.** Transactions refer to `account`, `vendor` and `category` by name; missing ones are created.
3. **Preview, then do.** Every operation that changes lots of data has `dry_run: true`; deletions also need `confirm_delete: true`.
4. **Errors are JSON.** `{"error": {"code", "message", "details?"}}` with a meaningful status (400 validation, 404 unknown, 409 conflict).
5. **Files are attachments.** CSV exports and backups come back with `Content-Disposition`; save them with `curl -OJ`.

## Recipes

### Set up a fresh ledger from nothing

```bash
LEDGER=$(curl -s -H "$AUTH" -H "$JSON" -X POST $VM/ledgers \
  -d '{"name":"Home","currency":"EUR"}' | jq -r .id)

curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/accounts \
  -d '{"name":"Checking","currency":"EUR","starting_balance":1200,"type":"Checking"}'
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/categories \
  -d '{"name":"Food","sub_categories":["Groceries","Dining out"]}'
```

### Record spending

```bash
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/transactions \
  -d '{"date":"2026-03-02","amount":-42.50,"account":"Checking","vendor":"Corner Market","category":"Food","sub_category":"Groceries"}'
```

Negative amounts are spending, positive are income. Many at once: `POST …/transactions/bulk` with `{"transactions":[…]}`. Move money between accounts: `POST …/transactions/transfer` with `{"from_account","to_account","amount","date"}`.

### Import a bank statement

1. Shape the statement into the app's CSV layout (columns are in the [reference](API.md#csv-import-and-export)).
2. Validate, then import:

```bash
CSV=$(jq -Rs . < statement.csv)
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/transactions/import \
  -d "{\"csv\": $CSV, \"dry_run\": true}"      # check the preview
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/transactions/import \
  -d "{\"csv\": $CSV}"
```
3. Tidy up what the import brought in:

```bash
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/transactions/categorize-missing -d '{}'
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/transactions/detect-transfers -d '{}'
```
(`detect-transfers` already runs after an import unless you pass `"detect_transfers": false`.)

### Month-end routine

```bash
# 1. make the app agree with the bank statement
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/accounts/reconcile \
  -d '{"dry_run":true,"adjustments":[{"account":"Checking","actual_balance":1534.20}]}'
# ...happy with the difference? repeat without dry_run

# 2. download this month's numbers
curl -H "$AUTH" -OJ "$VM/ledgers/$LEDGER/reports/income-expense?from=2026-03-01&to=2026-03-31&format=csv"
curl -H "$AUTH" -OJ "$VM/ledgers/$LEDGER/analytics?from=2026-03-01&group_by=week&format=csv"
curl -H "$AUTH" "$VM/ledgers/$LEDGER/insights" | jq '.budgets[] | select(.status != "good")'

# 3. keep a backup (encrypted)
curl -H "$AUTH" -H "$JSON" -X POST -OJ $VM/backups/export -d '{"password":"a long passphrase"}'
```

### Clean up the data

```bash
for kind in vendors categories accounts; do          # look-alike names
  curl -s -H "$AUTH" $VM/ledgers/$LEDGER/$kind/duplicates | jq -c '.data[] | {suggested_target, names}'
done
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/vendors/merge \
  -d '{"target":"Starbucks","sources":["starbucks","STARBUCKS."]}'

curl -s -H "$AUTH" $VM/ledgers/$LEDGER/vendors/unused | jq '.unused_found'
curl -H "$AUTH" -H "$JSON" -X POST $VM/ledgers/$LEDGER/vendors/cleanup -d '{"confirm_delete":true}'
```

### Move to another computer

```bash
curl -H "$AUTH" -H "$JSON" -X POST -OJ $VM/backups/export -d '{"password":"a long passphrase"}'
# on the new machine, with its own token:
curl -H "$AUTH" -H "$JSON" -X POST $VM/backups/import \
  -d "{\"content\": $(jq -Rs . < vaultedmoney-backup-all-*.lock), \"password\": \"a long passphrase\", \"confirm_replace\": true}"
```

### Change settings

```bash
curl -H "$AUTH" -H "$JSON" -X PATCH $VM/settings \
  -d '{"base_currency":"EUR","language":"nl","future_months":6,"default_ai_provider_id":null}'
```

## From a script

**Python** (`pip install requests`):

```python
import os, requests

vm = "http://127.0.0.1:47821/api/v1"
s = requests.Session()
s.headers["Authorization"] = f"Bearer {os.environ['VM_TOKEN']}"

ledger = s.get(f"{vm}/ledgers").json()["data"][0]["id"]
page = s.get(f"{vm}/ledgers/{ledger}/transactions", params={"type": "expense", "limit": 1000}).json()
print(page["total"], "expenses; first:", page["data"][0]["vendor"])

r = s.post(f"{vm}/ledgers/{ledger}/transactions/cleanup-duplicates", json={"dry_run": True})
r.raise_for_status()
print(r.json()["duplicates_found"], "duplicates")
```

**JavaScript / TypeScript** (Node 18+):

```ts
const base = "http://127.0.0.1:47821/api/v1";
const headers = { Authorization: `Bearer ${process.env.VM_TOKEN}`, "Content-Type": "application/json" };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(base + path, { headers, ...init });
  if (!res.ok) throw new Error((await res.json()).error.message);
  return res.status === 204 ? (undefined as T) : res.json();
}

const { data: ledgers } = await api<{ data: { id: string }[] }>("/ledgers");
const report = await api(`/ledgers/${ledgers[0].id}/reports/net-worth`);
```

Browsers cannot call the API directly (it refuses requests that carry an `Origin` header, on purpose, so web pages you visit cannot reach your finances). A browser-based UI needs a small local proxy that adds the token, or run it as a desktop/Node app.

## Building your own interface

The API is meant to be a complete foundation:

1. **Generate a typed client.** `GET /api/v1/openapi.json` is a full OpenAPI 3.1 description (paths, parameters and request bodies are generated from the code, so it is always current):

   ```bash
   curl -H "$AUTH" $VM/openapi.json -o vaulted-money.openapi.json
   npx openapi-typescript vaulted-money.openapi.json -o api-types.ts      # TypeScript types
   npx @openapitools/openapi-generator-cli generate -i vaulted-money.openapi.json -g python -o client-py
   ```
2. **Explore it** by importing the same file into Postman, Insomnia or Swagger UI.
3. **Use the same building blocks as the app.** Lists are paged (`limit`/`offset`), reports and exports are plain GETs, and the maintenance tools report what they will do before they do it, which maps neatly to a "preview, then confirm" screen.
4. **Handle the errors uniformly** (every 4xx/5xx shares the shape `{error:{code,message}}`) and treat `503 ui_not_ready` as "retry in a moment".
5. **Mind the lifecycle.** The API exists while the desktop app is running. Check `GET /health` first, and re-read the token if the user regenerates it.

## Postman, including Flows

Import the [collection and environment](postman/README.md) for a click-through of every endpoint, with a description, an example body and a saved example response on each request.

**Postman Flows** (the visual canvas) is stored in Postman's cloud and cannot be shipped as a file, so no Flow is bundled. To build one: in a new Flow, add *HTTP Request* blocks and choose requests from this collection (or import `openapi.json` first). Wire the output of one block to the next, for example *Create ledger* → `id` → *Create account*, or *Detect transfers (dry run)* → *Select* `pairs_found` → *If* `> 0` → *Detect transfers*. The collection's folders are ordered as a ready-made sequence you can follow, and its pre-request scripts show which values pass between steps.

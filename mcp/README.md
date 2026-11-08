# Vaulted Money MCP server

Lets an AI agent or model runner on this computer (for example LM Studio with a local model, or Claude Code, which sends what it reads to Anthropic; any MCP client works) read and change your Vaulted Money data through the desktop app's [Local API](../documentation/API.md).

- **One file, no dependencies** (`server.mjs`, Node 18+). Nothing to install.
- **Separate process.** It calls the Local API over HTTP, so the **desktop app must be running** with _Settings → Local API_ on. The window may be closed to the tray; quitting the app stops the API. (Your data lives inside the app, so the server cannot read it without the app.)
- **Local-first.** The server talks to the app only over `127.0.0.1`. The token is read from the app's config, never shown to the model.

## Why twelve tools, not 100

A model re-reads every tool definition on every turn. The API has about 100 operations (≈105 kB of spec), which makes small and local models slow. These twelve definitions total ≈9.5 kB (a test keeps them under 13 kB), return trimmed, pre-aggregated answers, and still reach every endpoint.

| Tool                   | Use it for                                                                                                                                                                                                                                                                                                            | Changes data? |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `list_ledgers`         | What exists: ledgers, accounts, balances                                                                                                                                                                                                                                                                              | no            |
| `spending_summary`     | "Where is my money going?", totals, top categories/vendors/accounts, trend. Takes a named `period` (`last_30_days` by default, `this_month`, `last_month`, `last_7_days`, `last_90_days`, `this_year`, `last_year`) or `days` (the last N days, e.g. 2 = today and yesterday) and reports the exact dates it used     | no            |
| `find_transactions`    | Look-ups: by text, vendor, category, account, amount range, `period`, `days` or dates                                                                                                                                                                                                                                 | no            |
| `budgets_and_insights` | "Am I over budget?", biggest changes vs the previous 30 days                                                                                                                                                                                                                                                          | no            |
| `search_api`           | Find any other endpoint by keyword (reports, recurring, vendors, backups, maintenance…) with its parameters                                                                                                                                                                                                           | no            |
| `call_api`             | Call what `search_api` found. **GET runs; anything else previews until `confirm: true`**                                                                                                                                                                                                                              | yes, gated    |
| `add_transaction`      | Add one transaction (negative = expense). Returns the id                                                                                                                                                                                                                                                              | yes           |
| `import_csv`           | Import a bank CSV **from a file path** (columns mapped automatically). **Previews by default**; `dry_run: false` imports                                                                                                                                                                                              | yes, gated    |
| `add_transactions`     | Add many at once (up to 1000) from a pasted statement, receipt list or PDF the model has read. **Previews by default**: flags new accounts (often a typo), new categories and likely duplicates; `dry_run: false` adds, `skip_duplicates: true` leaves out rows already recorded. Returns the ids so it can be undone | yes, gated    |
| `find_entity`          | Everything a name could mean (account, vendor, category, sub-category, budget, recurring transaction), ignoring case and accents. Reports `ambiguous` so the model asks "the budget or the account?" before deleting or renaming                                                                                      | no            |
| `budget_history`       | "Which budgets do I keep missing?": spent against target for each past month, quarter or year, with the misses counted. The running period is shown but not counted                                                                                                                                                   | no            |
| `payoff_projection`    | "Can I pay off this loan in two years?": months to payoff and interest for the current payment (and an optional extra), the payment needed to clear it in time, and what the ledger leaves over each month. The balance and rate come from you (they are not stored). The maths is done here, not by the model        | no            |

### Changing data safely

- **Add a transaction:** `add_transaction` runs immediately and returns the new id, so a mistake is one `call_api DELETE …/transactions/{id}` away.
- **Import a CSV:** `import_csv` maps common bank columns (date, description/payee, amount, category, currency, account, notes; `1.234,56` and `1,234.56` amounts; ISO and day-first dates) to the app's format, then shows the API's preview. The server reads the file itself, so you never paste it into the chat; only the matched column mapping and a short preview of rows come back to the model. If the date, description or amount column is missing, the reply lists the column names it accepts and never repeats text from the file. Importing needs a second call with `dry_run: false`.
- **Delete an account (or anything else):** `call_api` with `DELETE /ledgers/{ledgerId}/accounts/{id}` returns a preview ("would call…"). The model should show you that and only then repeat the call with `confirm: true`. Endpoints that support `dry_run` are previewed by the API itself. Deleting an account keeps its transactions; deleting a ledger deletes all its data.
- **Real enforcement is your client's approval prompt.** A model can set `confirm: true` itself, so keep tool-call approval switched on for `call_api`, `add_transaction`, `add_transactions` and `import_csv` (LM Studio and Claude Code both ask by default). The read tools are marked read-only.
- Take a backup first (`POST /backups/export`) when you let an agent loose on real data.

## Dates

Models don't know today's date and are unreliable at date arithmetic, so asking the same question twice could silently cover different date ranges. The server works the dates out itself from a named `period` or a number of `days`, and every answer states `today` and the exact `from`/`to` it used. If two answers disagree, compare those fields first. Explicit `from`/`to` win over `days`, and `days` wins over `period`. "Last 2 days" means today and yesterday.

## Large exports

A CSV export or backup can be far bigger than a model should read. When a download from `call_api` is longer than 20,000 characters, the server saves the complete file instead of cutting it off, and replies with the path, the size and a short preview. Files go to `~/vaulted-exports`, or wherever `VM_EXPORT_DIR` points (a relative path or `~/…` starts at your home folder). The folder must be a real folder that belongs to you, not a symlink or your home folder itself. A folder the server has to create is made owner-only; an existing folder keeps its permissions, so others may see the file names, but each file is readable by your user only and has a timestamp in its name. If that name is already taken, `-1`, `-2` and so on are added, so an existing file is never overwritten or followed. The files are plain files on your computer and may contain your financial data, so delete them when you are done. If you point `VM_EXPORT_DIR` at a synced folder (iCloud Drive, Dropbox, OneDrive), the files are uploaded to that service. Smaller exports come back in the chat as before. `POST /backups/export` only reads, so it runs without a preview.

## Setup

1. In the desktop app: _Settings → Local API → Connect an AI agent_ (opens the Connect to agent page) → switch on **Allow agents to connect**. The server finds the app's own config (token and port), so there is no token to copy.
2. Connect your agent:
   - **Claude Desktop:** download `vaulted-money.mcpb` from the GitHub Releases page and double-click it. No Node.js needed.
   - **Codex:** choose **Codex** on the Connect agent page and click **Set up Codex for me** (needs Node.js 18 or newer). Or use **Copy config** and paste it into `~/.codex/config.toml`.
   - **Claude Code:** click _Set up Claude Code for me_ on the Connect agent page, or run `claude plugin marketplace add nrajesh/vaulted.money` then `claude plugin install vaulted-money@vaulted-money` in a terminal (inside Claude Code, use `/plugin ...`).
   - **Local model (LM Studio):** use _Copy setup_ under **A private model on this computer** and paste it into `mcp.json`. Use a model with tool-calling support.

Node.js 18 or newer is needed for the plugin and local-model routes. The server is started by the client when needed. It looks up the token on every request, so a new token or port is picked up without a restart. _Disconnect everything_ switches the Local API off and replaces the token, so every agent gets "Local API is off" until you switch it on again; after that they reconnect on their own, with no copy-paste. Only the desktop app has to be running.

**Privacy:** the server itself uploads nothing, but what an agent reads (transactions, vendors, balances) is sent to that agent's AI provider (Anthropic, for Claude). A local model keeps everything on your device. The claude.ai website is not supported.

## Advanced / manual setup

Where the server looks for the token and port, first match wins:

1. `VM_TOKEN` (the token itself; `VM_BASE_URL` sets the address, default `http://127.0.0.1:47821/api/v1`)
2. The desktop app's own `api-config.json` (or the file named by `VM_CONFIG_FILE`)
3. The file `~/.vaulted-token` (or the file named by `VM_TOKEN_FILE`). It is used only when no app config is found; it does not override one.

`VM_BASE_URL`, when set, always sets the address, even when the token comes from the app config.

To use the manual route: in _Settings → Local API_ enable the API and copy the token, then `echo "<token>" > ~/.vaulted-token && chmod 600 ~/.vaulted-token`. Register the server with an absolute path to `server.mjs`. On Linux, AppImage users should copy `mcp/server.mjs` somewhere permanent and point their config at that copy, because the AppImage mounts under `/tmp/.mount_*`, a path that changes on every launch.

**LM Studio**: Program → Install → _Edit mcp.json_:

```json
{
  "mcpServers": {
    "vaulted-money": {
      "command": "node",
      "args": ["/absolute/path/to/vaulted.money/mcp/server.mjs"]
    }
  }
}
```

**Claude Code** (CLI or the desktop app's Code tab):

```bash
claude mcp add vaulted-money -- node /absolute/path/to/vaulted.money/mcp/server.mjs
```

GUI apps launched from the Dock may not inherit your shell environment, which is why the app config and token file exist as alternatives to environment variables.

## Try it (demo data)

On the Ledgers screen choose _Generate demo data_, then ask:

- "Where is my money going this month?" → `spending_summary`
- "What did I spend at the biggest vendor?" → `find_transactions`
- "Am I over budget anywhere?" → `budgets_and_insights`
- "Add a €12.50 coffee at Cafe Central on my checking account, category Food." → `add_transaction`
- "Import /Users/me/Downloads/statement.csv into Checking, preview first." → `import_csv`
- "Show what I spent at starbuks over 20 since 2020." → `search_api`, then `call_api` on `/search/interpret` (turns the sentence into filters), then `find_transactions`
- "Merge the vendors Starbucks and STARBUCKS." → `search_api`, then `call_api` (preview, then confirm)
- "Which budgets do I keep missing?" → `budget_history` (the demo's Home Budget has months of history, with Dining Out and Groceries often over)
- "Delete abc." → `find_entity` first, so it can ask whether you mean the budget, the account or the category
- "I owe 12,000 at 6.5%, paying 450 a month. Can I clear it in two years?" → `payoff_projection`

## Tests

`mcp/server.test.ts` runs every tool against the real HTTP server, router and database (only Electron's IPC hop is replaced), as part of `pnpm test`.

`mcp/coverage.test.ts` keeps the MCP in step with the API: every operation in the generated OpenAPI spec must have a summary and be findable with `search_api` from it. `call_api` can send any request, so this is about discoverability. If it fails, give the new route a more distinctive `summary`.

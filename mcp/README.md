# Vaulted Money MCP server

Lets a local AI agent (LM Studio, Claude Code, any MCP client) read and change your Vaulted Money data through the desktop app's [Local API](../documentation/API.md).

- **One file, no dependencies** (`server.mjs`, Node 18+). Nothing to install.
- **Separate process.** It calls the Local API over HTTP, so the **desktop app must be running** with *Settings → Local API* on. The window may be closed to the tray; quitting the app stops the API. (Your data lives inside the app, so the server cannot read it without the app.)
- **Local-first.** Everything stays on `127.0.0.1`. The token is read from a file, never shown to the model.

## Why eight tools, not 99

A model re-reads every tool definition on every turn. The API has ~99 operations (≈105 kB of spec), which makes small and local models slow. These eight definitions total ≈5.6 kB, return trimmed, pre-aggregated answers, and still reach every endpoint.

| Tool | Use it for | Changes data? |
|---|---|---|
| `list_ledgers` | What exists: ledgers, accounts, balances | no |
| `spending_summary` | "Where is my money going?", totals, top categories/vendors/accounts, trend. Takes a named `period` (`last_30_days` by default, `this_month`, `last_month`, `last_7_days`, `last_90_days`, `this_year`, `last_year`) and reports the exact dates it used | no |
| `find_transactions` | Look-ups: by text, vendor, category, account, amount range, `period` or dates | no |
| `budgets_and_insights` | "Am I over budget?", biggest changes vs the previous 30 days | no |
| `search_api` | Find any other endpoint by keyword (reports, recurring, vendors, backups, maintenance…) with its parameters | no |
| `call_api` | Call what `search_api` found. **GET runs; anything else previews until `confirm: true`** | yes, gated |
| `add_transaction` | Add one transaction (negative = expense). Returns the id | yes |
| `import_csv` | Import a bank CSV **from a file path** (columns mapped automatically). **Previews by default**; `dry_run: false` imports | yes, gated |

### Changing data safely

- **Add a transaction:** `add_transaction` runs immediately and returns the new id, so a mistake is one `call_api DELETE …/transactions/{id}` away.
- **Import a CSV:** `import_csv` maps common bank columns (date, description/payee, amount, category, currency, account, notes; `1.234,56` and `1,234.56` amounts; ISO and day-first dates) to the app's format, then shows the API's preview. The file is read by the server, so its contents never go through the chat. Importing needs a second call with `dry_run: false`.
- **Delete an account (or anything else):** `call_api` with `DELETE /ledgers/{ledgerId}/accounts/{id}` returns a preview ("would call…"). The model should show you that and only then repeat the call with `confirm: true`. Endpoints that support `dry_run` are previewed by the API itself. Deleting an account keeps its transactions; deleting a ledger deletes all its data.
- **Real enforcement is your client's approval prompt.** A model can set `confirm: true` itself, so keep tool-call approval switched on for `call_api`, `add_transaction` and `import_csv` (LM Studio and Claude Code both ask by default). The read tools are marked read-only.
- Take a backup first (`POST /backups/export`) when you let an agent loose on real data.

## Dates

Models don't know today's date and are unreliable at date arithmetic, so asking the same question twice could silently cover different date ranges. The server works the dates out itself from a named `period`, and every answer states `today` and the exact `from`/`to` it used. If two answers disagree, compare those fields first.

## Setup

1. In the desktop app: *Settings → Local API* → enable → copy the token.
2. Save it: `echo "<token>" > ~/.vaulted-token && chmod 600 ~/.vaulted-token`
   (or set `VM_TOKEN`; `VM_TOKEN_FILE` and `VM_BASE_URL` also work).
3. Register the server. Use an absolute path to `server.mjs`.

**LM Studio**: Program → Install → *Edit mcp.json*:

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

Use a model with tool-calling support (the tool icon in LM Studio's model list).

**Claude Code** (CLI or the desktop app's Code tab):

```bash
claude mcp add vaulted-money -- node /absolute/path/to/vaulted.money/mcp/server.mjs
```

The server is started by the client when needed (nothing to run yourself). It re-reads the token file on every request, so after regenerating the token in Settings just save the new value to `~/.vaulted-token`; no restart is needed. Only the desktop app has to be running.

GUI apps launched from the Dock may not inherit your shell environment, which is why the token is read from `~/.vaulted-token` rather than an environment variable.

## Try it (demo data)

On the Ledgers screen choose *Generate demo data*, then ask:

- "Where is my money going this month?" → `spending_summary`
- "What did I spend at the biggest vendor?" → `find_transactions`
- "Am I over budget anywhere?" → `budgets_and_insights`
- "Add a €12.50 coffee at Cafe Central on my checking account, category Food." → `add_transaction`
- "Import /Users/me/Downloads/statement.csv into Checking, preview first." → `import_csv`
- "Merge the vendors Starbucks and STARBUCKS." → `search_api`, then `call_api` (preview, then confirm)

## Tests

`mcp/server.test.ts` runs every tool against the real HTTP server, router and database (only Electron's IPC hop is replaced), as part of `pnpm test`.

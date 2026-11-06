---
name: import-bank-csv
description: Use when the user wants to import a bank statement or CSV file into Vaulted Money.
---

# Import a bank CSV

The file is read by the local server, so its contents never need to be pasted into the chat.

1. Ask for the full file path and which account it belongs to. Use `list_ledgers` to confirm the account name.
2. Suggest taking a backup first if this is real data (`search_api` for "backup", then `call_api`).
3. Call `import_csv` with the default preview. Show the user what would be imported: row count, date range, anything skipped or odd.
4. Only after the user clearly says yes, call `import_csv` again with `dry_run: false`.
5. Report how many rows were added.

Never skip the preview. Never import without the user's yes.

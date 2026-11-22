# Automatic safety backups (2.1)

Status: approved by the owner, 22 Nov 2026. Branch: `feature/2.1`.

## Why

Some actions change or replace a lot of data at once. The owner noticed this while testing 2.0 and wants a safety net before them, without extra prompts. It is part of the 2.1 theme of more trust and privacy.

## Goals

- Before each risky operation, save a full copy of the data automatically and silently.
- Keep the copies inside the app, never on a server or in the cloud.
- Let people restore a copy, save it as a file, and delete copies one at a time or several at once.

## Non-goals

- Copies in iCloud, Files or another folder (the existing scheduled backups and exports cover that).
- A setting for how many copies to keep.
- Encrypting copies separately: they sit in the same on-device database as the data they copy.

## Anti-goals

- A prompt before every import, AI run or sync. The owner chose silent copies (option A).
- An operation failing or being blocked because a copy could not be made, unless there is no copy at all of data about to be replaced (see Failure).
- Copies leaking into exports, sync files or other backups.

## Approaches considered

| Approach | Trade-off | Chosen |
| --- | --- | --- |
| A. Kept inside the app, last 5, restore from the Backup screen | No clutter or prompts; copies are lost if the app is deleted | **Yes** (owner's pick) |
| B. Written as files to Files › On My iPhone › Vaulted Money | Visible and portable, but the folder fills up over time | No |
| C. Ask "Back up first?" each time | Full control, but an extra step on every import, AI run and sync | No |

## When a copy is made

A copy is made just before:

1. an AI action that changes data: Categorize Missing, and creating budgets with Smart Create when it uses AI;
2. any CSV import (transactions, accounts, payees, categories, sub-categories, budgets, scheduled transactions, from any screen including the first-run screen);
3. continuity sync applying changes from another device. Only when the incoming file would change local data; an unchanged sync makes no copy;
4. Generate demo data (it replaces all data);
5. restoring a backup file or a safety copy.

The same operations reached through the desktop Local API also make a copy.

Each copy records why it was made (one of the reasons above, plus the entity for CSV imports) and when.

## What a copy contains

The same data as a full backup (`generateBackupData`: all ledgers, in the backup envelope). AI provider keys are left out, as in every export. A copy never contains other safety copies.

## Storage

- A new Dexie table `safety_backups` (schema version 11), reached only through new `DataProvider` methods (project rule: production code never imports `dexieDB` directly).
- After saving a copy, delete the oldest so at most 5 remain.
- `exportData`, `importData`, continuity sync payloads and file backups ignore the table.
- **Builder's call:** `clearAllData` (used by Generate demo data) must keep the table. Today it deletes the whole database, so it has to save and restore the copies, or clear the other tables one by one. "Reset everything" in the app deletes the copies too: someone wiping the app expects nothing left behind.

## Restore

- Restoring asks for confirmation, because it replaces all current data with the copy.
- A restore first makes a copy of the current data ("Before restoring a safety copy"), so a restore can be undone.
- **Builder's call:** a restore keeps the AI providers and keys that are on the device now, since copies have no keys.

## Backup screen

A new section, "Automatic safety copies", below the existing backup tools:

```
Automatic safety copies            [Select]
Made before imports, AI changes and sync. The last 5 are kept.
┌──────────────────────────────────────────────┐
│ Before CSV import: transactions              │
│ 22 Nov 2026, 14:05 · 3 ledgers               │
│                    [Restore] [Save as file] [⋯]│
└──────────────────────────────────────────────┘
```

- Each copy: its reason, date and time (`formatDisplayDate` plus the time), number of ledgers, and **Restore**, **Save as file** and **Delete** (the last in the "⋯" menu).
- **Select** turns on checkboxes for deleting several at once, with "Delete (n)" and a confirmation, the way Budgets and Transactions select today.
- Swipe left to delete comes with the shared swipe component in the 2.1 gestures work. That component must also cover these rows.
- Empty state: "No safety copies yet. One is made automatically before imports, AI changes and sync."

## Failure

If making a copy fails (for example storage is full):

- for imports, AI actions and sync, the operation still runs, and the person sees a warning that no safety copy could be made;
- for a restore or Generate demo data, which replace everything, the operation stops and says why, unless the person confirms to continue without a copy.

## Local API

Backups are an API entity, so in the same change (see "Local API changes" in `documentation/CLAUDE.md`):

- `GET /backups/safety`: list copies (id, reason, created_at, ledger count). Never the content.
- `POST /backups/safety/:id/restore` with `confirm_restore: true`.
- `DELETE /backups/safety/:id` with `confirm_delete: true`.
- API imports, AI runs and restores make copies the same way.
- Update `src/api/api.test.ts`, the Postman collection (inside the throwaway-ledger flow), `documentation/API.md` and route summaries that `search_api` can find.

## Also in scope

- All user-visible text in all five languages (`src/i18n/areas/`).
- Tests: `DataProviderContract.test.ts` (save, prune to 5, list, delete, export/import/clear leave the table out, demo generation keeps copies), the trigger points, the Backup screen, the API routes.
- Demo data: the demo includes one safety copy so screenshots show the section (`demoDataPlan` plus its test).
- `documentation/USER_GUIDE.md`: a short "Safety copies" section.

## Left to the builder

- Where exactly each trigger hooks in (the shared import, AI and sync paths rather than each button, where possible).
- Wording of reasons and messages, within the project's plain-English style.
- Whether "Save as file" reuses the existing export path (`saveFile`).

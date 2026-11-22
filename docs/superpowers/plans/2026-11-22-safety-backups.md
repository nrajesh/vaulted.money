# Automatic Safety Backups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save a full copy of the data inside the app before every risky operation, keep the last 5, and let people restore, save or delete them (one or many).

**Architecture:** A new Dexie table behind new `DataProvider` methods stores copies made with the existing `generateBackupData`. One helper (`src/utils/safetyBackup.ts`) makes copies and restores them; every trigger (app and Local API) calls that helper. A new Backup-screen section lists the copies.

**Tech Stack:** React 19, TypeScript, Dexie, TanStack Query, i18next, Vitest + Testing Library, zod routes for the Local API, Postman/Newman.

**Spec:** `docs/superpowers/specs/2026-11-22-safety-backups-design.md`

Work in the `feature/2.1` worktree: `/Users/nrajesh/GitHub/vaulted.money-2.1` (run `pnpm install` there first).

## Global Constraints

- Keep at most **5** copies (`SAFETY_BACKUP_LIMIT = 5`); delete the oldest after each save.
- Copies are silent: no prompt before imports, AI changes or sync.
- Copies never contain AI provider keys and never contain other safety copies; `exportData`, `importData`, sync payloads and file backups ignore the table.
- Production code must not import `@/lib/dexieDB`: add methods to `DataProvider` and `LocalDataProvider`, with tests in `src/providers/DataProviderContract.test.ts`.
- All user-visible text goes through `t("key", { defaultValue })`, added for all five languages (en, es, zh, nl, ta) in `src/i18n/areas/`. Dates via `formatDisplayDate`. No sentences built by concatenation.
- Local API changes update the route, `src/api/api.test.ts`, the Postman collection and its README counts, `documentation/API.md`, and give each route a distinctive `summary` (see "Local API changes" in `documentation/CLAUDE.md`).
- Destructive API operations need `confirm_delete: true` / `confirm_restore: true`.
- Interactive rows are `<button>`s; contrast pairs with `dark:` colours; long labels wrap on a 360px phone at Larger text.

## Review Focus

1. **Generate demo data must not wipe the copies.** `clearAllData` deletes the whole database today; the copy made just before demo data must survive it. (Test in Task 1.)
2. **Restoring a copy must not wipe the person's AI keys.** Copies have no keys; a restore keeps the providers on the device now. (Test in Task 2.)
3. **A restore must be undoable.** Restoring makes a "before restore" copy first, and the pruning to 5 must not delete the copy being restored. (Test in Task 2.)
4. **Sync loops.** A sync that brings in changes makes a copy; making the copy must not itself mark data as changed and trigger another sync write. (Test in Task 3.)
5. **Storage full.** If saving a copy fails, imports, AI and sync still run and warn; restore and demo data stop unless the person continues without a copy. (Tests in Tasks 2 and 3.)

---

### Task 1: Storage: table, types and DataProvider methods

**Files:**

- Modify: `src/types/dataProvider.ts` (types near `BackupConfig` at line 113; methods near line 310)
- Modify: `src/lib/dexieDB.ts` (add `version(11)` with `safety_backups: "id, created_at"`; keep `version(10)`)
- Modify: `src/providers/LocalDataProvider.ts` (`clearAllData` at ~1135, `exportData`, `importData` at ~1233)
- Test: `src/providers/DataProviderContract.test.ts` (new `describe("safety backups")`)

**Interfaces:**

- Produces (in `src/types/dataProvider.ts`):

```ts
export const SAFETY_BACKUP_LIMIT = 5;
export type SafetyBackupReason =
  | "ai_categorize"
  | "csv_import"
  | "sync"
  | "demo_data"
  | "restore_file"
  | "restore_safety_copy";
export interface SafetyBackupSummary {
  id: string;
  reason: SafetyBackupReason;
  entity?: string; // CSV imports: "transactions" | "payees" | "accounts" | "categories" | ...
  created_at: string; // ISO
  ledger_count: number;
}
export interface SafetyBackup extends SafetyBackupSummary {
  payload: string; // JSON.stringify(generateBackupData(...))
}
// DataProvider:
saveSafetyBackup(input: Omit<SafetyBackup, "id" | "created_at">, options?: { protectId?: string }): Promise<SafetyBackupSummary>;
listSafetyBackups(): Promise<SafetyBackupSummary[]>; // newest first, no payload
getSafetyBackup(id: string): Promise<SafetyBackup | undefined>;
deleteSafetyBackups(ids: string[]): Promise<number>; // returns how many were deleted
clearAllData(options?: { keepSafetyBackups?: boolean }): Promise<void>;
```

`protectId` is a copy that pruning must never delete (the one being restored).

- [ ] **Step 1: Write the failing contract tests**

In `describe("safety backups")`:

- `saves a copy and lists it without its payload`: save one, `listSafetyBackups()` has length 1, `reason`, `ledger_count`, no `payload` key; `getSafetyBackup(id).payload` equals what was saved.
- `keeps only the newest 5`: save 7 with increasing time (use `vi.setSystemTime`), list has 5, ids are the last 5, newest first.
- `never prunes the protected copy`: save 5, then save a 6th with `protectId` = the oldest; the oldest is still listed, 5 total.
- `deletes several at once`: save 3, `deleteSafetyBackups([a, b, "missing"])` returns 2, one left.
- `export, import and sync data leave the copies out`: save one; `exportData()` has no `safety_backups` key; `importData(exportData())` leaves the copy listed.
- `clearAllData keeps copies only when asked`: save one; `clearAllData({ keepSafetyBackups: true })` → still listed; `clearAllData()` → empty list.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run src/providers/DataProviderContract.test.ts -t "safety backups"`
Expected: FAIL (methods not defined).

- [ ] **Step 3: Implement**

Dexie `version(11)` adds the table. `saveSafetyBackup` adds a row with `crypto.randomUUID()` and `new Date().toISOString()`, then deletes the oldest beyond `SAFETY_BACKUP_LIMIT`, skipping `protectId`, in one Dexie transaction. `clearAllData({ keepSafetyBackups: true })` reads the table before deleting the database and `bulkPut`s the rows back after `db.open()`. Leave `exportData`/`importData` table lists unchanged (they already name their tables explicitly); the test proves it.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run src/providers/DataProviderContract.test.ts`
Expected: PASS (all, including the existing contract tests).

- [ ] **Step 5: Commit**

```bash
git add src/types/dataProvider.ts src/lib/dexieDB.ts src/providers/LocalDataProvider.ts src/providers/DataProviderContract.test.ts
git commit -m "feat(backups): store safety copies behind DataProvider"
```

---

### Task 2: The helper: make, run-with and restore

**Files:**

- Create: `src/utils/safetyBackup.ts`
- Test: `src/utils/safetyBackup.test.ts`

**Interfaces:**

- Consumes: Task 1's types and methods; `generateBackupData`, `unwrapBackupEnvelope` from `src/utils/backupUtils.ts`.
- Produces:

```ts
export class SafetyBackupFailedError extends Error {}
export interface SafetyBackupOptions {
  reason: SafetyBackupReason;
  entity?: string;
  required?: boolean; // restore + demo data: true
  continueWithoutCopy?: boolean; // person confirmed after a failure
  protectId?: string;
}
export function makeSafetyBackup(
  dp: DataProvider,
  options: SafetyBackupOptions,
): Promise<SafetyBackupSummary | null>; // never throws; null on failure
export function withSafetyBackup<T>(
  dp: DataProvider,
  options: SafetyBackupOptions,
  run: () => Promise<T>,
): Promise<{ result: T; backedUp: boolean }>;
export function restoreSafetyBackup(
  dp: DataProvider,
  id: string,
  options?: { continueWithoutCopy?: boolean },
): Promise<void>;
```

`withSafetyBackup` throws `SafetyBackupFailedError` (and does not run `run`) only when the copy failed, `required` is true and `continueWithoutCopy` is not. `ledger_count` comes from the exported `ledgers` array.

- [ ] **Step 1: Write the failing tests** (use `LocalDataProvider` with `fake-indexeddb`, as the contract tests do)
- `makes a copy before running the operation`: the copy's payload has the data as it was before `run` changed it.
- `still runs and reports backedUp false when the copy fails`: stub `saveSafetyBackup` to reject; `run` is called; `backedUp === false`.
- `stops a required operation when the copy fails`: same stub, `required: true` → rejects with `SafetyBackupFailedError`, `run` not called; with `continueWithoutCopy: true` → runs.
- `restores a copy and keeps the AI providers on the device`: add a provider with `api_key: "k"`, save a copy, change data, add a second provider, restore → data matches the copy; both providers present with their keys.
- `makes an undo copy before restoring`: after restore, the list's newest entry has reason `restore_safety_copy`, and the restored copy is still listed when 5 already existed.
- `a copy never contains AI keys`: the payload JSON does not contain `"k"`.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run src/utils/safetyBackup.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/utils/safetyBackup.ts`**

`restoreSafetyBackup`: read `getAIProviders()`; `withSafetyBackup(dp, { reason: "restore_safety_copy", required: true, protectId: id, ... }, () => importData(unwrapBackupEnvelope(JSON.parse(copy.payload))))`; then, for each provider read earlier, update it if its id exists, otherwise add it back. Add a block comment explaining why keys are carried over.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run src/utils/safetyBackup.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/safetyBackup.ts src/utils/safetyBackup.test.ts
git commit -m "feat(backups): helper to make, require and restore safety copies"
```

---

### Task 3: Make copies before every risky operation in the app

**Files:**

- Modify: `src/hooks/transactions/useTransactionCSV.ts:182` (CSV import of transactions; `entity: "transactions"`)
- Modify: `src/hooks/usePayeeManagement.ts:52` (payee/account CSV import mutation; `entity: "payees"` or `"accounts"` from the page's mode)
- Modify: `src/hooks/useCategoryManagement.ts` (the CSV import path after `Papa.parse` at ~179; `entity: "categories"`)
- Modify: `src/pages/LedgerEntryPage.tsx:313` (first-run CSV import), `:382` and `:450` (restore file: `restore_file`, required)
- Modify: `src/utils/backupUtils.ts` (`processImport` line 156 and `processEncryptedImport` line 176: `restore_file`, required; add `continueWithoutCopy` to both signatures)
- Modify: `src/pages/DataManagementPage.tsx:145,173` (handle `SafetyBackupFailedError` with a confirm dialog, then retry with `continueWithoutCopy`)
- Modify: `src/pages/Transactions.tsx` (Categorize Missing: wrap only the "Applying updates" write after `autoCategorizeBulk` at ~536; `ai_categorize`)
- Modify: `src/utils/continuitySync.ts:323` (`load`: `sync`; not required)
- Modify: `src/utils/demoDataGenerator.ts:67` (`demo_data`, required; call `clearAllData({ keepSafetyBackups: true })`)
- Create: `src/hooks/useSafetyBackupWarning.ts` (toast for `backedUp === false`)
- Test: `src/tests/safetyBackupTriggers.test.ts`, plus the existing tests of touched files must still pass

**Interfaces:**

- Consumes: `withSafetyBackup`, `SafetyBackupFailedError` (Task 2).
- Produces: `useSafetyBackupWarning(): (backedUp: boolean) => void`, which shows `t("safetyBackups.failedWarning")` when false. `processImport(content, dp, options?: { continueWithoutCopy?: boolean })`, `processEncryptedImport(content, password, dp, options?)`.

Smart Create budgets don't use AI (`SmartBudgetDialog` reads spending history only), so they get no trigger. The spec's "when it uses AI" condition is never met.

- [ ] **Step 1: Write the failing tests** in `src/tests/safetyBackupTriggers.test.ts`, each with a `LocalDataProvider` and asserting `listSafetyBackups()[0].reason`:
- `processImport of a backup file makes a restore_file copy`
- `processImport stops with SafetyBackupFailedError when the copy fails, and imports with continueWithoutCopy`
- `generating demo data keeps a demo_data copy of the previous data` (seed one transaction, generate, the copy's payload contains it)
- `continuity load makes a sync copy`, and `a sync that loads changes writes the sync file once` (spy on the sync IO `write`; the copy must not schedule another write)
- `transaction CSV import makes a csv_import copy with entity transactions` (drive `useTransactionCSV` with `renderHook`)

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run src/tests/safetyBackupTriggers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Wrap each write listed under Files** with `withSafetyBackup`, passing the reason and entity, and call the warning hook with `backedUp`. Wrap only the write, not the parsing, mapping dialogs or AI calls, so cancelling an import makes no copy. The first-run screen also handles `SafetyBackupFailedError` with the same confirm dialog as `DataManagementPage`.

- [ ] **Step 4: Run the tests and the suites of touched files**

Run: `pnpm exec vitest run src/tests/safetyBackupTriggers.test.ts src/hooks src/pages src/utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat(backups): safety copy before imports, AI changes, sync, restores and demo data"
```

---

### Task 4: Backup screen: list, restore, save, delete one or many

**Files:**

- Create: `src/components/backup/SafetyBackups.tsx`
- Modify: `src/pages/BackupPage.tsx` (render `<SafetyBackups />` below `<ScheduledBackups />`)
- Create: `src/i18n/areas/safetyBackups.ts`; Modify: `src/i18n/areas/index.ts` (register it)
- Test: `src/components/backup/SafetyBackups.test.tsx`

**Interfaces:**

- Consumes: `listSafetyBackups`, `getSafetyBackup`, `deleteSafetyBackups` (Task 1); `restoreSafetyBackup`, `SafetyBackupFailedError` (Task 2); `saveFile` from `src/utils/backupUtils.ts`; `formatDisplayDate`.
- Produces: i18n keys under `safetyBackups.*`: `title`, `about` ("Made before imports, AI changes and sync. The last 5 are kept."), `empty`, `reasons.ai_categorize|csv_import|sync|demo_data|restore_file|restore_safety_copy`, `reasons.csv_import_entity` ("Before CSV import: {{entity}}"), `ledgerCount` (plural), `restore`, `restoreConfirmTitle`, `restoreConfirmBody`, `saveAsFile`, `delete`, `select`, `deleteCount`, `deleteConfirmTitle`, `deleteConfirmBody`, `failedWarning`, `continueWithoutCopyTitle`, `continueWithoutCopyBody`. All five languages.

Layout (from the spec):

```
Automatic safety copies            [Select]
Made before imports, AI changes and sync. The last 5 are kept.
│ Before CSV import: transactions              │
│ 22 Nov 2026, 14:05 · 3 ledgers               │
│                    [Restore] [Save as file] [⋯]│
```

Use TanStack Query (`["safetyBackups"]`) and invalidate it and the app's data queries after a restore or delete. "Save as file" calls `saveFile(\`vaulted-money-safety-copy-<yyyy-mm-dd-hhmm>.json\`, payload, ...)`. Select mode follows the Budgets select pattern (checkboxes, "Delete (n)", confirm dialog). Leave a short comment that the shared 2.1 swipe component should also be applied to these rows.

- [ ] **Step 1: Write the failing tests**
- `shows the empty state when there are no copies`
- `lists copies newest first with their reason and ledger count` (expect "Before CSV import: transactions")
- `restores after confirming` (`restoreSafetyBackup` mocked, called with the id only after "Restore" in the dialog)
- `deletes several selected copies after confirming` (`deleteSafetyBackups` called with both ids)
- `offers to continue without a copy when the undo copy fails` (mock rejects with `SafetyBackupFailedError`, the second dialog continues with `continueWithoutCopy: true`)

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run src/components/backup/SafetyBackups.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the component and the translations**

- [ ] **Step 4: Run the tests and the translation guard**

Run: `pnpm exec vitest run src/components/backup src/i18n/coverageGuard.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/backup src/pages/BackupPage.tsx src/i18n/areas
git commit -m "feat(backups): safety copies on the Backup screen with restore, save and bulk delete"
```

---

### Task 5: Local API: list, restore, delete, and copies from API operations

**Files:**

- Modify: `src/api/routes/backups.ts` (new routes; wrap the import at lines 178–188 with `restore_file`, required, `continueWithoutCopy` from a body flag `continue_without_safety_copy`)
- Modify: `src/api/routes/csvTransfer.ts:99` (`importTransactions`: `csv_import`, entity `transactions`, only when not `dry_run`)
- Modify: `src/api/routes/maintenance.ts:121` (`categorizeMissing`: `ai_categorize` only when `use_ai && !dry_run`)
- Test: `src/api/api.test.ts` (`describe("backups")` at ~1091)
- Modify: `documentation/postman/vaulted-money-local-api.postman_collection.json`, `documentation/postman/README.md` (counts), `documentation/API.md`

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces routes:
  - `GET /backups/safety` → `200 { items: SafetyBackupSummary[] }` (never `payload`). Summary: "List automatic safety copies made before imports, AI changes and sync".
  - `POST /backups/safety/:id/restore`, body `{ confirm_restore: true, continue_without_safety_copy?: boolean }` → `200 { restored: id }`; `400` without the flag; `404` unknown id; `409` when the undo copy fails and `continue_without_safety_copy` is not true. Summary: "Restore an automatic safety copy (mirrors the Restore button on the Backup screen)".
  - `DELETE /backups/safety/:id`, body `{ confirm_delete: true }` → `200 { deleted: 1 }`; `400` without the flag; `404` unknown. Summary: "Delete an automatic safety copy".
  - Give each a zod `body` so `/openapi.json` stays complete.

- [ ] **Step 1: Write the failing API tests**: the success, 400 and 404 paths for each route, the 409 path for restore, `importTransactions` (not dry run) leaves a `csv_import` copy, `dry_run` leaves none, and `GET /backups/safety` items have no `payload`.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run src/api/api.test.ts -t backups`
Expected: FAIL.

- [ ] **Step 3: Implement the routes and wraps; add the Postman requests** (inside the throwaway-ledger flow: import a small CSV, list copies, restore with the flag, delete with the flag, plus assertions) **and the `API.md` section**.

- [ ] **Step 4: Run the API, Postman and MCP checks**

Run: `pnpm exec vitest run src/api mcp`
Expected: PASS, including `postmanCoverage.test.ts`, `postmanRun.test.ts` and `mcp/coverage.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/api documentation/postman documentation/API.md
git commit -m "feat(api): list, restore and delete safety copies; API imports and AI runs make copies"
```

---

### Task 6: Demo data, user guide, backlog, full checks

**Files:**

- Modify: `src/utils/demoDataPlan.test.ts` or `src/api/demoData.test.ts` (assert the demo leaves a `demo_data` copy, so the Backup screen isn't empty in screenshots)
- Modify: `documentation/USER_GUIDE.md` (a "Safety copies" subsection under "Backups": when copies are made, the last 5, restore undoes itself, copies stay on the device and go when the app is deleted, Reset removes them)
- Modify: `documentation/BACKLOG.md` (remove "Back up before risky operations" from 2.1)

- [ ] **Step 1: Write the demo assertion and run it to see it fail** if Task 3 didn't already cover it

Run: `pnpm exec vitest run src/api/demoData.test.ts`

- [ ] **Step 2: Update the docs**

- [ ] **Step 3: Run every CI check**

Run: `pnpm lint && pnpm format:check && pnpm exec tsc --noEmit && pnpm test:coverage && pnpm build && pnpm audit --prod --audit-level=moderate`
Expected: all pass. Commit `src/data/acknowledgments.generated.ts` if it was regenerated.

- [ ] **Step 4: Check it on a phone-sized screen**: run the app and open Backup at 360px wide with Larger text, in both themes. Labels wrap, no overflow, buttons readable.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "docs: safety copies in the user guide; demo shows a safety copy"
git push
```

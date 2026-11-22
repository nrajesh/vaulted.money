# Card Gestures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swipe left/right and long press on phone cards across the app, from one shared component built on each card's action list.

**Architecture:** A pointer-event hook (`useSwipeGesture`) drives a `SwipeableCard` wrapper that slides the card to reveal one action button, and a `CardActionsMenu` ("…" and long-press menu) built from the same `CardAction[]`. A small haptics util wraps `@capacitor/haptics`. Each list passes its existing handlers in as actions; no data or API logic changes.

**Tech Stack:** React 19, TypeScript, Tailwind, shadcn/Radix (DropdownMenu), `@capacitor/haptics`, i18next, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-22-card-gestures-design.md`

Work in the worktree `/Users/nrajesh/GitHub/vaulted.money-2.1-gestures` on branch `feature/2.1-gestures` (run `pnpm install` first if needed).

## Global Constraints

- Reveal-then-tap: a swipe never runs an action by itself. Right swipe is never destructive.
- Axis lock: claim a gesture only when horizontal movement > 12px and ≥ 1.5× vertical. Ignore touches starting within 20px of the left screen edge. Ignore presses starting on `input, textarea, a, button, [data-selectable-text]`. Only `pointerType` `touch` or `pen` swipe or long-press.
- Long press = 500ms held with < 8px movement; light haptic; opens the card's menu.
- Reveal width 88px; snap open when dragged past 40px; close on outside tap, vertical scroll, another card opening, or select mode.
- Reduce motion (app setting `useDisplayPreferences().reduceMotion`, falling back to `systemPrefersReducedMotion()`): no slide transition.
- Keep every existing "…"/inline Edit/Delete button; gestures are never the only route. Delete confirmations stay exactly where they are today.
- All text via `t("key", { defaultValue })` for en, es, zh, nl, ta in `src/i18n/areas/`; reuse existing Delete/Edit/Duplicate keys where they exist. No sentences by concatenation. `src/i18n/coverageGuard.test.ts` must pass.
- Interactive elements are `<button>`s; targets ≥ 44px; red action text/fill ≥ 4.5:1 in both themes with `dark:` pairs; works on a 360px phone at Larger text. No local `TooltipProvider`.
- Production code must not import `@/lib/dexieDB`. No Local API or demo-data change.
- New native plugin: add only `@capacitor/haptics` (same major as the other `@capacitor/*` packages); `pnpm audit --prod --audit-level=moderate` must stay clean.

## Review Focus

1. **Vertical scroll must win.** A mostly-vertical drag over a card scrolls the list and never reveals an action. (Test in Task 1.)
2. **No accidental delete.** A swipe alone, a long press alone, or a tap on the card body never deletes. (Tests in Tasks 1, 3, 4.)
3. **Keyboard/VoiceOver route.** Every action reachable by a swipe is also reachable from a button or menu. (Tests in Tasks 2-4.)
4. **Budget paging vs card swipe.** Swiping a budget card reveals its action and does not change the page; swiping outside cards still pages. (Test in Task 4.)
5. **Rows with inputs.** Dragging or pressing the currency rate field edits/selects text and never swipes. (Test in Task 4.)

---

### Task 1: Shared gesture component, menu and haptics

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml` (add `@capacitor/haptics`)
- Create: `src/utils/haptics.ts`
- Create: `src/hooks/useSwipeGesture.ts`
- Create: `src/components/cards/SwipeableCard.tsx`, `src/components/cards/CardActionsMenu.tsx`, `src/components/cards/cardActions.ts` (types)
- Create: `src/i18n/areas/cardGestures.ts` (register in `src/i18n/areas/index.ts`)
- Test: `src/tests/pointerEvents.ts` (jsdom PointerEvent helper), `src/hooks/useSwipeGesture.test.tsx`, `src/components/cards/SwipeableCard.test.tsx`

**Interfaces:**

- Produces (`src/components/cards/cardActions.ts`):

```ts
import type { LucideIcon } from "lucide-react";
export interface CardAction {
  id: string;
  label: string; // already translated
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}
```

- Produces (`src/components/cards/SwipeableCard.tsx`):

```ts
export interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: CardAction; // revealed by swiping left (Delete)
  rightAction?: CardAction; // revealed by swiping right (Duplicate / Edit); never destructive
  menuActions: CardAction[]; // the full list shown by "…" and long press
  menuButtonLabel?: string; // when set, renders the "…" button with this aria-label
  disabled?: boolean; // select mode etc.: no swipe, no long press
  className?: string;
}
export function SwipeableCard(props: SwipeableCardProps): JSX.Element;
```

- Produces (`src/utils/haptics.ts`): `export function lightHaptic(): Promise<void>` (never throws; no-op on web).
- Produces (`src/hooks/useSwipeGesture.ts`):

```ts
export function useSwipeGesture(options: {
  enabled: boolean;
  onLongPress: () => void;
  maxReveal: number; // 88
}): {
  offset: number; // px, negative = left reveal, positive = right reveal; 0 = closed
  dragging: boolean;
  bind: React.HTMLAttributes<HTMLElement>; // pointer handlers + touch-action: pan-y
  close: () => void;
};
```

- [ ] **Step 1: Write the failing tests.** Add a `firePointer` helper in `src/tests/pointerEvents.ts` (jsdom lacks `PointerEvent`: define a minimal subclass of `MouseEvent` with `pointerType` and `pointerId`, installed once). `useSwipeGesture.test.tsx`: `drags left 60px and reports a negative offset that snaps open at 88`; `a mostly vertical drag never moves the card` (Review Focus 1); `a mouse pointer never swipes`; `a touch starting 10px from the left edge is ignored`; `a press on an input is ignored`; `a 500ms hold with under 8px movement calls onLongPress once (fake timers)`; `moving more than 8px cancels the long press`. `SwipeableCard.test.tsx`: `swiping left reveals a Delete button that runs only when tapped` (swipe alone does not call it, Review Focus 2); `swiping right reveals the right action`; `the menu button opens a menu with every menuAction`; `long press opens the same menu and calls lightHaptic`; `disabled card never reveals`; `with reduce motion on there is no transition class`; `tapping elsewhere closes an open card`.

- [ ] **Step 2: Run them to see them fail.** Run: `pnpm exec vitest run src/hooks/useSwipeGesture.test.tsx src/components/cards`. Expected: FAIL (modules not found).

- [ ] **Step 3: Implement.** `pnpm add @capacitor/haptics@<same major as @capacitor/core>`. `lightHaptic` calls `Haptics.impact({ style: ImpactStyle.Light })` inside try/catch, only when `Capacitor.isNativePlatform()`. `useSwipeGesture` uses pointer events with `setPointerCapture` once the axis is locked, tracks start x/y, and applies the Global Constraints thresholds. `SwipeableCard` renders a relative `overflow-hidden` wrapper, the action button(s) absolutely positioned behind the sliding card (`transform: translateX(offset)`; transition only when not dragging and motion allowed), the card content on top, and `CardActionsMenu` (Radix `DropdownMenu`, controlled `open`) which long press opens even when no "…" button is shown (anchor it to the card). Red action: `bg-red-700 text-white dark:bg-red-600` or another pair measured at ≥ 4.5:1 in both themes; revealed button has `aria-label` from the action's label and is `tabIndex={-1}` and `aria-hidden` while closed so it is not announced when hidden. Translations: `cardGestures.moreActions` ("More actions") and any other new keys in all five languages.

- [ ] **Step 4: Run the tests and the translation guard.** Run: `pnpm exec vitest run src/hooks/useSwipeGesture.test.tsx src/components/cards src/i18n/coverageGuard.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add package.json pnpm-lock.yaml src/utils/haptics.ts src/hooks/useSwipeGesture* src/components/cards src/tests/pointerEvents.ts src/i18n/areas
git commit -m "feat(gestures): shared swipeable card with long-press menu and haptics"
```

---

### Task 2: Safety copies and ledgers

**Files:**

- Modify: `src/components/backup/SafetyBackups.tsx` (wrap each `<li>` row; remove the TODO about the shared swipe component)
- Modify: `src/pages/LedgerEntryPage.tsx` (ledger cards ~L976-1075; add the "…" button on phones: the existing Trash is `hidden sm:inline-flex`)
- Test: `src/components/backup/SafetyBackups.test.tsx`, a new `src/tests/LedgerCardGestures.test.tsx`

**Interfaces:**

- Consumes: `SwipeableCard`, `CardAction` (Task 1).
- Produces: nothing new.

- [ ] **Step 1: Write the failing tests.** Safety copies: `swiping a copy left reveals Delete; tapping it opens the same delete confirmation as the menu` (the copy is not deleted until confirmed); `the ⋯ menu still offers Delete`; a copy has no right swipe; in Select mode the row does not swipe (`disabled`). Ledgers: `swiping a ledger left reveals Delete and tapping opens the existing confirmation dialog`; `swiping right reveals Edit and tapping it opens the same edit flow as the existing edit control` (find how a ledger is edited today and use that handler); `the phone "…" button lists Edit and Delete`; `tapping a ledger card still opens it`; `Manage (selection) mode disables swiping`.

- [ ] **Step 2: Run them to see them fail.** Run: `pnpm exec vitest run src/components/backup src/tests/LedgerCardGestures.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement.** Build each card's `CardAction`s from the handlers already used by its buttons (`setPendingDeleteIds`, `handleDeleteClick`, the ledger edit handler), so the swipe, the menu and the buttons share one list. The ledger card keeps its `onClick={handleSelectLedger}`; the swipe wrapper must not swallow a normal tap.

- [ ] **Step 4: Run the tests.** Run: `pnpm exec vitest run src/components/backup src/tests/LedgerCardGestures.test.tsx src/pages`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/components/backup src/pages/LedgerEntryPage.tsx src/tests
git commit -m "feat(gestures): swipe and long press on safety copies and ledgers"
```

---

### Task 3: Transactions and scheduled transactions

**Files:**

- Modify: `src/components/transactions/TransactionTable.tsx` (`TransactionMobileCard` only: replace its `ContextMenu` with `SwipeableCard`; leave the desktop `TransactionRow` and its `ContextMenu` untouched; add the "…" button)
- Modify: `src/components/scheduled-transactions/ScheduledTransactionsTable.tsx` (phone cards ~L258; add Duplicate to the card menu, the desktop row menu and swipe right)
- Modify: `src/pages/ScheduledTransactions.tsx` (add `handleDuplicate`)
- Test: `src/tests/TransactionTable.test.tsx`, `src/tests/ScheduledTransactionsTable.test.tsx`, a test for the duplicate handler

**Interfaces:**

- Consumes: `SwipeableCard`, `CardAction` (Task 1); `duplicateTransactionPayload` (existing, used by the transaction Duplicate menu item).
- Produces: scheduled `onDuplicate?: (transaction: ScheduledTransaction) => void` prop on `ScheduledTransactionsTable`.

- [ ] **Step 1: Write the failing tests.** Transactions: `swiping a phone card left reveals Delete and tapping it calls onDeleteTransactions with that id` (not before); `swiping right reveals Duplicate and tapping it calls onAddTransaction with duplicateTransactionPayload(transaction)`; `projected transactions have no Delete or Edit actions` (as the menu today); `the … menu lists the same actions as before (select, edit, schedule, duplicate, delete)`; `long press opens the menu`; `a tap on the card still edits/opens as before`; `checkboxes and bulk select still work`. Scheduled: `swipe left reveals Delete`; `swipe right reveals Duplicate and tapping calls onDuplicate with the schedule`; `Duplicate appears in the card menu`; the page-level test that duplicating creates a new schedule with the same fields (new id, same vendor/amount/interval/dates as the original).

- [ ] **Step 2: Run them to see them fail.** Run: `pnpm exec vitest run src/tests/TransactionTable.test.tsx src/tests/ScheduledTransactionsTable.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement.** Build one `CardAction[]` per card from the existing handlers, keep the order the menu has today, and give the transaction card's `menuButtonLabel` a translated "More actions" label. `handleDuplicate` in `ScheduledTransactions.tsx` adds a copy through the existing add-scheduled method on the data context (no new DataProvider method unless none exists; if one is needed follow the DataProvider rules).

- [ ] **Step 4: Run the tests.** Run: `pnpm exec vitest run src/tests src/components/transactions src/components/scheduled-transactions src/pages`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src
git commit -m "feat(gestures): swipe and long press on transactions and scheduled transactions"
```

---

### Task 4: Budgets, accounts/payees/categories, currencies

**Files:**

- Modify: `src/components/budgets/BudgetCard.tsx` (Card and GoalCard), `src/components/budgets/BudgetPaginationWrapper.tsx` (ignore touches that start inside `[data-swipe-card]`; `SwipeableCard` sets that attribute)
- Modify: `src/components/management/EntityCardGrid.tsx` (rows are `li.app-mobile-row`; respect `isDeletable`)
- Modify: `src/components/management/CurrencyManagement.tsx` (rows ~L425-470; mark the rate input area so it never swipes)
- Test: `src/components/budgets/BudgetPaginationWrapper.test.tsx`, a new `src/tests/BudgetCardGestures.test.tsx`, `src/components/management/EntityManagementPage.selectionBar.test.tsx` (or a new `EntityCardGestures.test.tsx`), a new `src/tests/CurrencyGestures.test.tsx`

**Interfaces:**

- Consumes: `SwipeableCard`, `CardAction` (Task 1). `SwipeableCard` root gets `data-swipe-card` (add it in this task if Task 1 did not).

- [ ] **Step 1: Write the failing tests.** Budgets: `swiping a budget card left reveals Delete; tapping opens the existing confirmation`; `swiping right reveals Edit`; `a swipe starting on a card does not change the page, a swipe outside the cards still pages` (Review Focus 4); `goal cards behave the same`. Entities: `swipe left reveals Delete and tapping opens the existing ConfirmationDialog` (accounts, payees, categories); `swipe right reveals Edit`; `a non-deletable item has no left swipe`; `the full-card details button still opens the dialog on tap`; `select mode/checkboxes unaffected`. Currencies: `swipe left reveals Delete and tapping removes the currency like the Trash button`; `dragging or pressing in the rate input never swipes and the value stays editable` (Review Focus 5); no right swipe.

- [ ] **Step 2: Run them to see them fail.** Run: `pnpm exec vitest run src/components/budgets src/components/management src/tests/BudgetCardGestures.test.tsx src/tests/CurrencyGestures.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement** with the same pattern: one `CardAction[]` per card from the existing handlers (`handleDeleteClick`, `handleEditClick`, `removeCurrency`). Keep the inline Edit/Delete buttons as they are. For budgets and entities with no visible "…", long press still opens the menu anchored to the card.

- [ ] **Step 4: Run the tests.** Run: `pnpm exec vitest run src/components src/pages src/tests`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src
git commit -m "feat(gestures): swipe and long press on budgets, accounts, payees, categories and currencies"
```

---

### Task 5: Docs, native note, full checks

**Files:**

- Modify: `documentation/USER_GUIDE.md` (a "Swipe and long press" section: which lists, left = delete, right = duplicate/edit, long press opens the menu, the "…" buttons still work, nothing happens until you tap the revealed button)
- Modify: `documentation/UI_UX_STANDARDS.md` (a "Gestures" section: reveal-then-tap, axis lock, edge guard, inputs excluded, accessible route required, reduced motion, contrast of the red action, use `SwipeableCard` for every new list)
- Modify: `documentation/IOS_RULES.md` and `documentation/ANDROID_RULES.md` (one short bullet each: gestures never the only route; haptics via `@capacitor/haptics`; run `cap sync` after `pnpm build:app`)
- Modify: `documentation/BACKLOG.md` (remove "Phone gestures: swipe to delete and long-press menus" from 2.1; add "Two-finger drag down a list to select several rows" as a later idea)
- Modify: `documentation/CLAUDE.md` (a short "Gestures" lesson: new lists use `SwipeableCard`; swipe never commits; inputs excluded)

- [ ] **Step 1: Update the docs** as listed, in plain English.

- [ ] **Step 2: Run every CI check.** Run: `pnpm lint && pnpm format:check && pnpm exec tsc --noEmit && pnpm test:coverage && pnpm build && pnpm build:app && pnpm audit --prod --audit-level=moderate`. Expected: all pass. Commit `src/data/acknowledgments.generated.ts` if regenerated.

- [ ] **Step 3: Check it on a phone-sized screen.** Run the app (headless browser with touch emulation). At 360px wide with Larger text, in light and dark: swipe each list's card left and right, open a menu with long press, confirm the vertical scroll still works, nothing overflows sideways, the red action is readable, and budget paging still works outside cards. Report plainly what could not be checked (real iPhone haptics and the iOS back swipe need a device).

- [ ] **Step 4: Commit and push.**

```bash
git add -A
git commit -m "docs: swipe and long-press gestures in the user guide and UI standards"
git push -u origin feature/2.1-gestures
```

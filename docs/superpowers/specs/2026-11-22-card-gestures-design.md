# Phone gestures: swipe and long press on cards (2.1)

Status: scope approved by the owner from `documentation/BACKLOG.md` ("Phone gestures: swipe to delete and long-press menus"), 22 Nov 2026. Branch: `feature/2.1-gestures` (from `feature/2.1`). The decisions below fill the gaps the backlog leaves; each is the builder's call and is flagged for the owner.

## Goals

- Swipe left on a card reveals a red **Delete** action; swipe right reveals the card's most useful harmless action (**Duplicate** on transactions and scheduled transactions, **Edit** on ledgers, budgets, accounts, payees, categories).
- Long press opens the card's "…" menu, with a light haptic tap on phones.
- One shared component, built from one action list per card, so gestures and the menu can never offer different things.
- Lists covered: ledgers, transactions, scheduled transactions, budgets, accounts, payees, categories, currencies, and the safety copies on the Backup screen.

## Non-goals

- Multi-finger gestures; two-finger drag to select (later).
- Full-swipe auto-commit. Nothing is deleted or changed by the swipe alone.
- Gestures with a mouse. Only touch and pen pointers swipe; desktop keeps its buttons and menus.

## Decisions

1. **Reveal, then tap.** A swipe slides the card to show a button (iPhone Mail style). The action runs only when the person taps that button. This keeps today's rules: where delete asks for confirmation (ledgers always, budgets, accounts, payees, categories, safety copies) the tap opens the same confirmation; where it doesn't (transactions, scheduled transactions, currencies) it deletes as the menu does today, but never by accident from a swipe.
2. **Right swipe is never destructive.** Only Duplicate or Edit. Lists with no harmless action (currencies) have no right swipe; items that cannot be deleted (`isDeletable` false) have no left swipe.
3. **The accessible route stays.** Gestures are never the only way. Cards that already show inline Edit/Delete buttons keep them. Cards with no phone menu today (ledgers on phones, transactions) get a "…" button built from the same action list. A card's long press opens the same menu; where there is no visible "…" the menu opens anchored to the card.
4. **Scheduled transactions gain Duplicate** (menu, and swipe right), because the backlog names it and it does not exist yet. It creates a copy of the schedule with the same fields.
5. **Don't fight the system.** Vertical scrolling wins: the card claims a gesture only when horizontal movement passes 12px and is at least 1.5 times the vertical movement. A touch that starts within 20px of the left screen edge is ignored (iOS back swipe). A press that starts on an input, textarea, link, button or an element marked `data-selectable-text` neither swipes nor long-presses (text selection, the currency rate field). Budget cards sit in a paging swipe: a touch that starts on a card belongs to the card; paging by swipe keeps working outside the cards, and the arrow buttons and keys are unchanged.
6. **Haptics** use the official `@capacitor/haptics` plugin (light impact on long press). On the web it does nothing. This is a new native plugin, so iOS and Android need `cap sync` and a new store build; the owner should know.
7. **Reduced motion**: when the app's reduce-motion setting (or the device's) is on, the card jumps to open/closed with no slide animation; everything still works.
8. **Open card closes** on tap elsewhere, on vertical scroll, when another card opens, and when selection mode starts.
9. The selected-state outline (`app-row-selected`) and select mode keep working; a card in select mode does not swipe.

## Where each list gets its actions

| List | Swipe left | Swipe right | "…" button | Confirmation on delete |
| --- | --- | --- | --- | --- |
| Ledgers | Delete | Edit | added on phones | always (existing dialog) |
| Transactions (phone card) | Delete | Duplicate | added | none today, none added |
| Scheduled transactions | Delete | Duplicate (new) | existing | none today |
| Budgets | Delete | Edit | inline buttons stay | existing dialog |
| Accounts, payees, categories | Delete | Edit | inline buttons stay | existing dialog |
| Currencies | Delete | none | none (inline Trash stays) | none today |
| Safety copies | Delete | none | existing | existing dialog |

## Also in scope

- Text in all five languages (`src/i18n/areas/`); reuse existing "Delete", "Edit", "Duplicate" keys where they exist.
- Accessibility: 44pt targets, a red action that passes 4.5:1 in both themes, VoiceOver/TalkBack labels on the revealed button, nothing relying on colour alone, works at Larger text on 360px.
- Docs: `USER_GUIDE.md` (gestures), `UI_UX_STANDARDS.md` (gesture rules), `BACKLOG.md` (remove the item, keep "two-finger drag to select" as a later idea).
- No Local API or demo data change: nothing here changes stored data or API behaviour.

# Store Readiness

The pre-submission audit for the Apple App Store (iOS and macOS) and Google Play (Android), written after the November 2026 UX polish. Use the checklist in section 3 on a real device before each submission.

Version checked: 1.7.2 (iOS `MARKETING_VERSION` 1.7.2, Android `versionCode` 10702, `targetSdkVersion` 36).

## 1. The five biggest friction points, and what changed

| #   | Friction point                                                                                                                                                                       | Fix                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Three hand-written menus (desktop sidebar, phone bottom bar, an unused phone sheet) drifted apart. "More" never showed as selected, and Calendar and AI were hard to find on phones. | One shared menu list (`src/components/navigation/navConfig.ts`) drives every menu, with one rule for which item is selected. "More" is selected when the page lives behind it. |
| 2   | Menus were grouped by how the app is built ("Management", "Configure", "Setup"), so Budgets sat under "Configure".                                                                   | Groups by intent: Everyday, Plan & understand, Organise, AI & connections, and More options (folded away).                                                                     |
| 3   | Technical labels: Vendors, Scheduled Transactions, Essential/Advanced, Analytics, Data, MCP.                                                                                         | Plain labels with 5–8 word subtitles: Payees, Upcoming bills, Simple/Detailed reports, Charts, Your data, Connect other AI apps.                                               |
| 4   | Phone action bars held up to seven same-weight buttons, duplicating the floating + button.                                                                                           | One main button plus an "Actions ▾" menu in which every item has a one-line explanation (Reports use an "Export ▾" menu).                                                      |
| 5   | Help was a step-by-step tour that broke when buttons moved, and the app had no display settings.                                                                                     | A help drawer: tips for the current screen, User Guide previews, text size, high contrast and reduce motion, plus an "Ask AI" guide. ⓘ tips sit beside advanced features.      |

## 2. Store-specific items

### Done in code

- **Permissions:** the app asks for none. Files are opened and saved through the system document picker (`@capawesome/capacitor-file-picker`, `@capacitor/filesystem`), which needs no permission on iOS or Android. The Android manifest declares only `INTERNET`. The iOS privacy manifest declares no tracking and no collected data.
- **Donations** are hidden in the iOS and Android builds (`notNative` in the menu config), as the stores require their own payment systems for in-app payments.
- **Unfinished features:** the report "Excel" export only showed "not yet implemented", so it was removed (App Review 2.1). Report export stays hidden on phones, as before.
- **Accessibility:**
  - Every slide-up panel now has a real screen-reader name; it used to announce "Sheet Title".
  - Panel close buttons are 44×44px.
  - Icon buttons get a 48px touch area on touch screens.
  - Tips open with Enter and close with Escape, and focus returns to the ⓘ.
  - Text scales to 125%, and high contrast strengthens text, borders and control outlines.
- **Empty states** on Transactions, Accounts, Categories, Payees and Upcoming bills say what to do next. Budgets already did.
- **CSV safety:** the report CSV export now neutralises spreadsheet formulas, like the other exports.

### Decided by the owner (November 2026)

1. **AI data sharing (App Review 5.1.2(i)): built.** The first time each AI provider would receive data, the app asks "Send payee names to {provider}?" (`src/utils/aiConsent.ts`, `AiConsentDialog`).
   - The prompt states that payee and category names are sent, and that amounts, dates, accounts and notes never are.
   - "Not now" sends nothing, and the question returns next time.
   - The answer is remembered per provider and address on the device, so pointing a provider at a different service asks again.
   - Switching AI features off forgets all answers.
   - This is in addition to AI being off by default, using the person's own key, and starting only from a button.
2. **Export compliance: declared exempt.** `ITSAppUsesNonExemptEncryption` is `NO` in `ios/App/App/Info.plist`. Encrypted backups use the platform's standard encryption (Web Crypto).
3. **Local network (iOS): not requested.** There is deliberately no `NSLocalNetworkUsageDescription`.
   - The phone and web AI setup says that models on your own computer or home network work in the Mac app only.
   - It refuses `localhost` and home-network addresses (192.168.x, 10.x, 172.16–31.x, `*.local`) with that message.

- **App size:** the store and desktop builds use `pnpm build:app`, which leaves out the website homepage, its demo videos and website-only files (34 MB down to about 5 MB of web content).
- **Prompts:** none on iOS or Android. Android declares only `INTERNET`, which installs without asking. On a Mac, macOS asks for Local Network access only if someone points the AI assistant at another computer on their network; `localhost` never asks.

### Before submitting

1. **Merge to `main`.** The help drawer's "Read more" links open `documentation/USER_GUIDE.md` on `main`, which only has the updated guide after the merge.
2. **Translations.** The Spanish, Chinese, Dutch and Tamil text added in this pass is machine-written. Have a native speaker review it if those store listings will be localised.
3. **Run the 60-second checklist below** on a real iPhone, Mac and Android device.

### App Review notes (paste into App Store Connect / Play Console)

> Vaulted Money has no account or sign-in. To explore every feature, open the app, choose **Generate demo data** on the first screen, then open any ledger. All data stays on the device. AI features are optional, off by default, and use the reviewer's own API key if they choose to try them. Connecting other AI apps is available in the Mac app only.

## 3. The 60-second checklist

Start from a fresh install with demo data generated. Each row should take a newcomer under 60 seconds on that platform. Tick a box only after trying it on a real device or simulator.

| Feature                     | What to try                                                                 | Pass when                                                                                                     | iOS | macOS | Android    |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --- | ----- | ---------- |
| First launch                | Open the app, generate demo data, open a ledger                             | The Overview shows balances and recent spending; the ⓘ beside the ledger picker explains ledgers              | ☐   | ☐     | ☐          |
| Navigation                  | Visit Overview, Transactions, Accounts, Budgets, then Calendar through More | The selected tab is marked (colour plus a bar); More is marked on Calendar; back returns to the previous page | ☐   | ☐     | ☐          |
| Add a transaction           | Tap +, pick account, payee and category, save                               | It appears at the top of Transactions                                                                         | ☐   | ☐     | ☐          |
| Search                      | Type "groceries over 50 last month" in Transactions                         | The suggestions say what was understood; nothing applies until picked                                         | ☐   | ☐     | ☐          |
| Actions menu                | Open Actions on Accounts                                                    | Every item shows a one-line explanation; Reconcile Balance opens                                              | ☐   | ☐     | ☐          |
| Budgets                     | Open Budgets, try Smart Create                                              | Smart Create suggests budgets to accept; each budget shows how much is left                                   | ☐   | ☐     | ☐          |
| Upcoming bills and Calendar | Open Upcoming bills, then Calendar                                          | Repeating bills show on the right days; the ⓘ explains how repeats work                                       | ☐   | ☐     | ☐          |
| Reports                     | Open Reports > Simple; on desktop open Export                               | The report renders; Export offers PDF and CSV only                                                            | ☐   | ☐     | n/a export |
| Help drawer                 | Tap ? in the top bar                                                        | Tips for the current screen; "Read more" opens a preview; Escape or swipe closes it                           | ☐   | ☐     | ☐          |
| Display settings            | In the drawer set Larger, High contrast, Reduce motion                      | Text grows without clipping; the logo stays round; nothing animates; settings survive a restart               | ☐   | ☐     | ☐          |
| Ask AI                      | Open the Ask AI tab, copy a question                                        | Status rows are accurate; the copy confirms; "Set up the AI assistant" opens setup                            | ☐   | ☐     | ☐          |
| AI permission               | Set up a provider, then use Categorize Missing                              | The first use asks "Send payee names to …?"; Not now sends nothing; after allowing, it is not asked again     | ☐   | ☐     | ☐          |
| Connect other AI apps       | AI assistant > Connect other AI apps                                        | Mac: the steps open. iOS/Android: says Mac app only                                                           | ☐   | ☐     | ☐          |
| Backup                      | Your data > Export JSON, then import it                                     | The file saves through the system picker and restores                                                         | ☐   | ☐     | ☐          |
| Screen reader               | VoiceOver / TalkBack across the bottom bar, Actions menu and help drawer    | Every control has a spoken name; no "Sheet Title"                                                             | ☐   | ☐     | ☐          |
| Dark mode and offline       | Switch to dark mode; turn on airplane mode                                  | Everything above still works offline; text stays readable                                                     | ☐   | ☐     | ☐          |

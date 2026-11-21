# Store Listing Text

Copy for the App Store and Google Play listings, version 2.0.0. Paste each block into the field named in its heading. Character limits are in brackets.

Rules both stores enforce:

- Apple text must not mention Android or Google Play, and Google text must not mention iPhone, iPad, Mac or the App Store.
- No prices, "free" claims or "best/#1" claims in the app name, subtitle or short description.
- No real company or product names other than the AI services the app connects to.

---

## Apple App Store

### Name [30]

```
Vaulted Money
```

### Subtitle [30]

```
Private Vault, Open Code
```

### Promotional Text [170]

```
Track spending, set budgets and search in plain English. Everything stays on your device: no sign-up, no cloud, no ads. AI is optional and off by default.
```

### Description [4000]

```
Vaulted Money is a personal finance app that keeps your money to yourself. There is no account to create and no server to trust: your books live on your device and work fully offline.

TRACK EVERYTHING IN ONE PLACE
• Accounts, transactions, payees, categories and sub-categories
• Several separate ledgers, for example personal and household
• Many currencies, with totals in the currency you choose
• Import bank statements from CSV, and export to CSV or PDF

STAY AHEAD OF YOUR SPENDING
• Budgets that warn you before you overspend
• Smart Create suggests budgets from your own history
• Upcoming bills and a calendar for repeating payments
• Charts and simple reports that show where your money really goes

SEARCH THE WAY YOU TALK
Type "groceries over 50 last month" or "rent this year" and Vaulted Money works out what you mean, right on your device. It shows what it understood, and nothing is applied until you pick it. Plain-language search currently understands English.

PRIVATE BY DESIGN
• No sign-up, no tracking, no ads
• Encrypted backups you save wherever you like
• Optional sync between your own devices through a cloud folder you already use. Set a passphrase and the file is encrypted before it leaves the device, so the cloud service cannot read it. If two devices both changed, you choose which copy to keep.

AI ONLY WHEN YOU ASK
AI features are off by default. Switch them on to sort uncategorised payees with your own key from a provider you choose, or with a model running on your own Mac. Before anything is sent, Vaulted Money tells you exactly what goes and asks first: only payee and category names, never amounts, dates, accounts or notes.

MADE FOR EVERYONE
• English, Spanish, Chinese, Dutch and Tamil. Possibility to port your own language
• Larger text, high contrast and reduced motion
• Full VoiceOver support
• Light and dark mode
• Made for iPad and iPhone Duo: open it up for list and details side by side

Vaulted Money is open source. You can read every line of code that handles your money.
```

### iPhone Duo launch wording (optional)

In use since launch (160 of 170 characters). Promotional text can change at any time without a new version, so switch back to the text above once Duo is no longer new:

```
Track spending and budgets privately: no sign-up, no cloud, no ads, AI is optional. Built for iPhone Duo too: open it up for your list and details side by side.
```

**Featuring → Nominations** in App Store Connect lets you ask Apple's editors to consider the app. Nominate "App Launch" for 2.0.0, either in the form or by importing Apple's CSV template (filled-in copy kept outside the repo; the app's Apple ID is 6837669703). Name: "Vaulted Money 2.0 launch". Platforms: iPhone and iPad. Short pitch:

```
Vaulted Money 2.0 is a private, offline money manager built for iPhone Duo: when opened, transactions and their details sit side by side, and the layout adapts when you open or close it. No account, no tracking; everything stays on the device. Plain-English search and optional AI with the user's own key.
```

Avoid "Ready for Duo" badges or Apple logos in images, and keep "iPhone Duo" out of the keywords: Apple's names may be mentioned in text, but not used as a badge or as search keywords.

### Keywords [100]

Separate with commas, no spaces. Words already in the name or subtitle are left out, since Apple indexes those anyway.

```
budget,expense tracker,personal finance,spending,ledger,bills,savings,cash flow,privacy,categories
```

### URLs

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| Support URL        | https://github.com/nrajesh/vaulted.money/issues |
| Marketing URL      | https://vaulted.money                           |
| Privacy Policy URL | https://vaulted.money/privacy                   |

### Other fields

| Field              | Value                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Copyright          | 2026 Rajesh Narayanan                                                                        |
| Primary category   | Finance                                                                                      |
| Secondary category | Productivity                                                                                 |
| Price              | €9.99 base price (Netherlands); paid apps need the Paid Apps agreement, bank and tax details |
| Availability       | All countries except China mainland (needs an ICP filing first)                              |
| Version            | 2.0.0, build 5                                                                               |

### App Privacy

Choose **"No, we do not collect data from this app."** Everything stays on the device. Payee names sent to an AI provider go directly from the device to a provider the user picks, with the user's own key, after the user agrees; the developer never receives them.

### Age rating

Answer **None / No** to every question, including the extra questions in Apple's newer questionnaire (in-app controls, capabilities, medical or wellness topics). The app has no user-generated content shared with others, no web browsing, no gambling and no mature content. The result is **4+**.

### App Accessibility

Declare only what works for every common task:

| Feature                           | Declare | Why                                                                                                     |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| VoiceOver                         | Yes     | Labelled controls throughout                                                                            |
| Dark Interface                    | Yes     | Full dark theme                                                                                         |
| Sufficient Contrast               | Yes     | Text measured at 4.5:1 and outlines at 3:1 in both themes                                               |
| Reduced Motion                    | Yes     | Follows the system setting, with an in-app switch                                                       |
| Larger Text                       | No      | Apple asks for 200%; the app ignores the iPhone text size and its own setting stops at 125%. Fix in 2.1 |
| Voice Control                     | No      | Not tested yet                                                                                          |
| Differentiate Without Color Alone | No      | The calendar marks money in and out by colour only                                                      |
| Captions, Audio Descriptions      | No      | No video or audio content in the app                                                                    |

### Other App Store Connect answers

| Item                          | Answer                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Copyright                     | 2026 Rajesh Narayanan                                                                                                        |
| Content Rights                | No third-party content                                                                                                       |
| Export compliance             | Uses non-exempt encryption: No (standard OS encryption only); already answered by the build                                  |
| Version release               | Manual                                                                                                                       |
| Review contact                | The owner's own name, phone and email (filled in App Store Connect, not kept here)                                           |
| Apple Silicon Mac, Vision Pro | Off: the desktop app is sold on Polar, and the iPhone app is not tested on either                                            |
| Apple School Manager discount | On (Apple's default; schools buying in volume pay half)                                                                      |
| App Compliance (China)        | Security Assessment and AI-Generated Content say "Missing info" for China mainland; ignore them while China is not available |

### App Review Information

- **Sign-in required:** No.
- **Contact:** your own name, phone and email.
- **Notes:**

```
Vaulted Money has no account or sign-in. To explore every feature, open the app, choose "Generate demo data" on the first screen, then open any ledger. All data stays on the device. AI features are optional, off by default, and use the reviewer's own API key if they choose to try them. Before any data is sent to an AI provider the app asks for permission and lists exactly what is sent (payee and category names only). Connecting other AI apps is available in the Mac app only.
```

### What's New

Apple does not show this field for a first release. Use the Google Play release notes below for later versions.

### Screenshots and preview video

Where each file goes on the version page, tab **App Previews and Screenshots**. Paths are under `marketing/`. Each device slot takes up to 3 previews and 10 screenshots; upload screenshots in number order, because the first three show in search results.

| Slot in App Store Connect                | Files                                                                                    | How to make them                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| iPhone with Dynamic Island: App Previews | `app-preview/out/vaulted-money-app-preview.mp4`                                          | `pnpm marketing:preview`                          |
| iPhone with Dynamic Island: Screenshots  | `store-screenshots/out/iphone63/en/` 01–06                                               | `pnpm marketing:screenshots`, then resize (below) |
| iPhone Duo                               | `store-screenshots/out/duoInner/en/` 01–07, then `duoOuter/en/` 01–03 (10 in total)      | `pnpm marketing:screenshots`                      |
| iPad 13" display                         | `store-screenshots/out/ipad13/en/` 01–07                                                 | `pnpm marketing:screenshots`                      |
| Apple Watch                              | Leave empty (no Watch app)                                                               |                                                   |
| Header and Search Results tab: Universal | `store-screenshots/out/appStoreHeader/universal.png` or `universal-swap.png` (5244×2950) | `node marketing/store-screenshots/header.mjs`     |

- **What each image shows:** 01 Overview, 02 plain-English search, 03 Accounts, 04 AI assistant, 05 Budgets, then on iPad and the open Duo 06 list and details side by side, and last the Calendar (06 on iPhone, 07 on iPad and Duo).
- **Preview video (under 30 s):** brand opening → Overview → search "groceries in checking last month over 25" applied to the list → Budgets, tapping the first budget with spending through to its transactions → Calendar → AI switched on and the Add AI Provider form → brand close. A short chapter card covers each cut.
- **iPhone Duo:** optional. Without it, Apple shows the iPhone images on Duo. Inner and outer images share one slot of 10: upload the open (`duoInner`) set 01–07 first, then the closed (`duoOuter`) 01–03. No Duo preview video or half-open (tabletop) images are needed.
- **Header and search results:** one universal image covers both: the app icon, name and subtitle in Apple's safe area, with app screens either side that may be cropped. Run `pnpm marketing:screenshots` first (it makes the captures), then `CHROME=… node marketing/store-screenshots/header.mjs`. Apple reviews these images separately; they show on iOS 27 and later.
- **Poster frame:** in Edit Poster Frame, pick a frame in the first two seconds, where the app icon, name and "Private Vault, Open Code" show. It cannot be changed after Apple approves the preview.
- **6.3" iPhone images:** App Store Connect asks for 1206×2622, while the tool makes 1320×2868 (`iphone69`). Resize with `for f in marketing/store-screenshots/out/iphone69/en/*.png; do sips -s format png -z 2622 1206 "$f" --out marketing/store-screenshots/out/iphone63/en/$(basename "$f"); done`.
- Apple uses the iPhone set for every smaller iPhone size.
- If the screenshot tool's own browser fails to start, run it with `CHROME="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"` in front.

---

## Google Play

### App name [30]

```
Vaulted Money: Private Budget
```

### Short description [80]

```
Private, offline budgeting. No sign-up, no cloud. Optional AI, off by default.
```

### Full description [4000]

```
Vaulted Money is a personal finance app that keeps your money to yourself. There is no account to create and no server to trust: your books live on your phone and work fully offline.

TRACK EVERYTHING IN ONE PLACE
• Accounts, transactions, payees, categories and sub-categories
• Several separate ledgers, for example personal and household
• Many currencies, with totals in the currency you choose
• Import bank statements from CSV and keep encrypted backups

STAY AHEAD OF YOUR SPENDING
• Budgets that warn you before you overspend
• Smart Create suggests budgets from your own history
• Upcoming bills and a calendar for repeating payments
• Charts and simple reports that show where your money really goes

SEARCH THE WAY YOU TALK
Type "groceries over 50 last month" or "rent this year" and Vaulted Money works out what you mean, right on your phone. It shows what it understood, and nothing is applied until you pick it. Plain-language search currently understands English.

PRIVATE BY DESIGN
• No sign-up, no tracking, no ads
• Encrypted backups you save wherever you like
• Optional sync between your own devices through a cloud folder you already use. Set a passphrase and the file is encrypted before it leaves the phone, so the cloud service cannot read it. If two devices both changed, you choose which copy to keep.

AI ONLY WHEN YOU ASK
AI features are off by default. Switch them on to sort uncategorised payees with your own key from a provider you choose. Before anything is sent, Vaulted Money tells you exactly what goes and asks first: only payee and category names, never amounts, dates, accounts or notes.

MADE FOR EVERYONE
• English, Spanish, Chinese, Dutch and Tamil. Possibility to port your own language
• Larger text, high contrast and reduced motion
• Full TalkBack support
• Light and dark mode
• Tablet layout with list and details side by side

Vaulted Money is open source. You can read every line of code that handles your money.
```

### Release notes for 2.0.0 [500]

```
First release on Google Play.
• Budgets, bills, charts and reports, fully offline
• Search in plain English, right on your phone
• Encrypted sync through your own cloud folder; you choose which copy to keep if two devices changed
• Optional AI sorts payees with your own key, and asks before sending anything
• English, Spanish, Chinese, Dutch and Tamil. Possibility to port your own language
```

### Store settings

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Category       | Finance                                                                          |
| Tags           | Budgeting, Expense tracker, Personal finance                                     |
| Email          | your support email                                                               |
| Website        | https://vaulted.money                                                            |
| Privacy policy | https://vaulted.money/privacy                                                    |
| Price          | €9.99, set as Paid when creating the app (a free Play app can never become paid) |
| Countries      | All except China (Google Play is not offered there)                              |

### App content answers

| Page               | Answer                                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy     | https://vaulted.money/privacy                                                                                                                                              |
| Ads                | No                                                                                                                                                                         |
| App access         | All functionality is available without special access. Paste the review note from the Apple section.                                                                       |
| Content rating     | Category "Utility, productivity, communication or other"; answer No to everything. Expect Everyone / PEGI 3.                                                               |
| Target audience    | 18 and over                                                                                                                                                                |
| Data safety        | Collects no data and shares no data. Data is encrypted in transit: Yes (AI calls and sync go over HTTPS). Users can request deletion: deleting the app removes everything. |
| Financial features | Choose **Personal finance: budgeting or expense tracking** and nothing else.                                                                                               |
| Government app     | No                                                                                                                                                                         |
| Health             | None                                                                                                                                                                       |

### Graphics

Made by `pnpm marketing:screenshots`, in `marketing/store-screenshots/out/`:

| Play asset                 | Folder                |
| -------------------------- | --------------------- |
| App icon 512×512           | `public/icon-512.png` |
| Feature graphic 1024×500   | `playFeature/en/`     |
| Phone screenshots          | `playPhone/en/`       |
| 7-inch tablet screenshots  | `playTablet7/en/`     |
| 10-inch tablet screenshots | `playTablet10/en/`    |

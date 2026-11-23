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

Apple lets you publish these only after a version is live: open App Accessibility and press **Publish** on launch day (the iPhone and iPad drafts are saved).

### Other App Store Connect answers

| Item                          | Answer                                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copyright                     | 2026 Rajesh Narayanan                                                                                                                                             |
| Content Rights                | No third-party content                                                                                                                                            |
| Export compliance             | Uses non-exempt encryption: No (standard OS encryption only); already answered by the build                                                                       |
| Version release               | Manual                                                                                                                                                            |
| Review contact                | The owner's own name, phone and email (filled in App Store Connect, not kept here)                                                                                |
| Apple Silicon Mac, Vision Pro | Off: the desktop app is sold on Polar, and the iPhone app is not tested on either                                                                                 |
| Apple School Manager discount | On (Apple's default; schools buying in volume pay half)                                                                                                           |
| DSA trader status             | Verified (November 2026) with the owner's private address. The KvK extract shows the Zeist postbox; switch to it after launch, since a change goes back to review |
| App Compliance (China)        | Security Assessment and AI-Generated Content say "Missing info" for China mainland; ignore them while China is not available                                      |

### App Review Information

- **Sign-in required:** No.
- **Contact:** the owner's own name, phone and email (kept in App Store Connect).
- **Attachment:** a screen recording from a physical iPhone, starting at launch (Apple asked for it after the first submission, Guideline 2.1 "Information Needed").
- **Notes** (answers Apple's six questions; 4000-character limit):

```
1. SCREEN RECORDING
Attached: recorded on a physical iPhone running the latest iOS with build 2.0.0 (5), with spoken commentary, starting from launching the app. It shows generating demo data, the dashboard, plain-English search, adding a transaction, budgets, the calendar, exporting a CSV file to the Files app, and the optional AI setup. The app has no account registration, login or account deletion, no user-generated content shared with others, and no in-app purchases: it is a one-time paid download, so every feature is available from the first launch.

2. PURPOSE AND AUDIENCE
Vaulted Money is a private personal money manager for adults who want to track their spending, accounts and budgets without handing their financial data to a company. Most budgeting apps need an account and store bank data on a server; Vaulted Money keeps everything on the device. It covers transactions, accounts, budgets, recurring payments, a cash-flow calendar, reports and plain-English search (for example "groceries in checking last month over 25").

3. HOW TO ACCESS THE MAIN FEATURES
No login or sample files are needed.
- Open the app and choose "Generate demo data" on the first screen. This creates a sample ledger with a year of transactions; open it.
- Overview: the dashboard.
- Transactions: tap the search box, type "groceries in checking last month over 25", tap "Apply all", then "Done".
- Budgets: tap a budget to see the transactions behind it.
- Calendar: tap a day to see money in, money out and scheduled payments.
- Accounts and Reports: from the menu.
- Backup: Menu > Backup to export or restore a file.
- AI (optional, off by default): Menu > AI assistant > "Turn on AI" > "Add AI Provider" with your own API key. Before anything is sent, the app asks for permission and lists what is sent (payee and category names only).
People can also add transactions by hand or import a CSV file exported from their bank.

4. EXTERNAL SERVICES
None are needed for the core features, which work fully offline. Optional, used only when the person chooses:
- An AI provider the person picks and pays for with their own API key (OpenAI, Anthropic, Google Gemini, Mistral or Perplexity), to suggest categories for payees. Only payee and category names are sent, after the person agrees.
- Frankfurter (api.frankfurter.dev), a free public exchange-rate service: the currency list and rates, when the person opens Currencies or refreshes rates. No personal data is sent.
- The person's own cloud folder (for example iCloud Drive through Files) for optional sync between their own devices. The file is encrypted on the device first.
There is no developer server, authentication service, analytics, advertising or payment processor.

5. REGIONAL DIFFERENCES
The app works the same in every region where it is offered. The interface is available in English, Spanish, Chinese, Dutch and Tamil and follows the device language. Plain-English search understands English phrases in all regions. The app is not offered in China mainland.

6. REGULATED INDUSTRY
Vaulted Money is a personal record-keeping tool. It does not connect to banks, move or hold money, process payments, or give financial or investment advice, so no financial licence applies. It contains no protected third-party material. Developer: Imaginest (sole trader, Netherlands, Chamber of Commerce no. 42086797).
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

App created in November 2026 under the developer account "Imaginest" (a **personal** account), app ID 4973580024893380928, package `com.vaultedmoney.app`. Personal accounts must run a closed test with at least 12 opted-in testers for 14 days in a row before Production can be requested.

### App name [30]

```
Vaulted Money
```

The app is a money manager and account tracker, not only a budget app, so the name carries no tagline; the short description and tags cover budgeting.

### Short description [80]

```
Private money manager: accounts, budgets and bills. Offline, no sign-up.
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

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Category       | Finance                                                                                         |
| Tags           | Personal finance, Finance (Play has no budgeting, expense, money or accounting tags)            |
| Email          | apps@imaginest.nl                                                                               |
| Phone          | None                                                                                            |
| Website        | https://vaulted.money                                                                           |
| Privacy policy | https://vaulted.money/privacy                                                                   |
| Paid           | Chosen when creating the app; once published, a free Play app can never become paid             |
| Countries      | All Play offers (China has no Google Play); the "Select countries" task unlocks after a release |

### Prices

Play prices match the App Store price of each country, taxes included: €9.99 in the euro countries, £8.99 in the UK, $8.99 in the US, CHF 8.00, ¥1,500, R$39.90 and so on. The source is the App Store Connect price export (three CSVs: current prices that may adjust automatically, manually adjusted prices, and prices ending on Dec 3, 2026).

**Family sharing:** one purchase covers the family on both stores, at the same price. Neither store has a separate family price for a paid app. On the App Store, Family Sharing is always on for paid apps. On Play, the listing shows "Eligible for Family Library" (checked on Nov 23, 2026), so it is on, and Play does not let it be switched off again. A family price would need a free app with two in-app purchases, which is not planned.

- Do not set one euro base price and let Play convert it. Play treats it as the price before tax, so €9.99 became €11.99 in every country with VAT. Edit each country instead.
- Where Play bills in another currency than Apple (Apple's USD countries such as Algeria, Argentina, Kenya and Ukraine, and Bosnia and Serbia, where Apple uses euros), Play's converted price is kept.
- Countries Play sells in that the App Store export lacks follow the nearest App Store price: Monaco, San Marino and Vatican City €9.99, Liechtenstein CHF 8.00, Gibraltar £8.49, and $8.99 in Aruba, Comoros, Djibouti, Eritrea, Guinea, Haiti, Samoa and Somalia. Montenegro (€7.99 on the App Store) is not in Play's price table.

### Testing a paid app

Testers in closed and open tests must buy a paid app; only internal testers install it free. A country's price cannot be €0. To let the 12 closed testers in for free, use promo codes (Monetize with Play → Promo codes; up to 500 a quarter). The page is open before launch, but whether codes work while the app is still a draft is unconfirmed. Fallback: set the lowest allowed price in the testers' countries during the test, then restore the prices above before applying for Production.

Status (22 November 2026): version 2.0.0 (version code 20000) is live on **internal testing** (list "Vaulted Money internal"); it installs and runs from Play on a Pixel emulator. Production needs the closed test first.

The store listing, App content declarations and category were first sent for review on 22 November 2026; that submission was cancelled automatically when the closed test was submitted, and everything went into one review (submission 2, 22 November 2026, "In review"), with managed publishing off. Approval publishes nothing publicly: it replaces "Unrated" with PEGI 3 and the temporary name with Vaulted Money for testers, and makes the closed test live for its testers. Submission 2 was published on 22 November 2026.

Submission 4 (23 November 2026, "In review", store listing only; submission 3 was cancelled and replaced by it) changes the app icon to the opaque one and the phone and tablet screenshots. It goes live as soon as it is approved and does not affect testers' build.

**12 testers for 14 days** applies to each new app on this personal account, not once per account. An app that has production access does not need it again for updates. An organisation account (for example under Imaginest's KvK number) is exempt.

**Organisation account (in verification).** On 23 November 2026 an organisation developer account was opened for Imaginest. It uses the Google account admin@imaginest.nl (no Gmail inbox; mail goes to the imaginest.nl mailbox), the developer name "Imaginest, NL" ("Imaginest" is taken by the personal account), contact email apps@imaginest.nl, and D-U-N-S 473960705 (Imaginest, Kwikstaartlaan 42 Box G0996, 3704 GS Zeist; found free with Apple's D-U-N-S lookup). The KvK extract was sent as proof of the organisation, with the owner's passport for identity. The personal account was declared as another account used with Play Console.

Plan once it is approved: move Vaulted Money there with Play's app transfer (the package name cannot be reused in a new app, so a transfer is the only way), then rename the personal account and call the organisation account "Imaginest". Check whether a transfer before the 14-day test ends would skip the test; otherwise launch first and transfer afterwards. Apple most likely won't accept an eenmanszaak as an organisation, so the App Store account stays individual.

**Closed testing – Alpha:** 173 countries (all Play offers), release "Vaulted Money v2.0.0" with bundle 20000 from the library and the same notes, full rollout to the email list "Vaulted Money closed testers", feedback to apps@imaginest.nl. Opt-in link: https://play.google.com/apps/testing/com.vaultedmoney.app. The internal list keeps only the owner's account, so every tester follows one path: opt-in link, promo code, install. Only closed-test testers count towards the 12 testers for 14 days, and each tester's 14 days start when they opt in.

**Message to testers** (one code each; send only after the closed test is approved):

> Thanks for helping! Vaulted Money is my private money-manager app: accounts, budgets and bills, fully offline, no sign-up. Google needs 12 people to test it for 14 days in a row before it can go on the Play Store.
>
> 1. Join the test on your Android phone, in Chrome: https://play.google.com/apps/testing/com.vaultedmoney.app and tap Become a tester. Use the same Google account in Chrome and in the Play Store.
> 2. Get the app free with your personal code (it normally costs €9.99): https://play.google.com/redeem?code=[CODE], or Play Store → profile picture → Payments & subscriptions → Redeem code. Please don't share the code.
> 3. Install from the link in step 1.
>
> Open it now and then over the next 14 days (Generate demo data on the first screen lets you try everything), please don't leave the test before [date], and tell me anything odd or broken (reply, or apps@imaginest.nl). If Play says "Item not found", wait an hour and try again.

- **Testers must be adults.** An unsupervised under-18 account on a certified Pixel 10a saw "This item isn't available", while an adult account on the same phone got the Install button. Until Google reviews the app it shows as "Unrated", and it is paid; Google limits both for minors.
- **Chrome and the Play Store must use the same Google account** when opening the test link; mixing accounts gives "Item not found" or a blank sheet. A tester who leaves and rejoins may see "Something went wrong on our end" for a while.
- Promo codes: batch "Vaulted Money Promo 1", 25 codes, valid until 31 December 2026 (codes kept outside the repository). Internal testers don't need one.

Console links: the Play account is the second signed-in Google account in the browser, so links use `/u/1/` (for example https://play.google.com/console/u/1/developers/9063481855871569660/app/4973580024893380928/tracks/internal-testing).

### App content answers

| Page               | Answer                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy     | https://vaulted.money/privacy                                                                                                                     |
| Ads                | No                                                                                                                                                |
| App access         | "No part of your app is restricted". This option has no instructions field, so the Apple review note is not used.                                 |
| Content rating     | Category "All Other App Types"; No to everything; email apps@imaginest.nl. Result: PEGI 3, ESRB Everyone, USK 0.                                  |
| Target audience    | 18 and over                                                                                                                                       |
| Data safety        | No data collected, no data shared (the security questions only appear after a Yes). See the note below.                                           |
| Financial features | "My app doesn't provide any financial features". Play lists no budgeting option; its categories are banking, loans, payments, trading and advice. |
| Trader status      | Yes (the account is a trader); Terms of Service URL left empty.                                                                                   |
| Government app     | No                                                                                                                                                |
| Health             | "My app does not have any health features"                                                                                                        |

**Data safety risk.** Google counts data "transmitted off device from your app" as collected, "irrespective of whether data is transmitted to you or a third-party server"; only on-device and end-to-end encrypted data are exempt. The optional AI feature sends payee and category names to the provider the user picks, so a reviewer may call that collection. The owner chose "none" and will correct it if Play flags it. The answer would then be: Yes; Financial info → Other financial info; collected, not shared (the user starts the transfer after an in-app consent); optional; not ephemeral; for App functionality; encrypted in transit; deletion requests No.

### Graphics

Made by `pnpm marketing:screenshots`, in `marketing/store-screenshots/out/`:

| Play asset                 | Folder             |
| -------------------------- | ------------------ |
| App icon 512×512           | see the note below |
| Feature graphic 1024×500   | `playFeature/en/`  |
| Phone screenshots          | `playPhone/en/`    |
| 7-inch tablet screenshots  | `playTablet7/en/`  |
| 10-inch tablet screenshots | `playTablet10/en/` |

**App icon:** use the iOS icon, made 512×512 and opaque, so the listing shows the same dark navy square as the home screen and TestFlight. Do not upload `public/icon-512.png`: it is transparent, so Play shows a small mark on white. Make it with `sips -s format png -Z 512 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png --out play-icon-512.png` (that icon has no transparent pixels).

**AI asset declaration** (Store listing → Review): "Label assets as created or edited using AI", with every asset labelled (icon, feature graphic and all screenshots), since Claude made them all. Foldable screenshots are left empty.

Upload screenshots in headline order: 1 "Your money never leaves your device", 2 "Ask it like you'd say it", 3 "Your money. Your labels. Your rules.", 4 "AI when you want it", 5 "Every budget at a glance", 6 "Room to breathe on big screens" (tablets only), 7 "Bills on the calendar". The phone set skips 6.

---

## Desktop app on Polar

The desktop app (macOS, Windows, Linux) is sold only through Polar, not the Mac App Store. The Mac App Store is planned for 2.1. Polar is the merchant of record and handles EU VAT. Seller: Imaginest (eenmanszaak, Netherlands), support apps@imaginest.nl.

### Product

| Field        | Value                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Name         | Vaulted Money Desktop                                                                                                                    |
| Type         | One-time purchase, no subscription                                                                                                       |
| Price        | €9.99, **tax included** (set on the price itself, not left to the organisation default)                                                  |
| Delivery     | Polar file downloads: Mac (Apple Silicon and Intel), Windows, Linux                                                                      |
| Licence keys | None. The app is MIT-licensed and free to build, and it never contacts a server, so there is no in-app licence check                     |
| Updates      | Buyers download new versions from their Polar customer portal. There is no automatic in-app updater, because it would have to phone home |

Description: One-time purchase of the Vaulted Money desktop app for macOS, Windows and Linux. Private and offline: your data stays on your computer.

### Price check (sandbox, checked 22 Nov 2026)

A Dutch buyer saw subtotal €9.99, taxes (included) €1.73, total €9.99. This matches the App Store and Google Play. Google Play first added Dutch VAT on top (€11.99), so check the total again in the live checkout before announcing it.

### Live setup

| Item                     | Value                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| Live checkout link       | https://buy.polar.sh/polar_cl_E7s1fI8QHCxTneRzbXv2aSxcn0FpUuoBISI7M0cpuNB |
| Buyer portal (downloads) | https://polar.sh/imaginest/portal                                         |

### Status

| Step                                                                              | Status                                                                                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox product, file downloads and test purchase                                 | Done (22 Nov 2026)                                                                                                                 |
| Installers from `main` (2.0.0, App Store build 5)                                 | Done: Mac signed and notarised, Windows and Linux built on GitHub's machines (Windows unsigned, SmartScreen warns on first launch) |
| Live product and checkout link                                                    | Created, price €9.99 tax included                                                                                                  |
| Live file downloads (8 installers)                                                | Uploaded                                                                                                                           |
| Polar organisation review                                                         | Approved (22 Nov 2026)                                                                                                             |
| README link, "which file" guide and website buy button                            | In the PR to `pre-prod`; live after it reaches `main`                                                                              |
| Live checkout total for a Dutch buyer                                             | Checked 22 Nov 2026: subtotal €9.99, taxes (included) €1.73, total €9.99                                                           |
| In-app "Check for updates" (opens the buyer portal on click, no background check) | Idea for 2.1                                                                                                                       |

### Desktop file names (from 2.1)

From 2.1 the desktop files have no spaces: `Vaulted-Money-<version>-mac-arm64.dmg`, `Vaulted-Money-<version>-win-x64.exe`, `Vaulted-Money-<version>-x86_64.AppImage` (the Linux files leave out the system name, which AppImage catalogues ask for). The 2.0.0 files on Polar keep their old names; upload the new names as the 2.1 files and remove the old ones.

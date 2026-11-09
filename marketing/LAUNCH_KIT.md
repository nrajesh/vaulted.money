# Launch kit

Ready-to-post copy for places that only accept posts from a real account.
Post one channel at a time and stay in the comments for the first few hours;
that matters more than the wording. Edit anything that no longer matches the app.

## Hacker News (Show HN)

**Title:** Show HN: Vaulted Money – local-first personal finance with plain-English search, no AI

**URL:** https://vaulted.money/ledgers?demo=1

**First comment:**

> I built Vaulted Money because basic budgeting is addition and subtraction, yet
> most apps want an account, a subscription and my bank data on their servers.
>
> It runs entirely on your device (IndexedDB in the browser, or the desktop and
> mobile builds). No account, no backend, works offline. MIT licensed.
>
> The part I spent the most time on is search. You can type "groceries over 50
> last month" or "largest 5 last year" and it is parsed by a plain deterministic
> parser: no LLM, no network call. It shows what it understood and never applies
> a guess (such as a typo fix) unless you pick it.
>
> Also in there: multiple ledgers and currencies, bank CSV import, budgets,
> reports, encrypted backups, and on desktop a localhost REST API plus an MCP
> server if you want your own agent to read your ledger. AI is optional and
> bring-your-own-key.
>
> The link opens a generated demo ledger so you can try it without entering
> anything. Source: https://github.com/nrajesh/vaulted.money
>
> I would like feedback on the search phrases it fails to understand.

## Reddit

Read each subreddit's self-promotion rules first; several only allow it in a
weekly thread. Candidates: r/selfhosted, r/opensource, r/privacy,
r/personalfinance (weekly thread only), r/webdev (Showoff Saturday),
r/LocalFirst.

**Title:** I made an open-source, local-first budgeting app: no account, no cloud, plain-English search without AI

**Body:**

> Vaulted Money keeps your ledger on your own device. There is no account and no
> server to send data to; you can use it offline and export encrypted backups.
>
> - Type "groceries over 50 last month" to search (a local parser, not an LLM)
> - Multiple ledgers and currencies, bank CSV import, budgets and reports
> - Web, desktop (Windows/macOS/Linux), Android and iOS builds
> - Desktop has a localhost API and MCP server for scripts or your own agent
> - MIT licensed
>
> Demo with sample data (nothing to sign up for): https://vaulted.money/ledgers?demo=1
> Code: https://github.com/nrajesh/vaulted.money
>
> Happy to answer questions, and I would like to hear what is missing for you
> to switch from your current tool.

## Listings (submit once, they keep sending visitors)

- AlternativeTo: list as an alternative to YNAB, Mint, Monarch Money, Actual Budget, Firefly III
- Product Hunt
- awesome-selfhosted (Money, Budgeting & Management) – read its contribution rules; it needs a tagged release and an install path
- awesome-privacy, awesome-local-first, awesome-mcp-servers (for the MCP server)
- openalternative.co, opensourcealternative.to, selfh.st
- F-Droid (Android) once there is a reproducible release build

## GitHub repository settings (two minutes, owner only)

- **About → Website:** https://vaulted.money
- **About → Description:** Private, local-first personal finance. No account, open source, plain-English search without AI.
- **Topics:** personal-finance, budgeting, expense-tracker, local-first, privacy, offline-first, self-hosted, open-source, electron, capacitor, react, typescript, mcp, indexeddb
- **Social preview image:** upload `public/og-image.png`

## Search engines

Add the site in Google Search Console and Bing Webmaster Tools and submit
`https://vaulted.money/sitemap.xml`. Without this, new pages can take weeks to
be indexed.

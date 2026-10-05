# Vaulted Money: Local API explainer film

A ~2-minute film showing the desktop app's [Local API](../../documentation/API.md):
create a ledger, add an account, add and import transactions, categorise from
history, opt-in AI, the privacy model, handing the OpenAPI spec to an AI agent,
and the three ways to drive it (the app's UI, your own GUI, the Postman
collection).

**What is real.** Nothing on screen is a mock-up of the product:

- `capture-api.capture.ts` boots the production `ApiServer` on a real loopback
  socket with the real router and the real Dexie provider, replays the story and
  records every request/response to `out/api-run.json`. All JSON, status codes
  and numbers in the film come from that file.
- `capture-screens.mjs` loads the data that run produced into the real app (dev
  server) and screenshots it: transactions before/after each step, dashboard,
  budgets, accounts, and the real **Local API** settings card (rendered with the
  Electron bridge stubbed, since the card only has controls on desktop).
- The "AI" is a tiny OpenAI-compatible stand-in on `127.0.0.1` that records the
  request it receives, so the film can show exactly what leaves the API (vendor
  names and your category list; no amounts, dates or accounts).
- The agent dialogue's wording is illustrative; every call it shows is real.

## Render

```bash
pnpm install
pnpm dev --port 5199 --host 127.0.0.1          # app, in another terminal

pnpm exec vitest run --config marketing/api-demo/vitest.capture.config.ts   # → out/api-run.json, out/backup-*.json
node marketing/api-demo/capture-screens.mjs                                  # → out/screens/*.png
node marketing/api-demo/render.mjs                                           # → out/vaulted-money-local-api.mp4
```

Options: `render.mjs --draft` (960×540, 15 fps), `--stills 12,40` (PNG stills),
`--silent`, `--workers N`. Requirements: Node 22, Chromium via Playwright
(`PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs` if it is not resolvable),
ffmpeg with libx264 and aac. The first run needs the Inter and JetBrains Mono
font files in `out/fonts/` plus `out/fonts.css` (Google Fonts, Latin subset).

Everything under `out/` is generated and git-ignored.

## Design

Colours, type and the hexagon mark follow `documentation/DESIGN.md` and the
app's dark theme tokens (`src/globals.css`). Pacing is medium: each scene holds
one idea for 9–14 s, cross-fades rather than cuts, and nothing new appears
within ~1.2 s of the previous element.

| Time | Scene |
|---|---|
| 0:00 | Title |
| 0:07 | Switch it on (Settings → Local API) |
| 0:17 | Create a ledger, add an account |
| 0:30 | Add transactions, import a CSV (`dry_run` first) |
| 0:43 | Categorise from history |
| 0:54 | Optional AI (what the model receives) |
| 1:08 | Privacy: loopback, token, no browser access, write-only keys |
| 1:19 | OpenAPI + an AI agent |
| 1:33 | Three ways to use it: app UI, custom GUI, Postman |
| 1:45 | Why it is different |
| 1:55 | End card |

# Vaulted Money: Local API explainer film

A ~4-minute film showing the desktop app's [Local API](../../documentation/API.md):
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

Each scene is a short, quick demo followed by a **takeaway slide** of at most two
cards that stays up for 6-8 seconds: the animation earns attention, the cards are what
people read. Code words (`dry_run`, tool names) appear for a moment and then flip into
their plain meaning. The privacy wording glows softly.

| Time | Scene |
|---|---|
| 0:00 | Title |
| 0:07 | Switch it on (Settings → Local API) |
| 0:20 | Create a ledger and an account |
| 0:33 | Add transactions and import a CSV (preview first) |
| 0:47 | Categorise from history |
| 0:59 | Optional AI: what the model receives and answers |
| 1:19 | Privacy: loopback, token, no browser access, write-only keys |
| 1:33 | Chat: how it works (local model + MCP server, 8 small tools vs the full spec) |
| 1:49 | Chat: ask about your money (dates resolved by the server) |
| 2:05 | Chat: add a transaction, behind an approval prompt |
| 2:19 | Chat: import a bank CSV (preview, then import) |
| 2:36 | Chat: delete an account (preview, approval, confirm) |
| 2:51 | Chat: more questions |
| 3:03 | Three ways to use it: app, your own interface, Postman |
| 3:16 | Light and dark theme (real light-mode screens) |
| 3:26 | Why it is different |
| 3:40 | End card with QR codes (website and source) |

Figures on screen are computed, not typed: operations, tools and sizes come from the recorded
run (99 operations, 8 tools, ≈105 kB spec vs ≈5.6 kB tool list); the Postman collection has
202 requests and a standard run makes 200 requests with 545 passing checks.

**Chapters.** `render.mjs` embeds them in the MP4 (QuickTime, VLC and most players show a
chapter menu) and writes `out/chapters.vtt`, `out/chapters.txt` (YouTube-style timestamps) and
`out/player.html`, a page with a clickable chapter list. Open it next to the MP4. Clickable
areas inside the picture are not possible in a video file.

**QR codes.** `python3 marketing/api-demo/make-qr.py` (needs `pip install segno`) writes
`out/qr-*.svg`; the render reads them.

The chat scenes use `mcp-run.json`, recorded by the same capture step: it runs the real
[MCP server](../../mcp/README.md) against the real API with "today" fixed to 30 Sep, so
named periods and budgets line up with the September data. The assistant's wording is
illustrative; every tool call, argument and number is a real recorded result.

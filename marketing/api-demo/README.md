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
cards (a one-line title and two short bullets) that stays up for 6-8 seconds: the animation earns attention, the cards are what
people read. Code words (`dry_run`, tool names) appear for a moment and then flip into
their plain meaning. The privacy wording glows softly.

| Time | Scene |
|---|---|
| 0:00 | Title |
| 0:10 | Switch it on (Settings → Local API) |
| 0:24 | Create a ledger and an account |
| 0:39 | Add transactions and import a CSV (preview first) |
| 0:57 | Categorise from history |
| 1:10 | Optional AI: what the model receives and answers |
| 1:32 | Privacy: the real refusals (no token, wrong token, websites, hidden AI keys) |
| 1:45 | Chat: how it works (local model + MCP server, 8 small tools vs the full spec) |
| 2:01 | Chat: ask about your money (dates resolved by the server) |
| 2:18 | Chat: add a transaction, behind an approval prompt |
| 2:32 | Chat: import a bank CSV (preview, then import) |
| 2:50 | Chat: delete an account (preview, approval, confirm) |
| 3:04 | Chat: more questions |
| 3:16 | Three ways to use it: app, your own interface, Postman |
| 3:29 | Why it is different |
| 3:43 | End card with a QR code to vaulted.money |

**Transitions.** The sea wave swells for about 3.4 s and crests on each cut. The outgoing
scene softens and blurs as the wave swells (`DISSOLVE` in `timeline.mjs`), and the next
scene's title resolves out of the haze as the wave recedes.

**Quality gates** (`qa-cards.mjs`): text fits on one line, labels start with a capital,
and every card or screenshot is in focus for at least 3 s before its scene dissolves.

Figures on screen are computed, not typed: operations, tools and sizes come from the recorded
run (99 operations, 8 tools, ≈105 kB spec vs ≈5.6 kB tool list); the Postman collection has
202 requests and a standard run makes 200 requests with 545 passing checks.

**Chapters.** Each has an icon, and its marker sits one second into the scene so the thumbnail shows the new slide; a keyframe is forced there. `render.mjs` writes `out/chapters.srt`, `out/chapters.vtt`, `out/chapters.txt`
(YouTube-style timestamps) and `out/player.html`, a page with a clickable chapter list (keep it
next to the MP4). In the MP4 itself the chapters are a real QuickTime-style chapter track
(a hidden text track that the video refers to as `chap`), built with `MP4Box`
(`apt install gpac`), so QuickTime, VLC and most players list them. Without MP4Box the
render falls back to ffmpeg's own chapters, which not every player shows. Clickable areas
inside the picture are not possible in a video file.

**Checks.** `node marketing/api-demo/qa-cards.mjs` renders each scene late in its run and
fails if any card title or bullet no longer fits on one line.

**QR code.** `python3 marketing/api-demo/make-qr.py` (needs `pip install segno`) writes
`out/qr-site.svg`; the render reads it.

The chat scenes use `mcp-run.json`, recorded by the same capture step: it runs the real
[MCP server](../../mcp/README.md) against the real API with "today" fixed to 30 Sep, so
named periods and budgets line up with the September data. The assistant's wording is
illustrative; every tool call, argument and number is a real recorded result.

# Vaulted Money: the film

About 42 seconds (1920×1080, 30 fps), cut fast: three questions answered by
the real app, then the same search answering with the network off, then the
name and its line, "Private vault. Open code." The phone turns to a new angle
on every beat, and the score is a house groove at 108 BPM in the spirit of
the relaxed social cut.

| Time | Words                            | What the app shows                                                 |
| ---- | -------------------------------- | ------------------------------------------------------------------ |
| 0:00 | Money on your mind?              | Loose amounts and reminders                                        |
| 0:02 | Vaulted Money                    | Each amount lands on its row in the Transactions list              |
| 0:04 | Where did it all go?             | Charts: the spending ring, then the categories                     |
| 0:09 | `groceries over 20 last month`   | The search typed key by key, what it understood, the filtered list |
| 0:16 | Am I on track?                   | Spending insights: one budget over, others with money left         |
| 0:20 | What's coming up?                | Calendar                                                           |
| 0:24 | Who else can see this? Only you. | The same search with the network off                               |
| 0:33 | Every device.                    | Phone, tablet and desktop on the same ledger                       |
| 0:38 | Private vault. Open code.        | Name, line, three badges, one action                               |

The end line and badges are `TAGLINE` and `BADGES` in `timeline.mjs`.

## Make it

```bash
pnpm dev                                        # the app, in another terminal
node marketing/showreel/vault/capture.mjs       # photographs the app → out/shots/
node marketing/showreel/vault/render.mjs        # → out/ and ../final/vaulted-money-film.mp4
node marketing/showreel/vault/render.mjs --stills 6,12,30    # PNG stills to check a moment
node marketing/showreel/vault/render.mjs --draft             # 960×540 for a quick look
```

Needs Playwright with Chromium (set `PLAYWRIGHT_MODULE` to its path if it is
not resolvable) and ffmpeg. Fonts are downloaded once into `out/fonts/`.
Everything in `out/` is generated and ignored; only the finished video in
`../final/` is committed.

## What is real and what is not

- **Real:** every picture of the app. `capture.mjs` runs the app with its demo
  data, with the clock and random numbers pinned to the values the store
  screenshots use, so figures agree between shots. The search is typed one
  key at a time and photographed after each key; the film plays those
  photographs back. "Understood as", "Apply all" and the filtered list are
  what the app showed.
- **Real:** the offline search. That take is captured with the browser's
  network switched off (`context.setOffline(true)`).
- **Drawn by the film:** the opening's floating notes (the four amounts are
  read from the first rows of the Transactions list they fly to), the
  headlines, the phone, tablet and window frames, the status bar with its
  5G and airplane marks, the hexagon and the end card.
- **Camera moves** (pushing in, pulling back, turning the phone, cross-fading
  between two screens) are the film's. Nothing inside a screen is redrawn or edited.
- The app has no status bar of its own in a browser, so the airplane mark is
  the film's way of saying what the capture did.

## Files

```
timeline.mjs   The clock (19 bars at 108 BPM), every word on screen, key times
capture.mjs    Runs the real app and photographs each step
film.html/.css/.mjs   The stage; window.__render(seconds) poses any frame
score.mjs      Music and sounds, synthesised; keys and clicks follow the picture
render.mjs     Chromium draws the frames, ffmpeg encodes them at −14 LUFS
```

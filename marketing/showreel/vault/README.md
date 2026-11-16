# Vaulted Money: the film

About 44 seconds (1920×1080, 30 fps). One feature per device: the camera
sits close on a device while it shows one thing, then the device flips over
into the next. At the end the camera pulls back once to show all five, and
they fold into the logo and the slogan, "Private Vault. Open Code."

| Time | Device     | Words                                | What the app shows                                               |
| ---- | ---------- | ------------------------------------ | ---------------------------------------------------------------- |
| 0:00 |            | Money on your mind?                  | Loose amounts and reminders, which land in the phone             |
| 0:04 | iPhone     | Ask it like you'd say it.            | Search typed key by key, what it understood, the filtered list   |
| 0:11 | Android    | Every subscription, before it bills. | Upcoming bills, narrowed to subscriptions and utilities          |
| 0:16 | iPad       | Your month, at a glance.             | Spending insights: budgets, then where spending rose             |
| 0:20 | iPhone Duo | Follow the flow. See what's ahead.   | The money-flow chart, then the income forecast                   |
| 0:27 | Desktop    | Every cent, accounted for.           | Charts: the month's spending ring                                |
| 0:31 | All five   | Yours alone, on every device.        | The line-up; no sign-up, no cloud, AI off until switched on      |
| 0:38 |            | Private Vault. Open Code.            | The devices fold into the logo; name, slogan, badges, one action |

Features, devices and words are `FEATURES` in `timeline.mjs` (a test keeps
them one to one); the slogan and badges are `TAGLINE` and `BADGES` there.

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
  data at each device's own screen size (`capture.devices.mjs`), with the
  clock and random numbers pinned to the values the store screenshots use, so
  figures agree between devices. The search is typed one key at a time and
  photographed after each key; the film plays those photographs back.
- **Set up off camera:** the Upcoming bills list is narrowed to the
  Entertainment and Utilities categories, and the reports are set to this
  year, both through the app's own search box. The chips on screen say so.
- **The devices are screen sizes, not the store builds.** Each is the web
  app in a browser at that device's size; the frames, status bars and title
  bar are drawn by the film. The iPhone Duo is the unfolded screen turned
  sideways.
- **Drawn by the film:** the opening's floating notes (the four amounts are
  read from the first rows of the Transactions list they fly to), the words,
  the device frames and the end card.
- **Camera moves** (pushing in, turning, flipping to the next device,
  cross-fading between two screens) are the film's. Nothing inside a screen
  is redrawn or edited.

## Files

```
timeline.mjs   The clock (20 bars at 108 BPM), features, every word on screen
capture.devices.mjs   Each device's screen size, pixel ratio and theme
capture.mjs    Runs the real app and photographs each step
film.html/.css/.mjs   The stage; window.__render(seconds) poses any frame
score.mjs      Music and sounds, synthesised; keys and clicks follow the picture
render.mjs     Chromium draws the frames, ffmpeg encodes them at −14 LUFS
```

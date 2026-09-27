# Vaulted Money — showreel

A 50-second motion-graphics film for the app, built entirely in code:
HTML/CSS/SVG/Canvas for the picture, a from-scratch JavaScript synthesiser for
the music and sound design, and headless Chromium + ffmpeg to render it frame by
frame.

**Every app screen in the film is the real app.** `capture.mjs` runs the app,
generates its built-in demo data, performs the real flows (CSV import, AI
provider setup, "Categorize Missing", switching the Analytics chart between
line, bar and pie and hovering it) and screenshots each screen in each state.
Nothing on screen is a mock-up, so when the UI changes, re-capture and the
film follows.

**Pacing rule:** every new graphic holds for at least a second before the next
one arrives, and each chapter keeps one headline while the screen shows two or
three things. Only the highlights montage cuts faster, on purpose.

Nothing here is a binary asset. The video, the soundtrack, the screen captures
and the font cache are all generated into `out/` (git-ignored).

## Render it

```bash
pnpm install              # the app's dependencies (needed to run the app for capture)
pnpm showreel             # 1920×1080, 60 fps, 8× motion blur → out/vaulted-money-showreel.mp4 (+ -web.mp4)
pnpm showreel:draft       # 960×540, 30 fps, no blur — a quick check of timing
pnpm showreel:capture     # re-capture the app's screens (runs automatically on first render)
```

Or call the scripts directly for more control:

```bash
node marketing/showreel/render.mjs --stills 12,26.5,46   # PNG stills to out/stills/
node marketing/showreel/render.mjs --from 24 --to 30     # render a section
node marketing/showreel/render.mjs --blur 4 --workers 4  # lighter blur, more browsers
node marketing/showreel/soundtrack.mjs                   # just the audio → out/soundtrack.wav
```

Requirements: Node 22+ (for the built-in `WebSocket`), Chromium or Chrome, and an
ffmpeg build with `libx264` and `aac`. Point at them with `CHROME_PATH` and
`FFMPEG_PATH` if they are not found automatically. The first run downloads the
three Google Fonts into `out/fonts/` so rendering never depends on the network
afterwards.

### Preview and scrub in a browser

Serve this folder with any static server and open `index.html` (without
`?render`). You get the real-time composition, the soundtrack (once rendered)
and a scrubber:

```bash
npx serve marketing/showreel   # then open http://localhost:3000
```

## How it works

- **Real screens.** `capture.mjs` starts the Vite dev server, opens the app in
  a fresh headless profile with `Math.random` seeded (so the demo numbers are
  stable), clicks through it like a user and saves screenshots at 2× (3× on
  mobile) plus a `manifest.json` of element boxes. Callouts, zooms and the
  cursor are aimed at those boxes, so they land on the real buttons. Which
  budgets the demo creates varies from run to run, so the film frames
  whichever on-track and over-budget cards it finds; if a run has no such
  pair on the first page, the capture stops and asks to be run again.
- **Deterministic frames.** `showreel.mjs` exposes `window.__render(seconds)`.
  Every scene is a pure function of time, so any frame can be rendered in
  isolation, in any order, on any number of browsers.
- **Real motion blur.** Each output frame averages eight sub-frames across a
  180° shutter (`tmix` in ffmpeg), so whip pans, zooms and flying struts smear
  like they would through a real camera.
- **One clock.** `timeline.mjs` defines the tempo (128 BPM, so 50.6 s is
  exactly 27 bars), the chapters and every named cue. The picture and
  `soundtrack.mjs` both read it: the music takes its structure (groove,
  breakdown, finale, logo) from the chapters, the forge ticks use the vault
  scene's own spark arrival times, and the keystrokes follow the terminal's
  typing, so every flash on screen has its sound.
- **Finishing.** The ffmpeg pass adds a soft bloom and fine film grain; the
  final beat fades to black so the film loops seamlessly into its first spark.

## Storyboard

| Bars  | Time   | Chapter                                                       | What happens                                                                                                                                                                                                                                                   |
| ----- | ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 0.0 s  | **Vault**                                                     | Two sparks race around the hexagon; struts fire inward wherever they pass. The 3D wireframe flattens into the exact brand mark and cools from light into silver; the camera dives through the keyhole.                                                         |
| 2     | 1.9 s  | **Your money. Your device.**                                  | Kinetic type; the phone's bezel draws itself around the words as the camera pulls out.                                                                                                                                                                         |
| 3–4   | 3.8 s  | **No cloud. No trackers. No subscriptions.**                  | One line every two beats while the real mobile Transactions screen scrolls inside a hexagonal force field that stops data leaving.                                                                                                                             |
| 5–7   | 7.5 s  | **Import any bank's CSV**                                     | Whip to the desktop app. A bank export drops onto "Import CSV"; the real import dialog and its preview; six new, uncategorised rows.                                                                                                                           |
| 8–9   | 13.1 s | **Sorted in one tap**                                         | The cursor clicks "Categorize Missing" and a scan line sweeps the table as categories appear, matched from the ledger's own history; the confirmation toast.                                                                                                   |
| 10–11 | 16.9 s | **AI, only if you want it**                                   | Adding a provider that points at a model on localhost, then the providers list and the "keys are stored locally" settings card.                                                                                                                                |
| 12–13 | 20.6 s | **Budget with intent**                                        | An on-track and an over-budget card, then the real overspend alerts from Insights, before the window tips back into an isometric plane.                                                                                                                        |
| 14–16 | 24.4 s | **See where it goes**                                         | An isometric wall of real reports rises (Sankey cash flow, Analytics, Essential Reports, Calendar, Insights); export formats pop. The camera leans into Analytics and a cursor hovers the line, switches to bars and hovers, then to a pie and clicks a slice. |
| 17–18 | 30.0 s | **Day or night**                                              | The cursor clicks the theme toggle and a circular wipe turns the world light: the navy-and-gold mark builds itself beside real light-mode screens. The music breaks down.                                                                                      |
| 19–21 | 33.8 s | **Every device, every currency, fully offline**               | Real screens on desktop (Accounts, then Currencies), tablet (Scheduled) and phone (Calendar); the demo ledgers' currencies; offline badges. One bar per claim.                                                                                                 |
| 22–23 | 39.4 s | **Free & open source. Install it today.**                     | A terminal types the clone and install commands from vaulted.money, then one command per platform: web, desktop, Android, iOS.                                                                                                                                 |
| 24    | 43.1 s | **Highlights**                                                | Seven hard cuts on the eighth notes through the busiest screens, each named.                                                                                                                                                                                   |
| 25–27 | 45.0 s | **Vaulted Money · Privacy-first · Data-local · Open-sourced** | The shield assembles from struts flung in from every direction; the wordmark, the three badges from the vaulted.money hero, the address, and a fade to black.                                                                                                  |

## Design system

- **Palette:** both brand variants from
  [`documentation/DESIGN.md`](../../documentation/DESIGN.md): silver and cyan
  on dark, navy and gold on light.
- **Logo:** rebuilt as vectors in `lib/logo.mjs` (both variants), traced from
  the brand PNGs. The final lockup keeps the struts clean, per the brand rules.
- **Type:** Inter Tight (display, echoing the app's `font-black tracking-tighter`
  titles), Instrument Serif italic (accent words), JetBrains Mono (labels, HUD).
- **Icons:** Lucide, the same set the app ships through `lucide-react`.

## Files

```
index.html        Stage and layer stack
styles.css        All styling, grouped by scene
showreel.mjs      Boot, font and screen loading, render loop, browser preview
timeline.mjs      Tempo, chapters and named cues (shared with the audio)
capture.mjs       Runs the real app and screenshots it → out/screens/
soundtrack.mjs    Synthesised music and sound design → WAV
render.mjs        Headless Chromium over CDP → ffmpeg → MP4
icons.mjs         Lucide icon geometry
lib/              Motion maths, logo geometry, CDP client, screen helpers
scenes/           One module per chapter, plus backdrop, HUD and finishing
```

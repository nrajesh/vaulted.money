# Vaulted Money — 15-second showreel

A motion-graphics film for the app, built entirely in code: HTML/CSS/SVG/Canvas
for the picture, a from-scratch JavaScript synthesiser for the music and sound
design, and headless Chromium + ffmpeg to render it frame by frame.

Nothing here is a binary asset. The video, the soundtrack and the font cache are
all generated into `out/` (git-ignored), so the film can be re-cut by editing
source and re-rendering.

## Render it

```bash
pnpm showreel          # 1920×1080, 60 fps, 4× motion blur → out/vaulted-money-showreel.mp4
pnpm showreel:draft    # 960×540, 30 fps, no blur — about 45 s, for checking timing
```

Or call the script directly for more control:

```bash
node marketing/showreel/render.mjs --stills 1.4,7.9,14   # PNG stills to out/stills/
node marketing/showreel/render.mjs --from 5 --to 9       # render a section
node marketing/showreel/render.mjs --blur 8 --workers 4  # heavier motion blur, more browsers
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

- **Deterministic frames.** `showreel.mjs` exposes `window.__render(seconds)`.
  Every scene is a pure function of time, so any frame can be rendered in
  isolation, in any order, on any number of browsers.
- **Real motion blur.** Each output frame averages four sub-frames across a 180°
  shutter (`tmix` in ffmpeg), so whip pans, zooms and flying struts smear like
  they would through a real camera.
- **One clock.** `timeline.mjs` defines the tempo (128 BPM, which makes 15 s
  exactly 8 bars) and every named cue. The picture and `soundtrack.mjs` both read
  it, and the forge ticks in the audio use the vault scene's own spark arrival
  times, so every flash on screen has its sound.
- **Finishing.** The ffmpeg pass adds a soft bloom and fine film grain; the
  final beat fades to black so the film loops seamlessly into its first spark.

## Storyboard — one scene per bar

| Bar | Time    | Scene                                                | What happens                                                                                                                                                                                                                                              |
| --- | ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0.00 s  | **Forge the vault**                                  | Two sparks race around the hexagon; struts fire inward wherever they pass. The 3D wireframe swings round, flattens into the exact brand mark and cools from light into silver. The keyhole clicks in, floods with light, and the camera dives through it. |
| 2   | 1.88 s  | **Your money. Your device.**                         | Kinetic type (Inter Tight Black + Instrument Serif italic). "money." rolls away, "device." rolls in, then the phone's bezel draws itself around the words as the camera pulls out: the type was on the device all along.                                  |
| 3   | 3.75 s  | **No cloud. No trackers. No subscriptions.**         | Lucide icons draw on and get slashed, one per beat. A hexagonal force field around the phone catches every data packet that tries to leave. The caption scrambles into place.                                                                             |
| 4   | 5.63 s  | **Track every euro.**                                | Whip pan. A bank CSV chases the phone and dives into the screen; transactions cascade in, the balance counts up, and the salary row lifts off the glass.                                                                                                  |
| 5   | 7.50 s  | **Budget with intent.**                              | Zoom through the glass. Budget cards flip up on springs, rings sweep, and "Dining out" crosses 91%: amber, a shudder, a heads-up toast.                                                                                                                   |
| 6   | 9.38 s  | **See where it goes.**                               | The layout tips back into an isometric plane and nine report cards rise out of it, centre first, each chart animating.                                                                                                                                    |
| 7   | 11.25 s | **Every device. Fully offline. Free & open source.** | Desktop, tablet and phone spring up; offline badges pop; a real `git clone` types itself. Then everything is pulled into a single point.                                                                                                                  |
| 8   | 13.13 s | **Vaulted Money**                                    | The shield assembles from struts flung in from every direction, the wordmark rises with a pass of light, and the film fades to black.                                                                                                                     |

## Design system

- **Palette:** the dark "high-tech" brand variant from
  [`documentation/DESIGN.md`](../../documentation/DESIGN.md) (cyan → teal
  gradient on deep night), with the light variant's gold reserved for warnings.
- **Logo:** rebuilt as vectors in `lib/logo.mjs`, traced from
  `assets/brand/dark-icon.png`. The final lockup keeps the struts clean silver,
  per the brand rules (no glows or bevels on the wireframe).
- **Type:** Inter Tight (display, echoing the app's `font-black tracking-tighter`
  titles), Instrument Serif italic (accent words), JetBrains Mono (labels, HUD).
- **Icons:** Lucide, the same set the app ships through `lucide-react`.

## Files

```
index.html        Stage and layer stack
styles.css        All styling, grouped by scene
showreel.mjs      Boot, font loading, render loop, browser preview
timeline.mjs      Tempo, scenes and named cues (shared with the audio)
soundtrack.mjs    Synthesised music and sound design → WAV
render.mjs        Headless Chromium over CDP → ffmpeg → MP4
icons.mjs         Lucide icon geometry
lib/              Motion maths, logo geometry, DOM and canvas helpers
scenes/           One module per scene, plus backdrop, HUD and finishing
```

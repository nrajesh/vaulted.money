# Search demo video (and a toolkit for the next ones)

A ~30-second marketing video for natural-language search: type a sentence (a
quiet "typo-tolerant" note appears beside the misspelled word), see what it
understood, pick one filter or all of them, then do a second search once, on a
phone (the camera pushes in on the phone as it slides in). The caption reads
"Search transactions" in white and, on its own line, "without AI or cloud" in
blue; the two colours never share a line. Chips glow softly as they pop in, the desktop is blurred behind the phone, and the sound is only soft typing and clicks (no music or hum). The app blurs out into a final card
with the three points from the website and a QR code.

The finished video is `final/vaulted-money-search.mp4` (committed on purpose;
see "Repository rules" below).

**What is real.** Nothing on screen is a mock-up. A script drives the running app
in Chromium with the app's demo data, records the screen, and writes down every
key press, click, zoom and sound cue. `lib/compose.py` turns that into the MP4.
The phone is the app itself in a phone-sized frame (the web UI that the iOS and
Android apps wrap), not a picture.

There is **no watch app**, so the video does not show one.

## Make it

```bash
pnpm install
pnpm dev --port 5199 --host 127.0.0.1          # the app, in another terminal

cd marketing/search-demo
pip install pillow segno numpy                  # once
python3 lib/assets.py --url https://vaulted.money --out out/assets.json   # logos + QR code
node storyboard.cjs                              # records out/take.webm + out/events.json
python3 lib/compose.py --dir out --speed 1.5 --out final/vaulted-money-search.mp4
# add  --foley 0.4  for soft keyboard clicks, ticks and chimes (default 0 = quiet background only)
```

Needs Node 22, ffmpeg (libx264, aac), and Chromium through Playwright
(`PLAYWRIGHT_MODULE=/path/to/playwright` if it is not resolvable). Everything
under `out/` is generated and git-ignored. `BASE_URL` points at another server.

## How it fits together

| File | What it does |
|---|---|
| `storyboard.cjs` | The scenes of *this* video, written as plain steps (`caption`, `click`, `type`, `zoomTo`, `toggleTheme`…). |
| `lib/stage.cjs` | Records the app: demo data, captions, a visible cursor, camera zoom, theme button, phone frame, flip-in end card. Writes `events.json`. |
| `lib/compose.py` | Builds the sound track: a quiet ambient pad, plus (with `--foley`) keyboard clicks for each key typed, a tick per click, chimes and whooshes; all synthesised, royalty-free, applies the zooms and speed-up, encodes 1080p. |
| `lib/assets.py` | Crops the light and dark logos and makes the QR code for a URL. |

## A video for another feature

1. Copy `storyboard.cjs` to `storyboard-<feature>.cjs` and change the scenes. The
   stage helpers do the heavy lifting; use `caption(html, ms)`, `click(locator)`,
   `type(text, msPerKey)`, `zoomTo({z, cx, cy}, seconds)`, `sound("chime" | "whoosh" | "sparkle")`.
2. Mark where the film starts and ends: `mark("intro")` before the first scene.
3. Run it, then `compose.py` with `--out final/<name>.mp4`.
4. Look at frames before you share: `ffmpeg -ss 10 -i out.mp4 -vf "fps=1/2,scale=640:-1,tile=3x4" -frames:v 1 sheet.png`.

Tips learned making this one:

- Keep captions inside the zoomed area (`captionAt(x, bottom)`); a caption at the
  bottom of the screen disappears when the camera zooms in.
- A theme switch looks cleanest with colour transitions off for that moment
  (`toggleTheme()` does this) and the button highlighted so the click is seen.
- Say only what is true of the product. "No AI" is true of *search*, not of the
  whole app (it has optional AI categorisation), so the caption names search.
- Check that a result is honest: the largest "expense" was once a transfer
  between the user's own accounts, so the video turns on Exclude Transfers first.

## Repository rules

Generated output normally stays out of git (`documentation/CLAUDE.md`). The one
exception is the finished MP4 in `final/`, kept here on request so the video can
be shared from the repository. Keep only the current cut of each video there, and
put anything bigger on a release or elsewhere; every version committed stays in
the history for good.

The Local API film (`../api-demo/`) is a different kind of video (an animated
explainer rendered from recorded API responses) and has its own README.

## Sharpness

The app is captured with a Chrome screencast (`lib/stage.cjs`, JPEG frames at
quality 92, turned into `out/take.mp4`) instead of Playwright's `recordVideo`,
whose low bitrate made zoomed-in text soft. The capture is 1920x1080, so keep
camera zooms at or below about 1.5x.

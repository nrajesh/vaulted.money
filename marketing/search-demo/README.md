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
node make.cjs videos/search.json                 # records, mixes and writes final/vaulted-money-search.mp4
python3 lib/compose.py --dir out --speed 1.5 --out final/vaulted-money-search.mp4
# add  --foley 0.4  for soft keyboard clicks, ticks and chimes (default 0 = quiet background only)
```

Needs Node 22, ffmpeg (libx264, aac), and Chromium through Playwright
(`PLAYWRIGHT_MODULE=/path/to/playwright` if it is not resolvable). Everything
under `out/` is generated and git-ignored. `BASE_URL` points at another server.

## How it fits together

| File | What it does |
|---|---|
| `videos/*.json` | One file per video: the end card, the speed, and the list of steps. This is the only thing you write. |
| `make.cjs` | The template runner: plays a script's steps, records, then calls `compose.py`. Nothing in it is specific to one feature. |
| `lib/stage.cjs` | Records the app: demo data, captions, a visible cursor, camera zoom, theme button, phone frame, flip-in end card. Writes `events.json`. |
| `lib/compose.py` | Builds the sound track: a quiet ambient pad, plus (with `--foley`) keyboard clicks for each key typed, a tick per click, chimes and whooshes; all synthesised, royalty-free, applies the zooms and speed-up, encodes 1080p. |
| `lib/assets.py` | Crops the light and dark logos and makes the QR code for a URL. |

## A video for another feature

Copy `videos/search.json` to `videos/<feature>.json`, change the steps, and run
`node make.cjs videos/<feature>.json`. That records the app, builds the sound
and writes the MP4 named by `out` (inside `final/`). Top level keys: `ledger`,
`speed`, `foley` (0 to 1: how loud the typing and clicks are), `out`, `endCard`
(`title`, `tagline`, up to three `badges` with `cls` g/b/o, `url`) and `steps`.

A step is `{ "do": "...", ...}`, run in order. A *target* says what to click:
`{ "role": "option", "name": "regex" }`, `{ "css": "#id" }` or `{ "text": "..." }`;
add `"in": "phone"` to look inside the phone frame.

| `do` | What it does |
|---|---|
| `goto` | `path`, `wait` ms: open a page of the app. |
| `mark` | `name`: `intro` (film starts here) is required; `end` is added for you. |
| `caption` | `text`, `ms`: a caption; `""` clears it. Write the blue part as `<b>...</b>` on its own line after `<br>`: white and blue never share a line. |
| `check` | `text`, `ms`: a single-colour card with a check mark, for a one-line claim. |
| `anchor` | `name`, `target`: remember where an element is, so a zoom can follow it. |
| `zoom` | `z`, `cx`, then `anchor` + `dy` (or `cy`), `ease` seconds. `z: 1` pulls back. Captions move into view by themselves. Stay at or below about 1.5. |
| `click`, `type` | `target`; `text`, `delay` ms per key. `"silent": true` clicks without the cursor (use inside `dissolve`). |
| `note` / `hideNote` | A small pill beside the typed text (the "typo-tolerant" label). |
| `glow` | `on`, optional `in`: chips that appear while on, and the suggestion clicked, glow. |
| `theme` | Clicks the real theme button. |
| `dissolve` | `steps`, `hold` ms: fade to dark, run the steps unseen, fade back. |
| `phonePrepare`, `phoneLoad`, `phoneShow` | Load the app in a phone frame (`path`, `excludeTransfers`), wait for it, slide it in. |
| `sound`, `wait`, `mouse` | `kind` whoosh/sparkle; `ms`; `x`, `y`. |
| `end` | The finale: the app blurs into the end card, then it turns dark. |

For a step the runner does not have, add a function to `steps` in `make.cjs` and
use it from any script.

Look at frames before you share: `ffmpeg -i final/x.mp4 -vf "fps=0.75,scale=480:-1,tile=5x5" -frames:v 1 sheet.png`.

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

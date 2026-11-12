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

## The videos

| Script | Video | Title | What it shows |
|---|---|---|---|
| `videos/search.json` | `final/vaulted-money-search.mp4` | Search | Natural-language search, on desktop and phone. |
| `videos/ai.json` | `final/vaulted-money-ai.mp4` | AI, Your Call | The AI switch off, then on; **Categorize Missing** on rows filtered to Uncategorized; the same in light theme, ending on the agent section of the **AI & agents** page. Filmed in the desktop app. |
| `videos/agent.json` | `final/vaulted-money-agent.mp4` | AI agent - Meet Ledger | Switching agent access on in the desktop app, a real LM Studio recording of a local model creating a ledger and importing files through the MCP tools, the imported ledger in the app, and two real LM Studio answers. |
| `videos/api.json` | `final/vaulted-money-api.mp4` | Your Ledger, Scriptable | The Local API address and token in the desktop app, then four requests in a terminal with the real replies; a transaction added over the API appears in the open list. |
| `videos/sync-a.json`, then `videos/sync.json` | `final/vaulted-money-sync.mp4` | One Ledger, Two Devices | A laptop switches Cross-Device Continuity on, picks a folder and adds a purchase ("Apples and honey"); an empty phone, in the light theme, picks the same folder and receives the whole ledger, purchase included. |

**AI, Your Call: what is real and what is not.** The app, the switch, the
button, the progress window and the categories written to the rows are all the
real app. The provider is a stand-in (`lib/standin-ai.cjs`) on this computer,
so a take needs no key and is repeatable. The app sends it the same request a
real provider would get, and it answers by keyword instead of with a model. The
provider is named "Demo provider (stand-in)" on screen. Off camera, the script
adds that provider through the real dialog, saves a made-up key in Ledger
settings, imports nine made-up rows without a category
(`videos/data/ai-uncategorised.csv`) through the real Import CSV dialog,
filters the list to the last two days and turns AI off again.

The captions say vendor names go to the provider, which is what the app sent
(`out/standin-requests.json` holds the request: vendor names and the category
list, no amounts, dates or accounts). They do not say data stays on the device,
because with a real provider it does not. Vendors the ledger has seen before
are matched from history without the provider (three older Lidl rows here,
which is why the app reports 12 categorised for nine new rows). The glow on the
rows that were filled in is a video highlight (`glowRows`), not app UI.

This video is filmed in the desktop app (`"app": "desktop"`), because the
agent section only works there; on the web it says it needs the desktop app. The
video only scrolls to that section. It does not switch "Allow agents to connect" on, so no Local
API server is started during a take. The desktop app is built for macOS,
Windows and Linux, so the caption says "desktop app", not "Mac app".

**AI agent - Meet Ledger: what is real and what is not.** The app scenes are
the real desktop app with a throwaway profile. Off camera the script adds one
custom AI provider (name "LM Studio", address `http://localhost:1234/v1`); no
model server is contacted. On camera it switches **Allow agents to connect** on,
which starts the real Local API in that profile on a spare port (`localApi` in
the script, so it cannot clash with a Vaulted Money already running).

The LM Studio footage (`videos/clips/lm-studio-import.mp4`) is a real screen
recording made by the project owner: a local model (glm-4.7-flash) asked to
create a ledger and import two files through the `vaulted-money` MCP tools. It
was recorded in a different session from the app scenes, with different files.
While it plays, the script does the same job for real in the filmed app,
through the real MCP server (`agentImport`): `call_api POST /ledgers` creates
"My Main Ledger", then `import_csv` imports `videos/data/claude-eight-years.csv`,
a synthetic file of 97 transactions spread over eight years (dates come from
`{{today-N}}`). The ledger and rows shown afterwards are that import, so the
caption says "eight years of transactions" and gives no row count from the
footage. The run fails if the import does not report 97 rows.

The two answers at the end (`videos/clips/lm-studio-ask-*.png`) are real
LM Studio screenshots (gemma, on the app's generated demo data), shown as
pictures. Captions, labels and the cursor are recording overlays.

**Your Ledger, Scriptable: what is real and what is not.** The app is the real
desktop app with a throwaway profile whose Local API is switched on, on a spare
port, before filming (`localApi`). The terminal window is a drawing. What it
prints is not: each command shown is sent by the script to that profile's real
Local API with its real token, and the reply printed is the real reply (saved
to `out/terminal-*.json`), cut down as the `jq` filter on screen says. The
token is shown as `$TOKEN`, the address as `$VM` and the ledger id as `$ID`.
The transaction added with `POST` appears in the open, filtered list because
the app refreshes after every API write; nothing is reloaded or faked for it.

**One Ledger, Two Devices: what is real and what is not.** Both devices are
the real desktop app, each with its own throwaway profile, on one machine; they
share a real folder (`pickFolder`, `/Users/Shared/Vaulted Sync`, removed
afterwards). The laptop is filmed first (`sync-a.json` writes
`out/sync-a.mp4`), cut before its end card into `out/sync-a-clip.mp4`, and
played as a clip at the start of the second take, where its last frame stays on
the left.

The "phone" is the second profile (`sync.json`, `demoData: false`, light
theme), shown at phone size inside the recorder's phone frame. It is the
desktop build of the app, not the iOS or Android app: the frame is handed the
desktop bridge so that it can pick a folder. It starts with no ledgers at all.
The system folder picker cannot be filmed or clicked by a script, so on both
devices it is answered with the shared folder; everything after it is the
app's own code. The purchase typed on the laptop is written to `ledger.json` in
the folder by the app, and the phone reads that file when the folder is
picked: nothing is copied by the script. In real use the folder would sit in a
cloud drive; the video does not show a cloud service or a real phone.

```bash
node make.cjs videos/sync-a.json                      # computer one -> out/sync-a.mp4
# cut it before the end card: (flip - intro) / speed from out/events.json, minus 0.25 s
ffmpeg -y -t 26.2 -i out/sync-a.mp4 -an -c:v libx264 -crf 16 out/sync-a-clip.mp4
node make.cjs videos/sync.json                        # computer two -> final/vaulted-money-sync.mp4
rm -rf "/Users/Shared/Vaulted Sync"
```

## Make it

```bash
pnpm install
pnpm dev --port 5199 --host 127.0.0.1          # the app, in another terminal

cd marketing/search-demo
pip install pillow segno numpy                  # once
python3 lib/assets.py --url https://vaulted.money --out out/assets.json   # logos + QR code
node make.cjs videos/search.json                 # records, mixes and writes final/vaulted-money-search.mp4
node make.cjs videos/ai.json                     # the same for final/vaulted-money-ai.mp4
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
| `lib/standin-ai.cjs` | A stand-in AI provider on 127.0.0.1 for videos that show AI categorisation. |

## A video for another feature

Copy `videos/search.json` to `videos/<feature>.json`, change the steps, and run
`node make.cjs videos/<feature>.json`. That records the app, builds the sound
and writes the MP4 named by `out` (inside `final/`). Top level keys: `ledger`,
`speed`, `foley` (0 to 1: how loud the typing and clicks are), `out`, `endCard`
(`title`, `tagline`, up to three `badges` with `cls` g/b/o, `url`) and `steps`.

`"app": "desktop"` films the real desktop app (Electron) instead of Chromium.
Run `pnpm electron:compile` first. The app is started with a throwaway profile
folder under `out/`, deleted after the take, so it never opens or changes the
data of a Vaulted Money installed on the same computer. Its window appears on
screen while recording; leave it alone. `captionSize` sets the caption size
for the whole video, and a caption step's `size` for one caption (30 by
default; about 44 reads well on a phone when the camera is pulled back).

Two optional keys prepare the app before filming:

- `setup`: steps run off camera on the real app, after the demo data is made
  and before the recording starts: `goto`, `wait`, `click` (`target`), `fill`
  (`target`, `text`), `keys` (`text`, typed into whatever has focus) and
  `upload` (`target`, `file`). In an uploaded file `{{today}}` and
  `{{today-1}}` become dates, so no script holds a fixed date. Say in this
  README what a video's setup does.
- `aiStandIn` (`port`, `delayMs`): starts the stand-in AI provider for the
  take. `{{standIn}}` in a `fill` step becomes its address.
- `localApi` (`enabled`, `port`): desktop only. Writes the Local API setting
  into the throwaway profile before the app starts, so a video can film the
  switch being turned on, or start with it on, without using the port of a
  Vaulted Money already running on this computer.
- `agentImport` (`ledger`, `currency`, `file`, `rows`): what the `agentImport`
  step creates and imports through the real MCP server.
- `demoData: false`: desktop only. Films a new install: no demo data is made
  and no ledger is opened.
- `theme` (`"light"` or `"dark"`): the theme a fresh profile starts in.
- `pickFolder` (a path): desktop only. The folder the system folder picker
  answers with, created if missing. Use a neutral path; it is shown on screen.

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
| `glowRows` | `target`: every table row it matches glows, e.g. `{ "css": "tbody tr", "hasText": "regex" }`. |
| `theme` | Clicks the real theme button. |
| `dissolve` | `steps`, `hold` ms: fade to dark, run the steps unseen, fade back. |
| `phonePrepare`, `phoneLoad`, `phoneShow` | Load the app in a phone frame (`path`, `excludeTransfers`), wait for it, slide it in. |
| `sound`, `wait`, `mouse` | `kind` whoosh/sparkle; `ms`; `x`, `y`. |
| `scrollTo` | `target`, `block`: scroll an element into view, smoothly. |
| `clip` | `file`, `label`, `while`, `keep`: play a recorded clip full screen (footage of another program, which the recorder cannot film). It is slowed by the video's `speed`, so it plays at its own pace in the result. `while` is a list of steps run as it plays. `keep` leaves it up for the next step to cover. |
| `still` | `file`, `label`, `ms`, `while`, `keep`: show a picture in a framed card, drifting down it if it is tall. |
| `dockMedia` | Shrink a clip left up with `keep` to the left of the screen, to make room beside it. |
| `phoneOver`, `phoneGoto` | Show the phone over whatever is on screen (no shrinking of the app behind it); open another page inside the phone (`path`, e.g. `#/settings`). `phonePrepare` also takes `waitFor`, the selector that says the phone's page has loaded. |
| `tag` | `text`: a small label in the top-left corner (which computer this is); `""` removes it. |
| `clearMedia` | Fade out a clip or still left up with `keep`. |
| `agentImport` | Through the real MCP server: create the ledger and import the file named in `agentImport`. Agent access must be on. |
| `terminal` | `{ "open": true }`, `{ "run": { cmd, method, path, body, select, pick, max, hold } }`, `{ "clear": true }`, `{ "close": true }`: a drawn terminal that types `cmd`, sends the request to the take's real Local API and prints the real reply. `{ledgerId}` in a path is the script's ledger. |
| `end` | The finale: the app blurs into the end card, then it turns dark. |

For a step the runner does not have, add a function to `steps` in `make.cjs` and
use it from any script.

Look at frames before you share: `ffmpeg -i final/x.mp4 -vf "fps=0.75,scale=480:-1,tile=5x5" -frames:v 1 sheet.png`.

Tips learned making these:

- The sidebar opens when the mouse is over it and its links move, so move the
  mouse onto it (`mouse`), `wait`, then click the link by name.
- Moving between pages by clicking in the app keeps the captions and cursor; a
  second `goto` reloads the page and must not be used inside a `dissolve`.
- In the desktop app a `goto` only changes the route; the page is not
  reloaded, so anything a step added to the page (a clip left up with `keep`)
  is still there. Clear it with `clearMedia`.
- With the Local API seeded on, AI features start on too. A setup step that
  clicks the AI switch would turn them off.
- Inside the phone frame the app hides its Settings and Home menu entries
  (it treats any frame as the homepage preview), so move between pages with
  `phoneGoto`.
- The end card is pinned to the part of the page in view and hides the
  scrollbars. Before that, a video that ended on a scrolled page showed the
  card off-centre.
- A caption sits at the bottom of what the camera shows. Leave room for it in
  anything drawn there (the terminal keeps its text above it).

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

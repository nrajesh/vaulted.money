# Store screenshots

Every App Store, Google Play and Mac (Polar) image, made from the real app in
one command. Design: `docs/superpowers/specs/2026-11-15-store-screenshots-design.md`.

```bash
npm ci --prefix marketing                       # once: Playwright for the marketing tools
npx --prefix marketing playwright install chromium
pnpm marketing:screenshots                      # every set, English
pnpm marketing:screenshots --set iphone69       # one set (comma-separate several)
pnpm marketing:screenshots --no-build           # reuse the last `pnpm build`
CHROME="/path/to/Chrome" pnpm marketing:screenshots   # use an installed Chromium
```

Output: `marketing/store-screenshots/out/<set>/<lang>/01.png…` (git-ignored).

The App Store "Header and Search Results" image (one universal 5244×2950
PNG) reuses those captures: run `node marketing/store-screenshots/header.mjs`
afterwards. It writes `out/appStoreHeader/universal.png`.
Each GitHub release also attaches a zip of every set.

Run it on a Mac: the app uses the system font, and other systems draw a
different one.

## Sets

| Set                            | Size                  | Shots     |
| ------------------------------ | --------------------- | --------- |
| `iphone69`                     | 1320×2868             | 1–5       |
| `ipad13`                       | 2064×2752             | 1–6       |
| `duoInner` / `duoOuter`        | 2007×2853 / 1398×2034 | 1–6 / 1–5 |
| `playPhone`                    | 1080×1920             | 1–5       |
| `playTablet7` / `playTablet10` | 1200×1920 / 1600×2560 | 1–6       |
| `playFeature`                  | 1024×500              | banner    |
| `mac`                          | 2880×1800             | 1, 2, 6   |

## How it works

1. **Capture** (`../shared/capture.mjs`): builds and serves the web app,
   opens it at each device size, makes the demo data and visits each shot's
   screen (`../shared/story.json`). The clock is fixed to 20 Nov 2026 and
   `Math.random` / `crypto.randomUUID` are seeded, so the numbers are the same
   every run.
2. **Check** (`../shared/antiGoals.mjs`): before saving, the text visible in
   the part of the screen the image shows is checked. "Infinite", "€-",
   "0 selected", an empty or error screen, "free" wording, Apple names in
   Google Play images and Android names in Apple images all stop the run
   with the shot and the problem.
3. **Render** (`slide.mjs`, `templates/slide.html`): each slide is drawn at
   the exact store size and saved as an opaque PNG.

## Changing the words

Captions live in `../shared/strings/<lang>.json`. Wrap accent words in
`*asterisks*`. Headlines shrink to fit at most three lines. To force line
breaks for one language, add `"breaks": ["first line", "second line"]` to
that shot. Add a language by copying `en.json` and running with `--lang`.

## Changing a screen

Edit the shot in `../shared/story.json`: `route`, the `actions` that set the
screen up (`click`, `type`, `scroll`, `wait`; `ifPresent` for a switch that
may already be on), `visibleFraction` to crop the bottom of the screen, and
`landscape` for devices that show the shot sideways.

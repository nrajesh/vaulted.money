# Store Screenshots, App Store Preview and Showreel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command makes every App Store / Google Play / Polar image from the real app; a recorded App Store preview and a 4K keynote-style showreel follow the same story.

**Architecture:** Three tools under `marketing/`, sharing one capture step and one caption source. `store-screenshots` drives the web build in Playwright (fixed clock and random seed, so numbers never change), captures screens per device and theme, then renders HTML frames to exact pixel sizes. `app-preview` records the real iOS app in the simulator while a preview-only autoplay script walks the story, then adds captions and music with ffmpeg. `showreel` revives the project's own code-built showreel engine (commit `8cf27ba`: deterministic scenes, CDP frame renderer with motion blur, synthesised soundtrack tied to one timeline) and gives it two cuts: a fast social cut (the old reel, refreshed) and a slower keynote cut, both in 4K.

**Tech Stack:** Node 22 ES modules, Playwright (Chromium), headless Chrome over CDP, ffmpeg (Homebrew `ffmpeg` already on PATH has libx264 + aac; `ffmpeg-full` is keg-only and not needed), Xcode 27.2 simulators incl. iPhone Duo (`simctl`), Vitest for the pure logic.

**Spec:** `docs/superpowers/specs/2026-11-15-store-screenshots-design.md` (Part 1 screenshots, Part 2 videos). Reference for the video method: the jhg launch video README (`jhg/marketing/launch-video-source.zip`).

## Global Constraints

- Captions, verbatim (English), from the spec's shot table:
  1. "Your money **never leaves** your device." / sub-heading "Unless you switch AI on." / "No sign-up. No cloud."
  2. "Ask it like **you'd say it.**" / "\"Groceries over 20 last month\", understood right on your phone."
  3. "Your money. Your labels. **Your rules.**" / "Own and manage every account, payee, budget & category."
  4. "AI when you want it. **Silent** when you don't." / "Off by default, one switch away. Use AI the way you want." / callouts "Agents may need a second device" (monitor icon), "Local AI keeps data off the cloud" (shield icon)
  5. "See where it **really** goes." / "Get warned before you overspend."
  6. "Room to breathe on **big screens.**" / "List and details side by side." (iPad, Duo and tablet sets only)
- Look: alternating pages. Odd = dark (navy radial into teal, white headline, teal title gradient `hsl(183 51% 74%) → hsl(187 55% 61%)`, light app inside). Even = light (white into `hsl(210 40% 96.1%)` with apricot glow `hsl(32 83% 88%)`, navy `hsl(222.2 84% 4.9%)` headline, apricot gradient `hsl(27 72% 58%) → hsl(20 73% 52%)`, dark app inside). Straight phones; shot 1 is a face-off pair (dark left, light right, each turned ~30° toward the centre, both fully in frame). Phones run off the bottom edge; shot 4's phone sits lower so the agent card's "Needs the Mac app" note is out of frame.
- Status bar on every device: "9:41" left; "5G" and a small battery right. No signal bars.
- Sizes: iPhone 6.9" 1320×2868 (shots 1–5); iPad 13" 2064×2752 (1–6); Duo inner 2007×2853 (1–6), outer 1398×2034 (1–5); Play phone 1080×1920 (1–5); Play tablet 1200×1920 and 1600×2560 (1–6); Play feature graphic 1024×500; Mac 2880×1800 landscape (1, 2, 6). PNG, no alpha.
- Anti-goals: no misspelled query, no "Infinite", no negative net worth, no "€-", no "0 selected" bar, no empty areas in frame; no "Android"/"Google Play" in Apple images; no "Mac" in Google Play images; no "free"/price wording in any store image.
- Demo data: "Home Budget" ledger from `/ledgers?demo=1` → "Generate Data". Fixed clock `2026-11-20T10:00:00` and seeded `Math.random`, so every run gives the same numbers.
- App Store preview: screen recording of the app only (no device frame), 886×1920, 15–30 s, captions and music allowed.
- Showreel, two cuts, each 3840×2160 and 1920×1080 at 60 fps, soundtrack synthesised in code, −14 LUFS:
  - **Keynote cut:** 70–80 s, ~6–8 s per scene, calm score; store version ends on the brand, website version adds "Free & open source".
  - **Social cut:** the old 50 s reel's pace and storyboard, refreshed with current screens; for social media and the website.
  - Both: headline type matches the screenshots (system sans, bold, accent words in the brand gradients; no serif italics); devices named iPhone, iPad, Android, Mac (Windows/Linux only once those builds ship); the keynote cut includes an iPhone Duo segment recorded from the Duo simulator.
- Nothing generated is committed except the finished videos in `marketing/showreel/final/` (current cut only). Captures and images go to each tool's `out/` (gitignored).
- Image generation runs on macOS (the app uses the system font; Linux runners render a different font).

## Review Focus

- **Demo data still generating when a capture fires** → captures must wait for the ledger list and fail loudly, never save a half-loaded screen. Pinned in Task 2 (`waitForLedger` timeout test via `findAntiGoals` on an empty-state text).
- **A caption too long for a size** (e.g. Dutch on the 1080×1920 Play phone) → the renderer must shrink the headline to fit, not clip it. Pinned in Task 3 (`fitHeadline` test).
- **The app's wording or layout changes later** (the whole point of regenerating) → the anti-goal check must catch "Mac" in a Play image and "Needs the Mac app" in frame. Pinned in Task 2 (`findAntiGoals` for set `play`).
- **The autoplay script leaking into a shipped app** → it must exist only in the preview build. Pinned in Task 7 (build-output grep test).
- **ffmpeg or Xcode missing on a machine** → each tool must stop with a one-line message saying what to install, not a stack trace. Pinned in Task 4 (`checkTools` test).

---

## File structure

```
marketing/
  package.json, package-lock.json      playwright, gsap (marketing-only deps)
  shared/
    story.json                         the six shots: route, theme, actions, crop
    strings/en.json                    captions (per language file later)
    capture.mjs                        Playwright capture with fixed clock + seed
    antiGoals.mjs (+ .test.ts)         text checks on a captured page
    tools.mjs (+ .test.ts)             checks ffmpeg/xcrun/Chromium are present
  store-screenshots/
    sets.mjs (+ .test.ts)              every output set and size
    slide.mjs (+ .test.ts)             builds one slide's data (pure)
    templates/slide.html, slide.css    the frame design
    render.mjs                         renders slide HTML to PNG at exact size
    make.mjs                           CLI: capture → render → out/<set>/<lang>/
    README.md
  app-preview/
    record.mjs                         simulator build, install, recordVideo
    compose.mjs                        crop/scale, captions, music → final mp4
    README.md
  showreel/                            restored from 8cf27ba, then updated
    timeline.mjs → timelines/{social,keynote}.mjs
    soundtrack.mjs (+ calm score), render.mjs, capture.mjs, scenes/*.mjs
    duo/record.mjs                     Duo simulator recording
    final/                             committed finished videos
src/marketing/previewAutoplay.ts       preview-build-only story driver
```

---

## Part 1: Store screenshots

### Task 1: Shared story, captions and output sets

**Files:**
- Create: `marketing/package.json`, `marketing/shared/story.json`, `marketing/shared/strings/en.json`, `marketing/store-screenshots/sets.mjs`
- Test: `marketing/store-screenshots/sets.test.ts`
- Modify: `.gitignore` (add `marketing/node_modules/`, `marketing/store-screenshots/out/`, `marketing/app-preview/out/`, `marketing/showreel/out/`, `.superpowers/` already present)

**Interfaces:**
- Produces: `SETS: Record<SetId, { label: string; width: number; height: number; device: "iphone" | "ipad" | "duoInner" | "duoOuter" | "android" | "androidTablet" | "mac" | "banner"; shots: number[]; store: "apple" | "play" | "mac" }>` where `SetId` is `"iphone69" | "ipad13" | "duoInner" | "duoOuter" | "playPhone" | "playTablet7" | "playTablet10" | "playFeature" | "mac"`.
- Produces: `story.json` = array of `{ id: 1..6, page: "dark" | "light", appTheme: "dark" | "light", route: string, actions: Action[], pair?: true, phoneOffset?: number }` with `Action` one of `{ do: "scroll", y }`, `{ do: "click", role, name }`, `{ do: "type", text }`, `{ do: "wait", ms }`.
- Produces: `strings/en.json` = `{ "<id>": { headline: string; sub?: string; body: string; callouts?: string[]; breaks?: string[] } }`, accent words wrapped in `*asterisks*`.

- [ ] **Step 1: Write the failing test** `sets.test.ts`: every set's `width`/`height` equals the Global Constraints table; `iphone69.shots` is `[1,2,3,4,5]`; `ipad13.shots` is `[1..6]`; `mac.shots` is `[1,2,6]`; every Play set has `store: "play"`; Play phone ratio long/short ≤ 2.
- [ ] **Step 2: Run** `pnpm vitest run marketing/store-screenshots/sets.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Write `sets.mjs`, `story.json` and `en.json`** with the spec values (story routes: 1 `/analytics` + Pie chart; 2 `/transactions` + type "groceries over 20 last month "; 3 `/accounts`; 4 `/ai-providers` + "Turn on AI"; 5 `/insights`; 6 `/transactions` at tablet width, "List and details").
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Store screenshots: story, captions and output sets"`

### Task 2: Deterministic capture with anti-goal checks

**Files:**
- Create: `marketing/shared/capture.mjs`, `marketing/shared/antiGoals.mjs`
- Test: `marketing/shared/antiGoals.test.ts`

**Interfaces:**
- Consumes: `story.json`, `SETS[set].device` (Task 1).
- Produces: `findAntiGoals(text: string, store: "apple" | "play" | "mac"): string[]`, which returns the human-readable problems found (empty when clean).
- Produces: `captureShots({ baseUrl: string, device: string, themes: ("dark"|"light")[], shotIds: number[], outDir: string }): Promise<string[]>`, which writes `<outDir>/<device>-<theme>-<id>.png` and returns the paths. Device viewports (CSS px, scale 3 for phones, 2 for tablets/Mac): iphone 440×956, duoOuter 466×678, duoInner 669×951, android 412×915, ipad 1032×1376, androidTablet 800×1280, mac 1440×900.

- [ ] **Step 1: Write failing tests** `antiGoals.test.ts`:
  - `findAntiGoals("Runway Infinite", "apple")` contains `"Infinite"`.
  - `findAntiGoals("Spent €-1,380.00", "apple")` contains `"€-"`.
  - `findAntiGoals("0 selected", "apple")` is non-empty.
  - `findAntiGoals("Needs the Mac app.", "play")` is non-empty; the same text for `"apple"` is empty.
  - `findAntiGoals("Works on Android", "apple")` is non-empty.
  - `findAntiGoals("No ledgers yet", "apple")` is non-empty (empty state, i.e. demo data not loaded).
  - `findAntiGoals("Free & open source", "apple")` and the same for `"play"` are non-empty (no price or "free" wording in store images).
  - `findAntiGoals("Groceries €52.10", "apple")` is empty.
- [ ] **Step 2: Run** `pnpm vitest run marketing/shared/antiGoals.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `findAntiGoals`** as a list of `{ pattern: RegExp, stores, message }` rules.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Implement `captureShots`.** Per context: `page.clock.install({ time: new Date("2026-11-20T10:00:00") })`; `addInitScript` replacing `Math.random` with a mulberry32 PRNG seeded `20261120`; set `localStorage["vite-ui-theme"]` to the theme; open `/ledgers?demo=1`, click "Generate Data", wait for the text "Home Budget" (30 s timeout, then throw `"Demo data did not finish loading"`), open it, then for each shot run its actions and, before saving, run `findAntiGoals(await page.innerText("body"), store)` on the visible screen and throw with the shot id and problems if any.
- [ ] **Step 6: Verify by hand:** `pnpm build && pnpm exec vite preview --port 5199 &` then `node -e "import('./marketing/shared/capture.mjs').then(m=>m.captureShots({baseUrl:'http://localhost:5199',device:'iphone',themes:['dark','light'],shotIds:[1,2,3,4,5],outDir:'marketing/store-screenshots/out/captures'}))"`. Expected: 10 PNGs; running it twice gives byte-identical files for shot 3 (`cmp`).
- [ ] **Step 7: Commit** `git commit -m "Store screenshots: deterministic capture with anti-goal checks"`

### Task 3: Slide model and frame template

**Files:**
- Create: `marketing/store-screenshots/slide.mjs`, `marketing/store-screenshots/templates/slide.html`, `marketing/store-screenshots/templates/slide.css`
- Test: `marketing/store-screenshots/slide.test.ts`

**Interfaces:**
- Consumes: `SETS`, `story.json`, strings (Task 1).
- Produces: `buildSlide(set: SetId, shotId: number, strings: object): Slide` where `Slide = { width, height, page: "dark"|"light", headlineHtml, sub?, body, callouts: string[], devices: { image: string, theme, transform: "straight"|"faceLeft"|"faceRight", offsetY: number }[], statusBar: { time: "9:41", network: "5G" } }`.
- Produces: `fitHeadline(text: string, maxWidthPx: number, startPx: number, measure: (t: string, px: number) => number): number` (largest font size ≤ `startPx` whose widest line fits; lines from greedy word wrap).
- Produces: `headlineToHtml(text: string): string` (`*word*` → `<em>word</em>`, HTML-escaped).

- [ ] **Step 1: Write failing tests** `slide.test.ts`:
  - `buildSlide("iphone69", 1, en).devices` has two entries, `faceLeft` dark and `faceRight` light.
  - `buildSlide("iphone69", 2, en).page` is `"light"` and its device theme is `"dark"`.
  - `buildSlide("ipad13", 6, en).width` is `2064`.
  - `buildSlide("iphone69", 4, en).callouts` equals the two callout strings; shot 4's `offsetY` is greater than shot 3's.
  - `headlineToHtml("See where it *really* goes.")` is `"See where it <em>really</em> goes."`.
  - `fitHeadline` with a measure of `t.length * px * 0.5` returns a smaller size for a 60-character headline than for a 20-character one, and never exceeds `startPx`.
- [ ] **Step 2: Run** `pnpm vitest run marketing/store-screenshots/slide.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `slide.mjs`.**
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Write `slide.html` / `slide.css`** from the approved mockup (`.superpowers/brainstorm/19997-1794744160/content/screenshot-final-look-v11.html`), sized in CSS px equal to the output size at scale 1, with `text-wrap: balance`, the status bar, the face-off transforms (`perspective`, `rotateY(±30deg)`, both phones inside the frame), callout chips with inline SVG monitor and shield icons, and `breaks` support (explicit `<br>`).
- [ ] **Step 6: Commit** `git commit -m "Store screenshots: slide model and frame template"`

### Task 4: Renderer and CLI

**Files:**
- Create: `marketing/store-screenshots/render.mjs`, `marketing/store-screenshots/make.mjs`, `marketing/shared/tools.mjs`, `marketing/store-screenshots/README.md`
- Test: `marketing/shared/tools.test.ts`, `marketing/store-screenshots/png.test.ts`
- Modify: `package.json` (script `"marketing:screenshots": "node marketing/store-screenshots/make.mjs"`)

**Interfaces:**
- Consumes: `captureShots` (Task 2), `buildSlide` (Task 3), `SETS` (Task 1).
- Produces: `checkTools(needs: ("ffmpeg"|"xcrun"|"chromium")[], which: (cmd: string) => boolean): string[]` (one message per missing tool, e.g. `"ffmpeg not found: brew install ffmpeg"`).
- Produces: `pngSize(buf: Buffer): { width: number, height: number }` (reads the IHDR chunk).
- Produces CLI: `pnpm marketing:screenshots [--set <SetId>|all] [--lang en] [--keep-captures]` → `marketing/store-screenshots/out/<set>/<lang>/<nn>.png`, plus `playFeature/en/feature.png`.

- [ ] **Step 1: Write failing tests:** `checkTools(["ffmpeg"], () => false)` returns one message containing `brew install ffmpeg`; `checkTools(["ffmpeg"], () => true)` is empty; `pngSize` of a known 1×1 PNG buffer is `{width:1,height:1}`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement `tools.mjs`, `pngSize` (in `render.mjs`, exported), the renderer** (load `slide.html` with the slide data, `page.screenshot({ omitBackground: false })` at device scale 1, then verify `pngSize` equals the set size, else throw), **and `make.mjs`**, which builds the web app, starts `vite preview` on a free port, captures, renders, stops the server and prints a summary table of files.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Run** `pnpm marketing:screenshots --set all`. Expected: 5+6+6+5+5+6+6 slides, 1 feature graphic and 3 Mac images; every file's size matches `SETS`; no anti-goal errors. Open `out/iphone69/en/` and compare with the approved mockup.
- [ ] **Step 6: Commit** `git commit -m "Store screenshots: renderer and one-command CLI"`

### Task 5: Regenerate on every release

**Files:**
- Modify: `.github/workflows/release.yml` (new job `store-screenshots`, `runs-on: macos-latest`)
- Modify: `documentation/CLAUDE.md` (repository hygiene table: the three `marketing/*/out/` paths; marketing exception now also covers `marketing/showreel/final/`)

- [ ] **Step 1: Add the job:** checkout, pnpm, Node 22, `pnpm install --frozen-lockfile`, `npm ci --prefix marketing`, `npx --prefix marketing playwright install chromium`, `pnpm marketing:screenshots --set all`, `cd marketing/store-screenshots/out && zip -r ../store-screenshots.zip .`, `gh release upload "$RELEASE_TAG" marketing/store-screenshots/store-screenshots.zip --clobber`.
- [ ] **Step 2: Verify** with `gh workflow run release.yml -f tag=<an existing test tag>` on a branch, or locally with `act` if installed. Expected: the zip appears on the release.
- [ ] **Step 3: Commit** `git commit -m "Release: attach regenerated store screenshots"`

## Part 2: Restore the showreel engine

### Task 6: Bring back the old showreel engine

**Files:**
- Restore from `8cf27ba`: everything under `marketing/showreel/` (`git checkout 8cf27ba -- marketing/showreel`)
- Modify: `package.json` (scripts `showreel`, `showreel:draft`, `showreel:capture` as they were in `8cf27ba`, plus `--cut` passthrough), `.gitignore` (`marketing/showreel/out/` if missing)
- Test: `marketing/showreel/timeline.test.ts`

**Interfaces:**
- Produces (existing, keep the names): `window.__render(seconds)`; `timeline.mjs` exports tempo, chapters and named cues; `soundtrack.mjs` writes `out/soundtrack.wav` from the timeline; `render.mjs` flags `--draft`, `--stills`, `--from/--to`, `--blur`, `--workers`.
- Produces (new): `render.mjs --cut social|keynote` and `--scale 2` (4K: the 1920×1080 stage drawn at twice the detail); `soundtrack.mjs --cut`.

- [ ] **Step 1: Restore** the folder and scripts; `pnpm install`.
- [ ] **Step 2: Write a failing test** `timeline.test.ts`: the social timeline's chapters are in time order without gaps, and the last chapter ends at the film's length.
- [ ] **Step 3: Run** `pnpm vitest run marketing/showreel/timeline.test.ts`. Expected: PASS against the restored timeline (it pins existing behaviour before changes); if it fails, fix the test to the real structure and note it.
- [ ] **Step 4: Run** `pnpm showreel:draft`. Expected: a 960×540 draft of the old 50 s reel renders (old screens are fine at this step).
- [ ] **Step 5: Add `--scale 2`** to `render.mjs` (device scale factor 2 on the CDP viewport, output 3840×2160) and render a 2 s slice: `node marketing/showreel/render.mjs --scale 2 --from 2 --to 4`. Expected (`ffprobe`): 3840×2160.
- [ ] **Step 6: Commit** `git commit -m "Showreel: restore the code-built engine, add 4K"`

## Part 3: App Store preview

### Task 7: Preview-only autoplay and simulator recording

**Files:**
- Create: `src/marketing/previewAutoplay.ts`, `marketing/app-preview/record.mjs`
- Modify: `src/main.tsx` (import `previewAutoplay` only when `import.meta.env.VITE_PREVIEW_AUTOPLAY === "1"`), `package.json` (script `"marketing:preview": "node marketing/app-preview/record.mjs && node marketing/app-preview/compose.mjs"`)
- Test: `src/marketing/previewAutoplay.test.ts`, `src/tests/previewAutoplayNotShipped.test.ts`

**Interfaces:**
- Consumes: `story.json` actions (Task 1).
- Produces: `runPreviewStory(steps: PreviewStep[], api: { navigate(path: string): void; click(role: string, name: string): Promise<void>; type(text: string): Promise<void>; wait(ms: number): Promise<void> }): Promise<void>` where `PreviewStep` = the story actions plus `{ do: "goto", path }`; when finished it sets `document.title = "preview:done"`.
- Produces: `recordSimulator({ device: string, seconds: number, out: string }): Promise<void>` in `record.mjs`. It builds with `VITE_PREVIEW_AUTOPLAY=1 pnpm build:app`, then `cap sync ios`, builds for the simulator (as `ios:build:simulator`), boots the device, runs `xcrun simctl status_bar <udid> override --time 9:41 --dataNetwork 5g --batteryState charged --batteryLevel 100`, installs, records (`xcrun simctl io <udid> recordVideo --codec h264`), launches, and stops on `preview:done` or the time limit. Default device "iPhone 18 Pro Max"; Task 11 reuses it with "iPhone Duo".

- [ ] **Step 1: Write failing tests:** with a fake `api`, `runPreviewStory` calls `navigate("/analytics")` first and `type("groceries over 20 last month ")` exactly once; `previewAutoplayNotShipped.test.ts` reads `dist/` (skipped when missing) and asserts no file contains `"preview:done"`.
- [ ] **Step 2: Run** `pnpm vitest run src/marketing src/tests/previewAutoplayNotShipped.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `previewAutoplay.ts` (story ~25 s: 0–4 s Charts donut, 4–10 s search typed and understood, 10–14 s Accounts, 14–19 s AI switched on, 19–23 s Spending insights, 23–25 s hold) and the guarded import.
- [ ] **Step 4: Run** the tests (after `pnpm build:app` for the guard). Expected: PASS.
- [ ] **Step 5: Implement and run `record.mjs`.** Expected: `marketing/app-preview/out/raw.mp4`, 25–30 s, the real app with the 9:41 / 5G status bar.
- [ ] **Step 6: Commit** `git commit -m "App Store preview: preview-only autoplay and simulator recording"`

### Task 8: Preview captions, music and export

**Files:**
- Create: `marketing/app-preview/compose.mjs`, `marketing/app-preview/README.md`
- Test: `marketing/app-preview/compose.test.ts`

**Interfaces:**
- Consumes: `out/raw.mp4` (Task 7); the showreel synthesiser (`soundtrack.mjs`, Task 6) for a 25 s calm cue; strings (Task 1).
- Produces: `captionTimeline(strings, story): { start: number, end: number, headline: string, sub?: string }[]` and `marketing/app-preview/out/vaulted-money-app-preview.mp4` (886×1920, H.264 + AAC, 15–30 s, −14 LUFS).

- [ ] **Step 1: Write failing tests:** `captionTimeline` returns 5 entries in time order without overlaps, the last ending ≤ 30; entry 2's headline is shot 2's headline without asterisks.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement:** captions rendered as transparent PNGs with the slide template's typography and overlaid with ffmpeg `overlay=enable='between(t,a,b)'`; video scaled to 886×1920; music from the synthesiser with a lift at the search reveal; `loudnorm=I=-14`.
- [ ] **Step 4: Run** the tests, then `pnpm marketing:preview`. Expected: PASS; `ffprobe` shows 886×1920 and 15–30 s.
- [ ] **Step 5: Commit** `git commit -m "App Store preview: captions, music and export"`

## Part 4: Showreels

### Task 9: Refresh capture and typography (both cuts)

**Files:**
- Modify: `marketing/showreel/capture.mjs`, `marketing/showreel/showreel.mjs`, `marketing/showreel/styles.css`, `marketing/showreel/scenes/*.mjs` (copy only)

- [ ] **Step 1: Capture from the current app:** point `capture.mjs` at the "Home Budget" ledger with the fixed clock and seed from Task 2 (reuse `marketing/shared/capture.mjs` helpers); capture both themes; capture phone, iPad, Android-width and Mac-window screens, including the two-panel Transactions view and the AI page with the new wording.
- [ ] **Step 2: Typography:** drop the Google Fonts download; headlines use the screenshots' stack (`-apple-system, "SF Pro Display", Inter, sans-serif`, weight 800, tight tracking); accent words use the dark/light brand gradients instead of Instrument Serif italic; JetBrains Mono stays only for the terminal/HUD labels (system monospace).
- [ ] **Step 3: Copy:** remove Windows and Linux; platform lists read iPhone · iPad · Android · Mac · Web; run `findAntiGoals` (Task 2, store `"mac"`) over every scene's visible text in a stills pass and fix what it finds (the "Free & open source" chapter is allowed in the social cut).
- [ ] **Step 4: Check:** `node marketing/showreel/render.mjs --stills 2,6,12,18,24,32,40,47 --cut social`. Expected: 8 stills, all current screens, no serif italics, no anti-goals.
- [ ] **Step 5: Commit** `git commit -m "Showreel: current screens and screenshot typography"`

### Task 10: Keynote cut and calm score

**Files:**
- Create: `marketing/showreel/timelines/keynote.mjs`, `marketing/showreel/scenes/{faceoff,search,labels,aiSwitch,bigScreens}.mjs`
- Move: `marketing/showreel/timeline.mjs` → `marketing/showreel/timelines/social.mjs` (update imports)
- Modify: `marketing/showreel/soundtrack.mjs` (score selected by cut), `marketing/showreel/showreel.mjs` (`?cut=` / `--cut`)
- Test: extend `marketing/showreel/timeline.test.ts`

**Interfaces:**
- Consumes: the engine (Task 6), captures (Task 9), strings (Task 1), the Duo recording `marketing/showreel/out/duo/duo-split.mp4` (Task 11; until then the scene uses the iPad capture).
- Produces: `timelines/keynote.mjs` with the same exports as `social.mjs`.

Keynote storyboard (≈76 s, tempo ~84 BPM): vault logo 0–5 → privacy face-off 5–14 ("Unless you switch AI on" as its own beat) → search 14–23 (typed at a readable pace; "Understood as" zooms) → labels 23–31 (light/dark sweep across Accounts) → AI switch 31–40 (switch flips; the two callouts slide in) → budgets 40–48 (zoom into the over-budget card) → big screens 48–57 (iPhone becomes iPad becomes iPhone Duo unfolding to two panels) → every device 57–67 (iPhone, iPad, Android, Mac glide into a row) → end 67–76 (lockup; `web` version adds "Free & open source").

- [ ] **Step 1: Extend the test:** the keynote timeline is 70–80 s, chapters in order without gaps, every chapter ≥ 5 s; the social timeline is unchanged in length.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement** the keynote timeline, the new scenes and the calm score (soft pads and piano, gentle pulse, lifts at privacy, the device reveal and the end; UI ticks on cues).
- [ ] **Step 4: Run** the test. Expected: PASS. Then `node marketing/showreel/render.mjs --cut keynote --stills 8,18,27,35,44,52,62,72`; review the stills.
- [ ] **Step 5: Commit** `git commit -m "Showreel: keynote cut and calm score"`

### Task 11: iPhone Duo segment from the simulator

**Files:**
- Create: `marketing/showreel/duo/record.mjs`

**Interfaces:**
- Consumes: `recordSimulator` (Task 7) and `previewAutoplay` with a Duo story (`/transactions` → tap three rows so the details panel changes → hold).
- Produces: `marketing/showreel/out/duo/duo-split.mp4` (inner display, 10–12 s).

- [ ] **Step 1: Create the device** if missing: `xcrun simctl create "Vaulted Duo" com.apple.CoreSimulator.SimDeviceType.iPhone-Duo com.apple.CoreSimulator.SimRuntime.iOS-27-2`.
- [ ] **Step 2: Record** with `recordSimulator({ device: "Vaulted Duo", seconds: 12, out: ".../duo-split.mp4" })`. Expected: the two-panel layout on the inner display, rows selected one after another, nothing under the side status bar.
- [ ] **Step 3: Swap it into** the keynote's big-screens scene (drawn Duo frame around the video) and re-render that stretch: `--cut keynote --from 48 --to 57 --draft`.
- [ ] **Step 4: Commit** `git commit -m "Showreel: iPhone Duo segment recorded from the simulator"`

### Task 12: Final renders and commit the finals

**Files:**
- Create: `marketing/showreel/final/vaulted-money-showreel-keynote-4k.mp4`, `...-keynote-1080p.mp4`, `...-social-4k.mp4`, `...-social-1080p.mp4`, `marketing/showreel/final/vaulted-money-app-preview.mp4`
- Modify: `marketing/showreel/README.md` (both storyboards, how to render each cut)
- Delete: the untracked `marketing/vaulted-money-showreel-hq.mp4` once the owner has the new cuts

- [ ] **Step 1: Owner review:** render both cuts at 1080p (`pnpm showreel -- --cut keynote`, `--cut social`) and share them; apply notes by re-rendering only the changed stretch (`--from/--to`).
- [ ] **Step 2: Final 4K renders** (`--scale 2`) of both cuts, keynote in its store and web versions. Expected (`ffprobe`): 3840×2160 and 1920×1080, 60 fps; keynote 70–80 s, social ≈50 s.
- [ ] **Step 3: Copy finals** into `marketing/showreel/final/` (store keynote, social, app preview) and update the README.
- [ ] **Step 4: Run the repo checks:** `pnpm lint && pnpm format:check && npx tsc --noEmit -p tsconfig.app.json && pnpm test:coverage && pnpm build`. Expected: all pass.
- [ ] **Step 5: Commit** `git commit -m "Showreels and App Store preview: final cuts"`

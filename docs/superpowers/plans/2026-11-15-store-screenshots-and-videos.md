# Store Screenshots, App Store Preview and Showreel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command makes every App Store / Google Play / Polar image from the real app; a recorded App Store preview and a 4K keynote-style showreel follow the same story.

**Architecture:** Three tools under `marketing/`, sharing one capture step and one caption source. `store-screenshots` drives the web build in Playwright (fixed clock and random seed, so numbers never change), captures screens per device and theme, then renders HTML frames to exact pixel sizes. `app-preview` records the real iOS app in the simulator while a preview-only autoplay script walks the story, then adds captions and music with ffmpeg. `showreel` is an HTML stage animated by a GSAP timeline, rendered frame by frame (the jhg method) with a synthesised soundtrack.

**Tech Stack:** Node 22 ES modules, Playwright (Chromium), GSAP 3, ffmpeg (libx264, aac), Xcode simulator (`simctl`), Vitest for the pure logic.

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
- Showreel: 3840×2160 and 1920×1080, 60 fps, 70–80 s, ~6–8 s per scene; soundtrack synthesised in code, normalised to −14 LUFS; store cut ends on the brand, website cut adds "Free & open source"; devices named: iPhone, iPad, Android, Mac.
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
  audio/
    synth.mjs, score.mjs               shared synthesiser and the calm score
  app-preview/
    record.mjs                         simulator build, install, recordVideo
    compose.mjs                        crop/scale, captions, music → final mp4
    README.md
  showreel/
    index.html, src/main.js, src/styles.css, src/scenes/*.js
    render.mjs, mux.mjs, README.md
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

## Part 2: Shared soundtrack and the App Store preview

### Task 6: Synthesised score

**Files:**
- Create: `marketing/audio/synth.mjs`, `marketing/audio/score.mjs`
- Test: `marketing/audio/score.test.ts`

**Interfaces:**
- Produces: `renderScore({ seconds: number, cues: { t: number, kind: "lift"|"tick"|"whoosh"|"chime" }[], sampleRate?: 48000 }): Float32Array[]` (stereo) and `writeWav(path: string, channels: Float32Array[], sampleRate: number): void`.
- Mood (spec): calm, confident, modern; soft synth pads and piano, a gentle pulse that lifts at `lift` cues; quiet UI effects at the other cues.

- [ ] **Step 1: Write failing tests:** `renderScore({ seconds: 2, cues: [] })` returns 2 channels of 96 000 samples; every sample is within [−1, 1]; a `tick` cue at 1.0 s raises the RMS of 0.98–1.05 s above the RMS of 0.5–0.57 s.
- [ ] **Step 2: Run** `pnpm vitest run marketing/audio/score.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** (oscillators with ADSR, simple reverb via a feedback delay network, piano as decaying partials). Port the structure of the jhg `audio.mjs`; do not copy its Indian instrumentation.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Listen:** `node -e "...renderScore({seconds:30,cues:[{t:4,kind:'lift'}]})..."` → `marketing/audio/out/sample.wav`. Play it; check that it's calm and doesn't clip.
- [ ] **Step 6: Commit** `git commit -m "Marketing: synthesised score"`

### Task 7: Preview-only autoplay and simulator recording

**Files:**
- Create: `src/marketing/previewAutoplay.ts`, `marketing/app-preview/record.mjs`
- Modify: `src/main.tsx` (import `previewAutoplay` only when `import.meta.env.VITE_PREVIEW_AUTOPLAY === "1"`)
- Modify: `package.json` (script `"marketing:preview": "node marketing/app-preview/record.mjs && node marketing/app-preview/compose.mjs"`)
- Test: `src/marketing/previewAutoplay.test.ts`, `src/tests/previewAutoplayNotShipped.test.ts`

**Interfaces:**
- Consumes: `story.json` actions (Task 1).
- Produces: `runPreviewStory(steps: PreviewStep[], api: { navigate(path): void; click(role, name): Promise<void>; type(text): Promise<void>; wait(ms): Promise<void> }): Promise<void>`, where `PreviewStep` = the story actions plus `{ do: "goto", path }`. On finishing it sets `document.title = "preview:done"`.
- Produces: `record.mjs`, which builds with `VITE_PREVIEW_AUTOPLAY=1 pnpm build:app`, runs `cap sync ios`, builds for the simulator (as `ios:build:simulator`), boots "iPhone 18 Pro Max", sets the status bar (`xcrun simctl status_bar booted override --time 9:41 --dataNetwork 5g --batteryLevel 100`), installs, starts `xcrun simctl io booted recordVideo --codec h264 out/raw.mp4`, launches the app, and stops recording 30 s later or on `preview:done`.

- [ ] **Step 1: Write failing tests:** with a fake `api`, `runPreviewStory` calls `navigate("/analytics")` first and `type("groceries over 20 last month ")` exactly once; `previewAutoplayNotShipped.test.ts` reads `dist/` after `pnpm build:app` (skipped if `dist/` is missing) and asserts no file contains `"preview:done"`.
- [ ] **Step 2: Run** `pnpm vitest run src/marketing src/tests/previewAutoplayNotShipped.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `previewAutoplay.ts` (story ~25 s: 0–4 s Charts donut, 4–10 s search typed and understood, 10–14 s Accounts, 14–19 s AI switched on, 19–23 s Spending insights, 23–25 s hold) and the guarded import.
- [ ] **Step 4: Run** the tests (after `pnpm build:app` for the guard). Expected: PASS.
- [ ] **Step 5: Implement and run `record.mjs`.** Expected: `marketing/app-preview/out/raw.mp4`, 25–30 s, the real app with the 9:41/5G status bar.
- [ ] **Step 6: Commit** `git commit -m "App Store preview: preview-only autoplay and simulator recording"`

### Task 8: Preview captions, music and export

**Files:**
- Create: `marketing/app-preview/compose.mjs`, `marketing/app-preview/README.md`
- Test: `marketing/app-preview/compose.test.ts`

**Interfaces:**
- Consumes: `out/raw.mp4` (Task 7), `renderScore`/`writeWav` (Task 6), strings (Task 1).
- Produces: `captionTimeline(strings, story): { start: number, end: number, headline: string, sub?: string }[]` and `marketing/app-preview/out/vaulted-money-app-preview.mp4` (886×1920, H.264 + AAC, 15–30 s, −14 LUFS).

- [ ] **Step 1: Write failing tests:** `captionTimeline` returns 5 entries in time order that don't overlap, with the last ending ≤ 30; entry 2's headline is the plain text of shot 2's headline (no asterisks).
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** Captions are rendered as transparent PNGs with the slide template's typography and overlaid with ffmpeg `overlay=enable='between(t,a,b)'`; the video is scaled to 886×1920; the music comes from `renderScore` with a `lift` at the search reveal; `loudnorm=I=-14`.
- [ ] **Step 4: Run** the tests, then `pnpm marketing:preview`. Expected: PASS; `ffprobe` shows 886×1920 and a duration of 15–30 s.
- [ ] **Step 5: Commit** `git commit -m "App Store preview: captions, music and export"`

## Part 3: Showreel

### Task 9: Stage and frame-by-frame renderer

**Files:**
- Create: `marketing/showreel/index.html`, `marketing/showreel/src/main.js`, `marketing/showreel/src/styles.css`, `marketing/showreel/render.mjs`, `marketing/showreel/mux.mjs`
- Test: `marketing/showreel/frames.test.ts`

**Interfaces:**
- Consumes: captures from `captureShots` for devices `iphone`, `ipad`, `android`, `mac` in both themes (Task 2), copied to `marketing/showreel/out/captures/`.
- Produces: `window.__seek(t: number): void` on the stage (pauses the GSAP master timeline at `t`); `window.__cues(): { t, kind }[]`; `frameTimes(fps: number, sub: number, from: number, to: number): number[][]` (sub-sample times per output frame, for motion blur).
- Produces CLI: `node marketing/showreel/render.mjs [--fps 60] [--sub 5] [--scale 2] [--from s] [--to s] [--stills a,b] [--cut store|web]` → `out/video-silent.mp4`; `node marketing/showreel/mux.mjs` → `out/vaulted-money-showreel-<4k|1080p>-<cut>.mp4`.

- [ ] **Step 1: Write failing tests:** `frameTimes(60, 5, 0, 1)` has 60 frames of 5 times each, all within [0, 1), and strictly increasing; `frameTimes(60, 1, 2, 3)[0][0]` is 2.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the stage (1920×1080 layout drawn at `--scale 2` for 4K), `render.mjs` (headless Chromium, `__seek` per sub-sample, average sub-samples, pipe raw frames to ffmpeg libx264 CRF 14, workers), and `mux.mjs` (adds the WAV, `loudnorm=I=-14`). Follow the jhg `render.mjs`/`mux.mjs` structure.
- [ ] **Step 4: Run** the tests, then `node marketing/showreel/render.mjs --fps 30 --sub 1 --to 3`. Expected: PASS; a 3 s silent draft.
- [ ] **Step 5: Commit** `git commit -m "Showreel: stage and frame-by-frame renderer"`

### Task 10: Scenes

**Files:**
- Create: `marketing/showreel/src/scenes/{intro,privacy,search,labels,ai,budgets,bigScreens,devices,end}.js`
- Modify: `marketing/showreel/src/main.js`

**Interfaces:**
- Consumes: the stage helpers (Task 9) and strings (Task 1).
- Produces: each scene exports `build(tl: gsap.core.Timeline, at: number): { end: number, cues: {t, kind}[] }`; `main.js` chains them and exposes the combined cues.

Scene plan (≈76 s): intro logo build 0–5; privacy 5–14 (face-off pair, the "Unless you switch AI on" line arrives as its own beat); search 14–23 (query types at a readable pace, the "Understood as" panel zooms); labels 23–31 (light/dark theme sweep across Accounts); ai 31–40 (switch flips, both callouts slide in); budgets 40–48 (zoom into the over-budget card); bigScreens 48–57 (iPhone morphs into iPad, two panels); devices 57–67 ("Every device": iPhone, iPad, Android, Mac glide into a row); end 67–76 (logo, name; the `web` cut adds "Free & open source").

- [ ] **Step 1: Implement** the scenes. Use only captured screens and spec copy; each headline is held ≥ 2 reading passes (≥ 0.5 s per word, minimum 3 s).
- [ ] **Step 2: Check stills:** `node marketing/showreel/render.mjs --stills 7,18,27,35,44,52,62,72`. Expected: 8 PNGs in `out/stills`; review each against the spec's anti-goals (also run `findAntiGoals` over the text the stage shows at each still time).
- [ ] **Step 3: Commit** `git commit -m "Showreel: scenes"`

### Task 11: Soundtrack, final renders, commit finals

**Files:**
- Create: `marketing/showreel/final/vaulted-money-showreel-4k.mp4`, `marketing/showreel/final/vaulted-money-showreel-1080p.mp4`, `marketing/showreel/final/vaulted-money-app-preview.mp4`, `marketing/showreel/README.md`
- Delete: the untracked `marketing/vaulted-money-showreel-hq.mp4` (after the owner confirms the new reel)

- [ ] **Step 1: Score to picture:** `node marketing/showreel/render.mjs --cues-only` → `out/cues.json`; render the score from it (Task 6) → `out/soundtrack.wav`, ≈76 s with lifts at privacy, the device reveal and the end.
- [ ] **Step 2: Final renders:** `--scale 2 --fps 60 --sub 5 --cut store` and the same with `--cut web`, then `mux.mjs` for 4K and 1080p. Expected (`ffprobe`): 3840×2160 and 1920×1080, 60 fps, 70–80 s.
- [ ] **Step 3: Owner review:** share the store-cut 1080p file; apply notes; re-render only the changed stretch (`--from/--to`).
- [ ] **Step 4: Copy finals** (store cut 4K and 1080p, the app preview) into `marketing/showreel/final/`; write the README (script table, how to re-render, as in the jhg README).
- [ ] **Step 5: Run the repo checks:** `pnpm lint && pnpm format:check && npx tsc --noEmit -p tsconfig.app.json && pnpm test:coverage && pnpm build`. Expected: all pass.
- [ ] **Step 6: Commit** `git commit -m "Showreel and App Store preview: final cuts"`

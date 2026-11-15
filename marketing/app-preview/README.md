# App Store preview

A ~25-second iPhone preview recorded from the real app in the simulator,
with captions and a calm synthesised score. Apple allows only recordings of
the app itself (no device frames), 15–30 s, 886×1920 for iPhone 6.9".

```bash
pnpm marketing:preview          # record + compose → out/vaulted-money-app-preview.mp4
node marketing/app-preview/record.mjs --device "iPhone 18 Pro Max"   # just record
node marketing/app-preview/compose.mjs                                # just compose
```

Needs Xcode (simulator) and ffmpeg.

## How it works

1. `record.mjs` builds the app with `VITE_PREVIEW_AUTOPLAY=1`. That build
   plays the story in `src/marketing/previewAutoplay.ts` by itself: demo data,
   Charts (donut) → search typed → Accounts → AI switched on → budget
   warnings. Normal builds never contain it
   (`src/tests/previewAutoplayNotShipped.test.ts`).
2. It installs that build on the simulator with a 9:41 / 5G / full-battery
   status bar and records the screen. The story tells a small local listener
   when it starts and ends; those times trim the video. The normal app build
   is always restored afterwards.
3. `compose.mjs` trims, scales to 886×1920, overlays a caption card per
   screen (`captions.mjs`, text from `../shared/strings/en.json`), and adds
   the score (`../showreel/calmScore.mjs`, cues in `cues.mjs`), normalised to
   −14 LUFS.

If you change the story's screens, update `SEGMENTS` in `captions.mjs` to
match.

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

## iPad and iPhone Duo footage (keynote showreel)

The keynote's "Big screens" scene plays two simulator recordings: the iPad
switching from the table to list and details, then the iPhone Duo opening
rows with the details alongside.

1. iPad (upright, no setup):
   `node marketing/app-preview/record.mjs --device "iPad Pro 13-inch (M5)" --story ipad --name ipad`
2. iPhone Duo: no command can rotate or unfold the simulator, so in Xcode
   open **Window → Devices and Simulators** (Device Hub), boot **iPhone Duo**,
   unfold it and turn it sideways. Then run
   `node marketing/app-preview/record.mjs --device "iPhone Duo" --story duo --name duo --display 3`
   (display 3 is the inner screen; the Duo has two).
3. Check where each story's footage should begin and adjust `RECORDINGS` in
   `marketing/showreel/duo/overlay.mjs` if needed (the start mark lands about
   a second after the story starts).
4. Run `node marketing/showreel/duo/overlay.mjs` (add `--scale 2` and `--in`
   for the 4K file) to place both on the keynote cut.

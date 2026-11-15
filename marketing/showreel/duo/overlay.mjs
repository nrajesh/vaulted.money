#!/usr/bin/env node
/**
 * Places the iPhone Duo simulator recording onto the keynote cut's Duo
 * screen, for the stretch after the Duo has unfolded.
 *
 *   node marketing/app-preview/record.mjs --device "iPhone Duo" --story duo --name duo
 *   node marketing/showreel/duo/overlay.mjs [--scale 2] [--in <keynote.mp4>]
 *
 * Writes <keynote>-duo.mp4 next to the input. The Duo must be turned
 * sideways in Xcode's Device Hub before recording (no command can rotate it).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { chapter } from "../timelines/keynote.mjs";

/** Where (px) and when (s) the Duo screen is on stage; mirrors keynote.mjs. */
/**
 * Seconds into the Duo recording where the footage starts: "List and
 * details" is already on screen and the selected row and the details panel
 * agree (later taps in the recorded run did not stay in step).
 */
export const DUO_SKIP = 0.3;

export function duoWindow(scale = 1) {
  const big = chapter("bigScreens");
  // keynote.mjs: the Duo comes in at +3.0 s and is still 1.2 s later.
  const handover = big.start + 3.0;
  return {
    x: (960 + 12) * scale,
    y: (300 + 12) * scale,
    width: 836 * scale,
    height: 614 * scale,
    radius: 40 * scale,
    from: handover + 1.2,
    to: big.end - 0.7,
  };
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const REPO = path.resolve(import.meta.dirname, "../../..");
  const scale = Number(arg("scale", 1));
  const input = arg(
    "in",
    path.join(
      REPO,
      "marketing/showreel/out/vaulted-money-showreel-keynote.mp4",
    ),
  );
  const duo = path.join(REPO, "marketing/app-preview/out/duo.mp4");
  if (!existsSync(duo))
    throw new Error("No Duo recording: see marketing/app-preview/README.md");
  const marks = JSON.parse(
    readFileSync(
      path.join(REPO, "marketing/app-preview/out/duo.marks.json"),
      "utf8",
    ),
  );
  const w = duoWindow(scale);
  const out = input.replace(/\.mp4$/, "-duo.mp4");
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    input,
    "-ss",
    String(marks.start + DUO_SKIP),
    "-i",
    duo,
    "-filter_complex",
    // The footage, its corners rounded to match the drawn screen.
    `[1:v]tpad=stop_mode=clone:stop_duration=10,setpts=PTS-STARTPTS+${w.from}/TB,scale=${w.width}:${w.height},format=rgba[d0];` +
      `color=c=white:s=${w.width}x${w.height},format=gray,geq=lum='255*lte(hypot(max(0\\,max(${w.radius}-X\\,X-(W-1-${w.radius})))\\,max(0\\,max(${w.radius}-Y\\,Y-(H-1-${w.radius})))),${w.radius})'[m];` +
      `[d0][m]alphamerge[d];` +
      `[0:v][d]overlay=${w.x}:${w.y}:eof_action=pass:enable='between(t,${w.from},${w.to})'[v]`,
    "-map",
    "[v]",
    "-map",
    "0:a",
    "-c:v",
    "libx264",
    "-crf",
    "14",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "copy",
    "-movflags",
    "+faststart",
    out,
  ]);
  console.log(`✓ ${path.relative(REPO, out)}`);
}

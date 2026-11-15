#!/usr/bin/env node
/**
 * Plays the simulator recordings on the keynote cut's big-screen devices:
 * the iPad switching from the table to list and details, then the iPhone Duo
 * opening rows with the details alongside.
 *
 *   node marketing/app-preview/record.mjs --device "iPad Pro 13-inch (M5)" --story ipad --name ipad
 *   node marketing/app-preview/record.mjs --device "iPhone Duo" --story duo --name duo --display 3
 *   node marketing/showreel/duo/overlay.mjs [--scale 2] [--in <keynote.mp4>]
 *
 * Writes <keynote>-duo.mp4 next to the input, with whichever recordings
 * exist. The Duo must be unfolded and turned sideways in Xcode's Device Hub
 * before recording (no command can rotate it).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { chapter } from "../timelines/keynote.mjs";

/** keynote.mjs: the iPad hands over to the Duo this long into the scene. */
export const HANDOVER = 5.0;

/**
 * Seconds into each recording (after its story's start mark) where the
 * footage begins, read off the current recordings (the mark lands about a
 * second after the story really starts): the iPad is on the table just
 * before "List and details"; the Duo shows Northwind AG just before the first
 * tap. Re-check these after re-recording.
 */
export const RECORDINGS = {
  ipad: { skip: 0.9 },
  duo: { skip: 1.3 },
};

/**
 * Where (px) and when (s) each device's screen is still on stage; mirrors
 * the frames and times in keynote.mjs ("Big screens").
 */
export function screenWindows(scale = 1) {
  const big = chapter("bigScreens");
  const handover = big.start + HANDOVER;
  const box = (x, y, width, height, radius) => ({
    x: x * scale,
    y: y * scale,
    width: width * scale,
    height: height * scale,
    radius: radius * scale,
  });
  return {
    // iPad: 560 px frame at (1100, 140), 16 px bezel, still 1.4 s in.
    ipad: {
      ...box(1100 + 16, 140 + 16, 528, 704, 26),
      from: big.start + 1.4,
      to: handover,
    },
    // Duo: 860 px frame at (960, 300), 12 px bezel, still 1.2 s after it
    // comes in.
    duo: {
      ...box(960 + 12, 300 + 12, 836, 614, 40),
      from: handover + 1.2,
      to: big.end - 0.7,
    },
  };
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

/** A rounded-corner alpha mask the size of the screen. */
const roundedMask = (w, label) =>
  `color=c=white:s=${w.width}x${w.height},format=gray,geq=lum='255*lte(hypot(max(0\\,max(${w.radius}-X\\,X-(W-1-${w.radius})))\\,max(0\\,max(${w.radius}-Y\\,Y-(H-1-${w.radius})))),${w.radius})'[${label}]`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const REPO = path.resolve(import.meta.dirname, "../../..");
  const OUT = path.join(REPO, "marketing/app-preview/out");
  const scale = Number(arg("scale", 1));
  const input = arg(
    "in",
    path.join(
      REPO,
      "marketing/showreel/out/vaulted-money-showreel-keynote.mp4",
    ),
  );
  const windows = screenWindows(scale);
  const present = Object.keys(RECORDINGS).filter((name) =>
    existsSync(path.join(OUT, `${name}.mp4`)),
  );
  if (!present.length)
    throw new Error("No recordings: see marketing/app-preview/README.md");

  const inputs = ["-i", input];
  const filters = [];
  let last = "0:v";
  present.forEach((name, i) => {
    const { start } = JSON.parse(
      readFileSync(path.join(OUT, `${name}.marks.json`), "utf8"),
    );
    inputs.push(
      "-ss",
      String(start + RECORDINGS[name].skip),
      "-i",
      path.join(OUT, `${name}.mp4`),
    );
    const w = windows[name];
    const n = i + 1;
    filters.push(
      `[${n}:v]tpad=stop_mode=clone:stop_duration=10,setpts=PTS-STARTPTS+${w.from}/TB,scale=${w.width}:${w.height},format=rgba[f${n}]`,
      roundedMask(w, `m${n}`),
      `[f${n}][m${n}]alphamerge[s${n}]`,
      `[${last}][s${n}]overlay=${w.x}:${w.y}:eof_action=pass:enable='between(t,${w.from},${w.to})'[v${n}]`,
    );
    last = `v${n}`;
  });

  const out = input.replace(/\.mp4$/, "-duo.mp4");
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    ...inputs,
    "-filter_complex",
    filters.join(";"),
    "-map",
    `[${last}]`,
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
  console.log(`✓ ${path.relative(REPO, out)} (${present.join(", ")})`);
}

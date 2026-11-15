#!/usr/bin/env node
/**
 * Makes the finished showreels in 4K and copies their light copies to
 * marketing/showreel/final/ (committed, so they can be shared from the repo).
 *
 *   pnpm marketing:screenshots     (the keynote is built from these captures)
 *   node marketing/showreel/finals.mjs
 *
 * 1. Captures the social cut's screens from the app.
 * 2. Renders the keynote cut (store ending, then website ending) and puts the
 *    iPad and iPhone Duo recordings on it (duo/overlay.mjs).
 * 3. Renders the social cut.
 * 4. Writes light copies and copies them to final/.
 *
 * Takes a long while: every frame is rendered in 4K with motion blur.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { encodeWebCopy } from "./render.mjs";

const HERE = import.meta.dirname;
const OUT = path.join(HERE, "out");
const FINAL = path.join(HERE, "final");
/** GitHub refuses files over 100 MB. */
const MAX_BYTES = 95 * 1024 * 1024;

const node = (...args) =>
  execFileSync(process.execPath, args, { stdio: "inherit" });
const out = (name) => path.join(OUT, name);

node(path.join(HERE, "capture.mjs"));

for (const web of [false, true]) {
  node(
    path.join(HERE, "render.mjs"),
    "--cut",
    "keynote",
    "--scale",
    "2",
    ...(web ? ["--web"] : []),
  );
  const master = out(`vaulted-money-showreel-keynote${web ? "-site" : ""}.mp4`);
  node(path.join(HERE, "duo/overlay.mjs"), "--scale", "2", "--in", master);
  await encodeWebCopy(master.replace(/\.mp4$/, "-duo.mp4"));
}

node(path.join(HERE, "render.mjs"), "--cut", "social", "--scale", "2");

mkdirSync(FINAL, { recursive: true });
const finals = [
  ["vaulted-money-showreel-keynote-duo-web.mp4", "vaulted-money-keynote.mp4"],
  [
    "vaulted-money-showreel-keynote-site-duo-web.mp4",
    "vaulted-money-keynote-website.mp4",
  ],
  ["vaulted-money-showreel-web.mp4", "vaulted-money-showreel-social.mp4"],
];
for (const [from, to] of finals) {
  const size = statSync(out(from)).size;
  if (size > MAX_BYTES)
    throw new Error(
      `${from} is ${(size / 1048576).toFixed(0)} MB, too big to commit`,
    );
  copyFileSync(out(from), path.join(FINAL, to));
  console.log(`✓ final/${to} (${(size / 1048576).toFixed(0)} MB)`);
}

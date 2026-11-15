#!/usr/bin/env node
/**
 * Records the App Store preview from the real iOS app in the simulator.
 *
 * Builds the app with VITE_PREVIEW_AUTOPLAY=1 (it then plays the preview
 * story by itself, see src/marketing/previewAutoplay.ts), installs it on a
 * simulator with a 9:41 / 5G / full-battery status bar, and records the
 * screen. The story reports its start and end to a small local listener;
 * those times are saved to out/<name>.marks.json so compose.mjs can trim to
 * just the story.
 *
 * The normal app build is always restored afterwards, so a preview build is
 * never left in ios/ for an App Store archive.
 *
 *   node marketing/app-preview/record.mjs [--device "iPhone 18 Pro Max"] [--name raw] [--seconds 75]
 */
import { execFileSync, spawn } from "node:child_process";
import http from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { requireTools } from "../shared/tools.mjs";

const REPO = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(import.meta.dirname, "out");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: REPO, stdio: "inherit", ...opts });

/** UDID of the first available simulator with this exact name. */
function findDevice(name) {
  const { devices } = JSON.parse(
    execFileSync("xcrun", ["simctl", "list", "devices", "available", "-j"], {
      encoding: "utf8",
    }),
  );
  // Prefer the newest runtime.
  const runtimes = Object.keys(devices).sort().reverse();
  for (const runtime of runtimes) {
    const found = devices[runtime].find((d) => d.name === name);
    if (found) return found.udid;
  }
  throw new Error(`No simulator named "${name}" (xcrun simctl list devices)`);
}

function buildApp({ preview, markUrl = "", story = "" }) {
  run("pnpm", ["build:app"], {
    env: {
      ...process.env,
      VITE_PREVIEW_AUTOPLAY: preview ? "1" : "",
      VITE_PREVIEW_MARK_URL: preview ? markUrl : "",
      VITE_PREVIEW_STORY: preview ? story : "",
    },
    stdio: "ignore",
  });
  run("npx", ["cap", "sync", "ios"], { stdio: "ignore" });
}

/**
 * Builds the preview app, records `seconds` of it on `device`, and returns
 * { video, marks } where marks are seconds from the start of the video.
 */
export async function recordSimulator({
  device,
  seconds,
  name,
  story = "",
  display = "",
}) {
  requireTools(["xcrun", "ffmpeg"]);
  mkdirSync(OUT, { recursive: true });
  const video = path.join(OUT, `${name}.mp4`);
  const derived = path.join(OUT, "DerivedData");
  // The story POSTs /start and /done here (the simulator shares the Mac's
  // network); the times become the trim points.
  const marks = {};
  let started = Date.now();
  const markServer = http.createServer((req, res) => {
    const at = (Date.now() - started) / 1000;
    if (req.url === "/start" && marks.start === undefined) marks.start = at;
    if (req.url === "/done" && marks.end === undefined) marks.end = at;
    res.writeHead(204, { "Access-Control-Allow-Origin": "*" }).end();
  });
  await new Promise((r) => markServer.listen(0, "127.0.0.1", r));
  const markUrl = `http://127.0.0.1:${markServer.address().port}`;
  try {
    console.log("Building the preview app…");
    buildApp({ preview: true, markUrl, story });
    run(
      "xcodebuild",
      [
        "-project",
        "ios/App/App.xcodeproj",
        "-scheme",
        "App",
        "-configuration",
        "Debug",
        "-sdk",
        "iphonesimulator",
        "-derivedDataPath",
        derived,
        "CODE_SIGNING_ALLOWED=NO",
        "build",
      ],
      { stdio: "ignore" },
    );
    const app = path.join(
      derived,
      "Build/Products/Debug-iphonesimulator/App.app",
    );

    const udid = findDevice(device);
    console.log(`Recording on ${device}…`);
    try {
      run("xcrun", ["simctl", "boot", udid], { stdio: "ignore" });
    } catch {
      // Already booted.
    }
    run("xcrun", ["simctl", "bootstatus", udid, "-b"], { stdio: "ignore" });
    run("xcrun", [
      "simctl",
      "status_bar",
      udid,
      "override",
      "--time",
      "9:41",
      "--dataNetwork",
      "5g",
      "--cellularMode",
      "active",
      "--cellularBars",
      "4",
      "--batteryState",
      "charged",
      "--batteryLevel",
      "100",
    ]);
    run("xcrun", ["simctl", "uninstall", udid, "com.vaultedmoney.app"], {
      stdio: "ignore",
    });
    run("xcrun", ["simctl", "install", udid, app]);

    const recorder = spawn("xcrun", [
      "simctl",
      "io",
      udid,
      "recordVideo",
      // Two-screen devices (iPhone Duo) need the screen named: 3 is the inner one.
      ...(display ? [`--display=${display}`] : []),
      "--codec",
      "h264",
      "--force",
      video,
    ]);
    // The video's clock starts when simctl says so, a few seconds after spawn;
    // marks are measured from then so they line up with the file.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Simulator recording did not start")),
        30_000,
      );
      const onData = (chunk) => {
        if (!/Recording started/i.test(chunk.toString())) return;
        started = Date.now();
        clearTimeout(timer);
        resolve();
      };
      recorder.stdout.on("data", onData);
      recorder.stderr.on("data", onData);
    });
    await new Promise((r) => setTimeout(r, 1000));
    run("xcrun", ["simctl", "launch", udid, "com.vaultedmoney.app"], {
      stdio: "ignore",
    });

    const deadline = started + seconds * 1000;
    while (marks.end === undefined && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, 250));
    await new Promise((r) => setTimeout(r, 800));
    recorder.kill("SIGINT");
    await new Promise((r) => recorder.on("close", r));
    run("xcrun", ["simctl", "status_bar", udid, "clear"], { stdio: "ignore" });

    if (marks.start === undefined || marks.end === undefined)
      throw new Error(
        `The preview story did not finish within ${seconds} s (marks: ${JSON.stringify(marks)})`,
      );
    writeFileSync(path.join(OUT, `${name}.marks.json`), JSON.stringify(marks));
    console.log(
      `✓ ${path.relative(REPO, video)} (story ${marks.start.toFixed(1)}–${marks.end.toFixed(1)} s)`,
    );
    return { video, marks };
  } finally {
    markServer.close();
    console.log("Restoring the normal app build…");
    buildApp({ preview: false });
    execFileSync(
      "git",
      [
        "checkout",
        "--",
        "ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved",
      ],
      { cwd: REPO, stdio: "ignore" },
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await recordSimulator({
    device: arg("device", "iPhone 18 Pro Max"),
    seconds: Number(arg("seconds", 75)),
    name: arg("name", "raw"),
    story: arg("story", ""),
    display: arg("display", ""),
  });
}

/**
 * Checks the command-line tools a marketing script needs before it starts,
 * so a missing one stops the run with a one-line fix instead of a stack trace.
 */
import { execFileSync } from "node:child_process";

const HOW_TO_INSTALL = {
  ffmpeg: "ffmpeg not found: brew install ffmpeg",
  ffprobe: "ffprobe not found: brew install ffmpeg",
  xcrun:
    "xcrun not found: install Xcode from the App Store, then run xcode-select --install",
};

/** True when `cmd` is on the PATH. */
export const onPath = (cmd) => {
  try {
    execFileSync("/usr/bin/which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

/** One message per missing tool (empty when all are present). */
export function checkTools(needs, which = onPath) {
  return needs
    .filter((cmd) => !which(cmd))
    .map((cmd) => HOW_TO_INSTALL[cmd] ?? `${cmd} not found`);
}

/** Stops the process with the messages when any tool is missing. */
export function requireTools(needs) {
  const missing = checkTools(needs);
  if (missing.length) {
    console.error(missing.join("\n"));
    process.exit(1);
  }
}

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The App Store preview's autoplay (src/marketing/previewAutoplay.ts) drives
 * the app by itself; it must only exist in a build made with
 * VITE_PREVIEW_AUTOPLAY=1. This reads the last normal build in dist/ and
 * fails if any file contains the autoplay's finish marker. Skipped when
 * there is no build (CI builds after testing).
 */
const DIST = path.resolve(__dirname, "../../dist");

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });

describe.skipIf(!existsSync(DIST))("preview autoplay in shipped builds", () => {
  it("is not in the normal build", () => {
    const offenders = files(DIST)
      .filter((f) => /\.(js|html)$/.test(f))
      .filter((f) => readFileSync(f, "utf8").includes("preview:done"));
    expect(offenders).toEqual([]);
  });
});

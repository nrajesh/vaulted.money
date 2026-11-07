import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readVersion = (file: string): string =>
  JSON.parse(readFileSync(file, "utf8")).version;

// The Claude Code plugin only updates for users when its version goes up, so
// a release that forgets to bump it would silently skip them.
describe("release versions stay in step", () => {
  const appVersion = readVersion("package.json");

  it("matches the Claude Code plugin version", () => {
    expect(
      readVersion("plugins/vaulted-money/.claude-plugin/plugin.json"),
    ).toBe(appVersion);
  });

  it("matches the Claude Desktop extension version", () => {
    expect(readVersion("mcpb/manifest.json")).toBe(appVersion);
  });

  it("matches the Android and iOS versions", () => {
    const gradle = readFileSync("android/app/build.gradle", "utf8");
    expect(gradle).toContain(`versionName "${appVersion}"`);
    const xcode = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");
    const marketing = [...xcode.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map(
      (m) => m[1],
    );
    expect(marketing.length).toBeGreaterThan(0);
    expect(new Set(marketing)).toEqual(new Set([appVersion]));
  });
});

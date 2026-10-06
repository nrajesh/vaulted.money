import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * Electron sandboxes preload scripts: they may only require "electron" (plus a
 * few polyfilled modules, not Node's `path`/`fs`). A single disallowed import
 * makes the whole preload fail to load, leaving `window.electron` undefined, so
 * the app silently behaves like the web build.
 */
describe("electron preload", () => {
  const source = readFileSync(
    join(process.cwd(), "electron/preload.ts"),
    "utf-8",
  );

  it("imports nothing but electron", () => {
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(
      (m) => m[1],
    );
    expect(imports).toEqual(["electron"]);
    expect(source).not.toMatch(/require\(/);
  });

  it("exposes the API bridge", () => {
    for (const name of [
      "onApiRequest",
      "sendApiResponse",
      "getApiConfig",
      "setApiConfig",
      "regenerateApiToken",
      "joinPath",
    ]) {
      expect(source).toContain(name);
    }
  });
});

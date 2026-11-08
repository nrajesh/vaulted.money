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
      "getConnectInfo",
      "detectClaude",
      "setupClaudeCodePlugin",
      "detectCodex",
      "setupCodex",
    ]) {
      expect(source).toContain(name);
    }
  });

  it("asks main for the MCP server path without passing arguments", () => {
    expect(source).toMatch(
      /getConnectInfo:\s*\(\)\s*=>\s*ipcRenderer\.invoke\("api:get-connect-info"\)/,
    );
  });

  it("asks main to find Claude and set up the plugin without arguments", () => {
    expect(source).toMatch(
      /detectClaude:\s*\(\)\s*=>\s*ipcRenderer\.invoke\("claude:detect"\)/,
    );
    expect(source).toMatch(
      /setupClaudeCodePlugin:\s*\(\)\s*=>\s*ipcRenderer\.invoke\("claude:setup-code-plugin"\)/,
    );
  });

  it("asks main to find Codex and set it up without arguments", () => {
    expect(source).toMatch(
      /detectCodex:\s*\(\)\s*=>\s*ipcRenderer\.invoke\("codex:detect"\)/,
    );
    expect(source).toMatch(
      /setupCodex:\s*\(\)\s*=>\s*ipcRenderer\.invoke\("codex:setup"\)/,
    );
  });
});

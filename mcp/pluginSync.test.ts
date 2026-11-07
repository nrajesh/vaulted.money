import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The plugin must be self-contained when Claude copies it, so it carries its own
// copy of the MCP server. This keeps that copy identical to mcp/server.mjs.
describe("Claude plugin", () => {
  it("ships the same server as mcp/server.mjs", () => {
    const source = readFileSync(resolve(__dirname, "server.mjs"), "utf8");
    const bundled = readFileSync(
      resolve(__dirname, "../plugins/vaulted-money/server.mjs"),
      "utf8",
    );
    expect(bundled).toBe(source);
  });
});

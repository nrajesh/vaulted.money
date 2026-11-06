import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain ESM module without types
import { stageMcpb } from "./build-mcpb.mjs";
// @ts-expect-error plain ESM module without types
import { createServer } from "../mcp/server.mjs";

/** The Claude Desktop bundle: what gets staged and what the manifest promises. */
describe("stageMcpb", () => {
  let dir = "";
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const stage = () => {
    dir = mkdtempSync(join(tmpdir(), "mcpb-"));
    stageMcpb(dir);
    return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  };

  it("stages the manifest and a byte-identical copy of the server", () => {
    stage();
    expect(readFileSync(join(dir, "server/index.mjs"), "utf8")).toBe(
      readFileSync("mcp/server.mjs", "utf8"),
    );
    expect(readFileSync(join(dir, "manifest.json"), "utf8")).toBe(
      readFileSync("mcpb/manifest.json", "utf8"),
    );
  });

  it("points the entry point and launch args at the staged server", () => {
    const manifest = stage();
    expect(existsSync(join(dir, manifest.server.entry_point))).toBe(true);
    expect(manifest.server.mcp_config.args).toEqual([
      "${__dirname}/" + manifest.server.entry_point,
    ]);
    expect(manifest.server.entry_point.endsWith(".mjs")).toBe(true);
    expect(manifest.user_config).toBeUndefined();
  });

  it("lists exactly the tools the server exposes", () => {
    const manifest = stage();
    const served = createServer({
      baseUrl: "http://127.0.0.1:1",
      token: "x",
    }).tools.map((t: { name: string }) => t.name);
    expect(manifest.tools.map((t: { name: string }) => t.name).sort()).toEqual(
      [...served].sort(),
    );
    for (const tool of manifest.tools)
      expect(tool.description.length).toBeGreaterThan(0);
  });
});

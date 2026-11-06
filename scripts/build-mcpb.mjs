/**
 * Builds the one-click Claude Desktop bundle (release/vaulted-money.mcpb).
 *
 * The bundle is the MCP server plus a manifest, staged in a temp folder and
 * zipped by the official `mcpb` CLI (run through npx, so it is not a project
 * dependency). The server is not duplicated in git: it is copied from
 * mcp/server.mjs at build time. It is named index.mjs so Node treats it as ESM.
 */
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Copy the manifest and the server into outDir in the layout the bundle needs. */
export function stageMcpb(outDir) {
  mkdirSync(join(outDir, "server"), { recursive: true });
  copyFileSync(join(root, "mcpb/manifest.json"), join(outDir, "manifest.json"));
  copyFileSync(join(root, "mcp/server.mjs"), join(outDir, "server/index.mjs"));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const stage = mkdtempSync(join(tmpdir(), "vaulted-mcpb-"));
  try {
    stageMcpb(stage);
    mkdirSync(join(root, "release"), { recursive: true });
    const output = join(root, "release/vaulted-money.mcpb");
    const run = spawnSync(
      "npx",
      ["--yes", "@anthropic-ai/mcpb", "pack", stage, output],
      { stdio: "inherit" },
    );
    process.exitCode = run.status ?? 1;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

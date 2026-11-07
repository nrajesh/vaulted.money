/**
 * Builds the one-click Claude Desktop bundle (release/vaulted-money.mcpb).
 *
 * The bundle is the MCP server plus a manifest, staged in a temp folder and
 * zipped by the official `mcpb` CLI (run through npx, pinned to version 2.1.2 for repeatable builds, so it is not a project
 * dependency). The server is not duplicated in git: it is copied from
 * mcp/server.mjs at build time. It is named index.mjs so Node treats it as ESM.
 */
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Copy the manifest, the server and the icon into outDir in the layout the bundle needs. */
export function stageMcpb(outDir) {
  mkdirSync(join(outDir, "server"), { recursive: true });
  copyFileSync(join(root, "mcpb/manifest.json"), join(outDir, "manifest.json"));
  copyFileSync(join(root, "mcp/server.mjs"), join(outDir, "server/index.mjs"));
  // The bundle icon is a source asset: the app logo cropped tight to its
  // bounding box (public/icon-512.png has too much padding for Claude Desktop).
  copyFileSync(join(root, "mcpb/icon.png"), join(outDir, "icon.png"));
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
      ["--yes", "@anthropic-ai/mcpb@2.1.2", "pack", stage, output],
      { stdio: "inherit" },
    );
    process.exitCode = run.status ?? 1;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

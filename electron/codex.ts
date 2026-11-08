import fs from "node:fs";
import path from "node:path";
import { findOnPath, toolEnvironment, type ClaudeCodeDeps } from "./claudeCode";

/**
 * Finds Codex on this computer and registers the Vaulted Money MCP server with
 * it, so a regular user never has to edit a config file.
 *
 * SECURITY: same rules as claudeCode.ts. Nothing here takes input from the
 * renderer. The program is found by this module, the arguments are fixed
 * constants plus two paths this module computes, no shell is involved, and raw
 * command output is never returned (only a short result code).
 */

export type CodexSetupResult =
  "ready" | "failed" | "not-found" | "node-missing";

export interface CodexDetection {
  /** The Codex command line tool was found. */
  cli: boolean;
}

export interface CodexServerPaths {
  /** The bundled server inside the app. */
  source: string;
  /** A stable copy that Codex launches, so app updates never break the path. */
  target: string;
}

const SERVER_NAME = "vaulted-money";

/** Where installers put the `codex` tool, besides the folders on PATH. */
const extraToolFolders = (deps: ClaudeCodeDeps): string[] => {
  const { home, platform, env } = deps;
  if (platform === "win32") {
    return [path.join(home, "AppData", "Roaming", "npm")];
  }
  return [
    path.join(home, ".local", "bin"),
    path.join(home, ".npm-global", "bin"),
    path.join(home, ".bun", "bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin",
    env.NVM_BIN ?? "",
  ].filter(Boolean);
};

/**
 * The ChatGPT desktop app has Codex built in and ships its own `codex` tool, so
 * a user with only the app has no separate install on PATH.
 */
const bundledCodexFolders = (deps: ClaudeCodeDeps): string[] =>
  deps.platform === "darwin"
    ? [
        "/Applications/ChatGPT.app/Contents/Resources",
        path.join(
          deps.home,
          "Applications",
          "ChatGPT.app",
          "Contents",
          "Resources",
        ),
      ]
    : [];

/** Returns the full path of the `codex` tool, or null. */
export const findCodex = (deps: ClaudeCodeDeps): string | null =>
  findOnPath(deps, deps.platform === "win32" ? "codex.exe" : "codex", [
    ...extraToolFolders(deps),
    ...bundledCodexFolders(deps),
  ]);

export const detectCodex = (deps: ClaudeCodeDeps): CodexDetection => ({
  cli: findCodex(deps) !== null,
});

/**
 * Registers the server with Codex using `codex mcp add`, then checks that
 * Codex lists it. A server that Codex already has is replaced, so running this
 * again after an app update fixes a stale path.
 */
export const setupCodex = async (
  deps: ClaudeCodeDeps,
  paths: CodexServerPaths,
  copyServer: (paths: CodexServerPaths) => boolean,
): Promise<CodexSetupResult> => {
  const tool = findCodex(deps);
  if (!tool) return "not-found";

  // The server needs Node.js 18+. Use its full path so Codex can start it even
  // when it was launched without the usual PATH.
  const node = findOnPath(
    deps,
    deps.platform === "win32" ? "node.exe" : "node",
    extraToolFolders(deps),
  );
  if (!node) return "node-missing";

  if (!copyServer(paths)) return "failed";

  const env = toolEnvironment(deps, tool, extraToolFolders(deps));
  const run = (args: string[]) => deps.run(tool, args, env);

  // Best effort: the command may not know this name yet.
  await run(["mcp", "remove", SERVER_NAME]);
  const added = await run([
    "mcp",
    "add",
    SERVER_NAME,
    "--",
    node,
    paths.target,
  ]);
  if (!added.ok) return "failed";

  const listing = await run(["mcp", "list"]);
  return listing.ok && listing.stdout.includes(SERVER_NAME)
    ? "ready"
    : "failed";
};

/** Copies the bundled server to its stable place. Returns false on any error. */
export const copyServerFile = (paths: CodexServerPaths): boolean => {
  try {
    fs.mkdirSync(path.dirname(paths.target), { recursive: true });
    fs.copyFileSync(paths.source, paths.target);
    return true;
  } catch {
    return false;
  }
};

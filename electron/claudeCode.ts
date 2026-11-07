import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Finds Claude on this computer and sets up the Vaulted Money plugin for
 * Claude Code, so a regular user never has to type commands.
 *
 * SECURITY: nothing here takes input from the renderer. The program is found
 * by this module, the arguments are fixed constants, no shell is involved, and
 * raw command output is never returned (only a short result code).
 */

export interface ClaudeDetection {
  /** The Claude Code command line tool was found. */
  code: boolean;
  /** The Claude desktop app was found. */
  desktop: boolean;
}

export type ClaudeSetupResult = "ready" | "failed" | "not-found";

export interface RunResult {
  ok: boolean;
  stdout: string;
}

export interface ClaudeCodeDeps {
  platform: NodeJS.Platform;
  env: NodeJS.ProcessEnv;
  home: string;
  /** True when the path exists (a file or a folder). */
  exists: (target: string) => boolean;
  /** True when the path is a file the user can run. */
  isRunnable: (target: string) => boolean;
  run: (
    file: string,
    args: string[],
    env: NodeJS.ProcessEnv,
  ) => Promise<RunResult>;
}

const MARKETPLACE_NAME = "vaulted-money";
const MARKETPLACE_SOURCE = "nrajesh/vaulted.money";
const PLUGIN_ID = "vaulted-money@vaulted-money";
const COMMAND_TIMEOUT_MS = 120_000;

/** Where installers put the `claude` tool, besides the folders on PATH. */
const commonToolFolders = (deps: ClaudeCodeDeps): string[] => {
  const { home, platform, env } = deps;
  if (platform === "win32") {
    return [path.join(home, ".local", "bin")];
  }
  return [
    path.join(home, ".local", "bin"),
    path.join(home, ".claude", "local"),
    path.join(home, ".npm-global", "bin"),
    path.join(home, ".bun", "bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin",
    env.NVM_BIN ?? "",
  ].filter(Boolean);
};

/**
 * Returns the full path of a command line tool, looking on PATH first and then
 * in the usual install folders, or null.
 */
export const findOnPath = (
  deps: ClaudeCodeDeps,
  fileName: string,
  extraFolders: string[],
): string | null => {
  const separator = deps.platform === "win32" ? ";" : ":";
  const fromPath = (deps.env.PATH ?? "").split(separator).filter(Boolean);
  for (const folder of [...fromPath, ...extraFolders]) {
    const candidate = path.join(folder, fileName);
    if (deps.isRunnable(candidate)) return candidate;
  }
  return null;
};

/**
 * Returns the full path of the `claude` tool, or null. Windows is limited to
 * the native `claude.exe` because `.cmd` wrappers need a shell, which this
 * module deliberately never uses.
 */
export const findClaudeCode = (deps: ClaudeCodeDeps): string | null =>
  findOnPath(
    deps,
    deps.platform === "win32" ? "claude.exe" : "claude",
    commonToolFolders(deps),
  );

/**
 * The environment for running a tool. A tool installed with npm starts `node`
 * from PATH, which a desktop app often does not have, so add the usual folders.
 */
export const toolEnvironment = (
  deps: ClaudeCodeDeps,
  tool: string,
  extraFolders: string[],
): NodeJS.ProcessEnv => {
  const separator = deps.platform === "win32" ? ";" : ":";
  return {
    ...deps.env,
    PATH: [
      ...(deps.env.PATH ?? "").split(separator),
      path.dirname(tool),
      ...extraFolders,
    ]
      .filter(Boolean)
      .join(separator),
  };
};

/** True when the Claude desktop app looks installed. */
export const findClaudeDesktop = (deps: ClaudeCodeDeps): boolean => {
  const { platform, home, env } = deps;
  if (platform === "darwin") {
    return (
      deps.exists("/Applications/Claude.app") ||
      deps.exists(path.join(home, "Applications", "Claude.app"))
    );
  }
  if (platform === "win32") {
    const local = env.LOCALAPPDATA ?? path.join(home, "AppData", "Local");
    return (
      deps.exists(path.join(local, "AnthropicClaude")) ||
      deps.exists(path.join(local, "Programs", "Claude"))
    );
  }
  return false;
};

export const detectClaude = (deps: ClaudeCodeDeps): ClaudeDetection => ({
  code: findClaudeCode(deps) !== null,
  desktop: findClaudeDesktop(deps),
});

/**
 * Adds the Vaulted Money marketplace and installs (or updates) the plugin.
 *
 * A marketplace with our name but a different source (for example a local
 * folder from testing) blocks adding the GitHub one, so only that one entry is
 * removed first. Our own entries are never touched when the source matches.
 */
export const setupClaudeCodePlugin = async (
  deps: ClaudeCodeDeps,
): Promise<ClaudeSetupResult> => {
  const tool = findClaudeCode(deps);
  if (!tool) return "not-found";

  const env = toolEnvironment(deps, tool, commonToolFolders(deps));
  const run = (args: string[]) => deps.run(tool, args, env);

  const listing = await run(["plugin", "marketplace", "list"]);
  const alreadyOurs = new RegExp(
    `${MARKETPLACE_NAME}\\s*\\n\\s*Source:\\s*GitHub \\(${MARKETPLACE_SOURCE.replace(/[.]/g, "\\.")}\\)`,
  ).test(listing.stdout);

  if (alreadyOurs) {
    await run(["plugin", "marketplace", "update", MARKETPLACE_NAME]);
  } else {
    await run(["plugin", "marketplace", "remove", MARKETPLACE_NAME]);
    const added = await run([
      "plugin",
      "marketplace",
      "add",
      MARKETPLACE_SOURCE,
    ]);
    if (!added.ok) return "failed";
  }

  // Installing a plugin that is already installed succeeds without updating
  // it, so always follow with an update. Either one working is enough.
  const installed = await run(["plugin", "install", PLUGIN_ID]);
  const updated = await run(["plugin", "update", PLUGIN_ID]);
  return installed.ok || updated.ok ? "ready" : "failed";
};

/** The real dependencies used by the app. */
export const realClaudeCodeDeps = (): ClaudeCodeDeps => ({
  platform: process.platform,
  env: process.env,
  home: os.homedir(),
  exists: (target) => fs.existsSync(target),
  isRunnable: (target) => {
    try {
      if (!fs.statSync(target).isFile()) return false;
      fs.accessSync(target, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  },
  run: (file, args, env) =>
    new Promise((resolve) => {
      execFile(
        file,
        args,
        {
          timeout: COMMAND_TIMEOUT_MS,
          windowsHide: true,
          cwd: os.homedir(),
          env,
          maxBuffer: 1024 * 1024,
        },
        (error, stdout) => resolve({ ok: !error, stdout: String(stdout) }),
      );
    }),
});

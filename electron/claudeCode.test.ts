import { describe, expect, it, vi } from "vitest";
import {
  detectClaude,
  findClaudeCode,
  setupClaudeCodePlugin,
  type ClaudeCodeDeps,
  type RunResult,
} from "./claudeCode";

const makeDeps = (over: Partial<ClaudeCodeDeps> = {}): ClaudeCodeDeps => ({
  platform: "darwin",
  env: { PATH: "/usr/bin:/bin" },
  home: "/Users/test",
  exists: () => false,
  isRunnable: () => false,
  run: vi.fn(async () => ({ ok: true, stdout: "" })),
  ...over,
});

const OURS =
  "Configured marketplaces:\n\n  ❯ vaulted-money\n    Source: GitHub (nrajesh/vaulted.money)\n";
const LOCAL =
  "Configured marketplaces:\n\n  ❯ vaulted-money\n    Source: Folder (/Users/test/vaulted.money)\n";

/** A fake tool that answers each subcommand from a table. */
const fakeTool = (answers: Record<string, RunResult>, calls: string[][] = []) =>
  vi.fn(async (_file: string, args: string[]) => {
    calls.push(args);
    return answers[args.join(" ")] ?? { ok: true, stdout: "" };
  });

describe("findClaudeCode", () => {
  it("finds the tool on PATH", () => {
    const deps = makeDeps({
      env: { PATH: "/opt/tools:/usr/bin" },
      isRunnable: (p) => p === "/opt/tools/claude",
    });
    expect(findClaudeCode(deps)).toBe("/opt/tools/claude");
  });

  it("finds the tool in a usual install folder when PATH is short", () => {
    const deps = makeDeps({
      isRunnable: (p) => p === "/Users/test/.local/bin/claude",
    });
    expect(findClaudeCode(deps)).toBe("/Users/test/.local/bin/claude");
  });

  it("returns null when it is not installed", () => {
    expect(findClaudeCode(makeDeps())).toBeNull();
  });

  it("looks for claude.exe on Windows", () => {
    const seen: string[] = [];
    const deps = makeDeps({
      platform: "win32",
      env: { PATH: "C:\\tools" },
      home: "C:\\Users\\test",
      isRunnable: (p) => {
        seen.push(p);
        return false;
      },
    });
    expect(findClaudeCode(deps)).toBeNull();
    expect(seen.every((p) => p.endsWith("claude.exe"))).toBe(true);
  });
});

describe("detectClaude", () => {
  it("reports the desktop app and the tool separately", () => {
    const deps = makeDeps({
      exists: (p) => p === "/Applications/Claude.app",
    });
    expect(detectClaude(deps)).toEqual({ code: false, desktop: true });
  });

  it("reports no desktop app on Linux", () => {
    expect(detectClaude(makeDeps({ platform: "linux" })).desktop).toBe(false);
  });
});

describe("setupClaudeCodePlugin", () => {
  const withTool = (run: ClaudeCodeDeps["run"]) =>
    makeDeps({ isRunnable: (p) => p === "/usr/bin/claude", run });

  it("says not-found and runs nothing when the tool is missing", async () => {
    const run = vi.fn();
    expect(await setupClaudeCodePlugin(makeDeps({ run }))).toBe("not-found");
    expect(run).not.toHaveBeenCalled();
  });

  it("adds the marketplace and installs on a fresh machine", async () => {
    const calls: string[][] = [];
    const run = fakeTool(
      { "plugin marketplace list": { ok: true, stdout: "No marketplaces" } },
      calls,
    );
    expect(await setupClaudeCodePlugin(withTool(run))).toBe("ready");
    expect(calls).toEqual([
      ["plugin", "marketplace", "list"],
      ["plugin", "marketplace", "remove", "vaulted-money"],
      ["plugin", "marketplace", "add", "nrajesh/vaulted.money"],
      ["plugin", "install", "vaulted-money@vaulted-money"],
    ]);
  });

  it("replaces a same-named marketplace that points at a local folder", async () => {
    const calls: string[][] = [];
    const run = fakeTool(
      { "plugin marketplace list": { ok: true, stdout: LOCAL } },
      calls,
    );
    expect(await setupClaudeCodePlugin(withTool(run))).toBe("ready");
    expect(calls).toContainEqual([
      "plugin",
      "marketplace",
      "remove",
      "vaulted-money",
    ]);
    expect(calls).toContainEqual([
      "plugin",
      "marketplace",
      "add",
      "nrajesh/vaulted.money",
    ]);
  });

  it("keeps our own marketplace and only refreshes it", async () => {
    const calls: string[][] = [];
    const run = fakeTool(
      { "plugin marketplace list": { ok: true, stdout: OURS } },
      calls,
    );
    expect(await setupClaudeCodePlugin(withTool(run))).toBe("ready");
    expect(calls.some((c) => c.includes("remove"))).toBe(false);
    expect(calls).toContainEqual([
      "plugin",
      "marketplace",
      "update",
      "vaulted-money",
    ]);
  });

  it("updates the plugin when it is already installed", async () => {
    const calls: string[][] = [];
    const run = fakeTool(
      {
        "plugin marketplace list": { ok: true, stdout: OURS },
        "plugin install vaulted-money@vaulted-money": { ok: false, stdout: "" },
      },
      calls,
    );
    expect(await setupClaudeCodePlugin(withTool(run))).toBe("ready");
    expect(calls.at(-1)).toEqual([
      "plugin",
      "update",
      "vaulted-money@vaulted-money",
    ]);
  });

  it("fails when the marketplace cannot be added", async () => {
    const run = fakeTool({
      "plugin marketplace list": { ok: true, stdout: "" },
      "plugin marketplace add nrajesh/vaulted.money": { ok: false, stdout: "" },
    });
    expect(await setupClaudeCodePlugin(withTool(run))).toBe("failed");
  });

  it("fails when neither install nor update works", async () => {
    const run = fakeTool({
      "plugin marketplace list": { ok: true, stdout: OURS },
      "plugin install vaulted-money@vaulted-money": { ok: false, stdout: "" },
      "plugin update vaulted-money@vaulted-money": { ok: false, stdout: "" },
    });
    expect(await setupClaudeCodePlugin(withTool(run))).toBe("failed");
  });

  it("only ever passes fixed arguments and never a shell string", async () => {
    const calls: string[][] = [];
    const run = fakeTool({}, calls);
    await setupClaudeCodePlugin(withTool(run));
    const allowed = new Set([
      "plugin",
      "marketplace",
      "list",
      "remove",
      "add",
      "update",
      "install",
      "vaulted-money",
      "nrajesh/vaulted.money",
      "vaulted-money@vaulted-money",
    ]);
    for (const args of calls)
      for (const arg of args) expect(allowed.has(arg)).toBe(true);
  });
});

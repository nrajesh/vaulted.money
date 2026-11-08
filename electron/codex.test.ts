import { describe, expect, it, vi } from "vitest";
import type { ClaudeCodeDeps, RunResult } from "./claudeCode";
import { detectCodex, findCodex, setupCodex } from "./codex";

const makeDeps = (over: Partial<ClaudeCodeDeps> = {}): ClaudeCodeDeps => ({
  platform: "darwin",
  env: { PATH: "/usr/bin:/bin" },
  home: "/Users/test",
  exists: () => false,
  isRunnable: () => false,
  run: vi.fn(async () => ({ ok: true, stdout: "" })),
  ...over,
});

const paths = {
  source: "/App/mcp/server.mjs",
  target: "/Data/mcp/server.mjs",
};

/** A fake tool that answers each subcommand from a table. */
const fakeTool = (answers: Record<string, RunResult>, calls: string[][] = []) =>
  vi.fn(async (_file: string, args: string[]) => {
    calls.push(args);
    return answers[args.join(" ")] ?? { ok: true, stdout: "" };
  });

const LISTED = { ok: true, stdout: "vaulted-money  enabled" };
const withTools = (run: ClaudeCodeDeps["run"]) =>
  makeDeps({
    isRunnable: (p) => p === "/usr/bin/codex" || p === "/usr/bin/node",
    run,
  });

describe("findCodex", () => {
  it("finds the tool on PATH", () => {
    const deps = makeDeps({
      env: { PATH: "/opt/tools:/usr/bin" },
      isRunnable: (p) => p === "/opt/tools/codex",
    });
    expect(findCodex(deps)).toBe("/opt/tools/codex");
  });

  it("finds the tool in a usual install folder", () => {
    const deps = makeDeps({
      isRunnable: (p) => p === "/opt/homebrew/bin/codex",
    });
    expect(detectCodex(deps)).toEqual({ cli: true });
  });

  it("finds the Codex built into the ChatGPT app", () => {
    const deps = makeDeps({
      isRunnable: (p) =>
        p === "/Applications/ChatGPT.app/Contents/Resources/codex",
    });
    expect(findCodex(deps)).toBe(
      "/Applications/ChatGPT.app/Contents/Resources/codex",
    );
  });

  it("finds the newer Codex location inside the ChatGPT app", () => {
    const newer =
      "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex";
    expect(findCodex(makeDeps({ isRunnable: (p) => p === newer }))).toBe(newer);
  });

  it("reports it missing when it is not installed", () => {
    expect(detectCodex(makeDeps())).toEqual({ cli: false });
  });
});

describe("setupCodex", () => {
  it("says not-found and runs nothing when Codex is missing", async () => {
    const run = vi.fn();
    const copy = vi.fn(() => true);
    expect(await setupCodex(makeDeps({ run }), paths, copy)).toBe("not-found");
    expect(run).not.toHaveBeenCalled();
    expect(copy).not.toHaveBeenCalled();
  });

  it("says node-missing when Node.js is not installed", async () => {
    const deps = makeDeps({ isRunnable: (p) => p === "/usr/bin/codex" });
    expect(await setupCodex(deps, paths, () => true)).toBe("node-missing");
  });

  it("copies the server, registers it and checks the list", async () => {
    const calls: string[][] = [];
    const run = fakeTool({ "mcp list": LISTED }, calls);
    const copy = vi.fn(() => true);
    expect(await setupCodex(withTools(run), paths, copy)).toBe("ready");
    expect(copy).toHaveBeenCalledWith(paths);
    expect(calls).toEqual([
      ["mcp", "remove", "vaulted-money"],
      [
        "mcp",
        "add",
        "vaulted-money",
        "--",
        "/usr/bin/node",
        "/Data/mcp/server.mjs",
      ],
      ["mcp", "list"],
    ]);
  });

  it("still registers when removing the old entry fails", async () => {
    const run = fakeTool({
      "mcp remove vaulted-money": { ok: false, stdout: "" },
      "mcp list": LISTED,
    });
    expect(await setupCodex(withTools(run), paths, () => true)).toBe("ready");
  });

  it("fails when the server cannot be copied", async () => {
    const run = fakeTool({});
    expect(await setupCodex(withTools(run), paths, () => false)).toBe("failed");
    expect(run).not.toHaveBeenCalled();
  });

  it("fails when Codex refuses the registration", async () => {
    const run = fakeTool({
      "mcp add vaulted-money -- /usr/bin/node /Data/mcp/server.mjs": {
        ok: false,
        stdout: "",
      },
    });
    expect(await setupCodex(withTools(run), paths, () => true)).toBe("failed");
  });

  it("fails when Codex does not list the server afterwards", async () => {
    const run = fakeTool({ "mcp list": { ok: true, stdout: "other" } });
    expect(await setupCodex(withTools(run), paths, () => true)).toBe("failed");
  });
});

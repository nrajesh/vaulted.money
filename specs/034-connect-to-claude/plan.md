# Connect to agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A user installs the desktop app, flips one switch in Settings, and can ask Claude (Desktop, Code) or a local model about their money, with no token copy-paste and no config editing.

**Architecture:** The MCP server (`mcp/server.mjs`) learns to read the app's own `api-config.json` (token and port) instead of needing a pasted token. The app ships that server inside its bundle and shows a "Connect to agent" panel inside the existing Local API card. A one-click `.mcpb` bundle (Claude Desktop) and the Claude Code plugin both reuse the same server file.

**Tech Stack:** Node 18 ESM (server, zero dependencies), Electron main/preload IPC, React 19 + shadcn/ui + react-i18next, Vitest, `@anthropic-ai/mcpb` CLI for packing.

**Spec:** This document. Scope was agreed in chat on 2026-11-06 (see "Agreed scope").

## Agreed scope

- Server reads the app's own config file; the manual `~/.vaulted-token` route keeps working.
- "Connect to agent" panel in Settings → Local API: one switch, copyable lines, privacy note, Disconnect.
- Server bundled with the desktop app so users need no repo clone.
- One-click `.mcpb` for Claude Desktop, attached to GitHub Releases (never committed).
- Claude Code plugin (already built under `plugins/vaulted-money/`) ships in the same PR.
- README gets a "Use with an AI agent" section with a GIF.
- Not doing: auto-editing other apps' config files; running the server via `ELECTRON_RUN_AS_NODE`.

## Global Constraints

- Local API stays **off by default**, binds `127.0.0.1` only. The panel never enables it without a user click.
- The token is never shown to the model, never put in copyable snippets, never logged.
- Renderer never supplies file paths to main. Main computes the server path itself. No change to the folder allowlist.
- No API route, schema or response changes, so `src/api/`, Postman and `documentation/API.md` stay untouched. If that changes, follow the "Local API changes" checklist in `documentation/CLAUDE.md`.
- Generated outputs stay out of git: `.mcpb` files go to `release/` (already ignored).
- All UI text through `t("key", { defaultValue })`; buttons have `aria-label`s; no local `TooltipProvider`.
- Privacy wording must say plainly that answers Claude reads are sent to Anthropic; a local model keeps data on the device.
- `mcp/server.mjs` and `plugins/vaulted-money/server.mjs` must stay byte-identical (guarded by `mcp/pluginSync.test.ts`).
- Wording says "money manager", never "money tracker".
- Never push code that fails `pnpm lint`, `pnpm format:check`, `tsc --noEmit`, `pnpm test:coverage`, `pnpm build`, `pnpm audit --prod --audit-level=moderate`.

## Review Focus

- Local API switched off, or app never opened: server returns a plain "turn on Local API in Settings" message, not a stack trace.
- `api-config.json` missing, empty, half-written or not JSON: clear error, no crash.
- User changed the port: server follows the port in the config file.
- Token regenerated while Claude is running: next request uses the new token (re-read per request).
- Windows and Linux config locations, and a home folder with spaces.
- Dev build vs packaged app use different Electron app names, so different config folders.

---

### Task 1: Server reads the app's own config

**Files:**
- Modify: `mcp/server.mjs` (replace `loadToken`; the `baseUrl` default near the bottom)
- Modify: `plugins/vaulted-money/server.mjs` (copy of the above)
- Test: `mcp/server.test.ts`

**Interfaces:**
- Produces: `export function appConfigCandidates(env, platform, home): string[]` (ordered file paths of `api-config.json` for product names `"Vaulted Money"` and the dev name `"vite_react_shadcn_ts"`; macOS `~/Library/Application Support/<name>/`, Windows `%APPDATA%/<name>/`, Linux `$XDG_CONFIG_HOME or ~/.config/<name>/`).
- Produces: `export function loadConnection(env = process.env, platform = process.platform, home = homedir()): { token: string, baseUrl: string }`. Order: `VM_TOKEN`/`VM_BASE_URL` env; token file (`VM_TOKEN_FILE` or `~/.vaulted-token`) with default base URL; then the first readable candidate config (token plus `http://127.0.0.1:<port>/api/v1`). `VM_CONFIG_FILE` overrides the candidate list.
- Produces: `loadToken` kept as a thin wrapper returning `loadConnection(...).token`, so existing tests keep passing.
- Throws plain errors: config found but `enabled` is false → "Vaulted Money's Local API is off. Open the app, go to Settings → Local API and switch it on."; nothing found → "Could not find Vaulted Money. Open the desktop app once, or set VM_TOKEN."

- [ ] **Step 1: Write failing tests** in `mcp/server.test.ts`: `loadConnection` reads token and port from a temp `api-config.json` via `VM_CONFIG_FILE`; follows a changed port; env token beats config; token file beats config; `enabled:false` throws the "Local API is off" message; missing, empty and invalid-JSON files throw the "Could not find" message; `appConfigCandidates` returns the expected macOS, Windows and Linux paths including a home with spaces.
- [ ] **Step 2: Run** `pnpm vitest run mcp/server.test.ts` → new tests FAIL.
- [ ] **Step 3: Implement** `appConfigCandidates`, `loadConnection`, and the wrapper in `mcp/server.mjs`. In the bottom `createServer` call, pass `getToken: () => loadConnection().token` and a `baseUrl` that is resolved per request (change `createServer` to accept `getBaseUrl` as an alternative to `baseUrl`, so a port change needs no restart).
- [ ] **Step 4: Copy** `mcp/server.mjs` to `plugins/vaulted-money/server.mjs`.
- [ ] **Step 5: Run** `pnpm vitest run mcp` → all PASS (including `pluginSync`).
- [ ] **Step 6: Commit** `feat(mcp): read token and port from the app's own config`

### Task 2: Ship the server with the app and expose its path

**Files:**
- Modify: `package.json` (`build.extraResources`: `{ "from": "mcp/server.mjs", "to": "mcp/server.mjs" }`)
- Modify: `electron/main.ts` (new IPC handler), `electron/preload.ts`, `src/utils/electron.ts`
- Test: `electron/preload.test.ts`

**Interfaces:**
- Produces: IPC `api:get-connect-info` → `{ serverPath: string }`. Main builds it: packaged → `path.join(process.resourcesPath, "mcp", "server.mjs")`; dev → `path.join(app.getAppPath(), "mcp", "server.mjs")`. No arguments accepted from the renderer.
- Produces: `ElectronAPI.getConnectInfo(): Promise<{ serverPath: string }>` and its preload exposure.

- [ ] **Step 1: Write failing test** in `electron/preload.test.ts` that the bridge exposes `getConnectInfo` and invokes `api:get-connect-info` with no arguments.
- [ ] **Step 2: Run** `pnpm vitest run electron/preload.test.ts` → FAIL.
- [ ] **Step 3: Implement** the handler, preload entry, type, and `extraResources` entry.
- [ ] **Step 4: Run** the test → PASS; run `pnpm electron:compile`.
- [ ] **Step 5: Commit** `feat(electron): bundle the MCP server and expose its path`

### Task 3: "Connect to agent" panel

**Files:**
- Create: `src/components/settings/ConnectToAgentPanel.tsx`
- Modify: `src/components/settings/ApiAccessCard.tsx` (render the panel, passing `status`, `onEnable`, `onDisconnect`)
- Test: `src/components/settings/ConnectToAgentPanel.test.tsx`

**Interfaces:**
- Consumes: `ApiServerStatus`, `getConnectInfo()`, `setApiConfig`, `regenerateApiToken`.
- Produces: `ConnectToAgentPanel({ status, serverPath, onEnable, onDisconnect })` with no extra state source (status stays owned by `ApiAccessCard`).
- Panel contents: a status badge (Off / Ready), the on switch (calls `onEnable`), three blocks each with a Copy button: **Claude Desktop** (download link to the latest GitHub release `.mcpb` plus "double-click it"), **Claude Code** (`/plugin marketplace add nrajesh/vaulted.money` and `/plugin install vaulted-money@vaulted-money`), **Local model** (an `mcpServers` JSON snippet using `serverPath`, no token). Privacy note with the Global Constraints wording. A "Disconnect everything" button calling `onDisconnect`, with a confirm step.

- [ ] **Step 1: Write failing tests**: renders "Off" and does not show snippets' token when API is off; switching on calls `onEnable`; each Copy button writes the exact expected text to the clipboard and none of the copied strings contain `status.token`; the local-model snippet contains `serverPath`; the privacy note text is present; Disconnect asks for confirmation before calling `onDisconnect`; buttons have accessible names.
- [ ] **Step 2: Run** `pnpm vitest run src/components/settings/ConnectToAgentPanel.test.tsx` → FAIL.
- [ ] **Step 3: Implement** the panel and wire it into `ApiAccessCard` (call `getConnectInfo()` in the existing effect; hide the panel if the bridge lacks it, like the existing outdated-build guard). Follow the card's existing `copy` helper pattern.
- [ ] **Step 4: Run** the panel and `ApiAccessCard` tests → PASS.
- [ ] **Step 5: Commit** `feat(settings): add Connect to agent panel`

### Task 4: One-click Claude Desktop bundle

**Files:**
- Create: `mcpb/manifest.json`, `scripts/build-mcpb.mjs`
- Modify: `package.json` (`"mcpb:pack": "node scripts/build-mcpb.mjs"`)
- Test: `scripts/build-mcpb.test.ts`

**Interfaces:**
- Produces: `mcpb/manifest.json` with `manifest_version`, `name: "vaulted-money"`, `display_name: "Vaulted Money"`, `version`, a plain-English `description` (money manager; privacy note), `author`, `server: { type: "node", entry_point: "server/index.js", mcp_config: { command: "node", args: ["${__dirname}/server/index.js"] } }`, `compatibility.platforms: ["darwin","win32","linux"]`, and `tools` listing the eight tools. No `user_config` (the server finds the app itself).
- Produces: `stageMcpb(outDir: string): void` exported from `scripts/build-mcpb.mjs`; it copies `mcp/server.mjs` to `<outDir>/server/index.js` and `mcpb/manifest.json` to `<outDir>/manifest.json`. The script then runs `npx @anthropic-ai/mcpb pack <outDir> release/vaulted-money.mcpb`. No second copy of the server is committed.

- [ ] **Step 1: Write failing test**: `stageMcpb` into a temp dir produces `manifest.json` and `server/index.js` identical to `mcp/server.mjs`; the manifest's `entry_point` exists in the staged folder; the manifest lists exactly the tool names `createServer(...).tools` exposes.
- [ ] **Step 2: Run** the test → FAIL.
- [ ] **Step 3: Implement** manifest, `stageMcpb` and the pack command.
- [ ] **Step 4: Run** the test → PASS; run `pnpm mcpb:pack` and `npx @anthropic-ai/mcpb validate mcpb/manifest.json` → valid, and `release/vaulted-money.mcpb` exists.
- [ ] **Step 5: Verify by hand (owner)**: double-click the `.mcpb` in Claude Desktop, switch the Local API on, ask "list my ledgers". Report the result.
- [ ] **Step 6: Commit** `feat(mcpb): build a one-click Claude Desktop bundle`

### Task 5: Docs and plugin README

**Files:**
- Modify: `README.md` (new "Use with an AI agent" section near "Using the Local API"), `mcp/README.md` (new setup path first; keep the manual token route as "advanced"), `plugins/vaulted-money/README.md` (steps become: open app, flip switch, install plugin; remove the token-file step)
- Test: `mcp/pluginSync.test.ts` stays as is

- [ ] **Step 1: Update the three READMEs** with the shortened steps, the honest privacy paragraph, the Claude Desktop `.mcpb` route, the Claude Code route, and the local-model route (LM Studio snippet from the panel). Say that claude.ai on the web is not supported.
- [ ] **Step 2: Run** `pnpm format:check` and `pnpm exec prettier --check README.md mcp/README.md plugins/vaulted-money/README.md`.
- [ ] **Step 3: Commit** `docs: describe the one-switch Claude setup`

### Task 6: GIF (owner records, assistant wires it up)

**Files:**
- Create: `documentation/readme/connect-to-agent.gif` (recorded by the owner)
- Modify: `README.md` (one image line under the new section)

- [ ] **Step 1 (owner):** record about 20 seconds: Settings → Local API → switch on → Claude Desktop (or LM Studio) → ask "Where is my money going this month?" on demo data. Keep it under about 3 MB.
- [ ] **Step 2:** add `![Connect Vaulted Money to Claude](documentation/readme/connect-to-agent.gif)` to the README section. Do not add the line before the file exists.
- [ ] **Step 3: Commit** `docs: add Connect to agent demo GIF`

### Task 7: Whole-change verification and release steps

- [ ] **Step 1: Run** `pnpm lint`, `pnpm format:check`, `tsc --noEmit`, `pnpm test:coverage`, `pnpm build`, `pnpm audit --prod --audit-level=moderate`; all PASS. Commit any regenerated `src/data/acknowledgments.generated.ts`.
- [ ] **Step 2: Packaged-app check:** `pnpm electron:build`, open the built app, flip the switch, confirm `api-config.json` appears in the folder `appConfigCandidates` lists first; if the real folder differs, fix the candidate list and add a test.
- [ ] **Step 3: Claude Code check:** `claude plugin validate .`, then install the plugin from the local marketplace and ask a question.
- [ ] **Step 4: Open the PR into `pre-prod`; after merge to `main`, attach `release/vaulted-money.mcpb` to the GitHub release so the panel's download link works.**

---

## Self-review

- **Spec coverage:** config discovery (T1), bundled server (T2), panel with switch, snippets, privacy note and Disconnect (T3), `.mcpb` (T4), docs (T5), GIF (T6), verification and release (T7), plugin shipped together (T1 copy, T5, T7). No gaps found.
- **Types:** `loadConnection`, `getConnectInfo`, `ConnectToAgentPanel` props and `stageMcpb` are named the same wherever used.
- **Review Focus coverage:** off, corrupt/missing config, port change, per-request re-read, OS paths and dev vs packaged names are all tested in Task 1; the packaged-name risk is also checked by hand in Task 7.
- **Known risk:** the dev Electron app name (`vite_react_shadcn_ts`) and packaged name (`Vaulted Money`) are assumptions until Task 7 Step 2 confirms the real folder.

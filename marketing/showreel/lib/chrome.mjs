/**
 * A minimal Chrome DevTools Protocol client over Node's built-in WebSocket,
 * shared by render.mjs (frames of the film) and capture.mjs (screens of the
 * real app). No npm dependencies.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer as createNetServer } from "node:net";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

export const chromePath = CHROME_CANDIDATES.find((candidate) =>
  existsSync(candidate),
);

export const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

export class DevToolsSession {
  #socket;
  #nextId = 1;
  #pending = new Map();
  #listeners = new Map();

  static async connect(webSocketUrl) {
    const session = new DevToolsSession();
    session.#socket = new WebSocket(webSocketUrl);
    session.#socket.addEventListener("message", (event) =>
      session.#onMessage(event),
    );
    await new Promise((resolve, reject) => {
      session.#socket.addEventListener("open", resolve, { once: true });
      session.#socket.addEventListener("error", reject, { once: true });
    });
    return session;
  }

  #onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.method) {
      for (const listener of this.#listeners.get(message.method) ?? []) {
        listener(message.params);
      }
      return;
    }
    if (!message.id || !this.#pending.has(message.id)) return;
    const { resolve, reject } = this.#pending.get(message.id);
    this.#pending.delete(message.id);
    if (message.error)
      reject(new Error(`${message.error.message} (${message.error.code})`));
    else resolve(message.result);
  }

  send(method, params = {}) {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) =>
      this.#pending.set(id, { resolve, reject }),
    );
  }

  /** Subscribe to a CDP event, e.g. "Page.loadEventFired". */
  on(method, listener) {
    if (!this.#listeners.has(method)) this.#listeners.set(method, new Set());
    this.#listeners.get(method).add(listener);
    return () => this.#listeners.get(method).delete(listener);
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      );
    }
    return result.value;
  }

  close() {
    this.#socket.close();
  }
}

/**
 * Start headless Chromium and attach to its first tab.
 * Returns the session plus a `close()` that kills the browser.
 */
export async function launchChrome({
  width,
  height,
  deviceScaleFactor = 1,
  mobile = false,
  userDataDir,
} = {}) {
  if (!chromePath) throw new Error("No Chromium found. Set CHROME_PATH.");
  const debuggingPort = await freePort();
  const chrome = spawn(
    chromePath,
    [
      "--headless",
      `--remote-debugging-port=${debuggingPort}`,
      "--hide-scrollbars",
      "--mute-audio",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--font-render-hinting=none",
      `--window-size=${width},${height}`,
      ...(userDataDir ? [`--user-data-dir=${userDataDir}`] : []),
      // Chromium refuses to sandbox as root (e.g. in CI containers).
      ...(process.getuid?.() === 0 ? ["--no-sandbox"] : []),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  chrome.stderr.resume();

  let targets;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${debuggingPort}/json/list`,
      );
      targets = await response.json();
      if (targets.some((target) => target.type === "page")) break;
    } catch {
      // Not listening yet.
    }
    await wait(100);
  }
  const pageTarget = targets?.find((target) => target.type === "page");
  if (!pageTarget) {
    chrome.kill("SIGKILL");
    throw new Error("Chromium did not expose a page target");
  }

  const session = await DevToolsSession.connect(
    pageTarget.webSocketDebuggerUrl,
  );
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  await session.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor,
    mobile,
  });
  return {
    session,
    close() {
      session.close();
      chrome.kill("SIGKILL");
    },
  };
}

/**
 * Drives the app through the App Store preview's story so the simulator can
 * record it (marketing/app-preview/record.mjs). Loaded only in a build made
 * with VITE_PREVIEW_AUTOPLAY=1 (see main.tsx); store builds never contain it.
 *
 * The story follows the store screenshots: Charts (donut) → plain-English
 * search → Accounts → AI switched on → budget warnings. When it finishes it
 * sets the page title to "preview:done", which tells the recorder to stop.
 */

export type PreviewStep =
  | { do: "goto"; path: string }
  | { do: "click"; role: string; name: string }
  | { do: "type"; text: string }
  | { do: "scroll"; y: number }
  | { do: "wait"; ms: number };

export interface PreviewApi {
  navigate(path: string): void;
  click(role: string, name: string): Promise<void>;
  type(text: string): Promise<void>;
  scroll(y: number): Promise<void>;
  wait(ms: number): Promise<void>;
}

/** About 25 seconds: long enough to read each screen, under Apple's 30 s. */
export const PREVIEW_STORY: PreviewStep[] = [
  { do: "goto", path: "/analytics" },
  { do: "wait", ms: 800 },
  { do: "scroll", y: 280 },
  { do: "click", role: "button", name: "Pie chart" },
  { do: "wait", ms: 3200 },
  { do: "goto", path: "/transactions" },
  { do: "wait", ms: 800 },
  { do: "click", role: "combobox", name: "" },
  { do: "type", text: "groceries over 20 last month " },
  { do: "wait", ms: 3500 },
  { do: "goto", path: "/accounts" },
  { do: "wait", ms: 3500 },
  { do: "goto", path: "/ai-providers" },
  { do: "wait", ms: 1200 },
  { do: "click", role: "button", name: "Turn on AI" },
  { do: "wait", ms: 3500 },
  { do: "goto", path: "/insights" },
  { do: "wait", ms: 3500 },
  { do: "wait", ms: 1500 },
];

export async function runPreviewStory(
  steps: PreviewStep[],
  api: PreviewApi,
): Promise<void> {
  for (const step of steps) {
    if (step.do === "goto") api.navigate(step.path);
    else if (step.do === "click") await api.click(step.role, step.name);
    else if (step.do === "type") await api.type(step.text);
    else if (step.do === "scroll") await api.scroll(step.y);
    else await api.wait(step.ms);
  }
  document.title = "preview:done";
  mark("done");
}

/**
 * Tells the recorder (marketing/app-preview/record.mjs) where the story
 * starts and ends, so it can trim the video. The recorder bakes its address
 * into the preview build; nothing is sent in any other build.
 */
function mark(event: "start" | "done") {
  const url = import.meta.env.VITE_PREVIEW_MARK_URL;
  if (url) void fetch(`${url}/${event}`, { method: "POST" }).catch(() => {});
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Finds a visible element by role and accessible name (or text). */
const find = (role: string, name: string): HTMLElement | null => {
  const selector =
    role === "combobox" ? '[role="combobox"], input[cmdk-input]' : "button";
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  ).filter((el) => el.offsetParent !== null);
  if (!name) return candidates[0] ?? null;
  return (
    candidates.find(
      (el) =>
        el.getAttribute("aria-label") === name ||
        el.textContent?.trim() === name,
    ) ?? null
  );
};

/** The real driver used in the preview build. */
export const domApi: PreviewApi = {
  navigate(path) {
    // The installed apps use hash routing.
    window.location.hash = `#${path}`;
  },
  async click(role, name) {
    for (let i = 0; i < 20; i++) {
      const el = find(role, name);
      if (el) {
        el.click();
        el.focus();
        return;
      }
      await sleep(150);
    }
  },
  async type(text) {
    const input = document.activeElement as HTMLInputElement | null;
    if (!input || !("value" in input)) return;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    for (const char of text) {
      setValue?.call(input, input.value + char);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(55);
    }
  },
  async scroll(y) {
    const main = document.querySelector("main");
    (main && main.scrollHeight > main.clientHeight ? main : window).scrollBy({
      top: y,
      behavior: "smooth",
    });
    await sleep(400);
  },
  wait: sleep,
};

/** Makes the demo data, opens "Home Budget", then plays the story. */
export async function startPreviewAutoplay(): Promise<void> {
  await sleep(1500);
  domApi.navigate("/ledgers?demo=1");
  await domApi.click("button", "Generate Data");
  for (let i = 0; i < 100; i++) {
    const ledger = Array.from(document.querySelectorAll("h2")).find(
      (h) => h.textContent?.trim() === "Home Budget",
    );
    if (ledger) {
      await sleep(1500);
      (ledger as HTMLElement).click();
      break;
    }
    await sleep(200);
  }
  await sleep(2000);
  mark("start");
  await runPreviewStory(PREVIEW_STORY, domApi);
}

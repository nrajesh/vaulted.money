/**
 * Drives the app through the App Store preview's story so the simulator can
 * record it (marketing/app-preview/record.mjs). Loaded only in a build made
 * with VITE_PREVIEW_AUTOPLAY=1 (see main.tsx); store builds never contain it.
 *
 * The story: Overview → a plain-English search applied to the list →
 * Budgets, tapping one through to its transactions → Calendar → AI switched
 * on and its setup. Each `scene` step tells the recorder where a chapter
 * starts, so compose.mjs can lay a chapter card over the cut. When the story
 * finishes it sets the page title to "preview:done", which tells the
 * recorder to stop.
 */

export type PreviewStep =
  | { do: "goto"; path: string }
  | { do: "click"; role: string; name: string }
  | { do: "type"; text: string }
  /** Types whole phrases at once, like iPhone word suggestions. */
  | { do: "typeWords"; words: string[]; gapMs: number }
  | { do: "scroll"; y: number }
  | { do: "wait"; ms: number }
  | { do: "tapRow"; index: number }
  | { do: "scene" };

export interface PreviewApi {
  navigate(path: string): void;
  click(role: string, name: string): Promise<void>;
  type(text: string, instant?: boolean): Promise<void>;
  scroll(y: number): Promise<void>;
  wait(ms: number): Promise<void>;
  /** Taps the `index`th transaction card (the two-panel list). */
  tapRow(index: number): Promise<void>;
}

/**
 * About 25 seconds of story, which with the opening and closing brand cards
 * stays under Apple's 30-second limit for app previews. The first scene has
 * no chapter card: the opening brand card covers it.
 */
export const PREVIEW_STORY: PreviewStep[] = [
  { do: "scene" },
  { do: "goto", path: "/dashboard" },
  { do: "wait", ms: 3800 },
  { do: "scene" },
  { do: "goto", path: "/transactions" },
  // Each chapter card stays up ~1.6 s at the start of its scene.
  { do: "wait", ms: 1700 },
  { do: "click", role: "combobox", name: "" },
  // Whole phrases, so the suggestions never show a half-typed word such as
  // "last" or "over" as a text filter.
  {
    do: "typeWords",
    words: ["groceries ", "in checking ", "last month ", "over 25"],
    gapMs: 420,
  },
  { do: "wait", ms: 600 },
  { do: "click", role: "option", name: "Apply all…" },
  { do: "wait", ms: 300 },
  { do: "click", role: "button", name: "Done" },
  { do: "wait", ms: 700 },
  { do: "scene" },
  // Clear the search under the chapter card, so its filters do not show up
  // on the budget's transactions.
  { do: "click", role: "button", name: "Reset" },
  { do: "goto", path: "/budgets" },
  { do: "wait", ms: 3000 },
  // The first budget with spending: the order depends on the demo data,
  // and an unused budget would open an empty list.
  { do: "click", role: "budget", name: "" },
  { do: "wait", ms: 1800 },
  { do: "scene" },
  { do: "goto", path: "/calendar" },
  { do: "wait", ms: 3300 },
  { do: "scene" },
  { do: "goto", path: "/ai-providers" },
  { do: "wait", ms: 2000 },
  { do: "click", role: "button", name: "Turn on AI" },
  { do: "wait", ms: 800 },
  { do: "click", role: "button", name: "Add AI Provider" },
  { do: "wait", ms: 1900 },
];

/**
 * The iPad segment for the keynote showreel: Transactions opens as the table
 * (the default at the iPad's width), then "List and details" brings in the
 * details panel. Recorded on an iPad Pro 13-inch held upright.
 */
export const IPAD_STORY: PreviewStep[] = [
  { do: "goto", path: "/transactions" },
  { do: "wait", ms: 1500 },
  { do: "click", role: "button", name: "Table" },
  { do: "wait", ms: 1500 },
  { do: "click", role: "button", name: "List and details" },
  { do: "wait", ms: 3000 },
];

/**
 * The iPhone Duo segment for the keynote showreel: something different from
 * the iPad, so the list and details are already side by side (the default at
 * the Duo's width, chosen before the footage the keynote uses) and three rows
 * are opened one after another. Recorded with the Duo's inner screen turned
 * sideways (marketing/app-preview/README.md).
 */
export const DUO_STORY: PreviewStep[] = [
  { do: "goto", path: "/transactions" },
  { do: "wait", ms: 1500 },
  { do: "click", role: "button", name: "List and details" },
  { do: "wait", ms: 1000 },
  { do: "tapRow", index: 1 },
  { do: "wait", ms: 1100 },
  // The unfolded Duo held sideways is short: bring the next rows into view.
  { do: "scroll", y: 260 },
  { do: "wait", ms: 500 },
  { do: "tapRow", index: 2 },
  { do: "wait", ms: 1300 },
  { do: "tapRow", index: 3 },
  { do: "wait", ms: 1500 },
];

/** The story a preview build plays, from VITE_PREVIEW_STORY. */
export function storyFor(name: string | undefined): PreviewStep[] {
  if (name === "duo") return DUO_STORY;
  if (name === "ipad") return IPAD_STORY;
  return PREVIEW_STORY;
}

export async function runPreviewStory(
  steps: PreviewStep[],
  api: PreviewApi,
): Promise<void> {
  for (const step of steps) {
    if (step.do === "goto") api.navigate(step.path);
    else if (step.do === "click") await api.click(step.role, step.name);
    else if (step.do === "type") await api.type(step.text);
    else if (step.do === "typeWords")
      for (const word of step.words) {
        await api.type(word, true);
        await api.wait(step.gapMs);
      }
    else if (step.do === "scroll") await api.scroll(step.y);
    else if (step.do === "tapRow") await api.tapRow(step.index);
    else if (step.do === "scene") mark("scene");
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
function mark(event: "start" | "scene" | "done") {
  const url = import.meta.env.VITE_PREVIEW_MARK_URL;
  if (url) void fetch(`${url}/${event}`, { method: "POST" }).catch(() => {});
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Finds a visible element by role and accessible name (or text). A name
 * ending in "…" matches by its start ("Apply all…" finds "Apply all 4").
 * Roles: "combobox", "option" (a search suggestion), "title" (a tappable
 * card title), "budget" (a budget's title, only on a budget with spending),
 * otherwise a button.
 */
const SELECTORS: Record<string, string> = {
  combobox: '[role="combobox"], input[cmdk-input]',
  option: "[cmdk-item]",
  title: ".cursor-pointer",
};
/** A budget card has spending when its "Spent" figure is not zero. */
const hasSpending = (title: HTMLElement) => {
  const card = title.closest<HTMLElement>("[class*='rounded']");
  const spent = card?.textContent?.match(/Spent:\s*[^\d]*([\d.,]+)/);
  return !!spent && Number(spent[1].replace(/[^\d]/g, "")) > 0;
};

const find = (role: string, name: string): HTMLElement | null => {
  const selector = SELECTORS[role === "budget" ? "title" : role] ?? "button";
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  ).filter(
    (el) => el.offsetParent !== null && (role !== "budget" || hasSpending(el)),
  );
  if (!name) return candidates[0] ?? null;
  const prefix = name.endsWith("…") ? name.slice(0, -1) : null;
  const matches = (text: string | null | undefined) =>
    text != null && (prefix ? text.startsWith(prefix) : text === name);
  return (
    candidates.find(
      (el) =>
        matches(el.getAttribute("aria-label")) ||
        matches(el.textContent?.trim()),
    ) ?? null
  );
};

/**
 * Shows where the story taps: a soft ring that grows and fades over the
 * element, like a finger press, so viewers see what was pressed.
 */
async function showTouch(el: HTMLElement): Promise<void> {
  const box = el.getBoundingClientRect();
  if (!box.width) return;
  el.scrollIntoView({ block: "nearest" });
  const ring = document.createElement("div");
  const size = 64;
  Object.assign(ring.style, {
    position: "fixed",
    left: `${box.left + box.width / 2 - size / 2}px`,
    top: `${box.top + box.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.35)",
    border: "3px solid rgba(255,255,255,0.85)",
    boxShadow: "0 0 18px rgba(127,227,216,0.7)",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.append(ring);
  ring.animate(
    [
      { transform: "scale(0.4)", opacity: 0 },
      { transform: "scale(1)", opacity: 1, offset: 0.35 },
      { transform: "scale(1.5)", opacity: 0 },
    ],
    { duration: 650, easing: "ease-out" },
  ).onfinish = () => ring.remove();
  // Press after the ring has landed, as a finger would.
  await sleep(260);
}

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
        await showTouch(el);
        el.click();
        el.focus();
        return;
      }
      await sleep(150);
    }
  },
  async type(text, instant = false) {
    const input = document.activeElement as HTMLInputElement | null;
    if (!input || !("value" in input)) return;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    for (const chunk of instant ? [text] : Array.from(text)) {
      setValue?.call(input, input.value + chunk);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (!instant) await sleep(55);
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
  async tapRow(index) {
    const rows = document.querySelectorAll<HTMLElement>(".app-mobile-row");
    rows[index]?.click();
    await sleep(100);
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
  await runPreviewStory(storyFor(import.meta.env.VITE_PREVIEW_STORY), domApi);
}

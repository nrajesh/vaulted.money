import { describe, expect, it, vi } from "vitest";
import {
  DUO_STORY,
  IPAD_STORY,
  PREVIEW_STORY,
  storyFor,
  runPreviewStory,
  type PreviewApi,
} from "./previewAutoplay";

const fakeApi = (): PreviewApi & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    navigate: vi.fn((path: string) => {
      calls.push(`goto ${path}`);
    }),
    click: vi.fn(async (role: string, name: string) => {
      calls.push(`click ${role} ${name}`);
    }),
    type: vi.fn(async (text: string) => {
      calls.push(`type ${text}`);
    }),
    wait: vi.fn(async () => {}),
    scroll: vi.fn(async () => {}),
    tapRow: vi.fn(async (index: number) => {
      calls.push(`tap row ${index}`);
    }),
  };
};

describe("runPreviewStory", () => {
  it("opens the Charts screen first", async () => {
    const api = fakeApi();
    await runPreviewStory(PREVIEW_STORY, api);
    expect(api.calls[0]).toBe("goto /analytics");
  });

  it("types the search sentence exactly once, spelled correctly", async () => {
    const api = fakeApi();
    await runPreviewStory(PREVIEW_STORY, api);
    expect(api.type).toHaveBeenCalledTimes(1);
    expect(api.type).toHaveBeenCalledWith("groceries over 20 last month ");
  });

  it("visits the story's screens in order", async () => {
    const api = fakeApi();
    await runPreviewStory(PREVIEW_STORY, api);
    const visits = api.calls.filter((c) => c.startsWith("goto"));
    expect(visits).toEqual([
      "goto /analytics",
      "goto /transactions",
      "goto /accounts",
      "goto /ai-providers",
      "goto /insights",
    ]);
  });

  it("marks the page when the story is done, for the recorder", async () => {
    document.title = "Vaulted Money";
    await runPreviewStory(PREVIEW_STORY, fakeApi());
    expect(document.title).toBe("preview:done");
  });

  it("lasts no more than 30 seconds of waiting", () => {
    const waited = PREVIEW_STORY.filter((s) => s.do === "wait").reduce(
      (sum, s) => sum + (s.do === "wait" ? s.ms : 0),
      0,
    );
    expect(waited).toBeGreaterThanOrEqual(15_000);
    expect(waited).toBeLessThanOrEqual(28_000);
  });

  it("opens the iPad story on the table, then switches to list and details", async () => {
    const api = fakeApi();
    await runPreviewStory(IPAD_STORY, api);
    expect(api.calls[0]).toBe("goto /transactions");
    const table = api.calls.indexOf("click button Table");
    expect(table).toBeGreaterThan(-1);
    expect(api.calls.indexOf("click button List and details")).toBeGreaterThan(
      table,
    );
  });

  it("walks the Duo story through rows of the two-panel list", async () => {
    const api = fakeApi();
    await runPreviewStory(DUO_STORY, api);
    expect(api.calls[0]).toBe("goto /transactions");
    // The split is chosen before any row is opened (and before the footage
    // the keynote uses), so no press shows up after the panel is there.
    const split = api.calls.indexOf("click button List and details");
    const taps = api.calls.filter((c) => c.startsWith("tap row"));
    expect(split).toBeGreaterThan(-1);
    expect(split).toBeLessThan(api.calls.indexOf("tap row 1"));
    expect(taps).toEqual(["tap row 1", "tap row 2", "tap row 3"]);
    expect(api.calls).not.toContain("click button Table");
  });

  it("picks the story from the build setting", () => {
    expect(storyFor("duo")).toBe(DUO_STORY);
    expect(storyFor("ipad")).toBe(IPAD_STORY);
    expect(storyFor("")).toBe(PREVIEW_STORY);
  });
});

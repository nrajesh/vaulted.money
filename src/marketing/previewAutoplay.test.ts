import { describe, expect, it, vi } from "vitest";
import {
  PREVIEW_STORY,
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
});

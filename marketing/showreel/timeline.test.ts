import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { CHAPTERS, DURATION } from "./timeline.mjs";

type Chapter = { id: string; start: number; end: number };
const chapters = CHAPTERS as Chapter[];

describe("social cut timeline", () => {
  it("runs its chapters back to back, in order, to the end of the film", () => {
    expect(chapters[0].start).toBe(0);
    for (let i = 1; i < chapters.length; i++)
      expect(chapters[i].start).toBeCloseTo(chapters[i - 1].end, 6);
    expect(chapters.at(-1)?.end).toBeCloseTo(DURATION, 6);
  });

  it("stays about fifty seconds long", () => {
    expect(DURATION).toBeGreaterThan(45);
    expect(DURATION).toBeLessThan(55);
  });
});

describe("relaxed social cut", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("slows every cue and the whole film by the same factor at a lower tempo", async () => {
    vi.resetModules();
    // @ts-expect-error plain ES module without type declarations
    const normal = await import("./timeline.mjs");
    vi.resetModules();
    vi.stubEnv("SHOWREEL_BPM", "108");
    // @ts-expect-error plain ES module without type declarations
    const relaxed = await import("./timeline.mjs");
    const factor = 128 / 108;
    expect(relaxed.BPM).toBe(108);
    expect(relaxed.DURATION).toBeCloseTo(60, 6);
    expect(relaxed.CUES.montage).toBeCloseTo(normal.CUES.montage * factor, 6);
    expect(relaxed.chapter("lockup").start).toBeCloseTo(
      normal.chapter("lockup").start * factor,
      6,
    );
  });

  it("ignores a tempo outside the range the music is written for", async () => {
    vi.stubEnv("SHOWREEL_BPM", "20");
    vi.resetModules();
    // @ts-expect-error plain ES module without type declarations
    const timeline = await import("./timeline.mjs");
    expect(timeline.BPM).toBe(128);
  });
});

describe("keynote cut timeline", () => {
  it("runs 70–80 s with chapters back to back, each at least 5 s", async () => {
    // @ts-expect-error plain ES module without type declarations
    const keynote = await import("./timelines/keynote.mjs");
    const list = keynote.CHAPTERS as Chapter[];
    expect(keynote.DURATION).toBeGreaterThanOrEqual(70);
    expect(keynote.DURATION).toBeLessThanOrEqual(80);
    expect(list[0].start).toBe(0);
    for (let i = 1; i < list.length; i++)
      expect(list[i].start).toBeCloseTo(list[i - 1].end, 6);
    expect(list.at(-1)?.end).toBeCloseTo(keynote.DURATION, 6);
    for (const c of list) expect(c.end - c.start).toBeGreaterThanOrEqual(5);
  });

  type Moment = { t: number; sound: string; chapter: string; web?: boolean };
  type Cue = { t: number; kind: string };
  const load = async () => {
    // @ts-expect-error plain ES module without type declarations
    const keynote = await import("./timelines/keynote.mjs");
    const at = (id: string) =>
      (keynote.CHAPTERS as Chapter[]).find((c) => c.id === id)!;
    return {
      keynote,
      at,
      moments: keynote.MOMENTS as Record<string, Moment>,
      cues: keynote.scoreCues as (web: boolean) => Cue[],
    };
  };

  it("lands every moment on the beat grid, inside its own chapter", async () => {
    const { keynote, at, moments } = await load();
    const step = keynote.BEAT / 2;
    for (const [name, m] of Object.entries(moments)) {
      const c = at(m.chapter);
      expect(m.t, name).toBeGreaterThanOrEqual(c.start);
      expect(m.t, name).toBeLessThan(c.end - 1);
      expect(Math.abs(m.t / step - Math.round(m.t / step)), name).toBeLessThan(
        1e-9,
      );
    }
  });

  it("puts a sound on every moment the picture shows, and only those", async () => {
    const { moments, cues } = await load();
    const key = (c: { t: number; sound?: string; kind?: string }) =>
      `${c.t.toFixed(3)}:${c.sound ?? c.kind}`;
    for (const web of [false, true]) {
      const shown = Object.values(moments)
        .filter((m) => !m.web || web)
        .map(key)
        .sort();
      const effects = cues(web)
        .filter((c) => !["drop", "break", "fill", "outro"].includes(c.kind))
        .map(key)
        .sort();
      expect(effects).toEqual(shown);
    }
  });

  it("drops the full groove at privacy, the device reveal and the end, and breaks down for the big screens", async () => {
    const { at, cues } = await load();
    const of = (kind: string) =>
      cues(false)
        .filter((c) => c.kind === kind)
        .map((c) => c.t);
    expect(of("drop")).toEqual([
      at("privacy").start,
      at("devices").start,
      at("end").start,
    ]);
    expect(of("break")).toEqual([at("bigScreens").start]);
  });

  it("settles the iPad and the Duo before their recordings start playing", async () => {
    const { moments } = await load();
    // @ts-expect-error plain ES module without type declarations
    const { screenWindows } = await import("./duo/overlay.mjs");
    const windows = screenWindows();
    // A device's entrance (keynote.mjs poseDevice: 0.6 s, overshoot 1.2)
    // ends 0.6 × (1 − 1 / 2.2) ≈ 0.33 s after the moment it lands.
    expect(moments.bigIpad.t + 0.33).toBeLessThan(windows.ipad.from);
    expect(moments.bigDuo.t + 0.33).toBeLessThan(windows.duo.from);
  });
});

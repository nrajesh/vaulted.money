import { readFileSync } from "node:fs";
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
  type Moment = {
    t: number;
    chapter: string;
    note: number;
    kind: string;
    web?: boolean;
  };
  type Note = { t: number; note: number; len: number };
  const load = async () => {
    // @ts-expect-error plain ES module without type declarations
    const keynote = await import("./timelines/keynote.mjs");
    return {
      keynote,
      at: (id: string) =>
        (keynote.CHAPTERS as Chapter[]).find((c) => c.id === id)!,
      moments: keynote.MOMENTS as Record<string, Moment>,
      melody: keynote.melody() as Note[],
      chordAt: keynote.chordAt as (t: number) => number[],
      cues: keynote.scoreCues as (
        web: boolean,
      ) => { t: number; kind: string }[],
    };
  };
  const pitchClass = (n: number) => ((n % 12) + 12) % 12;

  it("runs 70–85 s in whole bars, chapters back to back", async () => {
    const { keynote } = await load();
    const list = keynote.CHAPTERS as Chapter[];
    expect(keynote.DURATION).toBeGreaterThanOrEqual(70);
    expect(keynote.DURATION).toBeLessThanOrEqual(85);
    expect(list[0].start).toBe(0);
    for (let i = 1; i < list.length; i++)
      expect(list[i].start).toBeCloseTo(list[i - 1].end, 6);
    expect(list.at(-1)?.end).toBeCloseTo(keynote.DURATION, 6);
    for (const c of list) {
      const bars = (c.end - c.start) / keynote.BAR;
      expect(Math.abs(bars - Math.round(bars)), c.id).toBeLessThan(1e-9);
      expect(c.end - c.start, c.id).toBeGreaterThanOrEqual(
        2 * keynote.BAR - 1e-9,
      );
    }
  });

  it("lands every card from the turn on a note of the tune, in tune with its chord", async () => {
    const { at, moments, melody, chordAt } = await load();
    const from = at("turn").start;
    for (const [name, m] of Object.entries(moments)) {
      if (m.t < from) continue;
      expect(chordAt(m.t).map(pitchClass), name).toContain(pitchClass(m.note));
      if (m.t >= at("privacy").start)
        expect(
          melody.some((n) => Math.abs(n.t - m.t) < 1e-9 && n.note === m.note),
          `${name} is a note of the tune`,
        ).toBe(true);
    }
  });

  it("keeps every card inside its own chapter and on the eighth-note grid after the opening", async () => {
    const { keynote, at, moments } = await load();
    const eighth = keynote.BEAT / 2;
    for (const [name, m] of Object.entries(moments)) {
      const c = at(m.chapter);
      expect(m.t, name).toBeGreaterThanOrEqual(c.start);
      expect(m.t, name).toBeLessThan(c.end - 0.5);
      if (m.chapter !== "worry")
        expect(
          Math.abs(m.t / eighth - Math.round(m.t / eighth)),
          name,
        ).toBeLessThan(1e-9);
    }
  });

  it("gives the score one cue per card shown, with the web-only ones only on the website", async () => {
    const { moments, cues } = await load();
    for (const web of [false, true]) {
      const shown = Object.values(moments).filter((m) => !m.web || web);
      const played = cues(web).filter((c) =>
        ["card", "mess", "snap", "stamp", "logo"].includes(c.kind),
      );
      expect(played.length).toBe(shown.length);
    }
  });

  it("ends the tune on the home chord", async () => {
    const { keynote, melody, chordAt } = await load();
    const last = melody.at(-1)!;
    expect(pitchClass(last.note)).toBe(0);
    expect(chordAt(keynote.DURATION - 0.1).map(pitchClass)).toContain(0);
  });

  // The owner's rules for the words: short lines, no negatives, and
  // taglines quoted from the README rather than invented.
  const lines = (copy: unknown): string[] =>
    typeof copy === "string"
      ? [copy]
      : Array.isArray(copy)
        ? copy.flatMap(lines)
        : Object.values(copy as object).flatMap(lines);

  it("keeps every line short enough to read while watching", async () => {
    const { keynote } = await load();
    for (const line of lines(keynote.COPY))
      expect(line.split(/\s+/).length, line).toBeLessThanOrEqual(6);
  });

  it("asks and answers in the positive", async () => {
    const { keynote } = await load();
    const banned = /\b(don't|dont|no|not|never|nothing|unless|can't|won't)\b/i;
    for (const line of lines(keynote.COPY))
      expect(line.replace(/\*/g, ""), line).not.toMatch(banned);
  });

  it("signs off with the one slogan", async () => {
    const { keynote } = await load();
    for (const tagline of keynote.TAGLINES as string[])
      expect(tagline).toBe("Private Vault, Open Code");
  });

  it("adds up the numbers it shows", async () => {
    const { keynote } = await load();
    type Budget = { name: string; spent: number; target: number };
    const over = (keynote.BUDGETS as Budget[]).filter(
      (b) => b.spent > b.target,
    );
    // One budget tips over, by the 18.00 the heads-up quotes.
    expect(over).toHaveLength(1);
    expect(over[0].spent - over[0].target).toBeCloseTo(18, 6);
    type Upcoming = { amount: number };
    const net = (keynote.UPCOMING as Upcoming[]).reduce(
      (sum, u) => sum + u.amount,
      0,
    );
    expect(net).toBeCloseTo(2370, 6);
  });

  it("keeps something landing at least every bar, except while a recording plays", async () => {
    const { keynote, at, moments } = await load();
    // @ts-expect-error plain ES module without type declarations
    const { screenWindows } = await import("./duo/overlay.mjs");
    const { ipad, duo } = screenWindows();
    const from = at("turn").start;
    const times = Object.values(moments)
      .filter((m) => m.t >= from && !m.web)
      .map((m) => m.t)
      .sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      const [a, b] = [times[i - 1], times[i]];
      const playing = a < duo.to + 0.7 && b > ipad.from;
      if (!playing)
        expect(b - a, `quiet from ${a.toFixed(2)} s`).toBeLessThanOrEqual(
          keynote.BAR + 1e-6,
        );
    }
  });

  it("times every moment the picture asks for", async () => {
    const { moments } = await load();
    const picture = readFileSync(`${import.meta.dirname}/keynote.mjs`, "utf8");
    const asked = [...picture.matchAll(/\bM\.(\w+)/g)].map((m) => m[1]);
    for (const name of new Set(asked))
      expect(moments, name).toHaveProperty(name);
  });

  it("brings the Duo in only after the iPad's footage has finished", async () => {
    const { moments } = await load();
    // @ts-expect-error plain ES module without type declarations
    const { screenWindows } = await import("./duo/overlay.mjs");
    // poseDevice starts a device's entrance 0.3 s before it lands.
    expect(moments.bigDuo.t - 0.3).toBeGreaterThanOrEqual(
      screenWindows().ipad.to,
    );
  });

  it("holds the whole device row for at least a second", async () => {
    const { at, moments } = await load();
    const last = Math.max(
      ...[0, 1, 2, 3, 4].map((i) => moments[`devicesRow${i}`].t),
    );
    // The row starts leaving half a second before the chapter ends.
    expect(at("devices").end - 0.5 - last).toBeGreaterThanOrEqual(1);
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

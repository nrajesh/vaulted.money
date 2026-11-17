import { afterEach, describe, expect, it, vi } from "vitest";

/** RMS of each whole second of a 16-bit stereo WAV buffer. */
function secondLevels(wav: Buffer) {
  const samples = new Int16Array(
    wav.buffer,
    wav.byteOffset + 44,
    (wav.length - 44) / 2,
  );
  const perSecond = 48000 * 2;
  const levels: number[] = [];
  for (let start = 0; start + perSecond <= samples.length; start += perSecond) {
    let sum = 0;
    for (let i = start; i < start + perSecond; i++) sum += samples[i] ** 2;
    levels.push(Math.sqrt(sum / perSecond) / 32768);
  }
  return levels;
}

describe("social cut soundtrack", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // At 108 BPM a riser started a fraction of a sample before its sample
  // index, raised a negative progress to a fractional power (NaN) and the
  // NaN silenced every sample after it.
  it.each(["128", "108"])(
    "keeps playing for the whole film at %s BPM",
    async (bpm) => {
      vi.stubEnv("SHOWREEL_BPM", bpm);
      vi.resetModules();
      // @ts-expect-error plain ES module without type declarations
      const { renderSoundtrack } = await import("./soundtrack.mjs");
      const levels = secondLevels(renderSoundtrack());
      // Every second but the final fade carries sound.
      for (const [second, level] of levels.slice(0, -1).entries())
        expect(level, `second ${second}`).toBeGreaterThan(0.01);
    },
    60_000,
  );
});

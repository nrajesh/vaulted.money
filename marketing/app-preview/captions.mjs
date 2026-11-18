/**
 * When each caption shows in the App Store preview. SEGMENTS mirrors the
 * screens of PREVIEW_STORY (src/marketing/previewAutoplay.ts) with their
 * rough lengths; captionTimeline stretches them to the story's measured
 * length so the captions follow the screens even if the device is slower.
 */
export const SEGMENTS = [
  { shot: 1, seconds: 4.4 }, // Charts, donut
  { shot: 2, seconds: 6.2 }, // search typed and understood
  { shot: 3, seconds: 3.6 }, // Accounts
  { shot: 4, seconds: 4.8 }, // AI switched on
  { shot: 5, seconds: 5.0 }, // budget warnings
];

const plain = (text) => text.replace(/\*/g, "");

export function captionTimeline(strings, segments, storySeconds) {
  const total = segments.reduce((sum, s) => sum + s.seconds, 0);
  const scale = storySeconds / total;
  let at = 0;
  return segments.map(({ shot, seconds }) => {
    const start = at;
    at += seconds * scale;
    const text = strings[String(shot)];
    return {
      start: Number(start.toFixed(3)),
      end: Number(at.toFixed(3)),
      headline: plain(text.headline),
      sub: text.sub,
    };
  });
}

/**
 * The App Store preview's chapter cards. The story (PREVIEW_STORY in
 * src/marketing/previewAutoplay.ts) marks where each scene starts; a short
 * card with the chapter's title covers each cut, so no caption ever sits on
 * top of the app while it is being shown. The first scene (Overview) has no
 * card: the opening brand card covers it.
 */
export const CHAPTERS = [
  null, // Overview, under the opening brand card
  {
    headline: "Ask it like you'd say it.",
    sub: "Plain-English search, on your phone.",
  },
  {
    headline: "Every budget at a glance.",
    sub: "Tap one to see what's behind it.",
  },
  {
    headline: "Bills on the calendar.",
    sub: "See which days money comes and goes.",
  },
  {
    headline: "AI when you want it.",
    sub: "Off by default. Your key, your choice.",
  },
];

/** Seconds a chapter card stays up, starting at its scene's mark. */
export const CARD_SECONDS = 1.6;

/**
 * Turns the recorder's scene marks (seconds into the story) into card
 * windows: one per chapter that has a card, never past the story's end.
 */
export function chapterTimeline(sceneTimes, storySeconds) {
  return CHAPTERS.flatMap((chapter, i) => {
    if (!chapter || sceneTimes[i] === undefined) return [];
    const start = Math.max(0, sceneTimes[i]);
    const end = Math.min(storySeconds, start + CARD_SECONDS);
    return [
      {
        start: Number(start.toFixed(3)),
        end: Number(end.toFixed(3)),
        ...chapter,
      },
    ];
  });
}

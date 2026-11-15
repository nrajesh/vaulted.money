/**
 * Sound cues for the App Store preview's score, placed on the story's
 * screens (stretched to the measured story length like the captions): the
 * pulse lifts as the search starts, and a quiet tap sounds on each touch
 * (Pie chart, the search box, the AI switch).
 */
import { captionTimeline } from "./captions.mjs";

// Seconds into each screen where the story touches the screen.
const TAPS = { 1: 1.2, 2: 0.8, 4: 1.2 };

export function calmScoreCues(segments, storySeconds) {
  const strings = Object.fromEntries(
    segments.map((s) => [String(s.shot), { headline: "" }]),
  );
  const screens = captionTimeline(strings, segments, storySeconds);
  const scale = storySeconds / segments.reduce((sum, s) => sum + s.seconds, 0);
  const cues = [{ t: screens[1].start, kind: "lift" }];
  segments.forEach((s, i) => {
    if (TAPS[s.shot] !== undefined)
      cues.push({ t: screens[i].start + TAPS[s.shot] * scale, kind: "tick" });
  });
  cues.push({ t: screens[4].start, kind: "chime" });
  return cues.filter((c) => c.t <= storySeconds);
}

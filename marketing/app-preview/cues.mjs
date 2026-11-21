/**
 * Sound cues for the App Store preview's score: the pulse lifts as the
 * search chapter starts, a quiet tap sounds on each chapter card, and a
 * chime marks the last chapter.
 */
export function calmScoreCues(sceneTimes, storySeconds) {
  const inside = (t) => t !== undefined && t >= 0 && t <= storySeconds;
  const cues = [];
  if (inside(sceneTimes[1])) cues.push({ t: sceneTimes[1], kind: "lift" });
  sceneTimes.slice(1).forEach((t) => {
    if (inside(t)) cues.push({ t, kind: "tick" });
  });
  const last = sceneTimes.at(-1);
  if (sceneTimes.length > 2 && inside(last))
    cues.push({ t: last, kind: "chime" });
  return cues;
}

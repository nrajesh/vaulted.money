/**
 * The ~75-second teaser for people who are wary of yet another budget app.
 *
 * Story: acknowledge the fatigue (fees, bank logins, your data in someone
 * else's cloud) → Free, Private, Open, Yours → "Have a chat with your
 * finances" (two questions no menu can answer, from real numbers) → getting
 * your data in → build your own screens instead of living with the defaults →
 * a side-by-side → one clear next step.
 *
 * Reading rule (a little quicker than the full film): once the last element
 * of a scene is fully up it stays in focus for at least 2.5 s before the
 * scene dissolves; the dissolve begins DISSOLVE s before the end, as the sea
 * wave swells and crests on the cut.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DISSOLVE = 1.6;

export const SCENES = [
  { id: "hook", start: 0, end: 8.5 },
  { id: "promise", start: 8.5, end: 16.5 },
  { id: "chat1", start: 16.5, end: 28 },
  { id: "chat2", start: 28, end: 39 },
  { id: "file", start: 39, end: 48.5 },
  { id: "gui", start: 48.5, end: 58 },
  { id: "switch", start: 58, end: 66.5 },
  { id: "cta", start: 66.5, end: 75 },
];
export const DURATION = SCENES[SCENES.length - 1].end;
export const scene = (id) => SCENES.find((s) => s.id === id);
/** The teaser is short enough not to need chapters. */
export const chapters = () => [];

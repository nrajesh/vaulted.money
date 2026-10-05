/**
 * The 70-second teaser for people who are wary of yet another budget app.
 *
 * Story: acknowledge the fatigue (fees, bank logins, your data in someone
 * else's cloud) → Free, Private, Open, Yours → the everyday questions it
 * answers, on real screens → plug in your own tools (the API story) → a
 * side-by-side → one clear next step.
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
  { id: "hook", start: 0, end: 9 },
  { id: "promise", start: 9, end: 17.5 },
  { id: "where", start: 17.5, end: 26 },
  { id: "budget", start: 26, end: 33.5 },
  { id: "file", start: 33.5, end: 43 },
  { id: "tinker", start: 43, end: 52.5 },
  { id: "switch", start: 52.5, end: 61 },
  { id: "cta", start: 61, end: 71 },
];
export const DURATION = SCENES[SCENES.length - 1].end;
export const scene = (id) => SCENES.find((s) => s.id === id);
/** The teaser is short enough not to need chapters. */
export const chapters = () => [];

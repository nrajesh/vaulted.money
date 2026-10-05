/**
 * The shared clock for the film. Picture and sound both read from here.
 *
 * Pacing rule (medium): every scene holds one idea for 9-14 seconds, and
 * nothing new appears within ~1.2 s of the previous thing, so a first-time
 * viewer can read it. There are no hard cuts; scenes cross-fade.
 */
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;

/** id, label (chapter pill), start, end (seconds). */
export const SCENES = [
  { id: "title", label: "", start: 0, end: 7 },
  { id: "enable", label: "Switch it on", start: 7, end: 17 },
  { id: "create", label: "Ledger & account", start: 17, end: 30 },
  { id: "import", label: "Transactions", start: 30, end: 43 },
  { id: "history", label: "Categorise", start: 43, end: 54 },
  { id: "ai", label: "Optional AI", start: 54, end: 68 },
  { id: "privacy", label: "Privacy", start: 68, end: 79 },
  { id: "agent", label: "OpenAPI + agents", start: 79, end: 93 },
  { id: "ways", label: "Your interface", start: 93, end: 105 },
  { id: "unique", label: "Why it's different", start: 105, end: 115 },
  { id: "outro", label: "", start: 115, end: 121 },
];
export const DURATION = SCENES[SCENES.length - 1].end;
/** Cross-fade length between scenes. */
export const FADE = 0.6;

export const scene = (id) => SCENES.find((s) => s.id === id);

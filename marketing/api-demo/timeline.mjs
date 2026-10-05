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

/**
 * id, label (chapter pill), start, end (seconds). `chapter` names scenes that
 * have no pill (title, end card) in the video's chapter list.
 *
 * Reading rule: each scene is a short, quick demo followed by a "takeaway"
 * slide of at most two cards that stays up for 6-8 seconds, because the cards
 * are what people read and remember; the animation only earns attention.
 */
export const SCENES = [
  { id: "title", label: "", chapter: "Introduction", start: 0, end: 7 },
  { id: "enable", label: "Switch it on", chapter: "Switch it on", start: 7, end: 20 },
  { id: "create", label: "Ledger & account", chapter: "Create a ledger and an account", start: 20, end: 33 },
  { id: "import", label: "Transactions", chapter: "Add and import transactions", start: 33, end: 47 },
  { id: "history", label: "Categorise", chapter: "Categorise from your history", start: 47, end: 59 },
  { id: "ai", label: "Optional AI", chapter: "Optional AI", start: 59, end: 79 },
  { id: "privacy", label: "Privacy", chapter: "Privacy", start: 79, end: 93 },
  // The "chat with your data" chapter: six scenes under one pill.
  { id: "mcp", label: "Chat with it", chapter: "Chat: how it works", start: 93, end: 109 },
  { id: "ask", label: "Chat with it", chapter: "Chat: ask about your money", start: 109, end: 125 },
  { id: "add", label: "Chat with it", chapter: "Chat: add a transaction", start: 125, end: 139 },
  { id: "csv", label: "Chat with it", chapter: "Chat: import a bank CSV", start: 139, end: 156 },
  { id: "safe", label: "Chat with it", chapter: "Chat: safe deletes", start: 156, end: 171 },
  { id: "more", label: "Chat with it", chapter: "Chat: more questions", start: 171, end: 183 },
  { id: "ways", label: "Your interface", chapter: "Three ways to use it", start: 183, end: 196 },
  { id: "themes", label: "Your interface", chapter: "Light and dark", start: 196, end: 206 },
  { id: "unique", label: "Why it's different", chapter: "Why it's different", start: 206, end: 220 },
  { id: "outro", label: "", chapter: "Get it", start: 220, end: 233 },
];
export const DURATION = SCENES[SCENES.length - 1].end;
/** Cross-fade length between scenes. */
export const FADE = 0.6;

export const scene = (id) => SCENES.find((s) => s.id === id);

/** Chapters for the video file and the player page: one per pill (plus title and end card). */
export function chapters() {
  const out = [];
  for (const s of SCENES) {
    const title = s.chapter ?? s.label;
    if (out.length && out[out.length - 1].title === title) out[out.length - 1].end = s.end;
    else out.push({ title, start: s.start, end: s.end });
  }
  return out;
}

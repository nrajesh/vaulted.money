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
 * id, label (top-bar pill), chapter (name in the chapter list), icon (shown in
 * front of the chapter name), start, end (seconds).
 *
 * Reading rules, kept by construction and checked by qa-cards.mjs:
 *  - each scene is a short, quick demo followed by a "takeaway" of at most two
 *    cards with a one-line title and two short bullets;
 *  - once the last card is fully up it stays in focus for at least 3 seconds
 *    before the scene starts to dissolve (the dissolve begins DISSOLVE seconds
 *    before `end`, as the sea wave swells);
 *  - the wave crests on the cut; the next scene's title resolves as it recedes.
 */
export const SCENES = [
  { id: "title", label: "", chapter: "Introduction", icon: "🎬", start: 0, end: 10 },
  { id: "enable", label: "Switch it on", chapter: "Switch it on", icon: "🔌", start: 10, end: 24 },
  { id: "create", label: "Ledger & account", chapter: "Create a ledger and an account", icon: "🧾", start: 24, end: 39 },
  { id: "import", label: "Transactions", chapter: "Add and import transactions", icon: "📥", start: 39, end: 57 },
  { id: "history", label: "Categorise", chapter: "Categorise from your history", icon: "🏷️", start: 57, end: 70 },
  { id: "ai", label: "Optional AI", chapter: "Optional AI", icon: "✨", start: 70, end: 92 },
  { id: "privacy", label: "Privacy", chapter: "Privacy", icon: "🔒", start: 92, end: 105 },
  // The "chat with your data" chapter: six scenes under one pill.
  { id: "mcp", label: "Chat with it", chapter: "Chat: how it works", icon: "💬", start: 105, end: 121 },
  { id: "ask", label: "Chat with it", chapter: "Chat: ask about your money", icon: "❓", start: 121, end: 138 },
  { id: "add", label: "Chat with it", chapter: "Chat: add a transaction", icon: "➕", start: 138, end: 152 },
  { id: "csv", label: "Chat with it", chapter: "Chat: import a bank CSV", icon: "📄", start: 152, end: 170 },
  { id: "safe", label: "Chat with it", chapter: "Chat: safe deletes", icon: "🛡️", start: 170, end: 184 },
  { id: "more", label: "Chat with it", chapter: "Chat: more questions", icon: "🔎", start: 184, end: 196 },
  { id: "ways", label: "Your interface", chapter: "Three ways to use it", icon: "🧩", start: 196, end: 209 },
  { id: "unique", label: "Why it's different", chapter: "Why it's different", icon: "🌍", start: 209, end: 223 },
  { id: "outro", label: "", chapter: "Get it", icon: "📲", start: 223, end: 236 },
];
export const DURATION = SCENES[SCENES.length - 1].end;
/** A scene starts to dissolve this long before its end; the next one resolves just after the cut. */
export const DISSOLVE = 2.4;
/** Chapter markers sit this far into a scene, so a thumbnail shows the new slide with its title. */
export const CHAPTER_OFFSET = 1.0;

export const scene = (id) => SCENES.find((s) => s.id === id);

/** Chapters for the video file and the player page, each with its icon. */
export function chapters() {
  return SCENES.map((s, i) => ({
    title: `${s.icon} ${s.chapter}`,
    start: i === 0 ? 0 : s.start + CHAPTER_OFFSET,
    end: i === SCENES.length - 1 ? s.end : SCENES[i + 1].start + CHAPTER_OFFSET,
  }));
}

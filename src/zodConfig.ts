import { z } from "zod";

// Zod's speed-up compiles validators with `new Function`, which the page's
// Content-Security-Policy forbids (it logged an "eval" error on every load).
// Turn it off: validation behaves the same, only a little slower.
//
// This must be its own module, imported first in main.tsx. Zod decides at the
// moment each schema is built, and imports run before the body of main.tsx,
// so setting it there came too late for schemas created while loading the app.
z.config({ jitless: true });

/**
 * Text that must never appear in a store image or video frame. Each capture's
 * visible text is checked before it is saved, so a later change to the app's
 * wording or demo data fails the run instead of shipping a bad screenshot.
 *
 * `stores` lists where a rule applies: "apple" (App Store images), "play"
 * (Google Play images) and "mac" (Polar product page, website, showreels).
 */
const RULES = [
  {
    pattern: /\bInfinite\b/,
    stores: ["apple", "play", "mac"],
    message: 'Runway shows "Infinite"',
  },
  {
    pattern: /[€$£¥₹]-\d/,
    stores: ["apple", "play", "mac"],
    message: 'Minus sign after the currency symbol ("€-")',
  },
  {
    pattern: /\b0 selected\b/,
    stores: ["apple", "play", "mac"],
    message: 'Empty "0 selected" bar in frame',
  },
  {
    pattern: /No ledgers|No transactions (found|to show)|Something went wrong/i,
    stores: ["apple", "play", "mac"],
    message: "Empty or error state: demo data did not load",
  },
  {
    // The owner asked for the AI agent card's note to stay out of frame.
    pattern: /Needs the Mac app|on a computer \(currently Mac\)/,
    stores: ["apple", "play"],
    message: "AI agent card's computer note in frame",
  },
  {
    pattern: /\b(Mac|macOS|iPhone|iPad|Apple)\b/,
    stores: ["play"],
    message: "Apple name in a Google Play image",
  },
  {
    pattern: /\b(Android|Google Play)\b/,
    stores: ["apple"],
    message: "Other platform named in an App Store image",
  },
  {
    pattern: /\bfree\b|€\s?\d+[.,]\d{2}\s?one-time/i,
    stores: ["apple", "play"],
    message: 'Price or "free" wording in a store image',
  },
];

/** Returns one message per problem found in `text` for `store` (empty when clean). */
export function findAntiGoals(text, store) {
  return RULES.filter(
    (rule) => rule.stores.includes(store) && rule.pattern.test(text),
  ).map((rule) => rule.message);
}

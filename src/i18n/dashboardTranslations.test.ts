import { describe, expect, it } from "vitest";
import i18n from "@/i18n/config";

/**
 * Every bundled language must offer everything English does, and keep the same
 * {{placeholders}} so a translated sentence still receives its numbers and
 * names. Missing keys silently fall back to English, so nothing else would
 * notice.
 */
const LANGUAGES = ["es", "zh", "nl", "ta"] as const;

type Bundle = Record<string, unknown>;

/** Leaf strings keyed by path, with plural suffixes folded into one key. */
const leaves = (language: string) => {
  const result = new Map<string, string[]>();
  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      const key = path.replace(/_(one|other)$/, "");
      result.set(key, [...(result.get(key) ?? []), node]);
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Bundle)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(i18n.getResourceBundle(language, "translation"), "");
  return result;
};

const placeholders = (texts: string[]) =>
  [...new Set(texts.flatMap((t) => t.match(/{{\s*\w+\s*}}/g) ?? []))]
    .map((p) => p.replace(/\s/g, ""))
    .sort();

const english = leaves("en");

describe("translation parity", () => {
  it.each(LANGUAGES)(
    "%s has its own text for every key English has",
    (lang) => {
      const own = leaves(lang);
      const missing = [...english.keys()].filter((key) => !own.has(key));
      expect(missing, `${lang} is missing ${missing.length} keys`).toEqual([]);
    },
  );

  it.each(LANGUAGES)("%s keeps the same placeholders as English", (lang) => {
    const own = leaves(lang);
    const broken: string[] = [];
    for (const [key, texts] of english) {
      const translated = own.get(key);
      if (!translated) continue;
      // A language may not need `count` (Chinese has no plural), but anything
      // else English interpolates must still be there.
      const expected = placeholders(texts).filter((p) => p !== "{{count}}");
      const actual = placeholders(translated);
      if (expected.some((p) => !actual.includes(p))) {
        broken.push(
          `${key}: expected ${expected.join(",")} got ${actual.join(",")}`,
        );
      }
    }
    expect(broken).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import i18n from "@/i18n/config";

const GROUPS = [
  "dashboard.runway",
  "dashboard.budgetStatus",
  "dashboard.overview",
  "dashboard.recentActivity",
  "dashboard.spendingByCategory",
  "dialogs.eraseAll",
];

const bundleOf = (lang: string, group: string) => {
  const node = i18n.getResourceBundle(lang, "translation") as Record<
    string,
    unknown
  >;
  return (group
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      node,
    ) ?? {}) as Record<string, string>;
};

/** Leaf keys of one group in English, with plural suffixes folded together. */
const englishKeys = (group: string) =>
  Array.from(
    new Set(
      Object.keys(bundleOf("en", group)).map((k) =>
        k.replace(/_(one|other)$/, ""),
      ),
    ),
  );

describe("dashboard and erase-dialog translations", () => {
  it.each(["es", "zh", "nl", "ta"])(
    "%s has its own text for every key that English has",
    (lang) => {
      for (const group of GROUPS) {
        const own = bundleOf(lang, group);
        for (const key of englishKeys(group)) {
          // Inspect the language's own bundle so English fallback cannot hide a gap.
          const present = [key, `${key}_one`, `${key}_other`].some(
            (k) => typeof own[k] === "string" && own[k].length > 0,
          );
          expect(present, `${lang}: ${group}.${key}`).toBe(true);
        }
      }
    },
  );
});

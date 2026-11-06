import { describe, expect, it } from "vitest";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import i18n from "@/i18n/config";

const BASELINE_PATH = "src/i18n/hardcodedTextBaseline.json";

const readBaseline = (): Record<string, number> =>
  existsSync(BASELINE_PATH)
    ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
    : {};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });

describe("every translation key the code uses is defined", () => {
  it('has no t("key") whose key is missing from the English bundle', () => {
    const missing: string[] = [];
    for (const file of walk("src")) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/\bt\(\s*"([A-Za-z0-9_.]+)"/g)) {
        const key = match[1];
        const defined =
          i18n.exists(key, { lng: "en", fallbackLng: [] }) ||
          i18n.exists(key, { lng: "en", count: 2 });
        if (!defined) missing.push(`${key} (${file})`);
      }
    }
    // A key that only has a defaultValue shows English in every other language.
    expect(missing).toEqual([]);
  });
});

/**
 * Counts user-visible English written directly into a component: JSX text,
 * common text props and toast messages. It is a heuristic, which is fine for a
 * ratchet: the point is that the number per file may not grow.
 */
const countHardcodedText = (source: string) => {
  const jsxText =
    source.match(/>\s*[A-Z][^<>{}\n]*[a-z]{3,}[^<>{}\n]*\s*</g) ?? [];
  const textProps =
    source.match(
      /\b(?:title|placeholder|aria-label|label|description|alt|confirmText|submitLabel|header)="[A-Z][^"]*[a-z]{3,}[^"]*"/g,
    ) ?? [];
  const toasts =
    source.match(/\b(?:showSuccess|showError)\(\s*["`][A-Z][^"`]*[a-z]{3,}/g) ??
    [];
  return jsxText.length + textProps.length + toasts.length;
};

const uiFiles = () =>
  [...walk("src/pages"), ...walk("src/components")].filter(
    (file) => file.endsWith(".tsx") && !file.includes("/components/ui/"),
  );

describe("hard-coded English in the UI", () => {
  const current: Record<string, number> = {};
  for (const file of uiFiles()) {
    const count = countHardcodedText(readFileSync(file, "utf8"));
    if (count > 0) current[file] = count;
  }

  it("does not grow: new screens must use translations", () => {
    if (process.env.UPDATE_I18N_BASELINE) {
      writeFileSync(
        BASELINE_PATH,
        JSON.stringify(
          Object.fromEntries(Object.entries(current).sort()),
          null,
          2,
        ) + "\n",
      );
    }
    const recorded = readBaseline();
    const grew = Object.entries(current)
      .filter(([file, count]) => count > (recorded[file] ?? 0))
      .map(
        ([file, count]) =>
          `${file}: ${count} hard-coded strings (allowed ${recorded[file] ?? 0}). Use t("key", { defaultValue }) and add the key to every language in src/i18n/areas.`,
      );
    expect(grew).toEqual([]);
  });

  it("has an up-to-date baseline, so progress is recorded", () => {
    const recorded = readBaseline();
    const stale = Object.keys(recorded).filter(
      (file) => (current[file] ?? 0) < recorded[file],
    );
    // Run `UPDATE_I18N_BASELINE=1 pnpm vitest run src/i18n/coverageGuard.test.ts`
    // after translating a screen to lower its allowance.
    expect(stale, "translated files: refresh the baseline").toEqual([]);
  });
});

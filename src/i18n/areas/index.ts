import { gaps } from "./gaps";
import { management } from "./management";
import { ledgerEntry } from "./ledgerEntry";
import { shell } from "./shell";
import { feedback } from "./feedback";
import { transactionsTable } from "./transactionsTable";
import { budgets } from "./budgets";
import { mergeMissing } from "./merge";
import type { AreaLanguage, AreaTranslations } from "./types";

/** Every translation module that is merged into the bundled languages. */
export const areaTranslations: AreaTranslations[] = [
  gaps,
  management,
  ledgerEntry,
  shell,
  feedback,
  transactionsTable,
  budgets,
];

/**
 * Adds the area modules to the language bundles. Existing keys win, so an area
 * can never override text that was already reviewed.
 */
export function applyAreaTranslations(
  bundles: Record<string, { translation?: unknown } | undefined>,
) {
  for (const area of areaTranslations) {
    for (const [language, translations] of Object.entries(area) as [
      AreaLanguage,
      NonNullable<AreaTranslations[AreaLanguage]>,
    ][]) {
      const translation = bundles[language]?.translation;
      if (translation && typeof translation === "object") {
        mergeMissing(translation as Record<string, unknown>, translations);
      }
    }
  }
}

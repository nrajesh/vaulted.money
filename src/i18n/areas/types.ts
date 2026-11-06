export type AreaLanguage = "en" | "es" | "zh" | "nl" | "ta";

export interface NestedTranslations {
  [key: string]: string | NestedTranslations;
}

/**
 * Translations for one part of the app, with every language side by side so a
 * reviewer can compare them. Languages may be omitted only in modules that
 * fill gaps in an existing bundle.
 */
export type AreaTranslations = Partial<
  Record<AreaLanguage, NestedTranslations>
>;

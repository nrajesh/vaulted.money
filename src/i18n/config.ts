import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, type SupportedLanguage } from "./resources";
import {
  getEnabledLanguages,
  isLanguageEnabled,
  saveEnabledLanguages,
} from "./languagePreferences";
import {
  getCustomLanguages,
  removeCustomLanguage,
  upsertCustomLanguage,
} from "./customLanguages";
const getMergedResources = () => {
  const merged = { ...resources };
  for (const customLanguage of getCustomLanguages()) {
    merged[customLanguage.code] = {
      translation: customLanguage.translations,
    };
  }
  return merged;
};

const STORAGE_KEY = "app-language";

const getInitialLanguage = () => {
  const enabledLanguages = getEnabledLanguages();
  const savedLanguage = localStorage.getItem(STORAGE_KEY);

  if (
    savedLanguage &&
    enabledLanguages.includes(savedLanguage as SupportedLanguage)
  ) {
    return savedLanguage;
  }

  return enabledLanguages[0] ?? "en";
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: getMergedResources(),
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

// "languageChanged" does not fire for the initial language, so set it here.
document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (language) => {
  if (!isLanguageEnabled(language)) {
    const fallbackLanguage = getEnabledLanguages()[0] ?? "en";
    if (fallbackLanguage !== language) {
      void i18n.changeLanguage(fallbackLanguage);
      return;
    }
  }
  localStorage.setItem(STORAGE_KEY, language);
  document.documentElement.lang = language;
});

export const registerCustomLanguage = (params: {
  code: string;
  name: string;
  translations: Record<string, unknown>;
}) => {
  const allLanguages = upsertCustomLanguage(params);
  const current = allLanguages.find((item) => item.code === params.code);

  i18n.addResourceBundle(
    params.code,
    "translation",
    current?.translations ?? params.translations,
    true,
    true,
  );
};

/** Drops a custom locale from storage and i18n; re-normalizes enabled language if needed. */
export const unregisterCustomLanguage = (code: string) => {
  const normalized = code.trim().toLowerCase();
  if (!removeCustomLanguage(normalized)) {
    return;
  }

  if (i18n.hasResourceBundle(normalized, "translation")) {
    i18n.removeResourceBundle(normalized, "translation");
  }

  const nextEnabled = saveEnabledLanguages(getEnabledLanguages());
  const active = i18n.resolvedLanguage;
  if (
    active === normalized ||
    (typeof active === "string" && !isLanguageEnabled(active))
  ) {
    void i18n.changeLanguage(nextEnabled[0] ?? "en");
  }
};

export default i18n;

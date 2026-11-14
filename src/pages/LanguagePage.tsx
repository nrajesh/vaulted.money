import * as React from "react";
import { ThemedCard, ThemedCardContent } from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/utils/toast";
import { Check, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  getEnabledLanguages,
  saveEnabledLanguages,
} from "@/i18n/languagePreferences";
import {
  builtInLanguageOptions,
  resources,
  type SupportedLanguage,
} from "@/i18n/resources";
import i18n, {
  registerCustomLanguage,
  unregisterCustomLanguage,
} from "@/i18n/config";
import { getCustomLanguages } from "@/i18n/customLanguages";
import { useTranslation } from "react-i18next";
import { sortLanguageOptionsByEnglishName } from "@/i18n/sortLanguages";

const getLanguageOptions = (): { value: SupportedLanguage; label: string }[] =>
  sortLanguageOptionsByEnglishName([
    ...builtInLanguageOptions.map((item) => ({
      value: item.code,
      label: item.name,
    })),
    ...getCustomLanguages().map((item) => ({
      value: item.code,
      label: item.name,
    })),
  ]);

const builtinTranslationJson = (code: string): string => {
  if (!builtInLanguageOptions.some((item) => item.code === code)) {
    return "{}";
  }
  const pack = resources[code as keyof typeof resources];
  if (
    pack &&
    typeof pack === "object" &&
    pack !== null &&
    "translation" in pack
  ) {
    try {
      return JSON.stringify(
        (pack as { translation: unknown }).translation,
        null,
        2,
      );
    } catch {
      return "{}";
    }
  }
  return "{}";
};

const LanguagePage = () => {
  const { t } = useTranslation();
  const [enabledLanguages, setEnabledLanguages] = React.useState<
    SupportedLanguage[]
  >(() => getEnabledLanguages());
  const [languageOptions, setLanguageOptions] = React.useState(() =>
    getLanguageOptions(),
  );
  const [customLanguageCode, setCustomLanguageCode] = React.useState("");
  const [customLanguageName, setCustomLanguageName] = React.useState("");
  const [customLanguageJson, setCustomLanguageJson] = React.useState("{}");

  const customCodes = new Set(getCustomLanguages().map((item) => item.code));

  React.useEffect(() => {
    const onLanguagesUpdated = () => {
      setLanguageOptions(getLanguageOptions());
      setEnabledLanguages(getEnabledLanguages());
    };

    window.addEventListener("app:languages-updated", onLanguagesUpdated);
    window.addEventListener(
      "app:enabled-languages-changed",
      onLanguagesUpdated,
    );
    return () => {
      window.removeEventListener("app:languages-updated", onLanguagesUpdated);
      window.removeEventListener(
        "app:enabled-languages-changed",
        onLanguagesUpdated,
      );
    };
  }, []);

  const populateCustomFormForCode = (code: SupportedLanguage) => {
    const custom = getCustomLanguages().find((item) => item.code === code);
    if (custom) {
      setCustomLanguageCode(custom.code);
      setCustomLanguageName(custom.name);
      setCustomLanguageJson(JSON.stringify(custom.translations, null, 2));
      return;
    }
    const meta = builtInLanguageOptions.find((item) => item.code === code);
    if (meta) {
      setCustomLanguageCode(meta.code);
      setCustomLanguageName(meta.name);
      setCustomLanguageJson(builtinTranslationJson(meta.code));
    }
  };

  const handleLanguageChipClick = async (option: {
    value: SupportedLanguage;
    label: string;
  }) => {
    populateCustomFormForCode(option.value);
    if (!enabledLanguages.includes(option.value)) {
      const normalized = saveEnabledLanguages([option.value]);
      setEnabledLanguages(normalized);
      await i18n.changeLanguage(option.value);
      showSuccess("Language updated.");
    }
  };

  const handleRemoveCustomLanguage = (
    event: React.MouseEvent,
    code: SupportedLanguage,
    label: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      !window.confirm(
        t("language.removeCustomConfirm", {
          name: label,
          defaultValue: `Remove custom language "${label}"? You can add it again from Language settings.`,
        }),
      )
    ) {
      return;
    }
    unregisterCustomLanguage(code);
    if (customLanguageCode === code) {
      setCustomLanguageCode("");
      setCustomLanguageName("");
      setCustomLanguageJson("{}");
    }
    showSuccess(
      t("language.customRemoved", { defaultValue: "Custom language removed." }),
    );
  };

  const handleAddCustomLanguage = async () => {
    const code = customLanguageCode.trim().toLowerCase();
    const name = customLanguageName.trim();

    if (!code || !name) {
      showError("Language code and name are required.");
      return;
    }

    let translations: Record<string, unknown>;
    try {
      translations = JSON.parse(customLanguageJson || "{}") as Record<
        string,
        unknown
      >;
    } catch {
      showError("Invalid translation JSON.");
      return;
    }

    registerCustomLanguage({ code, name, translations });
    setLanguageOptions(getLanguageOptions());

    if (!enabledLanguages.includes(code)) {
      setEnabledLanguages(saveEnabledLanguages([code]));
    }

    await i18n.changeLanguage(code);
    setCustomLanguageCode("");
    setCustomLanguageName("");
    setCustomLanguageJson("{}");
    showSuccess("Custom language saved.");
  };

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("settings.cards.language.title", {
              defaultValue: "Language and Localization",
            })}
          </h1>
          <p className="app-page-subtitle">
            {t("settings.cards.language.description", {
              defaultValue:
                "Use one primary language (mother tongue). Add custom languages by code and translation JSON.",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-6">
        <ThemedCard className="md:col-span-2 lg:col-span-3">
          <ThemedCardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>
                {t("settings.cards.language.enabled", {
                  defaultValue: "Enabled Languages",
                })}
              </Label>
              <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                {languageOptions.map((option) => {
                  const checked = enabledLanguages.includes(option.value);
                  const isCustom = customCodes.has(option.value);

                  return (
                    <div
                      key={option.value}
                      className="flex shrink-0 items-center gap-0.5"
                    >
                      <Button
                        type="button"
                        variant={checked ? "default" : "outline"}
                        className="h-10 w-fit min-w-0 max-w-[13rem] justify-between px-2.5 text-xs font-normal"
                        onClick={() => void handleLanguageChipClick(option)}
                        aria-label={`${option.label}${
                          checked
                            ? " (active, tap to load in editor below)"
                            : ""
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {checked && <Check className="h-4 w-4 shrink-0" />}
                      </Button>
                      {isCustom ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 text-destructive-text hover:bg-destructive/10 hover:text-destructive-text"
                          aria-label={t("language.removeCustomAria", {
                            name: option.label,
                            defaultValue: `Remove ${option.label}`,
                          })}
                          onClick={(event) =>
                            handleRemoveCustomLanguage(
                              event,
                              option.value,
                              option.label,
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {languageOptions.some((option) =>
                customCodes.has(option.value),
              ) ? (
                <p className="text-xs text-muted-foreground pt-1">
                  {t("settings.cards.language.deleteActiveHint", {
                    defaultValue:
                      "Custom languages can be deleted with the trash icon. If you remove the language you are using, the app switches to a fallback (English when available, or another supported language that matches your browser).",
                  })}
                </p>
              ) : null}
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <Label className="text-sm font-semibold">
                {t("settings.cards.language.customTitle", {
                  defaultValue: "Add Custom Language",
                })}
              </Label>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={customLanguageCode}
                  onChange={(event) =>
                    setCustomLanguageCode(event.target.value)
                  }
                  placeholder={t("settings.cards.language.codePlaceholder", {
                    defaultValue: "Language code (e.g. de, ja, hi)",
                  })}
                />
                <Input
                  value={customLanguageName}
                  onChange={(event) =>
                    setCustomLanguageName(event.target.value)
                  }
                  placeholder={t("settings.cards.language.namePlaceholder", {
                    defaultValue: "Display name (e.g. German)",
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t("settings.cards.language.jsonLabel", {
                    defaultValue:
                      "Translation JSON for this language (root = translation keys)",
                  })}
                </Label>
                <textarea
                  value={customLanguageJson}
                  onChange={(event) =>
                    setCustomLanguageJson(event.target.value)
                  }
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                  placeholder={t("settings.cards.language.jsonPlaceholder", {
                    defaultValue: '{"layout":{"nav":{"dashboard":"..."}}}',
                  })}
                />
              </div>
              <Button onClick={() => void handleAddCustomLanguage()}>
                {t("settings.cards.language.save", {
                  defaultValue: "Save Custom Language",
                })}
              </Button>
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
};

export default LanguagePage;

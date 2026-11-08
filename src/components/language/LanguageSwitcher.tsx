import * as React from "react";
import { Link } from "react-router-dom";
import { Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageIcon } from "@/components/language/LanguageIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveEnabledLanguages } from "@/i18n/languagePreferences";
import {
  builtInLanguageOptions,
  type SupportedLanguage,
} from "@/i18n/resources";
import { getCustomLanguages } from "@/i18n/customLanguages";
import { sortLanguageOptionsByEnglishName } from "@/i18n/sortLanguages";
import i18n, { unregisterCustomLanguage } from "@/i18n/config";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

const getBuiltInLanguageLabel = (
  t: ReturnType<typeof useTranslation>["t"],
  code: SupportedLanguage,
) => {
  const language = builtInLanguageOptions.find((item) => item.code === code);
  if (!language) {
    return code;
  }

  const translatedName = t(language.translationKey, {
    defaultValue: language.name,
  });

  if (
    translatedName.localeCompare(language.nativeName, undefined, {
      sensitivity: "base",
    }) === 0
  ) {
    return language.nativeName;
  }

  return `${language.nativeName} (${translatedName})`;
};

interface LanguageSwitcherProps {
  showLanguageSettings?: boolean;
}

export const LanguageSwitcher = ({
  showLanguageSettings = false,
}: LanguageSwitcherProps) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [, bumpLanguageListVersion] = React.useReducer(
    (value: number) => value + 1,
    0,
  );

  const customLanguages = getCustomLanguages();
  const allLanguages = sortLanguageOptionsByEnglishName([
    ...builtInLanguageOptions.map((language) => ({
      value: language.code,
      label: getBuiltInLanguageLabel(t, language.code),
      sortLabel: language.name,
    })),
    ...customLanguages.map((language) => ({
      value: language.code,
      label: language.name,
      sortLabel: language.name,
    })),
  ]);
  const customCodes = new Set(customLanguages.map((language) => language.code));

  React.useEffect(() => {
    const onLanguagesChanged = () => {
      bumpLanguageListVersion();
    };

    window.addEventListener(
      "app:enabled-languages-changed",
      onLanguagesChanged,
    );
    window.addEventListener("app:languages-updated", onLanguagesChanged);
    return () => {
      window.removeEventListener(
        "app:enabled-languages-changed",
        onLanguagesChanged,
      );
      window.removeEventListener("app:languages-updated", onLanguagesChanged);
    };
  }, []);

  const selectLanguage = async (code: SupportedLanguage) => {
    saveEnabledLanguages([code]);
    await i18n.changeLanguage(code);
  };

  const handleRemoveCustom = (
    event: React.MouseEvent,
    code: SupportedLanguage,
    label: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = window.confirm(
      t("language.removeCustomConfirm", {
        name: label,
        defaultValue: `Remove custom language "${label}"? You can add it again from Language settings.`,
      }),
    );
    if (!ok) {
      return;
    }
    unregisterCustomLanguage(code);
    showSuccess(
      t("language.customRemoved", { defaultValue: "Custom language removed." }),
    );
  };

  const active = i18nInstance.resolvedLanguage as SupportedLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-input"
          aria-label={t("language.label")}
        >
          <LanguageIcon className="h-5 w-5 text-slate-600 dark:text-gray-300" />
          <span className="sr-only">{t("language.label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,18rem)]">
        <DropdownMenuLabel className="font-normal">
          {t("language.label")}
        </DropdownMenuLabel>
        <div className="max-h-[min(50vh,16rem)] overflow-y-auto py-1">
          {allLanguages.map((option) => {
            const isCustom = customCodes.has(option.value);
            const isActive = active === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                className={cn("flex cursor-pointer items-center gap-2 pr-1", {
                  "bg-accent": isActive,
                })}
                onClick={() => void selectLanguage(option.value)}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Check
                    className={cn("h-4 w-4 shrink-0", {
                      "opacity-100": isActive,
                      "opacity-0": !isActive,
                    })}
                    aria-hidden
                  />
                  <span className="truncate">{option.label}</span>
                </span>
                {isCustom ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("language.removeCustomAria", {
                      name: option.label,
                      defaultValue: `Remove ${option.label}`,
                    })}
                    onClick={(event) =>
                      handleRemoveCustom(event, option.value, option.label)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="w-8 shrink-0" aria-hidden />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
        {showLanguageSettings && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/language">
                {t("language.openLanguageSettings", {
                  defaultValue: "Language settings",
                })}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

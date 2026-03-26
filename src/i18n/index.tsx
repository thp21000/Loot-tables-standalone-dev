import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import en from "./locales/en";
import fr from "./locales/fr";

export type Language = "fr" | "en";
type Dictionary = Record<string, string>;

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const dictionaries: Record<Language, Dictionary> = {
  fr,
  en,
};

const STORAGE_KEY = "owlbear-loot-language";

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(.*?)\}/g, (_, key) => {
    const value = params[key.trim()];
    return value === undefined ? `{${key}}` : String(value);
  });
}

function getInitialLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "fr" || saved === "en") {
    return saved;
  }

  return "fr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  const value = useMemo<I18nContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    };

    const t = (key: string, params?: Record<string, string | number>) => {
      const template = dictionaries[language][key] ?? dictionaries.fr[key] ?? key;
      return interpolate(template, params);
    };

    return {
      language,
      setLanguage,
      t,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n doit être utilisé à l’intérieur de I18nProvider.");
  }

  return context;
}

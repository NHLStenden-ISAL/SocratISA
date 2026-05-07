/**
 * i8n: intiele configuratie van i8n en voorkeurstaal.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import nl from './locales/nl.json';
import en from './locales/en.json';

const DEFAULT_LANGUAGE = 'nl';
const SUPPORTED_LANGUAGES = ['nl', 'en'] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

function getStoredLanguage(): SupportedLanguage | null {
  const rawValue = localStorage.getItem('lang');
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue);
    if (typeof parsedValue !== 'string') return null;

    return isSupportedLanguage(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function getBrowserLanguage(): SupportedLanguage | null {
  const normalizedValue = navigator.language.toLowerCase().slice(0, 2);
  return isSupportedLanguage(normalizedValue) ? normalizedValue : null;
}

function getInitialLanguage(): SupportedLanguage {
  return getStoredLanguage() ?? getBrowserLanguage() ?? DEFAULT_LANGUAGE;
}

const initialLanguage = getInitialLanguage();

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

i18n.use(initReactI18next).init({
  resources: {
    nl: { translation: nl },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

export default i18n;

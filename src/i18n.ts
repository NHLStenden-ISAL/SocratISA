/**
 * i18n: initiele configuratie van i18n en voorkeurstaal.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import nl from './locales/nl.json';
import en from './locales/en.json';
import { StorageService } from './services/StorageService';

const DEFAULT_LANGUAGE = 'nl';
type SupportedLanguage = 'nl' | 'en';

// Zoek voor opgeslagen voorkeurstaal
function getStoredLanguage(): SupportedLanguage | null {
  const value = StorageService.get<string | null>('lang', null);
  return value === 'nl' || value === 'en' ? value : null;
}

// Zoek voor browser voorkeurstaal
function getBrowserLanguage(): SupportedLanguage | null {
  const normalizedValue = navigator.language.toLowerCase().slice(0, 2);
  return normalizedValue === 'nl' || normalizedValue === 'en' ? normalizedValue : null;
}

// Fallback naar Nederlands als beide niks geven
function getInitialLanguage(): SupportedLanguage {
  return getStoredLanguage() ?? getBrowserLanguage() ?? DEFAULT_LANGUAGE;
}

const initialLanguage = getInitialLanguage();

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

// Initialiseer i18n
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

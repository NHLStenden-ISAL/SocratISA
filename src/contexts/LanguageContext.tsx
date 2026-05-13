/**
 * LanguageProvider: beheert nl/en taal state.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '../types';
import { useStorage } from './useStorage';
import { LanguageContext } from './useLanguage';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const storage = useStorage();

  // Als browser taal nl is, zet dan nl, anders en
  const fallbackLanguage: Language = i18n.resolvedLanguage?.startsWith('nl') ? 'nl' : 'en';

  // Geef taal uit localStorage of fallback
  const [lang, setLang] = useState<Language>(() =>
    storage.get<Language>('lang', fallbackLanguage)
  );

  // Zet taal
  useEffect(function syncLanguage() {
    document.documentElement.lang = lang;
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  // Wissel taal
  const toggleLang = () => {
    const newLang: Language = lang === 'nl' ? 'en' : 'nl';
    setLang(newLang);
    storage.set('lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

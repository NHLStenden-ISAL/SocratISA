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

  // Als browser/localStorage taal nl is, zet dan nl, anders en
  const fallbackLanguage: Language = i18n.resolvedLanguage?.startsWith('nl') ? 'nl' : 'en';

  // Geef taal uit localStorage of fallback
  const [language, setLanguage] = useState<Language>(() =>
    storage.getLocalItem<Language>('language', fallbackLanguage)
  );

  // Zet taal
  useEffect(function syncLanguage() {
    document.documentElement.lang = language;
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Wissel taal
  const toggleLanguage = () => {
    const nextLanguage: Language = language === 'nl' ? 'en' : 'nl';
    setLanguage(nextLanguage);
    storage.setLocalItem('language', nextLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

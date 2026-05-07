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
  const fallbackLanguage: Language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'nl';

  const [lang, setLang] = useState<Language>(() =>
    storage.get<Language>('lang', fallbackLanguage)
  );

  useEffect(function syncLanguage() {
    document.documentElement.lang = lang;
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

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

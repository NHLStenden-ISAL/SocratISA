/**
 * LanguageProvider: beheert NL/EN taal state.
 * Encapsuleert taal-logica, persisteert naar localStorage en sync met i18next.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '../types';
import { StorageService } from '../services/StorageService';
import { LanguageContext } from './useLanguage';

interface LanguageProviderProps {
  children: ReactNode;
}

/** Provider component die taal state beschikbaar stelt aan de componenten. */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<Language>(() =>
    StorageService.get<Language>('lang', 'NL')
  );

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
  }, [lang]);

  const toggleLang = () => {
    const newLang: Language = lang === 'NL' ? 'EN' : 'NL';
    setLang(newLang);
    i18n.changeLanguage(newLang.toLowerCase());
    StorageService.set('lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

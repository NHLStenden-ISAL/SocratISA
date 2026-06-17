/**
 * useLanguage: geeft toegang tot de taal context aan de componenten.
 */
import { useContext, createContext } from 'react';
import type { Language } from '../types';

export interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage moet binnen een LanguageProvider worden gebruikt');
  }

  return context;
}

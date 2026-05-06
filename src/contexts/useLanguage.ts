/**
 * useLanguage: hook voor toegang tot de language context.
 */
import { useContext, createContext } from 'react';
import type { Language } from '../types';

export interface LanguageContextValue {
  lang: Language;
  toggleLang: () => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/** Hook om toegang te krijgen tot de language context. */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage moet binnen een LanguageProvider worden gebruikt');
  }
  return context;
}

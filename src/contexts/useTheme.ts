/**
 * useTheme: hook voor toegang tot de theme context.
 */
import { useContext, createContext } from 'react';
import type { Theme } from '../types';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Hook om toegang te krijgen tot de theme context. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme moet binnen een ThemeProvider worden gebruikt');
  }
  return context;
}

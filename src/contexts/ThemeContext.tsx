/**
 * ThemeProvider: beheert licht/donker thema state.
 * Encapsuleert thema-logica en persisteert naar localStorage.
 */
import { useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '../types';
import { StorageService } from '../services/StorageService';
import { ThemeContext } from './useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

/** Provider component die thema state beschikbaar stelt aan de componenten. */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    StorageService.get<Theme>('theme', 'light')
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    StorageService.set('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

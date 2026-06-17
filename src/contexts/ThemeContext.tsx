/**
 * ThemeProvider: beheert licht/donker thema state.
 */
import { useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '../types';
import { useStorage } from './useStorage';
import { ThemeContext } from './useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const storage = useStorage();

  // Geef thema uit localStorage of licht
  const [theme, setTheme] = useState<Theme>(() =>
    storage.getLocalItem<Theme>('theme', 'light')
  );

  // Zet thema
  useEffect(function syncTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    storage.setLocalItem('theme', theme);
  }, [theme, storage]);

  // Wissel thema
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

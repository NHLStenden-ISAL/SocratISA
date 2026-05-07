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

  const [theme, setTheme] = useState<Theme>(() =>
    storage.get<Theme>('theme', 'light')
  );

  useEffect(function syncTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    storage.set('theme', theme);
  }, [theme, storage]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

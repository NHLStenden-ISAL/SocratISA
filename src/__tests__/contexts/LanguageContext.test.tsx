import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../contexts';
import { StorageProvider } from '../../contexts';
import { MockI18nProvider } from '../helpers/mockI18n';

function TestComponent() {
  const { lang, toggleLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={toggleLang} data-testid="toggle">Wissel</button>
    </div>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => {
    document.documentElement.lang = '';
  });

  it('geeft een fout als useLanguage buiten een provider wordt gebruikt', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useLanguage();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useLanguage moet binnen een LanguageProvider worden gebruikt',
    );

    consoleError.mockRestore();
  });

  it('laadt de initiele taal uit storage', () => {
    const mockStorage = {
      getLocalItem: vi.fn().mockReturnValue('en'),
      setLocalItem: vi.fn(),
      getSessionItem: vi.fn().mockReturnValue(null),
      setSessionItem: vi.fn(),
      removeSessionItem: vi.fn(),
    };

    render(
      <StorageProvider storage={mockStorage}>
        <MockI18nProvider>
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        </MockI18nProvider>
      </StorageProvider>,
    );

    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('wisselt de taal en slaat deze op bij toggle', () => {
    const mockStorage = {
      getLocalItem: vi.fn().mockReturnValue('nl'),
      setLocalItem: vi.fn(),
      getSessionItem: vi.fn().mockReturnValue(null),
      setSessionItem: vi.fn(),
      removeSessionItem: vi.fn(),
    };

    render(
      <StorageProvider storage={mockStorage}>
        <MockI18nProvider>
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        </MockI18nProvider>
      </StorageProvider>,
    );

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(mockStorage.setLocalItem).toHaveBeenCalledWith('lang', 'en');
  });

  it('update document.documentElement.lang bij taalwissel', () => {
    const mockStorage = {
      getLocalItem: vi.fn().mockReturnValue('nl'),
      setLocalItem: vi.fn(),
      getSessionItem: vi.fn().mockReturnValue(null),
      setSessionItem: vi.fn(),
      removeSessionItem: vi.fn(),
    };

    render(
      <StorageProvider storage={mockStorage}>
        <MockI18nProvider>
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        </MockI18nProvider>
      </StorageProvider>,
    );

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(document.documentElement.lang).toBe('en');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme, StorageProvider } from '../../contexts';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle">Wissel</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('geeft een fout als useTheme buiten een provider wordt gebruikt', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useTheme();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useTheme moet binnen een ThemeProvider worden gebruikt',
    );

    consoleError.mockRestore();
  });

  it('laadt het initiele thema uit storage', () => {
    const mockStorage = {
      get: vi.fn().mockReturnValue('dark'),
      set: vi.fn(),
    };

    render(
      <StorageProvider storage={mockStorage}>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </StorageProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('wisselt het thema en slaat het op bij toggle', () => {
    const mockStorage = {
      get: vi.fn().mockReturnValue('light'),
      set: vi.fn(),
    };

    render(
      <StorageProvider storage={mockStorage}>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </StorageProvider>,
    );

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(mockStorage.set).toHaveBeenCalledWith('theme', 'dark');
  });

  it('update data-theme attribuut bij themawissel', () => {
    const mockStorage = {
      get: vi.fn().mockReturnValue('light'),
      set: vi.fn(),
    };

    render(
      <StorageProvider storage={mockStorage}>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </StorageProvider>,
    );

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

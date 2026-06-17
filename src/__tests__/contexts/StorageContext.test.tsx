import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorageProvider, useStorage } from '../../contexts';

function TestComponent() {
  const storage = useStorage();
  storage.setLocalItem('test', 'value');
  const value = storage.getLocalItem('test', 'default');
  return <div data-testid="value">{value}</div>;
}

describe('StorageContext', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('geeft een fout als useStorage buiten een provider wordt gebruikt', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useStorage();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useStorage moet binnen een StorageProvider worden gebruikt',
    );

    consoleError.mockRestore();
  });

  it('geeft de storage service door aan kinderen', () => {
    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>,
    );

    expect(screen.getByTestId('value').textContent).toBe('value');
  });

  it('kan een custom storage injecteren', () => {
    const customStorage = {
      getLocalItem: vi.fn().mockReturnValue('custom'),
      setLocalItem: vi.fn(),
      getSessionItem: vi.fn().mockReturnValue(null),
      setSessionItem: vi.fn(),
      removeSessionItem: vi.fn(),
    };

    function CustomTest() {
      const storage = useStorage();
      const value = storage.getLocalItem('key', 'fallback');
      return <div data-testid="custom">{value}</div>;
    }

    render(
      <StorageProvider storage={customStorage}>
        <CustomTest />
      </StorageProvider>,
    );

    expect(screen.getByTestId('custom').textContent).toBe('custom');
    expect(customStorage.getLocalItem).toHaveBeenCalledWith('key', 'fallback');
  });
});

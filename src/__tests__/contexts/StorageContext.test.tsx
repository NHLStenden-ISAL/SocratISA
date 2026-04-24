import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorageProvider, useStorage } from '../../contexts';

function TestComponent() {
  const storage = useStorage();
  storage.set('test', 'value');
  const value = storage.get('test', 'default');
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
      'useStorage must be used within a StorageProvider',
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
      get: vi.fn().mockReturnValue('custom'),
      set: vi.fn(),
    };

    function CustomTest() {
      const storage = useStorage();
      const value = storage.get('key', 'fallback');
      return <div data-testid="custom">{value}</div>;
    }

    render(
      <StorageProvider storage={customStorage}>
        <CustomTest />
      </StorageProvider>,
    );

    expect(screen.getByTestId('custom').textContent).toBe('custom');
    expect(customStorage.get).toHaveBeenCalledWith('key', 'fallback');
  });
});

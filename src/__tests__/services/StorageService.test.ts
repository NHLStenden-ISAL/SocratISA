import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../../services/StorageService';

describe('StorageService', () => {
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

  describe('get', () => {
    it('haalt een opgeslagen waarde op', () => {
      store['taal'] = JSON.stringify('nl');
      const result = StorageService.get<string>('taal', 'en');
      expect(result).toBe('nl');
    });

    it('geeft de fallback terug als de sleutel ontbreekt', () => {
      const result = StorageService.get<string>('onbekend', 'standaard');
      expect(result).toBe('standaard');
    });

    it('geeft de fallback terug bij ongeldige JSON', () => {
      store['broken'] = 'niet-json';
      const result = StorageService.get<unknown>('broken', 'fallback');
      expect(result).toBe('fallback');
    });

    it('kan objecten ophalen', () => {
      const data = { theme: 'dark', lang: 'nl' };
      store['settings'] = JSON.stringify(data);
      const result = StorageService.get<typeof data>('settings', { theme: 'light', lang: 'en' });
      expect(result).toEqual(data);
    });

    it('geeft de fallback terug bij null waarden in localStorage', () => {
      const result = StorageService.get<string>('niet_aanwezig', 'default');
      expect(result).toBe('default');
    });
  });

  describe('set', () => {
    it('slaat een waarde op', () => {
      StorageService.set('taal', 'en');
      expect(store['taal']).toBe(JSON.stringify('en'));
    });

    it('slaat een object op als JSON', () => {
      const data = { theme: 'dark' };
      StorageService.set('settings', data);
      expect(store['settings']).toBe(JSON.stringify(data));
    });

    it('negeert een fout bij opslaan zonder te loggen', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('Storage error');
        }),
      });

      expect(() => StorageService.set('sleutel', 'waarde')).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});

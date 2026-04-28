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
      store['taal'] = JSON.stringify('NL');
      const result = StorageService.get<string>('taal', 'EN');
      expect(result).toBe('NL');
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
      const data = { theme: 'dark', lang: 'NL' };
      store['settings'] = JSON.stringify(data);
      const result = StorageService.get<typeof data>('settings', { theme: 'light', lang: 'EN' });
      expect(result).toEqual(data);
    });

    it('geeft de fallback terug bij null waarden in localStorage', () => {
      const result = StorageService.get<string>('niet_aanwezig', 'default');
      expect(result).toBe('default');
    });
  });

  describe('set', () => {
    it('slaat een waarde op', () => {
      StorageService.set('taal', 'EN');
      expect(store['taal']).toBe(JSON.stringify('EN'));
    });

    it('slaat een object op als JSON', () => {
      const data = { theme: 'dark' };
      StorageService.set('settings', data);
      expect(store['settings']).toBe(JSON.stringify(data));
    });

    it('logt een waarschuwing bij een quotum-overschrijding', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw error;
        }),
      });

      StorageService.set('groot', 'data');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('logt een waarschuwing bij een algemene fout', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('Storage error');
        }),
      });

      StorageService.set('sleutel', 'waarde');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('StorageService: opslaan van "sleutel" mislukt'),
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../../services/StorageService';

describe('StorageService', () => {
  let localStore: Record<string, string> = {};
  let sessionStore: Record<string, string> = {};

  beforeEach(() => {
    localStore = {};
    sessionStore = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStore[key] = value;
      }),
    });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => sessionStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        sessionStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete sessionStore[key];
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getLocalItem', () => {
    it('haalt een opgeslagen waarde op', () => {
      localStore['taal'] = JSON.stringify('nl');
      const result = StorageService.getLocalItem<string>('taal', 'en');
      expect(result).toBe('nl');
    });

    it('geeft de fallback terug als de sleutel ontbreekt', () => {
      const result = StorageService.getLocalItem<string>('onbekend', 'standaard');
      expect(result).toBe('standaard');
    });

    it('geeft de fallback terug bij ongeldige JSON', () => {
      localStore['broken'] = 'niet-json';
      const result = StorageService.getLocalItem<unknown>('broken', 'fallback');
      expect(result).toBe('fallback');
    });

    it('kan objecten ophalen', () => {
      const data = { theme: 'dark', language: 'nl' };
      localStore['settings'] = JSON.stringify(data);
      const result = StorageService.getLocalItem<typeof data>('settings', { theme: 'light', language: 'en' });
      expect(result).toEqual(data);
    });

    it('geeft de fallback terug bij null waarden in localStorage', () => {
      const result = StorageService.getLocalItem<string>('niet_aanwezig', 'default');
      expect(result).toBe('default');
    });
  });

  describe('setLocalItem', () => {
    it('slaat een waarde op', () => {
      StorageService.setLocalItem('taal', 'en');
      expect(localStore['taal']).toBe(JSON.stringify('en'));
    });

    it('slaat een object op als JSON', () => {
      const data = { theme: 'dark' };
      StorageService.setLocalItem('settings', data);
      expect(localStore['settings']).toBe(JSON.stringify(data));
    });

    it('negeert een fout bij opslaan zonder te loggen', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('Storage error');
        }),
      });

      expect(() => StorageService.setLocalItem('sleutel', 'waarde')).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('sessionStorage', () => {
    it('haalt een session waarde op', () => {
      sessionStore['prompt'] = 'test';
      expect(StorageService.getSessionItem('prompt')).toBe('test');
    });

    it('slaat een session waarde op', () => {
      StorageService.setSessionItem('prompt', 'test');
      expect(sessionStore['prompt']).toBe('test');
    });

    it('verwijdert een session waarde', () => {
      sessionStore['prompt'] = 'test';
      StorageService.removeSessionItem('prompt');
      expect(sessionStore['prompt']).toBeUndefined();
    });
  });
});

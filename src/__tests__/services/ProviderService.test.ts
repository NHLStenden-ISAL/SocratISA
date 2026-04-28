import { describe, it, expect } from 'vitest';
import { ProviderService, PROVIDERS } from '../../services/ProviderService';
import type { Provider } from '../../types';

describe('ProviderService', () => {
  describe('standaard providers', () => {
    it('geeft de standaard providers terug', () => {
      const service = new ProviderService();
      const providers = service.getProviders();

      expect(providers).toHaveLength(3);
      expect(providers.map((p) => p.name)).toEqual([
        'ChatGPT',
        'Claude',
        'Gemini',
      ]);
    });

    it('bouwt een correcte ChatGPT URL', () => {
      const service = new ProviderService();
      const url = service.buildUrl('ChatGPT', 'Hallo wereld');

      expect(url).toBe(
        'https://chat.openai.com/?q=Hallo%20wereld',
      );
    });

    it('bouwt een correcte Claude URL', () => {
      const service = new ProviderService();
      const url = service.buildUrl('Claude', 'Test prompt');

      expect(url).toBe(
        'https://claude.ai/new?q=Test%20prompt',
      );
    });

    it('bouwt een correcte Gemini URL', () => {
      const service = new ProviderService();
      const url = service.buildUrl('Gemini', 'AI vraag');

      expect(url).toBe(
        'https://gemini.google.com/app?q=AI%20vraag',
      );
    });

    it('encodeert speciale tekens correct in de URL', () => {
      const service = new ProviderService();
      const url = service.buildUrl('ChatGPT', 'Hallo & test=ok');

      expect(url).toBe(
        'https://chat.openai.com/?q=Hallo%20%26%20test%3Dok',
      );
    });

    it('gooit een fout bij een onbekende provider', () => {
      const service = new ProviderService();

      expect(() => service.buildUrl('Unknown', 'test')).toThrow(
        'Unknown provider: Unknown',
      );
    });
  });

  describe('custom providers', () => {
    it('accepteert custom providers via de constructor', () => {
      const customProviders: Provider[] = [
        {
          name: 'CustomAI',
          buildUrl: (prompt) => `https://custom.ai/?p=${encodeURIComponent(prompt)}`,
        },
      ];

      const service = new ProviderService(customProviders);
      expect(service.getProviders()).toEqual(customProviders);
    });

    it('gebruikt custom providers voor buildUrl', () => {
      const customProviders: Provider[] = [
        {
          name: 'CustomAI',
          buildUrl: (prompt) => `https://custom.ai/?p=${encodeURIComponent(prompt)}`,
        },
      ];

      const service = new ProviderService(customProviders);
      const url = service.buildUrl('CustomAI', 'test prompt');

      expect(url).toBe('https://custom.ai/?p=test%20prompt');
    });

    it('gooit een fout als een custom provider niet bestaat', () => {
      const service = new ProviderService([]);

      expect(() => service.buildUrl('ChatGPT', 'test')).toThrow(
        'Unknown provider: ChatGPT',
      );
    });
  });

  describe('PROVIDERS constant', () => {
    it('bevat de verwachte standaard providers', () => {
      expect(PROVIDERS).toHaveLength(3);
      expect(PROVIDERS[0].name).toBe('ChatGPT');
      expect(PROVIDERS[1].name).toBe('Claude');
      expect(PROVIDERS[2].name).toBe('Gemini');
    });
  });
});

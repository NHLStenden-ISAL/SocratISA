import { describe, it, expect } from 'vitest';
import { ProviderService, PROVIDERS } from '../../services/ProviderService';
import type { Provider } from '../../types';

describe('ProviderService', () => {
  describe('getProviders', () => {
    it('geeft de standaard providers terug', () => {
      const service = new ProviderService();
      const providers = service.getProviders();

      expect(providers).toHaveLength(4);
      expect(providers.map((p) => p.name)).toEqual([
        'ChatGPT',
        'Claude',
        'Gemini',
        'Copilot',
      ]);
    });

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
  });

  describe('buildUrl', () => {
    it('delegeert naar de provider zijn eigen buildUrl', () => {
      const service = new ProviderService();
      const chatgpt = PROVIDERS.find((p) => p.name === 'ChatGPT')!;
      const url = service.buildUrl(chatgpt, 'Hallo wereld');

      expect(url).toBe('https://chat.openai.com/?q=Hallo%20wereld');
    });

    it('bevat de juiste URL voor elke provider', () => {
      const service = new ProviderService();

      for (const provider of PROVIDERS) {
        const url = service.buildUrl(provider, 'test');
        expect(url).toContain('https://');
        if (provider.clipboardOnly) {
          expect(url).not.toContain(encodeURIComponent('test'));
        } else {
          expect(url).toContain(encodeURIComponent('test'));
        }
      }
    });
  });


});

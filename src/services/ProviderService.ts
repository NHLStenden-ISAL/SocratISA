/**
 * ProviderService: beheert AI-provider configuraties.
 */
import type { Provider, IProviderService } from '../types';

export const PROVIDERS: Provider[] = [
  // ChatGPT met ingevulde prompt 
  {
    name: 'ChatGPT',
    buildUrl: (prompt) =>
      `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`,
  },
  // Claude met ingevulde prompt
  {
    name: 'Claude',
    buildUrl: (prompt) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  // Gemini met prompt naar clipboard
  {
    name: 'Gemini',
    clipboardOnly: true,
    buildUrl: () => 'https://gemini.google.com/app',
  },
  // Copilot met prompt naar clipboard
  {
    name: 'Copilot',
    clipboardOnly: true,
    buildUrl: () => 'https://copilot.microsoft.com/',
  },
];

export class ProviderService implements IProviderService {
  private providers: Provider[];

  constructor(providers: Provider[] = PROVIDERS) {
    this.providers = providers;
  }

  getProviders(): Provider[] {
    return this.providers;
  }

  // Geef link voor gegeven provider
  buildUrl(provider: Provider, prompt: string): string {
    return provider.buildUrl(prompt);
  }
}

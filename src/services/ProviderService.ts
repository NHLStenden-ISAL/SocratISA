/**
 * ProviderService: beheert AI-provider configuraties.
 */
import type { Provider, IProviderService } from '../types';

export const PROVIDERS: Provider[] = [
  {
    name: 'ChatGPT',
    buildUrl: (prompt) =>
      `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'Claude',
    buildUrl: (prompt) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'Gemini',
    clipboardOnly: true,
    buildUrl: () => 'https://gemini.google.com/app',
  },
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

  // Return link voor gegeven provider
  buildUrl(provider: Provider, prompt: string): string {
    return provider.buildUrl(prompt);
  }
}

/**
 * ProviderService: beheert AI-provider configuraties.
 * Single Responsibility: alleen verantwoordelijk voor provider-links.
 */
import type { Provider } from '../types';

/** Standaard AI-providers. */
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
    buildUrl: (prompt) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
];

export class ProviderService {
  private providers: Provider[];

  constructor(providers: Provider[] = PROVIDERS) {
    this.providers = providers;
  }

  getProviders(): Provider[] {
    return this.providers;
  }

  /** Bouw een URL voor een specifieke provider. */
  buildUrl(providerName: string, prompt: string): string {
    const provider = this.providers.find((p) => p.name === providerName);
    if (!provider) throw new Error(`Unknown provider: ${providerName}`);
    return provider.buildUrl(prompt);
  }
}

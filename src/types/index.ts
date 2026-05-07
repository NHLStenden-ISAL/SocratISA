/**
 * Types: barrel export voor alle type-definities.
 */
import type { TranslationKey } from './i18n-keys';

export type {
  ISurveyService,
  IWebLLMService,
  IFallbackService,
  IPromptGeneratorService,
  IProviderService,
  GenerationEvent,
  GenerationStats,
  ProgressInfo,
} from './services';

/** Antwoorden van de Socratische vragenlijst. */
export interface SurveyAnswers {
  subject: string;
  topic: string;
  styleKey: string;
}

/** Opbouw van een survey vraag. */
export interface Question {
  id: string;
  questionKey: TranslationKey;
  descriptionKey: TranslationKey;
  optionKeys?: TranslationKey[];
  type: 'text' | 'select';
}

/** Configuratie voor een AI-provider. */
export interface Provider {
  name: string;
  buildUrl: (prompt: string) => string;
}

/** Taalopties. */
export type Language = 'nl' | 'en';

/** Themaopties. */
export type Theme = 'light' | 'dark';

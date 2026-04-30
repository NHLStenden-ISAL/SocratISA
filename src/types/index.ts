/**
 * Types: centrale type-definities voor SocratISA.
 * Bevat interfaces voor services, antwoorden, en configuratie.
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
export type Language = 'NL' | 'EN';

/** Themaopties. */
export type Theme = 'light' | 'dark';

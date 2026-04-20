/**
 * Types: centrale type-definities voor SocratISA.
 * Bevat interfaces voor services, antwoorden, en configuratie.
 */

/** Antwoorden van de Socratische vragenlijst. */
export interface SurveyAnswers {
  subject: string;
  topic: string;
  styleKey: string;
}

/** Opbouw van een survey vraag. */
export interface Question {
  id: string;
  questionKey: string;
  descriptionKey: string;
  optionKeys?: string[];
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

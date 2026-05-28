export type Language = 'nl' | 'en';

export type LearningStyle =
  | 'survey_option_visual'
  | 'survey_option_step'
  | 'survey_option_conceptual'
  | 'survey_option_practical';

export interface LocalizedText {
  nl: string;
  en: string;
}

export interface BenchmarkTestCase {
  id: string;
  subject: LocalizedText;
  topic: LocalizedText;
  learningStyle: LearningStyle;
  expected: LocalizedText;
}

export interface BenchmarkInput {
  subject: string;
  topic: string;
  learningStyle: LearningStyle;
  expected: string;
}

export interface BenchmarkResult {
  id: string;
  input: BenchmarkInput;
  output: string | null;
  error: string | null;
  durationMs: number;
}



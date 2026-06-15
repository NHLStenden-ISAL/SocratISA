/**
 * services: type-definities voor services.
 */
import type { SurveyAnswers } from '.';

// Service voor het beheren van survey antwoorden.
export interface ISurveyService {
  setAnswer(questionId: string, value: string): void;
  getAnswer(questionId: string): string;
  toSurveyAnswers(): SurveyAnswers;
  reset(): void;
}

export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

// Informatie over de voortgang van AI model ophalen.
export interface ProgressInfo {
  text?: string;
  percentage: number;
  isDownloading: boolean;
  mbFetched?: number;
}

// Service voor WebLLM functionaliteit en modelbeheer.
export interface IWebLLMService {
  canUseWebGPU(): Promise<boolean>;
  detectGPU(): Promise<string | null>;
  preloadModel(onProgress?: (info: ProgressInfo) => void): Promise<void>;
  generatePromptStream(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): AsyncGenerator<string>;
  interruptGenerate(): Promise<void>;
  clearModelCache(): Promise<void>;
  resetEngine(): void;
  getLastCompletionTokens(): number | null;
  setThrottleMs(value: number): void;
}

// Service voor fallback prompt generatie.
export interface IFallbackService {
  generatePrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string;
}

// Event types voor prompt generatie.
export type GenerationEvent =
  | { type: 'progress'; info: ProgressInfo }
  | { type: 'firstToken'; text: string }
  | { type: 'token'; text: string }
  | { type: 'complete'; text: string; stats?: GenerationStats; warning?: string }
  | { type: 'error'; error: Error };

// Statistieken over de AI generatie.
export interface GenerationStats {
  ttft: number;
  totalTime: number;
  tps: number;
  completionTokens?: number;
}

// Service voor het genereren van prompts met events.
export interface IPromptGeneratorService {
  subscribe(listener: (event: GenerationEvent) => void): void;
  unsubscribe(listener: (event: GenerationEvent) => void): void;
  reset(): void;
  start(
    answers: SurveyAnswers,
    gpuAvailable: boolean,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void>;
  preload(
    _translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void>;
  getPreloadStatus(): PreloadStatus;
  abort(): void;
  getCurrentText(): string;
  getIsGenerating(): boolean;
  getIsComplete(): boolean;
  getStats(): GenerationStats | undefined;
  getLastWarning(): string | undefined;
}

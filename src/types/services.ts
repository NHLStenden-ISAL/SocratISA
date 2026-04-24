import type { SurveyAnswers, Provider } from '.';

export interface ISurveyService {
  setAnswer(questionId: string, value: string): void;
  getAnswer(questionId: string): string;
  isComplete(): boolean;
  toSurveyAnswers(): SurveyAnswers;
  reset(): void;
}

export interface IWebLLMService {
  isWebGPUAvailable(): boolean;
  detectGPU(): Promise<string | null>;
  generatePromptStream(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (text: string) => void,
  ): AsyncGenerator<string>;
  interruptGenerate(): Promise<void>;
}

export interface IFallbackService {
  generatePrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string;
}

export type GenerationEvent =
  | { type: 'firstToken'; text: string }
  | { type: 'token'; text: string }
  | { type: 'complete'; text: string }
  | { type: 'error'; error: Error };

export interface IPromptGeneratorService {
  subscribe(listener: (event: GenerationEvent) => void): void;
  unsubscribe(listener: (event: GenerationEvent) => void): void;
  reset(): void;
  start(
    answers: SurveyAnswers,
    gpuAvailable: boolean,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (text: string) => void,
  ): Promise<void>;
  abort(): void;
  getCurrentText(): string;
  getIsGenerating(): boolean;
  getIsComplete(): boolean;
}

export interface IProviderService {
  getProviders(): Provider[];
  buildUrl(providerName: string, prompt: string): string;
}

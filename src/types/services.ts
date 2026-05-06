import type { SurveyAnswers, Provider } from '.';

export interface ISurveyService {
  setAnswer(questionId: string, value: string): void;
  getAnswer(questionId: string): string;
  isComplete(): boolean;
  toSurveyAnswers(): SurveyAnswers;
  reset(): void;
}

export interface ProgressInfo {
  text: string;
  percentage: number;
  isDownloading: boolean;
  mbFetched?: number;
}

export interface IWebLLMService {
  isWebGPUAvailable(): boolean;
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
}

export interface IFallbackService {
  generatePrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string;
}

export type GenerationEvent =
  | { type: 'progress'; info: ProgressInfo }
  | { type: 'firstToken'; text: string }
  | { type: 'token'; text: string }
  | { type: 'complete'; text: string; stats?: GenerationStats }
  | { type: 'error'; error: Error };

export interface GenerationStats {
  ttft: number;
  totalTime: number;
  tps: number;
}

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
  abort(): void;
  getCurrentText(): string;
  getIsGenerating(): boolean;
  getIsComplete(): boolean;
  getStats(): GenerationStats | undefined;
}

export interface IProviderService {
  getProviders(): Provider[];
  buildUrl(providerName: string, prompt: string): string;
}

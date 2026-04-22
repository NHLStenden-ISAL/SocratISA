/**
 * PromptGeneratorService: orkestreert de prompt-generatie.
 * Single Responsibility: coördineren van generatie via WebGPU of fallback,
 * en streamen van tokens naar subscribers.
 */

import type {
  SurveyAnswers,
  IPromptGeneratorService,
  IWebLLMService,
  IFallbackService,
  GenerationEvent,
} from '../types';

export class PromptGeneratorService implements IPromptGeneratorService {
  private webLLMService: IWebLLMService;
  private fallbackService: IFallbackService;
  private listeners = new Set<(event: GenerationEvent) => void>();
  private currentText = '';
  private generating = false;
  private complete = false;
  private abortCtrl: AbortController | null = null;

  constructor(webLLMService: IWebLLMService, fallbackService: IFallbackService) {
    this.webLLMService = webLLMService;
    this.fallbackService = fallbackService;
  }

  subscribe(listener: (event: GenerationEvent) => void): void {
    this.listeners.add(listener);
    if (this.generating && this.currentText) {
      listener({ type: 'token', text: this.currentText });
    } else if (this.complete) {
      listener({ type: 'complete', text: this.currentText });
    }
  }

  unsubscribe(listener: (event: GenerationEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: GenerationEvent): void {
    this.listeners.forEach(l => l(event));
  }

  private cleanOutput(text: string): string {
    return text.replace(/\[EINDE\]|\[END\]/g, '').trim();
  }

  reset(): void {
    this.abort();
    this.currentText = '';
    this.generating = false;
    this.complete = false;
  }

  async start(
    answers: SurveyAnswers,
    gpuAvailable: boolean,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (text: string) => void,
  ): Promise<void> {
    if (this.generating) return;
    this.reset();
    this.generating = true;
    this.abortCtrl = new AbortController();

    try {
      if (gpuAvailable) {
        let firstTokenSent = false;

        for await (const token of this.webLLMService.generatePromptStream(answers, translate, onProgress)) {
          if (this.abortCtrl?.signal.aborted) {
            this.generating = false;
            break;
          }
          this.currentText += token;

          if (!firstTokenSent && this.currentText.trim().length > 0) {
            firstTokenSent = true;
            this.emit({ type: 'firstToken', text: this.currentText });
          } else {
            this.emit({ type: 'token', text: this.currentText });
          }
        }

        if (this.abortCtrl && !this.abortCtrl.signal.aborted) {
          this.currentText = this.cleanOutput(this.currentText);
          this.complete = true;
          this.generating = false;
          this.emit({ type: 'complete', text: this.currentText });
        }
      } else {
        const raw = this.fallbackService.generatePrompt(answers, translate);
        this.currentText = raw;
        this.emit({ type: 'firstToken', text: this.currentText });
        this.emit({ type: 'token', text: this.currentText });
        this.complete = true;
        this.generating = false;
        this.emit({ type: 'complete', text: this.currentText });
      }
    } catch (err) {
      if (this.abortCtrl && !this.abortCtrl.signal.aborted) {
        console.warn('PromptGeneratorService: generatie mislukt, fallback wordt gebruikt', err);
        try {
          const raw = this.fallbackService.generatePrompt(answers, translate);
          this.currentText = raw;
          this.emit({ type: 'firstToken', text: this.currentText });
          this.emit({ type: 'token', text: this.currentText });
          this.complete = true;
          this.generating = false;
          this.emit({ type: 'complete', text: this.currentText });
        } catch (fallbackErr) {
          this.generating = false;
          this.emit({ type: 'error', error: fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)) });
        }
      }
    }
  }

  abort(): void {
    this.abortCtrl?.abort();
    this.abortCtrl = null;
  }

  getCurrentText(): string {
    return this.currentText;
  }

  getIsGenerating(): boolean {
    return this.generating;
  }

  getIsComplete(): boolean {
    return this.complete;
  }
}

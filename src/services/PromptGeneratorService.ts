/**
 * PromptGeneratorService: Beheert de prompt-generatie status en statistieken.
 */
import type {
  SurveyAnswers,
  IPromptGeneratorService,
  IWebLLMService,
  IFallbackService,
  GenerationEvent,
  GenerationStats,
  ProgressInfo,
} from '../types';

export class PromptGeneratorService implements IPromptGeneratorService {
  private webLLMService: IWebLLMService;
  private fallbackService: IFallbackService;
  private listeners = new Set<(event: GenerationEvent) => void>();
  private currentText = '';
  private lastProgress: ProgressInfo | null = null;
  private generating = false;
  private complete = false;
  private abortCtrl: AbortController | null = null;
  private startTime = 0;
  private firstTokenTime = 0;
  private tokenCount = 0;
  private gpuUsed = false;
  private lastStats: GenerationStats | undefined = undefined;
  private lastWarning: string | undefined = undefined;

  constructor(webLLMService: IWebLLMService, fallbackService: IFallbackService) {
    this.webLLMService = webLLMService;
    this.fallbackService = fallbackService;
  }

  // Beheert AI generatie status 
  subscribe(listener: (event: GenerationEvent) => void): void {
    this.listeners.add(listener);
    if (this.generating && this.lastProgress !== null) {
      listener({ type: 'progress', info: this.lastProgress });
    }

    if (this.generating && this.currentText) {
      const displayText = this.stripThinkTag(this.currentText);
      listener({ type: 'token', text: displayText });
    } else if (this.complete) {
      listener({ type: 'complete', text: this.currentText, stats: this.lastStats, warning: this.lastWarning });
    }
  }

  unsubscribe(listener: (event: GenerationEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: GenerationEvent): void {
    this.listeners.forEach(l => l(event));
  }

  // Verwijder de begin aan einde tags van de resultaat prompt
  private cleanOutput(text: string): string {
    const cleaned = this.stripThinkTag(text);
    return cleaned.replace(/\[EINDE\]|\[END\]/g, '').trim();
  }

  private stripThinkTag(text: string): string {
    const closeIdx = text.lastIndexOf('</think>');
    if (closeIdx === -1) {
      return text.replace(/<\/?think>/g, '').trim();
    }
    return text.substring(closeIdx + '</think>'.length).trim();
  }

  reset(): void {
    this.abort();
    this.currentText = '';
    this.lastProgress = null;
    this.generating = false;
    this.complete = false;
    this.startTime = 0;
    this.firstTokenTime = 0;
    this.tokenCount = 0;
    this.gpuUsed = false;
    this.lastStats = undefined;
    this.lastWarning = undefined;
  }

  // Haal AI model op in de achtergrond
  async preload(
    _translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void> {
    const wrappedOnProgress = (info: ProgressInfo) => {
      this.lastProgress = info;
      onProgress?.(info);
      this.emit({ type: 'progress', info });
    };
    await this.webLLMService.preloadModel(wrappedOnProgress);
  }

  // Start prompt generatie met de gegeven survey-antwoord
  async start(
    answers: SurveyAnswers,
    gpuAvailable: boolean,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void> {
    if (this.generating) return;
    this.reset();
    this.generating = true;
    this.startTime = performance.now();
    this.firstTokenTime = 0;
    this.tokenCount = 0;
    this.gpuUsed = gpuAvailable;
    const abortCtrl = new AbortController();
    this.abortCtrl = abortCtrl;

    try {
      // Maak prompt met/zonder AI model gebaseerd op WebGPU beschikbaarheid 
      if (gpuAvailable) {
        await this.startGpuGeneration(answers, translate, abortCtrl, onProgress);
      } else {
        this.runFallbackGeneration(answers, translate);
      }
    } catch (err) {
      if (!abortCtrl.signal.aborted) {
        await this.handleGenerationError(err, answers, translate);
      }
    } finally {
      if (this.abortCtrl === abortCtrl) {
        this.abortCtrl = null;
      }
    }
  }

  // Genereer prompt met AI model token voor token
  private async startGpuGeneration(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    abortCtrl: AbortController,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void> {
    let firstTokenSent = false;

    const wrappedOnProgress = (info: ProgressInfo) => {
      this.lastProgress = info;
      onProgress?.(info);
      this.emit({ type: 'progress', info });
    };

    for await (const token of this.webLLMService.generatePromptStream(answers, translate, wrappedOnProgress)) {
      if (abortCtrl.signal.aborted) {
        this.generating = false;
        break;
      }
      this.currentText += token;

      const displayText = this.stripThinkTag(this.currentText);

      if (displayText.length === 0) continue;

      if (!firstTokenSent) {
        firstTokenSent = true;
        this.firstTokenTime = performance.now();
        this.emit({ type: 'firstToken', text: displayText });
      } else {
        this.tokenCount += 1;
        this.emit({ type: 'token', text: displayText });
      }
    }

    if (!abortCtrl.signal.aborted) {
      this.currentText = this.cleanOutput(this.currentText);
      this.complete = true;
      this.generating = false;
      this.lastStats = this.buildStats();
      this.emit({ type: 'complete', text: this.currentText, stats: this.lastStats });
    }
  }

  // Maak prompt met template
  private runFallbackGeneration(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    warning?: string,
  ): void {
    const raw = this.fallbackService.generatePrompt(answers, translate);
    this.currentText = this.cleanOutput(raw);
    this.firstTokenTime = performance.now();
    this.emit({ type: 'firstToken', text: this.currentText });
    this.emit({ type: 'token', text: this.currentText });
    this.lastWarning = warning;
    this.complete = true;
    this.generating = false;
    this.emit({ type: 'complete', text: this.currentText, warning });
  }

  private async handleGenerationError(
    err: unknown,
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
  ): Promise<void> {
    console.warn('PromptGeneratorService: GPU generatie mislukt, valt terug naar fallback', err);
    this.webLLMService.resetEngine();
    let warning: string | undefined = 'memory_warning';

    try {
      this.runFallbackGeneration(answers, translate, warning);
    } catch (fallbackErr) {
      this.generating = false;
      this.emit({ type: 'error', error: fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)) });
    }
  }

  abort(): void {
    if (!this.abortCtrl) {
      return;
    }

    this.abortCtrl.abort();
    this.generating = false;
    this.complete = false;
    void this.webLLMService.interruptGenerate();
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

  getStats(): GenerationStats | undefined {
    return this.lastStats;
  }

  getLastWarning(): string | undefined {
    return this.lastWarning;
  }

  // Bereken totale tijd/generatie tijd/tijd tot eerste token/tokens per seconden
  private buildStats(): GenerationStats | undefined {
    if (!this.gpuUsed) return undefined;

    const completeTime = performance.now();
    const totalTime = completeTime - this.startTime;
    const ttft = this.firstTokenTime ? this.firstTokenTime - this.startTime : totalTime;
    const generationDuration = this.firstTokenTime
      ? (completeTime - this.firstTokenTime) / 1000
      : totalTime / 1000;
    const tps = generationDuration > 0 ? Math.round(this.tokenCount / generationDuration) : 0;
    return { ttft: Math.round(ttft), totalTime: Math.round(totalTime), tps };
  }
}

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
  PreloadStatus,
} from '../types';

export class PromptGeneratorService implements IPromptGeneratorService {
  private webLLMService: IWebLLMService;
  private fallbackService: IFallbackService;
  private listeners = new Set<(event: GenerationEvent) => void>();
  private currentText = '';
  private lastProgress: ProgressInfo | null = null;
  private generating = false;
  private complete = false;
  private abortController: AbortController | null = null;
  private startTime = 0;
  private firstTokenTime = 0;
  private streamChunkCount = 0;
  private usedModel = false;
  private lastStats: GenerationStats | undefined = undefined;
  private lastWarning: string | undefined = undefined;
  private preloadStatus: PreloadStatus = 'idle';

  constructor(webLLMService: IWebLLMService, fallbackService: IFallbackService) {
    this.webLLMService = webLLMService;
    this.fallbackService = fallbackService;
  }

  // Zet listeners voor generatie events en geeft state door
  subscribe(listener: (event: GenerationEvent) => void): void {
    this.listeners.add(listener);
    if (this.generating && this.lastProgress !== null) {
      listener({ type: 'progress', info: this.lastProgress });
    }

    if (this.generating && this.currentText) {
      const displayText = this.stripThinkSection(this.currentText);
      listener({ type: 'token', text: displayText });
    } else if (this.complete) {
      listener({ type: 'complete', text: this.currentText, stats: this.lastStats, warning: this.lastWarning });
    }
  }

  unsubscribe(listener: (event: GenerationEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: GenerationEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private emitProgress(info: ProgressInfo, onProgress?: (info: ProgressInfo) => void): void {
    this.lastProgress = info;
    onProgress?.(info);
    this.emit({ type: 'progress', info });
  }

  private completeGeneration(text: string, stats?: GenerationStats, warning?: string): void {
    this.currentText = text;
    this.lastStats = stats;
    this.lastWarning = warning;
    this.complete = true;
    this.generating = false;
    this.emit({ type: 'complete', text: this.currentText, stats: this.lastStats, warning: this.lastWarning });
  }

  // Verwijder de reasoning en einde tags van de resultaat prompt
  private cleanOutput(text: string): string {
    const cleaned = this.stripThinkSection(text);
    return cleaned.replace(/\[EINDE\]|\[END\]/g, '').trim();
  }

  private stripThinkSection(text: string): string {
    const closingThinkTagIndex = text.lastIndexOf('</think>');
    if (closingThinkTagIndex === -1) {
      const openingThinkTagIndex = text.indexOf('<think>');
      return openingThinkTagIndex === -1
        ? text.replace(/<\/?think>/g, '').trim()
        : text.substring(0, openingThinkTagIndex).trim();
    }
    return text.substring(closingThinkTagIndex + '</think>'.length).trim();
  }

  reset(): void {
    this.abort();
    this.currentText = '';
    this.lastProgress = null;
    this.generating = false;
    this.complete = false;
    this.startTime = 0;
    this.firstTokenTime = 0;
    this.streamChunkCount = 0;
    this.usedModel = false;
    this.lastStats = undefined;
    this.lastWarning = undefined;
  }

  // Haal AI model op in de achtergrond
  async preloadModel(onProgress?: (info: ProgressInfo) => void): Promise<void> {
    if (this.preloadStatus === 'loading') return;
    this.preloadStatus = 'loading';
    const wrappedOnProgress = (info: ProgressInfo) => this.emitProgress(info, onProgress);
    try {
      await this.webLLMService.preloadModel(wrappedOnProgress);
      this.preloadStatus = 'ready';
      wrappedOnProgress({ percentage: 100, isDownloading: false });
    } catch (error) {
      this.preloadStatus = 'error';
      wrappedOnProgress({ percentage: 0, isDownloading: false });
      throw error;
    }
  }

  getPreloadStatus(): PreloadStatus {
    return this.preloadStatus;
  }

  // Start prompt generatie met de gegeven survey-antwoord
  async start(
    answers: SurveyAnswers,
    canUseModel: boolean,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void> {
    if (this.generating) return;
    this.reset();
    this.generating = true;
    this.startTime = performance.now();
    this.firstTokenTime = 0;
    this.streamChunkCount = 0;
    this.usedModel = canUseModel;
    const abortController = new AbortController();
    this.abortController = abortController;

    try {
      // Maak prompt met/zonder AI model gebaseerd op gebruiker keuze
      if (canUseModel) {
        await this.startModelGeneration(answers, translate, abortController, onProgress);
      } else {
        this.runFallbackGeneration(answers, translate);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        await this.handleGenerationError(error, answers, translate);
      }
    } finally {
      if (this.abortController === abortController) {
        this.abortController = null;
      }
    }
  }

  // Genereer prompt met AI model token voor token
  private async startModelGeneration(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    abortController: AbortController,
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void> {
    let firstTokenSent = false;

    const wrappedOnProgress = (info: ProgressInfo) => this.emitProgress(info, onProgress);

    for await (const token of this.webLLMService.generatePromptStream(answers, translate, wrappedOnProgress)) {
      if (abortController.signal.aborted) {
        this.generating = false;
        break;
      }
      this.currentText += token;

      const displayText = this.stripThinkSection(this.currentText);

      if (displayText.length === 0) continue;

      if (!firstTokenSent) {
        firstTokenSent = true;
        this.firstTokenTime = performance.now();
        this.emit({ type: 'firstToken', text: displayText });
      } else {
        this.streamChunkCount += 1;
        this.emit({ type: 'token', text: displayText });
      }
    }

    if (!abortController.signal.aborted) {
      const text = this.cleanOutput(this.currentText);
      const stats = this.buildStats(this.webLLMService.getLastCompletionTokens() ?? undefined);
      this.completeGeneration(text, stats);
      this.webLLMService.resetEngine();
    }
  }

  // Maak prompt met template
  private runFallbackGeneration(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    warning?: string,
  ): void {
    const fallbackPrompt = this.fallbackService.generatePrompt(answers, translate);
    this.completeGeneration(this.cleanOutput(fallbackPrompt), undefined, warning);
  }

  // Reset de engine bij error en probeer opnieuw met fallback
  private async handleGenerationError(
    error: unknown,
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
  ): Promise<void> {
    console.warn('PromptGeneratorService: model generatie mislukt, valt terug naar fallback', error);
    this.webLLMService.resetEngine();
    const warning: string | undefined = 'memory_warning';

    try {
      this.runFallbackGeneration(answers, translate, warning);
    } catch (fallbackError) {
      this.generating = false;
      this.emit({ type: 'error', error: fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)) });
    }
  }

  abort(): void {
    if (!this.abortController) {
      return;
    }

    this.abortController.abort();
    this.generating = false;
    this.complete = false;
    void this.webLLMService.interruptGenerate();
    this.webLLMService.resetEngine();
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
  private buildStats(completionTokens?: number): GenerationStats | undefined {
    if (!this.usedModel) return undefined;

    const completeTime = performance.now();
    const totalTime = completeTime - this.startTime;
    const ttft = this.firstTokenTime ? this.firstTokenTime - this.startTime : totalTime;
    const generationDuration = this.firstTokenTime
      ? (completeTime - this.firstTokenTime) / 1000
      : totalTime / 1000;
    const tps = generationDuration > 0 ? Math.round(this.streamChunkCount / generationDuration) : 0;
    return { ttft: Math.round(ttft), totalTime: Math.round(totalTime), tps, completionTokens };
  }
}

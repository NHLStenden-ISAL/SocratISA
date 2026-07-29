/**
 * WebLLMService: lokale AI promptgeneratie via Transformers.js en WebGPU.
 */
import type {
  InterruptableStoppingCriteria,
  TextGenerationPipeline,
} from '@huggingface/transformers';
import type { SurveyAnswers, IWebLLMService, ProgressInfo } from '../types';
import { getStyleHintKey } from '../utils/styleHints';

const MODEL_ID = 'onnx-community/Qwen3.5-4B-ONNX';
const MODEL_DTYPE = 'q4';

type TransformersProgress =
  | { status: 'initiate' | 'download' | 'done'; loaded?: number; total?: number; progress?: number }
  | { status: 'progress' | 'progress_total'; loaded: number; total: number; progress: number }
  | { status: 'ready' };

export class WebLLMService implements IWebLLMService {
  private static generator: TextGenerationPipeline | null = null;
  private static generatorPromise: Promise<TextGenerationPipeline> | null = null;
  private static stoppingCriteria: InterruptableStoppingCriteria | null = null;
  private static clearingCache = false;
  private static modelCompatible: boolean | null = null;
  static streamDelayMs = 0;
  private lastCompletionTokens: number | null = null;

  // Controleer of het gebruikers apparaat mogelijk het model kan gebruiken
  async canUseModel(): Promise<boolean> {
    if (WebLLMService.modelCompatible !== null) return WebLLMService.modelCompatible;

    try {
      type NavGPU = { gpu: { requestAdapter(options?: { powerPreference: string }): Promise<unknown | null> } };
      const adapter = await (navigator as unknown as NavGPU).gpu.requestAdapter({ powerPreference: 'high-performance' });
      WebLLMService.modelCompatible = adapter !== null;
      return WebLLMService.modelCompatible;
    } catch {
      WebLLMService.modelCompatible = false;
      return false;
    }
  }

  // Haal GPU naam op
  async detectGPU(): Promise<string | null> {
    try {
      type NavGPU = { gpu: { requestAdapter(options?: { powerPreference: string }): Promise<{ info: { description?: string; device?: string } } | null> } };
      const adapter = await (navigator as unknown as NavGPU).gpu.requestAdapter({ powerPreference: 'high-performance' });

      if (!adapter) return null;

      const name = adapter.info.description || adapter.info.device;
      return name || null;
    } catch {
      return null;
    }
  }

  static getModelId(): string {
    return MODEL_ID;
  }

  setStreamDelayMs(value: number): void {
    WebLLMService.streamDelayMs = value;
  }

  // Initialiseer het AI model in de achtergrond
  async preloadModel(onProgress?: (info: ProgressInfo) => void): Promise<void> {
    if (!WebLLMService.isReadyForUse()) {
      throw new Error('Transformers.js is bezig met cache wissen');
    }

    if (WebLLMService.modelCompatible === null) {
      await this.canUseModel();
    }

    if (!WebLLMService.modelCompatible) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (WebLLMService.generator) {
      onProgress?.({ percentage: 100, isDownloading: false });
      return;
    }

    if (WebLLMService.generatorPromise) {
      WebLLMService.generator = await WebLLMService.generatorPromise;
      onProgress?.({ percentage: 100, isDownloading: false });
      return;
    }

    WebLLMService.generator = await WebLLMService.createGenerator(onProgress);
  }

  // Lazy load en configureer de Transformers.js generator
  private static async createGenerator(
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<TextGenerationPipeline> {
    const transformers = await import('@huggingface/transformers');
    WebLLMService.generatorPromise = transformers.pipeline(
      'text-generation',
      MODEL_ID,
      {
        device: 'webgpu',
        dtype: MODEL_DTYPE,
        progress_callback: (report) => {
          const progress = WebLLMService.parseProgressReport(report as TransformersProgress);
          if (progress) onProgress?.(progress);
        },
      },
    );

    try {
      return await WebLLMService.generatorPromise;
    } catch (error) {
      WebLLMService.generator = null;
      throw error;
    } finally {
      WebLLMService.generatorPromise = null;
    }
  }

  // Bereken progressie van AI model ophalen
  private static parseProgressReport(report: TransformersProgress): ProgressInfo | null {
    if (report.status === 'ready') {
      return { percentage: 100, isDownloading: false };
    }

    if (report.status !== 'progress_total') return null;

    return {
      percentage: Math.round(report.progress),
      isDownloading: true,
      fetchedMegabytes: Math.round(report.loaded / 1024 / 1024),
    };
  }

  private static isReadyForUse(): boolean {
    return !WebLLMService.clearingCache;
  }

  // Verwijder het geselecteerde model uit de browser cache
  async clearModelCache(): Promise<void> {
    if (WebLLMService.clearingCache) return;

    WebLLMService.clearingCache = true;

    try {
      await WebLLMService.disposeGenerator();
      WebLLMService.modelCompatible = null;

      if (typeof caches !== 'undefined') {
        const { env } = await import('@huggingface/transformers');
        const cache = await caches.open(env.cacheKey);
        const requests = await cache.keys();
        await Promise.all(
          requests
            .filter((request) => decodeURIComponent(request.url).includes(MODEL_ID))
            .map((request) => cache.delete(request)),
        );
      }
    } finally {
      WebLLMService.clearingCache = false;
    }
  }

  getLastCompletionTokens(): number | null {
    return this.lastCompletionTokens;
  }

  // Stop huidige generatie
  async interruptGenerate(): Promise<void> {
    WebLLMService.stoppingCriteria?.interrupt();
  }

  // Ontlaad de generator
  resetEngine(): void {
    void WebLLMService.disposeGenerator();
  }

  private static async disposeGenerator(): Promise<void> {
    const generator = WebLLMService.generator;
    WebLLMService.generator = null;
    WebLLMService.generatorPromise = null;
    WebLLMService.stoppingCriteria = null;
    if (generator) await generator.dispose();
  }

  // Maak de systeem prompt met alle survey antwoorden
  private buildSystemPrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string {
    const styleHintKey = getStyleHintKey(answers.styleKey);
    return translate('webllm_system_prompt', {
      subject: answers.subject,
      topic: answers.topic,
      styleHint: translate(styleHintKey),
    });
  }

  // Genereer de prompt
  async *generatePromptStream(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): AsyncGenerator<string> {
    if (!WebLLMService.isReadyForUse()) {
      throw new Error('Transformers.js is bezig met cache wissen');
    }

    if (WebLLMService.modelCompatible === null) {
      await this.canUseModel();
    }

    if (!WebLLMService.modelCompatible) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (!WebLLMService.generator) {
      onProgress?.({ text: translate('webllm_progress_loading'), percentage: 0, isDownloading: false });
      if (WebLLMService.generatorPromise) {
        WebLLMService.generator = await WebLLMService.generatorPromise;
      } else {
        WebLLMService.generator = await WebLLMService.createGenerator(onProgress);
      }
    }

    const generator = WebLLMService.generator;
    if (!generator) {
      throw new Error('Transformers.js generator niet geladen');
    }

    onProgress?.({ text: translate('webllm_progress_generating'), percentage: 0, isDownloading: false });

    const transformers = await import('@huggingface/transformers');
    const stoppingCriteria = new transformers.InterruptableStoppingCriteria();
    WebLLMService.stoppingCriteria = stoppingCriteria;
    this.lastCompletionTokens = 0;

    const chunks: string[] = [];
    let wakeQueue: (() => void) | null = null;
    let generationComplete = false;
    let generationError: unknown;

    const wake = () => {
      wakeQueue?.();
      wakeQueue = null;
    };

    const streamer = new transformers.TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text) => {
        if (text) chunks.push(text);
        wake();
      },
      token_callback_function: (tokens) => {
        this.lastCompletionTokens = (this.lastCompletionTokens ?? 0) + tokens.length;
      },
    });

    const systemPrompt = this.buildSystemPrompt(answers, translate);
    const userMessage = translate('webllm_user_message', {
      subject: answers.subject,
      topic: answers.topic,
    });

    const generation = generator(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      {
        max_new_tokens: 1500,
        do_sample: true,
        temperature: 0.4,
        repetition_penalty: 1.05,
        streamer,
        stopping_criteria: [stoppingCriteria],
        tokenizer_encode_kwargs: { enable_thinking: false },
      },
    ).catch((error: unknown) => {
      generationError = error;
    }).finally(() => {
      generationComplete = true;
      wake();
    });

    try {
      while (!generationComplete || chunks.length > 0) {
        if (chunks.length === 0) {
          await new Promise<void>((resolve) => {
            wakeQueue = resolve;
          });
          continue;
        }

        const chunk = chunks.shift();
        if (chunk) yield chunk;

        if (WebLLMService.streamDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, WebLLMService.streamDelayMs));
        }
      }

      await generation;
      if (generationError) throw generationError;
    } finally {
      if (WebLLMService.stoppingCriteria === stoppingCriteria) {
        WebLLMService.stoppingCriteria = null;
      }
    }
  }
}

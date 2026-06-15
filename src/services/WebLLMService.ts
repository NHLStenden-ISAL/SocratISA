/**
 * WebLLMService: lokale AI promptgeneratie via WebGPU.
 */
import type * as webllm from '@mlc-ai/web-llm';
import type { SurveyAnswers, IWebLLMService, ProgressInfo } from '../types';
import { getStyleHintKey } from '../utils/styleHints';

// Gebruikte model
const MODEL_ID = 'Qwen3.5-4B-q4f32_1-MLC';

// Model definitie
const APP_CONFIG: webllm.AppConfig = {
  model_list: [
    {
      model: 'https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f32_1-MLC',
      model_id: MODEL_ID,
      model_lib:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_83/base/Qwen3.5-4B-q4f32_1_cs1k-webgpu.wasm',
      // Zo laag mogelijk voor verminderen van VRAM gebruik
      overrides: {
        context_window_size: 2048,
        max_history_size: 1,
      },
    },
  ],
};

export class WebLLMService implements IWebLLMService {
  private static engine: webllm.MLCEngine | null = null;
  private static enginePromise: Promise<webllm.MLCEngine> | null = null;
  private static clearingCache = false;
  private static gpuAvailable: boolean | null = null;
  static throttleMs = 0;
  private lastCompletionTokens: number | null = null;

  // Controleer of WebGPU bruikbaar is
  async canUseWebGPU(): Promise<boolean> {
    if (WebLLMService.gpuAvailable !== null) return WebLLMService.gpuAvailable;

    try {
      type NavGPU = { gpu: { requestAdapter(options?: { powerPreference: string }): Promise<unknown | null> } };
      const adapter = await (navigator as unknown as NavGPU).gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) {
        WebLLMService.gpuAvailable = false;
        return false;
      }

      const limits = (adapter as { limits: { maxStorageBuffersPerShaderStage: number } }).limits;
      if (limits.maxStorageBuffersPerShaderStage < 10) {
        WebLLMService.gpuAvailable = false;
        return false;
      }

      WebLLMService.gpuAvailable = true;
      return true;
    } catch {
      WebLLMService.gpuAvailable = false;
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

  setThrottleMs(value: number): void {
    WebLLMService.throttleMs = value;
  }

  // Initialiseer AI model in achtergrond
  async preloadModel(onProgress?: (info: ProgressInfo) => void): Promise<void> {
    if (!WebLLMService.isAvailableForUse()) {
      throw new Error('WebLLM is bezig met cache wissen');
    }

    if (WebLLMService.gpuAvailable === null) {
      await this.canUseWebGPU();
    }

    if (!WebLLMService.gpuAvailable) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (WebLLMService.engine) {
      onProgress?.({ percentage: 100, isDownloading: false });
      return;
    }

    if (WebLLMService.enginePromise) {
      await WebLLMService.enginePromise;
      onProgress?.({ percentage: 100, isDownloading: false });
      return;
    }

    await WebLLMService.createEngine(onProgress);
  }

  // Initialiseer WebLLM
  private static async createEngine(
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<void> {
    const webllmModule = await import('@mlc-ai/web-llm');
    WebLLMService.enginePromise = webllmModule.CreateMLCEngine(MODEL_ID, {
      appConfig: APP_CONFIG,
      logLevel: 'ERROR',
      initProgressCallback: (report) => {
        onProgress?.(WebLLMService.parseProgressReport(report));
      },
    });

    try {
      WebLLMService.engine = await WebLLMService.enginePromise;
    } catch (err) {
      WebLLMService.enginePromise = null;
      WebLLMService.engine = null;
      throw err;
    }
    WebLLMService.enginePromise = null;
  }

  // Bereken progressie van AI model ophalen
  private static parseProgressReport(report: { text: string; progress: number }): ProgressInfo {
    const rawText = report.text || '';
    const pct = Math.round(report.progress * 100);
    const isDownloading = rawText.startsWith('Fetching param cache');
    const mbMatch = rawText.match(/(\d+)MB/);
    const mbFetched = mbMatch ? parseInt(mbMatch[1], 10) : undefined;

    return { percentage: pct, isDownloading, mbFetched };
  }

  private static isAvailableForUse(): boolean {
    return !WebLLMService.clearingCache;
  }

  // Verwijder model uit browser cache
  async clearModelCache(): Promise<void> {
    if (WebLLMService.clearingCache) return;

    WebLLMService.clearingCache = true;

    try {
      if (WebLLMService.engine) {
        try {
          await WebLLMService.engine.unload();
        } catch (err) {
          console.warn('WebLLMService: engine unload bij cache wissen:', err);
        }
        WebLLMService.engine = null;
      }
      WebLLMService.enginePromise = null;
      WebLLMService.gpuAvailable = null;

      const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
      await deleteModelAllInfoInCache(MODEL_ID, APP_CONFIG);
    } finally {
      WebLLMService.clearingCache = false;
    }
  }

  getLastCompletionTokens(): number | null {
    return this.lastCompletionTokens;
  }

  // Stop huidige generatie
  async interruptGenerate(): Promise<void> {
    if (WebLLMService.engine) {
      await WebLLMService.engine.interruptGenerate();
    }
  }

  resetEngine(): void {
    const engine = WebLLMService.engine;
    WebLLMService.engine = null;
    WebLLMService.enginePromise = null;
    if (engine) {
      void engine.unload();
    }
  }

  // Maak de systeem prompt met alle survey-antwoorden
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
    if (!WebLLMService.isAvailableForUse()) {
      throw new Error('WebLLM is bezig met cache wissen');
    }

    if (WebLLMService.gpuAvailable === null) {
      await this.canUseWebGPU();
    }

    if (!WebLLMService.gpuAvailable) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (!WebLLMService.engine) {
      if (WebLLMService.enginePromise) {
        onProgress?.({ text: translate('webllm_progress_loading'), percentage: 0, isDownloading: false });
        await WebLLMService.enginePromise;
      } else {
        onProgress?.({ text: translate('webllm_progress_loading'), percentage: 0, isDownloading: false });
        await WebLLMService.createEngine(onProgress);
      }
    }

    if (!WebLLMService.engine) {
      throw new Error('WebLLM engine niet geladen');
    }

    await WebLLMService.engine.resetChat();

    onProgress?.({ text: translate('webllm_progress_generating'), percentage: 0, isDownloading: false });

    const systemPrompt = this.buildSystemPrompt(answers, translate);

    const userMessage = translate('webllm_user_message', {
      subject: answers.subject,
      topic: answers.topic,
    });

    // Stream generatie met optionele buffer tussen chunks
    const stream = await WebLLMService.engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userMessage}\n\n<think>\n\n</think>\n\n` },
      ],
      temperature: 0.4,
      max_tokens: 1500,
      repetition_penalty: 1.05,
      stop: ['[EINDE]', '[END]'],
      stream: true,
      stream_options: { include_usage: true },
      enable_thinking: false,
    } as webllm.ChatCompletionRequestStreaming);

    this.lastCompletionTokens = null;
    for await (const chunk of stream) {
      if (chunk.usage) {
        this.lastCompletionTokens = chunk.usage.completion_tokens ?? null;
      }

      const content = chunk.choices[0]?.delta?.content ?? '';
      if (content) yield content;

      if (WebLLMService.throttleMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, WebLLMService.throttleMs));
      }
    }
  }
}

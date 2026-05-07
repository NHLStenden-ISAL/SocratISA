/**
 * WebLLMService: lokale AI promptgeneratie via WebGPU.
 */
import type * as webllm from '@mlc-ai/web-llm';
import type { SurveyAnswers, IWebLLMService, ProgressInfo } from '../types';

// Gebruikte model
const MODEL_ID = 'Qwen3.5-4B-q4f32_1-MLC';

const APP_CONFIG: webllm.AppConfig = {
  model_list: [
    {
      model: 'https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f32_1-MLC',
      model_id: MODEL_ID,
      model_lib:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_83/base/Qwen3.5-4B-q4f32_1_cs1k-webgpu.wasm',
      overrides: {
        context_window_size: 4096,
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

  // Check (integrated) GPU naam en ondersteuning met WebGPU
  static isWebGPUAvailable(): boolean {
    if (WebLLMService.gpuAvailable !== null) return WebLLMService.gpuAvailable;
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  isWebGPUAvailable(): boolean {
    return WebLLMService.isWebGPUAvailable();
  }

  private static isHardwareAdapter(adapter: unknown): boolean {
    try {
      type AdapterWithInfo = { info?: { vendor?: string; architecture?: string; device?: string; description?: string } };
      const info = (adapter as AdapterWithInfo).info;
      if (!info) return true;
      const fields = [info.vendor, info.architecture, info.device, info.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (/swiftshader|subzero|llvmpipe|softpipe/.test(fields)) return false;
      return true;
    } catch {
      return true;
    }
  }

  static async canUseWebGPU(): Promise<boolean> {
    if (WebLLMService.gpuAvailable !== null) return WebLLMService.gpuAvailable;
    if (!WebLLMService.isWebGPUAvailable()) return false;
    try {
      type NavGPU = { gpu: { requestAdapter(): Promise<unknown | null> } };
      const adapter = await (navigator as unknown as NavGPU).gpu.requestAdapter();
      if (!adapter) {
        WebLLMService.gpuAvailable = false;
        return false;
      }
      const hardware = WebLLMService.isHardwareAdapter(adapter);
      WebLLMService.gpuAvailable = hardware;
      return hardware;
    } catch {
      WebLLMService.gpuAvailable = false;
      return false;
    }
  }

  async canUseWebGPU(): Promise<boolean> {
    return WebLLMService.canUseWebGPU();
  }

  static async detectGPU(): Promise<string | null> {
    try {
      type NavGPU = { gpu: { requestAdapter(): Promise<{ info?: { description?: string; device?: string; vendor?: string; architecture?: string } } | null> } };
      if ((navigator as unknown as NavGPU).gpu) {
        const adapter = await (navigator as unknown as NavGPU).gpu.requestAdapter();
        if (adapter?.info) {
          const i = adapter.info;
          const name = i.description || i.device || [i.vendor, i.architecture].filter(Boolean).join(' ') || '';
          if (name) return name.toUpperCase();
        }
      }
    } catch (gpuErr) {
      console.warn('WebLLMService: kon GPU niet detecteren:', gpuErr);
    }
    return null;
  }

  async detectGPU(): Promise<string | null> {
    return WebLLMService.detectGPU();
  }

  static resetGpuCache(): void {
    WebLLMService.gpuAvailable = null;
  }

  static getModelId(): string {
    return MODEL_ID;
  }

  // Initialiseer AI model in achtergrond
  async preloadModel(onProgress?: (info: ProgressInfo) => void): Promise<void> {
    if (!WebLLMService.isAvailableForUse()) {
      throw new Error('WebLLM is bezig met cache wissen');
    }
    if (!WebLLMService.isWebGPUAvailable()) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (WebLLMService.engine) {
      onProgress?.({ text: 'Model already loaded', percentage: 100, isDownloading: false });
      return;
    }

    if (WebLLMService.enginePromise) {
      await WebLLMService.enginePromise;
      onProgress?.({ text: 'Model already loaded', percentage: 100, isDownloading: false });
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
      initProgressCallback: (report) => {
        onProgress?.(WebLLMService.parseProgressReport(report));
      },
    });

    WebLLMService.engine = await WebLLMService.enginePromise;
    WebLLMService.enginePromise = null;
  }

  // Bereken progressie van AI model ophalen
  private static parseProgressReport(report: { text: string; progress: number }): ProgressInfo {
    const rawText = report.text || '';
    const pct = Math.round(report.progress * 100);
    const isDownloading = rawText.startsWith('Fetching param cache');
    const mbMatch = rawText.match(/(\d+)MB/);
    const mbFetched = mbMatch ? parseInt(mbMatch[1], 10) : undefined;

    return {
      text: isDownloading ? 'Downloading model' : 'Retrieving from cache',
      percentage: pct,
      isDownloading,
      mbFetched,
    };
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

  // Stop huidige generatie
  async interruptGenerate(): Promise<void> {
    if (WebLLMService.engine) {
      await WebLLMService.engine.interruptGenerate();
    }
  }

  // Pak meerkeuze antwoord en maak de systeem prompt met alle survey-antwoorden
  private getStyleHintKey(styleKey: string): string {
    const map: Record<string, string> = {
      survey_option_visual: 'style_hint_visual',
      survey_option_step: 'style_hint_step',
      survey_option_conceptual: 'style_hint_conceptual',
      survey_option_practical: 'style_hint_practical',
    };
    return map[styleKey] || 'style_hint_default';
  }

  private buildSystemPrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string {
    const styleHintKey = this.getStyleHintKey(answers.styleKey);
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
    if (!WebLLMService.isWebGPUAvailable()) {
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

    // Stream generatie met optionele buffer
    const stream = await WebLLMService.engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userMessage}\n\n<think>\n\n</think>\n\n` },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      stop: ['[EINDE]', '[END]'],
      stream: true,
      enable_thinking: false,
    } as webllm.ChatCompletionRequestStreaming);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      if (content) yield content;
      if (WebLLMService.throttleMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, WebLLMService.throttleMs));
      }
    }
  }
}

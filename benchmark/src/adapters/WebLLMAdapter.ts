/**
 * WebLLMAdapter: lokale AI promptgeneratie via WebGPU.
 */
import type * as webllm from '@mlc-ai/web-llm';
import { benchmarkConfig } from '../config/config';
import { buildMessages } from '../utils/prompts';
import type { BenchmarkTestCase, Language } from '../types';

const MODEL_ID = benchmarkConfig.model;

export class WebLLMAdapter {
  private static engine: webllm.MLCEngine | null = null;
  private static enginePromise: Promise<webllm.MLCEngine> | null = null;
  private static clearingCache = false;
  private static modelCompatible: boolean | null = null;

  // Controleer of WebGPU bruikbaar is
  async canUseModel(): Promise<boolean> {
    if (WebLLMAdapter.modelCompatible !== null) return WebLLMAdapter.modelCompatible;

    try {
      type NavGPU = { gpu: { requestAdapter(): Promise<unknown | null> } };
      const webGpuAdapter = await (navigator as unknown as NavGPU).gpu.requestAdapter();
      if (!webGpuAdapter) {
        WebLLMAdapter.modelCompatible = false;
        return false;
      }

      // Minimum nodig om mogelijk het model te laden
      const limits = (webGpuAdapter as { limits: { maxStorageBuffersPerShaderStage: number } }).limits;
      if (limits.maxStorageBuffersPerShaderStage < 10) {
        WebLLMAdapter.modelCompatible = false;
        return false;
      }

      WebLLMAdapter.modelCompatible = true;
      return true;
    } catch {
      WebLLMAdapter.modelCompatible = false;
      return false;
    }
  }

  // Initialiseer AI model in achtergrond
  async preloadModel(onProgress?: (text: string) => void): Promise<void> {
    if (!WebLLMAdapter.isReadyForUse()) {
      throw new Error('WebLLM is bezig met cache wissen');
    }

    if (WebLLMAdapter.modelCompatible === null) {
      await this.canUseModel();
    }

    if (!WebLLMAdapter.modelCompatible) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (WebLLMAdapter.engine) return;

    if (WebLLMAdapter.enginePromise) {
      await WebLLMAdapter.enginePromise;
      return;
    }

    const webllmModule = await import('@mlc-ai/web-llm');
    WebLLMAdapter.enginePromise = webllmModule.CreateMLCEngine(MODEL_ID, {
      logLevel: 'ERROR',
      initProgressCallback: (report) => {
        onProgress?.(report.text ?? '');
      },
    });

    try {
      WebLLMAdapter.engine = await WebLLMAdapter.enginePromise;
    } catch (error) {
      WebLLMAdapter.enginePromise = null;
      WebLLMAdapter.engine = null;
      throw error;
    }
    WebLLMAdapter.enginePromise = null;
  }

  private static isReadyForUse(): boolean {
    return !WebLLMAdapter.clearingCache;
  }

  // Verwijder model uit browser cache
  async clearModelCache(): Promise<void> {
    if (WebLLMAdapter.clearingCache) return;

    WebLLMAdapter.clearingCache = true;

    try {
      await this.unloadEngine();
      WebLLMAdapter.enginePromise = null;
      WebLLMAdapter.modelCompatible = null;

      const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
      await deleteModelAllInfoInCache(MODEL_ID);
    } finally {
      WebLLMAdapter.clearingCache = false;
    }
  }

  async unloadEngine(): Promise<void> {
    const engine = WebLLMAdapter.engine;
    WebLLMAdapter.engine = null;
    WebLLMAdapter.enginePromise = null;

    if (engine) {
      await engine.unload();
    }
  }

  // Genereer de prompt
  async generate(testCase: BenchmarkTestCase, language: Language): Promise<{ output: string; durationMs: number }> {
    if (!WebLLMAdapter.isReadyForUse()) {
      throw new Error('WebLLM is bezig met cache wissen');
    }

    if (WebLLMAdapter.modelCompatible === null) {
      await this.canUseModel();
    }

    if (!WebLLMAdapter.modelCompatible) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (!WebLLMAdapter.engine) {
      if (WebLLMAdapter.enginePromise) {
        await WebLLMAdapter.enginePromise;
      } else {
        const webllmModule = await import('@mlc-ai/web-llm');
        WebLLMAdapter.enginePromise = webllmModule.CreateMLCEngine(MODEL_ID, {
          logLevel: 'ERROR',
        });
        WebLLMAdapter.engine = await WebLLMAdapter.enginePromise;
        WebLLMAdapter.enginePromise = null;
      }
    }

    if (!WebLLMAdapter.engine) {
      throw new Error('WebLLM engine niet geladen');
    }

    await WebLLMAdapter.engine.resetChat();

    const messages = buildMessages(testCase, language);
    const start = performance.now();

    const completion = await WebLLMAdapter.engine.chat.completions.create({
      messages: [
        { role: 'system', content: messages.system },
        { role: 'user', content: `${messages.user}\n\n<think>\n\n</think>\n\n` },
      ],
      temperature: 0.4,
      max_tokens: 1500,
      repetition_penalty: 1.05,
      stop: ['[EINDE]', '[END]'],
      stream: false,
      enable_thinking: false,
    } as webllm.ChatCompletionRequestNonStreaming);

    return {
      output: completion.choices[0]?.message.content ?? '',
      durationMs: Math.round(performance.now() - start),
    };
  }
}

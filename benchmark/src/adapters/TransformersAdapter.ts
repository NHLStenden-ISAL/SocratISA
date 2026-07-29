/**
 * TransformersAdapter: lokale AI promptgeneratie via Transformers.js en WebGPU.
 */
import type { TextGenerationPipeline } from '@huggingface/transformers';
import { benchmarkConfig, benchmarkModels, type BenchmarkDtype } from '../config/config';
import { buildMessages } from '../utils/prompts';
import type { BenchmarkTestCase, Language } from '../types';

type LoadProgress = {
  status: string;
  progress?: number;
  loaded?: number;
  total?: number;
  file?: string;
};

export class TransformersAdapter {
  private generator: TextGenerationPipeline | null = null;
  private generatorPromise: Promise<TextGenerationPipeline> | null = null;
  private clearingCache = false;
  private modelCompatible: boolean | null = null;

  constructor(
    private readonly modelId = benchmarkConfig.model,
    private readonly dtype: BenchmarkDtype = benchmarkConfig.dtype,
  ) {}

  // Controleer of het gebruikers apparaat WebGPU kan gebruiken
  async canUseModel(): Promise<boolean> {
    if (this.modelCompatible !== null) return this.modelCompatible;

    try {
      type NavGPU = { gpu: { requestAdapter(): Promise<unknown | null> } };
      const webGpuAdapter = await (navigator as unknown as NavGPU).gpu.requestAdapter();
      this.modelCompatible = webGpuAdapter !== null;
      return this.modelCompatible;
    } catch {
      this.modelCompatible = false;
      return false;
    }
  }

  // Laad AI model voordat de benchmark start
  async preloadModel(onProgress?: (text: string) => void): Promise<void> {
    if (this.clearingCache) {
      throw new Error('Transformers.js is bezig met cache wissen');
    }

    if (this.modelCompatible === null) {
      await this.canUseModel();
    }

    if (!this.modelCompatible) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (this.generator) return;

    if (this.generatorPromise) {
      this.generator = await this.generatorPromise;
      return;
    }

    const transformers = await import('@huggingface/transformers');
    this.generatorPromise = transformers.pipeline('text-generation', this.modelId, {
      device: 'webgpu',
      dtype: this.dtype,
      progress_callback: (report) => {
        const progress = report as LoadProgress;
        if (progress.status === 'progress_total') {
          onProgress?.(`Model laden ${Math.round(progress.progress ?? 0)} procent`);
        } else if (progress.status === 'ready') {
          onProgress?.('Model geladen');
        } else if (progress.file) {
          onProgress?.(`Modelbestand laden: ${progress.file}`);
        }
      },
    });

    try {
      this.generator = await this.generatorPromise;
    } catch (error) {
      this.generator = null;
      throw error;
    } finally {
      this.generatorPromise = null;
    }
  }

  // Verwijder het geselecteerde model uit de browser cache
  async clearModelCache(): Promise<void> {
    if (this.clearingCache) return;

    this.clearingCache = true;

    try {
      await this.unloadEngine();
      this.modelCompatible = null;

      if (typeof caches !== 'undefined') {
        const { env } = await import('@huggingface/transformers');
        const cache = await caches.open(env.cacheKey);
        const requests = await cache.keys();
        await Promise.all(
          requests
            .filter((request) => decodeURIComponent(request.url).includes(this.modelId))
            .map((request) => cache.delete(request)),
        );
      }
    } finally {
      this.clearingCache = false;
    }
  }

  async unloadEngine(): Promise<void> {
    const generator = this.generator;
    this.generator = null;
    this.generatorPromise = null;
    if (generator) await generator.dispose();
  }

  // Genereer benchmark prompt en meet hoe lang dit duurt
  async generate(testCase: BenchmarkTestCase, language: Language): Promise<{ output: string; durationMs: number }> {
    if (this.clearingCache) {
      throw new Error('Transformers.js is bezig met cache wissen');
    }

    if (this.modelCompatible === null) {
      await this.canUseModel();
    }

    if (!this.modelCompatible) {
      throw new Error('WebGPU niet beschikbaar');
    }

    if (!this.generator) {
      await this.preloadModel();
    }

    if (!this.generator) {
      throw new Error('Transformers.js generator niet geladen');
    }

    const messages = buildMessages(testCase, language);
    const modelConfig = benchmarkModels.find((model) => model.id === this.modelId);
    const start = performance.now();

    const completion = await this.generator(
      [
        { role: 'system', content: messages.system },
        { role: 'user', content: messages.user },
      ],
      {
        max_new_tokens: 1500,
        do_sample: true,
        temperature: 0.4,
        repetition_penalty: 1.05,
        tokenizer_encode_kwargs: { enable_thinking: modelConfig?.enableThinking ?? false },
      },
    );

    const generatedText = completion[0]?.generated_text;
    const assistantContent = typeof generatedText === 'string'
      ? generatedText
      : generatedText?.at(-1)?.content;
    const output = typeof assistantContent === 'string'
      ? assistantContent
      : assistantContent?.map((part) => part.type === 'text' ? part.text : '').join('') ?? '';

    return {
      output,
      durationMs: Math.round(performance.now() - start),
    };
  }
}

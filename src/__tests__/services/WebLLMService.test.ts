import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { pipeline } from '@huggingface/transformers';
import { WebLLMService } from '../../services/WebLLMService';

vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  env: { cacheKey: 'transformers-cache' },
  TextStreamer: class MockTextStreamer {
    callback_function: (text: string) => void;
    token_callback_function: (tokens: bigint[]) => void;

    constructor(_tokenizer: unknown, options: {
      callback_function: (text: string) => void;
      token_callback_function: (tokens: bigint[]) => void;
    }) {
      this.callback_function = options.callback_function;
      this.token_callback_function = options.token_callback_function;
    }
  },
  InterruptableStoppingCriteria: class MockStoppingCriteria {
    interrupt = vi.fn();
  },
}));

const mockPipeline = pipeline as unknown as Mock;

type MockStreamer = {
  callback_function(text: string): void;
  token_callback_function(tokens: bigint[]): void;
};

type MockGenerator = Mock & {
  tokenizer: object;
  dispose: Mock;
};

type WebLLMServiceState = {
  generator: MockGenerator | null;
  generatorPromise: Promise<MockGenerator> | null;
  stoppingCriteria: { interrupt(): void } | null;
  clearingCache: boolean;
  modelCompatible: boolean | null;
  streamDelayMs: number;
};

function state() {
  return WebLLMService as unknown as WebLLMServiceState;
}

function createGenerator(chunks: string[] = []): MockGenerator {
  const generator = vi.fn(async (_messages: unknown, options: { streamer?: MockStreamer }) => {
    for (const chunk of chunks) {
      options.streamer?.token_callback_function([1n]);
      options.streamer?.callback_function(chunk);
    }
    return [{ generated_text: [] }];
  }) as MockGenerator;
  generator.tokenizer = {};
  generator.dispose = vi.fn().mockResolvedValue(undefined);
  return generator;
}

const answers = { subject: 'A', topic: 'B', styleKey: 'survey_option_visual' };
const t = vi.fn((key: string) => key);

describe('WebLLMService met Transformers.js', () => {
  let service: WebLLMService;
  let generator: MockGenerator;

  beforeEach(() => {
    service = new WebLLMService();
    generator = createGenerator();
    state().generator = null;
    state().generatorPromise = null;
    state().stoppingCriteria = null;
    state().clearingCache = false;
    state().modelCompatible = null;
    WebLLMService.streamDelayMs = 0;
    mockPipeline.mockReset();
    mockPipeline.mockResolvedValue(generator);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('canUseModel', () => {
    it('geeft false terug als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});
      await expect(service.canUseModel()).resolves.toBe(false);
    });

    it('geeft true terug als WebGPU een adapter oplevert', async () => {
      vi.stubGlobal('navigator', {
        gpu: { requestAdapter: vi.fn().mockResolvedValue({}) },
      });
      await expect(service.canUseModel()).resolves.toBe(true);
    });

    it('gebruikt de gecachete WebGPU status', async () => {
      const requestAdapter = vi.fn().mockResolvedValue({});
      vi.stubGlobal('navigator', { gpu: { requestAdapter } });

      await service.canUseModel();
      await service.canUseModel();

      expect(requestAdapter).toHaveBeenCalledOnce();
    });
  });

  describe('detectGPU', () => {
    it('geeft de GPU naam terug', async () => {
      vi.stubGlobal('navigator', {
        gpu: { requestAdapter: vi.fn().mockResolvedValue({ info: { description: 'RTX 4090' } }) },
      });
      await expect(service.detectGPU()).resolves.toBe('RTX 4090');
    });

    it('valt terug op device en daarna null', async () => {
      const requestAdapter = vi.fn()
        .mockResolvedValueOnce({ info: { device: 'Apple M1' } })
        .mockResolvedValueOnce(null);
      vi.stubGlobal('navigator', { gpu: { requestAdapter } });

      await expect(service.detectGPU()).resolves.toBe('Apple M1');
      await expect(service.detectGPU()).resolves.toBeNull();
    });
  });

  describe('preloadModel', () => {
    it('laadt de geselecteerde q4 pipeline via WebGPU', async () => {
      state().modelCompatible = true;

      await service.preloadModel();

      expect(mockPipeline).toHaveBeenCalledWith(
        'text-generation',
        WebLLMService.getModelId(),
        expect.objectContaining({ device: 'webgpu', dtype: 'q4' }),
      );
      expect(state().generator).toBe(generator);
    });

    it('geeft totale downloadvoortgang door', async () => {
      state().modelCompatible = true;
      mockPipeline.mockImplementation(async (_task: string, _model: string, options: {
        progress_callback(report: unknown): void;
      }) => {
        options.progress_callback({
          status: 'progress_total',
          progress: 42,
          loaded: 44_040_192,
          total: 104_857_600,
        });
        options.progress_callback({
          status: 'progress',
          progress: 5,
          loaded: 5_242_880,
          total: 104_857_600,
        });
        return generator;
      });
      const onProgress = vi.fn();

      await service.preloadModel(onProgress);

      expect(onProgress).toHaveBeenCalledOnce();
      expect(onProgress).toHaveBeenCalledWith({
        percentage: 42,
        isDownloading: true,
        fetchedMegabytes: 42,
      });
    });

    it('wacht op een bestaande laadactie', async () => {
      state().modelCompatible = true;
      state().generatorPromise = Promise.resolve(generator);
      const onProgress = vi.fn();

      await service.preloadModel(onProgress);

      expect(state().generator).toBe(generator);
      expect(mockPipeline).not.toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith({ percentage: 100, isDownloading: false });
    });

    it('reset de laadstatus als pipeline aanmaken mislukt', async () => {
      state().modelCompatible = true;
      mockPipeline.mockRejectedValue(new Error('laden mislukt'));

      await expect(service.preloadModel()).rejects.toThrow('laden mislukt');
      expect(state().generator).toBeNull();
      expect(state().generatorPromise).toBeNull();
    });
  });

  describe('generatePromptStream', () => {
    it('streamt tekst en telt completion tokens', async () => {
      generator = createGenerator(['Hallo', ' wereld']);
      state().generator = generator;
      state().modelCompatible = true;
      const chunks: string[] = [];

      for await (const chunk of service.generatePromptStream(answers, t)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hallo', ' wereld']);
      expect(service.getLastCompletionTokens()).toBe(2);
      expect(generator).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({
          max_new_tokens: 1500,
          tokenizer_encode_kwargs: { enable_thinking: false },
        }),
      );
    });

    it('laadt het model wanneer generatie direct start', async () => {
      state().modelCompatible = true;
      const onProgress = vi.fn();

      const chunks: string[] = [];
      for await (const chunk of service.generatePromptStream(answers, t, onProgress)) {
        chunks.push(chunk);
      }

      expect(mockPipeline).toHaveBeenCalledOnce();
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ text: 'webllm_progress_loading' }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ text: 'webllm_progress_generating' }));
    });

    it('gooit een fout zonder WebGPU', async () => {
      vi.stubGlobal('navigator', {});
      const stream = service.generatePromptStream(answers, t);
      await expect(stream.next()).rejects.toThrow('WebGPU niet beschikbaar');
    });

    it('geeft pipeline fouten door', async () => {
      state().modelCompatible = true;
      generator = createGenerator();
      generator.mockRejectedValue(new Error('generatie mislukt'));
      state().generator = generator;
      const stream = service.generatePromptStream(answers, t);

      await expect(stream.next()).rejects.toThrow('generatie mislukt');
    });
  });

  describe('modelbeheer', () => {
    it('onderbreekt de actieve stopping criteria', async () => {
      const stoppingCriteria = { interrupt: vi.fn() };
      state().stoppingCriteria = stoppingCriteria;

      await service.interruptGenerate();

      expect(stoppingCriteria.interrupt).toHaveBeenCalledOnce();
    });

    it('ontlaadt de generator bij reset', () => {
      state().generator = generator;

      service.resetEngine();

      expect(state().generator).toBeNull();
      expect(generator.dispose).toHaveBeenCalledOnce();
    });

    it('wist alleen bestanden van het geselecteerde model', async () => {
      const deleteCachedRequest = vi.fn().mockResolvedValue(true);
      const cache = {
        keys: vi.fn().mockResolvedValue([
          { url: `https://example.test/models/${WebLLMService.getModelId()}/onnx/model_q4.onnx` },
          { url: 'https://example.test/models/other/model_q4.onnx' },
        ]),
        delete: deleteCachedRequest,
      };
      vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) });
      state().generator = generator;
      state().modelCompatible = true;

      await service.clearModelCache();

      expect(generator.dispose).toHaveBeenCalledOnce();
      expect(deleteCachedRequest).toHaveBeenCalledOnce();
      expect(state().modelCompatible).toBeNull();
      expect(state().clearingCache).toBe(false);
    });
  });
});

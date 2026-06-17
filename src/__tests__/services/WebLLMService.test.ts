import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { WebLLMService } from '../../services/WebLLMService';
import { CreateMLCEngine, deleteModelAllInfoInCache } from '@mlc-ai/web-llm';

vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(),
  deleteModelAllInfoInCache: vi.fn().mockResolvedValue(undefined),
}));

const mockCreateMLCEngine = CreateMLCEngine as unknown as Mock;

const mockDeleteCache = deleteModelAllInfoInCache as unknown as Mock;

type WebLLMServiceState = {
  engine: unknown | null;
  enginePromise: Promise<unknown> | null;
  clearingCache: boolean;
  modelCompatible: boolean | null;
  streamDelayMs: number;
};

function state() {
  return WebLLMService as unknown as WebLLMServiceState;
}

function createEngine(overrides: Record<string, unknown> = {}) {
  return {
    interruptGenerate: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn().mockResolvedValue(undefined),
    resetChat: vi.fn().mockResolvedValue(undefined),
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    ...overrides,
  };
}

describe('WebLLMService', () => {
  let service: WebLLMService;

  beforeEach(() => {
    service = new WebLLMService();
    state().engine = null;
    state().enginePromise = null;
    state().clearingCache = false;
    state().modelCompatible = null;
    WebLLMService.streamDelayMs = 0;
    mockCreateMLCEngine.mockReset();
    mockCreateMLCEngine.mockResolvedValue(createEngine());
    mockDeleteCache.mockClear();
    mockDeleteCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('canUseModel', () => {
    it('geeft false terug als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});
      const result = await service.canUseModel();
      expect(result).toBe(false);
    });

    it('geeft true terug als een adapter voldoet aan de minimale limieten', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            limits: { maxStorageBuffersPerShaderStage: 10 },
          }),
        },
      });
      const result = await service.canUseModel();
      expect(result).toBe(true);
    });

    it('gebruikt de gecachete WebGPU status zonder opnieuw te meten', async () => {
      const requestAdapter = vi.fn().mockResolvedValue({
        limits: { maxStorageBuffersPerShaderStage: 10 },
      });
      vi.stubGlobal('navigator', { gpu: { requestAdapter } });

      await expect(service.canUseModel()).resolves.toBe(true);
      requestAdapter.mockResolvedValue(null);

      await expect(service.canUseModel()).resolves.toBe(true);
      expect(requestAdapter).toHaveBeenCalledOnce();
    });

    it('geeft false terug als requestAdapter null retourneert', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
      });
      const result = await service.canUseModel();
      expect(result).toBe(false);
    });

    it('geeft false terug als requestAdapter een fout gooit', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU error')),
        },
      });
      const result = await service.canUseModel();
      expect(result).toBe(false);
    });

    it('geeft false terug als de adapter onvoldoende storage buffers heeft', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            limits: { maxStorageBuffersPerShaderStage: 8 },
          }),
        },
      });
      const result = await service.canUseModel();
      expect(result).toBe(false);
    });
  });

  describe('detectGPU', () => {
    it('geeft de GPU naam terug uit description', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: { description: 'NVIDIA GeForce RTX 4090' },
          }),
        },
      });
      const result = await service.detectGPU();
      expect(result).toBe('NVIDIA GeForce RTX 4090');
    });

    it('geeft de GPU naam terug uit device als description ontbreekt', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: { device: 'Apple M1' },
          }),
        },
      });
      const result = await service.detectGPU();
      expect(result).toBe('Apple M1');
    });

    it('geeft null terug als er geen GPU info beschikbaar is', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: {},
          }),
        },
      });
      const result = await service.detectGPU();
      expect(result).toBeNull();
    });

    it('geeft null terug als requestAdapter geen adapter oplevert', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
      });
      const result = await service.detectGPU();
      expect(result).toBeNull();
    });

    it('geeft null terug bij een fout', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU detection failed')),
        },
      });
      const result = await service.detectGPU();
      expect(result).toBeNull();
    });

    it('geeft null terug als navigator.gpu ontbreekt', async () => {
      vi.stubGlobal('navigator', {});
      const result = await service.detectGPU();
      expect(result).toBeNull();
    });
  });

  describe('generatePromptStream', () => {
    const answers = { subject: 'A', topic: 'B', styleKey: 'survey_option_visual' };
    const t = vi.fn((key: string) => key);

    it('gooit een fout als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});

      const generator = service.generatePromptStream(answers, t);
      await expect(generator.next()).rejects.toThrow('WebGPU niet beschikbaar');
    });

    it('gooit een fout als cache wissen bezig is', async () => {
      state().clearingCache = true;

      const generator = service.generatePromptStream(answers, t);
      await expect(generator.next()).rejects.toThrow('WebLLM is bezig met cache wissen');
    });

    it('gooit een fout als een bestaande engine promise geen engine beschikbaar maakt', async () => {
      state().modelCompatible = true;
      state().enginePromise = Promise.resolve(createEngine());
      const onProgress = vi.fn();

      const generator = service.generatePromptStream(answers, t, onProgress);
      await expect(generator.next()).rejects.toThrow('WebLLM engine niet geladen');
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ text: 'webllm_progress_loading' }));
    });

    it('wacht tussen chunks als throttling aan staat', async () => {
      vi.useFakeTimers();
      async function* stream() {
        yield { choices: [{ delta: { content: 'A' } }] };
        yield { choices: [{ delta: { content: 'B' } }] };
      }
      const engine = createEngine({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(stream()),
          },
        },
      });
      state().modelCompatible = true;
      state().engine = engine;
      WebLLMService.streamDelayMs = 25;

      const generator = service.generatePromptStream(answers, t);
      await expect(generator.next()).resolves.toEqual({ value: 'A', done: false });
      const next = generator.next();
      await vi.advanceTimersByTimeAsync(25);
      await expect(next).resolves.toEqual({ value: 'B', done: false });
    });
  });

  describe('interruptGenerate', () => {
    it('doet niets als er geen engine is', async () => {
      await expect(service.interruptGenerate()).resolves.toBeUndefined();
    });

    it('onderbreekt generatie als er een engine is', async () => {
      const engine = createEngine();
      state().engine = engine;

      await service.interruptGenerate();

      expect(engine.interruptGenerate).toHaveBeenCalledOnce();
    });
  });

  describe('resetEngine', () => {
    it('ontlaadt de bestaande engine', () => {
      const engine = createEngine();
      state().engine = engine;
      state().enginePromise = Promise.resolve(engine);

      service.resetEngine();

      expect(state().engine).toBeNull();
      expect(state().enginePromise).toBeNull();
      expect(engine.unload).toHaveBeenCalledOnce();
    });

    it('werkt ook zonder bestaande engine', () => {
      service.resetEngine();

      expect(state().engine).toBeNull();
      expect(state().enginePromise).toBeNull();
    });
  });

  describe('clearModelCache', () => {
    it('doet niets als cache wissen al bezig is', async () => {
      state().clearingCache = true;

      await service.clearModelCache();

      expect(deleteModelAllInfoInCache).not.toHaveBeenCalled();
    });

    it('wist de modelcache en reset de status', async () => {
      state().modelCompatible = true;

      await service.clearModelCache();

      expect(deleteModelAllInfoInCache).toHaveBeenCalledOnce();
      expect(state().modelCompatible).toBeNull();
      expect(state().clearingCache).toBe(false);
    });

    it('gaat door als engine unload mislukt', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const engine = createEngine({ unload: vi.fn().mockRejectedValue(new Error('unload mislukt')) });
      state().engine = engine;

      await service.clearModelCache();

      expect(warnSpy).toHaveBeenCalled();
      expect(deleteModelAllInfoInCache).toHaveBeenCalledOnce();
      expect(state().engine).toBeNull();
    });
  });

  describe('preloadModel', () => {
    it('gooit een fout als cache wissen bezig is', async () => {
      state().clearingCache = true;

      await expect(service.preloadModel()).rejects.toThrow('WebLLM is bezig met cache wissen');
    });

    it('gooit een fout als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});
      await expect(service.preloadModel()).rejects.toThrow('WebGPU niet beschikbaar');
    });

    it('roept onProgress aan als model al geladen is', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            limits: { maxStorageBuffersPerShaderStage: 10 },
            info: { description: 'NVIDIA GeForce RTX 4090' },
          }),
        },
      });
      const onProgress = vi.fn();
      await service.preloadModel(onProgress);
      await service.preloadModel(onProgress);
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ percentage: 100, isDownloading: false }));
    });

    it('wacht op een bestaande engine promise', async () => {
      state().modelCompatible = true;
      const engine = createEngine();
      state().enginePromise = Promise.resolve(engine);
      const onProgress = vi.fn();

      await service.preloadModel(onProgress);

      expect(onProgress).toHaveBeenCalledWith({ percentage: 100, isDownloading: false });
      expect(mockCreateMLCEngine).not.toHaveBeenCalled();
    });

    it('geeft download progress door vanuit WebLLM', async () => {
      state().modelCompatible = true;
      mockCreateMLCEngine.mockImplementation(async (_modelId: string, options: { initProgressCallback?: (report: unknown) => void } | undefined) => {
        options?.initProgressCallback?.({ text: 'Fetching param cache 42MB', progress: 0.42, timeElapsed: 0 });
        return createEngine();
      });
      const onProgress = vi.fn();

      await service.preloadModel(onProgress);

      expect(onProgress).toHaveBeenCalledWith({ percentage: 42, isDownloading: true, fetchedMegabytes: 42 });
    });

    it('geeft niet downloadende progress zonder megabytes door', async () => {
      state().modelCompatible = true;
      mockCreateMLCEngine.mockImplementation(async (_modelId: string, options: { initProgressCallback?: (report: unknown) => void } | undefined) => {
        options?.initProgressCallback?.({ text: '', progress: 0.1, timeElapsed: 0 });
        return createEngine();
      });
      const onProgress = vi.fn();

      await service.preloadModel(onProgress);

      expect(onProgress).toHaveBeenCalledWith({ percentage: 10, isDownloading: false, fetchedMegabytes: undefined });
    });

    it('reset engine state als engine aanmaken mislukt', async () => {
      state().modelCompatible = true;
      mockCreateMLCEngine.mockRejectedValue(new Error('create mislukt'));

      await expect(service.preloadModel()).rejects.toThrow('create mislukt');
      expect(state().engine).toBeNull();
      expect(state().enginePromise).toBeNull();
    });
  });
});

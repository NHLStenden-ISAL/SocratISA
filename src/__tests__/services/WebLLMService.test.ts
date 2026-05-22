import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebLLMService } from '../../services/WebLLMService';

vi.mock('@mlc-ai/web-llm', () => {
  const mockReload = vi.fn().mockResolvedValue(undefined);
  const mockUnload = vi.fn().mockResolvedValue(undefined);
  const mockInterruptGenerate = vi.fn();
  const mockResetChat = vi.fn().mockResolvedValue(undefined);
  const mockChatCreate = vi.fn().mockResolvedValue({});

  class MockMLCEngine {
    reload = mockReload;
    unload = mockUnload;
    interruptGenerate = mockInterruptGenerate;
    resetChat = mockResetChat;
    chat = { completions: { create: mockChatCreate } };
  }

  return {
    CreateMLCEngine: vi.fn().mockResolvedValue({ interruptGenerate: vi.fn() }),
    MLCEngine: MockMLCEngine,
    deleteModelAllInfoInCache: vi.fn().mockResolvedValue(undefined),
  };
});

describe('WebLLMService', () => {
  let service: WebLLMService;

  beforeEach(() => {
    service = new WebLLMService();
    (WebLLMService as unknown as { gpuAvailable: boolean | null }).gpuAvailable = null;
  });

  describe('canUseWebGPU', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('geeft false terug als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});
      const result = await service.canUseWebGPU();
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
      const result = await service.canUseWebGPU();
      expect(result).toBe(true);
    });

    it('geeft false terug als requestAdapter null retourneert', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
      });
      const result = await service.canUseWebGPU();
      expect(result).toBe(false);
    });

    it('geeft false terug als requestAdapter een fout gooit', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU error')),
        },
      });
      const result = await service.canUseWebGPU();
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
      const result = await service.canUseWebGPU();
      expect(result).toBe(false);
    });

  });

  describe('detectGPU', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('geeft de GPU-naam terug uit description', async () => {
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

    it('geeft de GPU-naam terug uit device als description ontbreekt', async () => {
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

    it('geeft null terug als er geen GPU-info beschikbaar is', async () => {
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
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('gooit een fout als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});
      const translate = vi.fn((key: string) => key);
      const answers = { subject: 'A', topic: 'B', styleKey: 'survey_option_visual' };

      const generator = service.generatePromptStream(answers, translate);
      await expect(generator.next()).rejects.toThrow('WebGPU niet beschikbaar');
    });
  });

  describe('interruptGenerate', () => {
    it('doet niets als er geen engine is', async () => {
      await expect(service.interruptGenerate()).resolves.toBeUndefined();
    });
  });

  describe('preloadModel', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
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

  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebLLMService } from '../../services/WebLLMService';

vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn().mockResolvedValue({ interruptGenerate: vi.fn() }),
}));

describe('WebLLMService', () => {
  let service: WebLLMService;

  beforeEach(() => {
    service = new WebLLMService();
  });

  describe('isWebGPUAvailable', () => {
    it('geeft true terug als navigator.gpu bestaat', () => {
      vi.stubGlobal('navigator', { gpu: {} });
      expect(WebLLMService.isWebGPUAvailable()).toBe(true);
      expect(service.isWebGPUAvailable()).toBe(true);
      vi.unstubAllGlobals();
    });

    it('geeft false terug als navigator.gpu ontbreekt', () => {
      vi.stubGlobal('navigator', {});
      expect(WebLLMService.isWebGPUAvailable()).toBe(false);
      expect(service.isWebGPUAvailable()).toBe(false);
      vi.unstubAllGlobals();
    });

    it('geeft false terug als navigator ontbreekt', () => {
      vi.stubGlobal('navigator', undefined);
      expect(WebLLMService.isWebGPUAvailable()).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe('canUseWebGPU', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('geeft false terug als WebGPU niet beschikbaar is', async () => {
      vi.stubGlobal('navigator', {});
      const result = await WebLLMService.canUseWebGPU();
      expect(result).toBe(false);
    });

    it('geeft true terug als een adapter kan worden opgevraagd', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({ name: 'MockGPU' }),
        },
      });
      const result = await WebLLMService.canUseWebGPU();
      expect(result).toBe(true);
    });

    it('geeft false terug als requestAdapter null retourneert', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
      });
      const result = await WebLLMService.canUseWebGPU();
      expect(result).toBe(false);
    });

    it('geeft false terug als requestAdapter een fout gooit', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU error')),
        },
      });
      const result = await WebLLMService.canUseWebGPU();
      expect(result).toBe(false);
    });

    it('werkt ook via de instantie-methode', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({}),
        },
      });
      const result = await service.canUseWebGPU();
      expect(result).toBe(true);
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
      const result = await WebLLMService.detectGPU();
      expect(result).toBe('NVIDIA GEFORCE RTX 4090');
    });

    it('geeft de GPU-naam terug uit device als description ontbreekt', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: { device: 'Apple M1' },
          }),
        },
      });
      const result = await WebLLMService.detectGPU();
      expect(result).toBe('APPLE M1');
    });

    it('geeft de GPU-naam terug uit vendor + architecture', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: { vendor: 'Intel', architecture: 'Gen12' },
          }),
        },
      });
      const result = await WebLLMService.detectGPU();
      expect(result).toBe('INTEL GEN12');
    });

    it('geeft null terug als er geen GPU-info beschikbaar is', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: {},
          }),
        },
      });
      const result = await WebLLMService.detectGPU();
      expect(result).toBeNull();
    });

    it('geeft null terug bij een fout', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU detection failed')),
        },
      });
      const result = await WebLLMService.detectGPU();
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('geeft null terug als navigator.gpu ontbreekt', async () => {
      vi.stubGlobal('navigator', {});
      const result = await WebLLMService.detectGPU();
      expect(result).toBeNull();
    });

    it('werkt ook via de instantie-methode', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            info: { description: 'AMD RX 7900' },
          }),
        },
      });
      const result = await service.detectGPU();
      expect(result).toBe('AMD RX 7900');
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

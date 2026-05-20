import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PromptGeneratorService } from '../../services/PromptGeneratorService';
import type { IWebLLMService, IFallbackService, SurveyAnswers, GenerationEvent, ProgressInfo } from '../../types';

function createMockWebLLMService(tokens: string[] = []): IWebLLMService {
  async function* mockGenerator(
    _answers: SurveyAnswers,
    _translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: (info: ProgressInfo) => void,
  ): AsyncGenerator<string> {
    onProgress?.({ text: 'Loading...', percentage: 0, isDownloading: false });
    for (const token of tokens) {
      yield token;
    }
  }

  return {
    canUseWebGPU: vi.fn().mockResolvedValue(true),
    detectGPU: vi.fn().mockResolvedValue('MockGPU'),
    preloadModel: vi.fn().mockImplementation((_onProgress?: (info: ProgressInfo) => void) => {
      _onProgress?.({ text: 'Loading model...', percentage: 0, isDownloading: false });
      return Promise.resolve();
    }),
    generatePromptStream: vi.fn().mockImplementation(mockGenerator),
    interruptGenerate: vi.fn().mockResolvedValue(undefined),
    clearModelCache: vi.fn().mockResolvedValue(undefined),
    resetEngine: vi.fn(),
    getLastCompletionTokens: vi.fn().mockReturnValue(null),
  };
}

function createMockFallbackService(prompt: string = 'fallback prompt'): IFallbackService {
  return {
    generatePrompt: vi.fn().mockReturnValue(prompt),
  };
}

const translate = vi.fn((key: string, options?: Record<string, string>) => {
  if (options) {
    return `${key}: ${Object.values(options).join(', ')}`;
  }
  return key;
});

const answers: SurveyAnswers = {
  subject: 'Wiskunde',
  topic: 'Algebra',
  styleKey: 'survey_option_visual',
};

describe('PromptGeneratorService', () => {
  let webLLMService: IWebLLMService;
  let fallbackService: IFallbackService;
  let service: PromptGeneratorService;

  beforeEach(() => {
    webLLMService = createMockWebLLMService();
    fallbackService = createMockFallbackService();
    service = new PromptGeneratorService(webLLMService, fallbackService);
    translate.mockClear();
  });

  describe('subscribe / unsubscribe', () => {
    it('kan een listener toevoegen en ontvangt events', async () => {
      const events: GenerationEvent[] = [];
      const listener = (event: GenerationEvent) => events.push(event);

      service.subscribe(listener);
      webLLMService = createMockWebLLMService(['Hallo', ' wereld']);
      service = new PromptGeneratorService(webLLMService, fallbackService);
      service.subscribe(listener);

      await service.start(answers, true, translate);

      expect(events.length).toBeGreaterThan(0);
      service.unsubscribe(listener);
    });

    it('kan een listener verwijderen', async () => {
      const events: GenerationEvent[] = [];
      const listener = (event: GenerationEvent) => events.push(event);

      service.subscribe(listener);
      service.unsubscribe(listener);

      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);
      service.subscribe(listener);
      service.unsubscribe(listener);

      await service.start(answers, false, translate);
      expect(events).toHaveLength(0);
    });

    it('stuurt replay events bij een nieuwe subscription tijdens generatie', async () => {
      webLLMService = createMockWebLLMService(['token1', 'token2']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const lateEvents: GenerationEvent[] = [];
      const lateListener = (event: GenerationEvent) => lateEvents.push(event);

      const earlyEvents: GenerationEvent[] = [];
      const earlyListener = (event: GenerationEvent) => earlyEvents.push(event);

      service.subscribe(earlyListener);
      const startPromise = service.start(answers, true, translate);

      await new Promise((resolve) => setTimeout(resolve, 10));
      service.subscribe(lateListener);

      await startPromise;

      expect(earlyEvents.length).toBeGreaterThan(0);
      expect(lateEvents.length).toBeGreaterThan(0);
    });
  });

  describe('start met GPU', () => {
    it('emitt firstToken, token en complete events in de juiste volgorde', async () => {
      webLLMService = createMockWebLLMService(['<think>nadenken</think> Hallo', ' wereld', '!']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const events: GenerationEvent[] = [];
      service.subscribe((event) => events.push(event));

      await service.start(answers, true, translate);

      const types = events.map((e) => e.type);
      expect(types).toContain('firstToken');
      expect(types).toContain('token');
      expect(types).toContain('complete');

      const completeEvent = events.find((e) => e.type === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.type === 'complete' && completeEvent.text).toBe('Hallo wereld!');
    });

    it('roept generatePromptStream aan met de juiste argumenten', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const onProgress = vi.fn();
      await service.start(answers, true, translate, onProgress);

      expect(webLLMService.generatePromptStream).toHaveBeenCalledWith(
        answers,
        translate,
        expect.any(Function),
      );
    });

    it('stuurt progress events door naar onProgress callback', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const onProgress = vi.fn();
      await service.start(answers, true, translate, onProgress);

      expect(onProgress).toHaveBeenCalled();
    });

    it('update currentText tijdens het streamen', async () => {
      webLLMService = createMockWebLLMService(['Hallo', ' wereld']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      await service.start(answers, true, translate);
      expect(service.getCurrentText()).toBe('Hallo wereld');
    });

    it('zet generating op true tijdens generatie', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      expect(service.getIsGenerating()).toBe(false);
      const promise = service.start(answers, true, translate);
      expect(service.getIsGenerating()).toBe(true);
      await promise;
      expect(service.getIsGenerating()).toBe(false);
    });

    it('zet complete op true na voltooiing', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      await service.start(answers, true, translate);
      expect(service.getIsComplete()).toBe(true);
    });

    it('unloadt het model na GPU generatie', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      await service.start(answers, true, translate);

      expect(webLLMService.resetEngine).toHaveBeenCalled();
    });
  });

  describe('start zonder GPU (fallback)', () => {
    it('gebruikt de fallback service als GPU niet beschikbaar is', async () => {
      const events: GenerationEvent[] = [];
      service.subscribe((event) => events.push(event));

      await service.start(answers, false, translate);

      expect(fallbackService.generatePrompt).toHaveBeenCalledWith(answers, translate);

      const types = events.map((e) => e.type);
      expect(types).toEqual(['firstToken', 'token', 'complete']);
    });

    it('zet currentText op de fallback prompt', async () => {
      await service.start(answers, false, translate);
      expect(service.getCurrentText()).toBe('fallback prompt');
    });

    it('zet complete op true na fallback generatie', async () => {
      await service.start(answers, false, translate);
      expect(service.getIsComplete()).toBe(true);
      expect(service.getIsGenerating()).toBe(false);
    });
  });

  describe('error handling', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('valt terug op fallback bij een fout in generatePromptStream', async () => {
      const errorWebLLM = createMockWebLLMService();
      errorWebLLM.generatePromptStream = vi.fn().mockImplementation(() => {
        throw new Error('WebLLM fout');
      });

      service = new PromptGeneratorService(errorWebLLM, fallbackService);
      const events: GenerationEvent[] = [];
      service.subscribe((event) => events.push(event));

      await service.start(answers, true, translate);

      expect(fallbackService.generatePrompt).toHaveBeenCalled();
      const completeEvent = events.find((e) => e.type === 'complete');
      expect(completeEvent).toBeDefined();
    });

    it('emitt een error event als zowel WebLLM als fallback falen', async () => {
      const errorWebLLM = createMockWebLLMService();
      errorWebLLM.generatePromptStream = vi.fn().mockImplementation(() => {
        throw new Error('WebLLM fout');
      });

      const errorFallback = createMockFallbackService();
      errorFallback.generatePrompt = vi.fn().mockImplementation(() => {
        throw new Error('Fallback fout');
      });

      service = new PromptGeneratorService(errorWebLLM, errorFallback);
      const events: GenerationEvent[] = [];
      service.subscribe((event) => events.push(event));

      await service.start(answers, true, translate);

      const errorEvent = events.find((e) => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.type === 'error' && errorEvent.error.message).toBe('Fallback fout');
    });
  });

  describe('abort', () => {
    it('kan een lopende generatie afbreken', async () => {
      webLLMService = createMockWebLLMService(['Hallo', ' wereld', '!']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const promise = service.start(answers, true, translate);
      service.abort();
      await promise;

      expect(service.getIsGenerating()).toBe(false);
      expect(webLLMService.interruptGenerate).toHaveBeenCalled();
      expect(webLLMService.resetEngine).toHaveBeenCalled();
    });

    it('doet niets als er geen generatie loopt', () => {
      expect(() => service.abort()).not.toThrow();
    });

    it('reset complete en generating na abort', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const promise = service.start(answers, true, translate);
      service.abort();
      await promise;

      expect(service.getIsComplete()).toBe(false);
      expect(service.getIsGenerating()).toBe(false);
    });
  });

  describe('reset', () => {
    it('wist de huidige tekst', async () => {
      await service.start(answers, false, translate);
      expect(service.getCurrentText()).not.toBe('');

      service.reset();
      expect(service.getCurrentText()).toBe('');
    });

    it('reset generating en complete status', async () => {
      await service.start(answers, false, translate);
      expect(service.getIsComplete()).toBe(true);

      service.reset();
      expect(service.getIsComplete()).toBe(false);
      expect(service.getIsGenerating()).toBe(false);
    });

    it('roept abort aan tijdens reset', () => {
      const abortSpy = vi.spyOn(service, 'abort');
      service.reset();
      expect(abortSpy).toHaveBeenCalled();
      abortSpy.mockRestore();
    });
  });

  describe('cleanOutput', () => {
    it('verwijdert [EINDE] uit de output', async () => {
      webLLMService = createMockWebLLMService(['Tekst ', '[EINDE]']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      await service.start(answers, true, translate);
      expect(service.getCurrentText()).toBe('Tekst');
    });

    it('verwijdert [END] uit de output', async () => {
      webLLMService = createMockWebLLMService(['Tekst ', '[END]']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      await service.start(answers, true, translate);
      expect(service.getCurrentText()).toBe('Tekst');
    });

    it('trimt witruimte na het verwijderen van stop tokens', async () => {
      webLLMService = createMockWebLLMService(['Tekst  ', '  [EINDE]  ']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      await service.start(answers, true, translate);
      expect(service.getCurrentText()).toBe('Tekst');
    });
  });

  describe('meerdere starts', () => {
    it('start niet opnieuw als er al een generatie loopt', async () => {
      webLLMService = createMockWebLLMService(['test']);
      service = new PromptGeneratorService(webLLMService, fallbackService);

      const promise1 = service.start(answers, true, translate);
      const promise2 = service.start(answers, true, translate);

      await promise1;
      await promise2;

      expect(webLLMService.generatePromptStream).toHaveBeenCalledTimes(1);
    });
  });

  describe('preload', () => {
    it('roept preloadModel aan en emitt progress events', async () => {
      const events: GenerationEvent[] = [];
      service.subscribe((event) => events.push(event));

      await service.preload(translate);

      expect(webLLMService.preloadModel).toHaveBeenCalled();
      const progressEvent = events.find((e) => e.type === 'progress');
      expect(progressEvent).toBeDefined();
    });

    it('stuurt progress events door naar onProgress callback', async () => {
      const onProgress = vi.fn();
      await service.preload(translate, onProgress);
      expect(onProgress).toHaveBeenCalled();
    });

    it('gooit een fout als preloadModel faalt', async () => {
      const errorWebLLM = createMockWebLLMService();
      errorWebLLM.preloadModel = vi.fn().mockRejectedValue(new Error('Preload fout'));

      service = new PromptGeneratorService(errorWebLLM, fallbackService);

      await expect(service.preload(translate)).rejects.toThrow('Preload fout');
    });
  });
});

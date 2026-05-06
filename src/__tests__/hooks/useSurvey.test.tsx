import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSurvey } from '../../hooks';
import { ServiceProvider } from '../../contexts';
import { MockI18nProvider } from '../helpers/mockI18n';
import type { Services } from '../../contexts';
import type { GenerationEvent } from '../../types';

const mockNavigate = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockReset = vi.fn();
const mockStart = vi.fn();
const mockAbort = vi.fn();
const mockSetAnswer = vi.fn();
const mockGetAnswer = vi.fn().mockReturnValue('');
const mockToSurveyAnswers = vi.fn().mockReturnValue({
  subject: 'Wiskunde',
  topic: 'Algebra',
  styleKey: 'survey_option_visual',
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

function createWrapper(services: Partial<Services> = {}) {
  const defaultServices = {
    surveyService: {
      setAnswer: mockSetAnswer,
      getAnswer: mockGetAnswer,
      toSurveyAnswers: mockToSurveyAnswers,
      reset: vi.fn(),
      isComplete: vi.fn().mockReturnValue(true),
    } as unknown as Services['surveyService'],
    webLLMService: {
      isWebGPUAvailable: vi.fn().mockReturnValue(true),
      canUseWebGPU: vi.fn().mockResolvedValue(true),
      detectGPU: vi.fn().mockResolvedValue('MockGPU'),
    } as unknown as Services['webLLMService'],
    fallbackService: {} as Services['fallbackService'],
    providerService: {} as Services['providerService'],
    promptGeneratorService: {
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      reset: mockReset,
      start: mockStart,
      abort: mockAbort,
      getCurrentText: vi.fn().mockReturnValue(''),
      getIsComplete: vi.fn().mockReturnValue(false),
      getIsGenerating: vi.fn().mockReturnValue(false),
    } as unknown as Services['promptGeneratorService'],
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <ServiceProvider services={{ ...defaultServices, ...services }}>
          <MockI18nProvider>
            {children}
          </MockI18nProvider>
        </ServiceProvider>
      </MemoryRouter>
    );
  };
}

describe('useSurvey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    mockReset.mockClear();
    mockStart.mockClear();
    mockAbort.mockClear();
    mockSetAnswer.mockClear();
    mockGetAnswer.mockReturnValue('');
  });

  it('start bij stap 0', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    expect(result.current.step).toBe(0);
    expect(result.current.totalSteps).toBe(3);
    expect(result.current.isGenerating).toBe(false);
  });

  it('gaat naar de volgende stap bij handleNext met geldige input', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });

    expect(mockSetAnswer).toHaveBeenCalledWith('subject', 'Wiskunde');
    expect(result.current.step).toBe(1);
  });

  it('toont een fout bij lege input', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('  ');
    });

    expect(result.current.inputError).toBe(true);
    expect(result.current.step).toBe(0);
  });

  it('gaat terug naar de vorige stap', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    expect(result.current.step).toBe(1);

    act(() => {
      result.current.handleBack();
    });
    expect(result.current.step).toBe(0);
  });

  it('selecteert een optie bij handleOptionSelect', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    act(() => {
      result.current.handleNext('Algebra');
    });
    act(() => {
      result.current.handleOptionSelect('survey_option_visual');
    });

    expect(mockSetAnswer).toHaveBeenCalledWith('style', 'survey_option_visual');
  });

  it('start generatie bij de laatste stap', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    act(() => {
      result.current.handleNext('Algebra');
    });
    act(() => {
      result.current.handleOptionSelect('survey_option_visual');
    });

    expect(mockReset).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(true);
  });

  it('navigeert naar resultaat bij firstToken event', () => {
    let eventHandler: ((event: GenerationEvent) => void) | null = null;
    mockSubscribe.mockImplementation((handler) => {
      eventHandler = handler;
    });

    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    act(() => {
      result.current.handleNext('Algebra');
    });
    act(() => {
      result.current.handleOptionSelect('survey_option_visual');
    });

    expect(eventHandler).not.toBeNull();

    act(() => {
      if (eventHandler) {
        eventHandler({ type: 'firstToken', text: 'Hallo' });
      }
    });

    expect(mockNavigate).toHaveBeenCalledWith('/result', {
      state: {
        answers: { subject: 'Wiskunde', topic: 'Algebra', styleKey: 'survey_option_visual' },
        gpuAvailable: true,
      },
    });
  });

  it('navigeert naar resultaat bij complete event', () => {
    let eventHandler: ((event: GenerationEvent) => void) | null = null;
    mockSubscribe.mockImplementation((handler) => {
      eventHandler = handler;
    });

    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    act(() => {
      result.current.handleNext('Algebra');
    });
    act(() => {
      result.current.handleOptionSelect('survey_option_visual');
    });

    act(() => {
      if (eventHandler) {
        eventHandler({ type: 'complete', text: 'Voltooid' });
      }
    });

    expect(mockNavigate).toHaveBeenCalledWith('/result', expect.any(Object));
  });

  it('updateert progressInfo bij progress events', () => {
    let eventHandler: ((event: GenerationEvent) => void) | null = null;
    mockSubscribe.mockImplementation((handler) => {
      eventHandler = handler;
    });

    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    act(() => {
      result.current.handleNext('Algebra');
    });
    act(() => {
      result.current.handleOptionSelect('survey_option_visual');
    });

    act(() => {
      if (eventHandler) {
        eventHandler({ type: 'progress', info: { text: 'Loading...', percentage: 0, isDownloading: false } });
      }
    });

    expect(result.current.progressInfo).toEqual({ text: 'Loading...', percentage: 0, isDownloading: false });
  });

  it('roept abort en navigeert naar home bij handleCancel', () => {
    const { result } = renderHook(() => useSurvey(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(mockAbort).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('gebruikt fallback als gpu niet beschikbaar is', () => {
    vi.mocked(mockStart).mockClear();

    const wrapper = createWrapper({
      webLLMService: {
        isWebGPUAvailable: vi.fn().mockReturnValue(false),
        canUseWebGPU: vi.fn().mockResolvedValue(false),
        detectGPU: vi.fn().mockResolvedValue(null),
      } as unknown as Services['webLLMService'],
    });

    const { result } = renderHook(() => useSurvey(), { wrapper });

    act(() => {
      result.current.handleNext('Wiskunde');
    });
    act(() => {
      result.current.handleNext('Algebra');
    });
    act(() => {
      result.current.handleOptionSelect('survey_option_visual');
    });

    expect(mockStart).toHaveBeenCalledWith(
      expect.any(Object),
      false,
      expect.any(Function),
      expect.any(Function),
    );
  });
});

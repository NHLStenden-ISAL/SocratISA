import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PromptResult } from '../../components/PromptResult/PromptResult';
import { ServiceProvider, StorageProvider } from '../../contexts';
import { MockI18nProvider } from '../helpers/mockI18n';
import type { GenerationEvent } from '../../types';
import type { Services } from '../../contexts';

const mockSetPrompt = vi.fn();
const mockHandleEdit = vi.fn();
const mockHandleDone = vi.fn();
const mockHandleCopy = vi.fn().mockResolvedValue(undefined);
const mockHandleProvider = vi.fn();
const mockHandleRetry = vi.fn();
const mockHandleHome = vi.fn();

vi.mock('../../contexts/useStorage', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/useStorage')>('../../contexts/useStorage');
  return {
    ...actual,
    useStorage: vi.fn(() => ({
      getLocalItem: vi.fn(),
      setLocalItem: vi.fn(),
      getSessionItem: (key: string) => sessionStorage.getItem(key),
      setSessionItem: (key: string, value: string) => sessionStorage.setItem(key, value),
      removeSessionItem: (key: string) => sessionStorage.removeItem(key),
    })),
  };
});

vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    usePromptResult: vi.fn(),
    useModelStatus: vi.fn().mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    }),
  };
});

import { useModelStatus, usePromptResult } from '../../hooks';

function setupMockPromptResult(overrides: Partial<ReturnType<typeof usePromptResult>> = {}) {
  vi.mocked(usePromptResult).mockReturnValue({
    prompt: 'Gegenereerde prompt tekst',
    isEditing: false,
    copyFeedback: null,
    isCopying: false,
    textareaRef: { current: null },
    setEditedPrompt: mockSetPrompt,
    handleEdit: mockHandleEdit,
    handleDone: mockHandleDone,
    handleCopy: mockHandleCopy,
    handleProvider: mockHandleProvider,
    handleRetry: mockHandleRetry,
    handleHome: mockHandleHome,
    providers: [
      { name: 'ChatGPT', buildUrl: (prompt: string) => `https://chat.openai.com/?q=${prompt}` },
    ],
    ...overrides,
  });
}

function createServices(services: Partial<Services> = {}) {
  return {
    surveyService: {} as Services['surveyService'],
    webLLMService: {
      clearModelCache: vi.fn().mockResolvedValue(undefined),
      setStreamDelayMs: vi.fn(),
    } as unknown as Services['webLLMService'],
    fallbackService: {} as Services['fallbackService'],
    promptGeneratorService: {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      reset: vi.fn(),
      start: vi.fn(),
      getIsComplete: vi.fn().mockReturnValue(false),
      getIsGenerating: vi.fn().mockReturnValue(false),
      getCurrentText: vi.fn().mockReturnValue(''),
      getStats: vi.fn().mockReturnValue(undefined),
      getLastWarning: vi.fn().mockReturnValue(undefined),
      setStreamDelayMs: vi.fn(),
    } as unknown as Services['promptGeneratorService'],
    ...services,
  };
}

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('PromptResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('socratisa_result_prompt', 'test');
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('rendert de gegenereerde prompt', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Gegenereerde prompt tekst')).toBeInTheDocument();
    expect(screen.getByText('result.title')).toBeInTheDocument();
  });

  it('roept handleEdit aan bij klik op bewerk knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.editLabel'));
    expect(mockHandleEdit).toHaveBeenCalled();
  });

  it('toont een textarea in bewerkingsmodus', () => {
    setupMockPromptResult({ isEditing: true });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('result.textareaLabel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gegenereerde prompt tekst')).toBeInTheDocument();
  });

  it('roept handleDone aan bij klik op klaar knop', () => {
    setupMockPromptResult({ isEditing: true });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.doneLabel'));
    expect(mockHandleDone).toHaveBeenCalled();
  });

  it('roept handleCopy aan bij klik op kopieer knop', async () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.copyLabel'));
    await waitFor(() => {
      expect(mockHandleCopy).toHaveBeenCalled();
    });
  });

  it('toont een waarschuwingsdialog bij klik op provider knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.providerLabel'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('dialogs.providerBody')).toBeInTheDocument();
    expect(mockHandleProvider).not.toHaveBeenCalled();
  });

  it('toont een andere dialog tekst voor clipboardOnly providers zoals Gemini/Copilot', () => {
    setupMockPromptResult({
      providers: [
        { name: 'Gemini', clipboardOnly: true, buildUrl: () => 'https://gemini.google.com/app' },
      ],
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.providerLabel'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('dialogs.providerBodyClipboard')).toBeInTheDocument();
  });

  it('roept handleProvider aan na bevestigen in de dialog', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.providerLabel'));
    fireEvent.click(screen.getByText('dialogs.providerConfirm'));
    expect(mockHandleProvider).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ChatGPT' }),
    );
  });

  it('sluit de dialog bij klik op annuleren', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.providerLabel'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockHandleProvider).not.toHaveBeenCalled();
  });

  it('toont copyFeedback na kopiëren', () => {
    setupMockPromptResult({ copyFeedback: 'Gekopieerd!' });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Gekopieerd!');
  });

  it('toont de correcte telling voor de prompt', () => {
    setupMockPromptResult({ prompt: 'Een test prompt voor SocratISA' });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const metaEl = document.querySelector('.prompt-meta');
    expect(metaEl).toBeInTheDocument();
    expect(metaEl?.textContent).toBe('30 tekens · 5 woorden');
  });

  it('maakt een Blob en triggert download bij klik op de download knop', () => {
    setupMockPromptResult({ prompt: 'Gegenereerde prompt voor download test' });

    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickMock;
      }
      return el;
    });

    try {
      render(
        <MemoryRouter>
          <MockI18nProvider>
            <PromptResult />
          </MockI18nProvider>
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByLabelText('result.downloadLabel'));

      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(clickMock).toHaveBeenCalledOnce();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    } finally {
      createElementSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('laat een download fout door de download actie terugkomen', () => {
    setupMockPromptResult({ prompt: 'Prompt die niet downloadt' });

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => {
      throw new Error('Download mislukt');
    });
    URL.revokeObjectURL = vi.fn();

    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      errors.push(event.error);
    };
    window.addEventListener('error', onError);

    try {
      render(
        <MemoryRouter>
          <MockI18nProvider>
            <PromptResult />
          </MockI18nProvider>
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByLabelText('result.downloadLabel'));

      expect(errors[0]).toEqual(new Error('Download mislukt'));
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('error', onError);
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('toont copyFeedback voor een mislukte clipboard aanroep', () => {
    setupMockPromptResult({ copyFeedback: 'result.copyFailed' });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('result.copyFailed');
  });

  it('annuleert de provider waarschuwing zonder provider te openen', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.providerLabel'));
    fireEvent(screen.getByRole('dialog'), new Event('cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockHandleProvider).not.toHaveBeenCalled();
  });

  it('negeert ongeldige opgeslagen statistieken', () => {
    setupMockPromptResult();
    sessionStorage.setItem('socratisa_result_stats', '{geen json');

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('region', { name: 'result.statsAria' })).not.toBeInTheDocument();
  });

  it('kopieert statistieken en toont succescopyFeedback', async () => {
    setupMockPromptResult();
    sessionStorage.setItem('socratisa_result_stats', JSON.stringify({ ttft: 1000, totalTime: 3000, tps: 2, completionTokens: 6 }));
    vi.mocked(useModelStatus).mockReturnValue({ canUseModel: true, gpuName: 'RTX', isChecking: false });
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.statsCopyAria'));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('result.statsCopied');
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('GPU: RTX'));
  });

  it('toont foutcopyFeedback als statistieken kopiëren mislukt', async () => {
    setupMockPromptResult();
    sessionStorage.setItem('socratisa_result_stats', JSON.stringify({ ttft: 1000, totalTime: 3000, tps: 2 }));
    vi.mocked(useModelStatus).mockReturnValue({ canUseModel: true, gpuName: null, isChecking: false });
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('clipboard')) } });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.statsCopyAria'));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('result.statsCopyFailed');
    });
  });

  it('gaat direct naar fallback retry als GPU niet beschikbaar is', () => {
    setupMockPromptResult();
    vi.mocked(useModelStatus).mockReturnValue({ canUseModel: false, gpuName: null, isChecking: false });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
          <LocationDisplay />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.retryLabel'));

    expect(screen.getByTestId('location')).toHaveTextContent('/survey');
    expect(sessionStorage.getItem('socratisa_model_choice')).toBe('false');
  });

  it('opent retry keuze en navigeert naar AI generatie', () => {
    setupMockPromptResult();
    vi.mocked(useModelStatus).mockReturnValue({ canUseModel: true, gpuName: 'RTX', isChecking: false });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
          <LocationDisplay />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result.retryLabel'));
    fireEvent.click(screen.getByText('dialogs.generationAi'));

    expect(screen.getByTestId('location')).toHaveTextContent('/survey');
    expect(sessionStorage.getItem('socratisa_model_choice')).toBe('true');
  });

  it('toont een cache fout als modelcache wissen mislukt', async () => {
    setupMockPromptResult();
    vi.mocked(useModelStatus).mockReturnValue({ canUseModel: true, gpuName: 'RTX', isChecking: false });
    const services = createServices({
      webLLMService: {
        clearModelCache: vi.fn().mockRejectedValue(new Error('cache fout')),
      } as unknown as Services['webLLMService'],
    });

    render(
      <MemoryRouter>
        <ServiceProvider services={services}>
          <MockI18nProvider>
            <PromptResult />
          </MockI18nProvider>
        </ServiceProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('model.clearCache'));
    fireEvent.click(screen.getByText('model.clearCacheDialogConfirm'));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('model.cacheClearError');
    });
  });

  it('kan opnieuw proberen na een generatiefout', async () => {
    sessionStorage.removeItem('socratisa_result_prompt');
    setupMockPromptResult();
    let handler: ((event: GenerationEvent) => void) | null = null;
    const services = createServices({
      promptGeneratorService: {
        subscribe: vi.fn((eventHandler: (event: GenerationEvent) => void) => {
          handler = eventHandler;
        }),
        unsubscribe: vi.fn(),
        reset: vi.fn(),
        start: vi.fn(),
        getIsComplete: vi.fn().mockReturnValue(false),
        getIsGenerating: vi.fn().mockReturnValue(false),
        getCurrentText: vi.fn().mockReturnValue(''),
        getStats: vi.fn().mockReturnValue(undefined),
        getLastWarning: vi.fn().mockReturnValue(undefined),
        setStreamDelayMs: vi.fn(),
      } as unknown as Services['promptGeneratorService'],
    });

    render(
      <MemoryRouter>
        <StorageProvider>
          <ServiceProvider services={services}>
            <MockI18nProvider>
              <PromptResult />
              <LocationDisplay />
            </MockI18nProvider>
          </ServiceProvider>
        </StorageProvider>
      </MemoryRouter>,
    );

    act(() => {
      handler?.({ type: 'error', error: new Error('Generatie mislukt') });
    });

    await waitFor(() => {
      expect(screen.getByText('result.errorTitle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('result.errorRetry'));

    expect(screen.getByTestId('location')).toHaveTextContent('/survey');
  });
});

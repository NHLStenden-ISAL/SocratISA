import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../../components/Home/Home';
import { MockI18nProvider } from '../helpers/mockI18n';

const mockNavigate = vi.fn();
const mockPreload = vi.fn().mockResolvedValue(undefined);
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('../../hooks', () => ({
  useModelStatus: vi.fn(),
  useGenerationSettings: vi.fn(() => ({ streamDelayMs: 0, setStreamDelayMs: vi.fn() })),
}));

vi.mock('../../contexts/useServices', () => ({
  useServices: vi.fn(() => ({
    promptGeneratorService: {
      preloadModel: mockPreload,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      getPreloadStatus: vi.fn(() => 'idle'),
    },
  })),
}));

vi.mock('../../contexts/useStorage', () => ({
  useStorage: vi.fn(() => ({
    getLocalItem: vi.fn(),
    setLocalItem: vi.fn(),
    getSessionItem: vi.fn().mockReturnValue(null),
    setSessionItem: vi.fn(),
    removeSessionItem: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useModelStatus } from '../../hooks';

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPreload.mockClear();
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
  });

  it('rendert de landingspagina', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: false,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('home.title')).toBeInTheDocument();
    expect(screen.getByText('home.cta')).toBeInTheDocument();
  });

  it('toont een preload banner als GPU beschikbaar is', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: true,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'model.preloadDialogTitle' })).toBeInTheDocument();
    expect(screen.getByText('model.preloadDialogBody')).toBeInTheDocument();
  });

  it('toont geen preload dialoog als GPU niet beschikbaar is', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: false,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toont geen preload dialoog terwijl GPU status nog wordt gecontroleerd', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toont een keuzedialoog bij klik op CTA', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const ctaButton = screen.getByLabelText('home.ctaLabel');
    fireEvent.click(ctaButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('dialogs.generationTitle')).toBeInTheDocument();
    expect(screen.getByText('dialogs.generationAi')).toBeInTheDocument();
    expect(screen.getByText('dialogs.generationFallback')).toBeInTheDocument();
  });

  it('toont een gebruiksvriendelijke prestatietip in de keuzedialoog', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const ctaButton = screen.getByLabelText('home.ctaLabel');
    fireEvent.click(ctaButton);

    expect(screen.getByText('dialogs.generationPerformanceTipTitle')).toBeInTheDocument();
    expect(screen.getByText('dialogs.generationPerformanceTipBody')).toBeInTheDocument();
  });

  it('navigeert naar survey met GPU bij kiezen voor AI-model', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const ctaButton = screen.getByLabelText('home.ctaLabel');
    fireEvent.click(ctaButton);

    const aiButton = screen.getByText('dialogs.generationAi');
    fireEvent.click(aiButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey', { state: { canUseModel: true } });
  });

  it('navigeert naar survey zonder GPU bij kiezen voor fallback', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: null,
      gpuName: null,
      isChecking: true,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const ctaButton = screen.getByLabelText('home.ctaLabel');
    fireEvent.click(ctaButton);

    const fallbackButton = screen.getByText('dialogs.generationFallback');
    fireEvent.click(fallbackButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey', { state: { canUseModel: false } });
  });

  it('minimaliseert de preload banner bij klik op dismiss', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: true,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const dismissButton = screen.getByText('model.preloadDialogDismiss');
    fireEvent.click(dismissButton);

    expect(screen.getByText('model.preloadDialogTitle')).toBeInTheDocument();
    expect(screen.queryByText('model.preloadDialogBody')).not.toBeInTheDocument();
  });

  it('klapt de preload banner weer open', () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: true,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const dismissButton = screen.getByText('model.preloadDialogDismiss');
    fireEvent.click(dismissButton);
    fireEvent.click(screen.getByText('model.preloadBannerExpand'));

    expect(screen.getByText('model.preloadDialogBody')).toBeInTheDocument();
  });

  it('start preload en toont status bij klik op confirm', async () => {
    mockPreload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: true,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const confirmButton = screen.getByText('model.preloadDialogConfirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('model.preloadBannerProgress')).toBeInTheDocument();
    });

    expect(screen.queryByText('model.preloadDialogBody')).not.toBeInTheDocument();
    expect(mockPreload).toHaveBeenCalled();
  });

  it('toont een foutstatus als preload mislukt', async () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: true,
      gpuName: null,
      isChecking: false,
    });

    mockPreload.mockRejectedValueOnce(new Error('Preload mislukt'));

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const confirmButton = screen.getByText('model.preloadDialogConfirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const status = screen.getAllByText('model.preloadError');
      expect(status).toHaveLength(2);
    });
  });

  it('toont ready status als preload voltooid is', async () => {
    vi.mocked(useModelStatus).mockReturnValue({
      canUseModel: true,
      gpuName: null,
      isChecking: false,
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <Home />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const confirmButton = screen.getByText('model.preloadDialogConfirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const status = screen.getAllByText('model.preloadReady');
      expect(status).toHaveLength(2);
    });
  });
});

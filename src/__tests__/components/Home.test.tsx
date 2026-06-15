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
  useGPUStatus: vi.fn(),
  useGenerationSettings: vi.fn(() => ({ throttleMs: 0, setThrottleMs: vi.fn() })),
}));

vi.mock('../../contexts/useServices', () => ({
  useServices: vi.fn(() => ({
    promptGeneratorService: {
      preload: mockPreload,
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

import { useGPUStatus } from '../../hooks';

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPreload.mockClear();
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
  });

  it('rendert de landingspagina', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: false,
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

    expect(screen.getByText('home_title')).toBeInTheDocument();
    expect(screen.getByText('home_cta')).toBeInTheDocument();
  });

  it('toont een preload banner als GPU beschikbaar is', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: true,
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
    expect(screen.getByRole('region', { name: 'home_preload_dialog_title' })).toBeInTheDocument();
    expect(screen.getByText('home_preload_dialog_body')).toBeInTheDocument();
  });

  it('toont geen preload dialoog als GPU niet beschikbaar is', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: false,
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
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: null,
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
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: null,
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

    const ctaButton = screen.getByLabelText('home_cta_aria_v2');
    fireEvent.click(ctaButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('home_cta_dialog_title')).toBeInTheDocument();
    expect(screen.getByText('home_cta_dialog_ai')).toBeInTheDocument();
    expect(screen.getByText('home_cta_dialog_fallback')).toBeInTheDocument();
  });

  it('toont een gebruiksvriendelijke prestatietip in de keuzedialoog', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: null,
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

    const ctaButton = screen.getByLabelText('home_cta_aria_v2');
    fireEvent.click(ctaButton);

    expect(screen.getByText('home_cta_performance_tip_title')).toBeInTheDocument();
    expect(screen.getByText('home_cta_performance_tip_body')).toBeInTheDocument();
  });

  it('navigeert naar survey met GPU bij kiezen voor AI-model', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: null,
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

    const ctaButton = screen.getByLabelText('home_cta_aria_v2');
    fireEvent.click(ctaButton);

    const aiButton = screen.getByText('home_cta_dialog_ai');
    fireEvent.click(aiButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey', { state: { gpuAvailable: true } });
  });

  it('navigeert naar survey zonder GPU bij kiezen voor fallback', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: null,
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

    const ctaButton = screen.getByLabelText('home_cta_aria_v2');
    fireEvent.click(ctaButton);

    const fallbackButton = screen.getByText('home_cta_dialog_fallback');
    fireEvent.click(fallbackButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey', { state: { gpuAvailable: false } });
  });

  it('minimaliseert de preload banner bij klik op dismiss', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: true,
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

    const dismissButton = screen.getByText('home_preload_dialog_dismiss');
    fireEvent.click(dismissButton);

    expect(screen.getByText('home_preload_dialog_title')).toBeInTheDocument();
    expect(screen.queryByText('home_preload_dialog_body')).not.toBeInTheDocument();
  });

  it('klapt de preload banner weer open', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: true,
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

    const dismissButton = screen.getByText('home_preload_dialog_dismiss');
    fireEvent.click(dismissButton);
    fireEvent.click(screen.getByText('home_preload_banner_expand'));

    expect(screen.getByText('home_preload_dialog_body')).toBeInTheDocument();
  });

  it('start preload en toont status bij klik op confirm', async () => {
    mockPreload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: true,
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

    const confirmButton = screen.getByText('home_preload_dialog_confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('home_preload_banner_progress')).toBeInTheDocument();
    });

    expect(screen.queryByText('home_preload_dialog_body')).not.toBeInTheDocument();
    expect(mockPreload).toHaveBeenCalled();
  });

  it('toont een foutstatus als preload mislukt', async () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: true,
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

    const confirmButton = screen.getByText('home_preload_dialog_confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const status = screen.getAllByText('home_preload_error');
      expect(status).toHaveLength(2);
    });
  });

  it('toont ready status als preload voltooid is', async () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: true,
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

    const confirmButton = screen.getByText('home_preload_dialog_confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const status = screen.getAllByText('home_preload_ready');
      expect(status).toHaveLength(2);
    });
  });
});

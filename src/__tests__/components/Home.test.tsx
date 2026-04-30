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
}));

vi.mock('../../contexts/useServices', () => ({
  useServices: vi.fn(() => ({
    promptGeneratorService: {
      preload: mockPreload,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    },
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

  it('toont automatisch een preload dialoog als GPU beschikbaar is', async () => {
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

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('home_preload_dialog_title')).toBeInTheDocument();
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

  it('navigeert direct naar survey bij klik op CTA', () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria_v2');
    fireEvent.click(ctaButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey');
  });

  it('doet niets bij CTA klik als GPU status nog wordt gecontroleerd', () => {
    vi.mocked(useGPUStatus).mockReturnValue({
      isAvailable: false,
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

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sluit de preload dialoog bij klik op de overlay', async () => {
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

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const overlay = document.querySelector('.dialog-overlay');
    fireEvent.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('sluit de preload dialoog bij klik op dismiss', async () => {
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

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('home_preload_dialog_dismiss');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('start preload en toont status bij klik op confirm', async () => {
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

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('home_preload_dialog_confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

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

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('home_preload_dialog_confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('home_preload_error')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('home_preload_dialog_confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('home_preload_ready')).toBeInTheDocument();
    });
  });
});

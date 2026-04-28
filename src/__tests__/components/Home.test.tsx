import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../../components/Home/Home';
import { MockI18nProvider } from '../helpers/mockI18n';

const mockNavigate = vi.fn();

vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    useGPUStatus: vi.fn(),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useGPUStatus } from '../../hooks';

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('rendert de landingspagina', () => {
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

    expect(screen.getByText('home_title')).toBeInTheDocument();
    expect(screen.getByText('home_cta')).toBeInTheDocument();
  });

  it('toont een dialoog als GPU beschikbaar is', () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria');
    fireEvent.click(ctaButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('home_download_dialog_title')).toBeInTheDocument();
  });

  it('navigeert direct naar survey als GPU niet beschikbaar is', () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria');
    fireEvent.click(ctaButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey');
  });

  it('doet niets bij klik als GPU status nog wordt gecontroleerd', () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria');
    fireEvent.click(ctaButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigeert naar survey met fallback vanuit de dialoog', () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria');
    fireEvent.click(ctaButton);

    const fallbackButton = screen.getByText('home_download_dialog_fallback');
    fireEvent.click(fallbackButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey?fallback=true');
  });

  it('navigeert naar survey vanuit de dialoog', () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria');
    fireEvent.click(ctaButton);

    const continueButton = screen.getByText('home_download_dialog_continue');
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/survey');
  });

  it('sluit de dialoog bij een klik op de overlay', async () => {
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

    const ctaButton = screen.getByLabelText('home_cta_aria');
    fireEvent.click(ctaButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const overlay = document.querySelector('.dialog-overlay');
    fireEvent.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PromptGenerator } from '../../components/PromptGenerator/PromptGenerator';
import { MockI18nProvider } from '../helpers/mockI18n';
import type { GenerationEvent } from '../../types';

const mockNavigate = vi.fn();
const mockOnComplete = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockReset = vi.fn();
const mockStart = vi.fn();
const mockGetIsComplete = vi.fn().mockReturnValue(false);
const mockGetIsGenerating = vi.fn().mockReturnValue(false);
const mockGetCurrentText = vi.fn().mockReturnValue('');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/useServices', () => ({
  useServices: vi.fn(() => ({
    promptGeneratorService: {
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      reset: mockReset,
      start: mockStart,
      getIsComplete: mockGetIsComplete,
      getIsGenerating: mockGetIsGenerating,
      getCurrentText: mockGetCurrentText,
    },
  })),
}));

function createEventHandler() {
  let handler: ((event: GenerationEvent) => void) | null = null;
  mockSubscribe.mockImplementation((h: (event: GenerationEvent) => void) => {
    handler = h;
  });
  return () => handler;
}

describe('PromptGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIsComplete.mockReturnValue(false);
    mockGetIsGenerating.mockReturnValue(false);
    mockGetCurrentText.mockReturnValue('');
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  it('toont een laadstatus bij initiële render', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('result_generating')).toBeInTheDocument();
  });

  it('start generatie als er nog geen generatie loopt', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(mockReset).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();
  });

  it('schakelt over naar streaming bij firstToken event', async () => {
    const getHandler = createEventHandler();

    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const handler = getHandler();
    expect(handler).not.toBeNull();

    act(() => {
      handler!({ type: 'firstToken', text: 'Hallo' });
    });

    await waitFor(() => {
      expect(screen.queryByText('result_generating')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Hallo')).toBeInTheDocument();
  });

  it('roept onComplete aan bij complete event', async () => {
    const getHandler = createEventHandler();

    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const handler = getHandler();
    act(() => {
      handler!({ type: 'complete', text: 'Voltooid' });
    });

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('toont een foutmelding bij error event', async () => {
    const getHandler = createEventHandler();

    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const handler = getHandler();
    act(() => {
      handler!({ type: 'error', error: new Error('Generatie mislukt') });
    });

    await waitFor(() => {
      expect(screen.getByText('result_error_title')).toBeInTheDocument();
    });
  });

  it('roept onComplete direct als generatie al voltooid is', () => {
    mockGetIsComplete.mockReturnValue(true);
    mockGetCurrentText.mockReturnValue('Al voltooid');

    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('updateert progress tekst bij progress events', async () => {
    const getHandler = createEventHandler();

    render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const handler = getHandler();
    act(() => {
      handler!({ type: 'progress', text: 'Model laden...' });
    });

    await waitFor(() => {
      expect(screen.getByText('Model laden...')).toBeInTheDocument();
    });
  });

  it('unsubscribet bij unmount', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={[{ pathname: '/generator', state: { answers: { subject: 'A', topic: 'B', styleKey: 'C' }, gpuAvailable: true } }]}>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handelt default state af als location.state ontbreekt', () => {
    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptGenerator onComplete={mockOnComplete} />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(mockStart).toHaveBeenCalledWith(
      expect.objectContaining({ subject: '', topic: '', styleKey: '' }),
      false,
      expect.any(Function),
      expect.any(Function),
    );
  });
});

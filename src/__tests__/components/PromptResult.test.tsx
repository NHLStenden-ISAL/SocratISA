import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PromptResult } from '../../components/PromptResult/PromptResult';
import { MockI18nProvider } from '../helpers/mockI18n';

const mockSetPrompt = vi.fn();
const mockHandleEdit = vi.fn();
const mockHandleDone = vi.fn();
const mockHandleCopy = vi.fn().mockResolvedValue(undefined);
const mockHandleProvider = vi.fn();
const mockHandleRetry = vi.fn();
const mockHandleHome = vi.fn();

vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    usePromptResult: vi.fn(),
  };
});

import { usePromptResult } from '../../hooks';

function setupMockPromptResult(overrides: Partial<ReturnType<typeof usePromptResult>> = {}) {
  vi.mocked(usePromptResult).mockReturnValue({
    prompt: 'Gegenereerde prompt tekst',
    isEditing: false,
    feedback: null,
    isCopying: false,
    textareaRef: { current: null },
    setPrompt: mockSetPrompt,
    handleEdit: mockHandleEdit,
    handleDone: mockHandleDone,
    handleCopy: mockHandleCopy,
    handleProvider: mockHandleProvider,
    handleRetry: mockHandleRetry,
    handleHome: mockHandleHome,
    providers: [
      { name: 'ChatGPT', buildUrl: (p: string) => `https://chat.openai.com/?q=${p}` },
    ],
    ...overrides,
  });
}

describe('PromptResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByText('result_title')).toBeInTheDocument();
  });

  it('toont een bewerk knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('result_edit_aria')).toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText('result_edit_aria'));
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

    expect(screen.getByLabelText('result_textarea_label')).toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText('result_done_aria'));
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

    fireEvent.click(screen.getByLabelText('result_copy_aria'));
    await waitFor(() => {
      expect(mockHandleCopy).toHaveBeenCalled();
    });
  });

  it('toont provider knoppen', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('result_provider_aria')).toBeInTheDocument();
  });

  it('roept handleProvider aan bij klik op provider knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result_provider_aria'));
    expect(mockHandleProvider).toHaveBeenCalledWith('ChatGPT');
  });

  it('toont feedback na kopiëren', () => {
    setupMockPromptResult({ feedback: 'Gekopieerd!' });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Gekopieerd!');
  });

  it('heeft een retry knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('result_retry_aria_v2')).toBeInTheDocument();
  });

  it('heeft een home knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('result_home_aria_v2')).toBeInTheDocument();
  });

  it('toont de prompt tekst in de view', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Gegenereerde prompt tekst')).toBeInTheDocument();
  });
});

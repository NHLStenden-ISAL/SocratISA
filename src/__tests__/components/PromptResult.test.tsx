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

  it('toont een waarschuwingsdialog bij klik op provider knop', () => {
    setupMockPromptResult();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result_provider_aria'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockHandleProvider).not.toHaveBeenCalled();
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

    fireEvent.click(screen.getByLabelText('result_provider_aria'));
    fireEvent.click(screen.getByText('provider_dialog_confirm'));
    expect(mockHandleProvider).toHaveBeenCalledWith('ChatGPT');
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

    fireEvent.click(screen.getByLabelText('result_provider_aria'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('provider_dialog_cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockHandleProvider).not.toHaveBeenCalled();
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

  it('toont het correcte aantal karakters en woorden voor de prompt', () => {
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

  it('werkt de telling bij na bewerken van de prompt', () => {
    const { rerender } = render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    setupMockPromptResult({ prompt: 'Kort' });
    rerender(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const metaEl = document.querySelector('.prompt-meta');
    expect(metaEl?.textContent).toBe('4 tekens · 1 woorden');
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

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <PromptResult />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('result_download_aria'));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickMock).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    createElementSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

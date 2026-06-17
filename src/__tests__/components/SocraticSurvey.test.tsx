import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SocraticSurvey } from '../../components/SocraticSurvey/SocraticSurvey';
import { MockI18nProvider } from '../helpers/mockI18n';
import type { Question } from '../../types';

const mockHandleNext = vi.fn();
const mockHandleOptionSelect = vi.fn();
const mockHandleBack = vi.fn();
const mockHandleCancel = vi.fn();
const mockSetInputError = vi.fn();

vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    useSurvey: vi.fn(),
  };
});

import { useSurvey } from '../../hooks';

function setupMockSurvey(overrides: Partial<ReturnType<typeof useSurvey>> = {}) {
  const defaultQuestion: Question = {
    id: 'subject',
    questionKey: 'survey_q_subject',
    descriptionKey: 'survey_q_subject_desc',
    type: 'text',
  };

  vi.mocked(useSurvey).mockReturnValue({
    step: 0,
    isGenerating: false,
    progressInfo: null,
    inputError: false,
    setInputError: mockSetInputError,
    currentQuestion: defaultQuestion,
    inputRef: { current: null },
    handleNext: mockHandleNext,
    handleOptionSelect: mockHandleOptionSelect,
    handleBack: mockHandleBack,
    handleCancel: mockHandleCancel,
    totalSteps: 3,
    ...overrides,
  });
}

describe('SocraticSurvey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendert een tekst vraag', () => {
    setupMockSurvey();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'survey_q_subject' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('survey_input_placeholder')).toBeInTheDocument();
  });

  it('rendert een selectie vraag met opties', () => {
    setupMockSurvey({
      currentQuestion: {
        id: 'style',
        questionKey: 'survey_q_style',
        descriptionKey: 'survey_q_style_desc',
        type: 'select',
        optionKeys: [
          'survey_option_visual',
          'survey_option_step',
        ],
      },
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('survey_option_visual')).toBeInTheDocument();
    expect(screen.getByText('survey_option_step')).toBeInTheDocument();
  });

  it('roept handleNext aan bij formulier verzending', () => {
    setupMockSurvey();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('survey_input_placeholder');
    fireEvent.change(input, { target: { value: 'Wiskunde' } });

    const form = input.closest('form');
    fireEvent.submit(form!);

    expect(mockHandleNext).toHaveBeenCalledWith('Wiskunde');
  });

  it('roept handleOptionSelect aan bij optie klik', () => {
    setupMockSurvey({
      currentQuestion: {
        id: 'style',
        questionKey: 'survey_q_style',
        descriptionKey: 'survey_q_style_desc',
        type: 'select',
        optionKeys: ['survey_option_visual'],
      },
    });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const option = screen.getByText('survey_option_visual');
    fireEvent.click(option);

    expect(mockHandleOptionSelect).toHaveBeenCalledWith('survey_option_visual');
  });

  it('toont een foutmelding bij inputError', () => {
    setupMockSurvey({ inputError: true });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('survey_input_error');
  });

  it('toont de terug knop na stap 0', () => {
    setupMockSurvey({ step: 1 });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('survey_back_label')).toBeInTheDocument();
  });

  it('roept handleBack aan bij terug knop klik', () => {
    setupMockSurvey({ step: 1 });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('survey_back_label'));
    expect(mockHandleBack).toHaveBeenCalled();
  });

  it('roept handleCancel aan bij annuleer knop klik', () => {
    setupMockSurvey();

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('survey_cancel_label'));
    expect(mockHandleCancel).toHaveBeenCalled();
  });

  it('toont de LoadingScreen tijdens generatie', () => {
    setupMockSurvey({ isGenerating: true, progressInfo: { text: 'Loading...', percentage: 0, isDownloading: false, fetchedMegabytes: undefined } });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('toont de progress bar', () => {
    setupMockSurvey({ step: 1, totalSteps: 3 });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    expect(progressBar).toHaveAttribute('aria-valuemax', '3');
  });

  it('reset inputError bij input wijziging', () => {
    setupMockSurvey({ inputError: true });

    render(
      <MemoryRouter>
        <MockI18nProvider>
          <SocraticSurvey />
        </MockI18nProvider>
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('survey_input_placeholder');
    fireEvent.change(input, { target: { value: 'a' } });

    expect(mockSetInputError).toHaveBeenCalledWith(false);
  });
});

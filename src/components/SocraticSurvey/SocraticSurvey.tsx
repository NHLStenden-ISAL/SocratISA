/**
 * SocraticSurvey: vragenlijst die de gebruiker doorloopt
 * om een Socratische AI-prompt op maat te genereren.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SurveyAnswers } from '../../App';
import './SocraticSurvey.css';

/** Opbouw van een survey vraag. */
interface Question {
  id: string;
  questionKey: string;
  descriptionKey: string;
  optionKeys?: string[];
  type: 'text' | 'select';
}

/**
 * Volgorde van de surveyvragen.
 * Stap 1: vak/onderwerp (vrij tekstveld)
 * Stap 2: specifiek onderwerp (vrij tekstveld)
 * Stap 3: leerstijlvoorkeur (meerkeuze)
 */
const QUESTION_DEFS: Question[] = [
  {
    id: 'subject',
    questionKey: 'survey_q_subject',
    descriptionKey: 'survey_q_subject_desc',
    type: 'text'
  },
  {
    id: 'topic',
    questionKey: 'survey_q_topic',
    descriptionKey: 'survey_q_topic_desc',
    type: 'text'
  },
  {
    id: 'style',
    questionKey: 'survey_q_style',
    descriptionKey: 'survey_q_style_desc',
    optionKeys: ['survey_option_visual', 'survey_option_step', 'survey_option_conceptual', 'survey_option_practical'],
    type: 'select'
  }
];

export const SocraticSurvey = ({ onComplete, onCancel }: { onComplete: (answers: SurveyAnswers) => void, onCancel: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputError, setInputError] = useState(false);

  const currentQ = QUESTION_DEFS[step];

  const handleNext = (value: string) => {
    if (!value.trim()) {
      setInputError(true);
      return;
    }
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);
    setInputError(false);

    if (step < QUESTION_DEFS.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey(newAnswers);
    }
  };

  const handleOptionSelect = (key: string) => {
    const newAnswers = { ...answers, [currentQ.id]: key };
    setAnswers(newAnswers);

    if (step < QUESTION_DEFS.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey(newAnswers);
    }
  };

  /**
   * Rondt de survey af: toont eerst een laad-indicator (1,5s)
   * en geeft dan de antwoorden door aan onComplete.
   */
  const finishSurvey = (finalAnswers: Record<string, string>) => {
    setIsGenerating(true);
    setTimeout(() => {
      onComplete({
        subject: finalAnswers.subject,
        topic: finalAnswers.topic,
        styleKey: finalAnswers.style,
      });
      setIsGenerating(false);
    }, 1500);
  };

  if (isGenerating) {
    return (
      <div className="survey-container loading" role="status" aria-live="polite">
        <div className="loading-content">
          <div className="spinner" aria-hidden="true"></div>
          <p>{t('survey_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-container">
      <div
        className="survey-progress"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={QUESTION_DEFS.length}
        aria-label={t('survey_progress_label')}
      >
        <div
          className="progress-bar"
          style={{ width: `${((step + 1) / QUESTION_DEFS.length) * 100}%` }}
        ></div>
      </div>

      <button className="cancel-survey" onClick={onCancel} aria-label={t('survey_cancel_label')}>
        <i className="fas fa-times" aria-hidden="true"></i>
      </button>

      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">
            {t('survey_step', { current: step + 1, total: QUESTION_DEFS.length })}
          </span>
          <h2>{t(currentQ.questionKey)}</h2>
          <p className="description">{t(currentQ.descriptionKey)}</p>

          <div className="input-area">
            {currentQ.type === 'text' ? (
              <form
                className="text-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.querySelector('input');
                  if (input?.value) handleNext(input.value);
                }}
              >
                <label htmlFor="survey-input" className="sr-only">{t(currentQ.questionKey)}</label>
                <input
                  id="survey-input"
                  autoFocus
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder={t('survey_input_placeholder')}
                  aria-describedby={inputError ? 'survey-error' : 'survey-hint'}
                  aria-invalid={inputError}
                  onChange={() => inputError && setInputError(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleNext(e.currentTarget.value);
                    }
                  }}
                />
                <button type="submit" className="submit-btn" aria-label={t('survey_submit_label')}>
                  <i className="fas fa-arrow-right" aria-hidden="true"></i>
                </button>
              </form>
            ) : (
              <div className="options-grid">
                {currentQ.optionKeys?.map(key => (
                  <button
                    key={key}
                    className="option-btn"
                    onClick={() => handleOptionSelect(key)}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentQ.type === 'text' && (
            <>
              {inputError && (
                <div className="survey-error" id="survey-error" role="alert">
                  {t('survey_input_error')}
                </div>
              )}
              <div className="hint" id="survey-hint">{t('survey_input_hint')}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

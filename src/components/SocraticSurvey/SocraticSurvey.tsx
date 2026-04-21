/**
 * SocraticSurvey: vragenlijst die de gebruiker doorloopt
 * om een Socratische AI-prompt op maat te genereren.
 */

import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useSurvey } from '../../hooks';
import type { Question } from '../../types';
import './SocraticSurvey.css';

interface QuestionInputProps {
  q: Question;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputError: boolean;
  setInputError: (v: boolean) => void;
  handleNext: (value: string) => void;
  handleOptionSelect: (key: string) => void;
  t: (key: string) => string;
}

function QuestionInput({ q, inputRef, inputError, setInputError, handleNext, handleOptionSelect, t }: QuestionInputProps) {
  switch (q.type) {
    case 'text':
      return (
        <form
          className="text-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector('input');
            if (input?.value) handleNext(input.value);
          }}
        >
          <label htmlFor="survey-input" className="sr-only">{t(q.questionKey)}</label>
          <input
            id="survey-input"
            ref={inputRef}
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
            <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
          </button>
        </form>
      );
    case 'select':
      return (
        <div className="options-grid">
          {q.optionKeys?.map(key => (
            <button
              key={key}
              className="option-btn"
              onClick={() => handleOptionSelect(key)}
            >
              {t(key)}
            </button>
          ))}
        </div>
      );
  }
}

export const SocraticSurvey = () => {
  const { t } = useTranslation();
  const {
    step,
    isGenerating,
    inputError,
    setInputError,
    currentQ,
    inputRef,
    handleNext,
    handleOptionSelect,
    handleCancel,
    totalSteps,
  } = useSurvey();

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
        aria-valuemax={totalSteps}
        aria-label={t('survey_progress_label')}
      >
        <div
          className="progress-bar"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>

      <button className="cancel-survey" onClick={handleCancel} aria-label={t('survey_cancel_label')}>
        <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
      </button>

      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">
            {t('survey_step', { current: step + 1, total: totalSteps })}
          </span>
          <h2>{t(currentQ.questionKey)}</h2>
          <p className="description">{t(currentQ.descriptionKey)}</p>

          <div className="input-area">
            <QuestionInput
              q={currentQ}
              inputRef={inputRef}
              inputError={inputError}
              setInputError={setInputError}
              handleNext={handleNext}
              handleOptionSelect={handleOptionSelect}
              t={t}
            />
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

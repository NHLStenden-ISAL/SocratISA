/**
 * SocraticSurvey: vragenlijst die de gebruiker doorloopt
 * om een Socratische AI-prompt op maat te genereren.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { SurveyService, SURVEY_QUESTIONS } from '../../services/SurveyService';
import type { SurveyAnswers } from '../../types';
import './SocraticSurvey.css';


export const SocraticSurvey = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const surveyServiceRef = useRef(new SurveyService());
  const surveyService = surveyServiceRef.current;
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputError, setInputError] = useState(false);

  const currentQ = SURVEY_QUESTIONS[step];

  const handleNext = (value: string) => {
    if (!SurveyService.validate(value)) {
      setInputError(true);
      return;
    }
    surveyService.setAnswer(currentQ.id, value);
    setInputError(false);

    if (step < SURVEY_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey();
    }
  };

  const handleOptionSelect = (key: string) => {
    surveyService.setAnswer(currentQ.id, key);

    if (step < SURVEY_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey();
    }
  };

  /**
   * Rondt de survey af: toont eerst een laad-indicator (1,5s)
   * en navigeert dan naar het resultaat met de antwoorden als route state.
   */
  const finishSurvey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const answers: SurveyAnswers = surveyService.toSurveyAnswers();
      navigate('/result', { state: { answers } });
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
        aria-valuemax={SURVEY_QUESTIONS.length}
        aria-label={t('survey_progress_label')}
      >
        <div
          className="progress-bar"
          style={{ width: `${((step + 1) / SURVEY_QUESTIONS.length) * 100}%` }}
        ></div>
      </div>

      <button className="cancel-survey" onClick={() => navigate('/')} aria-label={t('survey_cancel_label')}>
        <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
      </button>

      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">
            {t('survey_step', { current: step + 1, total: SURVEY_QUESTIONS.length })}
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
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
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

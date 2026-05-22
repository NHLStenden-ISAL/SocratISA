/**
 * SocraticSurvey: vragenlijst die de gebruiker doorloopt om de prompt te maken.
 */
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useSurvey } from '../../hooks';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';
import './SocraticSurvey.css';

export const SocraticSurvey = () => {
  const { t } = useTranslation();
  const {
    step,
    isGenerating,
    progressInfo,
    inputError,
    setInputError,
    currentQ,
    inputRef,
    handleNext,
    handleOptionSelect,
    handleBack,
    handleCancel,
    totalSteps,
  } = useSurvey();

  if (isGenerating) {
    return <LoadingScreen progressInfo={progressInfo} onCancel={handleCancel} />;
  }

  return (
    <div className="survey-container">

      {/* Survey progressie bar */}
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

      {/* Annuleer knop */}
      <button className="cancel-survey" onClick={handleCancel} aria-label={t('survey_cancel_label')}>
        <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
      </button>

      {/* Vraag titel en descriptie */}
      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">
            {t('survey_step', { current: step + 1, total: totalSteps })}
          </span>
          <h1 id="survey-question" tabIndex={-1}>
            {t(currentQ.questionKey)}
          </h1>
          <p className="description">{t(currentQ.descriptionKey)}</p>

          <div className="input-area">
            {/* Open vraag */}
            {currentQ.type === 'text' ? (
              <form
                className="text-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputRef.current?.value) handleNext(inputRef.current.value);
                }}
              >
                <label htmlFor="survey-input" className="sr-only">{t(currentQ.questionKey)}</label>
                <input
                  id="survey-input"
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder={t('survey_input_placeholder')}
                  aria-labelledby="survey-question"
                  aria-describedby={inputError ? 'survey-error' : 'survey-hint'}
                  aria-invalid={inputError}
                  onChange={() => inputError && setInputError(false)}
                />

                {/* Volgende vraag knop */}
                <button type="submit" className="submit-btn" aria-label={t('survey_submit_label')}>
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                </button>
              </form>
            ) : (
              // Keuze vraag
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

          {/* Volgende vraag tip */}
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

          {/* Vorige vraag knop */}
          {step > 0 && (
            <button
              className="back-btn"
              onClick={handleBack}
              aria-label={t('survey_back_label')}
            >
              <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
              <span>{t('survey_back')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

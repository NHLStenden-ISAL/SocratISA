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
    currentQuestion,
    inputRef,
    handleNext,
    handleOptionSelect,
    handleBack,
    handleCancel,
    totalSteps,
  } = useSurvey();

  if (isGenerating) {
    return <LoadingScreen progressInfo={progressInfo} />;
  }

  return (
    <div className="survey-container">

      {/* Survey progressie bar */}
      <progress className="progress survey" value={step + 1} max={totalSteps} aria-label={t('survey.progressLabel')} />

      {/* Annuleer knop */}
      <button className="cancel-survey" onClick={handleCancel} aria-label={t('survey.cancelLabel')}>
        <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
      </button>

      {/* Vraag titel en descriptie */}
      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">
            {t('survey.step', { current: step + 1, total: totalSteps })}
          </span>
          <h1 id="survey-question" tabIndex={-1}>
            {t(currentQuestion.questionKey)}
          </h1>
          <p className="description">{t(currentQuestion.descriptionKey)}</p>

          <div className="input-area">
            {/* Open vraag */}
            {currentQuestion.type === 'text' ? (
              <form
                className="text-input-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (inputRef.current?.value) handleNext(inputRef.current.value);
                }}
              >
                <label htmlFor="survey-input" className="sr-only">{t(currentQuestion.questionKey)}</label>
                <input
                  id="survey-input"
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder={t('survey.inputPlaceholder')}
                  aria-labelledby="survey-question"
                  aria-describedby={inputError ? 'survey-error' : 'survey-hint'}
                  aria-invalid={inputError}
                  onChange={() => inputError && setInputError(false)}
                />

                {/* Volgende vraag knop */}
                <button type="submit" className="submit-btn" aria-label={t('survey.submitLabel')}>
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                </button>
              </form>
            ) : (
              // Keuze vraag
              <div className="options-grid">
                {currentQuestion.optionKeys?.map(key => (
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
          {currentQuestion.type === 'text' && (
            <>
              {inputError && (
                <div className="survey-error" id="survey-error" role="alert">
                  {t('survey.inputError')}
                </div>
              )}
              <div className="hint" id="survey-hint">{t('survey.inputHint')}</div>
            </>
          )}

          {/* Vorige vraag knop */}
          {step > 0 && (
            <button
              className="back-btn"
              onClick={handleBack}
              aria-label={t('survey.backLabel')}
            >
              <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
              <span>{t('survey.back')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

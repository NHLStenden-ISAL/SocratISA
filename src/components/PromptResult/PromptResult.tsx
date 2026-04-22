/**
 * PromptResult: toont de gegenereerde Socratische prompt
 * en biedt knoppen om te kopiëren of door te gaan naar een AI-provider.
 */

import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faHome } from '@fortawesome/free-solid-svg-icons';
import { usePromptResult } from '../../hooks';
import './PromptResult.css';

export const PromptResult = () => {
  const { t } = useTranslation();
  const {
    prompt,
    isGenerating,
    isStreaming,
    progressText,
    isEditing,
    feedback,
    isCopying,
    isComplete,
    textareaRef,
    setPrompt,
    handleEdit,
    handleDone,
    handleCopy,
    handleProvider,
    handleRetry,
    handleHome,
    providers,
  } = usePromptResult();

  if (isGenerating) {
    return (
      <div className="result-loading" role="status" aria-live="polite">
        <div className="loading-content">
          <div className="spinner" aria-hidden="true"></div>
          <p>{progressText || t('result_generating')}</p>
        </div>
      </div>
    );
  }

  const tooltip = isStreaming ? t('tooltip_wait_for_stream') : undefined;

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h2>{t('result_title')}</h2>
        </div>

        <div className="prompt-display">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={Math.max(8, prompt.split('\n').length + 2)}
            />
          ) : (
            <div className={`prompt-text ${!isComplete ? 'streaming' : ''}`}>
              {prompt}
            </div>
          )}
        </div>

        {feedback && <div className="copy-feedback" role="status" aria-live="polite">{feedback}</div>}

        <div className="prompt-actions">
          {isEditing ? (
            <button
              className="action-btn secondary"
              onClick={handleDone}
              aria-label={t('result_done_aria')}
            >
              {t('result_done')}
            </button>
          ) : (
            <button
              className="action-btn secondary tooltip-trigger"
              onClick={handleEdit}
              disabled={isStreaming}
              aria-label={t('result_edit_aria')}
              data-tooltip={tooltip}
            >
              {t('result_edit')}
            </button>
          )}
          <button
            className="action-btn primary tooltip-trigger"
            onClick={handleCopy}
            disabled={isCopying || isStreaming}
            aria-label={t('result_copy_aria')}
            data-tooltip={tooltip}
          >
            {t('result_copy')}
          </button>
        </div>

        <div className="provider-section">
          <p className="provider-cta">{t('result_cta')}</p>
          <div className="provider-grid">
            {providers.map(provider => (
              <button
                key={provider.name}
                className="provider-btn tooltip-trigger"
                onClick={() => handleProvider(provider.name)}
                disabled={isStreaming}
                aria-label={t('result_provider_aria', { provider: provider.name })}
                data-tooltip={tooltip}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        <div className="result-footer">
          <button className="footer-btn" onClick={handleRetry} aria-label={t('result_retry_aria')}>
            <FontAwesomeIcon icon={faRedo} aria-hidden="true" /> {t('result_retry')}
          </button>
          <button className="footer-btn" onClick={handleHome} aria-label={t('result_home_aria')}>
            <FontAwesomeIcon icon={faHome} aria-hidden="true" /> {t('result_home')}
          </button>
        </div>
      </div>
    </div>
  );
};

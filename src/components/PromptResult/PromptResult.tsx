/**
 * PromptResult: toont de gegenereerde Socratische prompt
 * en biedt knoppen om te kopiëren of door te gaan naar een AI-provider.
 */

import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faHome } from '@fortawesome/free-solid-svg-icons';
import { usePromptResult } from '../../hooks/usePromptResult';
import './PromptResult.css';

export const PromptResult = () => {
  const { t } = useTranslation();
  const {
    prompt,
    isEditing,
    feedback,
    isCopying,
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
            <div className="prompt-text">{prompt}</div>
          )}
        </div>

        {feedback && <div className="copy-feedback" role="status" aria-live="polite">{feedback}</div>}

        <div className="prompt-actions">
          {isEditing ? (
            <button className="action-btn secondary" onClick={handleDone} aria-label={t('result_done_aria')}>
              {t('result_done')}
            </button>
          ) : (
            <button className="action-btn secondary" onClick={handleEdit} aria-label={t('result_edit_aria')}>
              {t('result_edit')}
            </button>
          )}
          <button className="action-btn primary" onClick={handleCopy} disabled={isCopying} aria-label={t('result_copy_aria')}>
            {t('result_copy')}
          </button>
        </div>

        <div className="provider-section">
          <p className="provider-cta">{t('result_cta')}</p>
          <div className="provider-grid">
            {providers.map(provider => (
              <button
                key={provider.name}
                className="provider-btn"
                onClick={() => handleProvider(provider.name)}
                aria-label={t('result_provider_aria', { provider: provider.name })}
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

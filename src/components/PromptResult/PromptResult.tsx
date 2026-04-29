/**
 * PromptResult: toont de gegenereerde Socratische prompt
 * en biedt knoppen om te kopiëren of door te gaan naar een AI-provider.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faHome } from '@fortawesome/free-solid-svg-icons';
import { usePromptResult } from '../../hooks';
import { PromptGenerator } from '../PromptGenerator/PromptGenerator';
import './PromptResult.css';

export const PromptResult = () => {
  const [prompt, setPrompt] = useState<string | null>(null);

  if (prompt === null) {
    return <PromptGenerator onComplete={setPrompt} />;
  }

  return <PromptResultView prompt={prompt} />;
};

function PromptResultView({ prompt }: { prompt: string }) {
  const { t } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const {
    prompt: displayPrompt,
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
  } = usePromptResult(prompt);

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h1 ref={headingRef} tabIndex={-1}>{t('result_title')}</h1>
        </div>

        <div className="prompt-display">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="prompt-textarea"
              aria-label={t('result_textarea_label')}
              value={displayPrompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={Math.max(8, displayPrompt.split('\n').length + 2)}
            />
          ) : (
            <div className="prompt-text">
              {displayPrompt}
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
              className="action-btn secondary"
              onClick={handleEdit}
              aria-label={t('result_edit_aria')}
            >
              {t('result_edit')}
            </button>
          )}
          <button
            className="action-btn primary"
            onClick={handleCopy}
            disabled={isCopying}
            aria-label={t('result_copy_aria')}
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
          <button className="footer-btn" onClick={handleRetry} aria-label={t('result_retry_aria_v2')}>
            <FontAwesomeIcon icon={faRedo} aria-hidden="true" /> {t('result_retry')}
          </button>
          <button className="footer-btn" onClick={handleHome} aria-label={t('result_home_aria_v2')}>
            <FontAwesomeIcon icon={faHome} aria-hidden="true" /> {t('result_home')}
          </button>
        </div>
      </div>
    </div>
  );
}

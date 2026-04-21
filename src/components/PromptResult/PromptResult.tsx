/**
 * PromptResult: toont de gegenereerde Socratische prompt
 * en biedt knoppen om te kopiëren of door te gaan naar een AI-provider.
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faHome } from '@fortawesome/free-solid-svg-icons';
import { FallbackService } from '../../services/FallbackService';
import { ProviderService } from '../../services/ProviderService';
import type { SurveyAnswers } from '../../types';
import './PromptResult.css';


export const PromptResult = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const answers: SurveyAnswers = location.state?.answers ?? { subject: '', topic: '', styleKey: '' };
  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const providerServiceRef = useRef(new ProviderService());
  const providerService = providerServiceRef.current;

  /** Genereer de fallback prompt via FallbackService. */
  const generatedPrompt = FallbackService.generatePrompt(answers, t);

  /** Geef de bewerkte prompt terug als die er is, anders de gegenereerde prompt */
  const prompt = edits[i18n.language] ?? generatedPrompt;
  const setPrompt = (value: string) => setEdits(prev => ({ ...prev, [i18n.language]: value }));

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDone = () => {
    setIsEditing(false);
  };

  /** Kopieer naar klembord of open deelmenu op mobiel */
  const handleCopy = async () => {
    setIsCopying(true);
    try {
      if (navigator.share) {
        await navigator.share({ text: prompt });
      } else {
        await navigator.clipboard.writeText(prompt);
      }
      showFeedback(t('result_copied'));
    } catch {
      try {
        await navigator.clipboard.writeText(prompt);
        showFeedback(t('result_copied'));
      } catch {
        showFeedback(t('result_copy_failed'));
      }
    } finally {
      setIsCopying(false);
    }
  };

  /** Open provider met vooringevulde prompt */
  const handleProvider = (providerName: string) => {
    const url = providerService.buildUrl(providerName, prompt);
    window.open(url, '_blank', 'noopener');
  };

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
            {providerService.getProviders().map(provider => (
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
          <button className="footer-btn" onClick={() => navigate('/survey')} aria-label={t('result_retry_aria')}>
            <FontAwesomeIcon icon={faRedo} aria-hidden="true" /> {t('result_retry')}
          </button>
          <button className="footer-btn" onClick={() => navigate('/')} aria-label={t('result_home_aria')}>
            <FontAwesomeIcon icon={faHome} aria-hidden="true" /> {t('result_home')}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * PromptResult: toont de gegenereerde Socratische prompt
 * en biedt knoppen om te kopiëren of door te gaan naar een AI-provider.
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { SurveyAnswers } from '../../App';
import './PromptResult.css';

/** Props voor survey antwoorden, retry en home opties. */
interface PromptResultProps {
  answers: SurveyAnswers;
  onRetry: () => void;
  onHome: () => void;
}

/** Koppelt survey-keuzes aan stijl-aanwijzingen voor de prompt-template. */
const STYLE_HINT_MAP: Record<string, string> = {
  'survey_option_visual': 'style_hint_visual',
  'survey_option_step': 'style_hint_step',
  'survey_option_conceptual': 'style_hint_conceptual',
  'survey_option_practical': 'style_hint_practical',
};

/** Meestgebruikte AI-providers waar de prompt naar gekopieerd kan worden. */
const PROVIDERS = [
  { name: 'ChatGPT', url: (q: string) => `https://chat.openai.com/?q=${encodeURIComponent(q)}` },
  { name: 'Claude', url: (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}` },
  { name: 'Gemini', url: (q: string) => `https://gemini.google.com/app?q=${encodeURIComponent(q)}` },
];

export const PromptResult = ({ answers, onRetry, onHome }: PromptResultProps) => {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Bepaal de stijl-aanwijzing op basis van de gekozen leerstijl. */
  const styleHintKey = STYLE_HINT_MAP[answers.styleKey] || 'style_hint_default';
  /** Vul de prompt-template in met de survey antwoorden */
  const generatedPrompt = t('prompt_template', {
    subject: answers.subject,
    topic: answers.topic,
    styleHint: t(styleHintKey),
  });

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
    }
  };

  /** Kopieer prompt en open provider met vooringevulde prompt */
  const handleProvider = async (urlFn: (q: string) => string) => {
    const url = urlFn(prompt);
    try {
      if (navigator.share) {
        await navigator.share({ text: prompt, url });
        return;
      }
      await navigator.clipboard.writeText(prompt);
      showFeedback(t('result_copied_provider'));
    } catch {
      try {
        await navigator.clipboard.writeText(prompt);
        showFeedback(t('result_copied_provider'));
      } catch {
        showFeedback(t('result_copy_failed'));
      }
    }
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
          <button className="action-btn primary" onClick={handleCopy} aria-label={t('result_copy_aria')}>
            {t('result_copy')}
          </button>
        </div>

        <div className="provider-section">
          <p className="provider-cta">{t('result_cta')}</p>
          <div className="provider-grid">
            {PROVIDERS.map(provider => (
              <button
                key={provider.name}
                className="provider-btn"
                onClick={() => handleProvider(provider.url)}
                aria-label={t('result_provider_aria', { provider: provider.name })}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        <div className="result-footer">
          <button className="footer-btn" onClick={onRetry} aria-label={t('result_retry_aria')}>
            <i className="fas fa-redo" aria-hidden="true"></i> {t('result_retry')}
          </button>
          <button className="footer-btn" onClick={onHome} aria-label={t('result_home_aria')}>
            <i className="fas fa-home" aria-hidden="true"></i> {t('result_home')}
          </button>
        </div>
      </div>
    </div>
  );
};

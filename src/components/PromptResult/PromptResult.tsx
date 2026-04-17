import { useTranslation } from 'react-i18next';
import type { SurveyAnswers } from '../../App';
import './PromptResult.css';

interface PromptResultProps {
  answers: SurveyAnswers;
  onRetry: () => void;
  onHome: () => void;
}

const STYLE_HINT_MAP: Record<string, string> = {
  'survey_option_visual': 'style_hint_visual',
  'survey_option_step': 'style_hint_step',
  'survey_option_conceptual': 'style_hint_conceptual',
  'survey_option_practical': 'style_hint_practical',
};

const PROVIDERS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com/', icon: 'fas fa-robot' },
  { name: 'Claude', url: 'https://claude.ai/', icon: 'fas fa-brain' },
  { name: 'Gemini', url: 'https://gemini.google.com/', icon: 'fas fa-stars' },
];

export const PromptResult = ({ answers, onRetry, onHome }: PromptResultProps) => {
  const { t } = useTranslation();

  const styleHintKey = STYLE_HINT_MAP[answers.styleKey] || 'style_hint_default';
  const prompt = t('prompt_template', {
    subject: answers.subject,
    topic: answers.topic,
    styleHint: t(styleHintKey),
  });

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h2>{t('result_title')}</h2>
        </div>

        <div className="prompt-display">
          <div className="prompt-text">{prompt}</div>
        </div>

        <div className="prompt-actions">
          <button className="action-btn secondary">
            {t('result_edit')}
          </button>
          <button className="action-btn primary">
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
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        <div className="result-footer">
          <button className="footer-btn" onClick={onRetry}>
            <i className="fas fa-redo"></i> {t('result_retry')}
          </button>
          <button className="footer-btn" onClick={onHome}>
            <i className="fas fa-home"></i> {t('result_home')}
          </button>
        </div>
      </div>
    </div>
  );
};

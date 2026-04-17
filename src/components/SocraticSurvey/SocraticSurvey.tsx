import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SurveyAnswers } from '../../App';
import './SocraticSurvey.css';

interface Question {
  id: string;
  questionKey: string;
  descriptionKey: string;
  optionKeys?: string[];
  type: 'text' | 'select';
}

const QUESTION_DEFS: Question[] = [
  {
    id: 'subject',
    questionKey: 'survey_q_subject',
    descriptionKey: 'survey_q_subject_desc',
    type: 'text'
  },
  {
    id: 'topic',
    questionKey: 'survey_q_topic',
    descriptionKey: 'survey_q_topic_desc',
    type: 'text'
  },
  {
    id: 'style',
    questionKey: 'survey_q_style',
    descriptionKey: 'survey_q_style_desc',
    optionKeys: ['survey_option_visual', 'survey_option_step', 'survey_option_conceptual', 'survey_option_practical'],
    type: 'select'
  }
];

export const SocraticSurvey = ({ onComplete, onCancel }: { onComplete: (answers: SurveyAnswers) => void, onCancel: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const currentQ = QUESTION_DEFS[step];

  const handleNext = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);

    if (step < QUESTION_DEFS.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey(newAnswers);
    }
  };

  const handleOptionSelect = (key: string) => {
    const newAnswers = { ...answers, [currentQ.id]: key };
    setAnswers(newAnswers);

    if (step < QUESTION_DEFS.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey(newAnswers);
    }
  };

  const finishSurvey = (finalAnswers: Record<string, string>) => {
    setIsGenerating(true);
    setTimeout(() => {
      onComplete({
        subject: finalAnswers.subject,
        topic: finalAnswers.topic,
        styleKey: finalAnswers.style,
      });
      setIsGenerating(false);
    }, 1500);
  };

  if (isGenerating) {
    return (
      <div className="survey-container loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{t('survey_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-container">
      <div className="survey-progress">
        <div
          className="progress-bar"
          style={{ width: `${((step + 1) / QUESTION_DEFS.length) * 100}%` }}
        ></div>
      </div>

      <button className="cancel-survey" onClick={onCancel}>
        <i className="fas fa-times"></i>
      </button>

      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">
            {t('survey_step', { current: step + 1, total: QUESTION_DEFS.length })}
          </span>
          <h2>{t(currentQ.questionKey)}</h2>
          <p className="description">{t(currentQ.descriptionKey)}</p>

          <div className="input-area">
            {currentQ.type === 'text' ? (
              <input
                autoFocus
                type="text"
                placeholder={t('survey_input_placeholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleNext(e.currentTarget.value);
                  }
                }}
              />
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
            <div className="hint">{t('survey_input_hint')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

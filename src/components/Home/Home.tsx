/**
 * Home: landingspagina met informatie over generatieve AI en Socratisch leren.
 * Bevat secties over AI-toepassingen, valkuilen en een CTA naar de survey.
 */

import { useTranslation } from 'react-i18next';
import './Home.css'

/** Props om de Socratische vragenlijst te starten. */
interface HomeProps {
  onStartSurvey: () => void;
}

export const Home = ({ onStartSurvey }: HomeProps) => {
  const { t } = useTranslation();

  return (
    <div className="article">
      <h1>{t('home_title')}</h1>
      
      <section className="article-text">
        <p>{t('home_intro_1')}</p>
        <p>{t('home_intro_2')}</p>
      </section>

      <h2>{t('home_practice_title')}</h2>
      <section className="article-text">
        <p>{t('home_practice_1')}</p>
        <p>{t('home_practice_2')}</p>
      </section>

      <h2>{t('home_apps_title')}</h2>
      <section className="article-text">
        <p>{t('home_apps_intro')}</p>
      </section>
      <section className="example-grid" aria-label={t('home_apps_title')}>
        <div className="example-box">
          <h3>{t('app_rag_title')}</h3>
          <p>{t('app_rag_desc')}</p>
        </div>
        <div className="example-box">
          <h3>{t('app_cv_title')}</h3>
          <p>{t('app_cv_desc')}</p>
        </div>
        <div className="example-box">
          <h3>{t('app_tool_title')}</h3>
          <p>{t('app_tool_desc')}</p>
        </div>
      </section>
      <section className="article-text">
        <p>{t('home_apps_outro')}</p>
      </section>

      <h2>{t('home_pitfalls_title')}</h2>
      <section className="article-text">
        <p>{t('home_pitfalls_1')}</p>
        <p>{t('home_pitfalls_2')}</p>
      </section>

      <section className="pitfalls-grid" aria-label={t('home_pitfalls_title')}>
        <div className="pitfall-box bad" role="img" aria-label={t('pitfall_no_check_title')}>
          <h3>{t('pitfall_no_check_title')}</h3>
          <p>{t('pitfall_no_check_desc')}</p>
        </div>
        <div className="pitfall-box good" role="img" aria-label={t('pitfall_critical_title')}>
          <h3>{t('pitfall_critical_title')}</h3>
          <p>{t('pitfall_critical_desc')}</p>
        </div>
        <div className="pitfall-box bad" role="img" aria-label={t('pitfall_privacy_bad_title')}>
          <h3>{t('pitfall_privacy_bad_title')}</h3>
          <p>{t('pitfall_privacy_bad_desc')}</p>
        </div>
        <div className="pitfall-box good" role="img" aria-label={t('pitfall_privacy_good_title')}>
          <h3>{t('pitfall_privacy_good_title')}</h3>
          <p>{t('pitfall_privacy_good_desc')}</p>
        </div>
        <div className="pitfall-box bad" role="img" aria-label={t('pitfall_trust_title')}>
          <h3>{t('pitfall_trust_title')}</h3>
          <p>{t('pitfall_trust_desc')}</p>
        </div>
        <div className="pitfall-box good" role="img" aria-label={t('pitfall_tool_title')}>
          <h3>{t('pitfall_tool_title')}</h3>
          <p>{t('pitfall_tool_desc')}</p>
        </div>
      </section>

      <h2>{t('home_socratic_title')}</h2>
      <section className="article-text">
        <p>{t('home_socratic_1')}</p>
        <p>{t('home_socratic_2')}</p>
        <p>{t('home_socratic_3')}</p>
      </section>

      <h2>{t('home_action_title')}</h2>
      <section className="article-text">
        <p>{t('home_action_1')}</p>
        <p>{t('home_action_2')}</p>
      </section>

      <div className="button-container">
        <button className="socratic-button" onClick={onStartSurvey} aria-label={t('home_cta_aria')}>
          {t('home_cta')}
        </button>
      </div>
    </div>
  );
};

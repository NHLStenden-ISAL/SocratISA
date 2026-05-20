/**
 * Info: informatiepagina over hoe generatieve AI werkt.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../Home/Home.css';
import './Info.css';

export const Info = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="article">
      <h1>{t('info_title')}</h1>

      <section className="article-text">
        <p>{t('info_intro')}</p>
      </section>

      <h2>{t('info_practice_title')}</h2>
      <section className="article-text">
        <p>{t('info_practice_1')}</p>
        <p>{t('info_practice_2')}</p>
      </section>

      <h2>{t('info_apps_title')}</h2>
      <section className="article-text">
        <p>{t('info_apps_intro')}</p>
      </section>
      <section className="example-grid" aria-label={t('info_apps_title')}>
        <div className="example-box">
          <h3>{t('info_app_rag_title')}</h3>
          <p>{t('info_app_rag_desc')}</p>
        </div>
        <div className="example-box">
          <h3>{t('info_app_cv_title')}</h3>
          <p>{t('info_app_cv_desc')}</p>
        </div>
        <div className="example-box">
          <h3>{t('info_app_tool_title')}</h3>
          <p>{t('info_app_tool_desc')}</p>
        </div>
      </section>
      <section className="article-text">
        <p>{t('info_apps_outro')}</p>
      </section>

      <div className="button-container">
        <button
          className="socratic-button"
          onClick={() => navigate('/')}
        >
          {t('info_cta_back')}
        </button>
      </div>
    </div>
  );
};

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
      <h1>{t('info.title')}</h1>

      <section className="article-text">
        <p>{t('info.intro')}</p>
      </section>

      <h2>{t('info.practiceTitle')}</h2>
      <section className="article-text">
        <p>{t('info.practice1')}</p>
        <p>{t('info.practice2')}</p>
      </section>

      <h2>{t('info.appsTitle')}</h2>
      <section className="article-text">
        <p>{t('info.appsIntro')}</p>
      </section>
      <section className="example-grid" aria-label={t('info.appsTitle')}>
        <div className="example-box">
          <h3>{t('info.imageTitle')}</h3>
          <p>{t('info.imageDescription')}</p>
        </div>
        <div className="example-box">
          <h3>{t('info.audioTitle')}</h3>
          <p>{t('info.audioDescription')}</p>
        </div>
        <div className="example-box">
          <h3>{t('info.videoTitle')}</h3>
          <p>{t('info.videoDescription')}</p>
        </div>
      </section>
      <section className="article-text">
        <p>{t('info.appsOutro')}</p>
      </section>

      <div className="button-container">
        <button
          className="socratic-button"
          onClick={() => navigate('/', { state: { scrollToInfoLink: true } })}
        >
          {t('info.backToHome')}
        </button>
      </div>
    </div>
  );
};

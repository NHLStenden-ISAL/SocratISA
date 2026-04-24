/**
 * Home: landingspagina met informatie over generatieve AI en Socratisch leren.
 * Bevat secties over AI-toepassingen, valkuilen en een CTA naar de survey.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGPUStatus } from '../../hooks';
import './Home.css'

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAvailable, isChecking } = useGPUStatus();
  const [showDialog, setShowDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleCTA = () => {
    if (isChecking) return;
    if (isAvailable) {
      setShowDialog(true);
    } else {
      navigate('/survey');
    }
  };

  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  useEffect(() => {
    if (!showDialog) return;
    const timer = setTimeout(() => {
      const firstButton = dialogRef.current?.querySelector('button');
      firstButton?.focus();
    }, 0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDialog();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDialog, closeDialog]);

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
        <div className="pitfall-box bad">
          <h3>{t('pitfall_no_check_title')}</h3>
          <p>{t('pitfall_no_check_desc')}</p>
        </div>
        <div className="pitfall-box good">
          <h3>{t('pitfall_critical_title')}</h3>
          <p>{t('pitfall_critical_desc')}</p>
        </div>
        <div className="pitfall-box bad">
          <h3>{t('pitfall_privacy_bad_title')}</h3>
          <p>{t('pitfall_privacy_bad_desc')}</p>
        </div>
        <div className="pitfall-box good">
          <h3>{t('pitfall_privacy_good_title')}</h3>
          <p>{t('pitfall_privacy_good_desc')}</p>
        </div>
        <div className="pitfall-box bad">
          <h3>{t('pitfall_trust_title')}</h3>
          <p>{t('pitfall_trust_desc')}</p>
        </div>
        <div className="pitfall-box good">
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
        <button className="socratic-button" onClick={handleCTA} aria-label={t('home_cta_aria')}>
          {t('home_cta')}
        </button>
      </div>

      {showDialog && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="download-dialog-title" onClick={(e) => { if (e.target === e.currentTarget) closeDialog() }}>
          <div className="dialog-box" ref={dialogRef}>
            <h3 id="download-dialog-title">{t('home_download_dialog_title')}</h3>
            <p>{t('home_download_dialog_body')}</p>
            <div className="dialog-actions">
              <button className="dialog-btn secondary" onClick={() => navigate('/survey?fallback=true')}>
                {t('home_download_dialog_fallback')}
              </button>
              <button className="dialog-btn primary" onClick={() => navigate('/survey')}>
                {t('home_download_dialog_continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

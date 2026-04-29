/**
 * Home: landingspagina met informatie over generatieve AI en Socratisch leren.
 * Bevat secties over AI-toepassingen, valkuilen en een CTA naar de survey.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGPUStatus } from '../../hooks';
import { useServices } from '../../contexts/useServices';
import './Home.css'

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAvailable, isChecking } = useGPUStatus();
  const { promptGeneratorService } = useServices();
  const [showPreloadOffer, setShowPreloadOffer] = useState(false);
  const [preloadOfferDismissed, setPreloadOfferDismissed] = useState(false);
  const preloadDialogRef = useRef<HTMLDivElement>(null);
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [preloadProgress, setPreloadProgress] = useState('');

  const handleCTA = () => {
    if (isChecking) return;
    navigate('/survey');
  };

  const handlePreload = async () => {
    setShowPreloadOffer(false);
    setPreloadStatus('loading');
    try {
      await promptGeneratorService.preload(t, setPreloadProgress);
      setPreloadStatus('ready');
      setPreloadProgress('');
    } catch {
      setPreloadStatus('error');
      setPreloadProgress('');
    }
  };

  const dismissPreloadOffer = useCallback(() => {
    setShowPreloadOffer(false);
    setPreloadOfferDismissed(true);
  }, []);

  useEffect(() => {
    if (!isChecking && isAvailable && preloadStatus === 'idle' && !showPreloadOffer && !preloadOfferDismissed) {
      const timer = setTimeout(() => setShowPreloadOffer(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isChecking, isAvailable, preloadStatus, showPreloadOffer, preloadOfferDismissed]);

  useEffect(() => {
    if (!showPreloadOffer) return;
    const timer = setTimeout(() => {
      const firstButton = preloadDialogRef.current?.querySelector('button');
      firstButton?.focus();
    }, 0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissPreloadOffer();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = preloadDialogRef.current?.querySelectorAll<HTMLElement>(
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
  }, [showPreloadOffer, dismissPreloadOffer]);

  return (
    <>
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
          <button className="socratic-button" onClick={handleCTA} aria-label={t('home_cta_aria_v2')}>
            {t('home_cta')}
          </button>
          {preloadStatus === 'loading' && (
            <div className="preload-status" role="status" aria-live="polite">
              <div className="preload-spinner" aria-hidden="true"></div>
              <span className="preload-text">{preloadProgress || t('home_preload_loading')}</span>
            </div>
          )}
          {preloadStatus === 'ready' && (
            <div className="preload-status ready" role="status" aria-live="polite">
              <span className="preload-text">{t('home_preload_ready')}</span>
            </div>
          )}
          {preloadStatus === 'error' && (
            <div className="preload-status error" role="status" aria-live="polite">
              <span className="preload-text">{t('home_preload_error')}</span>
            </div>
          )}
        </div>
      </div>

      {showPreloadOffer && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="preload-dialog-title" onClick={(e) => { if (e.target === e.currentTarget) dismissPreloadOffer() }}>
          <div className="dialog-box" ref={preloadDialogRef}>
            <h3 id="preload-dialog-title">{t('home_preload_dialog_title')}</h3>
            <p>{t('home_preload_dialog_body')}</p>
            <div className="dialog-actions">
              <button className="dialog-btn secondary" onClick={dismissPreloadOffer}>
                {t('home_preload_dialog_dismiss')}
              </button>
              <button className="dialog-btn primary" onClick={handlePreload}>
                {t('home_preload_dialog_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

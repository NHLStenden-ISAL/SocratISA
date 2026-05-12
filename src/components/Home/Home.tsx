/**
 * Home: hoofdpagina met informatie over generatieve AI en Socratisch leren, samen met een CTA naar de vragenlijst.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGPUStatus } from '../../hooks';
import { useServices } from '../../contexts/useServices';
import { Dialog } from '../Dialog/Dialog';
import { formatProgressText } from '../../utils/progress';
import type { ProgressInfo } from '../../types';
import './Home.css';

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAvailable } = useGPUStatus();
  const { promptGeneratorService } = useServices();
  const [showPreloadOffer, setShowPreloadOffer] = useState(false);
  const [preloadOfferDismissed, setPreloadOfferDismissed] = useState(false);
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [preloadProgress, setPreloadProgress] = useState<ProgressInfo | null>(null);
  
  // Laad AI model in de achtergrond wel/niet gebaseerd op popup keuze 
  const handlePreload = async () => {
    setShowPreloadOffer(false);
    setPreloadStatus('loading');
    setPreloadProgress(null);
    try {
      await promptGeneratorService.preload(t, setPreloadProgress);
      setPreloadStatus('ready');
      setPreloadProgress(null);
    } catch {
      setPreloadStatus('error');
      setPreloadProgress(null);
    }
  };

  const dismissPreloadOffer = () => {
    setShowPreloadOffer(false);
    setPreloadOfferDismissed(true);
  };

  useEffect(function showPreloadDialog() {
    if (isAvailable && preloadStatus === 'idle' && !preloadOfferDismissed) {
      const timer = setTimeout(() => setShowPreloadOffer(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isAvailable, preloadStatus, preloadOfferDismissed]);

  return (
    <>
      {/* Titel */}
      <div className="article">
        <h1>{t('home_title')}</h1>
        
        {/* Introductie */}
        <section className="article-text">
          <p>{t('home_intro_1')}</p>
          <p>{t('home_intro_2')}</p>
        </section>

        {/* Uitleg AI */}
        <h2>{t('home_practice_title')}</h2>
        <section className="article-text">
          <p>{t('home_practice_1')}</p>
          <p>{t('home_practice_2')}</p>
        </section>

        {/* Voorbeelden van AI applicaties */}
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

        {/* Goed/Slecht AI gebruik */}
        <h2>{t('home_pitfalls_title')}</h2>
        <section className="article-text">
          <p>{t('home_pitfalls_1')}</p>
          <p>{t('home_pitfalls_2')}</p>
        </section>

        {/* Goed/Slecht AI gebruik voorbeelden */}
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

        {/* Socratisch methode */}
        <h2>{t('home_socratic_title')}</h2>
        <section className="article-text">
          <p>{t('home_socratic_1')}</p>
          <p>{t('home_socratic_2')}</p>
          <p>{t('home_socratic_3')}</p>
        </section>

        {/* Conclusie en CTA */}
        <h2>{t('home_action_title')}</h2>
        <section className="article-text">
          <p>{t('home_action_1')}</p>
          <p>{t('home_action_2')}</p>
        </section>

        {/* Knop naar survey */}
        <div className="button-container">
          <button className="socratic-button" onClick={() => navigate('/survey')} aria-label={t('home_cta_aria_v2')}>
            {t('home_cta')}
          </button>

          {/* Model laad UI */}
          {preloadStatus === 'loading' && (
            <div className="preload-status" role="status" aria-live="polite"
                 title={preloadProgress?.isDownloading ? t('home_preload_tooltip') : undefined}>
              <div className="preload-spinner" aria-hidden="true"></div>
              <div className="preload-progress-area">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${preloadProgress?.percentage ?? 0}%` }}></div>
                </div>
                {preloadProgress?.isDownloading && (
                  <span className="loading-eta">{t('home_preload_eta')}</span>
                )}
                <span className="preload-text">
                  {formatProgressText(preloadProgress, t, 'home_preload_loading')}
                </span>
              </div>
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

      {/* Preload popup */}
      <Dialog
        isOpen={showPreloadOffer}
        onClose={dismissPreloadOffer}
        title={t('home_preload_dialog_title')}
        titleId="preload-dialog-title"
        actions={
          <>
            <button className="dialog-btn secondary" onClick={dismissPreloadOffer}>
              {t('home_preload_dialog_dismiss')}
            </button>
            <button className="dialog-btn primary" onClick={handlePreload}>
              {t('home_preload_dialog_confirm')}
            </button>
          </>
        }
      >
        <p>{t('home_preload_dialog_body')}</p>
      </Dialog>
    </>
  );
};

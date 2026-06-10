/**
 * Home: hoofdpagina met waarschuwing over AI-gebruik in het onderwijs en CTA naar de vragenlijst.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGPUStatus } from '../../hooks';
import { useServices } from '../../contexts/useServices';
import { Dialog } from '../Dialog/Dialog';
import { formatProgressText } from '../../utils/progress';
import { safeSessionStorage, STORAGE_KEYS } from '../../utils/storage';
import type { GenerationEvent, PreloadStatus, ProgressInfo } from '../../types';
import './Home.css';

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const gpuStatus = useGPUStatus();
  const { isAvailable } = gpuStatus;
  const { promptGeneratorService } = useServices();
  const [showCTADialog, setShowCTADialog] = useState(false);
  const [preloadOfferDismissed, setPreloadOfferDismissed] = useState(false);
  const [preloadStatus, setPreloadStatus] = useState<PreloadStatus>(() => promptGeneratorService.getPreloadStatus());
  const [preloadProgress, setPreloadProgress] = useState<ProgressInfo | null>(null);
  const infoLinkRef = useRef<HTMLAnchorElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const isPreloadBannerVisible = isAvailable === true;
  const isPreloadBannerMinimized = preloadOfferDismissed && preloadStatus === 'idle';

  useEffect(() => {
    if ((location.state as { scrollToInfoLink?: boolean } | null)?.scrollToInfoLink) {
      infoLinkRef.current?.scrollIntoView({ block: 'center' });
      window.history.replaceState({ ...window.history.state, usr: null }, '');
    }
  }, [location.state]);

  useEffect(() => {
    const handler = (event: GenerationEvent) => {
      if (event.type !== 'progress') return;
      const status = promptGeneratorService.getPreloadStatus();
      if (status === 'idle') return;
      setPreloadStatus(status);
      setPreloadProgress(status === 'loading' ? event.info : null);
    };
    promptGeneratorService.subscribe(handler);
    return () => promptGeneratorService.unsubscribe(handler);
  }, [promptGeneratorService]);

  // Laad AI model in de achtergrond met banner keuze
  const handlePreload = async () => {
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
    setPreloadOfferDismissed(true);
  };

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      {/* Titel */}
      <div className="article">
        <h1>{t('home_title')}</h1>
        {isPreloadBannerVisible && (
          <section className={`preload-banner ${isPreloadBannerMinimized ? 'minimized' : ''}`} aria-label={t('home_preload_dialog_title')}>
            {isPreloadBannerMinimized ? (
              <button className="preload-banner-compact" type="button" onClick={() => setPreloadOfferDismissed(false)}>
                <span>{t('home_preload_dialog_title')}</span>
                <span>{t('home_preload_banner_expand')}</span>
              </button>
            ) : (
              <>
                <div className="preload-banner-content">
                  <div>
                    <h2 className="preload-banner-title">{t('home_preload_dialog_title')}</h2>
                    {preloadStatus === 'idle' && <p>{t('home_preload_dialog_body')}</p>}
                    {preloadStatus === 'loading' && <p>{t('home_preload_banner_progress')}</p>}
                    {preloadStatus === 'ready' && <p>{t('home_preload_ready')}</p>}
                    {preloadStatus === 'error' && <p>{t('home_preload_error')}</p>}
                  </div>
                  {preloadStatus === 'idle' && (
                    <div className="preload-banner-actions">
                      <button className="dialog-btn secondary" type="button" onClick={dismissPreloadOffer}>
                        {t('home_preload_dialog_dismiss')}
                      </button>
                      <button className="dialog-btn primary" type="button" onClick={handlePreload}>
                        {t('home_preload_dialog_confirm')}
                      </button>
                    </div>
                  )}
                </div>

              </>
            )}
          </section>
        )}

        {/* Introductie */}
        <section className="article-text">
          <p>{t('home_intro_1')}</p>
          <p>{t('home_intro_2')}</p>
          <p>
            <button className="info-link cta-scroll-link" type="button" onClick={scrollToCTA}>
              {t('home_skip_to_cta')}
            </button>
          </p>
        </section>

        {/* AI Dangers */}
        <h2>{t('home_dangers_title')}</h2>
        <section className="article-text">
          <p>{t('home_dangers_1')}</p>
          <p>{t('home_dangers_1_ex')}</p>
          <p>{t('home_dangers_2')}</p>
          <p>{t('home_dangers_3')}</p>
          <p>{t('home_dangers_learning')}</p>
          <p>{t('home_dangers_privacy')}</p>
          <p>
            <Link ref={infoLinkRef} to="/info" className="info-link">
              {t('home_dangers_info_link')}
            </Link>
          </p>
        </section>

        {/* Goed/Slecht AI gebruik */}
        <h2>{t('home_pitfalls_title')}</h2>
        <section className="article-text">
          <p>{t('home_pitfalls_intro')}</p>
          <p>{t('home_pitfalls_1')}</p>
          <p>{t('home_pitfalls_3')}</p>
          <p>{t('home_pitfalls_2')}</p>
        </section>

        {/* Goed/Slecht AI gebruik voorbeelden */}
        <section className="pitfalls-grid" aria-label={t('home_pitfalls_title')}>
          <div className="pitfall-box bad">
            <h3>{t('pitfall_trust_title')}</h3>
            <p>{t('pitfall_trust_desc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('pitfall_tool_title')}</h3>
            <p>{t('pitfall_tool_desc')}</p>
          </div>
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
          <button
            ref={ctaRef}
            className="socratic-button"
            onClick={() => {
              if (preloadStatus !== 'idle') {
                safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'true');
                navigate('/survey', { state: { gpuAvailable: true } });
              } else if (isAvailable === false) {
                safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'false');
                navigate('/survey', { state: { gpuAvailable: false } });
              } else {
                setShowCTADialog(true);
              }
            }}
            aria-label={t('home_cta_aria_v2')}
          >
            {t('home_cta')}
          </button>
          {preloadStatus === 'loading' && (
            <div className="preload-status" role="status" aria-live="polite">
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

      {/* Popup voor AI-model/fallback generatie keuze */}
      <Dialog
        isOpen={showCTADialog}
        onClose={() => setShowCTADialog(false)}
        title={t('home_cta_dialog_title')}
        titleId="cta-dialog-title"
        actions={
          <button className="dialog-btn secondary" onClick={() => setShowCTADialog(false)}>
            {t('provider_dialog_cancel')}
          </button>
        }
      >
        <p>{t('home_cta_dialog_body')}</p>
        <div className="cta-performance-tip">
          <strong>{t('home_cta_performance_tip_title')}</strong>
          <p>{t('home_cta_performance_tip_body')}</p>
        </div>
        <div className="cta-choice-options">
          <button
            className="cta-choice-btn ai"
            onClick={() => {
              safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'true');
              navigate('/survey', { state: { gpuAvailable: true } });
            }}
          >
            <span className="cta-choice-label">{t('home_cta_dialog_ai')}</span>
            <span className="cta-choice-desc">{t('home_cta_dialog_ai_desc')}</span>
          </button>
          <button
            className="cta-choice-btn fallback"
            onClick={() => {
              safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'false');
              navigate('/survey', { state: { gpuAvailable: false } });
            }}
          >
            <span className="cta-choice-label">{t('home_cta_dialog_fallback')}</span>
            <span className="cta-choice-desc">{t('home_cta_dialog_fallback_desc')}</span>
          </button>
        </div>
      </Dialog>

    </>
  );
};

/**
 * Home: hoofdpagina met waarschuwing over AI-gebruik in het onderwijs en CTA naar de vragenlijst.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useModelStatus } from '../../hooks';
import { useServices } from '../../contexts/useServices';
import { useStorage } from '../../contexts/useStorage';
import { Dialog } from '../Dialog/Dialog';
import { formatProgressText } from '../../utils/progress';
import { STORAGE_KEYS } from '../../services/StorageService';
import type { GenerationEvent, PreloadStatus, ProgressInfo } from '../../types';
import './Home.css';

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const modelStatus = useModelStatus();
  const { canUseModel } = modelStatus;
  const { promptGeneratorService } = useServices();
  const storage = useStorage();
  const [showCTADialog, setShowCTADialog] = useState(false);
  const [preloadOfferDismissed, setPreloadOfferDismissed] = useState(false);
  const [preloadStatus, setPreloadStatus] = useState<PreloadStatus>(() => promptGeneratorService.getPreloadStatus());
  const [preloadProgress, setPreloadProgress] = useState<ProgressInfo | null>(null);
  const infoLinkRef = useRef<HTMLAnchorElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const isPreloadBannerVisible = canUseModel === true;
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
      await promptGeneratorService.preloadModel(setPreloadProgress);
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
        <h1>{t('home.title')}</h1>
        {isPreloadBannerVisible && (
          <section className={`preload-banner ${isPreloadBannerMinimized ? 'minimized' : ''}`} aria-label={t('model.preloadDialogTitle')}>
            {isPreloadBannerMinimized ? (
              <button className="preload-banner-compact" type="button" onClick={() => setPreloadOfferDismissed(false)}>
                <span>{t('model.preloadDialogTitle')}</span>
                <span>{t('model.preloadBannerExpand')}</span>
              </button>
            ) : (
              <>
                <div className="preload-banner-content">
                  <div>
                    <h2 className="preload-banner-title">{t('model.preloadDialogTitle')}</h2>
                    {preloadStatus === 'idle' && <p>{t('model.preloadDialogBody')}</p>}
                    {preloadStatus === 'loading' && <p>{t('model.preloadBannerProgress')}</p>}
                    {preloadStatus === 'ready' && <p>{t('model.preloadReady')}</p>}
                    {preloadStatus === 'error' && <p>{t('model.preloadError')}</p>}
                  </div>
                  {preloadStatus === 'idle' && (
                    <div className="preload-banner-actions">
                      <button className="dialog-btn secondary" type="button" onClick={dismissPreloadOffer}>
                        {t('model.preloadDialogDismiss')}
                      </button>
                      <button className="dialog-btn primary" type="button" onClick={handlePreload}>
                        {t('model.preloadDialogConfirm')}
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
          <p>{t('home.intro')}</p>
          <p>{t('home.introRisk')}</p>
          <p>
            <button className="info-link cta-scroll-link" type="button" onClick={scrollToCTA}>
              {t('home.skipToCta')}
            </button>
          </p>
        </section>

        {/* AI Dangers */}
        <h2>{t('home.dangersTitle')}</h2>
        <section className="article-text">
          <p>{t('home.hallucinations')}</p>
          <p>{t('home.hallucinationExample')}</p>
          <p>{t('home.knowledgeCutoff')}</p>
          <p>{t('home.bias')}</p>
          <p>{t('home.learningRisk')}</p>
          <p>{t('home.privacyRisk')}</p>
          <p>
            <Link ref={infoLinkRef} to="/info" className="info-link">
              {t('home.infoLink')}
            </Link>
          </p>
        </section>

        {/* Goed/Slecht AI gebruik */}
        <h2>{t('home.helpTitle')}</h2>
        <section className="article-text">
          <p>{t('home.helpIntro')}</p>
          <p>{t('home.learningPartner')}</p>
          <p>{t('home.criticalUse')}</p>
          <p>{t('home.goodUseDifference')}</p>
        </section>

        {/* Goed/Slecht AI gebruik voorbeelden */}
        <section className="pitfalls-grid" aria-label={t('home.helpTitle')}>
          <div className="pitfall-box bad">
            <h3>{t('home.pitfallTrustTitle')}</h3>
            <p>{t('home.pitfallTrustDesc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('home.pitfallToolTitle')}</h3>
            <p>{t('home.pitfallToolDesc')}</p>
          </div>
          <div className="pitfall-box bad">
            <h3>{t('home.pitfallNoCheckTitle')}</h3>
            <p>{t('home.pitfallNoCheckDesc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('home.pitfallCriticalTitle')}</h3>
            <p>{t('home.pitfallCriticalDesc')}</p>
          </div>
          <div className="pitfall-box bad">
            <h3>{t('home.pitfallPrivacyBadTitle')}</h3>
            <p>{t('home.pitfallPrivacyBadDesc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('home.pitfallPrivacyGoodTitle')}</h3>
            <p>{t('home.pitfallPrivacyGoodDesc')}</p>
          </div>
        </section>

        {/* Socratisch methode */}
        <h2>{t('home.socraticTitle')}</h2>
        <section className="article-text">
          <p>{t('home.socraticIntro')}</p>
          <p>{t('home.socraticOrigin')}</p>
          <p>{t('home.socraticOutcome')}</p>
        </section>

        {/* Conclusie en CTA */}
        <h2>{t('home.actionTitle')}</h2>
        <section className="article-text">
          <p>{t('home.actionIntro')}</p>
          <p>{t('home.actionPrivacy')}</p>
        </section>

        {/* Knop naar survey */}
        <div className="button-container">
          <button
            ref={ctaRef}
            className="socratic-button"
            onClick={() => {
              if (preloadStatus !== 'idle') {
                storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'true');
                navigate('/survey', { state: { canUseModel: true } });
              } else if (canUseModel === false) {
                storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'false');
                navigate('/survey', { state: { canUseModel: false } });
              } else {
                setShowCTADialog(true);
              }
            }}
            aria-label={t('home.ctaLabel')}
          >
            {t('home.cta')}
          </button>
          {preloadStatus === 'loading' && (
            <div className="preload-status" role="status" aria-live="polite">
              <div className="preload-spinner" aria-hidden="true"></div>
              <div className="preload-progress-area">
                <progress className="progress preload" value={preloadProgress?.percentage ?? 0} max={100} />
                {preloadProgress?.isDownloading && (
                  <span className="loading-eta">{t('model.preloadEta')}</span>
                )}
                <span className="preload-text">
                  {formatProgressText(preloadProgress, t, 'model.preloadLoading')}
                </span>
              </div>
            </div>
          )}
          {preloadStatus === 'ready' && (
            <div className="preload-status ready" role="status" aria-live="polite">
              <span className="preload-text">{t('model.preloadReady')}</span>
            </div>
          )}
          {preloadStatus === 'error' && (
            <div className="preload-status error" role="status" aria-live="polite">
              <span className="preload-text">{t('model.preloadError')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Popup voor AI-model/fallback generatie keuze */}
      <Dialog
        isOpen={showCTADialog}
        onClose={() => setShowCTADialog(false)}
        title={t('dialogs.generationTitle')}
        titleId="cta-dialog-title"
        actions={
          <button className="dialog-btn secondary" onClick={() => setShowCTADialog(false)}>
            {t('common.cancel')}
          </button>
        }
      >
        <p>{t('dialogs.generationBody')}</p>
        <div className="cta-performance-tip">
          <strong>{t('dialogs.generationPerformanceTipTitle')}</strong>
          <p>{t('dialogs.generationPerformanceTipBody')}</p>
        </div>
        <div className="cta-choice-options">
          <button
            className="cta-choice-btn ai"
            onClick={() => {
              storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'true');
              navigate('/survey', { state: { canUseModel: true } });
            }}
          >
            <span className="cta-choice-label">{t('dialogs.generationAi')}</span>
            <span className="cta-choice-desc">{t('dialogs.generationAiDescription')}</span>
          </button>
          <button
            className="cta-choice-btn fallback"
            onClick={() => {
              storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'false');
              navigate('/survey', { state: { canUseModel: false } });
            }}
          >
            <span className="cta-choice-label">{t('dialogs.generationFallback')}</span>
            <span className="cta-choice-desc">{t('dialogs.generationFallbackDescription')}</span>
          </button>
        </div>
      </Dialog>

    </>
  );
};
